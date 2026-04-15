import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { DeviceState, SSEEvent } from '../types'

interface DeviceStore {
  devices: Record<string, DeviceState>
  hsmStatus: string
  currentMode: string
  hubVariables: Record<string, string | number>
  pendingCommands: Set<string>
  connectionStatus: 'connected' | 'reconnecting' | 'polling'
  sidebarOpen: boolean

  setAllDevices: (devices: DeviceState[]) => void
  applyEvent: (event: SSEEvent) => void
  setHubVariables: (vars: Record<string, string | number>) => void
  setPending: (deviceId: string, pending: boolean) => void
  setConnectionStatus: (status: 'connected' | 'reconnecting' | 'polling') => void
  setSidebarOpen: (open: boolean) => void
}

export const useDeviceStore = create<DeviceStore>()(
  devtools(
    (set) => ({
      devices: {},
      hsmStatus: 'unknown',
      currentMode: 'Day',
      hubVariables: {},
      pendingCommands: new Set(),
      connectionStatus: 'reconnecting',
      sidebarOpen: false,

      setAllDevices: (devices) =>
        set(() => ({
          devices: Object.fromEntries(devices.map((d) => [d.id, d])),
        })),

      applyEvent: (event) =>
        set((state) => {
          if (event.deviceId === 'hsm') {
            return { hsmStatus: String(event.value) }
          }
          if (event.deviceId === 'mode') {
            return { currentMode: String(event.value) }
          }
          const existing = state.devices[event.deviceId]
          if (!existing) return {}
          return {
            devices: {
              ...state.devices,
              [event.deviceId]: {
                ...existing,
                attributes: {
                  ...existing.attributes,
                  [event.attribute]: event.value,
                },
              },
            },
          }
        }),

      setHubVariables: (vars) => set(() => ({ hubVariables: vars })),

      setPending: (deviceId, pending) =>
        set((state) => {
          const next = new Set(state.pendingCommands)
          if (pending) {
            next.add(deviceId)
          } else {
            next.delete(deviceId)
          }
          return { pendingCommands: next }
        }),

      setConnectionStatus: (status) => set(() => ({ connectionStatus: status })),

      setSidebarOpen: (open) => set(() => ({ sidebarOpen: open })),
    }),
    { name: 'hubitat-dashboard' }
  )
)

// Selector hooks
export const useDevice = (id: string) =>
  useDeviceStore((s) => s.devices[id])

export const useDeviceAttribute = (id: string, attr: string) =>
  useDeviceStore((s) => s.devices[id]?.attributes[attr])

const normalizeLabel = (s: string) => s.replace(/\s+/g, '').toLowerCase()

export const useDeviceIdByLabel = (label: string) =>
  useDeviceStore((s) => {
    const normalized = normalizeLabel(label)
    const entry = Object.values(s.devices).find(
      (d) => d.label === label || normalizeLabel(d.label) === normalized
    )
    return entry?.id ?? ''
  })

export const useHsmStatus = () => useDeviceStore((s) => s.hsmStatus)

export const useCurrentMode = () => useDeviceStore((s) => s.currentMode)

export const useHubVariable = (name: string) =>
  useDeviceStore((s) => s.hubVariables[name])

export const useIsPending = (id: string) =>
  useDeviceStore((s) => s.pendingCommands.has(id))

export const useConnectionStatus = () => useDeviceStore((s) => s.connectionStatus)

export const useSidebarOpen = () => useDeviceStore((s) => s.sidebarOpen)
