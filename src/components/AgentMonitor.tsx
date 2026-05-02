import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import clsx from 'clsx'
import { AGENTS } from '../data/agents'
import type { Agent, AgentStatus } from '../types'

// ── Agent accent colours ──────────────────────────────────────────────────────

const AGENT_ACCENT: Record<string, { dot: string; text: string; bg: string; bar: string; border: string; ring: string }> = {
  'identity-validator':    { dot: 'bg-sky-500',     text: 'text-sky-600',     bg: 'bg-sky-50',     bar: 'bg-sky-500',     border: 'border-sky-300',     ring: 'ring-sky-200'     },
  'behavioral-sentinel':   { dot: 'bg-amber-500',   text: 'text-amber-600',   bg: 'bg-amber-50',   bar: 'bg-amber-500',   border: 'border-amber-300',   ring: 'ring-amber-200'   },
  'treasury-profiler':     { dot: 'bg-violet-500',  text: 'text-violet-600',  bg: 'bg-violet-50',  bar: 'bg-violet-500',  border: 'border-violet-300',  ring: 'ring-violet-200'  },
  'entitlement-checker':   { dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500', border: 'border-emerald-300', ring: 'ring-emerald-200' },
  'network-grapher':       { dot: 'bg-teal-500',    text: 'text-teal-600',    bg: 'bg-teal-50',    bar: 'bg-teal-500',    border: 'border-teal-300',    ring: 'ring-teal-200'    },
  'maker-checker-auditor': { dot: 'bg-rose-500',    text: 'text-rose-600',    bg: 'bg-rose-50',    bar: 'bg-rose-500',    border: 'border-rose-300',    ring: 'ring-rose-200'    },
  'velocity-tracker':      { dot: 'bg-orange-500',  text: 'text-orange-600',  bg: 'bg-orange-50',  bar: 'bg-orange-500',  border: 'border-orange-300',  ring: 'ring-orange-200'  },
  'payload-parser':        { dot: 'bg-blue-500',    text: 'text-blue-600',    bg: 'bg-blue-50',    bar: 'bg-blue-500',    border: 'border-blue-300',    ring: 'ring-blue-200'    },
}

const STATUS_LABEL: Record<AgentStatus, { text: string; badge: string }> = {
  idle:      { text: 'Idle',      badge: 'bg-gray-100 text-gray-500' },
  analyzing: { text: 'Analyzing', badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
  complete:  { text: 'Complete',  badge: 'bg-emerald-50 text-emerald-700' },
}

const STATUS_DOT: Record<AgentStatus, string> = {
  idle:      'bg-gray-300',
  analyzing: 'bg-amber-500 animate-pulse',
  complete:  'bg-emerald-500',
}

// ── Agent card ────────────────────────────────────────────────────────────────

function AgentCard({ agent, isSelected, onSelect }: { agent: Agent; isSelected: boolean; onSelect: () => void }) {
  const accent = AGENT_ACCENT[agent.id] ?? AGENT_ACCENT['payload-parser']
  const sl = STATUS_LABEL[agent.status]
  const f1 = ((2 * agent.precision * agent.recall) / (agent.precision + agent.recall)).toFixed(1)

  return (
    <button
      onClick={onSelect}
      className={clsx(
        'text-left w-full rounded-xl border p-4 transition-all',
        isSelected
          ? clsx(accent.bg, accent.border, 'ring-2', accent.ring, 'shadow-sm')
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={clsx('w-2 h-2 rounded-full shrink-0', STATUS_DOT[agent.status])} />
          <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full', sl.badge)}>{sl.text}</span>
        </div>
        <span className="text-[10px] font-mono text-gray-400">{agent.decisionsToday} today</span>
      </div>

      <h3 className={clsx('text-sm font-bold mb-1 leading-tight', isSelected ? accent.text : 'text-gray-900')}>{agent.name}</h3>
      <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 mb-3">{agent.description}</p>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Precision', value: `${agent.precision.toFixed(0)}%` },
          { label: 'Recall',    value: `${agent.recall.toFixed(0)}%` },
          { label: 'F1',        value: `${f1}%` },
        ].map(m => (
          <div key={m.label} className={clsx('text-center rounded-lg py-1.5 border', isSelected ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100')}>
            <div className={clsx('text-sm font-bold font-mono', isSelected ? accent.text : 'text-gray-800')}>{m.value}</div>
            <div className="text-[10px] text-gray-400">{m.label}</div>
          </div>
        ))}
      </div>

      {isSelected && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Precision</span>
            <span className={clsx('text-[10px] font-bold font-mono', accent.text)}>{agent.precision.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={clsx('h-1.5 rounded-full transition-all duration-700', accent.bar)} style={{ width: `${agent.precision}%` }} />
          </div>
        </div>
      )}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AgentMonitor() {
  const [selectedId, setSelectedId] = useState<string>(AGENTS[0].id)
  const agent = AGENTS.find(a => a.id === selectedId) ?? AGENTS[0]
  const accent = AGENT_ACCENT[agent.id] ?? AGENT_ACCENT['payload-parser']
  const sl = STATUS_LABEL[agent.status]

  const chartData = [
    { name: 'Precision', value: agent.precision },
    { name: 'Recall',    value: agent.recall },
    { name: 'F1',        value: parseFloat(((2 * agent.precision * agent.recall) / (agent.precision + agent.recall)).toFixed(1)) },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Agent Monitor</h1>
            <p className="text-xs text-gray-400 mt-0.5">Real-time status and decision logs for all {AGENTS.length} Vigil surveillance agents</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{AGENTS.filter(a => a.status === 'complete').length} complete</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />{AGENTS.filter(a => a.status === 'analyzing').length} analyzing</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-300" />{AGENTS.filter(a => a.status === 'idle').length} idle</span>
          </div>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-4 gap-4">
          {AGENTS.map(a => (
            <AgentCard
              key={a.id}
              agent={a}
              isSelected={selectedId === a.id}
              onSelect={() => setSelectedId(a.id)}
            />
          ))}
        </div>

        {/* Selected Agent Detail */}
        <div className="grid grid-cols-5 gap-4">

          {/* Performance panel */}
          <div className={clsx('col-span-2 rounded-xl border shadow-sm overflow-hidden', accent.bg, accent.border)}>
            <div className="px-5 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2 mb-1">
                <span className={clsx('w-2 h-2 rounded-full shrink-0', STATUS_DOT[agent.status])} />
                <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full', sl.badge)}>{sl.text}</span>
              </div>
              <h2 className={clsx('text-sm font-bold', accent.text)}>{agent.name}</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">{agent.description}</p>
            </div>
            <div className="p-5">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Performance — 30-day rolling</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(1)}%`, '']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((_entry, i) => (
                      <rect key={i} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                {[
                  { label: 'Precision', val: agent.precision },
                  { label: 'Recall',    val: agent.recall },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-gray-400">{m.label}</span>
                      <span className={clsx('text-[10px] font-bold font-mono', accent.text)}>{m.val.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={clsx('h-1.5 rounded-full', accent.bar)} style={{ width: `${m.val}%` }} />
                    </div>
                  </div>
                ))}
                <div className="text-[10px] text-gray-400 pt-1">
                  Last case: <span className="font-semibold text-gray-700">{agent.lastCase}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decision Log */}
          <div className="col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">Recent Decision Log</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{agent.recentDecisions.length} entries</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Case</th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Confidence</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Outcome</th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {agent.recentDecisions.map(d => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-gray-400 text-[11px]">{d.timestamp}</td>
                      <td className="px-4 py-2.5">
                        <div className={clsx(
                          'font-bold text-[11px]',
                          d.caseId === 'ROUTINE' ? 'text-gray-400' : 'text-gray-800'
                        )}>{d.caseId}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[160px]">{d.caseTitle}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={clsx(
                          'font-mono font-bold text-[11px]',
                          d.confidence >= 80 ? 'text-red-600' : d.confidence >= 50 ? 'text-orange-600' : 'text-gray-500'
                        )}>
                          {d.confidence.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={clsx(
                          'px-2 py-0.5 rounded-full font-bold uppercase tracking-wide text-[10px] border',
                          d.outcome === 'flagged'   && 'bg-orange-50 text-orange-700 border-orange-200',
                          d.outcome === 'escalated' && 'bg-red-50 text-red-700 border-red-200',
                          d.outcome === 'cleared'   && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        )}>
                          {d.outcome}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[11px] text-gray-400">{d.processingMs}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
