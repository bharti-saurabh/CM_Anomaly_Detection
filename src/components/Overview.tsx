import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import clsx from 'clsx'
import { SIGNALS } from '../data/scenarios'
import { AGENTS } from '../data/agents'
import { TIME_SERIES } from '../data/timeSeries'
import type { AgentStatus } from '../types'

const STATUS_DOT: Record<AgentStatus, string> = {
  idle: 'bg-slate-400',
  analyzing: 'bg-amber-400 animate-pulse',
  complete: 'bg-emerald-500',
}

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: 'Idle',
  analyzing: 'Analyzing',
  complete: 'Complete',
}

const RECENT_ACTIVITY = [
  { time: '09:16', event: 'Backtest initiated for TR-8842', badge: 'Mitigation', color: 'bg-blue-100 text-blue-700' },
  { time: '09:15', event: 'RCA completed — 98.4% confidence BEC pattern', badge: 'Analysis', color: 'bg-violet-100 text-violet-700' },
  { time: '09:14', event: 'TR-8842 flagged — $14.5M wire suspended', badge: 'Critical', color: 'bg-red-100 text-red-700' },
  { time: '09:11', event: 'CU-4419 flagged — MT542 instruction blocked', badge: 'High', color: 'bg-orange-100 text-orange-700' },
  { time: '09:08', event: 'PR-9102 detected — 45 apps from RIA Node #442', badge: 'High', color: 'bg-orange-100 text-orange-700' },
]

const totalDecisions = AGENTS.reduce((s, a) => s + a.decisionsToday, 0)
const avgPrecision = (AGENTS.reduce((s, a) => s + a.precision, 0) / AGENTS.length).toFixed(1)

export function Overview() {
  const kpis = [
    { label: 'Cases Today', value: SIGNALS.length.toString(), sub: '1 critical · 2 high', color: 'text-red-600' },
    { label: 'Avg Model Precision', value: `${avgPrecision}%`, sub: 'Across 8 active agents', color: 'text-blue-600' },
    { label: 'Value at Risk', value: '$232.5M', sub: 'Across open cases', color: 'text-amber-600' },
    { label: 'Agent Decisions', value: totalDecisions.toString(), sub: 'Total decisions today', color: 'text-emerald-600' },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        <div>
          <h1 className="text-xl font-bold text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">System health and activity — May 01, 2026</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className={clsx('text-3xl font-bold font-mono mb-1', k.color)}>{k.value}</div>
              <div className="text-sm font-semibold text-slate-700 mb-0.5">{k.label}</div>
              <div className="text-xs text-slate-400">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* 30-Day Anomaly Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">30-Day Anomaly Timeline</h2>
              <p className="text-xs text-slate-400 mt-0.5">Daily transaction volume vs. average anomaly score</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
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
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                labelStyle={{ fontWeight: 600, color: '#1e293b' }}
              />
              <Area yAxisId="left" type="monotone" dataKey="volume" stroke="#93c5fd" fill="#dbeafe" strokeWidth={1.5} name="Volume" />
              <Area yAxisId="right" type="monotone" dataKey="avgScore" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} name="Avg Score" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {/* Agent Health Grid */}
          <div className="col-span-3 bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Agent Health</h2>
            <div className="grid grid-cols-4 gap-3">
              {AGENTS.map(agent => (
                <div key={agent.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={clsx('w-2 h-2 rounded-full shrink-0', STATUS_DOT[agent.status])} />
                    <span className="text-xs text-slate-500">{STATUS_LABEL[agent.status]}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 leading-tight mb-1">{agent.name}</div>
                  <div className="text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-700">{agent.precision.toFixed(0)}%</span> precision
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{agent.decisionsToday} decisions</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {RECENT_ACTIVITY.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-xs font-mono text-slate-400 shrink-0 mt-0.5 w-10">{item.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-snug">{item.event}</p>
                    <span className={clsx('text-xs font-semibold px-1.5 py-0.5 rounded mt-1 inline-block', item.color)}>
                      {item.badge}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
