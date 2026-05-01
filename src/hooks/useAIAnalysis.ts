import { useState, useCallback } from 'react'
import type { Signal, LLMSettings } from '../types'

export function useAIAnalysis() {
  const [text, setText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = useCallback(
    async (signal: Signal, settings: LLMSettings, effectiveModel: string) => {
      setIsStreaming(true)
      setText('')
      setError(null)

      const systemPrompt = `You are Vigil, an AI-powered capital markets surveillance analyst.
Analyze anomalous transaction patterns and provide structured forensic root cause analysis.
Be precise, use financial crime terminology, and format with clear sections.
Limit your analysis to ~350 words. Do not use markdown headers — use plain text sections.`

      const userPrompt = `Analyze this capital markets anomaly:

Case ID: ${signal.id}
Type: ${signal.title}
Product Line: ${signal.product}
Summary: ${signal.caseData.summary}

Provide a structured analysis covering:
1. Risk Assessment
2. Key Anomaly Indicators
3. Probable Threat Vector
4. Recommended Immediate Actions`

      try {
        const response = await fetch(`${settings.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${settings.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: effectiveModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            stream: true,
            temperature: settings.temperature,
            max_tokens: 600,
          }),
        })

        if (!response.ok) {
          throw new Error(`API Error ${response.status}: ${response.statusText}`)
        }

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          for (const line of chunk.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data: ')) continue
            const data = trimmed.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) setText(prev => prev + content)
            } catch {
              // non-JSON SSE line, skip
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setIsStreaming(false)
      }
    },
    []
  )

  const clear = useCallback(() => {
    setText('')
    setError(null)
  }, [])

  return { text, isStreaming, error, analyze, clear }
}
