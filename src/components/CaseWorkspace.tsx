import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import {
  Shield, Zap, ChevronRight, Copy, Check, FlaskConical,
  Send, AlertTriangle, Settings, GitBranch, Clock,
} from 'lucide-react'
import clsx from 'clsx'
import { useAIAnalysis } from '../hooks/useAIAnalysis'
import type { Signal, Severity, CaseStage, LLMSettings } from '../types'

const SEVERITY_STYLES: Record<Severity, { badge: string; border: string }> = {
  critical: { badge: 'bg-red-50 text-red-700 border-red-200',    border: 'border-l-red-500'    },
  high:     { badge: 'bg-orange-50 text-orange-700 border-orange-200', border: 'border-l-orange-500' },
  medium:   { badge: 'bg-amber-50 text-amber-700 border-amber-200',  border: 'border-l-amber-400'  },
}

const STAGES: CaseStage[] = ['detected', 'investigating', 'mitigating', 'resolved']
const STAGE_LABELS: Record<CaseStage, string> = {
  detected: 'Detected', investigating: 'Investigating', mitigating: 'Mitigating', resolved: 'Resolved',
}

const AGENT_COLOR: Record<string, string> = {
  'Treasury Profiler':    'bg-blue-100 text-blue-700',
  'Behavioral Sentinel':  'bg-violet-100 text-violet-700',
  'Payload Parser':       'bg-emerald-100 text-emerald-700',
  'Entitlement Checker':  'bg-orange-100 text-orange-700',
  'Maker-Checker Auditor':'bg-rose-100 text-rose-700',
  'Velocity Tracker':     'bg-amber-100 text-amber-700',
  'Identity Validator':   'bg-cyan-100 text-cyan-700',
  'Orchestrator':         'bg-slate-100 text-slate-700',
}

