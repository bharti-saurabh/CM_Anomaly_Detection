import { useState, useEffect, useRef } from 'react'
import {
  Mail, CreditCard, Fingerprint, Network, ShieldCheck, Cpu,
  AlertTriangle, Globe, MapPin, Monitor, UserX, Zap, Activity,
  Lock, Clock, Hash, ArrowUpRight,
} from 'lucide-react'
import clsx from 'clsx'
import { BEC_CASES } from '../data/becCases'
import type { BECCase } from '../types'

// ── Agent registry ────────────────────────────────────────────────────────────

const AGENTS = [
  { id: 'email'     as const, name: 'Email Screener',    model: 'NLP / Transformer', icon: Mail,       accent: { dot: 'bg-sky-400',     text: 'text-sky-300',     border: 'border-sky-500/40',     bar: 'bg-sky-500',     line: 'text-sky-200'  } },
  { id: 'payment'   as const, name: 'Payment Anomaly',   model: 'XGBoost Ensemble',  icon: CreditCard,  accent: { dot: 'bg-violet-400',  text: 'text-violet-300',  border: 'border-violet-500/40',  bar: 'bg-violet-500',  line: 'text-violet-200' } },
  { id: 'identity'  as const, name: 'Identity & Session', model: 'Isolation Forest', icon: Fingerprint, accent: { dot: 'bg-amber-400',   text: 'text-amber-300',   border: 'border-amber-500/40',   bar: 'bg-amber-500',   line: 'text-amber-200' } },
  { id: 'graph'     as const, name: 'Relationship Graph', model: 'Graph Neural Net', icon: Network,     accent: { dot: 'bg-emerald-400', text: 'text-emerald-300', border: 'border-emerald-500/40', bar: 'bg-emerald-500', line: 'text-emerald-200' } },
  { id: 'intel'     as const, name: 'Counterparty Intel', model: 'Rules + BERT',     icon: ShieldCheck, accent: { dot: 'bg-rose-400',    text: 'text-rose-300',    border: 'border-rose-500/40',    bar: 'bg-rose-500',    line: 'text-rose-200'  } },
]
type AgentId = typeof AGENTS[number]['id']

// ── Risk entity colours (dark mode, bold) ─────────────────────────────────────

const ENTITY_RISK: Record<string, string> = {
  deadline:    'bg-red-900/70 text-red-200 border border-red-600/60 ring-1 ring-red-500/40',
  amount:      'bg-orange-900/70 text-orange-200 border border-orange-600/60 ring-1 ring-orange-500/40',
  account:     'bg-violet-900/70 text-violet-200 border border-violet-600/60 ring-1 ring-violet-500/40',
  institution: 'bg-blue-900/60 text-blue-200 border border-blue-600/50',
  person:      'bg-slate-700/60 text-slate-200 border border-slate-500/50',
  location:    'bg-teal-900/60 text-teal-200 border border-teal-600/50',
}
const ENTITY_DIM: Record<string, string> = {
  deadline:    'text-slate-500',
  amount:      'text-slate-500',
  account:     'text-slate-500',
  institution: 'text-slate-500',
  person:      'text-slate-500',
  location:    'text-slate-500',
}

// ── Which entity types each agent activates (at which log-line index) ─────────

const ENTITY_ACTIVATIONS: Partial<Record<AgentId, Partial<Record<number, string[]>>>> = {
  email:   { 1: ['deadline'], 2: ['location'], 4: ['person'] },
  payment: { 0: ['amount', 'account'], 2: ['institution'] },
  graph:   { 1: ['institution'] },
}

// ── Signal card type & builder ────────────────────────────────────────────────

interface SCard {
  id: string
  agentId: AgentId
  atLine: number
  Icon: React.FC<{ className?: string }>
  label: string
  value: string
  detail: string
  sev: 'critical' | 'high' | 'medium'
}

const SEV_CARD: Record<SCard['sev'], { border: string; bg: string; icon: string; dot: string; val: string }> = {
  critical: { border: 'border-red-600/50',    bg: 'bg-red-950/60',    icon: 'text-red-400',    dot: 'bg-red-500',    val: 'text-red-200'    },
  high:     { border: 'border-orange-600/50', bg: 'bg-orange-950/60', icon: 'text-orange-400', dot: 'bg-orange-500', val: 'text-orange-200' },
  medium:   { border: 'border-amber-600/50',  bg: 'bg-amber-950/60',  icon: 'text-amber-400',  dot: 'bg-amber-500',  val: 'text-amber-200'  },
}

