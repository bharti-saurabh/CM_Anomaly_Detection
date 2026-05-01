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
  description: string
  status: AgentStatus
  precision: number
  recall: number
  decisionsToday: number
  lastCase: string
  recentDecisions: AgentDecision[]
}

// ── Navigation ────────────────────────────────────────────────────────────────

export type Section = 'overview' | 'explorer' | 'investigations' | 'agents' | 'rules'
