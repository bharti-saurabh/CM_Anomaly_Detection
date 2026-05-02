import { useState, useEffect, useRef } from 'react'
import { Mail, CreditCard, Fingerprint, Network, ShieldCheck, Cpu } from 'lucide-react'
import clsx from 'clsx'
import { DETECTION_SCENARIOS } from '../data/detectionData'
import type { Signal } from '../types'

// ── Agent definitions ─────────────────────────────────────────────────────────

const AGENT_DEFS = [
  {
    id: 'email' as const,
    name: 'Email Screener',
    model: 'NLP / Transformer',
    icon: Mail,
    ringColor: 'ring-blue-400',
    dotColor: 'bg-blue-400',
    headerColor: 'bg-blue-950',
    labelColor: 'text-blue-300',
    scoreColor: 'text-blue-300',
    borderColor: 'border-blue-500/40',
  },
  {
    id: 'payment' as const,
    name: 'Payment Anomaly',
    model: 'XGBoost',
    icon: CreditCard,
    ringColor: 'ring-violet-400',
    dotColor: 'bg-violet-400',
    headerColor: 'bg-violet-950',
    labelColor: 'text-violet-300',
    scoreColor: 'text-violet-300',
    borderColor: 'border-violet-500/40',
  },
  {
    id: 'identity' as const,
    name: 'Identity & Session',
    model: 'Isolation Forest',
    icon: Fingerprint,
    ringColor: 'ring-amber-400',
    dotColor: 'bg-amber-400',
    headerColor: 'bg-amber-950',
    labelColor: 'text-amber-300',
    scoreColor: 'text-amber-300',
    borderColor: 'border-amber-500/40',
  },
  {
    id: 'graph' as const,
    name: 'Relationship Graph',
    model: 'Graph Neural Net',
    icon: Network,
    ringColor: 'ring-emerald-400',
    dotColor: 'bg-emerald-400',
    headerColor: 'bg-emerald-950',
    labelColor: 'text-emerald-300',
    scoreColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
  },
  {
    id: 'sanctions' as const,
    name: 'Sanctions Screener',
    model: 'Rules Engine + NLP',
    icon: ShieldCheck,
    ringColor: 'ring-rose-400',
    dotColor: 'bg-rose-400',
    headerColor: 'bg-rose-950',
    labelColor: 'text-rose-300',
    scoreColor: 'text-rose-300',
    borderColor: 'border-rose-500/40',
  },
]

type AgentId = typeof AGENT_DEFS[number]['id']

// ── Sub-components ────────────────────────────────────────────────────────────

function OrchestratorTerminal({
  lines,
  active,
  prefix = '>',
}: {
  lines: string[]
  active: boolean
  prefix?: string
}) {
  return (
    <div className="font-mono text-xs space-y-1.5">
      {lines.map((line, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span className="text-slate-500 shrink-0">{prefix}</span>
          <span className="text-slate-200 leading-relaxed">{line}</span>
        </div>
      ))}
      {active && lines.length === 0 && (
        <div className="flex gap-2 items-center">
          <span className="text-slate-500">{'>'}</span>
          <span className="inline-block w-2 h-3.5 bg-slate-400 animate-pulse rounded-sm" />
        </div>
      )}
    </div>
  )
}