function buildSignalCards(c: BECCase): SCard[] {
  const { email: e, instruction: i, identity: id, externalIntel: ei, relationship: r, nlpAnalysis: n } = c
  const cards: SCard[] = []

  if (ei.emailDomainIsLookalike)
    cards.push({ id:'domain_lookalike', agentId:'email', atLine:2, Icon:AlertTriangle, label:'Domain Lookalike', value:`${e.senderAddress.split('@')[1]}`, detail:`spoofs ${ei.lookalikeDomain ?? 'known domain'} · ${e.senderDomainAgeDays}d old`, sev:'critical' })

  if (n.urgencyPhrases.length > 0)
    cards.push({ id:'urgency_phrases', agentId:'email', atLine:1, Icon:Zap, label:'Urgency Language', value:`${n.urgencyPhrases.length} phrases detected`, detail:`"${n.urgencyPhrases[0]?.slice(0,38)}"`, sev:'high' })

  if (n.overridePhrases.length > 0)
    cards.push({ id:'override_phrases', agentId:'email', atLine:1, Icon:Lock, label:'Override Request', value:`${n.overridePhrases.length} override phrases`, detail:`"${n.overridePhrases[0]?.slice(0,38)}"`, sev:'critical' })

  if (e.dkim === 'fail' || e.spf === 'fail')
    cards.push({ id:'auth_fail', agentId:'email', atLine:4, Icon:AlertTriangle, label:'Auth Failure', value:`DKIM ${e.dkim.toUpperCase()} · SPF ${e.spf.toUpperCase()} · DMARC ${e.dmarc.toUpperCase()}`, detail:`Sender domain not authenticated`, sev:'high' })

  if (i.amountDeviationFactor > 2)
    cards.push({ id:'amount_anomaly', agentId:'payment', atLine:1, Icon:ArrowUpRight, label:'Amount Anomaly', value:`${i.amountDeviationFactor.toFixed(1)}× client average`, detail:`${i.currency} ${i.amount.toLocaleString()} vs avg ${i.historicalAvg.toLocaleString()}`, sev: i.amountDeviationFactor > 5 ? 'critical' : 'high' })

  if (i.beneficiaryIsNew)
    cards.push({ id:'new_beneficiary', agentId:'payment', atLine:2, Icon:UserX, label:'New Beneficiary', value:i.beneficiaryName.slice(0,28), detail:`${i.beneficiaryCountry} · first occurrence in registry`, sev:'high' })

  if (!i.dualAuthFollowed || i.selfApproved)
    cards.push({ id:'control_bypass', agentId:'payment', atLine:3, Icon:Lock, label:`${i.selfApproved ? 'Self-Approval' : 'Dual-Auth Bypassed'}`, value:`${i.approvalWorkflowMinutes}min approval`, detail:i.selfApproved ? `${i.submittedBy} approved own instruction` : 'Maker-checker control not followed', sev:'critical' })

  if (id.deviceIsNew)
    cards.push({ id:'new_device', agentId:'identity', atLine:1, Icon:Monitor, label:'Unknown Device', value:'New device — not in registry', detail:id.deviceId.slice(0,30), sev:'high' })

  if (id.loginLocation !== id.expectedLocation)
    cards.push({ id:'location_mismatch', agentId:'identity', atLine:2, Icon:MapPin, label:'Location Mismatch', value:id.loginLocation, detail:`expected: ${id.expectedLocation}`, sev:'high' })

  if (id.vpnDetected)
    cards.push({ id:'vpn', agentId:'identity', atLine:3, Icon:Globe, label:'VPN Detected', value:'Anonymous routing active', detail:`Session origin masked`, sev:'medium' })

  if (ei.ipFlagged)
    cards.push({ id:'ip_flagged', agentId:'graph', atLine:4, Icon:AlertTriangle, label:'Flagged IP', value:e.originatingIP, detail:(ei.ipFraudSource ?? '').slice(0,40), sev:'critical' })

  if (!r.typicalCountries.includes(i.beneficiaryCountry))
    cards.push({ id:'new_jurisdiction', agentId:'graph', atLine:3, Icon:Globe, label:'New Jurisdiction', value:i.beneficiaryCountry, detail:`outside baseline: ${r.typicalCountries.join(', ')}`, sev:'high' })

  if (i.submittedOutsideHours)
    cards.push({ id:'off_hours', agentId:'payment', atLine:3, Icon:Clock, label:'Off-Hours Submission', value:i.submittedAt, detail:'Outside normal business hours', sev:'medium' })

  if (ei.swiftControlsFlag)
    cards.push({ id:'swift_flag', agentId:'intel', atLine:2, Icon:Activity, label:'SWIFT Controls Alert', value:'Payment flagged for review', detail:ei.beneficiaryBankCountryRisk.slice(0,40), sev:'high' })

  if (ei.fincenMatch || ei.beneficiaryFraudFlag)
    cards.push({ id:'fraud_network', agentId:'intel', atLine:1, Icon:Hash, label:'Fraud Network Match', value:'Beneficiary flagged', detail:(ei.beneficiaryFraudSource ?? 'FinCEN 314(b) match').slice(0,40), sev:'critical' })

  return cards.slice(0, 10)
}

