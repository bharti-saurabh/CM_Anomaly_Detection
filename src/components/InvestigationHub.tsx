import { useState, useEffect, useRef } from 'react'
import {
  Mail, CreditCard, Fingerprint, Network, ShieldCheck,
  Cpu, Activity,
} from 'lucide-react'
import clsx from 'clsx'
import { BEC_CASES } from '../data/becCases'
import type { BECCase } from '../types'

// ── Agent registry ────────────────────────────────────────────────────────────

const AGENTS = [
  {
    id: 'email'      as const,
    name: 'Email Screener',
    model: 'NLP / Transformer',
    icon: Mail,
    accent: { border: 'border-sky-500/50', bg: 'bg-sky-500/8', dot: 'bg-sky-400', text: 'text-sky-300', bar: 'bg-sky-500', label: 'text-sky-400' },
    outputKeys: ['urgency_score', 'domain_risk', 'lang_anomaly'] as const,
  },
  {
    id: 'payment'    as const,
    name: 'Payment Anomaly',
    model: 'XGBoost Ensemble',
    icon: CreditCard,
    accent: { border: 'border-violet-500/50', bg: 'bg-violet-500/8', dot: 'bg-violet-400', text: 'text-violet-300', bar: 'bg-violet-500', label: 'text-violet-400' },
    outputKeys: ['anomaly_score', 'top_factor', 'threshold_flag'] as const,
  },
  {
    id: 'identity'   as const,
    name: 'Identity & Session',
    model: 'Isolation Forest',
    icon: Fingerprint,
    accent: { border: 'border-amber-500/50', bg: 'bg-amber-500/8', dot: 'bg-amber-400', text: 'text-amber-300', bar: 'bg-amber-500', label: 'text-amber-400' },
    outputKeys: ['identity_risk', 'device_flag', 'location_flag'] as const,
  },
  {
    id: 'graph'      as const,
    name: 'Relationship Graph',
    model: 'Graph Neural Net',
    icon: Network,
    accent: { border: 'border-emerald-500/50', bg: 'bg-emerald-500/8', dot: 'bg-emerald-400', text: 'text-emerald-300', bar: 'bg-emerald-500', label: 'text-emerald-400' },
    outputKeys: ['network_risk', 'entity_score'] as const,
  },
  {
    id: 'intel'      as const,
    name: 'Counterparty Intel',
    model: 'Rules Engine + BERT',
    icon: ShieldCheck,
    accent: { border: 'border-rose-500/50', bg: 'bg-rose-500/8', dot: 'bg-rose-400', text: 'text-rose-300', bar: 'bg-rose-500', label: 'text-rose-400' },
    outputKeys: ['compliance_risk', 'typology', 'reg_flags'] as const,
  },
]

type AgentId = typeof AGENTS[number]['id']

type AgentResult = {
  score: number
  lines: string[]
  outputs: Record<string, string>
}

// ── Per-agent data computation from BECCase ───────────────────────────────────

