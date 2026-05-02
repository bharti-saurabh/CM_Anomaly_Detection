import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import clsx from 'clsx'
import { AGENTS } from '../data/agents'
import { TIME_SERIES } from '../data/timeSeries'
import { BEC_CASES } from '../data/becCases'
import type { AgentStatus } from '../types'

// ── Agent accent colours (one per surveillance agent) ─────────────────────────

const AGENT_ACCENT: Record<string, { dot: string; text: string; bg: string; bar: string; border: string }> = {
  'identity-validator':    { dot: 'bg-sky-500',     text: 'text-sky-600',     bg: 'bg-sky-50',     bar: 'bg-sky-500',     border: 'border-sky-200'     },
  'behavioral-sentinel':   { dot: 'bg-amber-500',   text: 'text-amber-600',   bg: 'bg-amber-50',   bar: 'bg-amber-500',   border: 'border-amber-200'   },
  'treasury-profiler':     { dot: 'bg-violet-500',  text: 'text-violet-600',  bg: 'bg-violet-50',  bar: 'bg-violet-500',  border: 'border-violet-200'  },
  'entitlement-checker':   { dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500', border: 'border-emerald-200' },
  'network-grapher':       { dot: 'bg-teal-500',    text: 'text-teal-600',    bg: 'bg-teal-50',    bar: 'bg-teal-500',    border: 'border-teal-200'    },
  'maker-checker-auditor': { dot: 'bg-rose-500',    text: 'text-rose-600',    bg: 'bg-rose-50',    bar: 'bg-rose-500',    border: 'border-rose-200'    },
  'velocity-tracker':      { dot: 'bg-orange-500',  text: 'text-orange-600',  bg: 'bg-orange-50',  bar: 'bg-orange-500',  border: 'border-orange-200'  },
  'payload-parser':        { dot: 'bg-blue-500',    text: 'text-blue-600',    bg: 'bg-blue-50',    bar: 'bg-blue-500',    border: 'border-blue-200'    },
}

const STATUS_DOT: Record<AgentStatus, string> = {
  idle:      'bg-gray-400',
  analyzing: 'bg-amber-500 animate-pulse',
  complete:  'bg-emerald-500',
}

const STATUS_LABEL: Record<AgentStatus, { text: string; badge: string }> = {
  idle:      { text: 'Idle',      badge: 'bg-gray-100 text-gray-500' },
  analyzing: { text: 'Analyzing', badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
  complete:  { text: 'Complete',  badge: 'bg-emerald-50 text-emerald-700' },
}

const RECENT_ACTIVITY = [
  { time: '09:16', event: 'Backtest initiated for TR-8842', badge: 'Mitigation', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { time: '09:15', event: 'RCA completed — 98.4% confidence BEC pattern', badge: 'Analysis', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { time: '09:14', event: 'TR-8842 flagged — $14.5M wire suspended', badge: 'Critical', color: 'bg-red-50 text-red-700 border-red-200' },
  { time: '09:11', event: 'CU-4419 flagged — MT542 instruction blocked', badge: 'High', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { time: '09:08', event: 'PR-9102 detected — 45 apps from RIA Node #442', badge: 'High', color: 'bg-orange-50 text-orange-700 border-orange-200' },
]

const totalDecisions = AGENTS.reduce((s, a) => s + a.decisionsToday, 0)
const avgPrecision = (AGENTS.reduce((s, a) => s + a.precision, 0) / AGENTS.length).toFixed(1)
const criticalCount = BEC_CASES.filter(c => c.severity === 'critical').length
const highCount = BEC_CASES.filter(c => c.severity === 'high').length
const totalRisk = BEC_CASES.reduce((s, c) => s + c.instruction.amount, 0)

export function Overview() {
  const kpis = [
    {
      label: 'Open Cases',
      value: BEC_CASES.length.toString(),
      sub: `${criticalCount} critical · ${highCount} high`,
      color: 'text-red-600',
      dot: 'bg-red-500',
      badge: 'bg-red-50 border-red-200',
    },
    {
      label: 'Avg Model Precision',
      value: `${avgPrecision}%`,
      sub: `Across ${AGENTS.length} surveillance agents`,
      color: 'text-blue-600',
      dot: 'bg-blue-500',
      badge: 'bg-blue-50 border-blue-200',
    },
    {
      label: 'Value at Risk',
      value: `$${(totalRisk / 1_000_000).toFixed(1)}M`,
      sub: 'Across open cases',
      color: 'text-amber-600',
      dot: 'bg-amber-500',
      badge: 'bg-amber-50 border-amber-200',
    },
    {
      label: 'Agent Decisions',
      value: totalDecisions.toString(),
      sub: 'Total decisions today',
      color: 'text-emerald-600',
      dot: 'bg-emerald-500',
      badge: 'bg-emerald-50 border-emerald-200',
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">System Overview</h1>
            <p className="text-xs text-gray-400 mt-0.5">Platform health and activity — May 01, 2026</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.label} className={clsx('bg-white rounded-xl border p-5 shadow-sm', k.badge)}>
              <div className="flex items-center gap-2 mb-3">
                <span className={clsx('w-2 h-2 rounded-full shrink-0', k.dot)} />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{k.label}</span>
              </div>
              <div className={clsx('text-3xl font-bold font-mono mb-1', k.color)}>{k.value}</div>
              <div className="text-xs text-gray-400">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* 30-Day Anomaly Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">30-Day Anomaly Timeline</h2>
              <p className="text-xs text-gray-400 mt-0.5">Daily transaction volume vs. average anomaly score</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-blue-200 inline-block" /> Volume</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-400 inline-block" /> Avg Score</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={TIME_SERIES} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} interval={4} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}
                labelStyle={{ fontWeight: 600, color: '#1e293b' }}
              />
              <Area yAxisId="left" type="monotone" dataKey="volume" stroke="#93c5fd" fill="#dbeafe" strokeWidth={1.5} name="Volume" />
              <Area yAxisId="right" type="monotone" dataKey="avgScore" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} name="Avg Score" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-5 gap-4">

          {/* Agent Health Grid */}
          <div className="col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Surveillance Agent Health</h2>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{AGENTS.length} agents active</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {AGENTS.map(agent => {
                const accent = AGENT_ACCENT[agent.id] ?? AGENT_ACCENT['payload-parser']
                const sl = STATUS_LABEL[agent.status]
                return (
                  <div key={agent.id} className={clsx('rounded-xl border p-3', accent.bg, accent.border)}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', STATUS_DOT[agent.status])} />
                      <span className={clsx('text-[9px] font-semibold px-1.5 py-0.5 rounded-full', sl.badge)}>{sl.text}</span>
                    </div>
                    <div className={clsx('text-[11px] font-bold leading-tight mb-1.5', accent.text)}>{agent.name}</div>
                    <div className="mb-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] text-gray-400">Precision</span>
                        <span className={clsx('text-[10px] font-bold font-mono', accent.text)}>{agent.precision.toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-white rounded-full overflow-hidden border border-gray-200">
                        <div className={clsx('h-1 rounded-full', accent.bar)} style={{ width: `${agent.precision}%` }} />
                      </div>
                    </div>
                    <div className="text-[9px] text-gray-400">{agent.decisionsToday} decisions today</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {RECENT_ACTIVITY.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-[10px] font-mono text-gray-400 shrink-0 mt-0.5 w-10">{item.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-snug mb-1">{item.event}</p>
                    <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-block', item.color)}>
                      {item.badge}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Active Cases Summary */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Active Cases</h2>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending investigation</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {BEC_CASES.map(c => {
              const sevColor = c.severity === 'critical'
                ? { dot: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-50 text-red-700 border-red-200' }
                : c.severity === 'high'
                ? { dot: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-50 text-orange-700 border-orange-200' }
                : { dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-50 text-amber-700 border-amber-200' }
              return (
                <div key={c.id} className={clsx('rounded-xl border p-4', sevColor.bg, sevColor.border)}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={clsx('w-2 h-2 rounded-full shrink-0', sevColor.dot)} />
                    <span className={clsx('font-mono text-xs font-bold', sevColor.text)}>{c.id}</span>
                    <span className={clsx('ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase', sevColor.badge)}>
                      {c.severity}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 mb-0.5">{c.relationship.clientName}</div>
                  <div className="text-xs text-gray-500 mb-2">{c.instruction.currency} {c.instruction.amount.toLocaleString()} → {c.instruction.beneficiaryCountry}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden border border-gray-200">
                      <div
                        className={clsx('h-1.5 rounded-full transition-all', c.anomalyScore >= 80 ? 'bg-red-500' : c.anomalyScore >= 65 ? 'bg-orange-500' : 'bg-amber-500')}
                        style={{ width: `${c.anomalyScore}%` }}
                      />
                    </div>
                    <span className={clsx('text-[10px] font-bold font-mono shrink-0', sevColor.text)}>{c.anomalyScore}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
