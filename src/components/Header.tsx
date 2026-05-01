import { Shield, Settings, Wifi } from 'lucide-react'
import type { Signal } from '../types'

interface Props {
  signals: Signal[]
  isConfigured: boolean
  onOpenSettings: () => void
}

export function Header({ signals, isConfigured, onOpenSettings }: Props) {
  const criticalCount = signals.filter(s => s.severity === 'critical').length
  const highCount = signals.filter(s => s.severity === 'high').length
  const medCount = signals.filter(s => s.severity === 'medium').length

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-5 gap-4 shrink-0 z-10">
      <div className="flex items-center gap-2 mr-4">
        <Shield className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
        <span className="font-bold text-slate-900 text-lg tracking-tight">Vigil</span>
      </div>

      <div className="flex items-center gap-2">
        {criticalCount > 0 && (
          <span className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {criticalCount} Critical
          </span>
        )}
        {highCount > 0 && (
          <span className="flex items-center gap-1.5 bg-orange-50 text-orange-600 border border-orange-200 text-xs font-semibold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            {highCount} High
          </span>
        )}
        {medCount > 0 && (
          <span className="flex items-center gap-1.5 bg-amber-50 text-amber-600 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {medCount} Med
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
          <Wifi className="w-3.5 h-3.5" />
          LIVE
        </span>

        {isConfigured ? (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            AI Connected
          </button>
        ) : (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            Configure AI
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="flex items-center justify-center w-8 h-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open LLM settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
