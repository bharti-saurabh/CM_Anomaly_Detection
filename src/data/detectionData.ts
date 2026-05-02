export interface AgentDetectionData {
  lines: string[]
  score: number
}

export interface DetectionScenario {
  orchestratorOpen: string[]
  orchestratorClose: string[]
  ensembleScore: number
  agents: {
    email: AgentDetectionData
    payment: AgentDetectionData
    identity: AgentDetectionData
    graph: AgentDetectionData
    sanctions: AgentDetectionData
  }
}

export const DETECTION_SCENARIOS: Record<string, DetectionScenario> = {
  'TR-8842': {
    orchestratorOpen: [
      'Case TR-8842 received — $14.5M MT103, Apex Global Corp → Global Steel Holdings HK',
      'Severity: CRITICAL | Loading 24-month transaction baseline + email corpus...',
      'Dispatching 5 specialist agents in parallel — consensus threshold: 80%',
    ],
    orchestratorClose: [
      'All 5 agents complete — computing weighted ensemble score...',
      'Weights: Email ×0.25 · Payment ×0.30 · Identity ×0.20 · Graph ×0.15 · Sanctions ×0.10',
    ],
    ensembleScore: 98.4,
    agents: {
      email: {
        lines: [
          'Loading Apex Global email corpus — 1,847 threads over 24 months...',
          'BERT urgency classifier: "URGENT OVERDUE Q3 SUPPLY INVOICE" → score 0.91 (threshold 0.60)',
          'Authority override phrase: "as discussed with the CEO" — manipulation pattern confirmed',
          'Domain lookalike: bncmellon-treasury.com vs bnymellon.com — Levenshtein dist 8, typosquat positive',
          'Style δ vs 94-sample Apex baseline: 3.4σ deviation — likely non-native authorship',
        ],
        score: 87,
      },
      payment: {
        lines: [
          'Ingesting MT103: $14,500,000 USD → Global Steel Holdings HK (Bank of East Asia)',
          'Amount deviation: 6.9× client 90-day avg of $2.1M — 6.9σ outlier on rolling baseline',
          'Beneficiary IBAN HK92-0382... registered in client portal 14 minutes before submission',
          'Round-number flag: $14,500,000 — inconsistent with invoice-precision amounts in client history',
          'Destination HK absent from 24-month jurisdiction whitelist (100% EU + North America prior)',
        ],
        score: 96,
      },
      identity: {
        lines: [
          'Session origin: Apex Global registered IP 203.45.67.89 (Chicago IL) — IP baseline match ✓',
          'Clipboard paste event: beneficiary routing field 08:28 UTC — no manual keystroke sequence detected',
          'Admin_Apex_01 MFA: completed 22 min before routing modification — no re-challenge on field edit',
          'Isolation Forest score: 0.73 — clipboard paste + high-value beneficiary edit sequence is 94th pct',
          'Control gap: beneficiary field modification did not trigger step-up MFA per policy §4.2.1',
        ],
        score: 74,
      },
      graph: {
        lines: [
          'Building counterparty graph: Apex Global — 2,401 payments, 127 unique counterparties over 24mo',
          'Global Steel Holdings HK: node ABSENT from Apex counterparty graph — zero prior relationship',
          'Graph distance from nearest known Apex supplier: 5 hops — isolated node, no shared attributes',
          'Bank of East Asia cluster: 3 prior confirmed BEC cases in fraud graph (rolling 6-month window)',
          'GNN anomaly score: new isolated offshore node + BEC-proximate bank cluster = 0.82',
        ],
        score: 82,
      },
      sanctions: {
        lines: [
          'SWIFT GPI controls: HK destination — medium-risk jurisdiction, enhanced due diligence required',
          'OFAC SDN list: "Global Steel Holdings HK" — probabilistic match score 0.14 (threshold 0.85)',
          'FinCEN 314(b): no match on beneficiary entity; FinCEN 314(a) MSB: no match on account',
          'Beneficiary bank BEASHKHH: FATF member, no shell bank indicator — bank-level risk acceptable',
          'AML typology match: new high-value offshore beneficiary + urgency language → BEC typology 3A',
        ],
        score: 71,
      },
    },
  },

  'CU-4419': {
    orchestratorOpen: [
      'Case CU-4419 received — MT542 Deliver Free, 500K MSFT shares (~$218M), Meridian Capital',
      'Severity: HIGH | Account dormant 4yr 3mo — elevated insider threat indicators present',
      'Dispatching 5 specialist agents in parallel — consensus threshold: 80%',
    ],
    orchestratorClose: [
      'All 5 agents complete — computing weighted ensemble score...',
      'MAC collusion (0.97) + unregistered Cayman entity (0.89) are dominant signal drivers',
    ],
    ensembleScore: 91.2,
    agents: {
      email: {
        lines: [
          'No external email trigger — pivoting to portal communication metadata and instruction text',
          'Instruction reference: "PORTFOLIO REBALANCING — Q4 STRATEGIC" — language inconsistent with Deliver Free type',
          'RM communication thread (last 90 days): zero rebalancing discussion, no authorisation on record',
          'Portal activity log: sub-account accessed 3 times in 4 years — today marks first active session',
          'No account-owner authorisation email for this instruction type or amount — procedural gap',
        ],
        score: 64,
      },
      payment: {
        lines: [
          'MT542 Deliver Free: 500,000 MSFT shares (~$218M market value) → Nexus Prime Securities, Cayman',
          'Settlement velocity: 0 transactions/year (4yr dormancy) to $218M MT542 — extreme outlier',
          'Deliver Free: no consideration leg — assets transfer with zero corresponding receipt detected',
          'Nexus Prime Securities: Cayman entity created 8 months ago, 1 director, nominee structure',
          'Submission time 09:07 UTC — outside standard pre-market settlement instruction window',
        ],
        score: 89,
      },
      identity: {
        lines: [
          'jsmith_ops: session origin NordVPN exit node 185.220.101.47 (Amsterdam) — not registered location',
          'kwong_sr approval: same NordVPN subnet (185.220.101.0/24), review duration 2m 18s (SR 11-7 min: 15m)',
          'MAC fingerprint: jsmith_ops and kwong_sr sessions show identical hardware fingerprint',
          'Isolation Forest: maker-checker on same physical device — 99.8th percentile anomaly, score 0.94',
          'No prior shared-device authentication for either operator in 18-month session history',
        ],
        score: 97,
      },
      graph: {
        lines: [
          'Loading custody counterparty graph: Meridian Capital — 847 settlements over client tenure',
          'Nexus Prime Securities: node ABSENT from approved counterparty registry — zero prior relationship',
          'Corporate lookup: Nexus Prime Cayman Inc — 1 director, nominee structure, 8-month incorporation',
          'Fraud network: Nexus Prime connected to 2 entities flagged in prior insider misappropriation cases',
          'Sub-account CU-4419: isolated sub-node, no linkage to any active Meridian portfolio activity',
        ],
        score: 88,
      },
      sanctions: {
        lines: [
          'Cayman Islands: FATF enhanced monitoring jurisdiction — elevated AML risk rating',
          'OFAC SDN: "Nexus Prime Securities" — no match; FinCEN 314(b): no match on entity or account',
          'Beneficial ownership disclosure: Nexus Prime UBO not disclosed — FinCEN CDD Rule gap identified',
          'AML typology: dormant account reactivation + Deliver Free to offshore unregistered entity → type 7',
          'Regulatory: MT542 >$50M requires pre-approval — no evidence of pre-approval in workflow audit trail',
        ],
        score: 75,
      },
    },
  },

  'PR-9102': {
    orchestratorOpen: [
      'Case PR-9102 received — 45 retail applications, RIA Node #442 (Pinnacle Wealth NJ), 23-min window',
      'Severity: HIGH | Velocity 10× node baseline — PII clustering detected across batch',
      'Dispatching 5 specialist agents in parallel — consensus threshold: 80%',
    ],
    orchestratorClose: [
      'All 5 agents complete — computing weighted ensemble score...',
      'Bot behavior (0.91) + PII clustering (0.87) drive confidence — coordinated SID ring confirmed',
    ],
    ensembleScore: 87.6,
    agents: {
      email: {
        lines: [
          'Analyzing application form content across 45 submissions for linguistic fingerprinting...',
          'NLP scan: 38 of 45 applications contain near-identical employment description text (copy-paste signal)',
          'Purpose-of-account field: 78% share "long-term investment and savings" phrasing verbatim',
          'Linguistic variance across batch: σ=0.04 — human baseline σ=0.61 — automated authorship confirmed',
          'Form completion velocity: avg field transition 83ms vs human baseline 180ms — bot tool confirmed',
        ],
        score: 76,
      },
      payment: {
        lines: [
          'Analyzing ACH funding requests embedded in 38 of 45 approved applications...',
          'Funding amounts: $1,000–$4,999 per account — structuring band below $5K CTR threshold',
          'Aggregate potential ACH exposure: $189,500 — micro per account, material as coordinated batch',
          'ACH routing: 31 applications share 4 routing numbers from same regional bank cluster',
          'Pattern: below-threshold immediate-authorization funding → 530A account origination scheme',
        ],
        score: 82,
      },
      identity: {
        lines: [
          'Session analysis: 45 portal sessions from 3 IP addresses (subnet 185.146.232.0/24)',
          'Mouse-movement entropy: avg 0.12 (automated) vs human baseline 0.71 — bot fingerprint confirmed',
          'CAPTCHA bypass: no challenges triggered despite 10× velocity threshold — known bypass technique',
          'Session cadence: 45 applications in 1,380 seconds — 30.7s per application (human: ~8 min avg)',
          'Isolation Forest: 3-IP narrow origin + sub-95ms transitions → anomaly score 0.97',
        ],
        score: 91,
      },
      graph: {
        lines: [
          'Constructing PII graph: phone numbers, SSNs, addresses across all 45 applications...',
          'Phone clustering: 23 applications share sequential NJ area-code numbers (+1-732-XXX-XXXX range)',
          'Address graph: 31 applications share ZIP 07030 with variant fabricated street names',
          'SSN analysis: 17 applications show SSN-DOB mismatch — primary synthetic identity marker',
          'Graph topology: star pattern from 3 IP hubs — consistent with coordinated SID ring structure',
        ],
        score: 87,
      },
      sanctions: {
        lines: [
          'LexisNexis batch screen: 45 applications — average fraud score 847/1000 (98th percentile of SID rings)',
          'SSN validation: 17 of 45 SSNs issued before subject stated birth date — fabricated identities',
          'FinCEN 314(b): 3 SSNs match individuals in prior synthetic identity rings (last 12 months)',
          'OFAC: no matches; BSA velocity: 45 apps from single RIA node exceeds automated SAR trigger',
          'AML typology: velocity spike + PII clustering + below-threshold ACH → synthetic ID ring type 2',
        ],
        score: 79,
      },
    },
  },
}
