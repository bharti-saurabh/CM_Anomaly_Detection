import { useState } from 'react'
import { Header } from './components/Header'
import { SignalFeed } from './components/SignalFeed'
import { CaseWorkspace } from './components/CaseWorkspace'
import { LLMSettingsModal } from './components/LLMSettingsModal'
import { useLLMSettings } from './hooks/useLLMSettings'
import { SIGNALS } from './data/scenarios'
import type { Signal } from './types'

export default function App() {
  const { settings, save, reset, isConfigured, effectiveModel } = useLLMSettings()
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header
        signals={SIGNALS}
        isConfigured={isConfigured}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <SignalFeed
          signals={SIGNALS}
          selectedId={selectedSignal?.id ?? null}
          onSelect={setSelectedSignal}
        />

        <CaseWorkspace
          key={selectedSignal?.id ?? 'empty'}
          signal={selectedSignal}
          settings={settings}
          effectiveModel={effectiveModel}
          isConfigured={isConfigured}
          onOpenSettings={() => setShowSettings(true)}
        />
      </div>

      <LLMSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={next => {
          save(next)
          setShowSettings(false)
        }}
        onReset={reset}
      />
    </div>
  )
}
