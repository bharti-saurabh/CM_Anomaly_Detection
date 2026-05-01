import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import clsx from 'clsx'
import { AGENTS } from '../data/agents'
import type { Agent, AgentStatus } from '../types'

const STATUS_STYLES: Record<AgentStatus, { dot: string; label: string; badge: string }> = {
  idle:      { dot: 'bg-slate-400',              label: 'Idle',      badge: 'bg-slate-100 text-slate-600' },
  analyzing: { dot: 'bg-amber-400 animate-pulse', label: 'Analyzing', badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
  complete:  { dot: 'bg-emerald-500',             label: 'Complete',  badge: 'bg-emerald-50 text-emerald-700' },
}

function AgentCard({ agent, isSelected, onSelect }: { agent: Agent; isSelected: boolean; onSelect: () => void }) {
  const s = STATUS_STYLES[agent.status]
  const f1 = ((2 * agent.precision * agent.recall) / (agent.precision + agent.recall)).toFixed(1)

  return (
    <button
      onClick={onSelect}
      className={clsx(
        'text-left bg-white rounded-xl border p-4 transition-all',
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-100'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={clsx('w-2 h-2 rounded-full shrink-0', s.dot)} />
          <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', s.badge)}>
            {s.label}
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400">{agent.decisionsToday} today</span>
      </div>

      <h3 className="text-sm font-bold text-slate-900 mb-1 leading-tight">{agent.name}</h3>
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">{agent.description}</p>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Precision', value: `${agent.precision.toFixed(0)}%` },
          { label: 'Recall', value: `${agent.recall.toFixed(0)}%` },
          { label: 'F1', value: `${f1}%` },
        ].map(m => (
          <div key={m.label} className="text-center bg-slate-50 rounded-lg py-1.5">
            <div className="text-sm font-bold font-mono text-slate-900">{m.value}</div>
            <div className="text-xs text-slate-400">{m.label}</div>
          </div>
        ))}
      </div>
    </button>
  )
}

export function AgentMonitor() {
  const [selectedId, setSelectedId] = useState<string>(AGENTS[0].id)
  const agent = AGENTS.find(a => a.id === selectedId) ?? AGENTS[0]

  const chartData = [
    { name: 'Precision', value: agent.precision },
    { name: 'Recall', value: agent.recall },
    { name: 'F1', value: parseFloat(((2 * agent.precision * agent.recall) / (agent.precision + agent.recall)).toFixed(1)) },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        <div>
          <h1 className="text-xl font-bold text-slate-900">Agent Monitor</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time status and decision logs for all 8 Vigil surveillance agents.</p>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-4 gap-4">
          {AGENTS.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={selectedId === agent.id}
              onSelect={() => setSelectedId(agent.id)}
            />
          ))}
        </div>

        {/* Selected Agent Detail */}
        <div className="grid grid-cols-5 gap-4">

          {/* Accuracy Chart */}
          <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-1">{agent.name}</h2>
            <p className="text-xs text-slate-400 mb-4">Performance metrics — rolling 30-day window</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(1)}%`, '']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-3">
              Last case: <span className="font-semibold text-slate-700">{agent.lastCase}</span>
            </div>
          </div>

          {/* Decision Log */}
          <div className="col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Recent Decision Log</span>
              <span className="text-xs text-slate-400">{agent.recentDecisions.length} entries</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-2.5 text-slate-500 font-semibold">Time</th>
                    <th className="text-left px-4 py-2.5 text-slate-500 font-semibold">Case</th>
                    <th className="text-right px-4 py-2.5 text-slate-500 font-semibold">Confidence</th>
                    <th className="text-left px-4 py-2.5 text-slate-500 font-semibold">Outcome</th>
                    <th className="text-right px-4 py-2.5 text-slate-500 font-semibold">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {agent.recentDecisions.map(d => (
                    <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-slate-500">{d.timestamp}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-slate-800">{d.caseId}</div>
                        <div className="text-slate-400 truncate max-w-[160px]">{d.caseTitle}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-700">
                        {d.confidence.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={clsx(
                          'px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide text-xs',
                          d.outcome === 'flagged'   && 'bg-orange-50 text-orange-700',
                          d.outcome === 'escalated' && 'bg-red-50 text-red-700',
                          d.outcome === 'cleared'   && 'bg-emerald-50 text-emerald-700',
                        )}>
                          {d.outcome}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-500">{d.processingMs}ms</td>
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
