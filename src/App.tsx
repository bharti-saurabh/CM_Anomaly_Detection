import { useState } from 'react'
import { Header } from './components/Header'
import { NavSidebar } from './components/NavSidebar'
import { SignalFeed } from './components/SignalFeed'
import { CaseWorkspace } from './components/CaseWorkspace'
import { LLMSettingsModal } from './components/LLMSettingsModal'
import { Overview } from './components/Overview'
import { DataExplorer } from './components/DataExplorer'
import { AgentMonitor } from './components/AgentMonitor'
import { RuleBuilder } from './components/RuleBuilder'
import { useLLMSettings } from './hooks/useLLMSettings'
import { SIGNALS } from './data/scenarios'
import type { Signal, Section } from './types'

export default function App() {
  const { settings, save, reset, isConfigured, effectiveModel } = useLLMSettings()
  const [section, setSection] = useState<Section>('overview')
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const openSettings = () => setShowSettings(true)

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header
        signals={SIGNALS}
        isConfigured={isConfigured}
        onOpenSettings={openSettings}
        section={section}
      />

      <div className="flex flex-1 overflow-hidden">
        <NavSidebar section={section} onSelect={setSection} />

        {section === 'overview' && <Overview />}

        {section === 'explorer' && <DataExplorer />}

        {section === 'investigations' && (
          <>
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
              onOpenSettings={openSettings}
            />
          </>
        )}

        {section === 'agents' && <AgentMonitor />}

        {section === 'rules' && (
          <RuleBuilder onOpenSettings={openSettings} isConfigured={isConfigured} />
        )}
      </div>

      <LLMSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={next => { save(next); setShowSettings(false) }}
        onReset={reset}
      />
    </div>
  )
}