function emailAgent(c: BECCase): AgentResult {
  const { email: e, nlpAnalysis: n, externalIntel: ei } = c

  const lines = [
    `Loading ${c.relationship.clientName} baseline — ${n.histStyleBaselineSamples} historical emails scanned`,
    `Urgency classifier: ${n.urgencyPhrases.length} urgency · ${n.secrecyPhrases.length} secrecy · ${n.overridePhrases.length} override phrases detected`,
    ei.emailDomainIsLookalike
      ? `Domain lookalike: ${e.senderAddress.split('@')[1]} ↔ ${ei.lookalikeDomain ?? 'known domain'} — typosquat confirmed`
      : `Domain: ${e.senderAddress.split('@')[1]} — no lookalike pattern found (age: ${e.senderDomainAgeDays}d)`,
    `Style consistency: ${Math.round(n.writingStyleConsistency * 100)}% vs baseline — ${n.writingStyleConsistency < 0.55 ? 'anomalous authorship signal' : 'within normal range'}`,
    `Auth: DKIM ${e.dkim.toUpperCase()} · SPF ${e.spf.toUpperCase()} · DMARC ${e.dmarc.toUpperCase()} · domain age ${e.senderDomainAgeDays}d`,
  ]

  let score = 0
  score += Math.min(n.urgencyPhrases.length * 0.11, 0.33)
  score += Math.min(n.overridePhrases.length * 0.14, 0.28)
  score += (1 - n.writingStyleConsistency) * 0.21
  score += ei.emailDomainIsLookalike ? 0.26 : 0
  score += e.senderDomainAgeDays < 90 ? 0.14 : e.senderDomainAgeDays < 180 ? 0.07 : 0
  score += e.dkim === 'fail' ? 0.06 : 0
  score = Math.min(1, score)

  return {
    score,
    lines,
    outputs: {
      urgency_score: score.toFixed(2),
      domain_risk: ei.emailDomainIsLookalike ? 'HIGH' : e.senderDomainAgeDays < 180 ? 'MEDIUM' : 'LOW',
      lang_anomaly: n.writingStyleConsistency < 0.55 || n.urgencyPhrases.length > 1 ? 'FLAGGED' : 'clear',
    },
  }
}

function paymentAgent(c: BECCase): AgentResult {
  const i = c.instruction

  const topFactor = i.amountDeviationFactor > 4 ? `amount_deviation_${i.amountDeviationFactor.toFixed(1)}×`
    : i.beneficiaryIsNew ? 'new_beneficiary'
    : i.submittedOutsideHours ? 'off_hours_submission'
    : 'round_number_pattern'

  const lines = [
    `Instruction: ${i.currency} ${i.amount.toLocaleString()} → ${i.beneficiaryName} (${i.beneficiaryCountry})`,
    `Amount: ${i.amountDeviationFactor.toFixed(1)}× client avg ${i.currency} ${i.historicalAvg.toLocaleString()} — ${i.amountDeviationFactor > 5 ? 'extreme outlier' : i.amountDeviationFactor > 2 ? 'elevated' : 'within range'}`,
    `Beneficiary: ${i.beneficiaryIsNew ? 'FIRST-OCCURRENCE — absent from counterparty registry' : 'known entity — found in registry'}`,
    `${i.submittedOutsideHours ? 'OFF-HOURS submission' : 'Standard hours'} · Approval: ${i.approvalWorkflowMinutes}min · Dual-auth: ${i.dualAuthFollowed ? 'followed' : 'BYPASSED'}`,
    `Round-number: ${i.roundNumberFlag ? 'FLAGGED' : 'no'} · Below-threshold structuring: ${i.belowThresholdFlag ? 'FLAGGED' : 'no'}`,
  ]

  let score = 0
  score += Math.min((i.amountDeviationFactor - 1) / 11, 1) * 0.32
  score += i.beneficiaryIsNew ? 0.28 : 0
  score += i.submittedOutsideHours ? 0.14 : 0
  score += i.roundNumberFlag ? 0.13 : 0
  score += i.belowThresholdFlag ? 0.13 : 0
  score = Math.min(1, score)

  return {
    score,
    lines,
    outputs: {
      anomaly_score: score.toFixed(2),
      top_factor: topFactor,
      threshold_flag: i.belowThresholdFlag ? 'DETECTED' : 'none',
    },
  }
}