// ── Agent score computation ───────────────────────────────────────────────────

function computeAgentData(c: BECCase): Record<AgentId, { score: number; lines: string[] }> {
  const { email: e, nlpAnalysis: n, externalIntel: ei, instruction: i, identity: id, relationship: r } = c

  const emailLines = [
    `Loading ${c.relationship.clientName} corpus — ${n.histStyleBaselineSamples} baseline emails`,
    `Urgency: ${n.urgencyPhrases.length} phrases · Secrecy: ${n.secrecyPhrases.length} · Override: ${n.overridePhrases.length}`,
    ei.emailDomainIsLookalike ? `Lookalike domain: ${e.senderAddress.split('@')[1]} ↔ ${ei.lookalikeDomain}` : `Domain ${e.senderAddress.split('@')[1]} — no lookalike`,
    `Style match: ${Math.round(n.writingStyleConsistency * 100)}% — ${n.writingStyleConsistency < 0.55 ? 'anomalous authorship' : 'within range'}`,
    `DKIM ${e.dkim.toUpperCase()} · SPF ${e.spf.toUpperCase()} · DMARC ${e.dmarc.toUpperCase()} · domain ${e.senderDomainAgeDays}d`,
  ]
  let emailScore = 0
  emailScore += Math.min(n.urgencyPhrases.length * 0.11, 0.33)
  emailScore += Math.min(n.overridePhrases.length * 0.14, 0.28)
  emailScore += (1 - n.writingStyleConsistency) * 0.21
  emailScore += ei.emailDomainIsLookalike ? 0.26 : 0
  emailScore += e.senderDomainAgeDays < 90 ? 0.14 : e.senderDomainAgeDays < 180 ? 0.07 : 0
  emailScore += e.dkim === 'fail' ? 0.06 : 0

  const paymentLines = [
    `Instruction: ${i.currency} ${i.amount.toLocaleString()} → ${i.beneficiaryName}`,
    `Amount: ${i.amountDeviationFactor.toFixed(1)}× avg — ${i.amountDeviationFactor > 5 ? 'extreme outlier' : i.amountDeviationFactor > 2 ? 'elevated' : 'normal'}`,
    `Beneficiary: ${i.beneficiaryIsNew ? 'FIRST-OCCURRENCE · absent from registry' : 'known counterparty'}`,
    `${i.submittedOutsideHours ? 'OFF-HOURS' : 'Standard hours'} · ${i.approvalWorkflowMinutes}min approval · dual-auth: ${i.dualAuthFollowed ? 'yes' : 'BYPASSED'}`,
    `Round-number: ${i.roundNumberFlag ? 'YES' : 'no'} · Below-threshold: ${i.belowThresholdFlag ? 'YES' : 'no'}`,
  ]
  let paymentScore = 0
  paymentScore += Math.min((i.amountDeviationFactor - 1) / 11, 1) * 0.32
  paymentScore += i.beneficiaryIsNew ? 0.28 : 0
  paymentScore += i.submittedOutsideHours ? 0.14 : 0
  paymentScore += i.roundNumberFlag ? 0.13 : 0
  paymentScore += i.belowThresholdFlag ? 0.13 : 0

  const locMismatch = id.loginLocation !== id.expectedLocation
  const identityLines = [
    `User ${id.submittingUser} · ${id.loginTime}`,
    `Device: ${id.deviceIsNew ? 'NEW — not in registry' : 'recognised'} · ${id.deviceId.slice(0, 18)}`,
    `Location: ${id.loginLocation} — expected ${id.expectedLocation} · ${locMismatch ? 'MISMATCH' : 'match'}`,
    `MFA: ${id.mfaUsed ? id.mfaMethod : 'NOT USED'} · VPN: ${id.vpnDetected ? 'DETECTED' : 'none'} · failed logins: ${id.priorFailedLogins}`,
    `Approval: ${i.approvalWorkflowMinutes}min${i.selfApproved ? ' · SELF-APPROVED' : ''}`,
  ]
  let identityScore = 0
  identityScore += id.deviceIsNew ? 0.30 : 0
  identityScore += locMismatch ? 0.23 : 0
  identityScore += i.selfApproved ? 0.22 : 0
  identityScore += i.approvalWorkflowMinutes < 5 ? 0.18 : i.approvalWorkflowMinutes < 15 ? 0.09 : 0
  identityScore += id.vpnDetected ? 0.07 : 0

  const countryInBaseline = r.typicalCountries.includes(i.beneficiaryCountry)
  const graphLines = [
    `Graph: ${r.clientName} · ${r.totalPaymentsLast12M} payments · ${r.counterpartyRegistryCount} counterparties`,
    `${i.beneficiaryName}: ${i.beneficiaryIsNew ? 'ABSENT from graph — new isolated node' : 'found in counterparty graph'}`,
    `Fraud network: ${ei.beneficiaryFraudFlag ? `FLAGGED — ${ei.beneficiaryFraudSource?.slice(0,35)}` : 'no beneficiary fraud match'}`,
    `Geography: ${i.beneficiaryCountry} ${countryInBaseline ? 'within' : 'OUTSIDE'} baseline (${r.typicalCountries.join(', ')})`,
    `IP ${e.originatingIP}: ${ei.ipFlagged ? `FLAGGED · ${ei.ipAsn.slice(0, 28)}` : 'no fraud signal'}`,
  ]
  let graphScore = 0
  graphScore += ei.beneficiaryFraudFlag ? 0.38 : 0
  graphScore += ei.emailDomainIsLookalike ? 0.22 : 0
  graphScore += !countryInBaseline ? 0.22 : 0
  graphScore += ei.ipFlagged ? 0.18 : 0

  const regFlags: string[] = []
  if (ei.swiftControlsFlag) regFlags.push('SWIFT')
  if (ei.ofacMatch) regFlags.push('OFAC')
  if (ei.fincenMatch) regFlags.push('FinCEN')
  const intelLines = [
    `OFAC: ${ei.ofacMatch ? 'MATCH FOUND' : 'clear'} · FinCEN 314(b): ${ei.fincenMatch ? 'MATCH' : 'no match'}`,
    `SWIFT GPI: ${ei.swiftControlsFlag ? 'CONTROLS ALERT' : 'no alert'} · country risk: ${ei.beneficiaryBankCountryRisk.split('—')[0].trim()}`,
    `Beneficiary fraud flag: ${ei.beneficiaryFraudFlag ? `YES — ${(ei.beneficiaryFraudSource ?? '').slice(0,30)}` : 'none'}`,
    `AML typology: ${ei.emailDomainIsLookalike && i.beneficiaryIsNew ? 'BEC-3A' : !i.dualAuthFollowed ? 'BEC-5A' : !countryInBaseline ? 'BEC-2B' : 'BEC-1C'}`,
    `Sanctions: ${ei.sanctionsScreeningResult.slice(0, 45)} ${regFlags.length ? `· flags: ${regFlags.join(', ')}` : ''}`,
  ]
  let intelScore = 0
  intelScore += ei.ofacMatch ? 0.40 : 0
  intelScore += ei.fincenMatch ? 0.28 : 0
  intelScore += ei.swiftControlsFlag ? 0.22 : 0
  if (intelScore < 0.12 && !countryInBaseline) intelScore += 0.20

  return {
    email:    { score: Math.min(1, emailScore),    lines: emailLines    },
    payment:  { score: Math.min(1, paymentScore),  lines: paymentLines  },
    identity: { score: Math.min(1, identityScore), lines: identityLines },
    graph:    { score: Math.min(1, graphScore),     lines: graphLines    },
    intel:    { score: Math.min(1, intelScore),     lines: intelLines    },
  }
}

