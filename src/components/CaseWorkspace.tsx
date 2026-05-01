import { useState, useEffect, useCallback } from 'react'
import {
  Shield,
  Zap,
  ChevronRight,
  Copy,
  Check,
  FlaskConical,
  Send,
  AlertTriangle,
  Settings,
} from 'lucide-react'
import clsx from 'clsx'
import { useAIAnalysis } from '../hooks/useAIAnalysis'
import type { Signal, Severity, CaseStage, LLMSettings } from '../types'

const SEVERITY_STYLES: Record<Severity, { badge: string; border: string; dot: string }> = {
  critical: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    border: 'border-l-red-500',
    dot: 'bg-red-500',
  },
  high: {
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    border: 'border-l-orange-500',
    dot: 'bg-orange-500',
  },
  medium: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    border: 'border-l-amber-400',
    dot: 'bg-amber-400',
  },
}

const STAGES: CaseStage[] = ['detected', 'investigating', 'mitigating', 'resolved']
const STAGE_LABELS: Record<CaseStage, string> = {
  detected: 'Detected',
  investigating: 'Investigating',
  mitigating: 'Mitigating',
  resolved: 'Resolved',
}

function EmptyState({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8">
      <Shield className="w-12 h-12 text-slate-300 mb-4" />
      <h2 className="text-slate-600 font-semibold text-lg mb-1">No Signal Selected</h2>
      <p className="text-slate-400 text-sm text-center max-w-xs mb-6">
        Select an anomaly signal from the feed to open its investigation workspace.
      </p>
      <button
        onClick={onOpenSettings}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5"
      >
        <Settings className="w-3.5 h-3.5" />
        Configure AI Analysis
      </button>
    </div>
  )
}

interface Props {
  signal: Signal | null
  settings: LLMSettings
  effectiveModel: string
  isConfigured: boolean
  onOpenSettings: () => void
}

