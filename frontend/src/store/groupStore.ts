import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { groups as staticGroups } from '../config/groups'
import type { TileType } from '../types'

/** Canonical JSON shape shared with the Android app */
export interface GroupExportPayload {
  version: number
  customGroups: CustomGroup[]
  groupAdditions: Record<string, string[]>
  groupExclusions: Record<string, string[]>
  groupOrder: string[]
  childGroupOrder: Record<string, string[]>
  tileTypeOverrides: Record<string, string>
  tileOrder: Record<string, string[]>
}

export interface CustomGroup {
  id: string
  displayName: string
  iconName: string
  /** undefined = top-level group; set = nested sub-group of that parent */
  parentId?: string
}

interface GroupStore {
  customGroups: CustomGroup[]
  /** Extra device IDs added to a group beyond its static assignment.
   *  For custom groups this is the sole source of members. */
  groupAdditions: Record<string, string[]>
  /** Device IDs explicitly removed from a static group. */
  groupExclusions: Record<string, string[]>
  /** Ordered list of top-level group IDs (static + top-level custom). */
  groupOrder: string[]
  /** Ordered sub-group IDs per parent: childGroupOrder[parentId] = [childId, ...] */
  childGroupOrder: Record<string, string[]>
  /** Per-device tile type overrides — user-selected type takes precedence over autoTileType. */
  tileTypeOverrides: Record<string, TileType>
  /** Per-group custom tile order — maps groupId to ordered list of tile IDs (deviceId or tileType). */
  tileOrder: Record<string, string[]>

  addCustomGroup: (group: CustomGroup, parentId?: string) => void
  removeCustomGroup: (id: string) => void
  addDeviceToGroup: (groupId: string, deviceId: string) => void
  /** Returns false if deviceId would have no remaining group; removal is blocked. */
  removeDeviceFromGroup: (groupId: string, deviceId: string) => boolean
  /** Removes a synthetic tile ID (e.g. __sunrise__) from groupAdditions; no membership check. */
  removeFromGroupAdditions: (groupId: string, id: string) => void
  moveGroupUp: (id: string) => void
  moveGroupDown: (id: string) => void
  moveSubGroupUp: (parentId: string, id: string) => void
  moveSubGroupDown: (parentId: string, id: string) => void
  setTileTypeOverride: (deviceId: string, tileType: TileType) => void
  setTileOrder: (groupId: string, orderedIds: string[]) => void
  /** Replaces all dynamic config with imported data. Static group IDs are preserved in groupOrder. */
  importState: (data: GroupExportPayload) => void
}

const STATIC_GROUP_IDS = staticGroups.map((g) => g.id)

/** Static groups (excluding 'other') that contain this deviceId in their tiles array. */
function staticGroupsContaining(deviceId: string): string[] {
  return staticGroups
    .filter((g) => g.id !== 'other' && g.tiles.some((t) => t.deviceId === deviceId))
    .map((g) => g.id)
}

/** All groups a device currently appears in: static (minus exclusions) + additions. */
export function allGroupsForDevice(
  deviceId: string,
  state: Pick<GroupStore, 'groupAdditions' | 'groupExclusions'>,
): string[] {
  const { groupAdditions, groupExclusions } = state
  const staticIds = staticGroupsContaining(deviceId).filter(
    (gId) => !(groupExclusions[gId] ?? []).includes(deviceId),
  )
  const addedTo = Object.entries(groupAdditions)
    .filter(([, ids]) => ids.includes(deviceId))
    .map(([gId]) => gId)
  return [...new Set([...staticIds, ...addedTo])]
}

