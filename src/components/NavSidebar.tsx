import { LayoutDashboard, Database, ShieldAlert, Bot, Wand2 } from 'lucide-react'
import clsx from 'clsx'
import type { Section } from '../types'

const NAV_ITEMS: { id: Section; icon: React.FC<{ className?: string }>; label: string }[] = [
  { id: 'overview',        icon: LayoutDashboard, label: 'Overview'       },
  { id: 'explorer',        icon: Database,        label: 'Data Explorer'  },
  { id: 'investigations',  icon: ShieldAlert,     label: 'Investigations' },
  { id: 'agents',          icon: Bot,             label: 'Agent Monitor'  },
  { id: 'rules',           icon: Wand2,           label: 'Rule Builder'   },
]

interface Props {
  section: Section
  onSelect: (s: Section) => void
}

export function NavSidebar({ section, onSelect }: Props) {
  return (
    <nav className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-3 gap-1 shrink-0">
      {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
        <div key={id} className="relative group">
          <button
            onClick={() => onSelect(id)}
            className={clsx(
              'flex items-center justify-center w-10 h-10 rounded-lg transition-all',
              section === id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            )}
            aria-label={label}
          >
            <Icon className="w-5 h-5" />
          </button>

          {/* Tooltip */}
          <div className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-gray-700">
              {label}
            </div>
          </div>
        </div>
      ))}
    </nav>
  )
}
