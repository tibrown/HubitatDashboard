import { useDeviceStore } from '../store/deviceStore'
import { showToast } from '../utils/toast'

interface CommandOptions {
  deviceId: string
  command: string
  value?: string
  optimisticAttribute?: string
  optimisticValue?: string | number | boolean | null
}

export function useCommand(): [(opts: CommandOptions) => Promise<void>, (id: string) => boolean] {
  const applyEvent = useDeviceStore((s) => s.applyEvent)
  const setPending = useDeviceStore((s) => s.setPending)

  const execute = async (opts: CommandOptions): Promise<void> => {
    const { deviceId, command, value, optimisticAttribute, optimisticValue } = opts

    // Snapshot current attribute value for revert
    const snapshot = useDeviceStore.getState().devices[deviceId]?.attributes[optimisticAttribute ?? '']

    // Optimistic update
    if (optimisticAttribute !== undefined) {
      applyEvent({
        deviceId,
        attribute: optimisticAttribute,
        value: optimisticValue ?? null,
        timestamp: Date.now(),
      })
    }

    setPending(deviceId, true)

    try {
      const url = value !== undefined
        ? `/api/devices/${deviceId}/${command}/${encodeURIComponent(value)}`
        : `/api/devices/${deviceId}/${command}`

      const res = await fetch(url, { method: 'PUT' })

      if (!res.ok) {
        throw new Error(`Command failed: ${res.status}`)
      }
    } catch (err) {
      // Revert optimistic update
      if (optimisticAttribute !== undefined) {
        applyEvent({
          deviceId,
          attribute: optimisticAttribute,
          value: snapshot ?? null,
          timestamp: Date.now(),
        })
      }
      showToast(err instanceof Error ? err.message : 'Command failed', 'error')
    } finally {
      setPending(deviceId, false)
    }
  }

  const isPending = (id: string) => useDeviceStore.getState().pendingCommands.has(id)

  return [execute, isPending]
}