function AgentCard({
  def,
  lines,
  score,
  running,
}: {
  def: typeof AGENT_DEFS[number]
  lines: string[]
  score: number | null
  running: boolean
}) {
  const Icon = def.icon
  const done = score !== null

  return (
    <div
      className={clsx(
        'rounded-xl border overflow-hidden transition-all duration-300',
        def.borderColor,
        done ? 'bg-slate-900' : running ? 'bg-slate-900' : 'bg-slate-950 opacity-50'
      )}
    >
      {/* Agent header */}
      <div className={clsx('flex items-center gap-2 px-3 py-2.5', def.headerColor)}>
        <div
          className={clsx(
            'w-2 h-2 rounded-full shrink-0 transition-all',
            done
              ? clsx(def.dotColor)
              : running
              ? clsx(def.dotColor, 'animate-pulse')
              : 'bg-slate-700'
          )}
        />
        <Icon className={clsx('w-3.5 h-3.5 shrink-0', def.labelColor)} />
        <div className="flex-1 min-w-0">
          <div className={clsx('text-xs font-bold truncate', def.labelColor)}>{def.name}</div>
          <div className="text-xs text-slate-500 truncate">{def.model}</div>
        </div>
        {done && (
          <div className={clsx('text-xl font-bold font-mono shrink-0', def.scoreColor)}>
            {score}
          </div>
        )}
        {!done && running && (
          <div className="text-xs text-slate-500 font-mono shrink-0 animate-pulse">···</div>
        )}
      </div>

      {/* Log lines */}
      <div className="px-3 py-2.5 min-h-[80px] font-mono text-xs space-y-1.5">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-1.5 items-start">
            <span className="text-slate-600 shrink-0 mt-0.5">·</span>
            <span
              className={clsx(
                'leading-relaxed',
                i === lines.length - 1 && running && !done
                  ? 'text-slate-300'
                  : 'text-slate-400'
              )}
            >
              {line}
            </span>
          </div>
        ))}
        {running && !done && lines.length > 0 && (
          <div className="flex gap-1.5 items-center">
            <span className="text-slate-600 shrink-0">·</span>
            <span className="inline-block w-1.5 h-3 bg-slate-500 animate-pulse rounded-sm" />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Animated score counter ────────────────────────────────────────────────────

function EnsembleScore({ target }: { target: number | null }) {
  const [displayed, setDisplayed] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === null) { setDisplayed(0); return }
    const start = performance.now()
    const duration = 900
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayed(Math.round(eased * target * 10) / 10)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [target])

  if (target === null) return null

  const color =
    target >= 90 ? 'text-red-400' : target >= 75 ? 'text-orange-400' : 'text-amber-400'
  const label =
    target >= 90 ? 'CRITICAL RISK' : target >= 75 ? 'HIGH RISK' : 'MEDIUM RISK'
  const barW = Math.round((displayed / 100) * 100)
  const barColor =
    target >= 90
      ? 'bg-red-500'
      : target >= 75
      ? 'bg-orange-500'
      : 'bg-amber-500'

  return (
    <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs text-slate-400 font-mono uppercase tracking-widest mb-0.5">
            Ensemble Risk Score
          </div>
          <div className="text-xs text-slate-500">
            Weighted combination — 5 specialist agents
          </div>
        </div>
        <div className="text-right">
          <div className={clsx('text-4xl font-bold font-mono', color)}>
            {displayed.toFixed(1)}
            <span className="text-xl text-slate-500">%</span>
          </div>
          <div className={clsx('text-xs font-bold uppercase tracking-widest mt-0.5', color)}>
            {label}
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={clsx('h-2 rounded-full transition-all duration-700', barColor)}
          style={{ width: `${barW}%` }}
        />
      </div>

      {/* Per-agent breakdown */}
      <div className="mt-4 grid grid-cols-5 gap-2">
        {AGENT_DEFS.map(def => (
          <div key={def.id} className="text-center">
            <div className={clsx('text-sm font-bold font-mono', def.scoreColor)}>—</div>
            <div className="text-xs text-slate-600 leading-tight mt-0.5">{def.name.split(' ')[0]}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  signal: Signal
}

export function DetectionEngine({ signal }: Props) {
  const [orchOpen, setOrchOpen] = useState<string[]>([])
  const [agentLines, setAgentLines] = useState<Record<AgentId, string[]>>({
    email: [], payment: [], identity: [], graph: [], sanctions: [],
  })
  const [agentScores, setAgentScores] = useState<Record<AgentId, number | null>>({
    email: null, payment: null, identity: null, graph: null, sanctions: null,
  })
  const [agentRunning, setAgentRunning] = useState<Record<AgentId, boolean>>({
    email: false, payment: false, identity: false, graph: false, sanctions: false,
  })
  const [orchClose, setOrchClose] = useState<string[]>([])
  const [ensembleScore, setEnsembleScore] = useState<number | null>(null)

  useEffect(() => {
    // Reset
    setOrchOpen([])
    setAgentLines({ email: [], payment: [], identity: [], graph: [], sanctions: [] })
    setAgentScores({ email: null, payment: null, identity: null, graph: null, sanctions: null })
    setAgentRunning({ email: false, payment: false, identity: false, graph: false, sanctions: false })
    setOrchClose([])
    setEnsembleScore(null)

    const scenario = DETECTION_SCENARIOS[signal.id]
    if (!scenario) return

    const timeouts: ReturnType<typeof setTimeout>[] = []

    // Orchestrator opening lines (every 420ms)
    scenario.orchestratorOpen.forEach((line, i) => {
      timeouts.push(setTimeout(() => {
        setOrchOpen(prev => [...prev, line])
      }, i * 420))
    })

    const agentStartMs = scenario.orchestratorOpen.length * 420 + 250

    // Mark all agents as running simultaneously
    timeouts.push(setTimeout(() => {
      setAgentRunning({ email: true, payment: true, identity: true, graph: true, sanctions: true })
    }, agentStartMs))

    // 5 agents run in parallel with small jitter (0–120ms stagger per agent)
    AGENT_DEFS.forEach((def, agentIdx) => {
      const agentData = scenario.agents[def.id]
      const jitter = agentIdx * 100
      const lineInterval = 290

      agentData.lines.forEach((line, lineIdx) => {
        timeouts.push(setTimeout(() => {
          setAgentLines(prev => ({
            ...prev,
            [def.id]: [...prev[def.id], line],
          }))
        }, agentStartMs + jitter + lineIdx * lineInterval))
      })

      // Score appears after last line + 280ms
      const scoreMs = agentStartMs + jitter + agentData.lines.length * lineInterval + 280
      timeouts.push(setTimeout(() => {
        setAgentRunning(prev => ({ ...prev, [def.id]: false }))
        setAgentScores(prev => ({ ...prev, [def.id]: agentData.score }))
      }, scoreMs))
    })

    // Last agent finishes at ~agentStartMs + 120 + 5*290 + 280 = agentStartMs + 1850
    const allDoneMs = agentStartMs + 120 + 5 * 290 + 280 + 400

    // Orchestrator close lines
    scenario.orchestratorClose.forEach((line, i) => {
      timeouts.push(setTimeout(() => {
        setOrchClose(prev => [...prev, line])
      }, allDoneMs + i * 460))
    })

    // Ensemble score
    const ensembleMs = allDoneMs + scenario.orchestratorClose.length * 460 + 300
    timeouts.push(setTimeout(() => {
      setEnsembleScore(scenario.ensembleScore)
    }, ensembleMs))

    return () => timeouts.forEach(clearTimeout)
  }, [signal.id])

  const anyAgentRunning = AGENT_DEFS.some(d => agentRunning[d.id])
  const allDone = AGENT_DEFS.every(d => agentScores[d.id] !== null)

  return (
    <div className="space-y-4">

      {/* Orchestrator header terminal */}
      <div className="rounded-xl border border-slate-700 bg-slate-950 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border-b border-slate-700">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Orchestrator Agent
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            {anyAgentRunning && (
              <span className="text-xs text-blue-400 font-mono animate-pulse">dispatching agents…</span>
            )}
            {allDone && orchClose.length === 0 && (
              <span className="text-xs text-emerald-400 font-mono animate-pulse">computing ensemble…</span>
            )}
            {orchClose.length > 0 && (
              <span className="text-xs text-emerald-400 font-mono">ensemble complete</span>
            )}
          </div>
        </div>
        <div className="px-4 py-3">
          <OrchestratorTerminal
            lines={orchOpen}
            active={orchOpen.length === 0}
          />
        </div>
      </div>

      {/* 5 Agent cards grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {AGENT_DEFS.slice(0, 3).map(def => (
          <AgentCard
            key={def.id}
            def={def}
            lines={agentLines[def.id]}
            score={agentScores[def.id]}
            running={agentRunning[def.id]}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {AGENT_DEFS.slice(3).map(def => (
          <AgentCard
            key={def.id}
            def={def}
            lines={agentLines[def.id]}
            score={agentScores[def.id]}
            running={agentRunning[def.id]}
          />
        ))}
      </div>

      {/* Orchestrator close + ensemble */}
      {orchClose.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-950 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border-b border-slate-700">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Orchestrator — Ensemble Result
            </span>
          </div>
          <div className="px-4 py-3">
            <OrchestratorTerminal lines={orchClose} active={false} />
            <EnsembleScore target={ensembleScore} />
          </div>
        </div>
      )}

    </div>
  )
}
