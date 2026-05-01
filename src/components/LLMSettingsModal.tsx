import { useState } from 'react'
import { X, RotateCcw, Eye, EyeOff, Check, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import type { LLMSettings } from '../types'

const MODEL_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  { value: 'llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
  { value: 'custom', label: 'Custom model ID...' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
  settings: LLMSettings
  onSave: (settings: LLMSettings) => void
  onReset: () => void
}

export function LLMSettingsModal({ isOpen, onClose, settings, onSave, onReset }: Props) {
  const [local, setLocal] = useState<LLMSettings>({ ...settings })
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  const set = (patch: Partial<LLMSettings>) => setLocal(prev => ({ ...prev, ...patch }))

  const handleSave = () => {
    onSave(local)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 800)
  }

  const handleReset = () => {
    onReset()
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">LLM Settings</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {/* API Base URL */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              API Base URL
            </label>
            <input
              type="url"
              value={local.baseUrl}
              onChange={e => set({ baseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={local.apiKey}
                onChange={e => set({ apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Model
            </label>
            <div className="relative">
              <select
                value={local.model}
                onChange={e => set({ model: e.target.value })}
                className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 text-slate-900 text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {MODEL_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            {local.model === 'custom' && (
              <input
                type="text"
                value={local.customModelId}
                onChange={e => set({ customModelId: e.target.value })}
                placeholder="gpt-5.4"
                className={clsx(
                  'w-full mt-2 px-4 py-3 rounded-xl border text-slate-900 text-sm placeholder-slate-400',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-slate-200 transition-all'
                )}
                autoFocus
              />
            )}
            {local.model === 'custom' && (
              <p className="mt-1.5 text-xs text-slate-400">
                Use the exact API model ID (lowercase, no spaces).
              </p>
            )}
          </div>

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-600">Temperature</label>
              <span className="text-sm font-semibold text-slate-700">
                {local.temperature.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={local.temperature}
              onChange={e => set({ temperature: parseFloat(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600 bg-slate-200"
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-slate-400">Precise (0)</span>
              <span className="text-xs text-slate-400">Creative (1)</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={clsx(
            'mt-6 w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all text-sm',
            saved
              ? 'bg-emerald-500'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99]'
          )}
        >
          <Check className="w-4 h-4" />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
