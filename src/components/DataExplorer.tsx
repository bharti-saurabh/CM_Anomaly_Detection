import { useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { X, TrendingUp, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { TRANSACTIONS } from '../data/transactions'
import { TIME_SERIES } from '../data/timeSeries'
import type { Transaction, Product, TxStatus } from '../types'

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return 'text-red-600 bg-red-50'
  if (score >= 60) return 'text-orange-600 bg-orange-50'
  if (score >= 40) return 'text-amber-600 bg-amber-50'
  return 'text-emerald-700 bg-emerald-50'
}

const SCORE_BAR = (score: number) => {
  if (score >= 80) return 'bg-red-500'
  if (score >= 60) return 'bg-orange-500'
  if (score >= 40) return 'bg-amber-400'
  return 'bg-emerald-500'
}

const STATUS_BADGE: Record<TxStatus, string> = {
  clear:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  flagged: 'bg-amber-50 text-amber-700 border-amber-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
}

const PRODUCT_CHIP: Record<Product, string> = {
  treasury: 'bg-blue-50 text-blue-700',
  custody:  'bg-violet-50 text-violet-700',
  wealth:   'bg-emerald-50 text-emerald-700',
}

const PRODUCT_LABELS: Record<Product, string> = {
  treasury: 'Treasury',
  custody: 'Custody',
  wealth: 'Wealth',
}

function SlidePanel({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const bars = tx.topFactors.length > 0
    ? tx.topFactors.map((f, i) => ({ feature: f, value: Math.round(tx.anomalyScore * [0.42, 0.31, 0.27][i] || 0.25) }))
    : [{ feature: 'Normal volume pattern', value: 0 }, { feature: 'Known jurisdiction', value: 0 }, { feature: 'Registered counterparty', value: 0 }]

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 animate-slide-in overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <p className="text-xs font-mono text-slate-400">{tx.id}</p>
          <p className="text-sm font-bold text-slate-900">{tx.clientName}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Score */}
        <div className="text-center bg-slate-50 rounded-xl p-4">
          <div className={clsx('text-4xl font-bold font-mono mb-1', SCORE_COLOR(tx.anomalyScore).split(' ')[0])}>
            {tx.anomalyScore}
          </div>
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Anomaly Score / 100</div>
          <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
            <div
              className={clsx('h-2 rounded-full transition-all', SCORE_BAR(tx.anomalyScore))}
              style={{ width: `${tx.anomalyScore}%` }}
            />
          </div>
        </div>

        {/* Transaction Details */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Transaction Details</p>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Timestamp', value: tx.timestamp },
              { label: 'Product', value: PRODUCT_LABELS[tx.product] },
              { label: 'Type', value: tx.type },
              { label: 'Amount', value: tx.amount ? `${tx.currency} ${tx.amount.toLocaleString()}` : 'N/A' },
              { label: 'Route', value: `${tx.fromJurisdiction} → ${tx.toJurisdiction}` },
              { label: 'Status', value: tx.status.charAt(0).toUpperCase() + tx.status.slice(1) },
            ].map(row => (
              <div key={row.label} className="flex justify-between">
                <span className="text-slate-400">{row.label}</span>
                <span className="text-slate-800 font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contributing Factors */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Top Contributing Factors</p>
          {tx.topFactors.length > 0 ? (
            <div className="space-y-2.5">
              {bars.map((b, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700 font-medium">{b.feature}</span>
                    <span className="font-mono text-slate-500">+{b.value}pts</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-red-400 transition-all" style={{ width: `${(b.value / tx.anomalyScore) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No significant risk factors detected.</p>
          )}
        </div>

        {tx.signalId && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5" />
              Linked to active case: {tx.signalId}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export function DataExplorer() {
  const [productFilter, setProductFilter] = useState<'all' | Product>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | TxStatus>('all')
  const [scoreMin, setScoreMin] = useState(0)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [sortField, setSortField] = useState<'timestamp' | 'anomalyScore'>('timestamp')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = TRANSACTIONS
    .filter(tx => productFilter === 'all' || tx.product === productFilter)
    .filter(tx => statusFilter === 'all' || tx.status === statusFilter)
    .filter(tx => tx.anomalyScore >= scoreMin)
    .filter(tx =>
      !search ||
      tx.clientName.toLowerCase().includes(search.toLowerCase()) ||
      tx.id.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1
      if (sortField === 'anomalyScore') return (a.anomalyScore - b.anomalyScore) * mul
      return a.timestamp.localeCompare(b.timestamp) * mul
    })

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(field); setSortDir('desc') }
  }

  const stats = {
    total: filtered.length,
    blocked: filtered.filter(t => t.status === 'blocked').length,
    flagged: filtered.filter(t => t.status === 'flagged').length,
    avgScore: filtered.length ? Math.round(filtered.reduce((s, t) => s + t.anomalyScore, 0) / filtered.length) : 0,
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 mr-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h1 className="text-base font-bold text-slate-900">Data Explorer</h1>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search client or ID..."
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
          <select value={productFilter} onChange={e => setProductFilter(e.target.value as typeof productFilter)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Products</option>
            <option value="treasury">Treasury</option>
            <option value="custody">Custody</option>
            <option value="wealth">Wealth</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Statuses</option>
            <option value="clear">Clear</option>
            <option value="flagged">Flagged</option>
            <option value="blocked">Blocked</option>
          </select>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <label>Score ≥</label>
            <input type="number" value={scoreMin} onChange={e => setScoreMin(Number(e.target.value))} min={0} max={100} step={5}
              className="w-14 px-2 py-1.5 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="ml-auto flex gap-4 text-xs text-slate-500">
            <span><strong className="text-slate-800">{stats.total}</strong> rows</span>
            <span><strong className="text-red-600">{stats.blocked}</strong> blocked</span>
            <span><strong className="text-amber-600">{stats.flagged}</strong> flagged</span>
            <span>avg score <strong className="text-slate-800">{stats.avgScore}</strong></span>
          </div>
        </div>
      </div>

      {/* Chart + Table */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Sparkline Chart */}
          <div className="px-6 pt-4 pb-0 bg-white border-b border-slate-100 shrink-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">30-Day Volume & Anomaly Score</p>
            <ResponsiveContainer width="100%" height={90}>
              <ComposedChart data={TIME_SERIES} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#cbd5e1' }} tickLine={false} interval={5} />
                <YAxis yAxisId="left" tick={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar yAxisId="left" dataKey="volume" fill="#dbeafe" stroke="#93c5fd" strokeWidth={0.5} name="Volume" />
                <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#ef4444" dot={false} strokeWidth={2} name="Avg Score" />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="border-b border-slate-200">
                  <th
                    className="text-left px-4 py-3 text-slate-500 font-semibold cursor-pointer hover:text-slate-700 select-none"
                    onClick={() => toggleSort('timestamp')}
                  >
                    Time {sortField === 'timestamp' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold">Client</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold">Product</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold">Type</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-semibold">Amount</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold">Route</th>
                  <th
                    className="text-right px-4 py-3 text-slate-500 font-semibold cursor-pointer hover:text-slate-700 select-none"
                    onClick={() => toggleSort('anomalyScore')}
                  >
                    Score {sortField === 'anomalyScore' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelected(selected?.id === tx.id ? null : tx)}
                    className={clsx(
                      'border-b border-slate-100 cursor-pointer transition-colors',
                      selected?.id === tx.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                    )}
                  >
                    <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">{tx.timestamp}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-slate-800">{tx.clientName}</div>
                      <div className="text-slate-400 font-mono">{tx.id}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={clsx('px-2 py-0.5 rounded font-semibold', PRODUCT_CHIP[tx.product])}>
                        {PRODUCT_LABELS[tx.product]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{tx.type}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-700 whitespace-nowrap">
                      {tx.amount ? `${tx.currency} ${(tx.amount / 1e6).toFixed(2)}M` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{tx.fromJurisdiction} → {tx.toJurisdiction}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div className={clsx('h-1.5 rounded-full', SCORE_BAR(tx.anomalyScore))} style={{ width: `${tx.anomalyScore}%` }} />
                        </div>
                        <span className={clsx('font-mono font-bold text-xs px-1.5 py-0.5 rounded', SCORE_COLOR(tx.anomalyScore))}>
                          {tx.anomalyScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={clsx('px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide text-xs', STATUS_BADGE[tx.status])}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Slide-in XAI Panel */}
        {selected && <SlidePanel tx={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  )
}
