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
  { id: 'email'     as const, name: 'Email Screener',     model: 'NLP / Transformer', icon: Mail,       accent: { dot: 'bg-sky-500',     text: 'text-sky-600',     border: 'border-sky-400/60',     bar: 'bg-sky-500'     } },
  { id: 'payment'   as const, name: 'Payment Anomaly',    model: 'XGBoost Ensemble',  icon: CreditCard,  accent: { dot: 'bg-violet-500',  text: 'text-violet-600',  border: 'border-violet-400/60',  bar: 'bg-violet-500'  } },
  { id: 'identity'  as const, name: 'Identity & Session', model: 'Isolation Forest',  icon: Fingerprint, accent: { dot: 'bg-amber-500',   text: 'text-amber-600',   border: 'border-amber-400/60',   bar: 'bg-amber-500'   } },
  { id: 'graph'     as const, name: 'Relationship Graph', model: 'Graph Neural Net',  icon: Network,     accent: { dot: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-400/60', bar: 'bg-emerald-500' } },
  { id: 'intel'     as const, name: 'Counterparty Intel', model: 'Rules + BERT',      icon: ShieldCheck, accent: { dot: 'bg-rose-500',    text: 'text-rose-600',    border: 'border-rose-400/60',    bar: 'bg-rose-500'    } },
]
type AgentId = typeof AGENTS[number]['id']

// ── Risk entity colours (light mode) ─────────────────────────────────────────

const ENTITY_RISK: Record<string, string> = {
  deadline:    'bg-red-100 text-red-700 border border-red-300 ring-1 ring-red-200',
  amount:      'bg-orange-100 text-orange-700 border border-orange-300 ring-1 ring-orange-200',
  account:     'bg-violet-100 text-violet-700 border border-violet-300 ring-1 ring-violet-200',
  institution: 'bg-blue-50 text-blue-700 border border-blue-200',
  person:      'bg-gray-100 text-gray-700 border border-gray-300',
  location:    'bg-teal-50 text-teal-700 border border-teal-200',
}
const ENTITY_DIM: Record<string, string> = {
  deadline: 'text-gray-400', amount: 'text-gray-400', account: 'text-gray-400',
  institution: 'text-gray-400', person: 'text-gray-400', location: 'text-gray-400',
}

const ENTITY_ACTIVATIONS: Partial<Record<AgentId, Partial<Record<number, string[]>>>> = {
  email:   { 1: ['deadline'], 2: ['location'], 4: ['person'] },
  payment: { 0: ['amount', 'account'], 2: ['institution'] },
  graph:   { 1: ['institution'] },
}

// ── Signal card type & builder ────────────────────────────────────────────────

interface SCard {
  id: string; agentId: AgentId; atLine: number
  Icon: React.FC<{ className?: string }>
  label: string; value: string; detail: string; sev: 'critical' | 'high' | 'medium'
}
const SEV_CARD: Record<SCard['sev'], { border: string; bg: string; icon: string; dot: string; val: string }> = {
  critical: { border: 'border-red-300',    bg: 'bg-red-50',    icon: 'text-red-500',    dot: 'bg-red-500',    val: 'text-red-700'    },
  high:     { border: 'border-orange-300', bg: 'bg-orange-50', icon: 'text-orange-500', dot: 'bg-orange-500', val: 'text-orange-700' },
  medium:   { border: 'border-amber-300',  bg: 'bg-amber-50',  icon: 'text-amber-500',  dot: 'bg-amber-500',  val: 'text-amber-700'  },
}

function buildSignalCards(c: BECCase): SCard[] {
  const { email: e, instruction: i, identity: id, externalIntel: ei, relationship: r, nlpAnalysis: n } = c
  const cards: SCard[] = []
  if (ei.emailDomainIsLookalike)
    cards.push({ id:'domain_lookalike', agentId:'email', atLine:2, Icon:AlertTriangle, label:'Domain Lookalike', value:`${e.senderAddress.split('@')[1]}`, detail:`spoofs ${ei.lookalikeDomain ?? 'known domain'} · ${e.senderDomainAgeDays}d old`, sev:'critical' })
  if (n.urgencyPhrases.length > 0)
    cards.push({ id:'urgency', agentId:'email', atLine:1, Icon:Zap, label:'Urgency Language', value:`${n.urgencyPhrases.length} phrases`, detail:`"${n.urgencyPhrases[0]?.slice(0,38)}"`, sev:'high' })
  if (n.overridePhrases.length > 0)
    cards.push({ id:'override', agentId:'email', atLine:1, Icon:Lock, label:'Override Request', value:`${n.overridePhrases.length} override phrases`, detail:`"${n.overridePhrases[0]?.slice(0,38)}"`, sev:'critical' })
  if (e.dkim === 'fail' || e.spf === 'fail')
    cards.push({ id:'auth_fail', agentId:'email', atLine:4, Icon:AlertTriangle, label:'Auth Failure', value:`DKIM ${e.dkim.toUpperCase()} · SPF ${e.spf.toUpperCase()}`, detail:`Sender domain not authenticated`, sev:'high' })
  if (i.amountDeviationFactor > 2)
    cards.push({ id:'amount', agentId:'payment', atLine:1, Icon:ArrowUpRight, label:'Amount Anomaly', value:`${i.amountDeviationFactor.toFixed(1)}× avg`, detail:`${i.currency} ${i.amount.toLocaleString()} vs avg ${i.historicalAvg.toLocaleString()}`, sev: i.amountDeviationFactor > 5 ? 'critical' : 'high' })
  if (i.beneficiaryIsNew)
    cards.push({ id:'new_bene', agentId:'payment', atLine:2, Icon:UserX, label:'New Beneficiary', value:i.beneficiaryName.slice(0,26), detail:`${i.beneficiaryCountry} · first occurrence`, sev:'high' })
  if (!i.dualAuthFollowed || i.selfApproved)
    cards.push({ id:'control', agentId:'payment', atLine:3, Icon:Lock, label: i.selfApproved ? 'Self-Approval' : 'Dual-Auth Bypassed', value:`${i.approvalWorkflowMinutes}min approval`, detail: i.selfApproved ? `${i.submittedBy} approved own instruction` : 'Maker-checker control not followed', sev:'critical' })
  if (id.deviceIsNew)
    cards.push({ id:'device', agentId:'identity', atLine:1, Icon:Monitor, label:'Unknown Device', value:'New — not in registry', detail:id.deviceId.slice(0,28), sev:'high' })
  if (id.loginLocation !== id.expectedLocation)
    cards.push({ id:'location', agentId:'identity', atLine:2, Icon:MapPin, label:'Location Mismatch', value:id.loginLocation, detail:`expected: ${id.expectedLocation}`, sev:'high' })
  if (ei.ipFlagged)
    cards.push({ id:'ip', agentId:'graph', atLine:4, Icon:AlertTriangle, label:'Flagged IP', value:e.originatingIP, detail:(ei.ipFraudSource ?? '').slice(0,38), sev:'critical' })
  if (!r.typicalCountries.includes(i.beneficiaryCountry))
    cards.push({ id:'jurisdiction', agentId:'graph', atLine:3, Icon:Globe, label:'New Jurisdiction', value:i.beneficiaryCountry, detail:`outside baseline: ${r.typicalCountries.join(', ')}`, sev:'high' })
  if (i.submittedOutsideHours)
    cards.push({ id:'hours', agentId:'payment', atLine:3, Icon:Clock, label:'Off-Hours Submission', value:i.submittedAt, detail:'Outside normal business hours', sev:'medium' })
  if (ei.swiftControlsFlag)
    cards.push({ id:'swift', agentId:'intel', atLine:2, Icon:Activity, label:'SWIFT Controls Alert', value:'Payment flagged', detail:ei.beneficiaryBankCountryRisk.split('—')[0].trim(), sev:'high' })
  if (ei.fincenMatch || ei.beneficiaryFraudFlag)
    cards.push({ id:'fraud_net', agentId:'intel', atLine:1, Icon:Hash, label:'Fraud Network Match', value:'Beneficiary flagged', detail:(ei.beneficiaryFraudSource ?? 'FinCEN 314(b) match').slice(0,38), sev:'critical' })
  return cards.slice(0, 10)
}

// ── Agent score computation ───────────────────────────────────────────────────

function computeAgentData(c: BECCase): Record<AgentId, { score: number; lines: string[] }> {
  const { email: e, nlpAnalysis: n, externalIntel: ei, instruction: i, identity: id, relationship: r } = c
  let es=0; es+=Math.min(n.urgencyPhrases.length*.11,.33); es+=Math.min(n.overridePhrases.length*.14,.28); es+=(1-n.writingStyleConsistency)*.21; es+=ei.emailDomainIsLookalike?.26:0; es+=e.senderDomainAgeDays<90?.14:e.senderDomainAgeDays<180?.07:0; es+=e.dkim==='fail'?.06:0
  let ps=0; ps+=Math.min((i.amountDeviationFactor-1)/11,1)*.32; ps+=i.beneficiaryIsNew?.28:0; ps+=i.submittedOutsideHours?.14:0; ps+=i.roundNumberFlag?.13:0; ps+=i.belowThresholdFlag?.13:0
  const lm=id.loginLocation!==id.expectedLocation; let is=0; is+=id.deviceIsNew?.30:0; is+=lm?.23:0; is+=i.selfApproved?.22:0; is+=i.approvalWorkflowMinutes<5?.18:i.approvalWorkflowMinutes<15?.09:0; is+=id.vpnDetected?.07:0
  const cb=r.typicalCountries.includes(i.beneficiaryCountry); let gs=0; gs+=ei.beneficiaryFraudFlag?.38:0; gs+=ei.emailDomainIsLookalike?.22:0; gs+=!cb?.22:0; gs+=ei.ipFlagged?.18:0
  let ns=0; ns+=ei.ofacMatch?.40:0; ns+=ei.fincenMatch?.28:0; ns+=ei.swiftControlsFlag?.22:0; if(ns<.12&&!cb) ns+=.20
  return {
    email:    { score:Math.min(1,es), lines:[ `Loading ${r.clientName} baseline — ${n.histStyleBaselineSamples} emails`, `Urgency: ${n.urgencyPhrases.length} · Secrecy: ${n.secrecyPhrases.length} · Override: ${n.overridePhrases.length}`, ei.emailDomainIsLookalike?`Lookalike: ${e.senderAddress.split('@')[1]} ↔ ${ei.lookalikeDomain}`:`Domain check — no lookalike detected`, `Style match: ${Math.round(n.writingStyleConsistency*100)}% — ${n.writingStyleConsistency<.55?'anomalous authorship':'within range'}`, `DKIM ${e.dkim.toUpperCase()} · SPF ${e.spf.toUpperCase()} · DMARC ${e.dmarc.toUpperCase()} · domain ${e.senderDomainAgeDays}d` ] },
    payment:  { score:Math.min(1,ps), lines:[ `Instruction: ${i.currency} ${i.amount.toLocaleString()} → ${i.beneficiaryName}`, `Amount: ${i.amountDeviationFactor.toFixed(1)}× avg — ${i.amountDeviationFactor>5?'extreme outlier':i.amountDeviationFactor>2?'elevated':'normal'}`, `Beneficiary: ${i.beneficiaryIsNew?'FIRST-OCCURRENCE · absent from registry':'known counterparty'}`, `${i.submittedOutsideHours?'OFF-HOURS':'Standard hours'} · ${i.approvalWorkflowMinutes}min · dual-auth: ${i.dualAuthFollowed?'yes':'BYPASSED'}`, `Round-number: ${i.roundNumberFlag?'YES':'no'} · Below-threshold: ${i.belowThresholdFlag?'YES':'no'}` ] },
    identity: { score:Math.min(1,is), lines:[ `User ${id.submittingUser} · ${id.loginTime}`, `Device: ${id.deviceIsNew?'NEW — not in registry':'recognised'} · ${id.deviceId.slice(0,18)}`, `Location: ${id.loginLocation} — expected ${id.expectedLocation} · ${lm?'MISMATCH':'match'}`, `MFA: ${id.mfaUsed?id.mfaMethod:'NOT USED'} · VPN: ${id.vpnDetected?'DETECTED':'none'} · failed: ${id.priorFailedLogins}`, `Approval: ${i.approvalWorkflowMinutes}min${i.selfApproved?' · SELF-APPROVED':''}` ] },
    graph:    { score:Math.min(1,gs), lines:[ `Graph: ${r.clientName} · ${r.totalPaymentsLast12M} payments · ${r.counterpartyRegistryCount} counterparties`, `${i.beneficiaryName}: ${i.beneficiaryIsNew?'ABSENT — new isolated node':'found in graph'}`, `Fraud network: ${ei.beneficiaryFraudFlag?`FLAGGED — ${ei.beneficiaryFraudSource?.slice(0,30)}`:'no beneficiary match'}`, `Geography: ${i.beneficiaryCountry} ${cb?'within':'OUTSIDE'} baseline (${r.typicalCountries.join(', ')})`, `IP ${e.originatingIP}: ${ei.ipFlagged?`FLAGGED · ${ei.ipAsn.slice(0,28)}`:'no fraud signal'}` ] },
    intel:    { score:Math.min(1,ns), lines:[ `OFAC: ${ei.ofacMatch?'MATCH FOUND':'clear'} · FinCEN 314(b): ${ei.fincenMatch?'MATCH':'no match'}`, `SWIFT GPI: ${ei.swiftControlsFlag?'CONTROLS ALERT':'no alert'} · country risk: ${ei.beneficiaryBankCountryRisk.split('—')[0].trim()}`, `Fraud flag: ${ei.beneficiaryFraudFlag?`YES — ${(ei.beneficiaryFraudSource??'').slice(0,30)}`:'none'}`, `AML typology: ${ei.emailDomainIsLookalike&&i.beneficiaryIsNew?'BEC-3A':!i.dualAuthFollowed?'BEC-5A':!cb?'BEC-2B':'BEC-1C'}`, `Sanctions: ${ei.sanctionsScreeningResult.slice(0,42)}` ] },
  }
}

// ── Agent detail helper primitives ────────────────────────────────────────────

type ALvl = 'critical' | 'high' | 'medium' | 'ok' | undefined

function ARow({ label, value, lvl, mono }: { label: string; value: string; lvl?: ALvl; mono?: boolean }) {
  const vc = lvl === 'critical' ? 'text-red-700 bg-red-50 px-1 rounded border border-red-200 font-bold'
    : lvl === 'high'   ? 'text-orange-700 bg-orange-50 px-1 rounded border border-orange-200'
    : lvl === 'medium' ? 'text-amber-700 bg-amber-50 px-1 rounded'
    : lvl === 'ok'     ? 'text-emerald-600'
    : 'text-gray-800'
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-[10px] text-gray-400 shrink-0 w-[4.5rem] leading-relaxed">{label}</span>
      <span className={clsx('text-[10px] flex-1 text-right leading-relaxed break-words', mono && 'font-mono', vc)}>{value}</span>
    </div>
  )
}
function ASec({ title }: { title: string }) {
  return <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-3 pb-1.5 bg-gray-50">{title}</div>
}

