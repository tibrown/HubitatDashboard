import { useState } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const idleRefreshMinutes = useSettingsStore((s) => s.idleRefreshMinutes)
  const setIdleRefreshMinutes = useSettingsStore((s) => s.setIdleRefreshMinutes)

  const [draft, setDraft] = useState(String(idleRefreshMinutes))

  function handleSave() {
    const parsed = parseInt(draft, 10)
    const value = isNaN(parsed) || parsed < 0 ? 0 : parsed
    setIdleRefreshMinutes(value)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-80 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">App Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              <RefreshCw size={13} />
              Idle Auto-Refresh
            </label>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
              Reload the page after this many minutes of inactivity. Set to 0 to disable.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={120}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-20 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">minutes</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
