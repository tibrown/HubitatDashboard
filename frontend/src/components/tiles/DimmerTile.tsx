import { useState, useRef, useCallback } from 'react'
import { Power, Loader2 } from 'lucide-react'
import { useDeviceAttribute, useIsPending } from '../../store/deviceStore'
import { useCommand } from '../../hooks/useCommand'

interface Props { deviceId: string; label: string }

export function DimmerTile({ deviceId, label }: Props) {
  const switchState = useDeviceAttribute(deviceId, 'switch')
  const levelAttr = useDeviceAttribute(deviceId, 'level')
  const isPending = useIsPending(deviceId)
  const [execute] = useCommand()
  const [localLevel, setLocalLevel] = useState<number | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentLevel = localLevel ?? (levelAttr !== undefined ? Number(levelAttr) : 0)

  const sendLevel = useCallback(
    (val: number) => {
      if (debounceTimer.current !== null) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        execute({ deviceId, command: 'setLevel', value: String(val) })
        setLocalLevel(null)
      }, 400)
    },
    [deviceId, execute]
  )

  const toggleSwitch = () => {
    const next = switchState === 'on' ? 'off' : 'on'
    execute({ deviceId, command: next, optimisticAttribute: 'switch', optimisticValue: next })
  }

  if (switchState === undefined) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 truncate mb-3">{label}</p>
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    )
  }

  const isOn = switchState === 'on'
  return (
    <div className={`rounded-xl border p-4 shadow-sm bg-white dark:bg-gray-800 ${isOn ? 'border-yellow-400' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <span className="text-xs text-gray-400">{currentLevel}%</span>
      </div>
      <button
        onClick={toggleSwitch}
        disabled={isPending}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm mb-3 transition-all active:scale-95 disabled:opacity-50 ${
          isOn ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
        <span>{isOn ? 'On' : 'Off'}</span>
      </button>
      <input
        type="range"
        min={0}
        max={100}
        value={currentLevel}
        onChange={(e) => {
          const val = Number(e.target.value)
          setLocalLevel(val)
          sendLevel(val)
        }}
        className="w-full accent-yellow-400"
        aria-label={`${label} brightness`}
      />
    </div>
  )
}
