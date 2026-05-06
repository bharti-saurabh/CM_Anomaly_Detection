import { useState, useEffect, useRef } from 'react'
import { Database, Zap } from 'lucide-react'
import clsx from 'clsx'
import { BEC_CASES } from '../data/becCases'
import type { BECCase } from '../types'

// ── Entity highlight styles ───────────────────────────────────────────────────

const ENTITY_ACTIVE: Record<string, string> = {
  amount:      'bg-blue-100 text-blue-800 border border-blue-300 rounded px-0.5',
  account:     'bg-violet-100 text-violet-800 border border-violet-300 rounded px-0.5',
  person:      'bg-amber-100 text-amber-800 border border-amber-300 rounded px-0.5',
  institution: 'bg-emerald-100 text-emerald-800 border border-emerald-300 rounded px-0.5',
  deadline:    'bg-orange-100 text-orange-800 border border-orange-300 rounded px-0.5',
  location:    'bg-slate-200 text-slate-700 border border-slate-300 rounded px-0.5',
}

// ── Feed field type ───────────────────────────────────────────────────────────

interface FeedField {
  category: string
  label: string
  value: string
  risk?: 'critical' | 'high' | 'medium'
  mono?: boolean
  activatesEntity?: string
}

function buildFeedSequence(c: BECCase): FeedField[] {
  const { email: e, instruction: i, relationship: r, identity: id, externalIntel: ei, nlpAnalysis: n } = c
  return [
    // ── Email Forensics ───────────────────────────────────────────────────────
    { category: 'Email Forensics', label: 'Sender name',           value: e.senderName,                                                                                                                  activatesEntity: 'person'      },
    { category: 'Email Forensics', label: 'Sender address',        value: e.senderAddress,                                                         mono: true,                                          activatesEntity: 'institution' },
    { category: 'Email Forensics', label: 'Reply-To',              value: e.replyToAddress ?? 'Same as sender',                                     mono: true                                                                        },
    { category: 'Email Forensics', label: 'Domain age',            value: `${e.senderDomainAgeDays} days`,                                          risk: e.senderDomainAgeDays < 30 ? 'critical' : undefined                        },
    { category: 'Email Forensics', label: 'Resembles',             value: e.legitimateDomain,                                                       mono: true, risk: 'high'                                                          },
    { category: 'Email Forensics', label: 'Domain registrar',      value: e.senderDomainRegistrar                                                                                                                                      },
    { category: 'Email Forensics', label: 'Registered',            value: e.senderDomainRegistrationDate                                                                                                                               },
    { category: 'Email Forensics', label: 'DKIM / SPF / DMARC',   value: `${e.dkim.toUpperCase()} · ${e.spf.toUpperCase()} · ${e.dmarc.toUpperCase()}`, risk: e.dkim === 'fail' || e.spf === 'fail' ? 'high' : undefined            },
    { category: 'Email Forensics', label: 'Originating IP',        value: e.originatingIP,                                                          mono: true                                                                        },
    { category: 'Email Forensics', label: 'Mail server path',      value: e.mailServerPath.join(' → '),                                             mono: true                                                                        },
    { category: 'Email Forensics', label: 'First contact',         value: e.isFirstContact ? 'Yes — never emailed before' : 'No',                  risk: e.isFirstContact ? 'high' : undefined                                      },
    { category: 'Email Forensics', label: 'Prior (sender)',        value: `${e.totalEmailsFromSender} email${e.totalEmailsFromSender !== 1 ? 's' : ''}`                                                                               },
    { category: 'Email Forensics', label: 'Prior (domain)',        value: `${e.totalEmailsFromDomain} email${e.totalEmailsFromDomain !== 1 ? 's' : ''}`                                                                               },
    { category: 'Email Forensics', label: 'Email size',            value: `${e.emailSizeKB} KB`                                                                                                                                        },
    { category: 'Email Forensics', label: 'Content type',          value: e.contentType,                                                            mono: true                                                                        },
    { category: 'Email Forensics', label: 'Attachments',           value: e.attachments.length > 0 ? e.attachments.join(', ') : 'None',            risk: e.attachments.length > 0 ? 'medium' : undefined                            },
    { category: 'Email Forensics', label: 'Style match',           value: `${Math.round(n.writingStyleConsistency * 100)}% vs baseline`,           risk: n.writingStyleConsistency < 0.4 ? 'critical' : n.writingStyleConsistency < 0.6 ? 'high' : undefined },

    // ── NLP Signals ───────────────────────────────────────────────────────────
    { category: 'NLP Signals', label: 'Language',            value: `${n.detectedLanguage} (${Math.round(n.languageConfidence * 100)}% conf.)`                                                          },
    { category: 'NLP Signals', label: 'Primary tone',        value: n.primaryTone                                                                                                                       },
    { category: 'NLP Signals', label: 'Secondary tone',      value: n.secondaryTone                                                                                                                     },
    { category: 'NLP Signals', label: 'Sentiment',           value: `${n.sentimentLabel} (${n.sentiment > 0 ? '+' : ''}${n.sentiment.toFixed(2)})`                                                     },
    { category: 'NLP Signals', label: 'Word count',          value: `${n.wordCount} words · ${n.paragraphCount} paragraphs`                                                                             },
    { category: 'NLP Signals', label: 'Readability',         value: `${n.readabilityScore.toFixed(1)} / 100 · ${n.vocabularySophistication}`                                                           },
    { category: 'NLP Signals', label: 'Avg sentence length', value: `${n.avgSentenceLength.toFixed(1)} words`                                                                                          },
    { category: 'NLP Signals', label: 'Passive voice',       value: `${Math.round(n.passiveVoiceRatio * 100)}%`                                                                                        },
    { category: 'NLP Signals', label: 'Grammar errors',      value: n.grammaticalErrorCount.toString(),                                            risk: n.grammaticalErrorCount > 2 ? 'medium' : undefined                         },
    { category: 'NLP Signals', label: 'Spelling errors',     value: n.spellingErrorCount.toString(),                                               risk: n.spellingErrorCount > 2 ? 'medium' : undefined                            },
    { category: 'NLP Signals', label: 'Style baseline',      value: `${n.histStyleBaselineSamples} historical samples`                                                                                  },
    { category: 'NLP Signals', label: 'Urgency phrases',     value: n.urgencyPhrases.length > 0 ? `${n.urgencyPhrases.length}: "${n.urgencyPhrases[0]}"` : 'None',    risk: n.urgencyPhrases.length > 0 ? 'high' : undefined,    activatesEntity: 'deadline' },
    { category: 'NLP Signals', label: 'Override phrases',    value: n.overridePhrases.length > 0 ? `${n.overridePhrases.length}: "${n.overridePhrases[0]}"` : 'None', risk: n.overridePhrases.length > 0 ? 'critical' : undefined },
    { category: 'NLP Signals', label: 'Secrecy phrases',     value: n.secrecyPhrases.length > 0 ? `${n.secrecyPhrases.length}: "${n.secrecyPhrases[0]}"` : 'None',   risk: n.secrecyPhrases.length > 0 ? 'medium' : undefined    },
    { category: 'NLP Signals', label: 'Authority phrases',   value: n.authorityPhrases.length > 0 ? `${n.authorityPhrases.length} detected` : 'None',                 risk: n.authorityPhrases.length > 0 ? 'medium' : undefined  },
    { category: 'NLP Signals', label: 'Extracted entities',  value: n.extractedEntities.length > 0 ? `${n.extractedEntities.length} entities — ${[...new Set(n.extractedEntities.map(x => x.type))].join(', ')}` : 'None' },

    // ── Counterparty ──────────────────────────────────────────────────────────
    { category: 'Counterparty', label: 'Client',               value: r.clientName,                                                                                                    activatesEntity: 'institution' },
    { category: 'Counterparty', label: 'Industry',             value: r.clientIndustry                                                                                                                  },
    { category: 'Counterparty', label: 'Tenure',               value: `${r.tenureYears} years`                                                                                                          },
    { category: 'Counterparty', label: 'RM name',              value: r.rmName,                                                                                                         activatesEntity: 'person'      },
    { category: 'Counterparty', label: 'RM consulted',         value: r.rmConsulted ? 'Yes' : 'No',                                               risk: !r.rmConsulted ? 'medium' : undefined                          },
    { category: 'Counterparty', label: 'Typical amount range', value: `${i.currency} ${r.typicalAmountMin.toLocaleString()} – ${r.typicalAmountMax.toLocaleString()}`                                  },
    { category: 'Counterparty', label: 'Avg payment freq.',    value: `Every ${r.avgPaymentFrequencyDays} days`                                                                                         },
    { category: 'Counterparty', label: 'Total payments 12M',   value: r.totalPaymentsLast12M.toString()                                                                                                 },
    { category: 'Counterparty', label: 'Last payment date',    value: r.lastPaymentDate                                                                                                                 },
    { category: 'Counterparty', label: 'Known counterparties', value: `${r.counterpartyRegistryCount} registered`                                                                                       },
    { category: 'Counterparty', label: 'Typical countries',    value: r.typicalCountries.join(', ')                                                                                                     },
    { category: 'Counterparty', label: 'Typical channels',     value: r.typicalChannels.join(', ')                                                                                                      },

    // ── Payment Instruction ───────────────────────────────────────────────────
    { category: 'Payment Instruction', label: 'Instruction ID',     value: i.instructionId,                                                         mono: true                                          },
    { category: 'Payment Instruction', label: 'Source system',      value: i.sourceSystem                                                                                                               },
    { category: 'Payment Instruction', label: 'Channel',            value: i.channel                                                                                                                    },
    { category: 'Payment Instruction', label: 'Submitted at',       value: i.submittedAt,                                                           risk: i.submittedOutsideHours ? 'medium' : undefined },
    { category: 'Payment Instruction', label: 'Off-hours',          value: i.submittedOutsideHours ? 'Yes' : 'No',                                  risk: i.submittedOutsideHours ? 'medium' : undefined },
    { category: 'Payment Instruction', label: 'Amount',             value: `${i.currency} ${i.amount.toLocaleString()}`,                            mono: true, risk: i.amountDeviationFactor > 5 ? 'critical' : i.amountDeviationFactor > 2 ? 'high' : undefined, activatesEntity: 'amount' },
    { category: 'Payment Instruction', label: 'Historical avg',     value: `${i.currency} ${i.historicalAvg.toLocaleString()}`                                                                         },
    { category: 'Payment Instruction', label: 'Historical max',     value: `${i.currency} ${i.historicalMax.toLocaleString()}`                                                                         },
    { category: 'Payment Instruction', label: 'Deviation',          value: `${i.amountDeviationFactor.toFixed(1)}× historical avg`,                 risk: i.amountDeviationFactor > 5 ? 'critical' : 'high' },
    { category: 'Payment Instruction', label: 'Round number',       value: i.roundNumberFlag ? 'Yes — suspicious' : 'No',                          risk: i.roundNumberFlag ? 'medium' : undefined      },
    { category: 'Payment Instruction', label: 'Below threshold',    value: i.belowThresholdFlag ? 'Yes — structuring risk' : 'No',                 risk: i.belowThresholdFlag ? 'high' : undefined     },
    { category: 'Payment Instruction', label: 'Beneficiary',        value: i.beneficiaryName,                                                                                            activatesEntity: 'institution' },
    { category: 'Payment Instruction', label: 'Beneficiary bank',   value: i.beneficiaryBank,                                                                                            activatesEntity: 'institution' },
    { category: 'Payment Instruction', label: 'Account',            value: i.beneficiaryAccount,                                                    mono: true,                          activatesEntity: 'account'     },
    { category: 'Payment Instruction', label: 'Country',            value: i.beneficiaryCountry,                                                    risk: !r.typicalCountries.includes(i.beneficiaryCountry) ? 'high' : undefined, activatesEntity: 'location' },
    { category: 'Payment Instruction', label: 'New beneficiary',    value: i.beneficiaryIsNew ? 'Yes — first contact' : 'No',                      risk: i.beneficiaryIsNew ? 'critical' : undefined   },
    { category: 'Payment Instruction', label: 'Days since last',    value: i.daysSinceLastPaymentToBeneficiary !== null ? `${i.daysSinceLastPaymentToBeneficiary} days` : 'Never paid', risk: i.daysSinceLastPaymentToBeneficiary === null ? 'critical' : undefined },
    { category: 'Payment Instruction', label: 'Modified after',     value: i.modifiedAfterEntry ? 'Yes' : 'No',                                    risk: i.modifiedAfterEntry ? 'high' : undefined     },
    { category: 'Payment Instruction', label: 'Dual auth',          value: i.dualAuthFollowed ? 'Yes' : 'No',                                      risk: !i.dualAuthFollowed ? 'critical' : undefined  },
    { category: 'Payment Instruction', label: 'Self-approved',      value: i.selfApproved ? 'Yes' : 'No',                                          risk: i.selfApproved ? 'critical' : undefined       },
    { category: 'Payment Instruction', label: 'Approved by',        value: i.approvedBy                                                                                                                 },
    { category: 'Payment Instruction', label: 'Workflow time',      value: `${i.approvalWorkflowMinutes} min`,                                      risk: i.approvalWorkflowMinutes < 3 ? 'high' : undefined },
    { category: 'Payment Instruction', label: 'Reference text',     value: i.referenceText,                                                         mono: true                                          },
    { category: 'Payment Instruction', label: 'Notes',              value: i.freeTextNotes || 'None'                                                                                                    },
    { category: 'Payment Instruction', label: 'Device fingerprint', value: i.deviceFingerprint,                                                     mono: true                                          },

    // ── Identity & Session ────────────────────────────────────────────────────
    { category: 'Identity & Session', label: 'Wire operator',       value: id.submittingUser                                                                                          },
    { category: 'Identity & Session', label: 'Role (BNY)',          value: id.submittingUserRole                                                                                      },
    { category: 'Identity & Session', label: 'User ID',             value: id.userId,                                                               mono: true                        },
    { category: 'Identity & Session', label: 'Login time',          value: id.loginTime                                                                                               },
    { category: 'Identity & Session', label: 'Login location',      value: id.loginLocation,                                                        risk: id.loginLocation !== id.expectedLocation ? 'high' : undefined },
    { category: 'Identity & Session', label: 'Expected location',   value: id.expectedLocation                                                                                        },
    { category: 'Identity & Session', label: 'Device',              value: id.deviceIsNew ? 'New — unrecognised' : 'Known device',                  risk: id.deviceIsNew ? 'high' : undefined },
    { category: 'Identity & Session', label: 'Device ID',           value: id.deviceId,                                                             mono: true                        },
    { category: 'Identity & Session', label: 'MFA used',            value: id.mfaUsed ? `Yes — ${id.mfaMethod}` : 'No',                            risk: !id.mfaUsed ? 'critical' : undefined },
    { category: 'Identity & Session', label: 'Failed logins',       value: id.priorFailedLogins.toString(),                                         risk: id.priorFailedLogins > 2 ? 'high' : undefined },
    { category: 'Identity & Session', label: 'Approval authority',  value: id.approvalAuthoritySufficient ? 'Sufficient' : 'Insufficient',          risk: !id.approvalAuthoritySufficient ? 'critical' : undefined },
    { category: 'Identity & Session', label: 'VPN detected',        value: id.vpnDetected ? 'Yes' : 'No',                                          risk: id.vpnDetected ? 'medium' : undefined },
    { category: 'Identity & Session', label: 'Session duration',    value: `${id.sessionDurationMinutes} min`                                                                         },
    { category: 'Identity & Session', label: 'Pages visited',       value: id.sessionPagesVisited.toString()                                                                          },

    // ── External Intelligence ─────────────────────────────────────────────────
    { category: 'External Intelligence', label: 'FinCEN 314(b)',        value: ei.fincenMatch ? 'MATCH FOUND' : 'Clear',                                                              risk: ei.fincenMatch ? 'critical' : undefined          },
    { category: 'External Intelligence', label: 'OFAC / SDN',           value: ei.ofacMatch ? 'MATCH FOUND' : 'Clear',                                                               risk: ei.ofacMatch ? 'critical' : undefined            },
    { category: 'External Intelligence', label: 'Sanctions screening',  value: ei.sanctionsScreeningResult                                                                                                                               },
    { category: 'External Intelligence', label: 'Beneficiary fraud',    value: ei.beneficiaryFraudFlag ? `Yes — ${ei.beneficiaryFraudSource ?? 'unknown source'}` : 'No flag',       risk: ei.beneficiaryFraudFlag ? 'critical' : undefined },
    { category: 'External Intelligence', label: 'SWIFT controls',       value: ei.swiftControlsFlag ? 'Alert raised' : 'Clear',                                                       risk: ei.swiftControlsFlag ? 'high' : undefined        },
    { category: 'External Intelligence', label: 'Country risk',         value: ei.beneficiaryBankCountryRisk                                                                                                                             },
    { category: 'External Intelligence', label: 'IP address',           value: `${ei.ipGeolocation} · ASN: ${ei.ipAsn}`,                                                             mono: true                                             },
    { category: 'External Intelligence', label: 'IP reputation',        value: ei.ipFlagged ? `Flagged — ${ei.ipFraudSource ?? 'unknown'}` : 'Clean',                                risk: ei.ipFlagged ? 'high' : undefined                },
    { category: 'External Intelligence', label: 'Lookalike domain',     value: ei.emailDomainIsLookalike ? `Yes — spoofing ${ei.lookalikeDomain}` : 'No',                            risk: ei.emailDomainIsLookalike ? 'critical' : undefined },
    { category: 'External Intelligence', label: 'Email domain age',     value: `${ei.emailDomainAgeDays} days`,                                                                       risk: ei.emailDomainAgeDays < 30 ? 'high' : undefined  },
  ]
}

