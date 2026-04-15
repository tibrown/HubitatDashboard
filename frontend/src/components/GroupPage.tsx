import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, X, Plus, ChevronDown, UserPlus, FolderPlus, ArrowLeft, ChevronRight, Sliders } from 'lucide-react'
import { groups as staticGroups } from '../config/groups'
import { useDeviceStore } from '../store/deviceStore'
import { useGroupStore } from '../store/groupStore'
import type { TileConfig, TileType } from '../types'
import { autoTileType, availableTileTypes, TILE_TYPE_LABELS } from '../utils/autoTileType'
import { showToast } from '../utils/toast'
import { AddDeviceModal } from './AddDeviceModal'
import { CreateGroupModal } from './CreateGroupModal'
import { ICON_MAP } from '../utils/iconMap'
import { EditModeContext } from '../context/EditModeContext'
import { SwitchTile } from './tiles/SwitchTile'
import { DimmerTile } from './tiles/DimmerTile'
import { RGBWTile } from './tiles/RGBWTile'
import { ContactTile } from './tiles/ContactTile'
import { MotionTile } from './tiles/MotionTile'
import { TemperatureTile } from './tiles/TemperatureTile'
import { PowerMeterTile } from './tiles/PowerMeterTile'
import { ButtonTile } from './tiles/ButtonTile'
import { LockTile } from './tiles/LockTile'
import { ConnectorSwitchTile } from './tiles/ConnectorSwitchTile'
import { HubVariableTile } from './tiles/HubVariableTile'
import { HSMTile } from './tiles/HSMTile'
import { ModeTile } from './tiles/ModeTile'
import { RingDetectionTile } from './tiles/RingDetectionTile'
import { PresenceTile } from './tiles/PresenceTile'
import { BatteryTile } from './tiles/BatteryTile'

interface Props {
  groupId: string
}

