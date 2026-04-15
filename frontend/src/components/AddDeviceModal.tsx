import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { useDeviceStore } from '../store/deviceStore'
import { useGroupStore } from '../store/groupStore'
import { autoTileType } from '../utils/autoTileType'

interface Props {
  groupId: string
  /** Device IDs already rendered in this group — excluded from the picker. */
  currentDeviceIds: Set<string>
  onClose: () => void
}

export function AddDeviceModal({ groupId, currentDeviceIds, onClose }: Props) {
  const [query, setQuery] = useState('')
  const devices          = useDeviceStore((s) => s.devices)
  const addDeviceToGroup = useGroupStore((s) => s.addDeviceToGroup)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return Object.values(devices)
      .filter((d) => !currentDeviceIds.has(d.id))
      .filter((d) => !q || d.label.toLowerCase().includes(q) || d.type.toLowerCase().includes(q))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [devices, currentDeviceIds, query])

  const handleAdd = (deviceId: string) => {
    addDeviceToGroup(groupId, deviceId)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[75vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Add Device</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${Object.keys(devices).length} devices…`}
              autoFocus
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Device list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              {query ? 'No devices match your search.' : 'All devices are already in this group.'}
            </p>
          ) : (
            filtered.map((device) => {
              const tileType = autoTileType(device)
              return (
                <button
                  key={device.id}
                  onClick={() => handleAdd(device.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                >
                  <span className="flex-1 font-medium truncate">{device.label}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 font-mono">
                    {tileType}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {filtered.length > 0 && (
          <div className="px-5 py-2 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              {filtered.length} device{filtered.length !== 1 ? 's' : ''} available
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