// ── Per-agent detail views ────────────────────────────────────────────────────

function EmailDetail({ c }: { c: BECCase }) {
  const { email: e, nlpAnalysis: n, externalIntel: ei } = c
  return (
    <div>
      <ASec title="NLP Analysis" />
      <div className="px-3">
        <ARow label="Primary tone"  value={n.primaryTone}  />
        <ARow label="Secondary"     value={n.secondaryTone} />
        <ARow label="Style match"   value={`${Math.round(n.writingStyleConsistency*100)}%`} lvl={n.writingStyleConsistency<.4?'critical':n.writingStyleConsistency<.6?'high':undefined} />
        <ARow label="Baseline"      value={`${n.histStyleBaselineSamples} emails`} />
        <ARow label="Grammar errs"  value={n.grammaticalErrorCount.toString()} lvl={n.grammaticalErrorCount>2?'high':n.grammaticalErrorCount>0?'medium':undefined} />
        <ARow label="Sentiment"     value={`${n.sentimentLabel} (${n.sentiment.toFixed(2)})`} lvl={n.sentiment<-.5?'high':undefined} />
      </div>
      <ASec title="Signal Phrases" />
      <div className="px-3">
        <ARow label="Urgency"   value={`${n.urgencyPhrases.length} phrases`}  lvl={n.urgencyPhrases.length>2?'critical':n.urgencyPhrases.length>0?'high':undefined} />
        <ARow label="Secrecy"   value={`${n.secrecyPhrases.length} phrases`}  lvl={n.secrecyPhrases.length>1?'high':n.secrecyPhrases.length>0?'medium':undefined} />
        <ARow label="Override"  value={`${n.overridePhrases.length} phrases`} lvl={n.overridePhrases.length>0?'critical':undefined} />
        <ARow label="Authority" value={`${n.authorityPhrases.length} phrases`} lvl={n.authorityPhrases.length>2?'medium':undefined} />
      </div>
      {n.urgencyPhrases.length > 0 && (
        <>
          <ASec title="Top Urgency Phrases" />
          <div className="px-3 space-y-1 pb-2">
            {n.urgencyPhrases.slice(0,3).map((p,i) => (
              <div key={i} className="text-[10px] font-mono text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200 leading-relaxed">"{p}"</div>
            ))}
          </div>
        </>
      )}
      {n.overridePhrases.length > 0 && (
        <>
          <ASec title="Override Requests" />
          <div className="px-3 space-y-1 pb-2">
            {n.overridePhrases.slice(0,2).map((p,i) => (
              <div key={i} className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 leading-relaxed">"{p}"</div>
            ))}
          </div>
        </>
      )}
      <ASec title="Auth & Routing" />
      <div className="px-3">
        <ARow label="DKIM"     value={e.dkim.toUpperCase()}  lvl={e.dkim==='fail'?'critical':'ok'} mono />
        <ARow label="SPF"      value={e.spf.toUpperCase()}   lvl={e.spf==='fail'?'critical':'ok'} mono />
        <ARow label="DMARC"    value={e.dmarc.toUpperCase()} lvl={e.dmarc==='fail'?'critical':'ok'} mono />
        <ARow label="Reply-To" value={e.replyToAddress ?? 'same as sender'} lvl={e.replyToAddress?'high':undefined} mono />
        <ARow label="Prior emails" value={`${e.totalEmailsFromSender} from sender`} lvl={e.isFirstContact?'high':undefined} />
      </div>
      <ASec title="Domain Intelligence" />
      <div className="px-3">
        <ARow label="Domain"    value={e.senderAddress.split('@')[1]} mono lvl={ei.emailDomainIsLookalike?'critical':undefined} />
        <ARow label="Age"       value={`${e.senderDomainAgeDays} days`} lvl={e.senderDomainAgeDays<30?'critical':e.senderDomainAgeDays<90?'high':e.senderDomainAgeDays<180?'medium':undefined} />
        <ARow label="Lookalike" value={ei.emailDomainIsLookalike?`YES ↔ ${ei.lookalikeDomain}`:'no'} lvl={ei.emailDomainIsLookalike?'critical':'ok'} />
        <ARow label="Registrar" value={e.senderDomainRegistrar} />
      </div>
    </div>
  )
}

