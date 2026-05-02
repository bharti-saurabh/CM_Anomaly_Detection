export type Severity = 'critical' | 'high' | 'medium'
export type Product = 'treasury' | 'custody' | 'wealth'
export type CaseStage = 'detected' | 'investigating' | 'mitigating' | 'resolved'

// ── XAI ─────────────────────────────────────────────────────────────────────

export interface FeatureContribution {
  feature: string
  agent: string
  value: number   // positive = risk factor, negative = mitigating
  description: string
}

export interface DecisionEvent {
  time: string
  event: string
  agent: string
}

export interface XAIData {
  contributions: FeatureContribution[]
  counterfactual: string
  timeline: DecisionEvent[]
}

// ── Cases ────────────────────────────────────────────────────────────────────

export interface AgentFinding {
  agentName: string
  findings: string[]
}

export interface BacktestResult {
  recall: string
  fpr: string
  delayed: number
  protected: string
}

export interface CaseData {
  summary: string
  confidence: number
  exposure?: string
  flagCount: number
  stage: CaseStage
  agentFindings: AgentFinding[]
  conclusion: string
  proposedRule: string
  pyspark: string
  backtest: BacktestResult
  xai: XAIData
}

export interface Signal {
  id: string
  time: string
  severity: Severity
  title: string
  preview: string
  product: Product
  amount?: string
  caseData: CaseData
}

// ── LLM ─────────────────────────────────────────────────────────────────────

export interface LLMSettings {
  baseUrl: string
  apiKey: string
  model: string
  customModelId: string
  temperature: number
}

// ── Transactions (Data Explorer) ─────────────────────────────────────────────

export type TxStatus = 'clear' | 'flagged' | 'blocked'
export type TxType = 'MT103' | 'MT542' | 'ACH' | 'Wire' | 'Retail App' | 'FX Swap'

export interface Transaction {
  id: string
  timestamp: string
  clientId: string
  clientName: string
  product: Product
  type: TxType
  amount?: number
  currency: string
  fromJurisdiction: string
  toJurisdiction: string
  anomalyScore: number   // 0–100
  status: TxStatus
  signalId?: string
  topFactors: string[]
}

// ── Time Series ───────────────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  date: string
  volume: number
  anomalyCount: number
  avgScore: number
}

// ── Agents ────────────────────────────────────────────────────────────────────

export type AgentStatus = 'idle' | 'analyzing' | 'complete'

export interface AgentDecision {
  id: string
  timestamp: string
  caseId: string
  caseTitle: string
  confidence: number
  outcome: 'flagged' | 'cleared' | 'escalated'
  processingMs: number
}

export interface Agent {
  id: string
  name: string
  model: string
  description: string
  status: AgentStatus
  precision: number
  recall: number
  decisionsToday: number
  lastCase: string
  showInOverview: boolean
  recentDecisions: AgentDecision[]
}

// ── Navigation ────────────────────────────────────────────────────────────────

export type Section = 'overview' | 'explorer' | 'investigations' | 'agents' | 'rules'

// ── BEC Cases (Data Explorer) ─────────────────────────────────────────────────

export interface BECEmailSegment {
  text: string
  entityType?: 'amount' | 'account' | 'person' | 'institution' | 'deadline' | 'location'
}

export interface BECEmail {
  id: string
  receivedAt: string
  senderName: string
  senderAddress: string
  senderDomainAgeDays: number
  senderDomainRegistrar: string
  senderDomainRegistrationDate: string
  legitimateDomain: string
  replyToAddress: string | null
  subject: string
  bodySegments: BECEmailSegment[]
  dkim: 'pass' | 'fail'
  spf: 'pass' | 'fail'
  dmarc: 'pass' | 'fail'
  originatingIP: string
  mailServerPath: string[]
  emailSizeKB: number
  contentType: string
  isFirstContact: boolean
  totalEmailsFromSender: number
  totalEmailsFromDomain: number
  attachments: string[]
}

