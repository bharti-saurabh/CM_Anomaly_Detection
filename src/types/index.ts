export type Severity = 'critical' | 'high' | 'medium'
export type Product = 'treasury' | 'custody' | 'wealth'
export type CaseStage = 'detected' | 'investigating' | 'mitigating' | 'resolved'

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

export interface LLMSettings {
  baseUrl: string
  apiKey: string
  model: string
  customModelId: string
  temperature: number
}
