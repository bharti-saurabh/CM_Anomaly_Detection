import { useState } from 'react'
import {
  AlertTriangle, CheckCircle, XCircle, Mail, Shield, User,
  Globe, Clock, TrendingUp, ChevronRight, AlertCircle,
} from 'lucide-react'
import clsx from 'clsx'
import { BEC_CASES } from '../data/becCases'
import type { BECCase } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const SEVERITY_STYLES = {
  critical: { dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200',         label: 'Critical' },
  high:     { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200', label: 'High' },
  medium:   { dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200',    label: 'Medium' },
}

const STATUS_STYLES = {
  blocked: 'bg-red-50 text-red-700 border-red-200',
  flagged: 'bg-amber-50 text-amber-700 border-amber-200',
  cleared: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const SCORE_COLOR = (s: number) =>
  s >= 80 ? 'text-red-600' : s >= 60 ? 'text-orange-600' : s >= 40 ? 'text-amber-600' : 'text-emerald-700'

const SCORE_BAR = (s: number) =>
  s >= 80 ? 'bg-red-500' : s >= 60 ? 'bg-orange-500' : s >= 40 ? 'bg-amber-400' : 'bg-emerald-500'

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

function AuthBadge({ status }: { status: 'pass' | 'fail' }) {
  return status === 'pass'
    ? <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle className="w-2.5 h-2.5" /> PASS</span>
    : <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200"><XCircle className="w-2.5 h-2.5" /> FAIL</span>
}

function Flag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-start gap-1.5 text-xs">
      {ok
        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
        : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />}
      <span className={ok ? 'text-slate-600' : 'text-red-700 font-medium'}>{label}</span>
    </div>
  )
}

function NlpScore({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 70 ? 'bg-red-500' : pct >= 45 ? 'bg-orange-400' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
        <div className={clsx('h-1.5 rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={clsx('text-xs font-mono font-bold w-8 text-right',
        pct >= 70 ? 'text-red-600' : pct >= 45 ? 'text-orange-600' : 'text-emerald-700')}>
        {pct}%
      </span>
    </div>
  )
}

// ── Email Card ────────────────────────────────────────────────────────────────

function EmailCard({ email, externalIntel }: { email: BECCase['email']; externalIntel: BECCase['externalIntel'] }) {
  const isDomainSuspect = email.senderDomainAgeDays < 90 || externalIntel.emailDomainIsLookalike

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <Mail className="w-4 h-4 text-slate-500 shrink-0" />
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Triggering Email</span>
        <span className="ml-auto text-xs text-slate-400 font-mono">{email.receivedAt}</span>
      </div>

      {isDomainSuspect && (
        <div className="flex items-start gap-2 px-4 py-2.5 bg-red-50 border-b border-red-200">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" />
          <div className="text-xs text-red-700">
            <span className="font-bold">Lookalike domain — </span>
            <span className="font-mono bg-red-100 px-1 rounded">{email.senderAddress.split('@')[1]}</span>
            {' '}registered {email.senderDomainAgeDays} days ago, spoofing{' '}
            <span className="font-mono bg-red-100 px-1 rounded">{externalIntel.lookalikeDomain ?? email.legitimateDomain}</span>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Email header fields */}
        <div className="space-y-1.5 text-xs">
          <div className="flex gap-2">
            <span className="text-slate-400 w-16 shrink-0">From</span>
            <div>
              <span className="font-semibold text-slate-800">{email.senderName}</span>
              <span className={clsx('ml-1.5 font-mono',
                isDomainSuspect ? 'text-red-600 font-bold' : 'text-slate-500')}>
                &lt;{email.senderAddress}&gt;
              </span>
            </div>
          </div>
          {email.replyToAddress && (
            <div className="flex gap-2">
              <span className="text-slate-400 w-16 shrink-0">Reply-To</span>
              <span className="font-mono text-orange-700 font-semibold">{email.replyToAddress}</span>
              <span className="text-orange-600 text-xs">(differs from sender)</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-slate-400 w-16 shrink-0">Subject</span>
            <span className="font-semibold text-slate-800">{email.subject}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-400 w-16 shrink-0">Origin IP</span>
            <span className={clsx('font-mono text-xs', email.ipFlagged ? 'text-red-600 font-bold' : 'text-slate-600')}>
              {email.originatingIP}{email.ipFlagged ? ' ⚠ FLAGGED' : ''}
            </span>
          </div>
        </div>

        {/* Auth badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-400 font-medium mr-1">Authentication:</span>
          <span className="text-xs text-slate-500">DKIM</span><AuthBadge status={email.dkim} />
          <span className="text-xs text-slate-500">SPF</span><AuthBadge status={email.spf} />
          <span className="text-xs text-slate-500">DMARC</span><AuthBadge status={email.dmarc} />
          {email.isFirstContact && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
              First contact from sender
            </span>
          )}
        </div>

        {/* Email body with highlighted phrases */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Message Body</p>
          <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {email.bodySegments.map((seg, i) =>
              seg.flagged ? (
                <span
                  key={i}
                  title={seg.flagReason}
                  className="bg-red-100 text-red-800 font-semibold rounded px-0.5 cursor-help border-b-2 border-red-400"
                >
                  {seg.text}
                </span>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {email.bodySegments.filter(s => s.flagged).map((seg, i) => (
              <span key={i} className="text-xs bg-red-50 border border-red-200 text-red-700 px-1.5 py-0.5 rounded">
                ⚑ {seg.flagReason}
              </span>
            ))}
          </div>
        </div>

        {/* NLP analysis */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">NLP Signal Analysis</p>
          <div className="space-y-1.5">
            <NlpScore label="Urgency" value={email.urgencyScore} />
            <NlpScore label="Authority" value={email.authorityScore} />
            <NlpScore label="Override" value={email.overrideLanguageDetected ? 0.92 : 0.08} />
          </div>
          {email.attachments.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {email.attachments.map(a => (
                <span key={a} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
                  📎 {a}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Data Category Cards ───────────────────────────────────────────────────────

function InstructionCard({ c }: { c: BECCase }) {
  const { instruction: i } = c
  const deviationX = Math.round(i.amount / i.historicalAvg)
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Cat 1 — Payment Instruction</span>
      </div>
      <div className="p-4 space-y-3">
        <div className={clsx('rounded-lg p-3 border',
          deviationX >= 5 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200')}>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={clsx('text-lg font-bold font-mono', deviationX >= 5 ? 'text-red-700' : 'text-slate-800')}>
              {i.currency} {fmt(i.amount)}
            </span>
            {deviationX >= 2 && (
              <span className="text-xs font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
                {deviationX}× historical avg
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Avg: {fmt(i.historicalAvg)} · Max ever: {fmt(i.historicalMax)}</div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          {[
            ['Channel', i.channel],
            ['Time', i.submittedAt.split(' ')[1]],
            ['Beneficiary', i.beneficiaryName],
            ['Country', i.beneficiaryCountry],
            ['Bank', i.beneficiaryBank],
            ['Account', i.beneficiaryAccount],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-1.5">
              <span className="text-slate-400 shrink-0 w-16">{label}</span>
              <span className="text-slate-700 font-medium truncate">{value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <Flag ok={!i.beneficiaryIsNew} label={i.beneficiaryIsNew ? 'New beneficiary — never paid before' : 'Known beneficiary'} />
          <Flag ok={!i.submittedOutsideHours} label={i.submittedOutsideHours ? 'Submitted outside business hours' : 'Within business hours'} />
          <Flag ok={!i.selfApproved} label={i.selfApproved ? `Self-approved by ${i.submittedBy}` : 'Dual-authorisation followed'} />
          <Flag ok={i.dualAuthFollowed} label={i.dualAuthFollowed ? 'Dual authorisation confirmed' : 'Dual authorisation bypassed'} />
          <Flag ok={!i.modifiedAfterEntry} label={i.modifiedAfterEntry ? 'Instruction modified after initial entry' : 'No post-entry modifications'} />
        </div>

        {i.freeTextNotes && (
          <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg p-2 text-amber-800 italic">
            Notes: "{i.freeTextNotes}"
          </div>
        )}
      </div>
    </div>
  )
}

function RelationshipCard({ c }: { c: BECCase }) {
  const { relationship: r, instruction: i } = c
  const geoAnomaly = !r.typicalCountries.includes(i.beneficiaryCountry)
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <Globe className="w-3.5 h-3.5 text-violet-500" />
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Cat 2 — Counterparty History</span>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <div className="text-sm font-bold text-slate-900">{r.clientName}</div>
          <div className="text-xs text-slate-400">{r.tenureYears}-year client · {r.totalPaymentsLast12M} wires in past 12 months</div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-xs border border-slate-200">
          <div className="flex justify-between">
            <span className="text-slate-400">Typical wire range</span>
            <span className="text-slate-700 font-semibold">{fmt(r.typicalAmountMin)} – {fmt(r.typicalAmountMax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Typical countries</span>
            <span className="text-slate-700 text-right">{r.typicalCountries.join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Channels</span>
            <span className="text-slate-700">{r.typicalChannels.join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Last payment</span>
            <span className="text-slate-700">{r.lastPaymentDate}</span>
          </div>
        </div>

        {geoAnomaly && (
          <div className="flex items-center gap-1.5 text-xs bg-orange-50 border border-orange-200 rounded-lg p-2 text-orange-800">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span><strong>{i.beneficiaryCountry}</strong> outside typical counterparty geography</span>
          </div>
        )}

        <div className="space-y-1">
          <Flag ok={r.rmConsulted} label={r.rmConsulted ? `RM ${r.rmName} consulted` : `RM ${r.rmName} not consulted on this instruction`} />
        </div>
      </div>
    </div>
  )
}

function IdentityCard({ c }: { c: BECCase }) {
  const { identity: id } = c
  const locationAnomaly = id.loginLocation !== id.expectedLocation
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <User className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Cat 4 — Identity &amp; Access</span>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <div className="text-sm font-bold text-slate-900">{id.submittingUser}</div>
          <div className="text-xs text-slate-400 font-mono">{id.userId} · Login at {id.loginTime.split(' ')[1]}</div>
        </div>

        {locationAnomaly && (
          <div className="flex items-start gap-1.5 text-xs bg-red-50 border border-red-200 rounded-lg p-2 text-red-800">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <div>Login from <strong>{id.loginLocation}</strong> — expected <strong>{id.expectedLocation}</strong></div>
          </div>
        )}

        <div className="space-y-1">
          <Flag ok={!id.deviceIsNew} label={id.deviceIsNew ? 'Unrecognised device' : 'Known device'} />
          <Flag ok={!locationAnomaly} label={locationAnomaly ? `Location anomaly: ${id.loginLocation}` : `Expected location: ${id.loginLocation}`} />
          <Flag ok={id.mfaUsed} label={id.mfaUsed ? 'MFA verified' : 'MFA not used — account compromise risk'} />
          <Flag ok={id.approvalAuthoritySufficient} label={id.approvalAuthoritySufficient ? 'Approver authority sufficient' : 'Insufficient authority for this wire size'} />
        </div>

        <div className="text-xs text-slate-500">
          Session duration: <span className="font-semibold text-slate-700">{id.sessionDurationMinutes} min</span>
        </div>
      </div>
    </div>
  )
}

function ExternalIntelCard({ c }: { c: BECCase }) {
  const { externalIntel: e } = c
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <Shield className="w-3.5 h-3.5 text-red-500" />
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Cat 5 — External Intelligence</span>
      </div>
      <div className="p-4 space-y-2">
        <div className="space-y-1.5">
          <Flag ok={!e.swiftControlsFlag} label={e.swiftControlsFlag ? 'SWIFT Payment Controls: FLAGGED' : 'SWIFT Payment Controls: Clear'} />
          <Flag ok={!e.fincenMatch} label={e.fincenMatch ? `FinCEN 314(b): ${e.beneficiaryFraudSource ?? 'Match found'}` : 'FinCEN 314(b): No match'} />
          <Flag ok={!e.ipFlagged} label={e.ipFlagged ? `IP flagged: ${e.ipFraudSource ?? 'Fraud database'}` : 'Originating IP: Clean'} />
          <Flag ok={!e.beneficiaryFraudFlag} label={e.beneficiaryFraudFlag ? `Beneficiary: ${e.beneficiaryFraudSource}` : 'Beneficiary: No fraud history'} />
          <Flag ok={!e.emailDomainIsLookalike} label={e.emailDomainIsLookalike ? `Domain spoofs: ${e.lookalikeDomain}` : 'Email domain: Legitimate'} />
        </div>
        <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          Email domain age:
          <span className={clsx('font-semibold ml-0.5', e.emailDomainAgeDays < 30 ? 'text-red-600' : e.emailDomainAgeDays < 90 ? 'text-orange-600' : 'text-slate-700')}>
            {e.emailDomainAgeDays} days
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Case Detail Panel ─────────────────────────────────────────────────────────

function CaseDetail({ c }: { c: BECCase }) {
  const sev = SEVERITY_STYLES[c.severity]
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="p-5 space-y-4 max-w-5xl">

        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={clsx('w-2 h-2 rounded-full shrink-0', sev.dot)} />
                <span className="text-xs font-mono text-slate-400">{c.id}</span>
                <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full border', sev.badge)}>{sev.label}</span>
                <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full border uppercase', STATUS_STYLES[c.status])}>{c.status}</span>
                {c.signalId && (
                  <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    <ChevronRight className="w-3 h-3" /> Linked: {c.signalId}
                  </span>
                )}
              </div>
              <div className="text-base font-bold text-slate-900 truncate">
                {c.relationship.clientName} → {c.instruction.beneficiaryName}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {c.instruction.currency} {c.instruction.amount.toLocaleString()} · {c.instruction.beneficiaryBank}, {c.instruction.beneficiaryCountry} · {c.instruction.channel} · {c.createdAt}
              </div>
            </div>

            <div className="text-center shrink-0">
              <div className={clsx('text-3xl font-bold font-mono', SCORE_COLOR(c.anomalyScore))}>{c.anomalyScore}</div>
              <div className="text-xs text-slate-400">Anomaly Score</div>
              <div className="mt-1 w-16 bg-slate-200 rounded-full h-1.5 mx-auto">
                <div className={clsx('h-1.5 rounded-full', SCORE_BAR(c.anomalyScore))} style={{ width: `${c.anomalyScore}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {c.riskFlags.map(f => (
              <span key={f} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                {f.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Email — full width, prominent */}
        <EmailCard email={c.email} externalIntel={c.externalIntel} />

        {/* 2 × 2 data categories */}
        <div className="grid grid-cols-2 gap-4">
          <InstructionCard c={c} />
          <RelationshipCard c={c} />
          <IdentityCard c={c} />
          <ExternalIntelCard c={c} />
        </div>
      </div>
    </div>
  )
}

// ── Case List Item ────────────────────────────────────────────────────────────

function CaseListItem({ c, isSelected, onSelect }: { c: BECCase; isSelected: boolean; onSelect: () => void }) {
  const sev = SEVERITY_STYLES[c.severity]
  return (
    <button
      onClick={onSelect}
      className={clsx(
        'w-full text-left px-4 py-3.5 border-b border-slate-100 transition-colors',
        isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', sev.dot)} />
          <span className="text-xs font-mono text-slate-400">{c.id}</span>
        </div>
        <span className={clsx('text-xs font-bold font-mono', SCORE_COLOR(c.anomalyScore))}>{c.anomalyScore}</span>
      </div>
      <div className="text-xs font-semibold text-slate-800 truncate">{c.relationship.clientName}</div>
      <div className="text-xs text-slate-500 truncate">{c.instruction.beneficiaryCountry} · {fmt(c.instruction.amount)}</div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className={clsx('text-xs px-1.5 py-0.5 rounded-full border font-semibold', sev.badge)}>{sev.label}</span>
        <span className={clsx('text-xs px-1.5 py-0.5 rounded-full border font-semibold uppercase', STATUS_STYLES[c.status])}>{c.status}</span>
      </div>
    </button>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function DataExplorer() {
  const [selected, setSelected] = useState<BECCase>(BEC_CASES[0])
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'blocked' | 'flagged' | 'cleared'>('all')
  const [scoreMin, setScoreMin] = useState(0)

  const filtered = BEC_CASES
    .filter(c => severityFilter === 'all' || c.severity === severityFilter)
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .filter(c => c.anomalyScore >= scoreMin)
    .filter(c =>
      !search ||
      c.relationship.clientName.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.instruction.beneficiaryName.toLowerCase().includes(search.toLowerCase()) ||
      c.instruction.beneficiaryCountry.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.anomalyScore - a.anomalyScore)

  const blockedCount = filtered.filter(c => c.status === 'blocked').length
  const flaggedCount = filtered.filter(c => c.status === 'flagged').length

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">

      {/* Filter bar */}
      <div className="px-5 py-3 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 mr-1">
            <Mail className="w-4 h-4 text-blue-500" />
            <h1 className="text-sm font-bold text-slate-900">BEC Case Explorer</h1>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search client, case, beneficiary…"
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value as typeof severityFilter)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Statuses</option>
            <option value="blocked">Blocked</option>
            <option value="flagged">Flagged</option>
            <option value="cleared">Cleared</option>
          </select>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <label>Score ≥</label>
            <input type="number" value={scoreMin} onChange={e => setScoreMin(Number(e.target.value))} min={0} max={100} step={5}
              className="w-14 px-2 py-1.5 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs" />
          </div>
          <div className="ml-auto flex gap-4 text-xs text-slate-500">
            <span><strong className="text-slate-800">{filtered.length}</strong> cases</span>
            <span><strong className="text-red-600">{blockedCount}</strong> blocked</span>
            <span><strong className="text-amber-600">{flaggedCount}</strong> flagged</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Case list sidebar */}
        <div className="w-72 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No cases match filters</div>
          ) : (
            filtered.map(c => (
              <CaseListItem
                key={c.id}
                c={c}
                isSelected={selected?.id === c.id}
                onSelect={() => setSelected(c)}
              />
            ))
          )}
        </div>

        {/* Detail panel */}
        {selected
          ? <CaseDetail c={selected} />
          : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Select a case to view the 360° context record</p>
              </div>
            </div>
          )
        }
      </div>
    </div>
  )
}