function useGridColumns() {
  const getColumns = () => {
    const w = window.innerWidth
    if (w >= 1280) return 5
    if (w >= 1024) return 4
    if (w >= 640) return 3
    return 2
  }
  const [cols, setCols] = useState(getColumns)
  useEffect(() => {
    const handler = () => setCols(getColumns())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return cols
}

const PINNED_TYPES = new Set(['hsm', 'mode'])

/** Returns { active, inactive } counts for a list of device IDs.
 *  Devices with no binary state (temperature, power, button, etc.) are excluded from both counts. */
function deviceStatusSummary(
  deviceIds: string[],
  devices: Record<string, import('../types').DeviceState>,
): { active: number; inactive: number } {
  let active = 0
  let inactive = 0
  for (const id of deviceIds) {
    const d = devices[id]
    if (!d) continue
    const a = d.attributes
    // Determine active state by the most specific available attribute
    if ('switch' in a)    { a.switch === 'on'         ? active++ : inactive++; continue }
    if ('contact' in a)   { a.contact === 'open'       ? active++ : inactive++; continue }
    if ('motion' in a)    { a.motion === 'active'      ? active++ : inactive++; continue }
    if ('presence' in a)  { a.presence === 'present'   ? active++ : inactive++; continue }
    if ('lock' in a)      { a.lock === 'unlocked'      ? active++ : inactive++; continue }
    // temperature, power, hub-variable, button, etc. — skip (no binary state)
  }
  return { active, inactive }
}

function sortColumnMajor(tiles: TileConfig[], numCols: number): (TileConfig | null)[] {
  const sorted = [...tiles].sort((a, b) => a.label.localeCompare(b.label))
  const N = sorted.length
  if (N === 0) return []
  const numRows = Math.ceil(N / numCols)
  const result: (TileConfig | null)[] = new Array(numRows * numCols).fill(null)
  for (let i = 0; i < N; i++) {
    const col = Math.floor(i / numRows)
    const row = i % numRows
    result[row * numCols + col] = sorted[i]
  }
  return result
}

function renderTile(tile: TileConfig) {
  const id = tile.deviceId ?? tile.tileType
  const base = { deviceId: tile.deviceId ?? '', label: tile.label }
  switch (tile.tileType) {
    case 'switch':         return <SwitchTile key={id} {...base} />
    case 'dimmer':         return <DimmerTile key={id} {...base} />
    case 'rgbw':           return <RGBWTile key={id} {...base} />
    case 'contact':        return <ContactTile key={id} {...base} />
    case 'motion':         return <MotionTile key={id} {...base} />
    case 'temperature':    return <TemperatureTile key={id} {...base} />
    case 'power-meter':    return <PowerMeterTile key={id} {...base} />
    case 'button':         return <ButtonTile key={id} {...base} />
    case 'lock':           return <LockTile key={id} {...base} />
    case 'connector':      return <ConnectorSwitchTile key={id} {...base} />
    case 'hub-variable':   return <HubVariableTile key={id} hubVarName={tile.hubVarName ?? ''} label={tile.label} />
    case 'hsm':            return <HSMTile key="hsm" />
    case 'mode':           return <ModeTile key="mode" />
    case 'ring-detection': return <RingDetectionTile key={id} deviceId={tile.deviceId ?? ''} label={tile.label} lrpHubVarName={tile.hubVarName ?? ''} />
    case 'presence':       return <PresenceTile key={id} {...base} />
    case 'battery':        return <BatteryTile key={id} {...base} />
    default:               return null
  }
}

/** Ordered list of {id, name} for all groups — used by the Add-to dropdown. */
function useAllGroupNames() {
  const groupOrder   = useGroupStore((s) => s.groupOrder)
  const customGroups = useGroupStore((s) => s.customGroups)
  const staticNameMap = useMemo(
    () => Object.fromEntries(staticGroups.map((g) => [g.id, g.displayName])),
    [],
  )
  return groupOrder.map((id) => {
    const sName = staticNameMap[id]
    if (sName) return { id, name: sName }
    const c = customGroups.find((g) => g.id === id)
    return { id, name: c?.displayName ?? id }
  })
}

/** Overlay shown over each tile in edit mode. */
function EditOverlay({
  tile,
  groupId,
  isOther,
}: {
  tile: TileConfig
  groupId: string
  isOther: boolean
}) {
  const [showGroupMenu, setShowGroupMenu] = useState(false)
  const [showTypeMenu, setShowTypeMenu]   = useState(false)
  const allNames             = useAllGroupNames()
  const addDeviceToGroup     = useGroupStore((s) => s.addDeviceToGroup)
  const removeFn             = useGroupStore((s) => s.removeDeviceFromGroup)
  const setTileTypeOverride  = useGroupStore((s) => s.setTileTypeOverride)
  const tileTypeOverrides    = useGroupStore((s) => s.tileTypeOverrides)
  const devices              = useDeviceStore((s) => s.devices)

  const deviceId = tile.deviceId
  if (!deviceId) return null // special tiles (hsm, mode) can't be moved

  const device        = devices[deviceId]
  const availTypes    = device ? availableTileTypes(device) : []
  const currentType   = tileTypeOverrides[deviceId] ?? tile.tileType
  const showTypePicker = availTypes.length > 1

  const canRemove = !isOther

  const handleRemove = () => {
    const ok = removeFn(groupId, deviceId)
    if (!ok) showToast('Cannot remove — device must belong to at least one group', 'error')
    else showToast('Removed from group')
  }

  const handleAddTo = (targetId: string, targetName: string) => {
    addDeviceToGroup(targetId, deviceId)
    showToast(`Added to ${targetName}`)
    setShowGroupMenu(false)
  }

  const handleSetType = (type: TileType) => {
    setTileTypeOverride(deviceId, type)
    showToast(`Tile type set to ${TILE_TYPE_LABELS[type] ?? type}`)
    setShowTypeMenu(false)
  }

  const available = allNames.filter((g) => g.id !== groupId && g.id !== 'other')

  return (
    <div className="absolute inset-0 rounded-xl bg-black/70 z-10 flex flex-col p-1.5 gap-1 overflow-hidden">
      {/* Device name — always pinned at top */}
      <p className="text-white font-semibold text-[11px] text-center leading-tight truncate flex-shrink-0">
        {tile.label}
      </p>
      {/* Action buttons — centered in remaining space */}
      <div className="flex gap-1 flex-wrap justify-center items-center flex-1">
        {canRemove && (
          <button
            onClick={handleRemove}
            className="flex items-center gap-0.5 px-1.5 py-1 text-[11px] bg-red-600 hover:bg-red-500 text-white rounded-md font-medium"
          >
            <X size={10} /> Remove
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => { setShowGroupMenu((v) => !v); setShowTypeMenu(false) }}
            className="flex items-center gap-0.5 px-1.5 py-1 text-[11px] bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium"
          >
            <Plus size={10} /> Add to <ChevronDown size={9} />
          </button>
          {showGroupMenu && (
            <div
              className="absolute bottom-full mb-1 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-50 min-w-[140px] max-h-48 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {available.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleAddTo(g.id, g.name)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                >
                  {g.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {showTypePicker && (
          <div className="relative">
            <button
              onClick={() => { setShowTypeMenu((v) => !v); setShowGroupMenu(false) }}
              className="flex items-center gap-0.5 px-1.5 py-1 text-[11px] bg-amber-600 hover:bg-amber-500 text-white rounded-md font-medium"
            >
              <Sliders size={10} /> Type <ChevronDown size={9} />
            </button>
            {showTypeMenu && (
              <div
                className="absolute bottom-full mb-1 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-50 min-w-[130px]"
                onClick={(e) => e.stopPropagation()}
              >
                {availTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleSetType(type)}
                    className={`w-full text-left px-3 py-2 text-sm first:rounded-t-lg last:rounded-b-lg flex items-center justify-between gap-2 ${
                      type === currentType
                        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {TILE_TYPE_LABELS[type] ?? type}
                    {type === currentType && <span className="text-amber-500 text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Header shared by all group pages. */
function GroupHeader({
  title,
  subtitle,
  editMode,
  onToggleEdit,
  onAddDevice,
  onAddSubGroup,
}: {
  title: string
  subtitle?: string
  editMode: boolean
  onToggleEdit: () => void
  onAddDevice?: () => void
  onAddSubGroup?: () => void
}) {
  return (
    <div className="flex items-start justify-between mb-4 gap-3">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {editMode && onAddSubGroup && (
          <button
            onClick={onAddSubGroup}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700"
          >
            <FolderPlus size={14} /> Sub-group
          </button>
        )}
        {editMode && onAddDevice && (
          <button
            onClick={onAddDevice}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
          >
            <UserPlus size={14} /> Add Device
          </button>
        )}
        <button
          onClick={onToggleEdit}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            editMode
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          aria-pressed={editMode}
        >
          <Pencil size={14} />
          {editMode ? 'Done' : 'Edit'}
        </button>
      </div>
    </div>
  )
}

/** Renders a single tile, wrapped in a relative container for edit overlays. */
function TileWrapper({
  tile,
  groupId,
  isOther,
  editMode,
}: {
  tile: TileConfig
  groupId: string
  isOther: boolean
  editMode: boolean
  index: number
}) {
  const tileTypeOverrides = useGroupStore((s) => s.tileTypeOverrides)
  // Apply per-device override here as a final guard — ensures the displayed
  // type is always current even if the tile config was built before the override.
  const effectiveTile: TileConfig =
    tile.deviceId && tileTypeOverrides[tile.deviceId]
      ? { ...tile, tileType: tileTypeOverrides[tile.deviceId] }
      : tile

  return (
    <div className="relative">
      {renderTile(effectiveTile)}
      {editMode && <EditOverlay tile={effectiveTile} groupId={groupId} isOther={isOther} />}
    </div>
  )
}

function OtherGroupPage() {
  const [editMode, setEditMode] = useState(false)
  const numCols         = useGridColumns()
  const devices         = useDeviceStore((s) => s.devices)
  const groupAdditions  = useGroupStore((s) => s.groupAdditions)
  const groupExclusions = useGroupStore((s) => s.groupExclusions)
  const tileTypeOverrides = useGroupStore((s) => s.tileTypeOverrides)

  const claimed = useMemo(() => {
    const set = new Set<string>()
    for (const g of staticGroups) {
      if (g.id === 'other') continue
      const excl = groupExclusions[g.id] ?? []
      for (const tile of g.tiles) {
        if (tile.deviceId && !excl.includes(tile.deviceId)) set.add(tile.deviceId)
      }
    }
    for (const ids of Object.values(groupAdditions)) {
      for (const id of ids) set.add(id)
    }
    return set
  }, [groupAdditions, groupExclusions])

  const unclaimedTiles: TileConfig[] = useMemo(
    () =>
      Object.values(devices)
        .filter((d) => !claimed.has(d.id))
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((d) => ({ deviceId: d.id, label: d.label, tileType: tileTypeOverrides[d.id] ?? autoTileType(d) })),
    [devices, claimed, tileTypeOverrides],
  )

  if (unclaimedTiles.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <GroupHeader
          title="Other"
          subtitle="All devices are assigned to groups."
          editMode={editMode}
          onToggleEdit={() => setEditMode((v) => !v)}
        />
      </div>
    )
  }

  const tilesOrNull = sortColumnMajor(unclaimedTiles, numCols)
  return (
    <EditModeContext.Provider value={editMode}>
    <div className="p-4 sm:p-6">
      <GroupHeader
        title="Other"
        subtitle={`${unclaimedTiles.length} device${unclaimedTiles.length !== 1 ? 's' : ''} not assigned to any group`}
        editMode={editMode}
        onToggleEdit={() => setEditMode((v) => !v)}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {tilesOrNull.map((tile, i) =>
          tile ? (
            <TileWrapper key={tile.deviceId ?? `tile-${i}`} tile={tile} groupId="other" isOther={true} editMode={editMode} index={i} />
          ) : (
            <div key={`empty-${i}`} aria-hidden="true" />
          ),
        )}
      </div>
    </div>
    </EditModeContext.Provider>
  )
}

function StaticGroupPage({ groupId }: Props) {
  const [editMode, setEditMode]         = useState(false)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const numCols           = useGridColumns()
  const devices           = useDeviceStore((s) => s.devices)
  const groupAdditions    = useGroupStore((s) => s.groupAdditions)
  const groupExclusions   = useGroupStore((s) => s.groupExclusions)
  const tileTypeOverrides = useGroupStore((s) => s.tileTypeOverrides)

  const staticGroup = staticGroups.find((g) => g.id === groupId)
  if (!staticGroup) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium">Group not found: <span className="font-mono">{groupId}</span></p>
      </div>
    )
  }

  const exclusions = groupExclusions[groupId] ?? []
  const baseTiles = staticGroup.tiles
    .filter((t) => !t.deviceId || !exclusions.includes(t.deviceId))
    .map((t) => t.deviceId && tileTypeOverrides[t.deviceId]
      ? { ...t, tileType: tileTypeOverrides[t.deviceId] }
      : t)
  const baseTileDeviceIds = new Set(baseTiles.map((t) => t.deviceId).filter(Boolean))
  const addedIds = groupAdditions[groupId] ?? []
  const addedTiles: TileConfig[] = addedIds
    .filter((id) => !baseTileDeviceIds.has(id))
    .flatMap((id) => {
      const device = devices[id]
      if (!device) return []
      return [{ deviceId: id, label: device.label, tileType: tileTypeOverrides[id] ?? autoTileType(device) } as TileConfig]
    })

  const resolvedTiles = [...baseTiles, ...addedTiles]
  const pinnedTiles   = resolvedTiles.filter((t) => PINNED_TYPES.has(t.tileType))
  const restTiles     = resolvedTiles.filter((t) => !PINNED_TYPES.has(t.tileType))
  const tilesOrNull   = sortColumnMajor(restTiles, numCols)

  const currentDeviceIds = new Set(
    resolvedTiles.map((t) => t.deviceId).filter((id): id is string => !!id),
  )

  return (
    <EditModeContext.Provider value={editMode}>
    <div className="p-4 sm:p-6">
      <GroupHeader
        title={staticGroup.displayName}
        editMode={editMode}
        onToggleEdit={() => setEditMode((v) => !v)}
        onAddDevice={() => setShowAddDevice(true)}
      />
      {pinnedTiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-3">
          {pinnedTiles.map((tile, i) => (
            <TileWrapper key={tile.deviceId ?? tile.tileType ?? `pinned-${i}`} tile={tile} groupId={groupId} isOther={false} editMode={editMode} index={i} />
          ))}
        </div>
      )}
      {tilesOrNull.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {tilesOrNull.map((tile, i) =>
            tile ? (
              <TileWrapper key={tile.deviceId ?? tile.tileType ?? `tile-${i}`} tile={tile} groupId={groupId} isOther={false} editMode={editMode} index={i} />
            ) : (
              <div key={`empty-${i}`} aria-hidden="true" />
            ),
          )}
        </div>
      )}
      {showAddDevice && (
        <AddDeviceModal
          groupId={groupId}
          currentDeviceIds={currentDeviceIds}
          onClose={() => setShowAddDevice(false)}
        />
      )}
    </div>
    </EditModeContext.Provider>
  )
}

function CustomGroupPage({ groupId }: Props) {
  const [editMode, setEditMode]             = useState(false)
  const [showAddDevice, setShowAddDevice]   = useState(false)
  const [showAddSubGroup, setShowAddSubGroup] = useState(false)
  const navigate = useNavigate()
  const numCols           = useGridColumns()
  const devices           = useDeviceStore((s) => s.devices)
  const customGroups      = useGroupStore((s) => s.customGroups)
  const groupAdditions    = useGroupStore((s) => s.groupAdditions)
  const childGroupOrder   = useGroupStore((s) => s.childGroupOrder)
  const tileTypeOverrides = useGroupStore((s) => s.tileTypeOverrides)
  const addCustomGroup    = useGroupStore((s) => s.addCustomGroup)
  const removeCustomGroup = useGroupStore((s) => s.removeCustomGroup)

  const customGroup = customGroups.find((g) => g.id === groupId)
  if (!customGroup) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium">Group not found: <span className="font-mono">{groupId}</span></p>
      </div>
    )
  }

  const parentGroup = customGroup.parentId
    ? customGroups.find((g) => g.id === customGroup.parentId)
    : undefined

  // Sub-groups of this group — always shown alphabetically
  const childIds = childGroupOrder[groupId] ?? []
  const childGroups = childIds
    .map((id) => customGroups.find((g) => g.id === id))
    .filter((g): g is NonNullable<typeof g> => !!g)
    .sort((a, b) => a.displayName.localeCompare(b.displayName))

  const addedIds = groupAdditions[groupId] ?? []
  const tiles: TileConfig[] = addedIds.flatMap((id) => {
    const device = devices[id]
    if (!device) return []
    return [{ deviceId: id, label: device.label, tileType: tileTypeOverrides[id] ?? autoTileType(device) } as TileConfig]
  })

  const currentDeviceIds = new Set(addedIds)
  const tilesOrNull = sortColumnMajor(tiles, numCols)

  const handleCreateSubGroup = (name: string, iconName: string) => {
    addCustomGroup(
      { id: `custom-${Date.now()}`, displayName: name, iconName, parentId: groupId },
      groupId,
    )
    setShowAddSubGroup(false)
    showToast(`Sub-group "${name}" created`)
  }

  const handleDeleteSubGroup = (childId: string, childName: string) => {
    removeCustomGroup(childId)
    showToast(`Removed "${childName}"`)
  }

  return (
    <EditModeContext.Provider value={editMode}>
    <div className="p-4 sm:p-6">
      {/* Breadcrumb when nested */}
      {parentGroup && (
        <button
          onClick={() => navigate(`/group/${parentGroup.id}`)}
          className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-3 transition-colors"
        >
          <ArrowLeft size={14} />
          {parentGroup.displayName}
        </button>
      )}

      <GroupHeader
        title={customGroup.displayName}
        subtitle={tiles.length === 0 && childGroups.length === 0
          ? 'Click Edit then Add Device or Add Sub-group to populate this group.'
          : undefined}
        editMode={editMode}
        onToggleEdit={() => setEditMode((v) => !v)}
        onAddDevice={() => setShowAddDevice(true)}
        onAddSubGroup={() => setShowAddSubGroup(true)}
      />

      {/* Sub-group cards */}
      {childGroups.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
            Sub-groups
          </p>
          <div className="flex flex-col gap-1">
            {childGroups.map((child) => {
              const Icon = ICON_MAP[child.iconName] ?? ICON_MAP['Home']
              const childTileIds = groupAdditions[child.id] ?? []
              const childTileCount = childTileIds.length
              const grandchildCount = (childGroupOrder[child.id] ?? []).length
              const { active, inactive } = deviceStatusSummary(childTileIds, devices)
              return (
                <div key={child.id} className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/group/${child.id}`)}
                    className="flex flex-1 items-center gap-3 px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors text-left"
                  >
                    <Icon size={16} className="flex-shrink-0 text-blue-500 dark:text-blue-400" />
                    <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {child.displayName}
                    </span>
                    <span className="flex items-center gap-2 text-xs flex-shrink-0">
                      {active > 0 && (
                        <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                          {active}
                        </span>
                      )}
                      {inactive > 0 && (
                        <span className="flex items-center gap-0.5 text-gray-400 dark:text-gray-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600 inline-block" />
                          {inactive}
                        </span>
                      )}
                      {childTileCount === 0 && grandchildCount === 0 && (
                        <span className="text-gray-400 dark:text-gray-500">empty</span>
                      )}
                      {grandchildCount > 0 && (
                        <span className="text-gray-400 dark:text-gray-500">
                          {grandchildCount} sub-group{grandchildCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </span>
                    <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                  </button>
                  {editMode && (
                    <button
                      onClick={() => handleDeleteSubGroup(child.id, child.displayName)}
                      className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                      aria-label={`Delete ${child.displayName}`}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Device tiles */}
      {tilesOrNull.length > 0 && (
        <>
          {childGroups.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
              Devices
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {tilesOrNull.map((tile, i) =>
              tile ? (
                <TileWrapper key={tile.deviceId ?? `tile-${i}`} tile={tile} groupId={groupId} isOther={false} editMode={editMode} index={i} />
              ) : (
                <div key={`empty-${i}`} aria-hidden="true" />
              ),
            )}
          </div>
        </>
      )}

      {showAddDevice && (
        <AddDeviceModal
          groupId={groupId}
          currentDeviceIds={currentDeviceIds}
          onClose={() => setShowAddDevice(false)}
        />
      )}
      {showAddSubGroup && (
        <CreateGroupModal
          title="New Sub-group"
          onClose={() => setShowAddSubGroup(false)}
          onConfirm={handleCreateSubGroup}
        />
      )}
    </div>
    </EditModeContext.Provider>
  )
}

export function GroupPage({ groupId }: Props) {
  if (groupId === 'other') return <OtherGroupPage />

  const isStatic = staticGroups.some((g) => g.id === groupId)
  if (isStatic) return <StaticGroupPage groupId={groupId} />
  return <CustomGroupPage groupId={groupId} />
}
