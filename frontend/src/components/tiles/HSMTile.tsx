import { useState } from 'react'
import { Shield, ShieldOff, Moon, Loader2 } from 'lucide-react'
import { useHsmStatus } from '../../store/deviceStore'
import { PinModal } from '../PinModal'
import { showToast } from '../../utils/toast'
import { useCollapsed } from '../../hooks/useCollapsed'
import { CollapsibleCard } from './CollapsibleCard'

const HSM_MODES = [
  { key: 'armAway', label: 'Arm Away' },
  { key: 'armHome', label: 'Arm Home' },
  { key: 'armNight', label: 'Arm Night' },
  { key: 'disarm', label: 'Disarm' },
] as const

function hsmColor(status: string): string {
  if (status === 'armedAway') return 'text-red-500'
  if (status === 'armedHome') return 'text-amber-500'
  if (status === 'armedNight') return 'text-blue-500'
  return 'text-green-500'
}

function hsmBorderColor(status: string): string {
  if (status === 'armedAway') return 'border-red-400'
  if (status === 'armedHome') return 'border-amber-400'
  if (status === 'armedNight') return 'border-blue-400'
  return 'border-green-400'
}

function HsmIcon({ status, size = 14 }: { status: string; size?: number }) {
  if (status === 'armedNight') return <Moon size={size} />
  if (status === 'disarmed' || status === 'allDisarmed') return <ShieldOff size={size} />
  return <Shield size={size} />
}

export function HSMTile() {
  const hsmStatus = useHsmStatus()
  const [pinOpen, setPinOpen] = useState(false)
  const [pendingMode, setPendingMode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [collapsed, toggleCollapsed] = useCollapsed('hsm-tile')

  const handleMode = (mode: string) => {
    setPendingMode(mode)
    setPinOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setPinOpen(false)
    if (!pendingMode) return
    setLoading(true)
    try {
      const res = await fetch(`/api/hsm/${pendingMode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      if (!res.ok) throw new Error(res.status === 403 ? 'Invalid PIN' : 'HSM command failed')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'HSM error', 'error')
    } finally {
      setLoading(false)
      setPendingMode(null)
    }
  }

  const color = hsmColor(hsmStatus)
  const border = hsmBorderColor(hsmStatus)

  const header = (
    <div className="flex items-center gap-2 min-w-0">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">Security</p>
      <div className={`flex items-center gap-1 flex-shrink-0 ${color}`}>
        <HsmIcon status={hsmStatus} />
        <span className="text-xs font-semibold capitalize">{hsmStatus.replace(/([A-Z])/g, ' $1').trim()}</span>
      </div>
      {loading && <Loader2 size={12} className="animate-spin text-gray-400" />}
    </div>
  )

  return (
    <>
      <CollapsibleCard
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        header={header}
        borderClass={border}
        className="col-span-2"
      >
        <div className="grid grid-cols-2 gap-1.5">
          {HSM_MODES.map(({ key, label }) => (
            <button key={key} onClick={() => handleMode(key)} disabled={loading}
              className="py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all disabled:opacity-50">
              {label}
            </button>
          ))}
        </div>
      </CollapsibleCard>
      <PinModal isOpen={pinOpen}
        title={HSM_MODES.find(m => m.key === pendingMode)?.label ?? 'Security'}
        onConfirm={handlePinConfirm}
        onCancel={() => { setPinOpen(false); setPendingMode(null) }} />
    </>
  )
}

