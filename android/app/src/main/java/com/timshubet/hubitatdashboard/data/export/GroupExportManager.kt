package com.timshubet.hubitatdashboard.data.export

import com.google.gson.GsonBuilder
import com.google.gson.annotations.SerializedName
import com.timshubet.hubitatdashboard.data.model.CustomGroupData
import com.timshubet.hubitatdashboard.data.model.TileType
import com.timshubet.hubitatdashboard.data.repository.GroupRepository
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Canonical JSON format for group config export/import.
 * Keys and TileType values match the web app's Zustand persisted store so
 * JSON files are exchangeable between web and Android without any conversion tool.
 */
data class GroupExportData(
    val version: Int = 1,
    @SerializedName("customGroups")    val customGroups: List<ExportCustomGroup> = emptyList(),
    @SerializedName("groupAdditions")  val groupAdditions: Map<String, List<String>> = emptyMap(),
    @SerializedName("groupExclusions") val groupExclusions: Map<String, List<String>> = emptyMap(),
    @SerializedName("groupOrder")      val groupOrder: List<String> = emptyList(),
    @SerializedName("childGroupOrder") val childGroupOrder: Map<String, List<String>> = emptyMap(),
    @SerializedName("tileTypeOverrides") val tileTypeOverrides: Map<String, String> = emptyMap(),
    @SerializedName("tileOrder")       val tileOrder: Map<String, List<String>> = emptyMap()
)

data class ExportCustomGroup(
    @SerializedName("id")          val id: String,
    @SerializedName("displayName") val displayName: String,
    @SerializedName("iconName")    val iconName: String,
    @SerializedName("parentId")    val parentId: String? = null
)

@Singleton
class GroupExportManager @Inject constructor(
    private val groupRepository: GroupRepository
) {

    private val gson = GsonBuilder().setPrettyPrinting().create()

    // ------------------------------------------------------------------
    // TileType mapping: Android UPPER_SNAKE ↔ web lowercase-kebab
    // ------------------------------------------------------------------

    private val toWebFormat = mapOf(
        TileType.SWITCH         to "switch",
        TileType.DIMMER         to "dimmer",
        TileType.RGBW           to "rgbw",
        TileType.CONTACT        to "contact",
        TileType.MOTION         to "motion",
        TileType.TEMPERATURE    to "temperature",
        TileType.POWER_METER    to "power-meter",
        TileType.BUTTON         to "button",
        TileType.LOCK           to "lock",
        TileType.CONNECTOR      to "connector",
        TileType.HUB_VARIABLE   to "hub-variable",
        TileType.HSM            to "hsm",
        TileType.MODE           to "mode",
        TileType.RING_DETECTION to "ring-detection",
        TileType.PRESENCE       to "presence",
        TileType.BATTERY        to "battery"
    )

    private val fromWebFormat: Map<String, TileType> = toWebFormat.entries
        .associate { (k, v) -> v to k }

    /** TileType → "power-meter" */
    fun toExportString(type: TileType): String = toWebFormat[type] ?: type.name.lowercase()

    /** "power-meter" → POWER_METER; falls back to uppercase matching for unknowns */
    fun fromExportString(value: String): TileType? =
        fromWebFormat[value] ?: runCatching { TileType.valueOf(value.uppercase()) }.getOrNull()

    // ------------------------------------------------------------------
    // Tile-order system IDs: "MODE","HSM" ↔ "mode","hsm"
    // ------------------------------------------------------------------

    private fun tileOrderIdToExport(id: String): String =
        TileType.entries.find { it.name == id }?.let { toExportString(it) } ?: id

    private fun tileOrderIdFromExport(id: String): String =
        fromWebFormat[id]?.name ?: id

    // ------------------------------------------------------------------
    // Export
    // ------------------------------------------------------------------

    fun buildExportJson(): String {
        val customGroups = groupRepository.customGroupsRaw.map {
            ExportCustomGroup(id = it.id, displayName = it.displayName,
                iconName = it.iconName, parentId = it.parentId)
        }
        val tileTypeOverrides = groupRepository.tileTypeOverridesRaw
            .mapValues { (_, v) -> toExportString(v) }
        val tileOrder = groupRepository.tileOrderRaw
            .mapValues { (_, ids) -> ids.map { tileOrderIdToExport(it) } }

        val data = GroupExportData(
            customGroups    = customGroups,
            groupAdditions  = groupRepository.groupAdditionsRaw,
            groupExclusions = groupRepository.groupExclusionsRaw,
            groupOrder      = groupRepository.groupOrderRaw,
            childGroupOrder = groupRepository.childGroupOrderRaw,
            tileTypeOverrides = tileTypeOverrides,
            tileOrder       = tileOrder
        )
        return gson.toJson(data)
    }

    // ------------------------------------------------------------------
    // Import
    // ------------------------------------------------------------------

    fun parseImportJson(json: String): Result<GroupExportData> = runCatching {
        val raw = gson.fromJson(json, GroupExportData::class.java)
            ?: error("Empty or null JSON")
        // Convert tileTypeOverrides values to web format strings (they already are, but validate)
        val safeOverrides = raw.tileTypeOverrides.filter { (_, v) ->
            fromExportString(v) != null
        }
        // Convert tileOrder IDs (already lowercase from web, but make consistent)
        val safeTileOrder = raw.tileOrder.mapValues { (_, ids) ->
            ids.map { tileOrderIdFromExport(tileOrderIdToExport(it)) }
        }
        raw.copy(tileTypeOverrides = safeOverrides, tileOrder = safeTileOrder)
    }

    fun importConfig(data: GroupExportData) {
        val androidCustomGroups = data.customGroups.map {
            CustomGroupData(id = it.id, displayName = it.displayName,
                iconName = it.iconName, parentId = it.parentId)
        }
        val androidTileTypeOverrides: Map<String, TileType> = data.tileTypeOverrides
            .mapNotNull { (k, v) -> fromExportString(v)?.let { k to it } }
            .toMap()
        val androidTileOrder = data.tileOrder.mapValues { (_, ids) ->
            ids.map { tileOrderIdFromExport(it) }
        }
        groupRepository.replaceAll(
            customGroups      = androidCustomGroups,
            groupAdditions    = data.groupAdditions,
            groupExclusions   = data.groupExclusions,
            groupOrder        = data.groupOrder,
            childGroupOrder   = data.childGroupOrder,
            tileTypeOverrides = androidTileTypeOverrides,
            tileOrder         = androidTileOrder
        )
    }
}