function identityAgent(c: BECCase): AgentResult {
  const { identity: id, instruction: i } = c
  const locMismatch = id.loginLocation !== id.expectedLocation

  const lines = [
    `User ${id.submittingUser} (${id.userId}) authenticated at ${id.loginTime}`,
    `Device ${id.deviceId.slice(0, 16)}…: ${id.deviceIsNew ? 'NEW — not in registered device inventory' : 'recognised device'}`,
    `Location: ${id.loginLocation} · Expected: ${id.expectedLocation} — ${locMismatch ? 'MISMATCH DETECTED' : 'location match'}`,
    `MFA: ${id.mfaUsed ? id.mfaMethod : 'NOT USED'} · VPN: ${id.vpnDetected ? 'DETECTED' : 'not detected'} · Failed logins 24h: ${id.priorFailedLogins}`,
    `Approval: ${i.approvalWorkflowMinutes}min workflow${i.selfApproved ? ' — SELF-APPROVED (maker-checker bypassed)' : ''}`,
  ]

  let score = 0
  score += id.deviceIsNew ? 0.30 : 0
  score += locMismatch ? 0.23 : 0
  score += i.selfApproved ? 0.22 : 0
  score += i.approvalWorkflowMinutes < 5 ? 0.18 : i.approvalWorkflowMinutes < 15 ? 0.09 : 0
  score += id.vpnDetected ? 0.07 : 0
  score = Math.min(1, score)

  return {
    score,
    lines,
    outputs: {
      identity_risk: score.toFixed(2),
      device_flag: id.deviceIsNew ? 'NEW DEVICE' : 'recognised',
      location_flag: locMismatch ? 'MISMATCH' : 'match',
    },
  }
}

function graphAgent(c: BECCase): AgentResult {
  const { relationship: r, externalIntel: ei, instruction: i, email: e } = c
  const countryInBaseline = r.typicalCountries.includes(i.beneficiaryCountry)

  const lines = [
    `Entity graph: ${r.clientName} — ${r.totalPaymentsLast12M} payments · ${r.counterpartyRegistryCount} known counterparties`,
    `Beneficiary node: ${i.beneficiaryName} — ${i.beneficiaryIsNew ? 'ABSENT from graph · isolated new node' : 'present · existing relationship'}`,
    `Fraud network: ${ei.beneficiaryFraudFlag ? `MATCH — ${ei.beneficiaryFraudSource}` : 'beneficiary not in fraud network'}`,
    `Geography: ${i.beneficiaryCountry} ${countryInBaseline ? 'within' : 'OUTSIDE'} baseline (${r.typicalCountries.join(', ')})`,
    `IP ${e.originatingIP}: ${ei.ipFlagged ? `FLAGGED — ${(ei.ipFraudSource ?? '').slice(0, 50)}` : 'no fraud signal'} · ${ei.ipAsn.slice(0, 30)}`,
  ]

  let score = 0
  score += ei.beneficiaryFraudFlag ? 0.38 : 0
  score += ei.emailDomainIsLookalike ? 0.22 : 0
  score += !countryInBaseline ? 0.22 : 0
  score += ei.ipFlagged ? 0.18 : 0
  score = Math.min(1, score)

  const networkRisk = ei.beneficiaryFraudFlag ? 'FLAGGED' : ei.ipFlagged ? 'ELEVATED' : !countryInBaseline ? 'ELEVATED' : 'CLEAR'

  return {
    score,
    lines,
    outputs: {
      network_risk: networkRisk,
      entity_score: score.toFixed(2),
    },
  }
}

