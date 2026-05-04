import { ComposedChart, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import clsx from 'clsx'
import { AGENTS } from '../data/agents'
import { TIME_SERIES } from '../data/timeSeries'
import { BEC_CASES } from '../data/becCases'

// ── Derived metrics from live data ────────────────────────────────────────────

const AUTO_CLEARED       = 4   // agent-resolved, no human case created
const openCases          = BEC_CASES.filter(c => c.status === 'blocked' || c.status === 'flagged')
const criticalCount      = openCases.filter(c => c.severity === 'critical').length
const highCount          = openCases.filter(c => c.severity === 'high').length
const mediumCount        = openCases.filter(c => c.severity === 'medium').length
const totalDecisions     = AGENTS.reduce((s, a) => s + a.decisionsToday, 0)   // 935
const blockedRisk        = BEC_CASES
  .filter(c => c.status === 'blocked')
  .reduce((s, c) => s + c.instruction.amount, 0)
const sarCount           = BEC_CASES.filter(c => c.outcome.sarFiled).length
const overviewAgents     = AGENTS.filter(a => a.showInOverview)

// ── Agent accent colours (front-line) ─────────────────────────────────────────

const AGENT_ACCENT: Record<string, { dot: string; text: string; bg: string; bar: string; border: string }> = {
  'bec-wire-detector':        { dot: 'bg-violet-500', text: 'text-violet-600', bg: 'bg-violet-50', bar: 'bg-violet-500', border: 'border-violet-200' },
  'email-nlp-screener':       { dot: 'bg-sky-500',    text: 'text-sky-600',    bg: 'bg-sky-50',    bar: 'bg-sky-500',    border: 'border-sky-200'    },
  'sanctions-scanner':        { dot: 'bg-rose-500',   text: 'text-rose-600',   bg: 'bg-rose-50',   bar: 'bg-rose-500',   border: 'border-rose-200'   },
  'session-identity-guard':   { dot: 'bg-amber-500',  text: 'text-amber-600',  bg: 'bg-amber-50',  bar: 'bg-amber-500',  border: 'border-amber-200'  },
  'counterparty-risk-engine': { dot: 'bg-teal-500',   text: 'text-teal-600',   bg: 'bg-teal-50',   bar: 'bg-teal-500',   border: 'border-teal-200'   },
  'velocity-monitor':         { dot: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-500', border: 'border-orange-200' },
}

// ── Executive Alert Queue — top 3 cases from live BEC_CASES ──────────────────

const ALERT_QUEUE = [
  {
    id: BEC_CASES[0].signalId ?? BEC_CASES[0].id,
    client: BEC_CASES[0].relationship.clientName,
    subject: `🚨 CRITICAL: $${(BEC_CASES[0].instruction.amount / 1_000_000).toFixed(1)}M Wire Hold — BEC / CEO Impersonation [${BEC_CASES[0].signalId ?? BEC_CASES[0].id}]`,
    preview: `Domain ${BEC_CASES[0].email.senderAddress} proximate to ${BEC_CASES[0].email.legitimateDomain} (age ${BEC_CASES[0].email.senderDomainAgeDays}d). NLP score ${BEC_CASES[0].nlpAnalysis.urgencyPhrases.length * 23}. Self-approved. SAR filed.`,
    time: BEC_CASES[0].createdAt.slice(11),
    to: 'Head of Risk + FCC Lead',
    sev: 'critical' as const,
    tags: ['Auto-Generated', 'Layer 2', 'SAR Filed'],
  },
  {
    id: BEC_CASES[5].id,
    client: BEC_CASES[5].relationship.clientName,
    subject: `🚨 CRITICAL: $${(BEC_CASES[5].instruction.amount / 1_000_000).toFixed(1)}M Cayman Wire — FinCEN Match + SWIFT Controls Flag [${BEC_CASES[5].id}]`,
    preview: `Domain ${BEC_CASES[5].email.senderAddress} (${BEC_CASES[5].email.senderDomainAgeDays}d old). MFA bypassed. Login from ${BEC_CASES[5].identity.loginLocation} (expected ${BEC_CASES[5].identity.expectedLocation}). FinCEN 314(b) match on beneficiary.`,
    time: BEC_CASES[5].createdAt.slice(11),
    to: 'Financial Crimes + Legal',
    sev: 'critical' as const,
    tags: ['FinCEN Match', 'Layer 2', 'FBI Referral'],
  },
  {
    id: BEC_CASES[1].id,
    client: BEC_CASES[1].relationship.clientName,
    subject: `⚠ HIGH: $${(BEC_CASES[1].instruction.amount / 1_000_000).toFixed(1)}M M&A Settlement — Domain Spoofing Detected [${BEC_CASES[1].id}]`,
    preview: `From ${BEC_CASES[1].email.senderAddress} (expected ${BEC_CASES[1].email.legitimateDomain}). Domain ${BEC_CASES[1].email.senderDomainAgeDays}d old. SWIFT Controls flagged. Correspondent banking review initiated.`,
    time: BEC_CASES[1].createdAt.slice(11),
    to: 'Arjun K. (Analyst)',
    sev: 'high' as const,
    tags: ['Domain Alert', 'Case Pre-Loaded'],
  },
]

// ── Pipeline layer definitions ────────────────────────────────────────────────

const PIPELINE_LAYERS = [
  {
    num: 1, title: 'Pre-Instruction',
    agents: ['Insider Threat Monitor', 'Session & Identity Guard', 'Regulatory Threshold Monitor'],
    techniques: ['UEBA Behavioural Baseline', 'Dark Web Feed Monitor', 'Credential Anomaly Detection', 'Breach Feed Alert'],
    products: ['All Products'],
    count: 2, countLabel: 'pre-signals active',
    note: '2 session anomalies flagged overnight. Pre-attack — not yet in KPI count.',
    accent: { bg: 'bg-white', border: 'border-gray-200', top: '', dot: 'bg-amber-500', num: 'text-amber-600', tag: 'bg-amber-50 border-amber-200 text-amber-700' },
    firing: false,
  },
  {
    num: 2, title: 'Instruction Arrival',
    agents: ['BEC Wire Detector', 'Email NLP Screener'],
    techniques: ['Domain Proximity Score', 'NLP Urgency Classifier', 'New Beneficiary Detect', 'Amount Outlier ML'],
    products: ['SWIFT', 'Fedwire', 'ACH'],
    count: openCases.length, countLabel: 'FIRING NOW',
    note: `→ ${openCases.length + AUTO_CLEARED} KPI triggers: ${openCases.length} open cases + ${AUTO_CLEARED} auto-cleared by agents.`,
    accent: { bg: 'bg-red-50', border: 'border-red-200', top: 'border-t-2 border-t-red-500', dot: 'bg-red-500', num: 'text-red-600', tag: 'bg-red-50 border-red-200 text-red-700' },
    firing: true,
  },
  {
    num: 3, title: 'Authorization Stage',
    agents: ['Maker-Checker Auditor', 'Counterparty Risk Engine'],
    techniques: ['Multi-Flag Compound', 'RM Bypass Detect', 'Dual-Auth Enforcer', 'Control Override Alert'],
    products: ['All Products'],
    count: 3, countLabel: 'pending auth review',
    note: '3 open cases awaiting second authorizer. Maker-checker segregation validated.',
    accent: { bg: 'bg-white', border: 'border-gray-200', top: '', dot: 'bg-amber-500', num: 'text-amber-600', tag: 'bg-amber-50 border-amber-200 text-amber-700' },
    firing: false,
  },
  {
    num: 4, title: 'Payment Execution',
    agents: ['Velocity Monitor', 'Custody Settlement Sentinel'],
    techniques: ['Velocity Anomaly Scoring', 'SWIFT GPI Tracking', 'Structuring Detection', 'Settlement Sentinel MT540+'],
    products: ['Treasury', 'Custody', 'Wealth'],
    count: 0, countLabel: '✓ Clean — no executions',
    note: `All ${openCases.length + AUTO_CLEARED} flagged instructions held before reaching this layer. Money is safe.`,
    accent: { bg: 'bg-emerald-50', border: 'border-emerald-200', top: 'border-t-2 border-t-emerald-500', dot: 'bg-emerald-500', num: 'text-emerald-600', tag: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    firing: false,
  },
  {
    num: 5, title: 'Network Intelligence',
    agents: ['AML Typology Classifier', 'Sanctions & OFAC Scanner', 'Synthetic Identity Detector'],
    techniques: ['Cross-Client Beneficiary Graph', 'AML Typology Classification', 'SAR Auto-Trigger', 'Sanctions Screening'],
    products: ['All Products'],
    count: sarCount, countLabel: 'SARs filed / pending',
    note: `${sarCount} confirmed fraud cases have filed SARs. Network graph analysis complete on shared beneficiary accounts.`,
    accent: { bg: 'bg-white', border: 'border-gray-200', top: '', dot: 'bg-amber-500', num: 'text-amber-600', tag: 'bg-amber-50 border-amber-200 text-amber-700' },
    firing: false,
  },
]

// ── Product filter chips (static — visual context only) ───────────────────────

const PRODUCTS = ['All Products', 'Treasury Services', 'Asset Servicing', 'Corporate Trust', 'Clearance & Collateral', 'Wealth Management', 'Pershing / Wove']

export function Overview() {
  const kpis = [
    {
      emoji: '⚡', label: 'Active Triggers (Today)',
      value: (openCases.length + AUTO_CLEARED).toString(),
      sub: `${criticalCount} critical · ${highCount} high · ${AUTO_CLEARED} auto-cleared`,
      def: `Every rule or ML model that fired on any instruction today. One instruction can fire multiple agent triggers simultaneously. Auto-cleared = resolved by agent without human review.`,
      color: 'text-red-600', topBorder: 'border-t-2 border-t-red-500', badge: 'bg-red-50 border-red-200',
    },
    {
      emoji: '📋', label: 'Open Cases — Needs Human',
      value: openCases.length.toString(),
      sub: `${criticalCount} critical · ${highCount} high · ${mediumCount} medium`,
      def: `Triggers AFRS could not auto-resolve — require analyst judgment. Funnel: ${openCases.length + AUTO_CLEARED} triggers fired → ${AUTO_CLEARED} auto-cleared → ${openCases.length} open cases assigned to analysts.`,
      color: 'text-amber-600', topBorder: 'border-t-2 border-t-amber-500', badge: 'bg-amber-50 border-amber-200',
    },
    {
      emoji: '🤖', label: 'Agent Decisions (Today)',
      value: totalDecisions.toLocaleString(),
      sub: `Across ${AGENTS.length} surveillance agents`,
      def: `Instructions where an agent fired a signal and resolved it automatically without creating a human case. Each unique instruction may generate multiple agent-level decisions across the 12-agent stack.`,
      color: 'text-blue-600', topBorder: 'border-t-2 border-t-blue-500', badge: 'bg-blue-50 border-blue-200',
    },
    {
      emoji: '🛡', label: 'Value Protected (30d)',
      value: `$${(blockedRisk / 1_000_000).toFixed(1)}M`,
      sub: `${BEC_CASES.filter(c => c.status === 'blocked').length} confirmed-fraud wires held`,
      def: `Sum of held transaction amounts confirmed as fraudulent. Includes only "blocked" cases where fraud was confirmed — excludes cases still under investigation.`,
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
            {PRODUCTS.map((p, i) => (
              <div key={p} className={clsx(
                'text-[11px] font-medium px-3 py-1 rounded-full border cursor-default',
                i === 0
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              )}>
                {p}
              </div>
            ))}
          </div>
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

        {/* 5-Layer Pipeline */}
        <div className="border-2 border-blue-600 rounded-xl overflow-hidden">
          {/* Pipeline header */}
          <div className="bg-blue-600 px-5 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">🛡 5-Layer Fraud Checkpoint Pipeline</div>
              <div className="text-[10px] text-blue-200 mt-0.5">Every instruction screened through all 5 layers automatically · Real-Time Status</div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/15 border border-white/30 rounded-full">
              <span className="w-2 h-2 rounded-full bg-red-300 shadow-[0_0_6px_rgba(255,100,100,0.8)] animate-pulse" />
              <span className="text-[10px] font-bold text-red-100">Layer 2 FIRING NOW</span>
            </div>
          </div>

          {/* Pipeline cards */}
          <div className="grid grid-cols-5 bg-gray-50">
            {PIPELINE_LAYERS.map(layer => (
              <div key={layer.num} className={clsx('border-r last:border-r-0 border-gray-200 p-4', layer.accent.bg, layer.accent.top)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Layer {layer.num}</span>
                  {layer.firing
                    ? <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.6)] animate-pulse" />
                    : <span className={clsx('w-2 h-2 rounded-full', layer.accent.dot)} />
                  }
                </div>
                <div className="text-xs font-bold text-gray-800 mb-3">{layer.title}</div>

                {/* Techniques */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {layer.techniques.map(t => (
                    <span key={t} className={clsx('text-[8px] font-semibold px-1.5 py-0.5 rounded border', layer.accent.tag)}>
                      {t}
                    </span>
                  ))}
                </div>

                {/* Product scope */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {layer.products.map(p => (
                    <span key={p} className="text-[8px] font-semibold px-1.5 py-0.5 rounded border bg-blue-50 border-blue-200 text-blue-700">
                      {p}
                    </span>
                  ))}
                </div>

                {/* Count */}
                <div className={clsx('text-xl font-bold font-mono mb-0.5', layer.accent.num)}>{layer.count}</div>
                <div className={clsx('text-[9px] font-semibold mb-3', layer.firing ? 'text-red-500' : layer.count === 0 ? 'text-emerald-600' : 'text-gray-400')}>
                  {layer.countLabel}
                </div>

                {/* Note */}
                <div className={clsx('text-[9px] leading-relaxed border-t pt-2', layer.firing ? 'border-red-200 text-gray-500' : 'border-gray-200 text-gray-400')}>
                  {layer.note}
                </div>
              </div>
            ))}
          </div>

          {/* Reconciliation footer */}
          <div className="bg-blue-50 border-t border-blue-200 px-4 py-2.5 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-blue-900">📐 Reconciliation:</span>
            <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-semibold rounded">
              {openCases.length + AUTO_CLEARED} Active Triggers
            </span>
            <span className="text-[10px] text-blue-700">= L2: {openCases.length} open + {AUTO_CLEARED} auto-cleared</span>
            <span className="text-blue-300">|</span>
            <span className="px-2 py-0.5 bg-amber-600 text-white text-[10px] font-semibold rounded">
              {openCases.length} Open Cases
            </span>
            <span className="text-[10px] text-blue-700">= analyst work items requiring review</span>
            <span className="text-blue-300">|</span>
            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-semibold rounded">
              L4: 0 executions — money safe
            </span>
          </div>
        </div>

        {/* 30-Day Anomaly Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">30-Day Anomaly Timeline</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Daily transaction volume (bars) overlaid with ensemble anomaly score (line) — Apr 02 to May 01, 2026
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-gray-400 shrink-0 ml-6">
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-2.5 rounded-sm bg-blue-100 border border-blue-200" /> Daily volume</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 bg-red-400" /> Anomaly score</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0" style={{ borderTop: '1.5px dashed #fb923c' }} /> Warning (40)</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0" style={{ borderTop: '1.5px dashed #ef4444' }} /> Critical (75)</span>
              </div>
            </div>
          </div>
          <div className="px-5 pt-4 pb-2">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={TIME_SERIES} margin={{ top: 8, right: 16, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={4} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={28} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={28} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const vol   = payload.find(p => p.dataKey === 'volume')?.value as number | undefined
                    const score = payload.find(p => p.dataKey === 'avgScore')?.value as number | undefined
                    const count = payload.find(p => p.dataKey === 'anomalyCount')?.value as number | undefined
                    const isToday = label === 'May 01'
                    return (
                      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3.5 py-3 text-xs min-w-[160px]">
                        <div className="font-bold text-gray-800 mb-2">{label}{isToday ? ' — Today' : ''}</div>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-400">Transaction volume</span>
                            <span className="font-mono font-semibold text-blue-600">{vol}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-400">Anomaly score</span>
                            <span className={clsx('font-mono font-bold', score !== undefined && score >= 75 ? 'text-red-600' : score !== undefined && score >= 40 ? 'text-orange-600' : 'text-gray-600')}>{score}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-400">Cases flagged</span>
                            <span className="font-mono font-semibold text-gray-700">{count}</span>
                          </div>
                          {isToday && (
                            <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-red-600 font-semibold">
                              TR-8842 · CU-4419 · PR-9102
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }}
                />
                <Bar yAxisId="left" dataKey="volume" fill="#dbeafe" stroke="#bfdbfe" strokeWidth={0.5} radius={[2, 2, 0, 0]} />
                <ReferenceLine yAxisId="right" y={40} stroke="#fb923c" strokeDasharray="4 3" strokeWidth={1.5}
                  label={{ value: 'Warning', position: 'insideTopRight', fontSize: 9, fill: '#fb923c', fontWeight: 700, dy: -2 }} />
                <ReferenceLine yAxisId="right" y={75} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1.5}
                  label={{ value: 'Critical', position: 'insideTopRight', fontSize: 9, fill: '#ef4444', fontWeight: 700, dy: -2 }} />
                <ReferenceLine yAxisId="left" x="May 01" stroke="#ef4444" strokeWidth={1.5} strokeOpacity={0.5} />
                <Area yAxisId="right" type="monotone" dataKey="avgScore" stroke="#ef4444" strokeWidth={2} fill="url(#scoreGrad)"
                  dot={(props: { cx: number; cy: number; payload: { date: string } }) =>
                    props.payload.date === 'May 01'
                      ? <circle key="dot-today" cx={props.cx} cy={props.cy} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} />
                      : <g key={`empty-${props.cx}`} />
                  }
                  activeDot={{ r: 4, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {/* Narrative strip */}
          <div className="mx-5 mb-5 mt-1 rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100">
            <div className="px-4 py-3 grid grid-cols-4 gap-3 text-[11px]">
              <div>
                <div className="font-bold text-gray-500 mb-0.5">Apr 02–14 · Baseline</div>
                <div className="text-gray-400">Avg score 8 · 0–1 flags/day · all 5 pipeline layers operating normally</div>
              </div>
              <div>
                <div className="font-bold text-amber-600 mb-0.5">Apr 15–20 · First Signals</div>
                <div className="text-gray-400">Score 14–21 · isolated blips; Layer 2 NLP + velocity agents raised low-priority alerts</div>
              </div>
              <div>
                <div className="font-bold text-orange-600 mb-0.5">Apr 21–30 · Escalation</div>
                <div className="text-gray-400">Score 23→69 · 10-day trend crossing warning threshold (40) on Apr 25; 5–8 flags/day</div>
              </div>
              <div className="flex flex-col">
                <div className="font-bold text-red-600 mb-0.5">May 01 · Critical Spike</div>
                <div className="text-gray-400 mb-2">Score 89 · 13 flags · 3 high-value cases escalated</div>
                <div className="flex flex-wrap gap-1 mt-auto">
                  {[
                    { id: 'TR-8842', color: 'bg-red-50 text-red-700 border-red-200' },
                    { id: 'CU-4419', color: 'bg-orange-50 text-orange-700 border-orange-200' },
                    { id: 'PR-9102', color: 'bg-orange-50 text-orange-700 border-orange-200' },
                  ].map(c => (
                    <span key={c.id} className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded-md border', c.color)}>
                      {c.id}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom grid: Alert Queue + Agent Health */}
        <div className="grid grid-cols-5 gap-4">

          {/* Executive Alert Queue */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">Executive Alert Queue</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">Auto-generated from live case data · Sorted by severity</p>
            </div>
            <div className="divide-y divide-gray-100">
              {ALERT_QUEUE.map(alert => (
                <div key={alert.id} className={clsx(
                  'p-4 border-l-4',
                  alert.sev === 'critical' ? 'border-l-red-500' : 'border-l-amber-500'
                )}>
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
                      <span key={t} className={clsx(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded border',
                        alert.sev === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}>
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
                    <div className="text-[9px] text-gray-400 mt-2">{agent.decisionsToday} decisions today</div>
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