function EmptyState({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8">
      <Shield className="w-12 h-12 text-slate-300 mb-4" />
      <h2 className="text-slate-600 font-semibold text-lg mb-1">No Signal Selected</h2>
      <p className="text-slate-400 text-sm text-center max-w-xs mb-6">
        Select an anomaly signal from the feed to open its investigation workspace.
      </p>
      <button onClick={onOpenSettings} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5">
        <Settings className="w-3.5 h-3.5" /> Configure AI Analysis
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

export function CaseWorkspace({ signal, settings, effectiveModel, isConfigured, onOpenSettings }: Props) {
  const { text: aiText, isStreaming, error: aiError, analyze, clear } = useAIAnalysis()
  const [stage, setStage] = useState<CaseStage>('investigating')
  const [activeTab, setActiveTab] = useState<'analysis' | 'explainability'>('analysis')
  const [showBacktest, setShowBacktest] = useState(false)
  const [isRunningBacktest, setIsRunningBacktest] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [approved, setApproved] = useState(false)

  useEffect(() => {
    if (!signal) return
    setStage(signal.caseData.stage)
    setActiveTab('analysis')
    setShowBacktest(false)
    setIsRunningBacktest(false)
    setApproved(false)
    clear()
  }, [signal?.id, clear])

  const handleAnalyze = useCallback(() => {
    if (signal && isConfigured) analyze(signal, settings, effectiveModel)
  }, [signal, isConfigured, analyze, settings, effectiveModel])

  const handleRunBacktest = () => {
    setIsRunningBacktest(true)
    setTimeout(() => { setIsRunningBacktest(false); setShowBacktest(true) }, 1800)
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
  const xai = signal.caseData.xai

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="p-6 max-w-4xl mx-auto space-y-4">

        {/* Case Header */}
        <div className={clsx('bg-white rounded-xl border border-slate-200 border-l-4 p-5', sv.border)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-slate-500">{signal.id}</span>
                <span className={clsx('text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', sv.badge)}>
                  {signal.severity}
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">{signal.title}</h1>
              <p className="text-sm text-slate-500 leading-relaxed">{signal.caseData.summary}</p>
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
            {STAGES.map((s, idx) => (
              <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
                <button
                  onClick={() => setStage(s)}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-1 min-w-0',
                    idx === stageIdx ? 'bg-blue-600 text-white' :
                    idx < stageIdx  ? 'bg-slate-100 text-slate-500' :
                                      'text-slate-300 cursor-default'
                  )}
                >
                  <span className={clsx('w-2 h-2 rounded-full shrink-0',
                    idx === stageIdx ? 'bg-white' : idx < stageIdx ? 'bg-slate-400' : 'bg-slate-200')} />
                  <span className="truncate">{STAGE_LABELS[s]}</span>
                </button>
                {idx < STAGES.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Confidence Score',
              value: `${signal.caseData.confidence}%`,
              color: signal.severity === 'critical' ? 'text-red-600' : signal.severity === 'high' ? 'text-orange-500' : 'text-amber-500',
            },
            { label: 'Est. Exposure', value: signal.caseData.exposure ?? '—', color: 'text-slate-900' },
            { label: 'Events Flagged', value: signal.caseData.flagCount.toString(), color: 'text-slate-900' },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <div className={clsx('text-3xl font-bold font-mono mb-1', m.color)}>{m.value}</div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1">
          {(['analysis', 'explainability'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all',
                activeTab === tab
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              {tab === 'analysis' ? 'Forensic Analysis' : 'Explainability (XAI)'}
            </button>
          ))}
        </div>

        {/* ── Analysis Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'analysis' && (
          <>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm font-semibold text-slate-700">Forensic Analysis</span>
                  <span className="text-xs text-slate-400">— {aiText ? 'AI Generated' : 'Agent Orchestrator'}</span>
                </div>
                {isConfigured ? (
                  <button onClick={handleAnalyze} disabled={isStreaming}
                    className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      isStreaming ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700')}>
                    <Zap className="w-3.5 h-3.5" />
                    {isStreaming ? 'Analyzing…' : 'Analyze with AI'}
                  </button>
                ) : (
                  <button onClick={onOpenSettings} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <Settings className="w-3 h-3" /> Configure AI
                  </button>
                )}
              </div>

              <div className="p-5">
                {aiError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{aiError}</span>
                  </div>
                )}

                {(aiText || isStreaming) && (
                  <div className="mb-5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 rounded-lg p-4 border border-slate-100">
                    {aiText}
                    {isStreaming && <span className="inline-block w-2 h-4 bg-blue-500 ml-0.5 animate-pulse align-middle rounded-sm" />}
                  </div>
                )}

                {!aiText && !isStreaming && (
                  <div className="space-y-5">
                    {signal.caseData.agentFindings.map((agent, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Agent: {agent.agentName}</span>
                        </div>
                        <ul className="space-y-1.5 pl-3.5">
                          {agent.findings.map((f, j) => (
                            <li key={j} className="text-sm text-slate-600 leading-relaxed flex gap-2">
                              <span className="text-slate-400 shrink-0 mt-0.5">·</span>{f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <div className="mt-5 bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Conclusion</span>
                      <p className="text-sm text-slate-700 leading-relaxed">{signal.caseData.conclusion}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mitigation Rule */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-700">Proposed Mitigation Rule</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                  <p className="text-sm text-slate-600 font-mono whitespace-pre-line leading-relaxed">{signal.caseData.proposedRule}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">PySpark Deployment Code</span>
                    <button onClick={handleCopyCode} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                      {codeCopied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-300 text-xs font-mono rounded-lg p-4 overflow-x-auto leading-relaxed">{signal.caseData.pyspark}</pre>
                </div>

                {isRunningBacktest && (
                  <div className="border border-dashed border-blue-200 bg-blue-50 rounded-lg p-4 text-center">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-blue-600 font-mono">Simulating rule against 90-day transaction history…</p>
                  </div>
                )}

                {showBacktest && (
                  <div className="border border-slate-200 rounded-lg p-4 animate-fade-in">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">90-Day Simulation Results</p>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Recall', value: signal.caseData.backtest.recall, color: 'text-blue-600' },
                        { label: 'False Positive Rate', value: signal.caseData.backtest.fpr, color: 'text-emerald-600' },
                        { label: 'Legit Delayed', value: signal.caseData.backtest.delayed.toString(), color: 'text-amber-600' },
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

                <div className="flex items-center gap-3 pt-1">
                  {!showBacktest ? (
                    <button onClick={handleRunBacktest} disabled={isRunningBacktest}
                      className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                        isRunningBacktest ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-700')}>
                      <FlaskConical className="w-4 h-4" /> Run Backtest
                    </button>
                  ) : (
                    <button onClick={handleApprove} disabled={approved}
                      className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                        approved ? 'bg-emerald-500 text-white cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700')}>
                      {approved ? <><Check className="w-4 h-4" /> Submitted to Review</> : <><Send className="w-4 h-4" /> Submit for Maker/Checker Review</>}
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
          </>
        )}

        {/* ── Explainability Tab ───────────────────────────────────────────── */}
        {activeTab === 'explainability' && (
          <>
            {/* Feature Importance */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-slate-700">Feature Importance</span>
                <span className="text-xs text-slate-400 ml-1">— contribution to final anomaly score</span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-red-400 inline-block" /> Risk factor</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-emerald-400 inline-block" /> Mitigating</span>
                </div>
                <ResponsiveContainer width="100%" height={xai.contributions.length * 42}>
                  <BarChart
                    layout="vertical"
                    data={xai.contributions}
                    margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" domain={[-60, 60]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`} />
                    <YAxis type="category" dataKey="feature" width={200} tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} />
                    <Tooltip
                      formatter={(value: number, _name: string, props: { payload?: { agent?: string; description?: string } }) => [
                        `${value > 0 ? '+' : ''}${value}% — ${props.payload?.agent ?? ''}`,
                        props.payload?.description ?? '',
                      ]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', maxWidth: 300 }}
                    />
                    <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1.5} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                      {xai.contributions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#f87171' : '#34d399'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs font-bold text-blue-700 mb-1">Counterfactual Explanation</p>
                  <p className="text-sm text-blue-800 leading-relaxed">{xai.counterfactual}</p>
                </div>
              </div>
            </div>

            {/* Decision Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-slate-700">Decision Timeline</span>
                <span className="text-xs text-slate-400 ml-1">— sequence of events that triggered this alert</span>
              </div>
              <div className="p-5">
                <div className="relative">
                  <div className="absolute left-[72px] top-0 bottom-0 w-px bg-slate-200" />
                  <div className="space-y-4">
                    {xai.timeline.map((event, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <span className="text-xs font-mono text-slate-400 w-16 shrink-0 pt-0.5 text-right">{event.time}</span>
                        <div className="relative z-10 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white shrink-0 mt-1" />
                        <div className="flex-1 min-w-0 pb-1">
                          <p className="text-sm text-slate-700 leading-snug">{event.event}</p>
                          <span className={clsx('mt-1.5 inline-block text-xs font-semibold px-2 py-0.5 rounded-full', AGENT_COLOR[event.agent] ?? 'bg-slate-100 text-slate-600')}>
                            {event.agent}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