function PaymentDetail({ c }: { c: BECCase }) {
  const i = c.instruction
  return (
    <div>
      <ASec title="Amount Analysis" />
      <div className="px-3">
        <ARow label="Amount"    value={`${i.currency} ${i.amount.toLocaleString()}`}    lvl={i.amountDeviationFactor>5?'critical':i.amountDeviationFactor>2?'high':undefined} mono />
        <ARow label="Hist avg"  value={`${i.currency} ${i.historicalAvg.toLocaleString()}`} />
        <ARow label="Hist max"  value={`${i.currency} ${i.historicalMax.toLocaleString()}`} />
        <ARow label="Deviation" value={`${i.amountDeviationFactor.toFixed(1)}× average`} lvl={i.amountDeviationFactor>5?'critical':i.amountDeviationFactor>2?'high':undefined} />
        <ARow label="Round no." value={i.roundNumberFlag?'YES':'no'} lvl={i.roundNumberFlag?'medium':undefined} />
        <ARow label="Sub-thresh"value={i.belowThresholdFlag?'YES — structuring signal':'no'} lvl={i.belowThresholdFlag?'high':undefined} />
      </div>
      <ASec title="Beneficiary" />
      <div className="px-3">
        <ARow label="Name"      value={i.beneficiaryName}    lvl={i.beneficiaryIsNew?'high':undefined} />
        <ARow label="Bank"      value={i.beneficiaryBank}    />
        <ARow label="Country"   value={i.beneficiaryCountry} lvl={!c.relationship.typicalCountries.includes(i.beneficiaryCountry)?'high':undefined} />
        <ARow label="New?"      value={i.beneficiaryIsNew?'YES — first occurrence':'known'} lvl={i.beneficiaryIsNew?'critical':undefined} />
        <ARow label="Last pmnt" value={i.daysSinceLastPaymentToBeneficiary!==null?`${i.daysSinceLastPaymentToBeneficiary}d ago`:'never'} lvl={i.beneficiaryIsNew?'critical':undefined} />
        <ARow label="Account"   value={i.beneficiaryAccount} mono />
      </div>
      <ASec title="Timing & Controls" />
      <div className="px-3">
        <ARow label="Submitted" value={i.submittedAt} lvl={i.submittedOutsideHours?'high':undefined} />
        <ARow label="Off-hours" value={i.submittedOutsideHours?'YES':'no'} lvl={i.submittedOutsideHours?'high':undefined} />
        <ARow label="Approval"  value={`${i.approvalWorkflowMinutes} minutes`} lvl={i.approvalWorkflowMinutes<5?'critical':i.approvalWorkflowMinutes<15?'high':undefined} />
        <ARow label="Dual-auth" value={i.dualAuthFollowed?'followed':'BYPASSED'} lvl={!i.dualAuthFollowed?'critical':'ok'} />
        <ARow label="Self-appr" value={i.selfApproved?'YES':'no'} lvl={i.selfApproved?'critical':undefined} />
        <ARow label="Modified"  value={i.modifiedAfterEntry?'YES — after entry':'no'} lvl={i.modifiedAfterEntry?'high':undefined} />
        <ARow label="Source"    value={i.sourceSystem} />
        <ARow label="Channel"   value={i.channel} />
      </div>
    </div>
  )
}

