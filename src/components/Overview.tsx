import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import clsx from 'clsx'
import { AGENTS } from '../data/agents'
import { TIME_SERIES } from '../data/timeSeries'
import { BEC_CASES } from '../data/becCases'
import type { BECCase } from '../types'

// ── Product definitions ───────────────────────────────────────────────────────

type ProductFilter = 'all' | 'treasury' | 'custody' | 'wealth' | 'corporate-trust' | 'clearance'

const PRODUCTS: { id: ProductFilter; label: string }[] = [
  { id: 'all',             label: 'All Products'           },
  { id: 'treasury',        label: 'Treasury Services'      },
  { id: 'custody',         label: 'Asset Servicing'        },
  { id: 'corporate-trust', label: 'Corporate Trust'        },
  { id: 'clearance',       label: 'Clearance & Collateral' },
  { id: 'wealth',          label: 'Wealth Management'      },
]

// Infer product from case characteristics
function inferProduct(c: BECCase): ProductFilter {
  const id = c.id
  if (id === 'BEC-2024-0042' || id === 'BEC-2024-0038' || id === 'BEC-2024-0031' || id === 'BEC-2024-0024' || id === 'BEC-2024-0016') return 'treasury'
  if (id === 'BEC-2024-0027' || id === 'BEC-2024-0012') return 'corporate-trust'
  if (id === 'BEC-2024-0019' || id === 'BEC-2024-0003') return 'wealth'
  if (id === 'BEC-2024-0008') return 'custody'
  // fallback: channel-based
  if (c.instruction.channel === 'Fedwire' || c.instruction.channel === 'SWIFT') return 'treasury'
  return 'treasury'
}

// Proportion of triggers per product (for chart scaling)
const PRODUCT_SCALE: Record<ProductFilter, number> = {
  all:             1.00,
  treasury:        0.50,
  'corporate-trust': 0.20,
  wealth:          0.20,
  custody:         0.10,
  clearance:       0.00,
}

// ── Agent accent colours ──────────────────────────────────────────────────────

