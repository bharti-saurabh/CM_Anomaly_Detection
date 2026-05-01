import { useState } from 'react'
import clsx from 'clsx'
import type { Signal, Severity, Product } from '../types'

const SEVERITY_DOT: Record<Severity, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
}

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-amber-400',
}

const PRODUCT_LABEL: Record<Product, string> = {
  treasury: 'Treasury',
  custody: 'Custody',
  wealth: 'Wealth',
}

const PRODUCT_CHIP: Record<Product, string> = {
  treasury: 'bg-blue-900/40 text-blue-300',
  custody: 'bg-violet-900/40 text-violet-300',
  wealth: 'bg-emerald-900/40 text-emerald-300',
}

type Filter = 'all' | Severity

interface Props {
  signals: Signal[]
  selectedId: string | null
  onSelect: (signal: Signal) => void
}

export function SignalFeed({ signals, selectedId, onSelect }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered =
    filter === 'all' ? signals : signals.filter(s => s.severity === filter)

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Med' },
  ]

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-slate-800">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Signal Feed
        </p>
        <div className="flex gap-1">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={clsx(
                'flex-1 py-1 text-xs font-semibold rounded-md transition-colors',
                filter === f.value
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-600 text-sm">
            No signals match filter
          </div>
        )}
        {filtered.map(signal => (
          <button
            key={signal.id}
            onClick={() => onSelect(signal)}
            className={clsx(
              'w-full text-left px-4 py-3.5 border-b border-slate-800 transition-all duration-150 group',
              selectedId === signal.id
                ? 'bg-slate-800 border-l-2 border-l-blue-500 pl-3.5'
                : 'hover:bg-slate-800/60 border-l-2 border-l-transparent'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={clsx(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    SEVERITY_DOT[signal.severity],
                    signal.severity === 'critical' && 'animate-pulse'
                  )}
                />
                <span
                  className={clsx(
                    'text-xs font-bold uppercase tracking-wider',
                    SEVERITY_LABEL[signal.severity]
                  )}
                >
                  {signal.severity}
                </span>
              </div>
              <span className="text-xs text-slate-600 font-mono">{signal.time}</span>
            </div>

            <p className="text-sm font-semibold text-slate-200 mb-1 leading-snug">
              {signal.title}
            </p>

            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-2">
              {signal.preview}
            </p>

            <div className="flex items-center justify-between">
              <span
                className={clsx(
                  'text-xs font-medium px-2 py-0.5 rounded',
                  PRODUCT_CHIP[signal.product]
                )}
              >
                {PRODUCT_LABEL[signal.product]}
              </span>
              {signal.amount && (
                <span className="text-xs font-mono font-semibold text-slate-300">
                  {signal.amount}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-slate-800">
        <p className="text-xs text-slate-600">
          {filtered.length} signal{filtered.length !== 1 ? 's' : ''} · Updated just now
        </p>
      </div>
    </aside>
  )
}
