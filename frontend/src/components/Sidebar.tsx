import { useState, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { Sun, Circle, X, ChevronUp, ChevronDown, Plus, Download, Upload } from 'lucide-react'
import { useConnectionStatus, useSidebarOpen, useDeviceStore } from '../store/deviceStore'
import { useGroupStore } from '../store/groupStore'
import type { GroupExportPayload } from '../store/groupStore'
import { groups as staticGroupConfigs } from '../config/groups'
import { ICON_MAP } from '../utils/iconMap'
import { CreateGroupModal } from './CreateGroupModal'
import { toggleDarkMode } from '../utils/darkMode'

const STATIC_NAME_MAP: Record<string, string> = Object.fromEntries(
  staticGroupConfigs.map((g) => [g.id, g.displayName]),
)

const statusColors: Record<string, string> = {
  connected:    'text-green-500',
  reconnecting: 'text-amber-500',
  polling:      'text-blue-400',
}

export function Sidebar() {
  const connectionStatus = useConnectionStatus()
  const sidebarOpen = useSidebarOpen()
  const setSidebarOpen = useDeviceStore((s) => s.setSidebarOpen)
  const [showModal, setShowModal] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [pendingImport, setPendingImport] = useState<GroupExportPayload | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const groupOrder     = useGroupStore((s) => s.groupOrder)
  const customGroups   = useGroupStore((s) => s.customGroups)
  const groupAdditions = useGroupStore((s) => s.groupAdditions)
  const groupExclusions = useGroupStore((s) => s.groupExclusions)
  const childGroupOrder = useGroupStore((s) => s.childGroupOrder)
  const tileTypeOverrides = useGroupStore((s) => s.tileTypeOverrides)
  const tileOrder       = useGroupStore((s) => s.tileOrder)
  const moveGroupUp    = useGroupStore((s) => s.moveGroupUp)
  const moveGroupDown  = useGroupStore((s) => s.moveGroupDown)
  const addCustomGroup = useGroupStore((s) => s.addCustomGroup)
  const importState    = useGroupStore((s) => s.importState)

  const handleExport = () => {
    const payload: GroupExportPayload = {
      version: 1,
      customGroups,
      groupAdditions,
      groupExclusions,
      groupOrder,
      childGroupOrder,
      tileTypeOverrides,
      tileOrder,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hubitat-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as GroupExportPayload
        setPendingImport(data)
        setShowImportConfirm(true)
      } catch { /* ignore parse error */ }
    }
    reader.readAsText(file)
    e.target.value = '' // reset so same file can be re-imported
  }

  // Build ordered nav items from groupOrder (top-level only — sub-groups excluded)
  const subGroupIds = new Set(customGroups.filter((g) => g.parentId).map((g) => g.id))
  const navItems = groupOrder.filter((id) => !subGroupIds.has(id)).map((id) => {
    const staticName = STATIC_NAME_MAP[id]
    if (staticName) {
      const iconName = staticGroupConfigs.find((g) => g.id === id)?.icon ?? 'LayoutGrid'
      const Icon = ICON_MAP[iconName] ?? ICON_MAP['LayoutGrid']
      return { id, name: staticName, Icon, isCustom: false }
    }
    const custom = customGroups.find((g) => g.id === id)
    if (custom) {
      const Icon = ICON_MAP[custom.iconName] ?? ICON_MAP['Home']
      return { id, name: custom.displayName, Icon, isCustom: true }
    }
    return null
  }).filter((item): item is NonNullable<typeof item> => item !== null)

  const handleCreate = (name: string, iconName: string) => {
    addCustomGroup({
      id: `custom-${Date.now()}`,
      displayName: name,
      iconName,
    })
    setShowModal(false)
  }

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
          {navItems.map(({ id, name, Icon }, idx) => (
            <div key={id} className="group/nav-row flex items-stretch">
              <NavLink
                to={`/group/${id}`}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex flex-1 items-center gap-3 pl-4 pr-2 py-2.5 text-sm transition-colors min-w-0 ${
                    isActive
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Icon size={16} className="flex-shrink-0" />
                <span className="truncate">{name}</span>
              </NavLink>

              {/* Reorder buttons — always visible on mobile, hover-only on desktop */}
              <div className="flex flex-col justify-center px-0.5 flex sm:hidden sm:group-hover/nav-row:flex">
                <button
                  onClick={() => moveGroupUp(id)}
                  disabled={idx === 0}
                  className="p-0.5 text-gray-600 hover:text-gray-200 disabled:opacity-20 transition-colors"
                  aria-label={`Move ${name} up`}
                >
                  <ChevronUp size={11} />
                </button>
                <button
                  onClick={() => moveGroupDown(id)}
                  disabled={idx === navItems.length - 1}
                  className="p-0.5 text-gray-600 hover:text-gray-200 disabled:opacity-20 transition-colors"
                  aria-label={`Move ${name} down`}
                >
                  <ChevronDown size={11} />
                </button>
              </div>
            </div>
          ))}

          {/* New Group button */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors mt-1 border-t border-gray-800"
          >
            <Plus size={16} />
            <span>New Group</span>
          </button>
        </nav>

        <div className="px-4 py-3 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
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
          <div className="flex gap-1">
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"
              title="Export group config to JSON"
            >
              <Download size={12} /> Export
            </button>
            <button
              onClick={() => importInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"
              title="Import group config from JSON"
            >
              <Upload size={12} /> Import
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </div>
      </aside>

      {showModal && (
        <CreateGroupModal
          onClose={() => setShowModal(false)}
          onConfirm={handleCreate}
        />
      )}

      {showImportConfirm && pendingImport && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">Replace Config?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will replace all group and tile configuration with the imported data. Continue?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowImportConfirm(false); setPendingImport(null) }}
                className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  importState(pendingImport)
                  setShowImportConfirm(false)
                  setPendingImport(null)
                }}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