function IdentityDetail({ c }: { c: BECCase }) {
  const { identity: id, instruction: i } = c
  const locMismatch = id.loginLocation !== id.expectedLocation
  return (
    <div>
      <ASec title="User Authentication" />
      <div className="px-3">
        <ARow label="User"      value={id.submittingUser} />
        <ARow label="User ID"   value={id.userId} mono />
        <ARow label="Login"     value={id.loginTime} />
        <ARow label="MFA"       value={id.mfaUsed?id.mfaMethod:'NOT USED'} lvl={!id.mfaUsed?'critical':'ok'} />
        <ARow label="Failed"    value={`${id.priorFailedLogins} logins (24h)`} lvl={id.priorFailedLogins>3?'critical':id.priorFailedLogins>0?'medium':undefined} />
        <ARow label="Authority" value={id.approvalAuthoritySufficient?'sufficient':'INSUFFICIENT'} lvl={!id.approvalAuthoritySufficient?'high':undefined} />
      </div>
      <ASec title="Device & Location" />
      <div className="px-3">
        <ARow label="Device"    value={id.deviceIsNew?'NEW — unregistered':'recognised'} lvl={id.deviceIsNew?'critical':undefined} />
        <ARow label="Device ID" value={id.deviceId.slice(0,22)} mono />
        <ARow label="Location"  value={id.loginLocation} lvl={locMismatch?'critical':undefined} />
        <ARow label="Expected"  value={id.expectedLocation} />
        <ARow label="Match"     value={locMismatch?'NO — MISMATCH':'yes'} lvl={locMismatch?'critical':'ok'} />
        <ARow label="VPN"       value={id.vpnDetected?'DETECTED':'not detected'} lvl={id.vpnDetected?'high':undefined} />
      </div>
      <ASec title="Session Behaviour" />
      <div className="px-3">
        <ARow label="Duration"  value={`${id.sessionDurationMinutes} min`} lvl={id.sessionDurationMinutes<10?'medium':undefined} />
        <ARow label="Pages"     value={`${id.sessionPagesVisited} visited`} lvl={id.sessionPagesVisited<4?'medium':undefined} />
        <ARow label="Approval"  value={`${i.approvalWorkflowMinutes} min`} lvl={i.approvalWorkflowMinutes<5?'critical':i.approvalWorkflowMinutes<15?'high':undefined} />
        <ARow label="Self-appr" value={i.selfApproved?'YES — maker/checker bypassed':'no'} lvl={i.selfApproved?'critical':undefined} />
      </div>
    </div>
  )
}

