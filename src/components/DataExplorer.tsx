import { useState } from 'react'
import {
  Mail, Database, Globe, User, Shield, FileText,
  Server, ChevronRight,
} from 'lucide-react'
import clsx from 'clsx'
import { BEC_CASES } from '../data/becCases'
import type { BECCase } from '../types'

// ── Source system definitions ─────────────────────────────────────────────────

const SOURCES = [
  { id: 'wire',     name: 'Wire Processing',       color: 'blue',   cats: [2] },
  { id: 'core',     name: 'Core Banking',           color: 'indigo', cats: [2] },
  { id: 'swift',    name: 'SWIFT Network',          color: 'violet', cats: [2, 5] },
  { id: 'crm',      name: 'CRM',                    color: 'purple', cats: [1, 3] },
  { id: 'txdb',     name: 'Transaction History DB', color: 'fuchsia',cats: [3] },
  { id: 'email',    name: 'Email Gateway / MTA',    color: 'pink',   cats: [1] },
  { id: 'nlp',      name: 'NLP Engine',             color: 'rose',   cats: [1] },
  { id: 'domain',   name: 'Domain Intelligence',    color: 'orange', cats: [1, 5] },
  { id: 'iam',      name: 'IAM / Active Directory', color: 'amber',  cats: [4] },
  { id: 'siem',     name: 'SIEM',                   color: 'yellow', cats: [4] },
  { id: 'ip',       name: 'IP Reputation',          color: 'lime',   cats: [4, 5] },
  { id: 'fincen',   name: 'FinCEN 314(b)',          color: 'green',  cats: [5] },
  { id: 'sanction', name: 'Sanctions Screening',    color: 'emerald',cats: [5] },
] as const

type SourceId = typeof SOURCES[number]['id']

const SOURCE_CHIP: Record<string, string> = {
  blue:    'bg-blue-50 text-blue-700 border-blue-200',
  indigo:  'bg-indigo-50 text-indigo-700 border-indigo-200',
  violet:  'bg-violet-50 text-violet-700 border-violet-200',
  purple:  'bg-purple-50 text-purple-700 border-purple-200',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  pink:    'bg-pink-50 text-pink-700 border-pink-200',
  rose:    'bg-rose-50 text-rose-700 border-rose-200',
  orange:  'bg-orange-50 text-orange-700 border-orange-200',
  amber:   'bg-amber-50 text-amber-700 border-amber-200',
  yellow:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  lime:    'bg-lime-50 text-lime-700 border-lime-200',
  green:   'bg-green-50 text-green-700 border-green-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

function SourceTag({ id }: { id: SourceId }) {
  const src = SOURCES.find(s => s.id === id)!
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border font-medium shrink-0', SOURCE_CHIP[src.color])}>
      <Server className="w-2.5 h-2.5" />
      {src.name}
    </span>
  )
}

// ── Data row primitives ───────────────────────────────────────────────────────

function Row({ label, value, src, mono }: { label: string; value: React.ReactNode; src?: SourceId; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400 shrink-0 w-44">{label}</span>
      <div className="flex items-center gap-2 flex-1 justify-end">
        <span className={clsx('text-xs text-slate-800 text-right', mono && 'font-mono')}>{value}</span>
        {src && <SourceTag id={src} />}
      </div>
    </div>
  )
}

function SectionHeading({ title }: { title: string }) {
  return <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-4 mb-2 first:mt-0">{title}</p>
}