// ── Category style map ────────────────────────────────────────────────────────

const CAT_STYLE: Record<string, { header: string; dot: string }> = {
  'Email Forensics':       { header: 'text-pink-700 bg-pink-50 border-pink-200',       dot: 'bg-pink-500'    },
  'NLP Signals':           { header: 'text-rose-700 bg-rose-50 border-rose-200',        dot: 'bg-rose-500'    },
  'Counterparty':          { header: 'text-cyan-700 bg-cyan-50 border-cyan-200',        dot: 'bg-cyan-500'    },
  'Payment Instruction':   { header: 'text-violet-700 bg-violet-50 border-violet-200',  dot: 'bg-violet-500'  },
  'Identity & Session':    { header: 'text-amber-700 bg-amber-50 border-amber-200',     dot: 'bg-amber-500'   },
  'External Intelligence': { header: 'text-teal-700 bg-teal-50 border-teal-200',        dot: 'bg-teal-500'    },
}

const RISK_STYLE: Record<string, string> = {
  critical: 'text-red-600 font-semibold',
  high:     'text-orange-600 font-semibold',
  medium:   'text-amber-600 font-semibold',
}

// ── Email viewer (middle panel) ───────────────────────────────────────────────

function EmailViewer({ c, activeEntities }: { c: BECCase; activeEntities: Set<string> }) {
  const { email: e } = c
  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">

      {/* Email header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Intercepted Email</div>
        <div className="space-y-2">
          {[
            { key: 'From',     val: `${e.senderName} <${e.senderAddress}>`, risky: true  },
            ...(e.replyToAddress ? [{ key: 'Reply-To', val: e.replyToAddress, risky: true }] : []),
            { key: 'Date',     val: e.receivedAt,                           risky: false },
            { key: 'Subject',  val: e.subject,                              risky: false },
          ].map(({ key, val, risky }) => (
            <div key={key} className="flex gap-2">
              <span className="text-[11px] text-slate-400 shrink-0 w-16">{key}</span>
              <span className={clsx('text-[11px] leading-snug break-all', risky ? 'text-red-700 font-semibold font-mono' : 'text-slate-700')}>{val}</span>
            </div>
          ))}
        </div>

        {/* Auth indicators */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(['dkim', 'spf', 'dmarc'] as const).map(k => (
            <span key={k} className={clsx(
              'text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase',
              e[k] === 'pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
            )}>
              {k}: {e[k]}
            </span>
          ))}
          <span className={clsx(
            'text-[9px] font-bold px-1.5 py-0.5 rounded border ml-auto',
            e.senderDomainAgeDays < 30 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'
          )}>
            Domain: {e.senderDomainAgeDays}d old
          </span>
        </div>
      </div>

      {/* Body with entity highlighting */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="text-[12px] text-slate-700 leading-loose whitespace-pre-wrap">
          {e.bodySegments.map((seg, i) =>
            seg.entityType ? (
              <span
                key={i}
                title={seg.entityType}
                className={clsx(
                  'transition-all duration-700',
                  activeEntities.has(seg.entityType)
                    ? ENTITY_ACTIVE[seg.entityType]
                    : 'text-slate-400'
                )}
              >
                {seg.text}
              </span>
            ) : (
              <span key={i}>{seg.text}</span>
            )
          )}
        </div>
      </div>

      {/* Entity legend */}
      <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 shrink-0">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[9px] text-slate-400 mr-1">Entity types:</span>
          {Object.entries(ENTITY_ACTIVE).map(([type, cls]) => (
            <span
              key={type}
              className={clsx(
                'text-[9px] px-1.5 py-0.5 rounded border transition-opacity duration-500',
                cls,
                activeEntities.has(type) ? 'opacity-100' : 'opacity-25'
              )}
            >
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Data feed panel (right panel) ─────────────────────────────────────────────

function DataFeedPanel({ fields, visibleCount }: { fields: FeedField[]; visibleCount: number }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [visibleCount])

  const visibleFields = fields.slice(0, visibleCount)

  // Group by category preserving order of first appearance
  const seenCats: string[] = []
  const grouped: Record<string, FeedField[]> = {}
  for (const f of visibleFields) {
    if (!grouped[f.category]) {
      seenCats.push(f.category)
      grouped[f.category] = []
    }
    grouped[f.category].push(f)
  }

  return (
    <div className="h-full overflow-y-auto px-3 py-3 space-y-3">
      {seenCats.map(cat => {
        const s = CAT_STYLE[cat] ?? { header: 'text-slate-700 bg-slate-50 border-slate-200', dot: 'bg-slate-500' }
        return (
          <div key={cat}>
            <div className={clsx('flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest mb-1.5', s.header)}>
              <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} />
              {cat}
            </div>
            <div className="divide-y divide-slate-100">
              {grouped[cat].map((f, i) => (
                <div key={i} className="flex items-start justify-between gap-2 py-1.5">
                  <span className="text-[10px] text-slate-400 shrink-0 w-28 leading-relaxed pt-px">{f.label}</span>
                  <span className={clsx(
                    'text-[11px] text-right leading-relaxed break-words flex-1',
                    f.mono && 'font-mono',
                    f.risk ? RISK_STYLE[f.risk] : 'text-slate-700'
                  )}>
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {visibleCount < fields.length && (
        <div className="flex items-center gap-2 py-1 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
          <span className="text-[10px] text-blue-500 font-mono">Extracting signals…</span>
        </div>
      )}

      {visibleCount >= fields.length && fields.length > 0 && (
        <div className="flex items-center gap-2 py-1 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-[10px] text-emerald-600 font-semibold">Extraction complete — {fields.length} signals</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

// ── Case list item ────────────────────────────────────────────────────────────

function CaseListItem({ c, isSelected, onSelect }: { c: BECCase; isSelected: boolean; onSelect: () => void }) {
  const dot = c.severity === 'critical' ? 'bg-red-500' : c.severity === 'high' ? 'bg-orange-500' : 'bg-amber-400'
  const sev = c.severity === 'critical' ? 'text-red-600' : c.severity === 'high' ? 'text-orange-600' : 'text-amber-600'
  return (
    <button
      onClick={onSelect}
      className={clsx(
        'w-full text-left px-4 py-3.5 border-b border-slate-100 transition-colors',
        isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
        <span className="text-[10px] font-mono text-slate-400 flex-1 truncate">{c.id}</span>
        <span className={clsx('text-[9px] font-bold uppercase shrink-0', sev)}>{c.severity}</span>
      </div>
      <div className="text-xs font-semibold text-slate-800 truncate pl-3.5">{c.relationship.clientName}</div>
      <div className="text-[11px] text-slate-400 truncate pl-3.5 mt-0.5">{c.email.subject}</div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const FIELD_INTERVAL_MS = 160

export function DataExplorer() {
  const [selected,          setSelected]          = useState<BECCase | null>(null)
  const [search,            setSearch]            = useState('')
  const [fields,            setFields]            = useState<FeedField[]>([])
  const [visibleCount,      setVisibleCount]      = useState(0)
  const [extractionStarted, setExtractionStarted] = useState(false)

  // Reset whenever a new case is selected
  useEffect(() => {
    if (!selected) return
    setFields(buildFeedSequence(selected))
    setVisibleCount(0)
    setExtractionStarted(false)
  }, [selected])

  // Tick visible count forward only once extraction is triggered
  useEffect(() => {
    if (!extractionStarted) return
    if (visibleCount >= fields.length) return
    const t = setTimeout(() => setVisibleCount(v => v + 1), FIELD_INTERVAL_MS)
    return () => clearTimeout(t)
  }, [visibleCount, fields.length, extractionStarted])

  const activeEntities = new Set(
    fields.slice(0, visibleCount).flatMap(f => f.activatesEntity ? [f.activatesEntity] : [])
  )

  const filtered = BEC_CASES.filter(c =>
    !search ||
    c.relationship.clientName.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase()) ||
    c.email.subject.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (c: BECCase) => {
    if (selected?.id !== c.id) setSelected(c)
  }

  const handleExtract = () => setExtractionStarted(true)

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">

      {/* Top bar */}
      <div className="px-5 py-3 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Database className="w-4 h-4 text-blue-500" />
            <h1 className="text-sm font-bold text-slate-900">Data Explorer</h1>
            <span className="text-xs text-slate-400 ml-1">— 14 connected sources</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {selected && extractionStarted && (
              <span className="text-[10px] font-mono text-slate-400">
                {visibleCount}/{fields.length} signals extracted
              </span>
            )}
            {selected && !extractionStarted && (
              <button
                onClick={handleExtract}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                Extract Signals
              </button>
            )}
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search client, case ID, subject…"
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: case list — always visible */}
        <div className="w-52 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          {filtered.map(c => (
            <CaseListItem
              key={c.id}
              c={c}
              isSelected={selected?.id === c.id}
              onSelect={() => handleSelect(c)}
            />
          ))}
        </div>

        {/* No case selected — placeholder */}
        {!selected && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-10">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              <Database className="w-7 h-7 text-slate-300" />
            </div>
            <div className="text-sm font-semibold text-slate-500">Select a case to inspect</div>
            <div className="text-xs text-slate-400 max-w-xs">
              Click any case on the left to view the intercepted email, then extract signals from 14 connected sources.
            </div>
          </div>
        )}

        {/* Case selected — email + right panel */}
        {selected && (
          <>
            {/* Middle: email */}
            <div className="flex-1 border-r border-slate-200 overflow-hidden min-w-0">
              <EmailViewer c={selected} activeEntities={activeEntities} />
            </div>

            {/* Right: data feed or pre-extraction prompt */}
            <div className="w-80 shrink-0 bg-white flex flex-col overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 shrink-0 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Extracted Signals</span>
                {extractionStarted && (
                  <span className={clsx(
                    'text-[10px] font-mono',
                    visibleCount >= fields.length ? 'text-emerald-600 font-semibold' : 'text-blue-500'
                  )}>
                    {visibleCount >= fields.length ? 'Complete' : `${visibleCount}/${fields.length}`}
                  </span>
                )}
              </div>

              {!extractionStarted ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-700 mb-1">Ready to extract</div>
                    <div className="text-[10px] text-slate-400">{fields.length} signals across 6 categories</div>
                  </div>
                  <button
                    onClick={handleExtract}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-200"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Extract Signals
                  </button>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Queries email forensics, NLP, payment, identity, counterparty, and external intelligence sources.
                  </p>
                </div>
              ) : (
                <DataFeedPanel fields={fields} visibleCount={visibleCount} />
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