function intelAgent(c: BECCase): AgentResult {
  const { externalIntel: ei, instruction: i, relationship: r } = c

  const regFlags: string[] = []
  if (ei.swiftControlsFlag) regFlags.push('SWIFT controls')
  if (ei.ofacMatch) regFlags.push('OFAC')
  if (ei.fincenMatch) regFlags.push('FinCEN 314(b)')
  if (!r.typicalCountries.includes(i.beneficiaryCountry)) regFlags.push('new jurisdiction')

  const typology = ei.emailDomainIsLookalike && i.beneficiaryIsNew ? 'BEC-3A'
    : !i.dualAuthFollowed || i.selfApproved ? 'BEC-5A'
    : i.beneficiaryIsNew && !r.typicalCountries.includes(i.beneficiaryCountry) ? 'BEC-2B'
    : 'BEC-1C'

  const lines = [
    `OFAC SDN: "${i.beneficiaryName}" — ${ei.ofacMatch ? 'MATCH FOUND' : 'no match'} · bank "${i.beneficiaryBank}" — ${ei.ofacMatch ? 'FLAGGED' : 'clear'}`,
    `FinCEN 314(b): ${ei.fincenMatch ? `MATCH — ${ei.beneficiaryFraudSource ?? 'intel match'}` : 'no match on entity or account'}`,
    `SWIFT GPI: ${ei.swiftControlsFlag ? 'PAYMENT CONTROLS ALERT — enhanced monitoring required' : 'no controls alert'} · country risk: ${ei.beneficiaryBankCountryRisk.split('—')[0].trim()}`,
    `AML typology: ${typology} — ${typology === 'BEC-3A' ? 'lookalike domain + new beneficiary' : typology === 'BEC-5A' ? 'internal control override' : typology === 'BEC-2B' ? 'new offshore entity' : 'social engineering pattern'}`,
    `Sanctions result: ${ei.sanctionsScreeningResult.slice(0, 60)} · ${ei.ipGeolocation.slice(0, 30)}`,
  ]

  let score = 0
  score += ei.ofacMatch ? 0.40 : 0
  score += ei.fincenMatch ? 0.28 : 0
  score += ei.swiftControlsFlag ? 0.22 : 0
  if (score < 0.12 && !r.typicalCountries.includes(i.beneficiaryCountry)) score += 0.20
  score = Math.min(1, score)

  return {
    score,
    lines,
    outputs: {
      compliance_risk: score.toFixed(2),
      typology,
      reg_flags: regFlags.length > 0 ? regFlags.join(' · ') : 'none',
    },
  }
}