function CardShell({ title, icon, sources, children }: {
  title: string
  icon: React.ReactNode
  sources: SourceId[]
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 flex-wrap gap-y-2">
        <span className="text-slate-400 shrink-0">{icon}</span>
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{title}</span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {sources.map(id => <SourceTag key={id} id={id} />)}
        </div>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

// ── Entity type colours (neutral, not risk-based) ─────────────────────────────

const ENTITY_STYLE: Record<string, string> = {
  amount:      'bg-blue-100 text-blue-800 border-blue-300',
  account:     'bg-violet-100 text-violet-800 border-violet-300',
  person:      'bg-amber-100 text-amber-800 border-amber-300',
  institution: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  deadline:    'bg-orange-100 text-orange-800 border-orange-300',
  location:    'bg-slate-100 text-slate-700 border-slate-300',
}

// ── Tab 3 — Email & Communications ────────────────────────────────────────────

function EmailTab({ c }: { c: BECCase }) {
  const { email: e, nlpAnalysis: n } = c

  return (
    <div className="space-y-4">

      {/* Email body with NER highlighting */}
      <CardShell title="Message Body — Named Entity Extraction" icon={<Mail className="w-3.5 h-3.5" />} sources={['email', 'nlp']}>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap mb-3">
          {e.bodySegments.map((seg, i) =>
            seg.entityType ? (
              <span
                key={i}
                title={seg.entityType}
                className={clsx('rounded px-0.5 border cursor-default', ENTITY_STYLE[seg.entityType])}
              >
                {seg.text}
              </span>
            ) : (
              <span key={i}>{seg.text}</span>
            )
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
          <span className="font-medium text-slate-600">Entity legend:</span>
          {Object.entries(ENTITY_STYLE).map(([type, cls]) => (
            <span key={type} className={clsx('px-1.5 py-0.5 rounded border', cls)}>{type}</span>
          ))}
        </div>
      </CardShell>

      {/* Header metadata */}
      <CardShell title="Header & Routing Metadata" icon={<Server className="w-3.5 h-3.5" />} sources={['email', 'domain']}>
        <SectionHeading title="Sender" />
        <Row label="Sender name" value={e.senderName} src="email" />
        <Row label="Sender address" value={e.senderAddress} src="email" mono />
        <Row label="Reply-To address" value={e.replyToAddress ?? 'Same as sender'} src="email" mono />
        <Row label="Subject" value={e.subject} src="email" />
        <Row label="Received at" value={e.receivedAt} src="email" />
        <Row label="Email size" value={`${e.emailSizeKB} KB`} src="email" />
        <Row label="Content type" value={e.contentType} src="email" mono />
        <Row label="Attachments" value={e.attachments.length > 0 ? e.attachments.join(', ') : 'None'} src="email" />

        <SectionHeading title="Authentication" />
        <Row label="DKIM" value={e.dkim.toUpperCase()} src="email" mono />
        <Row label="SPF" value={e.spf.toUpperCase()} src="email" mono />
        <Row label="DMARC" value={e.dmarc.toUpperCase()} src="email" mono />

        <SectionHeading title="Routing" />
        <Row label="Originating IP" value={e.originatingIP} src="email" mono />
        <Row label="Mail server path" value={
          <div className="text-right space-y-0.5">
            {e.mailServerPath.map((hop, i) => (
              <div key={i} className="flex items-center gap-1 justify-end text-xs font-mono text-slate-600">
                {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                {hop}
              </div>
            ))}
          </div>
        } src="email" />

        <SectionHeading title="Domain Intelligence" />
        <Row label="Sender domain" value={e.senderAddress.split('@')[1]} src="domain" mono />
        <Row label="Domain age" value={`${e.senderDomainAgeDays} days`} src="domain" />
        <Row label="Registration date" value={e.senderDomainRegistrationDate} src="domain" />
        <Row label="Registrar" value={e.senderDomainRegistrar} src="domain" />
        <Row label="Resembles domain" value={e.legitimateDomain} src="domain" mono />

        <SectionHeading title="Communication History" />
        <Row label="Prior emails from this sender" value={e.totalEmailsFromSender.toString()} src="crm" />
        <Row label="Prior emails from this domain" value={e.totalEmailsFromDomain.toString()} src="crm" />
        <Row label="First contact from sender" value={e.isFirstContact ? 'Yes' : 'No'} src="crm" />
      </CardShell>

      {/* NLP Analysis */}
      <CardShell title="NLP Analysis" icon={<Database className="w-3.5 h-3.5" />} sources={['nlp']}>
        <SectionHeading title="Language & Style" />
        <Row label="Detected language" value={`${n.detectedLanguage} (confidence ${Math.round(n.languageConfidence * 100)}%)`} src="nlp" />
        <Row label="Primary tone" value={n.primaryTone} src="nlp" />
        <Row label="Secondary tone" value={n.secondaryTone} src="nlp" />
        <Row label="Sentiment score" value={`${n.sentiment.toFixed(2)} (${n.sentimentLabel})`} src="nlp" />
        <Row label="Writing style consistency" value={
          <div className="flex items-center gap-2">
            <div className="w-20 bg-slate-100 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-slate-500" style={{ width: `${n.writingStyleConsistency * 100}%` }} />
            </div>
            <span className="font-mono text-xs">{Math.round(n.writingStyleConsistency * 100)}%</span>
          </div>
        } src="nlp" />
        <Row label="Baseline samples used" value={`${n.histStyleBaselineSamples} historical emails`} src="nlp" />

        <SectionHeading title="Grammar & Readability" />
        <Row label="Grammatical errors" value={n.grammaticalErrorCount.toString()} src="nlp" />
        {n.grammaticalErrorExamples.length > 0 && (
          <div className="ml-2 mb-2">
            {n.grammaticalErrorExamples.map((ex, i) => (
              <div key={i} className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2 mb-1">{ex}</div>
            ))}
          </div>
        )}
        <Row label="Spelling errors" value={n.spellingErrorCount.toString()} src="nlp" />
        <Row label="Vocabulary sophistication" value={n.vocabularySophistication} src="nlp" />
        <Row label="Avg sentence length" value={`${n.avgSentenceLength} words`} src="nlp" />
        <Row label="Passive voice ratio" value={`${Math.round(n.passiveVoiceRatio * 100)}%`} src="nlp" />
        <Row label="Readability score" value={`${n.readabilityScore} / 100 (Flesch-Kincaid)`} src="nlp" />

        <SectionHeading title="Signal Phrase Counts" />
        <Row label="Word count" value={n.wordCount.toString()} src="nlp" />
        <Row label="Paragraphs" value={n.paragraphCount.toString()} src="nlp" />
        <Row label="Questions" value={n.questionCount.toString()} src="nlp" />
        <Row label="Exclamations" value={n.exclamationCount.toString()} src="nlp" />
        <Row label="ALL-CAPS words" value={n.capsWordCount.toString()} src="nlp" />

        <SectionHeading title="Extracted Signal Phrases" />
        {[
          { label: 'Urgency phrases', items: n.urgencyPhrases },
          { label: 'Secrecy phrases', items: n.secrecyPhrases },
          { label: 'Authority claims', items: n.authorityPhrases },
          { label: 'Override requests', items: n.overridePhrases },
        ].map(({ label, items }) => (
          <div key={label} className="mb-2">
            <div className="text-xs text-slate-400 mb-1">{label} ({items.length})</div>
            {items.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {items.map((p, i) => (
                  <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 italic">
                    "{p}"
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-300 italic">None detected</span>
            )}
          </div>
        ))}

        <SectionHeading title="Extracted Entities" />
        <div className="space-y-1.5">
          {n.extractedEntities.map((ent, i) => (
            <div key={i} className="flex items-center justify-between gap-3 text-xs">
              <span className={clsx('px-1.5 py-0.5 rounded border shrink-0', ENTITY_STYLE[ent.type])}>{ent.type}</span>
              <span className="font-mono text-slate-700 flex-1 truncate">{ent.value}</span>
              <span className="text-slate-400 shrink-0">conf {Math.round(ent.confidence * 100)}%</span>
            </div>
          ))}
        </div>
      </CardShell>
    </div>
  )
}

// ── Tab 1 — Payment Instruction ───────────────────────────────────────────────

function InstructionTab({ c }: { c: BECCase }) {
  const i = c.instruction
  return (
    <div className="space-y-4">
      <CardShell title="Instruction Metadata" icon={<FileText className="w-3.5 h-3.5" />} sources={['wire', 'core']}>
        <Row label="Instruction ID" value={i.instructionId} src="wire" mono />
        <Row label="Source system" value={i.sourceSystem} src="wire" />
        <Row label="Channel" value={i.channel} src="wire" />
        <Row label="Submitted at" value={i.submittedAt} src="wire" />
        <Row label="Outside business hours" value={i.submittedOutsideHours ? 'Yes' : 'No'} src="wire" />
        <Row label="Device fingerprint" value={i.deviceFingerprint} src="core" mono />
        <Row label="Modified after entry" value={i.modifiedAfterEntry ? 'Yes' : 'No'} src="wire" />
        <Row label="Approval workflow time" value={`${i.approvalWorkflowMinutes} minutes`} src="wire" />
        <Row label="Dual authorisation followed" value={i.dualAuthFollowed ? 'Yes' : 'No'} src="wire" />
        <Row label="Submitted by" value={i.submittedBy} src="core" />
        <Row label="Approved by" value={i.approvedBy} src="core" />
        <Row label="Self-approved" value={i.selfApproved ? 'Yes' : 'No'} src="wire" />
      </CardShell>

      <CardShell title="Beneficiary Details" icon={<Globe className="w-3.5 h-3.5" />} sources={['wire', 'swift']}>
        <Row label="Beneficiary name" value={i.beneficiaryName} src="wire" />
        <Row label="Account number" value={i.beneficiaryAccount} src="wire" mono />
        <Row label="Beneficiary bank" value={i.beneficiaryBank} src="swift" />
        <Row label="Beneficiary country" value={i.beneficiaryCountry} src="swift" />
        <Row label="New beneficiary" value={i.beneficiaryIsNew ? 'Yes — first payment to this account' : 'No'} src="core" />
        <Row label="Days since last payment to beneficiary" value={i.daysSinceLastPaymentToBeneficiary !== null ? `${i.daysSinceLastPaymentToBeneficiary} days` : 'N/A — first ever'} src="core" />
        <Row label="Reference text" value={i.referenceText} src="wire" mono />
        <Row label="Free-text notes" value={i.freeTextNotes || 'None'} src="wire" />
      </CardShell>

      <CardShell title="Amount Analysis" icon={<Database className="w-3.5 h-3.5" />} sources={['wire', 'core']}>
        <Row label="Amount" value={`${i.currency} ${i.amount.toLocaleString()}`} src="wire" mono />
        <Row label="Currency" value={i.currency} src="wire" />
        <Row label="Historical average (this client)" value={`${i.currency} ${i.historicalAvg.toLocaleString()}`} src="core" />
        <Row label="Historical maximum (this client)" value={`${i.currency} ${i.historicalMax.toLocaleString()}`} src="core" />
        <Row label="Amount deviation factor" value={`${i.amountDeviationFactor.toFixed(1)}× historical average`} src="core" />
        <Row label="Round number pattern" value={i.roundNumberFlag ? 'Yes' : 'No'} src="core" />
        <Row label="Just-below-threshold pattern" value={i.belowThresholdFlag ? 'Yes' : 'No'} src="wire" />
      </CardShell>
    </div>
  )
}

// ── Tab 2 — Counterparty & Relationship ──────────────────────────────────────

function RelationshipTab({ c }: { c: BECCase }) {
  const r = c.relationship
  return (
    <div className="space-y-4">
      <CardShell title="Client Profile" icon={<User className="w-3.5 h-3.5" />} sources={['crm']}>
        <Row label="Client name" value={r.clientName} src="crm" />
        <Row label="Industry" value={r.clientIndustry} src="crm" />
        <Row label="Relationship tenure" value={`${r.tenureYears} years`} src="crm" />
        <Row label="Relationship manager" value={r.rmName} src="crm" />
        <Row label="RM consulted on this instruction" value={r.rmConsulted ? 'Yes' : 'No'} src="crm" />
      </CardShell>

      <CardShell title="Historical Payment Patterns" icon={<Database className="w-3.5 h-3.5" />} sources={['txdb', 'crm']}>
        <SectionHeading title="Baseline" />
        <Row label="Typical amount range" value={`$${(c.relationship.typicalAmountMin / 1000).toFixed(0)}K – $${(c.relationship.typicalAmountMax / 1_000_000).toFixed(1)}M`} src="txdb" />
        <Row label="Avg payment frequency" value={`Every ${r.avgPaymentFrequencyDays} days`} src="txdb" />
        <Row label="Total payments (last 12 months)" value={r.totalPaymentsLast12M.toString()} src="txdb" />
        <Row label="Last payment date" value={r.lastPaymentDate} src="txdb" />
        <Row label="Counterparty registry entries" value={`${r.counterpartyRegistryCount} known counterparties`} src="txdb" />

        <SectionHeading title="Geographic & Channel Patterns" />
        <Row label="Typical beneficiary countries" value={r.typicalCountries.join(', ')} src="txdb" />
        <Row label="Typical channels" value={r.typicalChannels.join(', ')} src="txdb" />

        <SectionHeading title="This Instruction vs. Baseline" />
        <Row label="Beneficiary country" value={c.instruction.beneficiaryCountry} src="txdb" />
        <Row label="Country in baseline" value={r.typicalCountries.includes(c.instruction.beneficiaryCountry) ? 'Yes' : 'No — outside historical geography'} src="txdb" />
        <Row label="Channel" value={c.instruction.channel} src="txdb" />
        <Row label="Channel in baseline" value={r.typicalChannels.includes(c.instruction.channel) ? 'Yes' : 'No — unusual channel for this client'} src="txdb" />
      </CardShell>
    </div>
  )
}

// ── Tab 4 — Identity & Access ────────────────────────────────────────────────

function IdentityTab({ c }: { c: BECCase }) {
  const id = c.identity
  return (
    <div className="space-y-4">
      <CardShell title="User Authentication" icon={<User className="w-3.5 h-3.5" />} sources={['iam', 'siem']}>
        <SectionHeading title="Identity" />
        <Row label="Submitting user" value={id.submittingUser} src="iam" />
        <Row label="User ID" value={id.userId} src="iam" mono />
        <Row label="Approval authority sufficient" value={id.approvalAuthoritySufficient ? 'Yes' : 'No — below wire authority threshold for this amount'} src="iam" />

        <SectionHeading title="Authentication Event" />
        <Row label="Login time" value={id.loginTime} src="siem" />
        <Row label="MFA used" value={id.mfaUsed ? 'Yes' : 'No'} src="iam" />
        <Row label="MFA method" value={id.mfaMethod} src="iam" />
        <Row label="Prior failed logins (24h)" value={id.priorFailedLogins.toString()} src="siem" />
      </CardShell>

      <CardShell title="Device & Location" icon={<Globe className="w-3.5 h-3.5" />} sources={['siem', 'iam', 'ip']}>
        <Row label="Device ID" value={id.deviceId} src="iam" mono />
        <Row label="Device recognised" value={id.deviceIsNew ? 'No — first time seen' : 'Yes — known device'} src="iam" />
        <Row label="Login location" value={id.loginLocation} src="ip" />
        <Row label="Expected location" value={id.expectedLocation} src="siem" />
        <Row label="Location matches baseline" value={id.loginLocation === id.expectedLocation ? 'Yes' : 'No'} src="siem" />
        <Row label="VPN detected" value={id.vpnDetected ? 'Yes' : 'No'} src="ip" />
      </CardShell>

      <CardShell title="Session Behaviour" icon={<Database className="w-3.5 h-3.5" />} sources={['siem']}>
        <Row label="Session duration" value={`${id.sessionDurationMinutes} minutes`} src="siem" />
        <Row label="Pages visited in session" value={id.sessionPagesVisited.toString()} src="siem" />
        <Row label="Approval workflow time" value={`${c.instruction.approvalWorkflowMinutes} minutes`} src="siem" />
      </CardShell>
    </div>
  )
}

// ── Tab 5 — External Intelligence ────────────────────────────────────────────

function ExternalTab({ c }: { c: BECCase }) {
  const e = c.externalIntel
  return (
    <div className="space-y-4">
      <CardShell title="SWIFT Network Intelligence" icon={<Globe className="w-3.5 h-3.5" />} sources={['swift']}>
        <Row label="SWIFT Payment Controls flag" value={e.swiftControlsFlag ? `Yes — ${e.ipFraudSource ?? 'flagged'}` : 'No match'} src="swift" />
        <Row label="Beneficiary bank country risk" value={e.beneficiaryBankCountryRisk} src="swift" />
      </CardShell>

      <CardShell title="Network & IP Intelligence" icon={<Server className="w-3.5 h-3.5" />} sources={['ip', 'domain']}>
        <SectionHeading title="Originating IP" />
        <Row label="IP address" value={c.email.originatingIP} src="ip" mono />
        <Row label="IP flagged in fraud database" value={e.ipFlagged ? 'Yes' : 'No'} src="ip" />
        <Row label="Fraud source detail" value={e.ipFraudSource ?? 'N/A'} src="ip" />
        <Row label="ASN" value={e.ipAsn} src="ip" mono />
        <Row label="Geolocation" value={e.ipGeolocation} src="ip" />

        <SectionHeading title="Email Domain" />
        <Row label="Domain age" value={`${e.emailDomainAgeDays} days`} src="domain" />
        <Row label="Resembles known domain" value={e.emailDomainIsLookalike ? `Yes — spoofing ${e.lookalikeDomain}` : 'No'} src="domain" />
      </CardShell>

      <CardShell title="Fraud & Sanctions Databases" icon={<Shield className="w-3.5 h-3.5" />} sources={['fincen', 'sanction']}>
        <Row label="FinCEN 314(b) match" value={e.fincenMatch ? `Yes — ${e.beneficiaryFraudSource}` : 'No match'} src="fincen" />
        <Row label="Beneficiary fraud flag" value={e.beneficiaryFraudFlag ? `Yes — ${e.beneficiaryFraudSource}` : 'No'} src="fincen" />
        <Row label="OFAC match" value={e.ofacMatch ? 'Yes' : 'No match'} src="sanction" />
        <Row label="Sanctions screening result" value={e.sanctionsScreeningResult} src="sanction" />
      </CardShell>
    </div>
  )
}

// ── Connected Sources Strip ───────────────────────────────────────────────────

function ConnectedSources({ activeTab }: { activeTab: number }) {
  return (
    <div className="px-5 py-3 bg-white border-b border-slate-200">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-400 shrink-0 mr-1">Connected sources:</span>
        {SOURCES.map(src => {
          const active = ([...src.cats] as number[]).includes(activeTab)
          return (
            <span
              key={src.id}
              className={clsx(
                'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium transition-all',
                active ? SOURCE_CHIP[src.color] : 'bg-slate-50 text-slate-300 border-slate-200'
              )}
            >
              <Server className="w-2.5 h-2.5" />
              {src.name}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Case List Item ────────────────────────────────────────────────────────────

function CaseListItem({ c, isSelected, onSelect }: { c: BECCase; isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={clsx(
        'w-full text-left px-4 py-3.5 border-b border-slate-100 transition-colors',
        isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'
      )}
    >
      <div className="text-xs font-mono text-slate-400 mb-0.5">{c.id}</div>
      <div className="text-xs font-semibold text-slate-800 truncate">{c.relationship.clientName}</div>
      <div className="text-xs text-slate-500 truncate mt-0.5">{c.email.subject}</div>
      <div className="text-xs text-slate-400 mt-1">{c.email.receivedAt}</div>
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

const TABS: { label: string; cat: number; icon: React.ReactNode }[] = [
  { label: 'Email & Communications',   cat: 1, icon: <Mail className="w-3.5 h-3.5" /> },
  { label: 'Payment Instruction',      cat: 2, icon: <FileText className="w-3.5 h-3.5" /> },
  { label: 'Counterparty History',     cat: 3, icon: <Globe className="w-3.5 h-3.5" /> },
  { label: 'Identity & Access',        cat: 4, icon: <User className="w-3.5 h-3.5" /> },
  { label: 'External Intelligence',    cat: 5, icon: <Shield className="w-3.5 h-3.5" /> },
]

export function DataExplorer() {
  const [selected, setSelected] = useState<BECCase>(BEC_CASES[0])
  const [activeTab, setActiveTab] = useState(1)
  const [search, setSearch] = useState('')

  const filtered = BEC_CASES.filter(c =>
    !search ||
    c.relationship.clientName.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase()) ||
    c.email.subject.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">

      {/* Filter bar */}
      <div className="px-5 py-3 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Database className="w-4 h-4 text-blue-500" />
            <h1 className="text-sm font-bold text-slate-900">Data Explorer</h1>
            <span className="text-xs text-slate-400 ml-1">— extracted from payment events across 14 connected sources</span>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search client, case ID, email subject…"
            className="ml-auto px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* Case list */}
        <div className="w-64 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          {filtered.map(c => (
            <CaseListItem
              key={c.id}
              c={c}
              isSelected={selected?.id === c.id}
              onSelect={() => setSelected(c)}
            />
          ))}
        </div>

        {/* Detail panel */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Selected email header */}
          <div className="px-5 py-3 bg-white border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">{selected.email.subject}</div>
                <div className="text-xs text-slate-400">
                  From <span className="font-mono">{selected.email.senderAddress}</span> · {selected.email.receivedAt} · {selected.relationship.clientName}
                </div>
              </div>
            </div>
          </div>

          {/* Connected sources strip — highlights active tab's sources */}
          <ConnectedSources activeTab={activeTab} />

          {/* Tab navigation */}
          <div className="flex items-center gap-0 border-b border-slate-200 bg-white shrink-0 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.cat}
                onClick={() => setActiveTab(tab.cat)}
                className={clsx(
                  'flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors',
                  activeTab === tab.cat
                    ? 'border-blue-500 text-blue-700 bg-blue-50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}
              >
                {tab.icon}
                <span className="text-xs text-slate-400 mr-0.5">Cat {tab.cat}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 1 && <EmailTab c={selected} />}
            {activeTab === 2 && <InstructionTab c={selected} />}
            {activeTab === 3 && <RelationshipTab c={selected} />}
            {activeTab === 4 && <IdentityTab c={selected} />}
            {activeTab === 5 && <ExternalTab c={selected} />}
          </div>
        </div>
      </div>
    </div>
  )
}
