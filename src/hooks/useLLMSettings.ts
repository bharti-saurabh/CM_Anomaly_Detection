import { useState } from 'react'
import type { LLMSettings } from '../types'

const DEFAULT: LLMSettings = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o',
  customModelId: '',
  temperature: 0,
}

const KEY = 'vigil_llm_settings'

export function useLLMSettings() {
  const [settings, setSettings] = useState<LLMSettings>(() => {
    try {
      const stored = localStorage.getItem(KEY)
      return stored ? { ...DEFAULT, ...JSON.parse(stored) } : DEFAULT
    } catch {
      return DEFAULT
    }
  })

  const save = (next: LLMSettings) => {
    setSettings(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  const reset = () => {
    setSettings(DEFAULT)
    localStorage.removeItem(KEY)
  }

  const isConfigured = Boolean(settings.apiKey.trim() && settings.baseUrl.trim())
  const effectiveModel =
    settings.model === 'custom' ? settings.customModelId : settings.model

  return { settings, save, reset, isConfigured, effectiveModel }
}