function GraphDetail({ c }: { c: BECCase }) {
  const { relationship: r, instruction: i, externalIntel: ei, email: e } = c
  const countryInBaseline = r.typicalCountries.includes(i.beneficiaryCountry)
  return (
    <div>
      <ASec title="Client Baseline" />
      <div className="px-3">
        <ARow label="Client"    value={r.clientName} />
        <ARow label="Tenure"    value={`${r.tenureYears} years`} lvl='ok' />
        <ARow label="Countries" value={r.typicalCountries.join(', ')} />
        <ARow label="Channels"  value={r.typicalChannels.join(', ')} />
        <ARow label="Payments"  value={`${r.totalPaymentsLast12M} / last 12mo`} />
        <ARow label="Registry"  value={`${r.counterpartyRegistryCount} known`} />
        <ARow label="Last pmnt" value={r.lastPaymentDate} />
      </div>
      <ASec title="Beneficiary Node" />
      <div className="px-3">
        <ARow label="Name"      value={i.beneficiaryName} lvl={i.beneficiaryIsNew?'critical':undefined} />
        <ARow label="Bank"      value={i.beneficiaryBank} />
        <ARow label="Country"   value={i.beneficiaryCountry} lvl={!countryInBaseline?'high':undefined} />
        <ARow label="In graph"  value={i.beneficiaryIsNew?'ABSENT — new node':'present'} lvl={i.beneficiaryIsNew?'critical':undefined} />
        <ARow label="Baseline"  value={countryInBaseline?'within':'OUTSIDE baseline'} lvl={!countryInBaseline?'high':undefined} />
        <ARow label="Fraud flag"value={ei.beneficiaryFraudFlag?`YES — ${(ei.beneficiaryFraudSource??'').slice(0,25)}`:'none'} lvl={ei.beneficiaryFraudFlag?'critical':undefined} />
      </div>
      <ASec title="IP & Network" />
      <div className="px-3">
        <ARow label="IP"        value={e.originatingIP} mono lvl={ei.ipFlagged?'critical':undefined} />
        <ARow label="Flagged"   value={ei.ipFlagged?'YES':'no'} lvl={ei.ipFlagged?'critical':'ok'} />
        <ARow label="ASN"       value={ei.ipAsn.slice(0,30)} mono lvl={ei.ipFlagged?'critical':undefined} />
        <ARow label="Source"    value={(ei.ipFraudSource??'').slice(0,35)} lvl={ei.ipFlagged?'critical':undefined} />
        <ARow label="Geo"       value={ei.ipGeolocation} />
        <ARow label="Domain"    value={ei.emailDomainIsLookalike?`LOOKALIKE ↔ ${ei.lookalikeDomain}`:'no lookalike'} lvl={ei.emailDomainIsLookalike?'critical':undefined} />
      </div>
    </div>
  )
}

function IntelDetail({ c }: { c: BECCase }) {
  const { externalIntel: ei, instruction: i, relationship: r } = c
  const cb = r.typicalCountries.includes(i.beneficiaryCountry)
  const typology = ei.emailDomainIsLookalike && i.beneficiaryIsNew ? 'BEC-3A'
    : !i.dualAuthFollowed || i.selfApproved ? 'BEC-5A'
    : !cb ? 'BEC-2B' : 'BEC-1C'
  return (
    <div>
      <ASec title="Sanctions Screening" />
      <div className="px-3">
        <ARow label="OFAC SDN"  value={ei.ofacMatch?'MATCH FOUND':'no match'} lvl={ei.ofacMatch?'critical':'ok'} />
        <ARow label="FinCEN"    value={ei.fincenMatch?'MATCH FOUND':'no match'} lvl={ei.fincenMatch?'critical':'ok'} />
        <ARow label="OFAC match"value={ei.ofacMatch?'YES':'cleared'} lvl={ei.ofacMatch?'critical':'ok'} />
        <ARow label="Result"    value={ei.sanctionsScreeningResult.slice(0,40)} />
      </div>
      <ASec title="SWIFT Intelligence" />
      <div className="px-3">
        <ARow label="Controls"  value={ei.swiftControlsFlag?'ALERT — enhanced monitoring':'no alert'} lvl={ei.swiftControlsFlag?'high':undefined} />
        <ARow label="Cntry risk"value={ei.beneficiaryBankCountryRisk.split('—')[0].trim()} lvl={ei.beneficiaryBankCountryRisk.toLowerCase().includes('high')?'critical':ei.beneficiaryBankCountryRisk.toLowerCase().includes('medium')?'high':undefined} />
        <ARow label="Bene bank" value={i.beneficiaryBank} />
      </div>
      <ASec title="Fraud Flags" />
      <div className="px-3">
        <ARow label="Bene flag" value={ei.beneficiaryFraudFlag?'YES':'none'} lvl={ei.beneficiaryFraudFlag?'critical':'ok'} />
        <ARow label="Fraud src" value={(ei.beneficiaryFraudSource??'N/A').slice(0,35)} lvl={ei.beneficiaryFraudFlag?'critical':undefined} />
        <ARow label="IP flagged"value={ei.ipFlagged?'YES':'no'} lvl={ei.ipFlagged?'critical':'ok'} />
        <ARow label="IP source" value={(ei.ipFraudSource??'N/A').slice(0,35)} lvl={ei.ipFlagged?'high':undefined} />
        <ARow label="Geo"       value={ei.ipGeolocation} />
        <ARow label="ASN"       value={ei.ipAsn.slice(0,30)} mono />
      </div>
      <ASec title="AML Typology" />
      <div className="px-3">
        <ARow label="Match"     value={typology} lvl='critical' />
        <ARow label="Pattern"   value={typology==='BEC-3A'?'Lookalike + new bene':typology==='BEC-5A'?'Control override':typology==='BEC-2B'?'New offshore entity':'Social engineering'} lvl='high' />
        <ARow label="Action"    value="Enhanced Due Diligence" lvl='medium' />
      </div>
    </div>
  )
}