const AGENT_ACCENT: Record<string, { dot: string; text: string; bg: string; bar: string; border: string }> = {
  'bec-wire-detector':        { dot: 'bg-violet-500', text: 'text-violet-600', bg: 'bg-violet-50', bar: 'bg-violet-500', border: 'border-violet-200' },
  'email-nlp-screener':       { dot: 'bg-sky-500',    text: 'text-sky-600',    bg: 'bg-sky-50',    bar: 'bg-sky-500',    border: 'border-sky-200'    },
  'sanctions-scanner':        { dot: 'bg-rose-500',   text: 'text-rose-600',   bg: 'bg-rose-50',   bar: 'bg-rose-500',   border: 'border-rose-200'   },
  'session-identity-guard':   { dot: 'bg-amber-500',  text: 'text-amber-600',  bg: 'bg-amber-50',  bar: 'bg-amber-500',  border: 'border-amber-200'  },
  'counterparty-risk-engine': { dot: 'bg-teal-500',   text: 'text-teal-600',   bg: 'bg-teal-50',   bar: 'bg-teal-500',   border: 'border-teal-200'   },
  'velocity-monitor':         { dot: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-500', border: 'border-orange-200' },
}

const overviewAgents = AGENTS.filter(a => a.showInOverview)
const AUTO_CLEARED   = 4

// ── Alert queue with product tags ─────────────────────────────────────────────

const ALERT_QUEUE_ALL = [
  {
    id: BEC_CASES[0].signalId ?? BEC_CASES[0].id,
    client: BEC_CASES[0].relationship.clientName,
    subject: `CRITICAL: $${(BEC_CASES[0].instruction.amount / 1_000_000).toFixed(1)}M Wire Hold — BEC / CEO Impersonation [${BEC_CASES[0].signalId ?? BEC_CASES[0].id}]`,
    preview: `Domain ${BEC_CASES[0].email.senderAddress} proximate to ${BEC_CASES[0].email.legitimateDomain} (age ${BEC_CASES[0].email.senderDomainAgeDays}d). Style match ${Math.round(BEC_CASES[0].nlpAnalysis.writingStyleConsistency * 100)}%. Self-approved. SAR filed.`,
    time: BEC_CASES[0].createdAt.slice(11), to: 'Head of Risk + FCC Lead',
    sev: 'critical' as const, product: 'treasury' as ProductFilter,
    tags: ['Auto-Generated', 'Layer 2', 'SAR Filed'],
  },
  {
    id: BEC_CASES[5].id,
    client: BEC_CASES[5].relationship.clientName,
    subject: `CRITICAL: $${(BEC_CASES[5].instruction.amount / 1_000_000).toFixed(1)}M Cayman Wire — FinCEN Match + SWIFT Controls Flag [${BEC_CASES[5].id}]`,
    preview: `Domain ${BEC_CASES[5].email.senderAddress} (${BEC_CASES[5].email.senderDomainAgeDays}d old). MFA bypassed. Login from ${BEC_CASES[5].identity.loginLocation} (expected ${BEC_CASES[5].identity.expectedLocation}).`,
    time: BEC_CASES[5].createdAt.slice(11), to: 'Financial Crimes + Legal',
    sev: 'critical' as const, product: 'wealth' as ProductFilter,
    tags: ['FinCEN Match', 'Layer 2', 'FBI Referral'],
  },
  {
    id: BEC_CASES[1].id,
    client: BEC_CASES[1].relationship.clientName,
    subject: `HIGH: $${(BEC_CASES[1].instruction.amount / 1_000_000).toFixed(1)}M M&A Settlement — Domain Spoofing Detected [${BEC_CASES[1].id}]`,
    preview: `From ${BEC_CASES[1].email.senderAddress} (expected ${BEC_CASES[1].email.legitimateDomain}). Domain ${BEC_CASES[1].email.senderDomainAgeDays}d old. SWIFT Controls flagged.`,
    time: BEC_CASES[1].createdAt.slice(11), to: 'Arjun K. (Analyst)',
    sev: 'high' as const, product: 'treasury' as ProductFilter,
    tags: ['Domain Alert', 'Case Pre-Loaded'],
  },
  {
    id: 'BEC-2024-0012',
    client: 'Clearwater Trust',
    subject: 'HIGH: $890K Vendor Account Change — Real Estate Wire Pattern',
    preview: 'Vendor banking details changed 48h before settlement. New beneficiary in jurisdiction outside client baseline. Maker-checker bypass detected.',
    time: '14:22:08', to: 'Operations Risk',
    sev: 'high' as const, product: 'corporate-trust' as ProductFilter,
    tags: ['Vendor Fraud', 'Layer 3'],
  },
]

// ── Main component ────────────────────────────────────────────────────────────

export function Overview() {
  const [activeProduct, setActiveProduct] = useState<ProductFilter>('all')

  // All metrics are reactive to the active product filter
  const filteredCases = useMemo(() =>
    activeProduct === 'all' ? BEC_CASES : BEC_CASES.filter(c => inferProduct(c) === activeProduct),
    [activeProduct]
  )

  const openCases     = filteredCases.filter(c => c.status === 'blocked' || c.status === 'flagged')
  const criticalCount = openCases.filter(c => c.severity === 'critical').length
  const highCount     = openCases.filter(c => c.severity === 'high').length
  const mediumCount   = openCases.filter(c => c.severity === 'medium').length
  const totalDecisions = useMemo(() =>
    activeProduct === 'all'
      ? AGENTS.reduce((s, a) => s + a.decisionsToday, 0)
      : Math.round(AGENTS.reduce((s, a) => s + a.decisionsToday, 0) * PRODUCT_SCALE[activeProduct]),
    [activeProduct]
  )
  const blockedRisk   = filteredCases.filter(c => c.status === 'blocked').reduce((s, c) => s + c.instruction.amount, 0)
  const sarCount      = filteredCases.filter(c => c.outcome.sarFiled).length
  const autoCleared   = Math.round(AUTO_CLEARED * PRODUCT_SCALE[activeProduct])

  // Scale chart data by active product proportion
  const scale = PRODUCT_SCALE[activeProduct]
  const chartData = useMemo(() =>
    TIME_SERIES.map(pt => ({
      ...pt,
      critical: Math.round((pt.critical ?? 0) * scale),
      high:     Math.round((pt.high     ?? 0) * scale),
      medium:   Math.round((pt.medium   ?? 0) * scale),
    })),
    [scale]
  )

  const filteredAlerts = activeProduct === 'all'
    ? ALERT_QUEUE_ALL
    : ALERT_QUEUE_ALL.filter(a => a.product === activeProduct)

  const productLabel = PRODUCTS.find(p => p.id === activeProduct)?.label ?? 'All Products'

  const kpis = [
    {
      emoji: '⚡', label: 'Active Triggers (Today)',
      value: (openCases.length + autoCleared).toString(),
      sub: `${criticalCount} critical · ${highCount} high · ${autoCleared} auto-cleared`,
      def: `Every rule or ML model that fired today. Auto-cleared = resolved by agent without human review.`,
      color: 'text-red-600', topBorder: 'border-t-2 border-t-red-500', badge: 'bg-red-50 border-red-200',
    },
    {
      emoji: '📋', label: 'Open Cases — Needs Human',
      value: openCases.length.toString(),
      sub: `${criticalCount} critical · ${highCount} high · ${mediumCount} medium`,
      def: `Triggers that could not auto-resolve — require analyst judgment.`,
      color: 'text-amber-600', topBorder: 'border-t-2 border-t-amber-500', badge: 'bg-amber-50 border-amber-200',
    },
    {
      emoji: '🤖', label: 'Agent Decisions (Today)',
      value: totalDecisions.toLocaleString(),
      sub: `Across ${AGENTS.length} surveillance agents`,
      def: `Total automated decisions across the full 12-agent stack. Each instruction may generate multiple decisions.`,
      color: 'text-blue-600', topBorder: 'border-t-2 border-t-blue-500', badge: 'bg-blue-50 border-blue-200',
    },
    {
      emoji: '🛡', label: 'Value Protected (30d)',
      value: blockedRisk > 0 ? `$${(blockedRisk / 1_000_000).toFixed(1)}M` : '$0',
      sub: `${filteredCases.filter(c => c.status === 'blocked').length} confirmed-fraud wires held · ${sarCount} SAR${sarCount !== 1 ? 's' : ''} filed`,
      def: `Sum of held transaction amounts confirmed as fraudulent. Excludes cases still under investigation.`,
      color: 'text-emerald-600', topBorder: 'border-t-2 border-t-emerald-500', badge: 'bg-emerald-50 border-emerald-200',
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-6xl mx-auto space-y-5">

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

        {/* Product filter bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Filter by Product</span>
          <div className="flex flex-wrap gap-2">
            {PRODUCTS.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveProduct(p.id)}
                className={clsx(
                  'text-[11px] font-medium px-3 py-1 rounded-full border transition-all',
                  activeProduct === p.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          {activeProduct !== 'all' && (
            <button onClick={() => setActiveProduct('all')} className="ml-auto text-[10px] text-gray-400 hover:text-gray-600 underline whitespace-nowrap">
              Clear filter
            </button>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.label} className={clsx('bg-white rounded-xl border shadow-sm p-4 flex flex-col', k.badge, k.topBorder)}>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{k.emoji} {k.label}</div>
              <div className={clsx('text-3xl font-bold font-mono mb-1', k.color)}>{k.value}</div>
              <div className="text-[11px] text-gray-500 mb-3">{k.sub}</div>
              <div className="mt-auto pt-3 border-t border-gray-100 text-[10px] text-gray-400 leading-relaxed">
                <strong className="text-gray-500">Def: </strong>{k.def}
              </div>
            </div>
          ))}
        </div>

        {/* 30-Day Trigger Activity Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">30-Day Trigger Activity Timeline</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {activeProduct === 'all'
                    ? 'All products · Apr 02 – May 01, 2026'
                    : `${productLabel} · ${Math.round(PRODUCT_SCALE[activeProduct] * 100)}% of platform triggers · Apr 02 – May 01, 2026`}
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-gray-400 shrink-0 ml-6">
                <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500" /> Critical</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-400" /> High</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-400" /> Medium</span>
              </div>
            </div>
          </div>

          <div className="px-5 pt-4 pb-2">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 12, right: 16, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={24} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const crit  = payload.find(p => p.dataKey === 'critical')?.value as number ?? 0
                    const high  = payload.find(p => p.dataKey === 'high')?.value as number ?? 0
                    const med   = payload.find(p => p.dataKey === 'medium')?.value as number ?? 0
                    const total = crit + high + med
                    return (
                      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3.5 py-3 text-xs min-w-[160px]">
                        <div className="font-bold text-gray-800 mb-2">{label}{label === 'May 01' ? ' — Today' : ''}</div>
                        {total === 0 ? <div className="text-gray-400">No triggers</div> : (
                          <div className="space-y-1">
                            {crit > 0 && <div className="flex justify-between gap-4"><span className="text-red-500 font-semibold">Critical</span><span className="font-mono font-bold text-red-600">{crit}</span></div>}
                            {high > 0 && <div className="flex justify-between gap-4"><span className="text-orange-500 font-semibold">High</span><span className="font-mono font-bold text-orange-600">{high}</span></div>}
                            {med  > 0 && <div className="flex justify-between gap-4"><span className="text-slate-500 font-semibold">Medium</span><span className="font-mono font-bold text-slate-600">{med}</span></div>}
                            <div className="flex justify-between gap-4 pt-1 border-t border-gray-100">
                              <span className="text-gray-500 font-semibold">Total</span>
                              <span className="font-mono font-bold text-gray-800">{total}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  }}
                />
                <ReferenceLine x="May 01" stroke="#ef4444" strokeWidth={1.5} strokeOpacity={0.4}
                  label={{ value: `Today · ${chartData[chartData.length - 1]?.critical ?? 0 + (chartData[chartData.length - 1]?.high ?? 0) + (chartData[chartData.length - 1]?.medium ?? 0)}`, position: 'insideTopLeft', fontSize: 9, fill: '#ef4444', fontWeight: 700, dx: 4, dy: -8 }}
                />
                <Bar dataKey="critical" stackId="a" name="Critical" fill="#ef4444" />
                <Bar dataKey="high"     stackId="a" name="High"     fill="#f97316" />
                <Bar dataKey="medium"   stackId="a" name="Medium"   fill="#94a3b8" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mx-5 mb-5 mt-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Chart Interpretation Guide</p>
            <div className="divide-y divide-slate-200">
              {[
                { title: 'Apr 07 — Domain Spoofing Spike (3 triggers)', detail: 'First coordinated BEC attempt: nexus-institutional.com.cn targeting nexusinstitutional.com. Two High + one Medium trigger fired at Layer 2. Wire of $3.8M held.' },
                { title: 'Apr 17 — Critical Alert (5 triggers, 1 Critical)', detail: 'CEO impersonation targeting Garrison Capital ($8.7M Cayman wire). FinCEN 314(b) match. MFA bypassed. FBI referral made.' },
                { title: 'Apr 23–30 — Sustained Escalation (4–8 triggers/day)', detail: 'Multi-wave attack pattern: legal settlement impersonation ($5.1M), vendor account-change ($890K), M&A domain spoofing ($2.3M).' },
                { title: 'May 01 — Critical Surge (14 triggers · 4 Critical · 6 High · 4 Medium)', detail: 'Three simultaneous attacks: TR-8842 ($14.5M BEC), CU-4419 (MT542 dormancy), PR-9102 (synthetic ID ring). All held before Layer 4.' },
              ].map((ev, i) => (
                <div key={i} className="flex gap-3 py-3">
                  <div>
                    <div className="text-[11px] font-bold text-slate-700 mb-1">{ev.title}</div>
                    <div className="text-[10px] text-slate-500 leading-relaxed">{ev.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom grid: Alert Queue + Agent Health */}
        <div className="grid grid-cols-5 gap-4">

          {/* Executive Alert Queue */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Executive Alert Queue</h2>
                <p className="text-[10px] text-gray-400 mt-0.5">{productLabel} · {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredAlerts.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">No alerts for this product line</div>
              ) : filteredAlerts.map(alert => (
                <div key={alert.id} className={clsx('p-4 border-l-4', alert.sev === 'critical' ? 'border-l-red-500' : 'border-l-amber-500')}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400 font-mono">→ {alert.to}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{alert.time}</span>
                  </div>
                  <div className={clsx('text-xs font-semibold leading-snug mb-1', alert.sev === 'critical' ? 'text-red-700' : 'text-amber-700')}>
                    {alert.subject}
                  </div>
                  <div className="text-[10px] text-gray-500 leading-relaxed mb-2 line-clamp-2">{alert.preview}</div>
                  <div className="flex flex-wrap gap-1">
                    {alert.tags.map(t => (
                      <span key={t} className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded border', alert.sev === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Front-line Agent Health */}
          <div className="col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Front-line Agent Health</h2>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{overviewAgents.length} primary agents</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {overviewAgents.map(agent => {
                const accent = AGENT_ACCENT[agent.id]
                return (
                  <div key={agent.id} className={clsx('rounded-xl border p-3.5', accent.bg, accent.border)}>
                    <div className={clsx('text-xs font-bold leading-tight mb-0.5', accent.text)}>{agent.name}</div>
                    <div className="text-[10px] text-gray-400 mb-3">{agent.model}</div>
                    <div className="mb-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] text-gray-400">Precision</span>
                        <span className={clsx('text-[10px] font-bold font-mono', accent.text)}>{agent.precision.toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-white rounded-full overflow-hidden border border-gray-200">
                        <div className={clsx('h-1 rounded-full', accent.bar)} style={{ width: `${agent.precision}%` }} />
                      </div>
                    </div>
                    <div className="text-[9px] text-gray-400 mt-2">
                      {activeProduct === 'all' ? agent.decisionsToday : Math.round(agent.decisionsToday * PRODUCT_SCALE[activeProduct])} decisions today
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
