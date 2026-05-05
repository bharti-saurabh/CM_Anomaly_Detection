import { useState } from 'react'
import { Header } from './components/Header'
import { NavSidebar } from './components/NavSidebar'
import { LLMSettingsModal } from './components/LLMSettingsModal'
import { Capabilities } from './components/Capabilities'
import { Overview } from './components/Overview'
import { DataExplorer } from './components/DataExplorer'
import { InvestigationHub } from './components/InvestigationHub'
import { AgentMonitor } from './components/AgentMonitor'
import { RuleBuilder } from './components/RuleBuilder'
import { useLLMSettings } from './hooks/useLLMSettings'
import type { Section } from './types'

export default function App() {
  const { settings, save, reset, isConfigured } = useLLMSettings()
  const [section, setSection] = useState<Section>('capabilities')
  const [showSettings, setShowSettings] = useState(false)

  const openSettings = () => setShowSettings(true)

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header
        signals={[]}
        isConfigured={isConfigured}
        onOpenSettings={openSettings}
        section={section}
      />

      <div className="flex flex-1 overflow-hidden">
        <NavSidebar section={section} onSelect={setSection} />

        {section === 'capabilities'    && <Capabilities />}
        {section === 'overview'       && <Overview />}
        {section === 'explorer'       && <DataExplorer />}
        {section === 'investigations' && <InvestigationHub />}
        {section === 'agents'         && <AgentMonitor />}
        {section === 'rules'          && <RuleBuilder onOpenSettings={openSettings} isConfigured={isConfigured} />}
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
