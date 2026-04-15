import { useDeviceAttribute, useDeviceIdByLabel } from '../../store/deviceStore'
import { useCommand } from '../../hooks/useCommand'

interface Props { deviceId: string; label: string }

function getBadgeColors(label: string, isOn: boolean): string {
  if (!isOn) return 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
  const l = label.toLowerCase()
  if (l.includes('alarm') || l.includes('alert') || l.includes('panic') || l.includes('trigger')) {
    return 'bg-red-500 text-white'
  }
  if (l.includes('silent') || l.includes('pause')) return 'bg-orange-400 text-white'
  if (l.includes('travel') || l.includes('away') || l.includes('pto')) return 'bg-blue-500 text-white'
  if (l.includes('holiday') || l.includes('christmas')) return 'bg-purple-500 text-white'
  return 'bg-green-500 text-white'
}

export function ConnectorSwitchTile({ deviceId: propDeviceId, label }: Props) {
  const resolvedByLabel = useDeviceIdByLabel(label)
  const deviceId = propDeviceId || resolvedByLabel
  const switchState = useDeviceAttribute(deviceId, 'switch')
  const [execute] = useCommand()

  const toggle = () => {
    const next = switchState === 'on' ? 'off' : 'on'
    execute({ deviceId, command: next, optimisticAttribute: 'switch', optimisticValue: next })
  }

  const isOn = switchState === 'on'
  const badgeClass = getBadgeColors(label, isOn)

  return (
    <button
      onClick={toggle}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all active:scale-95 text-left w-full ${badgeClass}`}
      aria-pressed={isOn}
      aria-label={`${label}: ${isOn ? 'on' : 'off'}`}
    >
      {label}
    </button>
  )
}