function computeAll(c: BECCase): Record<AgentId, AgentResult> {
  return { email: emailAgent(c), payment: paymentAgent(c), identity: identityAgent(c), graph: graphAgent(c), intel: intelAgent(c) }
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function Terminal({ lines, active }: { lines: string[]; active: boolean }) {
  return (
    <div className="font-mono text-xs space-y-1.5 min-h-[4.5rem]">
      {lines.map((line, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-emerald-600 shrink-0 select-none">❯</span>
          <span className="text-slate-300 leading-relaxed">{line}</span>
        </div>
      ))}
      {active && (
        <div className="flex items-center gap-2">
          <span className="text-emerald-600 select-none">❯</span>
          <span className="w-2 h-3.5 bg-emerald-500 rounded-sm animate-pulse" />
        </div>
      )}
    </div>
  )
}

type AgentDef = typeof AGENTS[number]

function AgentCard({ def, lines, score, running }: {
  def: AgentDef
  lines: string[]
  score: number | null
  running: boolean
}) {
  const { accent } = def
  const Icon = def.icon
  const done = score !== null

  return (
    <div className={clsx(
      'rounded-2xl border overflow-hidden transition-all duration-500',
      accent.border,
      done ? accent.bg : running ? 'bg-slate-900/80' : 'bg-slate-900/40 opacity-40'
    )}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5">
        <div className={clsx('w-2 h-2 rounded-full shrink-0 transition-all', done ? accent.dot : running ? clsx(accent.dot, 'animate-pulse') : 'bg-slate-700')} />
        <Icon className={clsx('w-3.5 h-3.5 shrink-0', accent.text)} />
        <div className="flex-1 min-w-0">
          <div className={clsx('text-xs font-bold truncate', accent.text)}>{def.name}</div>
          <div className="text-[10px] text-slate-500 truncate">{def.model}</div>
        </div>
        {running && !done && (
          <span className="text-[10px] font-mono text-slate-500 animate-pulse shrink-0">ANALYZING</span>
        )}
        {done && (
          <div className={clsx('text-xl font-bold font-mono shrink-0', accent.text)}>
            {(score * 100).toFixed(0)}<span className="text-xs text-slate-600 ml-0.5">/ 100</span>
          </div>
        )}
      </div>

      {/* Log lines */}
      <div className="px-4 py-3 min-h-[7.5rem] font-mono text-[11px] space-y-1.5">
        {lines.map((line, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <span className="text-slate-600 shrink-0 mt-px">·</span>
            <span className={clsx('leading-relaxed break-words', i === lines.length - 1 && running && !done ? 'text-slate-200' : 'text-slate-400')}>{line}</span>
          </div>
        ))}
        {running && !done && lines.length > 0 && (
          <div className="flex items-center gap-1.5 pl-3">
            <span className="w-1.5 h-3 bg-slate-500 rounded-sm animate-pulse" />
          </div>
        )}
      </div>

      {/* Outputs */}
      {done && score !== null && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1 mb-2">
            <div className={clsx('h-1.5 rounded-full transition-all duration-700', accent.bar)} style={{ width: `${score * 100}%` }} />
            <div className="h-1.5 rounded-full bg-slate-800 flex-1" />
          </div>
          <div className="grid grid-cols-3 gap-1">
            {def.outputKeys.map(key => (
              <div key={key} className="rounded-lg bg-black/30 px-2 py-1.5">
                <div className={clsx('text-[9px] font-mono uppercase tracking-wide mb-0.5', accent.label)}>{key}</div>
                <div className="text-[10px] font-mono text-slate-300 truncate">—</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Identical to AgentCard but with real output values — rendered after score appears
function AgentCardDone({ def, lines, result }: {
  def: AgentDef
  lines: string[]
  result: AgentResult
}) {
  const { accent } = def
  const Icon = def.icon

  return (
    <div className={clsx('rounded-2xl border overflow-hidden', accent.border, accent.bg)}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5">
        <div className={clsx('w-2 h-2 rounded-full shrink-0', accent.dot)} />
        <Icon className={clsx('w-3.5 h-3.5 shrink-0', accent.text)} />
        <div className="flex-1 min-w-0">
          <div className={clsx('text-xs font-bold truncate', accent.text)}>{def.name}</div>
          <div className="text-[10px] text-slate-500 truncate">{def.model}</div>
        </div>
        <div className={clsx('text-xl font-bold font-mono shrink-0', accent.text)}>
          {(result.score * 100).toFixed(0)}<span className="text-xs text-slate-600 ml-0.5">/ 100</span>
        </div>
      </div>

      <div className="px-4 py-3 font-mono text-[11px] space-y-1.5">
        {lines.map((line, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <span className="text-slate-600 shrink-0 mt-px">·</span>
            <span className="text-slate-400 leading-relaxed break-words">{line}</span>
          </div>
        ))}
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center gap-1 mb-2">
          <div className={clsx('h-1.5 rounded-full transition-all duration-700', accent.bar)} style={{ width: `${result.score * 100}%` }} />
          <div className="h-1.5 rounded-full bg-slate-800 flex-1" />
        </div>
        <div className={clsx('grid gap-1', def.outputKeys.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
          {def.outputKeys.map(key => (
            <div key={key} className="rounded-lg bg-black/30 px-2 py-1.5">
              <div className={clsx('text-[9px] font-mono uppercase tracking-wide mb-0.5', accent.label)}>{key}</div>
              <div className="text-[10px] font-mono text-slate-200 truncate">{result.outputs[key] ?? '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EnsemblePanel({ c, agentResults, visible }: {
  c: BECCase
  agentResults: Record<AgentId, AgentResult>
  visible: boolean
}) {
  const [displayScore, setDisplayScore] = useState(0)
  const rafRef = useRef<number | null>(null)
  const target = c.anomalyScore

  useEffect(() => {
    if (!visible) { setDisplayScore(0); return }
    const duration = 1100
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayScore(Math.round(eased * target * 10) / 10)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [visible, target])

  const r = 56, cx = 72, cy = 72
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - (visible ? displayScore / 100 : 0))

  const scoreColor = target >= 80 ? { stroke: '#ef4444', text: 'text-red-400', bar: 'bg-red-500', label: 'CRITICAL RISK', labelColor: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' }
    : target >= 65 ? { stroke: '#f97316', text: 'text-orange-400', bar: 'bg-orange-500', label: 'HIGH RISK', labelColor: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' }
    : target >= 45 ? { stroke: '#f59e0b', text: 'text-amber-400', bar: 'bg-amber-500', label: 'MEDIUM RISK', labelColor: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' }
    : { stroke: '#10b981', text: 'text-emerald-400', bar: 'bg-emerald-500', label: 'LOW RISK', labelColor: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' }

  if (!visible) return null

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden mt-4 animate-fade-in">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800">
        <Activity className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Ensemble Risk Assessment</span>
        <span className="ml-auto text-xs text-slate-500">Orchestrator — weighted combination of 5 agents</span>
      </div>

      <div className="p-6 flex flex-col md:flex-row items-center gap-8">

        {/* Gauge */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <svg width="144" height="144" viewBox="0 0 144 144">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="14" />
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={scoreColor.stroke}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.34,1.2,0.64,1)' }}
            />
            <text x={cx} y={cy - 6} textAnchor="middle" fill={scoreColor.stroke} fontSize="26" fontWeight="800" fontFamily="ui-monospace,monospace">
              {displayScore.toFixed(1)}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="ui-monospace,monospace">
              / 100
            </text>
          </svg>

          <div className={clsx('rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest', scoreColor.bg, scoreColor.labelColor)}>
            {scoreColor.label}
          </div>
          <div className="text-xs text-slate-500 text-center font-mono">
            {c.status.toUpperCase()} · {c.id}
          </div>
        </div>

        {/* Agent breakdown */}
        <div className="flex-1 space-y-2.5 w-full">
          {AGENTS.map(def => {
            const res = agentResults[def.id]
            const pct = Math.round(res.score * 100)
            return (
              <div key={def.id} className="flex items-center gap-3">
                <div className={clsx('text-[10px] font-bold w-32 shrink-0', def.accent.text)}>{def.name}</div>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={clsx('h-2 rounded-full transition-all duration-700', def.accent.bar)}
                    style={{ width: `${pct}%`, transitionDelay: `${AGENTS.indexOf(def) * 80}ms` }}
                  />
                </div>
                <div className={clsx('text-xs font-mono font-bold w-10 text-right shrink-0', def.accent.text)}>{pct}</div>
              </div>
            )
          })}

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-500 font-mono leading-relaxed">
            Weights: Email ×0.25 · Payment ×0.28 · Identity ×0.20 · Graph ×0.15 · Intel ×0.12
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Animation state type ──────────────────────────────────────────────────────

type Phase = 'idle' | 'orchestrating' | 'dispatched' | 'scoring' | 'ensemble'

const emptyLines = (): Record<AgentId, string[]> => ({ email: [], payment: [], identity: [], graph: [], intel: [] })
const emptyScores = (): Record<AgentId, number | null> => ({ email: null, payment: null, identity: null, graph: null, intel: null })

// ── Case list item ────────────────────────────────────────────────────────────

function CaseRow({ c, selected, onSelect }: { c: BECCase; selected: boolean; onSelect: () => void }) {
  const sev = c.severity === 'critical' ? { dot: 'bg-red-500', text: 'text-red-400', bg: '' }
    : c.severity === 'high' ? { dot: 'bg-orange-500', text: 'text-orange-400', bg: '' }
    : { dot: 'bg-amber-400', text: 'text-amber-400', bg: '' }

  return (
    <button
      onClick={onSelect}
      className={clsx(
        'w-full text-left px-4 py-3.5 border-b border-slate-800/80 transition-all',
        selected ? 'bg-slate-800 border-l-2 border-l-sky-500' : 'hover:bg-slate-800/50'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={clsx('w-1.5 h-1.5 rounded-full shrink-0 mt-px', sev.dot)} />
        <span className="font-mono text-[10px] text-slate-400">{c.id}</span>
        <span className={clsx('ml-auto text-[10px] font-bold uppercase', sev.text)}>{c.severity}</span>
      </div>
      <div className="text-xs font-semibold text-slate-200 truncate pl-3.5">{c.relationship.clientName}</div>
      <div className="text-[11px] text-slate-500 truncate pl-3.5 mt-0.5">
        {c.instruction.currency} {c.instruction.amount.toLocaleString()} · {c.instruction.beneficiaryCountry}
      </div>
    </button>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function InvestigationHub() {
  const [selected, setSelected] = useState<BECCase | null>(null)
  const [orchOpen, setOrchOpen] = useState<string[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [agentLines, setAgentLines] = useState<Record<AgentId, string[]>>(emptyLines)
  const [agentScores, setAgentScores] = useState<Record<AgentId, number | null>>(emptyScores)
  const [orchClose, setOrchClose] = useState<string[]>([])
  const [ensembleVisible, setEnsembleVisible] = useState(false)
  const [agentResults, setAgentResults] = useState<Record<AgentId, AgentResult> | null>(null)

  useEffect(() => {
    if (!selected) return

    // Reset
    setOrchOpen([])
    setPhase('idle')
    setAgentLines(emptyLines())
    setAgentScores(emptyScores())
    setOrchClose([])
    setEnsembleVisible(false)
    setAgentResults(null)

    const computed = computeAll(selected)
    setAgentResults(computed)

    const openLines = [
      `Initiating BEC detection sequence for ${selected.id} — ${selected.relationship.clientName}`,
      `Context loaded: email corpus · payment instruction · counterparty history · identity & session · external intel`,
      `Severity: ${selected.severity.toUpperCase()} | Dispatching 5 specialist agents in parallel…`,
    ]
    const closeLines = [
      `All 5 agents complete — computing weighted ensemble…`,
      `Weights: Email ×0.25 · Payment ×0.28 · Identity ×0.20 · Graph ×0.15 · Intel ×0.12`,
    ]

    const T: ReturnType<typeof setTimeout>[] = []

    openLines.forEach((line, i) => T.push(setTimeout(() => {
      setOrchOpen(p => [...p, line])
      if (i === 0) setPhase('orchestrating')
    }, i * 430)))

    const agentStart = openLines.length * 430 + 220
    T.push(setTimeout(() => setPhase('dispatched'), agentStart - 80))

    AGENTS.forEach((def, ai) => {
      const data = computed[def.id]
      const jitter = ai * 95
      data.lines.forEach((line, li) => T.push(setTimeout(() => {
        setAgentLines(p => ({ ...p, [def.id]: [...p[def.id], line] }))
      }, agentStart + jitter + li * 295)))

      const scoreAt = agentStart + jitter + data.lines.length * 295 + 320
      T.push(setTimeout(() => {
        setAgentScores(p => ({ ...p, [def.id]: data.score }))
      }, scoreAt))
    })

    const allDoneAt = agentStart + 95 * 4 + 5 * 295 + 320 + 500
    closeLines.forEach((line, i) => T.push(setTimeout(() => {
      setOrchClose(p => [...p, line])
      if (i === 0) setPhase('scoring')
    }, allDoneAt + i * 460)))

    const ensembleAt = allDoneAt + closeLines.length * 460 + 350
    T.push(setTimeout(() => { setEnsembleVisible(true); setPhase('ensemble') }, ensembleAt))

    return () => T.forEach(clearTimeout)
  }, [selected?.id])

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-950">

      {/* Case list */}
      <div className="w-72 shrink-0 bg-slate-900 border-r border-slate-800 overflow-y-auto flex flex-col">
        <div className="px-4 py-3.5 border-b border-slate-800 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Investigations</span>
          <span className="ml-auto text-[10px] text-slate-500 font-mono">{BEC_CASES.length} cases</span>
        </div>
        {BEC_CASES.map(c => (
          <CaseRow key={c.id} c={c} selected={selected?.id === c.id} onSelect={() => setSelected(c)} />
        ))}
      </div>

      {/* Detection panel */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
              <Cpu className="w-8 h-8 text-slate-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-400 mb-1">Select a case to begin detection</div>
              <div className="text-xs text-slate-600">5 specialist agents will analyze extracted data in parallel<br />and produce a weighted ensemble risk score</div>
            </div>
          </div>
        ) : (
          <div className="p-6 max-w-5xl mx-auto space-y-4">

            {/* Case strip */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className={clsx('w-2 h-2 rounded-full shrink-0',
                selected.severity === 'critical' ? 'bg-red-500' : selected.severity === 'high' ? 'bg-orange-500' : 'bg-amber-400')} />
              <span className="font-mono text-xs text-slate-400">{selected.id}</span>
              <span className="text-sm font-bold text-slate-100">{selected.relationship.clientName}</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400">{selected.instruction.currency} {selected.instruction.amount.toLocaleString()} → {selected.instruction.beneficiaryName} ({selected.instruction.beneficiaryCountry})</span>
              <div className={clsx('ml-auto text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border',
                selected.status === 'blocked' ? 'text-red-400 border-red-500/40 bg-red-500/10' :
                selected.status === 'flagged' ? 'text-orange-400 border-orange-500/40 bg-orange-500/10' :
                'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
              )}>
                {selected.status}
              </div>
            </div>

            {/* Orchestrator open */}
            {orchOpen.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                  <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Orchestrator</span>
                  {phase === 'dispatched' && <span className="ml-auto text-[10px] text-slate-500 font-mono animate-pulse">agents running…</span>}
                  {phase === 'scoring' && <span className="ml-auto text-[10px] text-slate-500 font-mono animate-pulse">computing ensemble…</span>}
                  {phase === 'ensemble' && <span className="ml-auto text-[10px] text-emerald-500 font-mono">complete</span>}
                </div>
                <div className="px-4 py-3">
                  <Terminal lines={orchOpen} active={phase === 'orchestrating'} />
                </div>
              </div>
            )}

            {/* Agent grid — 3 top + 2 bottom */}
            {phase !== 'idle' && phase !== 'orchestrating' && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {AGENTS.slice(0, 3).map(def => {
                    const lines = agentLines[def.id]
                    const score = agentScores[def.id]
                    const res = agentResults?.[def.id]
                    return score !== null && res ? (
                      <AgentCardDone key={def.id} def={def} lines={lines} result={res} />
                    ) : (
                      <AgentCard key={def.id} def={def} lines={lines} score={score} running={true} />
                    )
                  })}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {AGENTS.slice(3).map(def => {
                    const lines = agentLines[def.id]
                    const score = agentScores[def.id]
                    const res = agentResults?.[def.id]
                    return score !== null && res ? (
                      <AgentCardDone key={def.id} def={def} lines={lines} result={res} />
                    ) : (
                      <AgentCard key={def.id} def={def} lines={lines} score={score} running={true} />
                    )
                  })}
                </div>
              </>
            )}

            {/* Orchestrator close */}
            {orchClose.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                  <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Orchestrator — Ensemble</span>
                </div>
                <div className="px-4 py-3">
                  <Terminal lines={orchClose} active={false} />
                </div>
              </div>
            )}

            {/* Ensemble panel */}
            {agentResults && (
              <EnsemblePanel
                c={selected}
                agentResults={agentResults}
                visible={ensembleVisible}
              />
            )}

          </div>
        )}
      </div>
    </div>
  )
}
