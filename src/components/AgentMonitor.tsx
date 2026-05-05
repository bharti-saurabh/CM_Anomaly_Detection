import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import clsx from 'clsx'
import { Plus, X } from 'lucide-react'
import { AGENTS } from '../data/agents'
import type { Agent } from '../types'

// ── Create Agent Modal ────────────────────────────────────────────────────────

const MODEL_OPTIONS = [
  'Claude Sonnet 4.6', 'Claude Haiku 4.5', 'Claude Opus 4.7',
  'XGBoost Ensemble', 'BERT Classifier', 'GPT-4o', 'Custom / Other',
]

function CreateAgentModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (agent: Agent) => void
}) {
  const [name,    setName]    = useState('')
  const [model,   setModel]   = useState(MODEL_OPTIONS[0])
  const [focus,   setFocus]   = useState('')
  const [desc,    setDesc]    = useState('')
  const [trigger, setTrigger] = useState('')

  const handleSubmit = () => {
    if (!name.trim()) return
    const newAgent: Agent = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      model,
      description: desc.trim() || focus.trim() || 'Custom surveillance agent',
      status: 'idle',
      precision: 0,
      recall: 0,
      decisionsToday: 0,
      lastCase: '—',
      showInOverview: false,
      recentDecisions: [],
    }
    onCreate(newAgent)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Create New Agent</h2>
            <p className="text-xs text-gray-400 mt-0.5">Define a custom surveillance agent for the Vigil pipeline</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Agent Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Cross-Border Velocity Guard"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Model</label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {MODEL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Detection Focus</label>
            <input
              value={focus}
              onChange={e => setFocus(e.target.value)}
              placeholder="e.g. Cross-border wire velocity, structuring patterns"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Description</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="What does this agent do? What signals does it monitor?"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Trigger Condition</label>
            <textarea
              value={trigger}
              onChange={e => setTrigger(e.target.value)}
              placeholder="e.g. Fire when 3+ cross-border wires exceed $500K within 60 minutes from same client"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="text-xs font-semibold text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Agent
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Agent accent colours ──────────────────────────────────────────────────────

const AGENT_ACCENT: Record<string, { dot: string; text: string; bg: string; bar: string; border: string; ring: string }> = {
  'bec-wire-detector':            { dot: 'bg-violet-500',  text: 'text-violet-600',  bg: 'bg-violet-50',  bar: 'bg-violet-500',  border: 'border-violet-300',  ring: 'ring-violet-200'  },
  'email-nlp-screener':           { dot: 'bg-sky-500',     text: 'text-sky-600',     bg: 'bg-sky-50',     bar: 'bg-sky-500',     border: 'border-sky-300',     ring: 'ring-sky-200'     },
  'sanctions-scanner':            { dot: 'bg-rose-500',    text: 'text-rose-600',    bg: 'bg-rose-50',    bar: 'bg-rose-500',    border: 'border-rose-300',    ring: 'ring-rose-200'    },
  'session-identity-guard':       { dot: 'bg-amber-500',   text: 'text-amber-600',   bg: 'bg-amber-50',   bar: 'bg-amber-500',   border: 'border-amber-300',   ring: 'ring-amber-200'   },
  'counterparty-risk-engine':     { dot: 'bg-teal-500',    text: 'text-teal-600',    bg: 'bg-teal-50',    bar: 'bg-teal-500',    border: 'border-teal-300',    ring: 'ring-teal-200'    },
  'velocity-monitor':             { dot: 'bg-orange-500',  text: 'text-orange-600',  bg: 'bg-orange-50',  bar: 'bg-orange-500',  border: 'border-orange-300',  ring: 'ring-orange-200'  },
  'custody-settlement-sentinel':  { dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500', border: 'border-emerald-300', ring: 'ring-emerald-200' },
  'maker-checker-auditor':        { dot: 'bg-red-500',     text: 'text-red-600',     bg: 'bg-red-50',     bar: 'bg-red-500',     border: 'border-red-300',     ring: 'ring-red-200'     },
  'insider-threat-monitor':       { dot: 'bg-indigo-500',  text: 'text-indigo-600',  bg: 'bg-indigo-50',  bar: 'bg-indigo-500',  border: 'border-indigo-300',  ring: 'ring-indigo-200'  },
  'aml-typology-classifier':      { dot: 'bg-purple-500',  text: 'text-purple-600',  bg: 'bg-purple-50',  bar: 'bg-purple-500',  border: 'border-purple-300',  ring: 'ring-purple-200'  },
  'synthetic-id-detector':        { dot: 'bg-blue-500',    text: 'text-blue-600',    bg: 'bg-blue-50',    bar: 'bg-blue-500',    border: 'border-blue-300',    ring: 'ring-blue-200'    },
  'regulatory-threshold-monitor': { dot: 'bg-slate-500',   text: 'text-slate-600',   bg: 'bg-slate-50',   bar: 'bg-slate-500',   border: 'border-slate-300',   ring: 'ring-slate-200'   },
}

// ── Agent card ────────────────────────────────────────────────────────────────

function AgentCard({ agent, isSelected, onSelect }: { agent: Agent; isSelected: boolean; onSelect: () => void }) {
  const accent = AGENT_ACCENT[agent.id] ?? AGENT_ACCENT['regulatory-threshold-monitor']
  const f1     = ((2 * agent.precision * agent.recall) / (agent.precision + agent.recall)).toFixed(1)

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
        <span className="text-[10px] font-mono text-gray-400">{agent.decisionsToday} decisions today</span>
      </div>

      <h3 className={clsx('text-sm font-bold mb-0.5 leading-tight', isSelected ? accent.text : 'text-gray-900')}>{agent.name}</h3>
      <div className={clsx('text-[10px] mb-1.5', isSelected ? accent.text : 'text-gray-400')}>{agent.model}</div>
      <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 mb-3">{agent.description}</p>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Precision', value: `${agent.precision.toFixed(0)}%` },
          { label: 'Recall',    value: `${agent.recall.toFixed(0)}%`    },
          { label: 'F1',        value: `${f1}%`                         },
        ].map(m => (
          <div key={m.label} className={clsx('text-center rounded-lg py-1.5 border', isSelected ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100')}>
            <div className={clsx('text-sm font-bold font-mono', isSelected ? accent.text : 'text-gray-800')}>{m.value}</div>
            <div className="text-[10px] text-gray-400">{m.label}</div>
          </div>
        ))}
      </div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AgentMonitor() {
  const [selectedId,    setSelectedId]    = useState<string>(AGENTS[0].id)
  const [customAgents,  setCustomAgents]  = useState<Agent[]>([])
  const [showModal,     setShowModal]     = useState(false)

  const allAgents = [...AGENTS, ...customAgents]
  const agent     = allAgents.find(a => a.id === selectedId) ?? AGENTS[0]
  const accent    = AGENT_ACCENT[agent.id] ?? AGENT_ACCENT['regulatory-threshold-monitor']

  const chartData = [
    { name: 'Precision', value: agent.precision },
    { name: 'Recall',    value: agent.recall },
    { name: 'F1',        value: parseFloat(((2 * agent.precision * agent.recall) / (agent.precision + agent.recall)).toFixed(1)) },
  ]

  const primaryAgents    = AGENTS.filter(a => a.showInOverview)
  const specialistAgents = AGENTS.filter(a => !a.showInOverview)

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {showModal && (
        <CreateAgentModal
          onClose={() => setShowModal(false)}
          onCreate={agent => { setCustomAgents(p => [...p, agent]); setSelectedId(agent.id) }}
        />
      )}
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Agent Monitor</h1>
            <p className="text-xs text-gray-400 mt-0.5">Real-time status and performance for all {allAgents.length} Vigil surveillance agents</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 px-3.5 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Agent
          </button>
        </div>

        {/* Front-line agents */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Front-line Detection</span>
            <span className="text-[10px] text-gray-300">{primaryAgents.length} agents</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {primaryAgents.map(a => (
              <AgentCard key={a.id} agent={a} isSelected={selectedId === a.id} onSelect={() => setSelectedId(a.id)} />
            ))}
          </div>
        </div>

        {/* Specialist agents */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Specialist & Compliance</span>
            <span className="text-[10px] text-gray-300">{specialistAgents.length} agents</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {specialistAgents.map(a => (
              <AgentCard key={a.id} agent={a} isSelected={selectedId === a.id} onSelect={() => setSelectedId(a.id)} />
            ))}
          </div>
        </div>

        {/* Custom agents */}
        {customAgents.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Custom Agents</span>
              <span className="text-[10px] text-gray-300">{customAgents.length} agent{customAgents.length !== 1 ? 's' : ''} · offline</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {customAgents.map(a => (
                <AgentCard key={a.id} agent={a} isSelected={selectedId === a.id} onSelect={() => setSelectedId(a.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Selected agent detail */}
        <div className="grid grid-cols-5 gap-4">

          {/* Performance panel */}
          <div className={clsx('col-span-2 rounded-xl border shadow-sm overflow-hidden', accent.border)}>
            <div className="px-5 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-end mb-2">
                <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full border', accent.bg, accent.border, accent.text)}>
                  {agent.showInOverview ? 'Front-line' : 'Specialist'}
                </span>
              </div>
              <h2 className={clsx('text-sm font-bold', accent.text)}>{agent.name}</h2>
              <div className="text-[10px] text-gray-400 mb-1">{agent.model}</div>
              <p className="text-[11px] text-gray-400 leading-relaxed">{agent.description}</p>
            </div>
            <div className={clsx('p-5', accent.bg)}>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Performance — 30-day rolling</div>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(1)}%`, '']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}
                  />
                  <Bar dataKey="value" fill={accent.bar.replace('bg-', '#').replace('-500', '')} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                {([{ label: 'Precision', val: agent.precision }, { label: 'Recall', val: agent.recall }] as const).map(m => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-gray-500">{m.label}</span>
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

          {/* Decision log */}
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
                        <div className={clsx('font-bold text-[11px]', d.caseId === 'ROUTINE' ? 'text-gray-400' : 'text-gray-800')}>{d.caseId}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[160px]">{d.caseTitle}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={clsx('font-mono font-bold text-[11px]',
                          d.confidence >= 80 ? 'text-red-600' : d.confidence >= 50 ? 'text-orange-600' : 'text-gray-400'
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