export const useGroupStore = create<GroupStore>()(
  persist(
    (set, get) => ({
      customGroups: [],
      groupAdditions: {},
      groupExclusions: {},
      groupOrder: STATIC_GROUP_IDS,
      childGroupOrder: {},
      tileTypeOverrides: {},
      tileOrder: {},

      addCustomGroup: (group, parentId) =>
        set((s) => {
          const groupWithParent = parentId ? { ...group, parentId } : group
          if (parentId) {
            const existing = s.childGroupOrder[parentId] ?? []
            return {
              customGroups: [...s.customGroups, groupWithParent],
              childGroupOrder: { ...s.childGroupOrder, [parentId]: [...existing, group.id] },
            }
          }
          return {
            customGroups: [...s.customGroups, groupWithParent],
            groupOrder: [...s.groupOrder, group.id],
          }
        }),

      removeCustomGroup: (id) =>
        set((s) => {
          // Collect this group and all its descendants
          const toRemove = new Set<string>()
          const collect = (gid: string) => {
            toRemove.add(gid)
            const children = s.childGroupOrder[gid] ?? []
            children.forEach(collect)
          }
          collect(id)

          // Remove from parent's childGroupOrder if it's a sub-group
          const group = s.customGroups.find((g) => g.id === id)
          const updatedChildGroupOrder = { ...s.childGroupOrder }
          if (group?.parentId) {
            updatedChildGroupOrder[group.parentId] = (updatedChildGroupOrder[group.parentId] ?? [])
              .filter((cid) => cid !== id)
          }
          // Also remove all removed groups from childGroupOrder
          for (const rid of toRemove) {
            delete updatedChildGroupOrder[rid]
          }

          const updatedAdditions = { ...s.groupAdditions }
          for (const rid of toRemove) delete updatedAdditions[rid]

          return {
            customGroups: s.customGroups.filter((g) => !toRemove.has(g.id)),
            groupOrder: s.groupOrder.filter((gId) => !toRemove.has(gId)),
            groupAdditions: updatedAdditions,
            childGroupOrder: updatedChildGroupOrder,
          }
        }),

      addDeviceToGroup: (groupId, deviceId) =>
        set((s) => {
          const current = s.groupAdditions[groupId] ?? []
          if (current.includes(deviceId)) return {}
          return {
            groupAdditions: { ...s.groupAdditions, [groupId]: [...current, deviceId] },
          }
        }),

      removeDeviceFromGroup: (groupId, deviceId) => {
        const state = get()
        const currentGroups = allGroupsForDevice(deviceId, state)
        if (currentGroups.length <= 1) return false

        const isCustom = state.customGroups.some((g) => g.id === groupId)
        if (isCustom) {
          set((s) => ({
            groupAdditions: {
              ...s.groupAdditions,
              [groupId]: (s.groupAdditions[groupId] ?? []).filter((id) => id !== deviceId),
            },
          }))
        } else {
          set((s) => ({
            groupExclusions: {
              ...s.groupExclusions,
              [groupId]: [...(s.groupExclusions[groupId] ?? []), deviceId],
            },
          }))
        }
        return true
      },

      removeFromGroupAdditions: (groupId, id) =>
        set((s) => ({
          groupAdditions: {
            ...s.groupAdditions,
            [groupId]: (s.groupAdditions[groupId] ?? []).filter((sid) => sid !== id),
          },
        })),

      moveGroupUp: (id) =>
        set((s) => {
          const order = [...s.groupOrder]
          const idx = order.indexOf(id)
          if (idx <= 0) return {}
          ;[order[idx - 1], order[idx]] = [order[idx], order[idx - 1]]
          return { groupOrder: order }
        }),

      moveGroupDown: (id) =>
        set((s) => {
          const order = [...s.groupOrder]
          const idx = order.indexOf(id)
          if (idx < 0 || idx >= order.length - 1) return {}
          ;[order[idx + 1], order[idx]] = [order[idx], order[idx + 1]]
          return { groupOrder: order }
        }),

      moveSubGroupUp: (parentId, id) =>
        set((s) => {
          const order = [...(s.childGroupOrder[parentId] ?? [])]
          const idx = order.indexOf(id)
          if (idx <= 0) return {}
          ;[order[idx - 1], order[idx]] = [order[idx], order[idx - 1]]
          return { childGroupOrder: { ...s.childGroupOrder, [parentId]: order } }
        }),

      moveSubGroupDown: (parentId, id) =>
        set((s) => {
          const order = [...(s.childGroupOrder[parentId] ?? [])]
          const idx = order.indexOf(id)
          if (idx < 0 || idx >= order.length - 1) return {}
          ;[order[idx + 1], order[idx]] = [order[idx], order[idx + 1]]
          return { childGroupOrder: { ...s.childGroupOrder, [parentId]: order } }
        }),

      setTileTypeOverride: (deviceId, tileType) =>
        set((s) => ({
          tileTypeOverrides: { ...s.tileTypeOverrides, [deviceId]: tileType },
        })),

      setTileOrder: (groupId, orderedIds) =>
        set((s) => ({ tileOrder: { ...s.tileOrder, [groupId]: orderedIds } })),

      importState: (data) =>
        set(() => {
          // Preserve static group IDs not present in the import
          const mergedOrder = [...data.groupOrder]
          for (const id of STATIC_GROUP_IDS) {
            if (!mergedOrder.includes(id)) mergedOrder.push(id)
          }
          return {
            customGroups:      data.customGroups,
            groupAdditions:    data.groupAdditions,
            groupExclusions:   data.groupExclusions,
            groupOrder:        mergedOrder,
            childGroupOrder:   data.childGroupOrder,
            tileTypeOverrides: data.tileTypeOverrides as Record<string, TileType>,
            tileOrder:         data.tileOrder,
          }
        }),
    }),
    {
      name: 'hubitat-group-store',
      merge: (persisted, current) => {
        const stored = persisted as Partial<GroupStore>
        const storedOrder = stored.groupOrder ?? []
        // Add any new static group IDs not yet in the stored order
        const merged = [...storedOrder]
        for (const id of STATIC_GROUP_IDS) {
          if (!merged.includes(id)) merged.push(id)
        }
        return { ...current, ...stored, groupOrder: merged }
      },
    },
  ),
)
