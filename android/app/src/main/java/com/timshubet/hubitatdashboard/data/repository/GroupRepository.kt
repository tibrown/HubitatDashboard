package com.timshubet.hubitatdashboard.data.repository

import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.timshubet.hubitatdashboard.data.model.CustomGroupData
import com.timshubet.hubitatdashboard.data.model.GroupConfig
import com.timshubet.hubitatdashboard.data.model.TileConfig
import com.timshubet.hubitatdashboard.data.model.TileType
import com.timshubet.hubitatdashboard.data.model.groups
import com.timshubet.hubitatdashboard.ui.edit.autoTileType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject
import javax.inject.Named
import javax.inject.Singleton

@Singleton
class GroupRepository @Inject constructor(
    @Named("group") private val prefs: SharedPreferences,
    private val deviceRepository: DeviceRepository,
    private val gson: Gson
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    companion object {
        private const val KEY_CUSTOM_GROUPS = "custom_groups"
        private const val KEY_GROUP_ADDITIONS = "group_additions"
        private const val KEY_GROUP_EXCLUSIONS = "group_exclusions"
        private const val KEY_GROUP_ORDER = "group_order"
        private const val KEY_TILE_TYPE_OVERRIDES = "tile_type_overrides"
        private const val KEY_TILE_ORDER = "tile_order"
        private const val KEY_CHILD_GROUP_ORDER = "child_group_order"
    }

    private val _customGroups = MutableStateFlow(loadCustomGroups())
    private val _groupAdditions = MutableStateFlow(loadStringListMap(KEY_GROUP_ADDITIONS))
    private val _groupExclusions = MutableStateFlow(loadStringListMap(KEY_GROUP_EXCLUSIONS))
    private val _groupOrder = MutableStateFlow(loadStringList(KEY_GROUP_ORDER))
    private val _tileTypeOverrides = MutableStateFlow(loadTileTypeOverrides())
    private val _tileOrder = MutableStateFlow(loadStringListMap(KEY_TILE_ORDER))
    private val _childGroupOrder = MutableStateFlow(loadStringListMap(KEY_CHILD_GROUP_ORDER))

    val customGroups: StateFlow<List<CustomGroupData>> = _customGroups.asStateFlow()
    val groupOrder: StateFlow<List<String>> = _groupOrder.asStateFlow()

    // Raw snapshot accessors for export
    val customGroupsRaw: List<CustomGroupData> get() = _customGroups.value
    val groupAdditionsRaw: Map<String, List<String>> get() = _groupAdditions.value
    val groupExclusionsRaw: Map<String, List<String>> get() = _groupExclusions.value
    val groupOrderRaw: List<String> get() = _groupOrder.value
    val childGroupOrderRaw: Map<String, List<String>> get() = _childGroupOrder.value
    val tileTypeOverridesRaw: Map<String, TileType> get() = _tileTypeOverrides.value
    val tileOrderRaw: Map<String, List<String>> get() = _tileOrder.value

    val resolvedGroupsFlow: StateFlow<List<GroupConfig>> =
        _customGroups
            .combine(_groupAdditions) { _, _ -> }
            .combine(_groupExclusions) { _, _ -> }
            .combine(_groupOrder) { _, _ -> }
            .combine(_tileTypeOverrides) { _, _ -> }
            .combine(_tileOrder) { _, _ -> }
            .combine(_childGroupOrder) { _, _ -> }
            .combine(deviceRepository.devices) { _, _ -> }
            .map { resolveGroupsNow() }
            .stateIn(scope, SharingStarted.Eagerly, resolveGroupsNow())

    fun addCustomGroup(data: CustomGroupData) {
        _customGroups.value = _customGroups.value + data
        if (data.parentId == null) {
            val currentOrder = _groupOrder.value.ifEmpty {
                groups.map { it.id }
            }
            _groupOrder.value = currentOrder + data.id
        } else {
            val current = _childGroupOrder.value.toMutableMap()
            current[data.parentId] = (current[data.parentId] ?: emptyList()) + data.id
            _childGroupOrder.value = current
        }
        saveAll()
    }

    fun removeCustomGroup(id: String) {
        val current = _customGroups.value
        val toRemove = mutableSetOf<String>()
        fun collectDescendants(groupId: String) {
            toRemove.add(groupId)
            current.filter { it.parentId == groupId }.forEach { collectDescendants(it.id) }
        }
        collectDescendants(id)

        _customGroups.value = current.filter { it.id !in toRemove }
        _groupOrder.value = _groupOrder.value.filter { it !in toRemove }

        val newChildOrder = _childGroupOrder.value.toMutableMap()
        toRemove.forEach { newChildOrder.remove(it) }
        for (key in newChildOrder.keys.toList()) {
            newChildOrder[key] = newChildOrder[key]!!.filter { it !in toRemove }
        }
        _childGroupOrder.value = newChildOrder

        val newAdditions = _groupAdditions.value.toMutableMap()
        toRemove.forEach { newAdditions.remove(it) }
        _groupAdditions.value = newAdditions

        saveAll()
    }

    fun addDeviceToGroup(groupId: String, deviceId: String) {
        val current = _groupAdditions.value.toMutableMap()
        val existing = current[groupId] ?: emptyList()
        if (deviceId !in existing) {
            current[groupId] = existing + deviceId
            _groupAdditions.value = current
            saveAll()
        }
    }

    fun removeDeviceFromGroup(groupId: String, deviceId: String) {
        val current = _groupAdditions.value.toMutableMap()
        current[groupId] = (current[groupId] ?: emptyList()) - deviceId
        _groupAdditions.value = current

        val excl = _groupExclusions.value.toMutableMap()
        excl[groupId] = (excl[groupId] ?: emptyList()) + deviceId
        _groupExclusions.value = excl

        saveAll()
    }

    fun moveGroupUp(id: String) {
        val order = _groupOrder.value.toMutableList()
        val idx = order.indexOf(id)
        if (idx > 0) {
            order[idx] = order[idx - 1]
            order[idx - 1] = id
            _groupOrder.value = order
            saveAll()
        }
    }

    fun moveGroupDown(id: String) {
        val order = _groupOrder.value.toMutableList()
        val idx = order.indexOf(id)
        if (idx in 0 until order.lastIndex) {
            order[idx] = order[idx + 1]
            order[idx + 1] = id
            _groupOrder.value = order
            saveAll()
        }
    }

    fun moveChildGroupUp(parentId: String, childId: String) {
        val current = _childGroupOrder.value.toMutableMap()
        val existing = current[parentId]
            ?: _customGroups.value.filter { it.parentId == parentId }.map { it.id }
        val order = existing.toMutableList()
        val idx = order.indexOf(childId)
        if (idx > 0) {
            order[idx] = order[idx - 1]
            order[idx - 1] = childId
            current[parentId] = order
            _childGroupOrder.value = current
            saveAll()
        }
    }

    fun moveChildGroupDown(parentId: String, childId: String) {
        val current = _childGroupOrder.value.toMutableMap()
        val existing = current[parentId]
            ?: _customGroups.value.filter { it.parentId == parentId }.map { it.id }
        val order = existing.toMutableList()
        val idx = order.indexOf(childId)
        if (idx in 0 until order.lastIndex) {
            order[idx] = order[idx + 1]
            order[idx + 1] = childId
            current[parentId] = order
            _childGroupOrder.value = current
            saveAll()
        }
    }

    fun setTileOrder(groupId: String, orderedIds: List<String>) {
        val current = _tileOrder.value.toMutableMap()
        current[groupId] = orderedIds
        _tileOrder.value = current
        saveAll()
    }

    fun setTileTypeOverride(deviceId: String, tileType: TileType) {
        _tileTypeOverrides.value = _tileTypeOverrides.value + (deviceId to tileType)
        saveAll()
    }

    private fun resolveGroupsNow(): List<GroupConfig> {
        val customGroups = _customGroups.value
        val groupAdditions = _groupAdditions.value
        val groupExclusions = _groupExclusions.value
        val groupOrder = _groupOrder.value
        val tileTypeOverrides = _tileTypeOverrides.value
        val tileOrder = _tileOrder.value
        val childGroupOrder = _childGroupOrder.value
        val devices = deviceRepository.devices.value

        val resolvedMap = mutableMapOf<String, GroupConfig>()

        for (staticGroup in groups) {
            val exclusions = groupExclusions[staticGroup.id] ?: emptyList()
            val additions = groupAdditions[staticGroup.id] ?: emptyList()

            var tiles = staticGroup.tiles.filter { tile ->
                if (!tile.deviceId.isNullOrBlank()) tile.deviceId !in exclusions else true
            }
            tiles = tiles.map { tile ->
                val override = tile.deviceId?.let { tileTypeOverrides[it] }
                if (override != null) tile.copy(tileType = override) else tile
            }
            val addedTiles = additions.mapNotNull { deviceId ->
                buildTileConfig(deviceId, devices, tileTypeOverrides)
            }
            tiles = applyTileOrder(tiles + addedTiles, tileOrder[staticGroup.id])
            resolvedMap[staticGroup.id] = staticGroup.copy(tiles = tiles)
        }

        for (customGroup in customGroups) {
            val additions = groupAdditions[customGroup.id] ?: emptyList()
            val tiles = applyTileOrder(
                additions.mapNotNull { deviceId ->
                    buildTileConfig(deviceId, devices, tileTypeOverrides)
                },
                tileOrder[customGroup.id]
            )
            resolvedMap[customGroup.id] = GroupConfig(
                id = customGroup.id,
                displayName = customGroup.displayName,
                iconName = customGroup.iconName,
                tiles = tiles
            )
        }

        val topLevelStaticIds = groups.map { it.id }
        val topLevelCustomIds = customGroups.filter { it.parentId == null }.map { it.id }
        val allTopLevelIds = (topLevelStaticIds + topLevelCustomIds).distinct()

        val orderedTopLevel = if (groupOrder.isEmpty()) {
            allTopLevelIds
        } else {
            val ordered = groupOrder.toMutableList()
            allTopLevelIds.filter { it !in ordered }.forEach { ordered.add(it) }
            ordered
        }

        val result = mutableListOf<GroupConfig>()
        for (id in orderedTopLevel) {
            resolvedMap[id]?.let { group ->
                result.add(group)
                val childIds = childGroupOrder[id]
                    ?: customGroups.filter { it.parentId == id }.map { it.id }
                for (childId in childIds) {
                    resolvedMap[childId]?.let { result.add(it) }
                }
            }
        }
        return result
    }

    private fun buildTileConfig(
        deviceId: String,
        devices: Map<String, com.timshubet.hubitatdashboard.data.model.DeviceState>,
        tileTypeOverrides: Map<String, TileType>
    ): TileConfig? {
        return when (deviceId) {
            "__hsm__"      -> TileConfig(deviceId = null, label = "Security System", tileType = TileType.HSM)
            "__mode__"     -> TileConfig(deviceId = null, label = "Hub Mode",         tileType = TileType.MODE)
            "__sunrise__"  -> TileConfig(deviceId = null, label = "Sunrise",          tileType = TileType.HUB_VARIABLE, hubVarName = "Sunrise")
            "__sunset__"   -> TileConfig(deviceId = null, label = "Sunset",           tileType = TileType.HUB_VARIABLE, hubVarName = "Sunset")
            else -> {
                val device = devices[deviceId]
                val tileType = tileTypeOverrides[deviceId]
                    ?: if (device != null) autoTileType(device) else TileType.SWITCH
                val label = device?.label ?: deviceId
                TileConfig(deviceId = deviceId, label = label, tileType = tileType)
            }
        }
    }

    private fun applyTileOrder(tiles: List<TileConfig>, order: List<String>?): List<TileConfig> {
        if (order.isNullOrEmpty()) return tiles
        val tileMap = tiles.associateBy { it.deviceId ?: it.tileType.name }
        val ordered = order.mapNotNull { tileMap[it] }
        val remaining = tiles.filter { (it.deviceId ?: it.tileType.name) !in order }
        return ordered + remaining
    }

    /**
     * Atomically replaces all persisted group configuration.
     * Static group IDs already present in [groupOrder] are preserved
     * when absent from the import (they are appended after import order).
     */
    fun replaceAll(
        customGroups: List<CustomGroupData>,
        groupAdditions: Map<String, List<String>>,
        groupExclusions: Map<String, List<String>>,
        groupOrder: List<String>,
        childGroupOrder: Map<String, List<String>>,
        tileTypeOverrides: Map<String, TileType>,
        tileOrder: Map<String, List<String>>
    ) {
        // Preserve static group IDs not present in the imported order
        val staticIds = groups.map { it.id }
        val mergedOrder = groupOrder.toMutableList()
        staticIds.filter { it !in mergedOrder }.forEach { mergedOrder.add(it) }

        _customGroups.value = customGroups
        _groupAdditions.value = groupAdditions
        _groupExclusions.value = groupExclusions
        _groupOrder.value = mergedOrder
        _childGroupOrder.value = childGroupOrder
        _tileTypeOverrides.value = tileTypeOverrides
        _tileOrder.value = tileOrder
        saveAll()
    }

    private fun saveAll() {
        prefs.edit()
            .putString(KEY_CUSTOM_GROUPS, gson.toJson(_customGroups.value))
            .putString(KEY_GROUP_ADDITIONS, gson.toJson(_groupAdditions.value))
            .putString(KEY_GROUP_EXCLUSIONS, gson.toJson(_groupExclusions.value))
            .putString(KEY_GROUP_ORDER, gson.toJson(_groupOrder.value))
            .putString(KEY_TILE_TYPE_OVERRIDES, gson.toJson(_tileTypeOverrides.value.mapValues { it.value.name }))
            .putString(KEY_TILE_ORDER, gson.toJson(_tileOrder.value))
            .putString(KEY_CHILD_GROUP_ORDER, gson.toJson(_childGroupOrder.value))
            .apply()
    }

    private fun loadCustomGroups(): List<CustomGroupData> {
        val json = prefs.getString(KEY_CUSTOM_GROUPS, null) ?: return emptyList()
        return try {
            gson.fromJson(json, object : TypeToken<List<CustomGroupData>>() {}.type)
        } catch (e: Exception) { emptyList() }
    }

    private fun loadStringListMap(key: String): Map<String, List<String>> {
        val json = prefs.getString(key, null) ?: return emptyMap()
        return try {
            gson.fromJson(json, object : TypeToken<Map<String, List<String>>>() {}.type)
        } catch (e: Exception) { emptyMap() }
    }

    private fun loadStringList(key: String): List<String> {
        val json = prefs.getString(key, null) ?: return emptyList()
        return try {
            gson.fromJson(json, object : TypeToken<List<String>>() {}.type)
        } catch (e: Exception) { emptyList() }
    }

    private fun loadTileTypeOverrides(): Map<String, TileType> {
        val json = prefs.getString(KEY_TILE_TYPE_OVERRIDES, null) ?: return emptyMap()
        return try {
            val raw: Map<String, String> = gson.fromJson(json, object : TypeToken<Map<String, String>>() {}.type)
            raw.mapNotNull { (k, v) ->
                try { k to TileType.valueOf(v) } catch (e: Exception) { null }
            }.toMap()
        } catch (e: Exception) { emptyMap() }
    }
}
