import { useState, useEffect } from 'react'
import { Clock, Loader2 } from 'lucide-react'
import { useCurrentMode, useDeviceStore } from '../../store/deviceStore'
import { showToast } from '../../utils/toast'
import { useCollapsed } from '../../hooks/useCollapsed'
import { CollapsibleCard } from './CollapsibleCard'

interface HubMode { id: string; name: string; active: boolean }

export function ModeTile() {
  const currentMode = useCurrentMode()
  const applyEvent = useDeviceStore((s) => s.applyEvent)
  const [modes, setModes] = useState<HubMode[]>([])
  const [loading, setLoading] = useState(false)
  const [collapsed, toggleCollapsed] = useCollapsed('mode-tile')

  useEffect(() => {
    fetch('/api/modes')
      .then(r => r.ok ? r.json() : [])
      .then((data: HubMode[]) => setModes(data))
      .catch(() => {})
  }, [])

  const handleModeSelect = async (mode: HubMode) => {
    setLoading(true)
    applyEvent({ deviceId: 'mode', attribute: 'mode', value: mode.name, timestamp: Date.now() })
    try {
      const res = await fetch(`/api/modes/${mode.id}`, { method: 'PUT' })
      if (!res.ok) {
        applyEvent({ deviceId: 'mode', attribute: 'mode', value: currentMode, timestamp: Date.now() })
        throw new Error('Mode change failed')
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Mode error', 'error')
    } finally {
      setLoading(false)
    }
  }

  const header = (
    <div className="flex items-center gap-2 min-w-0">
      <Clock size={14} className="text-gray-400 flex-shrink-0" />
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">Hub Mode</p>
      <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{currentMode}</span>
      {loading && <Loader2 size={12} className="animate-spin text-gray-400 flex-shrink-0" />}
    </div>
  )

  return (
    <>
      <CollapsibleCard
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        header={header}
        className="col-span-2"
      >
        <div className="grid grid-cols-3 gap-1.5">
          {modes.map((mode) => (
            <button key={mode.id} onClick={() => handleModeSelect(mode)} disabled={loading}
              className={`py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 disabled:opacity-50 ${
                mode.name === currentMode
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}>
              {mode.name}
            </button>
          ))}
        </div>
      </CollapsibleCard>
    </>
  )
}

