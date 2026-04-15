import { NavLink } from 'react-router-dom'
import {
  Thermometer, Siren, Moon, Lightbulb, DoorOpen,
  PersonStanding, Shield, AlertTriangle, Camera,
  Bell, Star, Clock, Zap, Settings,
  Sun, Circle, X
} from 'lucide-react'
import { useConnectionStatus, useSidebarOpen, useDeviceStore } from '../store/deviceStore'
import { toggleDarkMode } from '../utils/darkMode'

const groups = [
  { id: 'environment',     name: 'Environment',       Icon: Thermometer },
  { id: 'security-alarm',  name: 'Security Alarm',    Icon: Siren },
  { id: 'night-security',  name: 'Night Security',    Icon: Moon },
  { id: 'lights',          name: 'Lights',            Icon: Lightbulb },
  { id: 'doors-windows',   name: 'Doors & Windows',   Icon: DoorOpen },
  { id: 'presence-motion', name: 'Presence & Motion', Icon: PersonStanding },
  { id: 'perimeter',       name: 'Perimeter',         Icon: Shield },
  { id: 'emergency',       name: 'Emergency',         Icon: AlertTriangle },
  { id: 'cameras',         name: 'Cameras',           Icon: Camera },
  { id: 'ring-detections', name: 'Ring Detections',   Icon: Bell },
  { id: 'seasonal',        name: 'Seasonal',          Icon: Star },
  { id: 'hub-mode',        name: 'Hub Mode',          Icon: Clock },
  { id: 'power-monitor',   name: 'Power Monitor',     Icon: Zap },
  { id: 'system',          name: 'System',            Icon: Settings },
]

const statusColors: Record<string, string> = {
  connected:    'text-green-500',
  reconnecting: 'text-amber-500',
  polling:      'text-blue-400',
}

export function Sidebar() {
  const connectionStatus = useConnectionStatus()
  const sidebarOpen = useSidebarOpen()
  const setSidebarOpen = useDeviceStore((s) => s.setSidebarOpen)

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed sm:relative inset-y-0 left-0 z-30
        w-56 flex-shrink-0
        bg-gray-900 text-gray-100
        flex flex-col
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
      `}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
          <div>
            <h1 className="text-sm font-bold tracking-wide uppercase text-gray-400">Hubitat</h1>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>
          <button
            className="sm:hidden p-1 rounded text-gray-500 hover:text-gray-300"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {groups.map(({ id, name, Icon }) => (
            <NavLink
              key={id}
              to={`/group/${id}`}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Circle size={8} className={statusColors[connectionStatus] ?? 'text-gray-500'} fill="currentColor" />
            <span className="text-xs text-gray-500 capitalize">{connectionStatus}</span>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            aria-label="Toggle dark mode"
          >
            <Sun size={16} />
          </button>
        </div>
      </aside>
    </>
  )
}
