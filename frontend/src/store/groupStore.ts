import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { groups as staticGroups } from '../config/groups'

export interface CustomGroup {
  id: string
  displayName: string
  iconName: string
}

interface GroupStore {
  customGroups: CustomGroup[]
  /** Extra device IDs added to a group beyond its static assignment.
   *  For custom groups this is the sole source of members. */
  groupAdditions: Record<string, string[]>
  /** Device IDs explicitly removed from a static group. */
  groupExclusions: Record<string, string[]>
  /** Ordered list of ALL group IDs (static + custom). */
  groupOrder: string[]

  addCustomGroup: (group: CustomGroup) => void
  removeCustomGroup: (id: string) => void
  addDeviceToGroup: (groupId: string, deviceId: string) => void
  /** Returns false if deviceId would have no remaining group; removal is blocked. */
  removeDeviceFromGroup: (groupId: string, deviceId: string) => boolean
  moveGroupUp: (id: string) => void
  moveGroupDown: (id: string) => void
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

      addCustomGroup: (group) =>
        set((s) => ({
          customGroups: [...s.customGroups, group],
          groupOrder: [...s.groupOrder, group.id],
        })),

      removeCustomGroup: (id) =>
        set((s) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _removed, ...additions } = s.groupAdditions
          return {
            customGroups: s.customGroups.filter((g) => g.id !== id),
            groupOrder: s.groupOrder.filter((gId) => gId !== id),
            groupAdditions: additions,
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
