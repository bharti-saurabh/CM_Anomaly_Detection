import { useState } from 'react'
import clsx from 'clsx'
import {
  AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Mail, CreditCard, ShieldCheck, Zap, Network,
  Eye, EyeOff, Clock, Globe, User, Link,
} from 'lucide-react'
import { BEC_CASES } from '../data/becCases'
import { AGENTS } from '../data/agents'

// ── Attack timeline steps ─────────────────────────────────────────────────────

const ATTACK_STEPS = [
  {
    day: 'Stage 1',
    actor: 'Attacker',
    title: 'Registers lookalike domain',
    detail: 'nexusinstitutional-llc.com registered — 1 character from client\'s real domain. Standard controls do exact-match lookups only.',
    traditional: 'Not on any blocklist. Domain lookup: pass.',
    missed: 'Domain age: 11 days. Edit distance: 1. Lookalike of nexusinstitutional.com.',
    icon: Globe,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  {
    day: 'Stage 2',
    actor: 'Attacker',
    title: 'Monitors email thread',
    detail: 'Attacker intercepts or spoofs an ongoing wire transfer discussion. Studies tone, names, and language of legitimate participants.',
    traditional: 'No system monitors inbound email tone or authorship against a sender baseline.',
    missed: 'Writing style will differ from 90-day baseline. Urgency and override phrases will be present.',
    icon: Eye,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    day: 'Stage 3',
    actor: 'Attacker',
    title: 'Sends spoofed email',
    detail: '"Please update the beneficiary account for today\'s settlement — urgent, board approval required." DKIM passes on the spoofed domain.',
    traditional: 'Spam filter: pass. DKIM: pass (on attacker\'s domain). No urgency classifier running.',
    missed: 'Style match: 23% vs. 90-day baseline. 4 urgency phrases. 2 override phrases. Domain 11 days old.',
    icon: Mail,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  {
    day: 'Stage 4',
    actor: 'Victim',
    title: 'Submits wire instruction',
    detail: '$2.3M Fedwire to new beneficiary in Cayman Islands. Submitted off-hours on a new device. Self-approved — dual auth bypassed.',
    traditional: 'Amount within single-transaction limit. Dual-auth checkbox ticked. OFAC: clear.',
    missed: 'New beneficiary. Amount 14× historical avg. New device. Off-hours. 4-min gap from email receipt. Self-approved.',
    icon: CreditCard,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  {
    day: 'Stage 5',
    actor: 'System',
    title: 'Payment executes',
    detail: 'Without cross-channel correlation, each silo passed the instruction. $2.3M exits. Recovery rate for BEC wires: <15%.',
    traditional: 'Wire released. SAR filed 72 hours later after manual review.',
    missed: 'All five signals were present and individually sub-threshold. Correlation across email + payment + identity + network would have blocked it.',
    icon: XCircle,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
  },
]

// ── Detection gaps ────────────────────────────────────────────────────────────

const GAPS = [
  {
    icon: Globe,
    signal: 'Domain lookalike',
    why: 'Banks use exact-match blocklists. Attackers register variants 1–2 chars away from a legitimate domain — these pass cleanly.',
    how: 'Email NLP Screener computes edit distance against every known client domain on arrival. Domains < 20 days old trigger automatic hold.',
    layer: 'L1',
    precision: '93.5%',
  },
  {
    icon: User,
    signal: 'Writing style shift',
    why: 'Spam filters scan for known-bad phrases. They have no sender baseline — so a spoofed email that sounds "plausible" always passes.',
    how: 'Style consistency model trained on 90-day per-sender email corpus. Score < 55% triggers NLP agent flag before payment system is touched.',
    layer: 'L1',
    precision: '91.8% recall',
  },
  {
    icon: Clock,
    signal: 'Cross-channel timing',
    why: 'Email and payment systems are siloed. A wire submitted 4 minutes after a spoofed email is invisible to either system individually.',
    how: 'Event correlation engine joins email receipt timestamp with payment submission across systems. Gap < 10 min + new beneficiary = automatic L2 trigger.',
    layer: 'L2',
    precision: '96.8%',
  },
  {
    icon: AlertTriangle,
    signal: '"Anomalous for this client"',
    why: 'Generic threshold rules (e.g., >$1M) miss contextual anomalies. $200K is routine for one client and catastrophic for another.',
    how: 'BEC Wire Detector maintains per-client historical distribution. Amount deviation > 3σ triggers regardless of absolute size.',
    layer: 'L2',
    precision: '94.2% recall',
  },
  {
    icon: Link,
    signal: 'New beneficiary + urgency combo',
    why: 'Each flag is individually low-risk. Compliance systems evaluate them in isolation — the compound signal is never computed.',
    how: 'Multi-flag compound rule: new beneficiary + urgency phrases + new device = critical escalation. No single threshold needed.',
    layer: 'L2–L3',
    precision: '98.4% confidence',
  },
  {
    icon: EyeOff,
    signal: 'Off-hours + new device + new account',
    why: 'Identity, payment, and email systems don\'t share signals. Each system sees one flag — below its own threshold.',
    how: 'Session & Identity Guard correlates login anomalies with payment submissions in real time. Three-signal compound = immediate hold.',
    layer: 'L1–L3',
    precision: '94.7%',
  },
]

// ── Pipeline layer details (for the expandable panel) ────────────────────────

const c0 = BEC_CASES[0]
const c5 = BEC_CASES[5]
const c1 = BEC_CASES[1]

const openCases = BEC_CASES.filter(c => c.status === 'blocked' || c.status === 'flagged')
const sarCount  = BEC_CASES.filter(c => c.outcome.sarFiled).length

const LAYER_DETAILS = [
  {
    num: 1,
    title: 'Pre-Instruction',
    subtitle: 'Email & session forensics before any payment instruction is submitted',
    icon: Mail,
    color: 'amber',
    signals: [
      'Domain age check — flags domains < 30 days old against known client domains',
      'DKIM / SPF / DMARC validation on every inbound email',
      'Lookalike domain detection — edit distance ≤ 2 from any registered client domain',
      'NLP writing style consistency — BERT embeddings vs. 90-day per-sender baseline',
      'Urgency, secrecy, and authority-override phrase detection',
      'UEBA session baseline — login location, device fingerprint, time-of-day pattern',
    ],
    agents: AGENTS.filter(a => ['email-nlp-screener', 'session-identity-guard'].includes(a.id)),
    example: {
      caseId: c0.id,
      client: c0.relationship.clientName,
      caught: `Domain ${c0.email.senderAddress.split('@')[1]} (age ${c0.email.senderDomainAgeDays}d) — edit distance 1 from ${c0.email.legitimateDomain}. Style match ${Math.round(c0.nlpAnalysis.writingStyleConsistency * 100)}%. ${c0.nlpAnalysis.urgencyPhrases.length} urgency phrases detected.`,
      without: 'Payment instruction would have reached L2 with no prior email risk context. L2 alone would have flagged amount but not the social engineering vector.',
    },
    firing: false,
    count: 2,
    countLabel: 'pre-signals active',
  },
  {
    num: 2,
    title: 'Instruction Arrival',
    subtitle: 'Wire pattern and payment anomaly detection at the moment of submission',
    icon: Zap,
    color: 'red',
    signals: [
      'New beneficiary flag — first-time payee or payee not seen in last 90 days',
      'Amount outlier ML — per-client Gaussian model, flags > 2σ deviation',
      'Round-number flag — exact round amounts correlated with structuring',
      'Off-hours submission detection — outside client\'s normal payment window',
      'Self-approval flag — submitter and approver are the same user ID',
      'Cross-channel timing — wire submitted < 15 min after email from new sender',
    ],
    agents: AGENTS.filter(a => ['bec-wire-detector', 'email-nlp-screener'].includes(a.id)),
    example: {
      caseId: c5.id,
      client: c5.relationship.clientName,
      caught: `$${(c5.instruction.amount / 1_000_000).toFixed(1)}M to new beneficiary in ${c5.instruction.beneficiaryCountry} — ${c5.instruction.amountDeviationFactor}× historical avg. Submitted off-hours. Self-approved. Correlated with L1 email flag.`,
      without: 'Each flag individually below threshold. Without L1 email context, amount anomaly alone would have triggered a review — not an automatic block.',
    },
    firing: true,
    count: openCases.length,
    countLabel: 'FIRING NOW',
  },
  {
    num: 3,
    title: 'Authorization Stage',
    subtitle: 'Maker-checker integrity and counterparty due diligence',
    icon: ShieldCheck,
    color: 'amber',
    signals: [
      'Dual-auth enforcement — flags when approver and submitter share credentials or roles',
      'RM consultation check — high-value new beneficiaries require relationship manager sign-off',
      'Control override alert — any bypass of standard approval workflow',
      'Counterparty risk score — combines beneficiary country risk, bank SWIFT status, fraud registry',
      'Multi-flag compound rule — 3+ flags from L1/L2 triggers automatic hold pending dual review',
      'Approval workflow timing — unusually fast approvals (< 5 min) correlated with fraud',
    ],
    agents: AGENTS.filter(a => ['counterparty-risk-engine', 'session-identity-guard'].includes(a.id)),
    example: {
      caseId: c1.id,
      client: c1.relationship.clientName,
      caught: `Approval workflow: ${c1.instruction.approvalWorkflowMinutes} min — below 5-min threshold. Self-approved: ${c1.instruction.selfApproved}. Beneficiary country risk: ${c1.externalIntel.beneficiaryBankCountryRisk.split('—')[0].trim()}. Dual-auth not followed.`,
      without: 'Without counterparty risk scoring, the instruction would have passed dual-auth check by checkbox. The 4-minute approval window is invisible to standard controls.',
    },
    firing: false,
    count: 3,
    countLabel: 'pending auth review',
  },
  {
    num: 4,
    title: 'Payment Execution',
    subtitle: 'Last line of defence — velocity and settlement monitoring at the wire level',
    icon: CreditCard,
    color: 'emerald',
    signals: [
      'Velocity anomaly scoring — unusual burst of instructions from one client or channel',
      'SWIFT GPI tracking — real-time correspondent bank status and country risk',
      'Structuring detection — multiple below-threshold payments to same beneficiary',
      'MT540/542 settlement sentinel — custody-specific settlement anomaly patterns',
      'Batch wire scan — automated review of all SWIFT/Fedwire/ACH batches before release',
      'Hold queue integration — flagged instructions parked here, not released until cleared',
    ],
    agents: AGENTS.filter(a => ['velocity-monitor', 'sanctions-scanner'].includes(a.id)),
    example: {
      caseId: 'ALL CURRENT CASES',
      client: 'All clients',
      caught: `${openCases.length + 4} flagged instructions held at L2/L3 — none reached L4. Payment execution layer currently shows 0 fraudulent executions.`,
      without: 'L4 is the last opportunity before funds leave the bank. BEC recovery rate after execution is < 15%. L4 being clean today means earlier layers are doing their job.',
    },
    firing: false,
    count: 0,
    countLabel: '✓ Clean — 0 executions',
  },
  {
    num: 5,
    title: 'Network Intelligence',
    subtitle: 'Post-detection: cross-client graph analysis, SAR automation, regulatory reporting',
    icon: Network,
    color: 'purple',
    signals: [
      'Cross-client beneficiary graph — shared beneficiary accounts across client base reveal mule networks',
      'AML typology classification — maps each case to FinCEN BEC typology (BEC-1A through BEC-5C)',
      'SAR auto-trigger — cases meeting FinCEN thresholds generate draft SAR within 24h',
      'OFAC / SDN real-time screening — beneficiary and IP checked on every instruction',
      'FinCEN 314(b) matching — cooperative information sharing with other financial institutions',
      'Synthetic identity detection — cross-references identity signals against known fraud patterns',
    ],
    agents: AGENTS.filter(a => ['sanctions-scanner', 'aml-typology-classifier', 'synthetic-id-detector'].includes(a.id))
      .slice(0, 2),
    example: {
      caseId: c5.id,
      client: c5.relationship.clientName,
      caught: `FinCEN 314(b) match on beneficiary. OFAC: ${c5.externalIntel.ofacMatch ? 'MATCH' : 'clear'}. SWIFT Controls Alert. AML typology: BEC-3A. SAR filed: ${c5.outcome.sarFiled}. Network graph links beneficiary account to 2 other flagged cases.`,
      without: 'Without automated SAR generation and network graph analysis, typology patterns across clients are invisible. Manual SAR filing takes 3–5 days — regulatory deadlines missed.',
    },
    firing: false,
    count: sarCount,
    countLabel: 'SARs filed / pending',
  },
]

// ── Color maps ────────────────────────────────────────────────────────────────

const COLOR: Record<string, { bg: string; border: string; text: string; badge: string; badgeText: string; dot: string; header: string; headerText: string }> = {
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   badge: 'bg-amber-100',   badgeText: 'text-amber-700',   dot: 'bg-amber-500',   header: 'bg-amber-50',   headerText: 'text-amber-800'   },
  red:     { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     badge: 'bg-red-100',     badgeText: 'text-red-700',     dot: 'bg-red-500',     header: 'bg-red-50',     headerText: 'text-red-800'     },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100', badgeText: 'text-emerald-700', dot: 'bg-emerald-500', header: 'bg-emerald-50', headerText: 'text-emerald-800' },
  purple:  { bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700',  badge: 'bg-purple-100',  badgeText: 'text-purple-700',  dot: 'bg-purple-500',  header: 'bg-purple-50',  headerText: 'text-purple-800'  },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AttackTimeline() {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-900 px-6 py-4">
        <div className="text-sm font-bold text-white mb-0.5">How a BEC Attack Unfolds</div>
        <div className="text-xs text-gray-400">Anatomy of a $2.3M business email compromise — each step shows what traditional controls see vs. what they miss</div>
      </div>

      {/* Timeline steps */}
      <div className="divide-y divide-gray-100">
        {ATTACK_STEPS.map((step, i) => {
          const Icon = step.icon
          const open = expanded === i
          return (
            <div key={i}>
              <button
                onClick={() => setExpanded(open ? null : i)}
                className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Step number */}
                  <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center shrink-0 border', step.bgColor, step.borderColor)}>
                    <Icon className={clsx('w-4 h-4', step.color)} />
                  </div>

                  {/* Day + actor badge */}
                  <div className="flex items-center gap-2 shrink-0 w-40">
                    <span className="text-[10px] font-mono font-bold text-gray-400">{step.day}</span>
                    <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded border', step.bgColor, step.borderColor, step.color)}>
                      {step.actor}
                    </span>
                  </div>

                  {/* Title + detail */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800">{step.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">{step.detail}</div>
                  </div>

                  {/* Expand chevron */}
                  <div className="shrink-0 text-gray-300">
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              {open && (
                <div className="px-6 pb-5 pt-1 bg-gray-50 border-t border-gray-100">
                  <div className="ml-12 grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest">Traditional controls</span>
                      </div>
                      <p className="text-xs text-red-800 leading-relaxed">{step.traditional}</p>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">What Vigil detects</span>
                      </div>
                      <p className="text-xs text-blue-800 leading-relaxed">{step.missed}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 px-6 py-3 flex items-center gap-3">
        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-xs text-gray-300">
          Without cross-channel correlation, every silo passed this instruction. BEC wire recovery rate after execution: <strong className="text-red-300">&lt;15%</strong>.
          The only reliable defence is blocking before the wire leaves.
        </span>
      </div>
    </div>
  )
}

function DetectionGapGrid() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-800">The Detection Gap — Six Signals Routinely Missed</h2>
        <p className="text-xs text-gray-400 mt-0.5">Click any card to see how Vigil addresses it</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {GAPS.map((g, i) => {
          const Icon = g.icon
          const isOpen = open === i
          return (
            <button
              key={i}
              onClick={() => setOpen(isOpen ? null : i)}
              className={clsx(
                'text-left rounded-xl border p-4 transition-all duration-200',
                isOpen
                  ? 'border-blue-400 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', isOpen ? 'bg-blue-100' : 'bg-gray-100')}>
                  <Icon className={clsx('w-4 h-4', isOpen ? 'text-blue-600' : 'text-gray-500')} />
                </div>
                <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded border', isOpen ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-gray-100 border-gray-200 text-gray-500')}>
                  {g.layer}
                </span>
              </div>

              <div className={clsx('text-xs font-bold mb-1.5', isOpen ? 'text-blue-800' : 'text-gray-800')}>{g.signal}</div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{g.why}</p>

              {isOpen && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <CheckCircle className="w-3 h-3 text-blue-500" />
                    <span className="text-[10px] font-bold text-blue-700">How Vigil catches it</span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">{g.how}</p>
                  <div className="mt-2 text-[10px] font-mono font-bold text-blue-600">{g.precision}</div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function InteractivePipeline() {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-800">5-Layer Fraud Checkpoint Pipeline</h2>
        <p className="text-xs text-gray-400 mt-0.5">Click any layer to see signals monitored, agents active, and a real catch from today's cases</p>
      </div>

      {/* Pipeline header bar */}
      <div className="bg-blue-600 rounded-t-xl px-5 py-3 flex items-center justify-between">
        <div className="text-xs font-bold text-white">Every instruction screened through all 5 layers automatically · Real-Time Status</div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/15 border border-white/30 rounded-full">
          <span className="w-2 h-2 rounded-full bg-red-300 shadow-[0_0_6px_rgba(255,100,100,0.8)] animate-pulse" />
          <span className="text-[10px] font-bold text-red-100">Layer 2 FIRING NOW</span>
        </div>
      </div>

      {/* Layer cards */}
      <div className="grid grid-cols-5 border border-t-0 border-gray-200 rounded-b-none overflow-hidden">
        {LAYER_DETAILS.map(layer => {
          const Icon = layer.icon
          const col = COLOR[layer.color] ?? COLOR.amber
          const isSelected = selected === layer.num
          return (
            <button
              key={layer.num}
              onClick={() => setSelected(isSelected ? null : layer.num)}
              className={clsx(
                'border-r last:border-r-0 border-gray-200 p-4 text-left transition-all duration-200',
                isSelected ? clsx(col.bg, col.border, 'border-b-0') : 'bg-white hover:bg-gray-50',
                layer.firing && !isSelected && 'bg-red-50',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Layer {layer.num}</span>
                {layer.firing
                  ? <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.6)] animate-pulse" />
                  : <span className={clsx('w-2 h-2 rounded-full', col.dot)} />
                }
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className={clsx('w-3.5 h-3.5', col.text)} />
                <div className="text-xs font-bold text-gray-800 leading-tight">{layer.title}</div>
              </div>

              <div className={clsx('text-xl font-bold font-mono mb-0.5', col.text)}>{layer.count}</div>
              <div className={clsx('text-[9px] font-semibold', layer.firing ? 'text-red-500' : layer.count === 0 ? 'text-emerald-600' : 'text-gray-400')}>
                {layer.countLabel}
              </div>

              <div className={clsx('mt-3 text-[9px] font-semibold flex items-center gap-1', col.text)}>
                {isSelected ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {isSelected ? 'Hide detail' : 'See detail'}
              </div>
            </button>
          )
        })}
      </div>

      {/* Expanded detail panel */}
      {selected !== null && (() => {
        const layer = LAYER_DETAILS.find(l => l.num === selected)!
        const col = COLOR[layer.color] ?? COLOR.amber
        return (
          <div className={clsx('border border-t-0 rounded-b-xl p-5 transition-all', col.bg, col.border)}>
            <div className="grid grid-cols-3 gap-5">

              {/* Signals */}
              <div>
                <div className={clsx('text-[10px] font-bold uppercase tracking-widest mb-2', col.text)}>Signals monitored at Layer {layer.num}</div>
                <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">{layer.subtitle}</p>
                <ul className="space-y-1.5">
                  {layer.signals.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className={clsx('w-3 h-3 mt-0.5 shrink-0', col.text)} />
                      <span className="text-[11px] text-gray-700 leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Agents */}
              <div>
                <div className={clsx('text-[10px] font-bold uppercase tracking-widest mb-2', col.text)}>Agents active at this layer</div>
                {layer.agents.length > 0 ? (
                  <div className="space-y-2">
                    {layer.agents.map(agent => (
                      <div key={agent.id} className="bg-white rounded-lg border border-gray-200 p-3">
                        <div className="text-xs font-bold text-gray-800 mb-1">{agent.name}</div>
                        <div className="text-[10px] text-gray-400 mb-2 leading-relaxed">{agent.description}</div>
                        <div className="flex gap-3 text-[10px] font-mono">
                          <span className="text-emerald-600 font-bold">P {agent.precision}%</span>
                          <span className="text-blue-600 font-bold">R {agent.recall}%</span>
                          <span className="text-gray-400">{agent.decisionsToday} decisions today</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-400">Network intelligence agents — see Agent Monitor for details</div>
                )}
              </div>

              {/* Real catch + counterfactual */}
              <div>
                <div className={clsx('text-[10px] font-bold uppercase tracking-widest mb-2', col.text)}>Real catch — today's cases</div>
                <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-bold text-gray-600">{layer.example.caseId}</span>
                    <span className="text-[9px] text-gray-400">{layer.example.client}</span>
                  </div>
                  <p className="text-[11px] text-gray-700 leading-relaxed">{layer.example.caught}</p>
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <XCircle className="w-3 h-3 text-red-500" />
                    <span className="text-[10px] font-bold text-red-700">Without this layer</span>
                  </div>
                  <p className="text-[11px] text-red-800 leading-relaxed">{layer.example.without}</p>
                </div>
              </div>

            </div>
          </div>
        )
      })()}

      {/* Reconciliation footer */}
      <div className="mt-0 bg-blue-50 border border-t-0 border-blue-200 rounded-b-xl px-4 py-2.5 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-blue-900">Reconciliation:</span>
        <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-semibold rounded">{openCases.length + 4} Active Triggers</span>
        <span className="text-[10px] text-blue-700">= L2: {openCases.length} open + 4 auto-cleared</span>
        <span className="text-blue-300">|</span>
        <span className="px-2 py-0.5 bg-amber-600 text-white text-[10px] font-semibold rounded">{openCases.length} Open Cases</span>
        <span className="text-[10px] text-blue-700">= analyst work items requiring review</span>
        <span className="text-blue-300">|</span>
        <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-semibold rounded">L4: 0 executions — money safe</span>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function Capabilities() {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-6xl mx-auto space-y-8">

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Platform Capabilities</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              How BEC fraud enters financial institutions · What signals get missed · How Vigil closes the gap
            </p>
          </div>
          <div className="text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 px-3 py-1.5 rounded-full">
            Based on FinCEN BEC Typology Advisory · May 2026
          </div>
        </div>

        {/* Stat bar */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'BEC losses globally (2025)', value: '$2.9B', sub: 'FBI IC3 report', color: 'text-red-600' },
            { label: 'Avg time-to-detection', value: '72 hrs', sub: 'Traditional controls', color: 'text-amber-600' },
            { label: 'Vigil detection latency', value: '< 90s', sub: 'From email receipt to hold', color: 'text-blue-600' },
            { label: 'Recovery rate after execution', value: '< 15%', sub: 'Industry average for BEC wires', color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{s.label}</div>
              <div className={clsx('text-2xl font-bold font-mono mb-0.5', s.color)}>{s.value}</div>
              <div className="text-[10px] text-gray-400">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Section 1: Attack timeline */}
        <AttackTimeline />

        {/* Section 2: Detection gap grid */}
        <DetectionGapGrid />

        {/* Section 3: Interactive pipeline */}
        <InteractivePipeline />

      </div>
    </div>
  )
}