export interface BECInstruction {
  instructionId: string
  channel: 'SWIFT' | 'Fedwire' | 'Internal'
  sourceSystem: string
  submittedAt: string
  submittedOutsideHours: boolean
  deviceFingerprint: string
  beneficiaryName: string
  beneficiaryAccount: string
  beneficiaryBank: string
  beneficiaryCountry: string
  beneficiaryIsNew: boolean
  daysSinceLastPaymentToBeneficiary: number | null
  amount: number
  currency: string
  historicalAvg: number
  historicalMax: number
  amountDeviationFactor: number
  roundNumberFlag: boolean
  belowThresholdFlag: boolean
  submittedBy: string
  approvedBy: string
  selfApproved: boolean
  modifiedAfterEntry: boolean
  dualAuthFollowed: boolean
  approvalWorkflowMinutes: number
  referenceText: string
  freeTextNotes: string
}

export interface BECRelationship {
  clientName: string
  clientIndustry: string
  tenureYears: number
  typicalAmountMin: number
  typicalAmountMax: number
  typicalCountries: string[]
  typicalChannels: string[]
  avgPaymentFrequencyDays: number
  counterpartyRegistryCount: number
  rmName: string
  rmConsulted: boolean
  lastPaymentDate: string
  totalPaymentsLast12M: number
}

export interface BECIdentity {
  submittingUser: string
  userId: string
  loginTime: string
  deviceIsNew: boolean
  deviceId: string
  loginLocation: string
  expectedLocation: string
  mfaUsed: boolean
  mfaMethod: string
  vpnDetected: boolean
  priorFailedLogins: number
  approvalAuthoritySufficient: boolean
  sessionDurationMinutes: number
  sessionPagesVisited: number
}

export interface BECExternalIntel {
  beneficiaryFraudFlag: boolean
  beneficiaryFraudSource: string | null
  ipFlagged: boolean
  ipFraudSource: string | null
  ipAsn: string
  ipGeolocation: string
  emailDomainAgeDays: number
  emailDomainIsLookalike: boolean
  lookalikeDomain: string | null
  swiftControlsFlag: boolean
  fincenMatch: boolean
  ofacMatch: boolean
  sanctionsScreeningResult: string
  beneficiaryBankCountryRisk: string
}

export interface ExtractedEntity {
  type: 'amount' | 'account' | 'person' | 'institution' | 'deadline' | 'location'
  value: string
  confidence: number
  offsetInBody?: number
}

export interface EmailNLPAnalysis {
  detectedLanguage: string
  languageConfidence: number
  primaryTone: string
  secondaryTone: string
  sentiment: number
  sentimentLabel: string
  grammaticalErrorCount: number
  grammaticalErrorExamples: string[]
  spellingErrorCount: number
  vocabularySophistication: string
  avgSentenceLength: number
  passiveVoiceRatio: number
  readabilityScore: number
  writingStyleConsistency: number
  histStyleBaselineSamples: number
  urgencyPhrases: string[]
  secrecyPhrases: string[]
  authorityPhrases: string[]
  overridePhrases: string[]
  extractedEntities: ExtractedEntity[]
  wordCount: number
  paragraphCount: number
  questionCount: number
  exclamationCount: number
  capsWordCount: number
}

export interface BECOutcome {
  disposition: string
  dispositionDate: string | null
  sarFiled: boolean
  sarReference: string | null
  ratRequestFiled: boolean
  ratOutcome: string | null
  fundsRecovered: boolean
  recoveredAmount: number | null
  modelFeedbackLabel: string
  addedToTrainingData: boolean
  investigatorNotes: string
  resolutionDays: number | null
}

export interface BECCase {
  id: string
  signalId?: string
  anomalyScore: number
  status: 'blocked' | 'flagged' | 'cleared'
  severity: 'critical' | 'high' | 'medium'
  createdAt: string
  email: BECEmail
  instruction: BECInstruction
  relationship: BECRelationship
  identity: BECIdentity
  externalIntel: BECExternalIntel
  nlpAnalysis: EmailNLPAnalysis
  outcome: BECOutcome
  riskFlags: string[]
}
