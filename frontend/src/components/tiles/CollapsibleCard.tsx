import { ChevronDown } from 'lucide-react'

interface Props {
  collapsed: boolean
  onToggle: () => void
  /** Always-visible row: label, status badge, primary toggle, etc. */
  header: React.ReactNode
  /** Controls shown only when expanded. */
  children: React.ReactNode
  borderClass?: string
  className?: string
}

/** Card wrapper that collapses its body. The header is always visible. */
export function CollapsibleCard({
  collapsed,
  onToggle,
  header,
  children,
  borderClass = 'border-gray-200 dark:border-gray-700',
  className = '',
}: Props) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm bg-white dark:bg-gray-800 ${borderClass} ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">{header}</div>
        <button
          onClick={onToggle}
          className="flex-shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          />
        </button>
      </div>
      {!collapsed && <div className="mt-3">{children}</div>}
    </div>
  )
}