export function CaseWorkspace({
  signal,
  settings,
  effectiveModel,
  isConfigured,
  onOpenSettings,
}: Props) {
  const { text: aiText, isStreaming, error: aiError, analyze, clear } = useAIAnalysis()
  const [stage, setStage] = useState<CaseStage>('investigating')
  const [showBacktest, setShowBacktest] = useState(false)
  const [isRunningBacktest, setIsRunningBacktest] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [approved, setApproved] = useState(false)

  useEffect(() => {
    if (!signal) return
    setStage(signal.caseData.stage)
    setShowBacktest(false)
    setIsRunningBacktest(false)
    setApproved(false)
    clear()
  }, [signal?.id, clear])

  const handleAnalyze = useCallback(() => {
    if (signal && isConfigured) {
      analyze(signal, settings, effectiveModel)
    }
  }, [signal, isConfigured, analyze, settings, effectiveModel])

  const handleRunBacktest = () => {
    setIsRunningBacktest(true)
    setTimeout(() => {
      setIsRunningBacktest(false)
      setShowBacktest(true)
    }, 1800)
  }

  const handleCopyCode = () => {
    if (!signal) return
    navigator.clipboard.writeText(signal.caseData.pyspark)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const handleApprove = () => {
    setApproved(true)
    const nextIdx = STAGES.indexOf(stage) + 1
    if (nextIdx < STAGES.length) setStage(STAGES[nextIdx])
  }

  if (!signal) return <EmptyState onOpenSettings={onOpenSettings} />

  const sv = SEVERITY_STYLES[signal.severity]
  const stageIdx = STAGES.indexOf(stage)

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="p-6 max-w-4xl mx-auto space-y-5">

        {/* Case Header */}
        <div className={clsx('bg-white rounded-xl border border-slate-200 border-l-4 p-5', sv.border)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-slate-500">{signal.id}</span>
                <span
                  className={clsx(
                    'text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                    sv.badge
                  )}
                >
                  {signal.severity}
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">{signal.title}</h1>
              <p className="text-sm text-slate-500">{signal.caseData.summary}</p>
            </div>
            {signal.amount && (
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold text-slate-900 font-mono">{signal.amount}</div>
                <div className="text-xs text-slate-400 mt-0.5">Exposure</div>
              </div>
            )}
          </div>
        </div>

        {/* Stage Pipeline */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-1">
            {STAGES.map((s, idx) => {
              const isPast = idx < stageIdx
              const isCurrent = idx === stageIdx
              return (
                <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
                  <button
                    onClick={() => setStage(s)}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-1 min-w-0',
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isPast
                        ? 'bg-slate-100 text-slate-500'
                        : 'text-slate-300 cursor-default'
                    )}
                  >
                    <span
                      className={clsx(
                        'w-2 h-2 rounded-full shrink-0',
                        isCurrent ? 'bg-white' : isPast ? 'bg-slate-400' : 'bg-slate-200'
                      )}
                    />
                    <span className="truncate">{STAGE_LABELS[s]}</span>
                  </button>
                  {idx < STAGES.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div
              className={clsx(
                'text-3xl font-bold font-mono mb-1',
                signal.severity === 'critical'
                  ? 'text-red-600'
                  : signal.severity === 'high'
                  ? 'text-orange-500'
                  : 'text-amber-500'
              )}
            >
              {signal.caseData.confidence}%
            </div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              Confidence Score
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-3xl font-bold font-mono text-slate-900 mb-1">
              {signal.caseData.exposure ?? '—'}
            </div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              Est. Exposure
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-3xl font-bold font-mono text-slate-900 mb-1">
              {signal.caseData.flagCount}
            </div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              Events Flagged
            </div>
          </div>
        </div>

        {/* Forensic Analysis Panel */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-semibold text-slate-700">Forensic Analysis</span>
              <span className="text-xs text-slate-400">
                — {aiText ? 'AI Generated' : 'Agent Orchestrator'}
              </span>
            </div>
            {isConfigured && (
              <button
                onClick={handleAnalyze}
                disabled={isStreaming}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  isStreaming
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                <Zap className="w-3.5 h-3.5" />
                {isStreaming ? 'Analyzing…' : 'Analyze with AI'}
              </button>
            )}
            {!isConfigured && (
              <button
                onClick={onOpenSettings}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                Configure AI
              </button>
            )}
          </div>

          <div className="p-5">
            {aiError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}

            {/* AI Streaming Text */}
            {(aiText || isStreaming) && (
              <div className="mb-5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 rounded-lg p-4 border border-slate-100">
                {aiText}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-blue-500 ml-0.5 animate-pulse align-middle rounded-sm" />
                )}
              </div>
            )}

            {/* Scripted Agent Findings (shown when no AI text) */}
            {!aiText && !isStreaming && (
              <div className="space-y-5">
                {signal.caseData.agentFindings.map((agent, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                        Agent: {agent.agentName}
                      </span>
                    </div>
                    <ul className="space-y-1.5 pl-3.5">
                      {agent.findings.map((finding, j) => (
                        <li
                          key={j}
                          className="text-sm text-slate-600 leading-relaxed flex gap-2"
                        >
                          <span className="text-slate-400 shrink-0 mt-0.5">·</span>
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Conclusion */}
            {!aiText && !isStreaming && (
              <div className="mt-5 bg-slate-50 border border-slate-200 rounded-lg p-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Conclusion
                </span>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {signal.caseData.conclusion}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mitigation Rule Panel */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-700">Proposed Mitigation Rule</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-600 font-mono whitespace-pre-line leading-relaxed">
                {signal.caseData.proposedRule}
              </p>
            </div>

            {/* PySpark Code */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  PySpark Deployment Code
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {codeCopied ? (
                    <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy</>
                  )}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-300 text-xs font-mono rounded-lg p-4 overflow-x-auto leading-relaxed">
                {signal.caseData.pyspark}
              </pre>
            </div>

            {/* Backtest */}
            {isRunningBacktest && (
              <div className="border border-dashed border-blue-200 bg-blue-50 rounded-lg p-4 text-center">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-blue-600 font-mono">
                  Simulating rule against 90-day transaction history…
                </p>
              </div>
            )}

            {showBacktest && (
              <div className="border border-slate-200 rounded-lg p-4 animate-fade-in">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  90-Day Simulation Results
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Recall', value: signal.caseData.backtest.recall, color: 'text-blue-600' },
                    { label: 'False Positive Rate', value: signal.caseData.backtest.fpr, color: 'text-emerald-600' },
                    { label: 'Legit Wires Delayed', value: signal.caseData.backtest.delayed.toString(), color: 'text-amber-600' },
                    { label: 'Value Protected', value: signal.caseData.backtest.protected, color: 'text-blue-600' },
                  ].map(m => (
                    <div key={m.label} className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className={clsx('text-xl font-bold font-mono', m.color)}>{m.value}</div>
                      <div className="text-xs text-slate-400 mt-1 leading-tight">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              {!showBacktest ? (
                <button
                  onClick={handleRunBacktest}
                  disabled={isRunningBacktest}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                    isRunningBacktest
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-900 text-white hover:bg-slate-700'
                  )}
                >
                  <FlaskConical className="w-4 h-4" />
                  Run Backtest
                </button>
              ) : (
                <button
                  onClick={handleApprove}
                  disabled={approved}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                    approved
                      ? 'bg-emerald-500 text-white cursor-default'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  )}
                >
                  {approved ? (
                    <><Check className="w-4 h-4" /> Submitted to Review</>
                  ) : (
                    <><Send className="w-4 h-4" /> Submit for Maker/Checker Review</>
                  )}
                </button>
              )}
            </div>

            {showBacktest && !approved && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                AI acts as Maker. Human SME acts as Checker. Deployment requires Change Management approval per SR 11-7.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