// ── Email panel (middle top) ──────────────────────────────────────────────────

function EmailPanel({ c, activeEntities, activePhrases }: {
  c: BECCase
  activeEntities: Set<string>
  activePhrases: { type: 'urgency' | 'secrecy' | 'override'; text: string }[]
}) {
  const { email: e, externalIntel: ei } = c

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Email header */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900 shrink-0">
        <div className="flex items-start gap-3">
          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-100 truncate">{e.subject}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[11px] text-slate-400">
                From <span className={clsx('font-mono', ei.emailDomainIsLookalike ? 'text-red-400' : 'text-slate-300')}>{e.senderAddress}</span>
              </span>
              <span className="text-[11px] text-slate-500">{e.receivedAt}</span>
              {ei.emailDomainIsLookalike && (
                <span className="text-[10px] bg-red-900/50 text-red-300 border border-red-700/50 px-1.5 py-0.5 rounded font-mono">
                  ↔ {ei.lookalikeDomain}
                </span>
              )}
              {e.senderDomainAgeDays < 90 && (
                <span className="text-[10px] bg-orange-900/50 text-orange-300 border border-orange-700/50 px-1.5 py-0.5 rounded">
                  domain {e.senderDomainAgeDays}d old
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 text-xs leading-relaxed font-mono whitespace-pre-wrap">
        {e.bodySegments.map((seg, i) => {
          if (!seg.entityType) return <span key={i} className="text-slate-400">{seg.text}</span>
          const isActive = activeEntities.has(seg.entityType)
          return (
            <span
              key={i}
              title={seg.entityType}
              className={clsx(
                'rounded px-0.5 cursor-default transition-all duration-500',
                isActive ? ENTITY_RISK[seg.entityType] : ENTITY_DIM[seg.entityType] ?? 'text-slate-500'
              )}
            >
              {seg.text}
            </span>
          )
        })}
      </div>

      {/* NLP signal phrases (appear progressively as Agent 1 analyzes) */}
      {activePhrases.length > 0 && (
        <div className="px-3 py-2 border-t border-slate-800 bg-slate-900/80 shrink-0">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email agent — detected signals</div>
          <div className="flex flex-wrap gap-1.5">
            {activePhrases.map((p, i) => (
              <span key={i} className={clsx(
                'text-[10px] font-mono px-2 py-0.5 rounded border',
                p.type === 'urgency'  ? 'bg-red-900/50 text-red-300 border-red-700/50' :
                p.type === 'secrecy'  ? 'bg-purple-900/50 text-purple-300 border-purple-700/50' :
                                        'bg-amber-900/50 text-amber-300 border-amber-700/50'
              )}>
                {p.type === 'urgency' ? '⚡' : p.type === 'secrecy' ? '🔒' : '⚠'} {p.text.length > 35 ? p.text.slice(0, 35) + '…' : p.text}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Signal card (middle bottom) ───────────────────────────────────────────────

function SignalCard({ card, active }: { card: SCard; active: boolean }) {
  const s = SEV_CARD[card.sev]
  const Icon = card.Icon
  return (
    <div className={clsx(
      'rounded-xl border p-3 transition-all duration-500',
      active ? clsx(s.border, s.bg) : 'border-slate-800 bg-slate-900/30 opacity-30'
    )}>
      <div className="flex items-start gap-2">
        <Icon className={clsx('w-3.5 h-3.5 shrink-0 mt-0.5', active ? s.icon : 'text-slate-600')} />
        <div className="flex-1 min-w-0">
          <div className={clsx('text-[10px] font-bold uppercase tracking-wider mb-0.5', active ? s.icon : 'text-slate-600')}>{card.label}</div>
          <div className={clsx('text-xs font-semibold truncate', active ? s.val : 'text-slate-600')}>{card.value}</div>
          <div className="text-[10px] text-slate-500 truncate mt-0.5">{card.detail}</div>
        </div>
        {active && <div className={clsx('w-1.5 h-1.5 rounded-full shrink-0 mt-1', s.dot)} />}
      </div>
    </div>
  )
}

// ── Agent row (right panel) ───────────────────────────────────────────────────

function AgentRow({ def, lines, score }: {
  def: typeof AGENTS[number]
  lines: string[]
  score: number | null
}) {
  const { accent } = def
  const Icon = def.icon
  const running = lines.length > 0 && score === null
  const done = score !== null
  const pct = done ? Math.round(score * 100) : 0
  const currentLine = lines[lines.length - 1] ?? ''

  return (
    <div className={clsx(
      'rounded-xl border px-3 py-2.5 transition-all duration-300',
      done ? accent.border + ' bg-slate-900' :
      running ? 'border-slate-700 bg-slate-900' :
      'border-slate-800/50 bg-slate-900/30 opacity-40'
    )}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className={clsx('w-1.5 h-1.5 rounded-full shrink-0', done ? accent.dot : running ? clsx(accent.dot, 'animate-pulse') : 'bg-slate-700')} />
        <Icon className={clsx('w-3 h-3 shrink-0', accent.text)} />
        <span className={clsx('text-[11px] font-bold flex-1 truncate', accent.text)}>{def.name}</span>
        {done && (
          <span className={clsx('text-sm font-bold font-mono shrink-0', accent.text)}>{pct}</span>
        )}
        {running && <span className="text-[9px] text-slate-500 font-mono animate-pulse">ANALYZING</span>}
      </div>

      {(running || done) && (
        <div className="pl-5 mb-2">
          <div className="text-[10px] font-mono text-slate-500 leading-relaxed line-clamp-2 min-h-[2.5rem]">
            {currentLine}
          </div>
        </div>
      )}

      {done && (
        <div className="pl-5 flex items-center gap-1.5">
          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className={clsx('h-1 rounded-full transition-all duration-700', accent.bar)} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[9px] text-slate-500 font-mono shrink-0">{pct}/100</span>
        </div>
      )}
    </div>
  )
}

// ── Ensemble score (right panel bottom) ──────────────────────────────────────

function EnsembleScore({ c, agentData, visible }: {
  c: BECCase
  agentData: Record<AgentId, { score: number; lines: string[] }>
  visible: boolean
}) {
  const [disp, setDisp] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!visible) { setDisp(0); return }
    const target = c.anomalyScore
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 1100, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setDisp(Math.round(e * target * 10) / 10)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [visible, c.anomalyScore])

  if (!visible) return null

  const target = c.anomalyScore
  const col = target >= 80 ? { stroke: '#ef4444', text: 'text-red-400', label: 'CRITICAL', badge: 'bg-red-950 text-red-300 border-red-700/50' }
    : target >= 65 ? { stroke: '#f97316', text: 'text-orange-400', label: 'HIGH',     badge: 'bg-orange-950 text-orange-300 border-orange-700/50' }
    : target >= 45 ? { stroke: '#f59e0b', text: 'text-amber-400',  label: 'MEDIUM',   badge: 'bg-amber-950 text-amber-300 border-amber-700/50' }
    : { stroke: '#10b981', text: 'text-emerald-400', label: 'LOW', badge: 'bg-emerald-950 text-emerald-300 border-emerald-700/50' }

  const r = 38, cx = 46, cy = 46, circ = 2 * Math.PI * r
  const dash = circ * (1 - disp / 100)

  return (
    <div className="border-t border-slate-800 bg-slate-900/80 p-3 animate-fade-in">
      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Orchestrator — Ensemble Score</div>

      <div className="flex items-center gap-3 mb-3">
        <svg width="92" height="92" viewBox="0 0 92 92" className="shrink-0">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={col.stroke} strokeWidth="10"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dash}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.34,1.2,0.64,1)' }}
          />
          <text x={cx} y={cy - 4} textAnchor="middle" fill={col.stroke} fontSize="18" fontWeight="800" fontFamily="ui-monospace,monospace">{disp.toFixed(0)}</text>
          <text x={cx} y={cy + 13} textAnchor="middle" fill="#475569" fontSize="9" fontFamily="ui-monospace,monospace">/100</text>
        </svg>

        <div className="flex-1 space-y-1.5">
          {AGENTS.map(def => {
            const pct = Math.round(agentData[def.id].score * 100)
            return (
              <div key={def.id} className="flex items-center gap-1.5">
                <span className={clsx('text-[9px] font-bold w-20 shrink-0 truncate', def.accent.text)}>{def.name.split(' ')[0]}</span>
                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className={clsx('h-1 rounded-full', def.accent.bar)} style={{ width: `${pct}%` }} />
                </div>
                <span className={clsx('text-[9px] font-mono w-6 text-right shrink-0', def.accent.text)}>{pct}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={clsx('text-[10px] font-bold border rounded-full px-2.5 py-1 uppercase tracking-widest', col.badge)}>{col.label} RISK</span>
        <span className="text-[10px] text-slate-500 font-mono ml-auto">{c.status.toUpperCase()}</span>
      </div>
    </div>
  )
}

// ── Case list item ────────────────────────────────────────────────────────────

function CaseRow({ c, selected, onSelect }: { c: BECCase; selected: boolean; onSelect: () => void }) {
  const dot = c.severity === 'critical' ? 'bg-red-500' : c.severity === 'high' ? 'bg-orange-500' : 'bg-amber-400'
  const txt = c.severity === 'critical' ? 'text-red-400' : c.severity === 'high' ? 'text-orange-400' : 'text-amber-400'
  return (
    <button onClick={onSelect} className={clsx('w-full text-left px-4 py-3 border-b border-slate-800/80 transition-all', selected ? 'bg-slate-800 border-l-2 border-l-sky-500' : 'hover:bg-slate-800/50')}>
      <div className="flex items-center gap-2 mb-1">
        <div className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
        <span className="font-mono text-[10px] text-slate-400 flex-1 truncate">{c.id}</span>
        <span className={clsx('text-[9px] font-bold uppercase', txt)}>{c.severity}</span>
      </div>
      <div className="text-xs font-semibold text-slate-200 truncate pl-3.5">{c.relationship.clientName}</div>
      <div className="text-[11px] text-slate-500 truncate pl-3.5">{c.instruction.currency} {c.instruction.amount.toLocaleString()} · {c.instruction.beneficiaryCountry}</div>
    </button>
  )
}

// ── Detection layout (keyed so it remounts on case change) ───────────────────

function DetectionLayout({ c }: { c: BECCase }) {
  const signalCards = buildSignalCards(c)
  const agentData   = computeAgentData(c)

  const [agentLines,   setAgentLines]   = useState<Record<AgentId, string[]>>({ email:[], payment:[], identity:[], graph:[], intel:[] })
  const [agentScores,  setAgentScores]  = useState<Record<AgentId, number | null>>({ email:null, payment:null, identity:null, graph:null, intel:null })
  const [activeEnts,   setActiveEnts]   = useState<Set<string>>(new Set())
  const [activeCards,  setActiveCards]  = useState<Set<string>>(new Set())
  const [phrases,      setPhrases]      = useState<{ type: 'urgency'|'secrecy'|'override'; text: string }[]>([])
  const [orchLine,     setOrchLine]     = useState('')
  const [ensembleVis,  setEnsembleVis]  = useState(false)

  useEffect(() => {
    const T: ReturnType<typeof setTimeout>[] = []

    T.push(setTimeout(() => setOrchLine(`Initiating BEC detection — ${c.id} · ${c.relationship.clientName} · dispatching 5 agents…`), 120))

    const start = 500
    AGENTS.forEach((def, ai) => {
      const data = agentData[def.id]
      const jitter = ai * 90

      data.lines.forEach((line, li) => {
        const t = start + jitter + li * 310

        T.push(setTimeout(() => setAgentLines(p => ({ ...p, [def.id]: [...p[def.id], line] })), t))

        // Entity type activations
        const entTypes = ENTITY_ACTIVATIONS[def.id]?.[li]
        if (entTypes) T.push(setTimeout(() => setActiveEnts(p => { const n = new Set(p); entTypes.forEach(e => n.add(e)); return n }), t + 80))

        // NLP phrase reveals (email agent only)
        if (def.id === 'email' && li === 1) {
          c.nlpAnalysis.urgencyPhrases.forEach((ph, pi) => T.push(setTimeout(() => setPhrases(p => [...p, { type:'urgency', text:ph }]), t + 100 + pi * 120)))
          c.nlpAnalysis.secrecyPhrases.forEach((ph, pi) => T.push(setTimeout(() => setPhrases(p => [...p, { type:'secrecy', text:ph }]), t + 200 + pi * 120)))
        }
        if (def.id === 'email' && li === 1) {
          c.nlpAnalysis.overridePhrases.forEach((ph, pi) => T.push(setTimeout(() => setPhrases(p => [...p, { type:'override', text:ph }]), t + 350 + pi * 120)))
        }

        // Signal card activations
        signalCards.filter(sc => sc.agentId === def.id && sc.atLine === li).forEach(sc => {
          T.push(setTimeout(() => setActiveCards(p => new Set([...p, sc.id])), t + 150))
        })
      })

      const scoreAt = start + jitter + data.lines.length * 310 + 350
      T.push(setTimeout(() => setAgentScores(p => ({ ...p, [def.id]: data.score })), scoreAt))
    })

    const allDone = start + 90 * 4 + 5 * 310 + 350 + 500
    T.push(setTimeout(() => setEnsembleVis(true), allDone))

    return () => T.forEach(clearTimeout)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Middle panel */}
      <div className="flex-1 flex flex-col min-w-0 border-x border-slate-800 overflow-hidden">

        {/* Case strip */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className={clsx('w-1.5 h-1.5 rounded-full shrink-0', c.severity === 'critical' ? 'bg-red-500' : c.severity === 'high' ? 'bg-orange-500' : 'bg-amber-400')} />
          <span className="font-mono text-[10px] text-slate-400">{c.id}</span>
          <span className="text-xs font-bold text-slate-200">{c.relationship.clientName}</span>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-[11px] text-slate-400">{c.email.receivedAt}</span>
        </div>

        {/* Email viewer */}
        <div className="flex-1 overflow-hidden min-h-0">
          <EmailPanel c={c} activeEntities={activeEnts} activePhrases={phrases} />
        </div>

        {/* Signal cards */}
        <div className="h-56 shrink-0 border-t border-slate-800 overflow-y-auto">
          <div className="px-3 pt-2.5 pb-1 border-b border-slate-800/60 flex items-center gap-2">
            <Activity className="w-3 h-3 text-slate-500" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Risk Signals — activated by agents in real time</span>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {signalCards.map(card => (
              <SignalCard key={card.id} card={card} active={activeCards.has(card.id)} />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-72 shrink-0 flex flex-col overflow-hidden">
        {/* Orchestrator line */}
        {orchLine && (
          <div className="px-3 py-2 border-b border-slate-800 bg-slate-900 shrink-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Cpu className="w-3 h-3 text-emerald-500" />
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Orchestrator</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 leading-relaxed pl-4">{orchLine}</div>
          </div>
        )}

        {/* Agent rows */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {AGENTS.map(def => (
            <AgentRow
              key={def.id}
              def={def}
              lines={agentLines[def.id]}
              score={agentScores[def.id]}
            />
          ))}
        </div>

        {/* Ensemble */}
        <EnsembleScore c={c} agentData={agentData} visible={ensembleVis} />
      </div>
    </>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function InvestigationHub() {
  const [selected, setSelected] = useState<BECCase | null>(null)

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-950">

      {/* Left: case list */}
      <div className="w-52 shrink-0 bg-slate-900 border-r border-slate-800 overflow-y-auto flex flex-col">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2 shrink-0">
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Investigations</span>
        </div>
        {BEC_CASES.map(c => (
          <CaseRow key={c.id} c={c} selected={selected?.id === c.id} onSelect={() => setSelected(c)} />
        ))}
      </div>

      {/* Detection area (remounts on case change via key) */}
      {selected ? (
        <DetectionLayout key={selected.id} c={selected} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
            <Cpu className="w-7 h-7 text-slate-700" />
          </div>
          <div className="text-sm font-semibold text-slate-500">Select a case to begin</div>
          <div className="text-xs text-slate-600 max-w-xs">5 specialist agents will analyse the email, payment instruction, identity, relationship graph, and external intelligence in real time</div>
        </div>
      )}

    </div>
  )
}