// ── Agent detail panel (shown in middle column when agent clicked) ─────────────

function AgentDetailPane({ agentId, c }: { agentId: AgentId; c: BECCase }) {
  const def = AGENTS.find(a => a.id === agentId)!
  const Icon = def.icon
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className={clsx('px-3 py-2.5 border-b border-gray-200 flex items-center gap-2 shrink-0 bg-gray-50')}>
        <Icon className={clsx('w-3.5 h-3.5 shrink-0', def.accent.text)} />
        <div className="flex-1 min-w-0">
          <div className={clsx('text-[10px] font-bold uppercase tracking-wider truncate', def.accent.text)}>{def.name}</div>
          <div className="text-[9px] text-gray-400">{def.model} · findings</div>
        </div>
        <span className={clsx('text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide', def.accent.text, def.accent.border, 'bg-white')}>
          active
        </span>
      </div>
      <div className="flex-1 overflow-y-auto bg-white">
        {agentId === 'email'    && <EmailDetail    c={c} />}
        {agentId === 'payment'  && <PaymentDetail  c={c} />}
        {agentId === 'identity' && <IdentityDetail c={c} />}
        {agentId === 'graph'    && <GraphDetail    c={c} />}
        {agentId === 'intel'    && <IntelDetail    c={c} />}
      </div>
    </div>
  )
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
      <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 shrink-0">
        <div className="flex items-start gap-2.5">
          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-gray-900 truncate mb-0.5">{e.subject}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-gray-500">From <span className={clsx('font-mono', ei.emailDomainIsLookalike ? 'text-red-600' : 'text-gray-700')}>{e.senderAddress}</span></span>
              <span className="text-[11px] text-gray-400">{e.receivedAt}</span>
              {ei.emailDomainIsLookalike && <span className="text-[10px] bg-red-50 text-red-700 border border-red-300 px-1.5 py-0.5 rounded font-mono">↔ {ei.lookalikeDomain}</span>}
              {e.senderDomainAgeDays < 90 && <span className="text-[10px] bg-orange-50 text-orange-700 border border-orange-300 px-1.5 py-0.5 rounded">{e.senderDomainAgeDays}d old</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 text-xs leading-relaxed font-mono whitespace-pre-wrap bg-white">
        {e.bodySegments.map((seg, i) => {
          if (!seg.entityType) return <span key={i} className="text-gray-700">{seg.text}</span>
          const active = activeEntities.has(seg.entityType)
          return <span key={i} title={seg.entityType} className={clsx('rounded px-0.5 cursor-default transition-all duration-500', active ? ENTITY_RISK[seg.entityType] : ENTITY_DIM[seg.entityType] ?? 'text-gray-400')}>{seg.text}</span>
        })}
      </div>
      {activePhrases.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 shrink-0">
          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Email agent — detected signals</div>
          <div className="flex flex-wrap gap-1.5">
            {activePhrases.map((p, i) => (
              <span key={i} className={clsx('text-[10px] font-mono px-2 py-0.5 rounded border',
                p.type === 'urgency' ? 'bg-red-50 text-red-700 border-red-300' :
                p.type === 'secrecy' ? 'bg-purple-50 text-purple-700 border-purple-300' :
                'bg-amber-50 text-amber-700 border-amber-300'
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

// ── Signal card ───────────────────────────────────────────────────────────────

function SignalCard({ card, active }: { card: SCard; active: boolean }) {
  const s = SEV_CARD[card.sev]
  const Icon = card.Icon
  return (
    <div className={clsx('rounded-xl border p-3 transition-all duration-500', active ? clsx(s.border, s.bg) : 'border-gray-200 bg-gray-50 opacity-40')}>
      <div className="flex items-start gap-2">
        <Icon className={clsx('w-3.5 h-3.5 shrink-0 mt-0.5', active ? s.icon : 'text-gray-300')} />
        <div className="flex-1 min-w-0">
          <div className={clsx('text-[10px] font-bold uppercase tracking-wider mb-0.5', active ? s.icon : 'text-gray-300')}>{card.label}</div>
          <div className={clsx('text-xs font-semibold truncate', active ? s.val : 'text-gray-300')}>{card.value}</div>
          <div className="text-[10px] text-gray-400 truncate mt-0.5">{card.detail}</div>
        </div>
        {active && <div className={clsx('w-1.5 h-1.5 rounded-full shrink-0 mt-1', s.dot)} />}
      </div>
    </div>
  )
}

// ── Agent row (right panel, clickable) ───────────────────────────────────────

function AgentRow({ def, lines, score, isSelected, onClick }: {
  def: typeof AGENTS[number]
  lines: string[]
  score: number | null
  isSelected: boolean
  onClick: () => void
}) {
  const { accent } = def
  const Icon = def.icon
  const running = lines.length > 0 && score === null
  const done = score !== null
  const pct = done ? Math.round(score * 100) : 0

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left rounded-xl border px-3 py-2.5 transition-all duration-200 cursor-pointer',
        isSelected
          ? clsx(accent.border, 'bg-blue-50 ring-1', accent.border.replace('border-', 'ring-'))
          : done ? clsx(accent.border, 'bg-white hover:bg-gray-50 shadow-sm')
          : running ? 'border-gray-300 bg-white hover:bg-gray-50'
          : 'border-gray-100 bg-gray-50 opacity-40 pointer-events-none'
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className={clsx('w-1.5 h-1.5 rounded-full shrink-0', done ? accent.dot : running ? clsx(accent.dot, 'animate-pulse') : 'bg-gray-300')} />
        <Icon className={clsx('w-3 h-3 shrink-0', accent.text)} />
        <span className={clsx('text-[11px] font-bold flex-1 truncate', accent.text)}>{def.name}</span>
        {done && <span className={clsx('text-sm font-bold font-mono shrink-0', accent.text)}>{pct}</span>}
        {running && <span className="text-[9px] text-gray-400 font-mono animate-pulse">ANALYZING</span>}
      </div>
      <div className="pl-5 mb-1.5 min-h-[2rem]">
        <div className="text-[10px] font-mono text-gray-400 leading-relaxed line-clamp-2">{lines[lines.length - 1] ?? ''}</div>
      </div>
      {done && (
        <div className="pl-5 flex items-center gap-1.5">
          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className={clsx('h-1 rounded-full transition-all duration-700', accent.bar)} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[9px] text-gray-400 font-mono shrink-0">{pct}/100</span>
          {isSelected && <span className={clsx('text-[9px] shrink-0 font-bold ml-1', accent.text)}>← viewing</span>}
        </div>
      )}
    </button>
  )
}

// ── Ensemble score ────────────────────────────────────────────────────────────

function EnsembleScore({ c, agentData, visible }: {
  c: BECCase
  agentData: Record<AgentId, { score: number; lines: string[] }>
  visible: boolean
}) {
  const [disp, setDisp] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!visible) { setDisp(0); return }
    const target = c.anomalyScore, t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 1100, 1)
      setDisp(Math.round((1 - Math.pow(1 - p, 3)) * target * 10) / 10)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [visible, c.anomalyScore])

  if (!visible) return null

  const t = c.anomalyScore
  const col = t>=80?{stroke:'#ef4444',text:'text-red-600',label:'CRITICAL',badge:'bg-red-50 text-red-700 border-red-300'}
    :t>=65?{stroke:'#f97316',text:'text-orange-600',label:'HIGH',badge:'bg-orange-50 text-orange-700 border-orange-300'}
    :t>=45?{stroke:'#f59e0b',text:'text-amber-600',label:'MEDIUM',badge:'bg-amber-50 text-amber-700 border-amber-300'}
    :{stroke:'#10b981',text:'text-emerald-600',label:'LOW',badge:'bg-emerald-50 text-emerald-700 border-emerald-300'}

  const r=38,cx=46,cy=46,circ=2*Math.PI*r,dash=circ*(1-disp/100)
  return (
    <div className="border-t border-gray-200 bg-gray-50 p-3">
      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Orchestrator — Ensemble Score</div>
      <div className="flex items-center gap-3 mb-3">
        <svg width="92" height="92" viewBox="0 0 92 92" className="shrink-0">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={col.stroke} strokeWidth="10"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dash}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition:'stroke-dashoffset 1.1s cubic-bezier(0.34,1.2,0.64,1)' }} />
          <text x={cx} y={cy-4} textAnchor="middle" fill={col.stroke} fontSize="18" fontWeight="800" fontFamily="ui-monospace,monospace">{disp.toFixed(0)}</text>
          <text x={cx} y={cy+13} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="ui-monospace,monospace">/100</text>
        </svg>
        <div className="flex-1 space-y-1.5">
          {AGENTS.map(def => {
            const pct = Math.round(agentData[def.id].score * 100)
            return (
              <div key={def.id} className="flex items-center gap-1.5">
                <span className={clsx('text-[9px] font-bold w-16 shrink-0 truncate', def.accent.text)}>{def.name.split(' ')[0]}</span>
                <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={clsx('h-1 rounded-full', def.accent.bar)} style={{ width:`${pct}%` }} />
                </div>
                <span className={clsx('text-[9px] font-mono w-5 text-right shrink-0', def.accent.text)}>{pct}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={clsx('text-[10px] font-bold border rounded-full px-2.5 py-1 uppercase tracking-widest', col.badge)}>{col.label} RISK</span>
        <span className="text-[10px] text-gray-400 font-mono ml-auto">{c.status.toUpperCase()}</span>
      </div>
    </div>
  )
}

// ── Case list row ─────────────────────────────────────────────────────────────

function CaseRow({ c, selected, onSelect }: { c: BECCase; selected: boolean; onSelect: () => void }) {
  const dot = c.severity==='critical'?'bg-red-500':c.severity==='high'?'bg-orange-500':'bg-amber-400'
  const txt = c.severity==='critical'?'text-red-600':c.severity==='high'?'text-orange-600':'text-amber-600'
  return (
    <button onClick={onSelect} className={clsx('w-full text-left px-4 py-3 border-b border-gray-100 transition-all', selected?'bg-blue-50 border-l-2 border-l-blue-500':'hover:bg-gray-50')}>
      <div className="flex items-center gap-2 mb-1">
        <div className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
        <span className="font-mono text-[10px] text-gray-500 flex-1 truncate">{c.id}</span>
        <span className={clsx('text-[9px] font-bold uppercase', txt)}>{c.severity}</span>
      </div>
      <div className="text-xs font-semibold text-gray-800 truncate pl-3.5">{c.relationship.clientName}</div>
      <div className="text-[11px] text-gray-400 truncate pl-3.5">{c.instruction.currency} {c.instruction.amount.toLocaleString()} · {c.instruction.beneficiaryCountry}</div>
    </button>
  )
}

// ── Detection layout (middle + right) ────────────────────────────────────────

function DetectionLayout({ c, selectedAgent, onAgentClick }: {
  c: BECCase
  selectedAgent: AgentId | null
  onAgentClick: (id: AgentId) => void
}) {
  const signalCards = buildSignalCards(c)
  const agentData   = computeAgentData(c)

  const [agentLines,  setAgentLines]  = useState<Record<AgentId, string[]>>({ email:[],payment:[],identity:[],graph:[],intel:[] })
  const [agentScores, setAgentScores] = useState<Record<AgentId, number | null>>({ email:null,payment:null,identity:null,graph:null,intel:null })
  const [activeEnts,  setActiveEnts]  = useState<Set<string>>(new Set())
  const [activeCards, setActiveCards] = useState<Set<string>>(new Set())
  const [phrases,     setPhrases]     = useState<{ type:'urgency'|'secrecy'|'override'; text:string }[]>([])
  const [orchLine,    setOrchLine]    = useState('')
  const [ensembleVis, setEnsembleVis] = useState(false)

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
        const ents = ENTITY_ACTIVATIONS[def.id]?.[li]
        if (ents) T.push(setTimeout(() => setActiveEnts(p => { const n=new Set(p); ents.forEach(e=>n.add(e)); return n }), t+80))
        if (def.id==='email' && li===1) {
          c.nlpAnalysis.urgencyPhrases.forEach((ph,pi) => T.push(setTimeout(()=>setPhrases(p=>[...p,{type:'urgency',text:ph}]), t+100+pi*120)))
          c.nlpAnalysis.secrecyPhrases.forEach((ph,pi) => T.push(setTimeout(()=>setPhrases(p=>[...p,{type:'secrecy',text:ph}]), t+200+pi*120)))
          c.nlpAnalysis.overridePhrases.forEach((ph,pi) => T.push(setTimeout(()=>setPhrases(p=>[...p,{type:'override',text:ph}]), t+350+pi*120)))
        }
        signalCards.filter(sc=>sc.agentId===def.id&&sc.atLine===li).forEach(sc => T.push(setTimeout(()=>setActiveCards(p=>new Set([...p,sc.id])), t+150)))
      })
      const scoreAt = start + jitter + data.lines.length * 310 + 350
      T.push(setTimeout(() => setAgentScores(p=>({...p,[def.id]:data.score})), scoreAt))
    })
    const allDone = start + 90*4 + 5*310 + 350 + 500
    T.push(setTimeout(() => setEnsembleVis(true), allDone))
    return () => T.forEach(clearTimeout)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Middle panel — splits when an agent is selected */}
      <div className="flex-1 flex min-w-0 border-r border-gray-200 overflow-hidden">

        {/* Email + signal cards — shrinks when agent detail is open */}
        <div className={clsx('flex flex-col overflow-hidden transition-all duration-300', selectedAgent ? 'w-[52%]' : 'flex-1')}>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 shrink-0">
            <div className={clsx('w-1.5 h-1.5 rounded-full shrink-0', c.severity==='critical'?'bg-red-500':c.severity==='high'?'bg-orange-500':'bg-amber-400')} />
            <span className="font-mono text-[10px] text-gray-400">{c.id}</span>
            <span className="text-xs font-bold text-gray-800">{c.relationship.clientName}</span>
            <span className="text-gray-300">·</span>
            <span className="text-[11px] text-gray-400">{c.email.receivedAt}</span>
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            <EmailPanel c={c} activeEntities={activeEnts} activePhrases={phrases} />
          </div>
          <div className={clsx('shrink-0 border-t border-gray-200 overflow-y-auto transition-all duration-300', selectedAgent ? 'h-40' : 'h-56')}>
            <div className="px-3 pt-2 pb-1 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <Activity className="w-3 h-3 text-gray-400" />
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Risk signals — activated by agents in real time</span>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {signalCards.map(card => <SignalCard key={card.id} card={card} active={activeCards.has(card.id)} />)}
            </div>
          </div>
        </div>

        {/* Agent detail — slides in alongside email */}
        {selectedAgent && (
          <div className="flex-1 border-l border-gray-200 overflow-hidden">
            <AgentDetailPane agentId={selectedAgent} c={c} />
          </div>
        )}
      </div>

      {/* Right panel — agents + ensemble */}
      <div className="w-72 shrink-0 flex flex-col overflow-hidden bg-white border-l border-gray-200">
        {orchLine && (
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 shrink-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Cpu className="w-3 h-3 text-emerald-600" />
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Orchestrator</span>
            </div>
            <div className="text-[10px] font-mono text-gray-500 leading-relaxed pl-4">{orchLine}</div>
          </div>
        )}
        <div className="px-3 pt-1.5 pb-1 border-b border-gray-100">
          <span className="text-[9px] text-gray-400">Click an agent to view its findings alongside the email</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {AGENTS.map(def => (
            <AgentRow
              key={def.id}
              def={def}
              lines={agentLines[def.id]}
              score={agentScores[def.id]}
              isSelected={selectedAgent === def.id}
              onClick={() => onAgentClick(def.id)}
            />
          ))}
        </div>
        <EnsembleScore c={c} agentData={agentData} visible={ensembleVis} />
      </div>
    </>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function InvestigationHub() {
  const [selected,       setSelected]       = useState<BECCase | null>(null)
  const [selectedAgent,  setSelectedAgent]  = useState<AgentId | null>(null)

  const handleSelect = (c: BECCase) => { setSelected(c); setSelectedAgent(null) }

  return (
    <div className="flex-1 flex overflow-hidden bg-gray-50">

      {/* Left panel — case list, always visible */}
      <div className="w-48 shrink-0 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 shrink-0 bg-gray-50">
          <Cpu className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Investigations</span>
        </div>
        {BEC_CASES.map(c => (
          <CaseRow key={c.id} c={c} selected={selected?.id===c.id} onSelect={() => handleSelect(c)} />
        ))}
      </div>

      {/* Middle + right */}
      {selected ? (
        <DetectionLayout
          key={selected.id}
          c={selected}
          selectedAgent={selectedAgent}
          onAgentClick={(id) => setSelectedAgent(prev => prev === id ? null : id)}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
          <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
            <Cpu className="w-7 h-7 text-gray-300" />
          </div>
          <div className="text-sm font-semibold text-gray-500">Select a case to begin</div>
          <div className="text-xs text-gray-400 max-w-xs">5 specialist agents analyse email, payment, identity, relationship graph and external intel in real time</div>
        </div>
      )}
    </div>
  )
}
