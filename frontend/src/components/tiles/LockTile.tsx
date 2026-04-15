import { useState } from 'react'
import { Lock, Unlock, Loader2 } from 'lucide-react'
import { useDeviceAttribute, useIsPending } from '../../store/deviceStore'
import { PinModal } from '../PinModal'
import { showToast } from '../../utils/toast'

interface Props { deviceId: string; label: string }

export function LockTile({ deviceId, label }: Props) {
  const lockState = useDeviceAttribute(deviceId, 'lock')
  const isPending = useIsPending(deviceId)
  const [pinOpen, setPinOpen] = useState(false)
  const [pendingCommand, setPendingCommand] = useState<'lock' | 'unlock' | null>(null)

  const handleAction = (cmd: 'lock' | 'unlock') => {
    setPendingCommand(cmd)
    setPinOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setPinOpen(false)
    if (!pendingCommand) return
    try {
      const res = await fetch(`/api/devices/${deviceId}/${pendingCommand}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      if (!res.ok) throw new Error(res.status === 403 ? 'Invalid PIN' : 'Command failed')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lock command failed', 'error')
    }
    setPendingCommand(null)
  }

  const isLocked = lockState === 'locked'

  return (
    <div className={`rounded-xl border p-4 shadow-sm bg-white dark:bg-gray-800 ${isLocked ? 'border-green-400' : 'border-red-400'}`}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate mb-3">{label}</p>
      <div className={`flex items-center gap-2 mb-3 ${isLocked ? 'text-green-500' : 'text-red-500'}`}>
        {isLocked ? <Lock size={22} /> : <Unlock size={22} />}
        <span className="font-semibold">{lockState === undefined ? '—' : isLocked ? 'Locked' : 'Unlocked'}</span>
        {isPending && <Loader2 size={14} className="animate-spin text-gray-400" />}
      </div>
      <div className="flex gap-2">
        <button onClick={() => handleAction('lock')} disabled={isPending}
          className="flex-1 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 active:scale-95 transition-all disabled:opacity-50">
          Lock
        </button>
        <button onClick={() => handleAction('unlock')} disabled={isPending}
          className="flex-1 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50">
          Unlock
        </button>
      </div>
      <PinModal isOpen={pinOpen} title={pendingCommand === 'lock' ? 'Lock Door' : 'Unlock Door'}
        onConfirm={handlePinConfirm} onCancel={() => { setPinOpen(false); setPendingCommand(null) }} />
    </div>
  )
}
