import type { Signal } from '../types'

export const SIGNALS: Signal[] = [
  {
    id: 'TR-8842',
    time: '09:14',
    severity: 'critical',
    title: 'BEC Wire Anomaly',
    preview: '$14.5M MT103 — new jurisdiction, beneficiary modified 14 min prior',
    product: 'treasury',
    amount: '$14.5M',
    caseData: {
      summary: 'Apex Global Corp initiated a $14.5M MT103 wire to a first-occurrence Hong Kong counterparty. Beneficiary routing was modified 14 minutes before execution. Transaction value exceeds 90-day moving average by 690%.',
      confidence: 98.4,
      exposure: '$14.5M',
      flagCount: 1,
      stage: 'investigating',
      agentFindings: [
        {
          agentName: 'Treasury Profiler',
          findings: [
            '2,401 historical wires over 24 months — 100% directed to EU and North American jurisdictions.',
            'Current wire routes to Global Steel Holdings HK via Bank of East Asia — first-occurrence jurisdiction flag triggered.',
            'Transaction value ($14.5M) exceeds client\'s 90-day moving average ($2.1M) by 6.9 standard deviations.',
          ],
        },
        {
          agentName: 'Behavioral Sentinel',
          findings: [
            'Portal session originated from registered Apex Global corporate IP (Chicago, IL) — no account takeover signal.',
            'Anomalous clipboard paste event detected in Beneficiary Routing Number field at 08:28 UTC.',
            'Routing credentials modified by User ID Admin_Apex_01 exactly 14 minutes prior to wire — a known BEC timing signature. No MFA challenge was triggered for the field modification.',
          ],
        },
        {
          agentName: 'Payload Parser',
          findings: [
            'MT103 field 70 contains: "URGENT OVERDUE Q3 SUPPLY INVOICE" — capitalized urgency markers present.',
            'Apex Global 24-month reference baseline uses structured INV-YYYY-NNNN format exclusively.',
            'Urgency pattern deviates 3.4σ from established communication baseline.',
          ],
        },
      ],
      conclusion: 'High-confidence Business Email Compromise via supply chain injection. Attacker compromised supplier email and redirected payment to a Hong Kong shell entity. Wire is in pre-execution hold. Recommend immediate voice verification with Apex Global treasury department before any release.',
      proposedRule: 'IF dest_country NOT IN client_historic_jurisdictions (12-month window)\nAND beneficiary_routing_age_hrs < 24\nTHEN suspend wire → route to manual voice-verification queue',
      pyspark: `def detect_bec_anomaly(tx_df, history_df):
    joined = tx_df.join(history_df, "client_id", "left")
    return joined.filter(
        (F.col("beneficiary_age_hrs") < 24) &
        (~F.array_contains(
            F.col("historic_jurisdictions"),
            F.col("dest_country")
        ))
    )`,
      backtest: { recall: '100%', fpr: '0.02%', delayed: 3, protected: '$142M' },
      xai: {
        contributions: [
          { feature: 'Jurisdiction Deviation', agent: 'Treasury Profiler', value: 42, description: 'Destination country (HK) absent from 24-month jurisdiction history' },
          { feature: 'Beneficiary Age < 24h', agent: 'Treasury Profiler', value: 28, description: 'Routing credentials modified 14 minutes before wire submission' },
          { feature: 'Volume Spike (6.9σ)', agent: 'Treasury Profiler', value: 18, description: '$14.5M is 690% above the 90-day moving average of $2.1M' },
          { feature: 'Paste Event in Routing Field', agent: 'Behavioral Sentinel', value: 15, description: 'Clipboard paste detected specifically in the beneficiary routing field' },
          { feature: 'NLP Urgency Markers', agent: 'Payload Parser', value: 12, description: 'Payment reference contains capitalized urgency language (3.4σ deviation)' },
          { feature: 'Known Corporate IP Origin', agent: 'Behavioral Sentinel', value: -13, description: 'Session originated from registered Apex Global IP range — no ATO signal' },
          { feature: 'Historical Client Fidelity', agent: 'Treasury Profiler', value: -8, description: '2,401 clean transactions over 24 months with zero prior anomalies' },
        ],
        counterfactual: 'Without the jurisdictional deviation, model confidence drops from 98.4% → 31.2%. The combination of a new jurisdiction AND modified beneficiary credentials within 24 hours is the primary trigger.',
        timeline: [
          { time: '08:28 UTC', event: 'Beneficiary routing number modified in client portal by Admin_Apex_01', agent: 'Behavioral Sentinel' },
          { time: '08:28 UTC', event: 'Clipboard paste event recorded in routing field — no manual keystroke pattern', agent: 'Behavioral Sentinel' },
          { time: '08:42 UTC', event: 'MT103 wire instruction submitted for $14,500,000 to Global Steel Holdings HK', agent: 'Treasury Profiler' },
          { time: '08:42 UTC', event: 'Jurisdiction deviation flag: HK not in 24-month client history', agent: 'Treasury Profiler' },
          { time: '08:42 UTC', event: 'NLP scan of MT103 field 70: urgency markers detected (3.4σ)', agent: 'Payload Parser' },
          { time: '08:43 UTC', event: 'LightGBM ensemble model: confidence 98.4% → wire suspended pre-SWIFT', agent: 'Orchestrator' },
          { time: '09:14 UTC', event: 'Alert dispatched to Fraud Operations Team and Head of Fraud Risk', agent: 'Orchestrator' },
        ],
      },
    },
  },
  {
    id: 'CU-4419',
    time: '09:11',
    severity: 'high',
    title: 'MT542 Dormancy Wakeup',
    preview: '500k MSFT shares — 4yr dormant account, unregistered counterparty',
    product: 'custody',
    caseData: {
      summary: 'Sub-account CU-4419 (Meridian Capital Partners), dormant for 4 years, issued a Deliver Free MT542 instruction for 500,000 MSFT shares to Nexus Prime Securities (Cayman Islands) — an entity absent from the counterparty registry.',
      confidence: 91.2,
      exposure: '~$218M',
      flagCount: 1,
      stage: 'investigating',
      agentFindings: [
        {
          agentName: 'Entitlement Checker',
          findings: [
            'Sub-account CU-4419 has been in dormant state for 4 years, 3 months — zero settlement activity recorded.',
            'Account holds 500,000 MSFT shares (market value ~$218M at current pricing).',
            'MT542 Deliver Free instruction names Nexus Prime Securities (Cayman Islands) — entity not present in counterparty registry.',
          ],
        },
        {
          agentName: 'Maker-Checker Auditor',
          findings: [
            'MT542 submitted by Operator ID jsmith_ops from an IP traced to a residential VPN exit node (NordVPN, Amsterdam).',
            'Approving officer kwong_sr authorized the instruction from the same VPN subnet within 3 minutes — statistically improbable independent approval.',
            'MAC address fingerprinting confirms both operators accessed the system from the same physical device. This constitutes a Maker-Checker collusion flag under SR 11-7 controls.',
          ],
        },
      ],
      conclusion: 'High-confidence coordinated insider asset misappropriation attempt. Dormant account reactivation combined with an unregistered Cayman counterparty and Maker-Checker collusion from shared hardware indicates an organized insider threat. Instruction blocked. Recommend immediate suspension of jsmith_ops and kwong_sr pending investigation.',
      proposedRule: 'IF sub_account_dormancy_days > 365\nAND counterparty NOT IN approved_registry\nTHEN block MT542 → escalate to Senior Compliance Officer',
      pyspark: `def detect_dormancy_wakeup(mt542_df, registry_df, acct_df):
    enriched = mt542_df \\
        .join(acct_df, "sub_account_id", "left") \\
        .join(registry_df, "counterparty_id", "left")
    return enriched.filter(
        (F.col("dormancy_days") > 365) &
        (F.col("registry_status").isNull())
    )`,
      backtest: { recall: '96.5%', fpr: '0.08%', delayed: 1, protected: '$340M' },
      xai: {
        contributions: [
          { feature: 'Account Dormancy (4.3 yrs)', agent: 'Entitlement Checker', value: 38, description: 'Sub-account had zero settlement activity for 4 years and 3 months' },
          { feature: 'Unregistered Counterparty', agent: 'Entitlement Checker', value: 31, description: 'Nexus Prime Securities absent from the approved counterparty registry' },
          { feature: 'MAC Address Collision', agent: 'Maker-Checker Auditor', value: 22, description: 'Maker and Checker accessed system from identical physical device' },
          { feature: 'VPN Origin (Same Subnet)', agent: 'Maker-Checker Auditor', value: 18, description: 'Both operators connected via the same NordVPN Amsterdam exit node' },
          { feature: 'Approval Timing (< 3min)', agent: 'Maker-Checker Auditor', value: 14, description: 'Checker approved within 3 minutes — below SR 11-7 minimum review window' },
          { feature: 'Account Settlement History', agent: 'Entitlement Checker', value: -12, description: 'Prior to dormancy, account had clean settlement record with no exceptions' },
        ],
        counterfactual: 'Without the MAC address collision, model confidence drops to 58.1%. The Maker-Checker collusion from shared hardware is the single most compelling insider threat indicator.',
        timeline: [
          { time: '09:04 UTC', event: 'Sub-account CU-4419 reactivated — first activity in 4 years, 3 months', agent: 'Entitlement Checker' },
          { time: '09:07 UTC', event: 'MT542 Deliver Free instruction submitted by jsmith_ops (VPN: Amsterdam)', agent: 'Maker-Checker Auditor' },
          { time: '09:09 UTC', event: 'Instruction approved by kwong_sr from same VPN subnet (2min 18sec review)', agent: 'Maker-Checker Auditor' },
          { time: '09:10 UTC', event: 'MAC fingerprint collision detected — both sessions from same physical device', agent: 'Maker-Checker Auditor' },
          { time: '09:10 UTC', event: 'Nexus Prime Securities not found in approved counterparty registry', agent: 'Entitlement Checker' },
          { time: '09:11 UTC', event: 'Confidence 91.2% → MT542 instruction blocked pre-settlement', agent: 'Orchestrator' },
          { time: '09:11 UTC', event: 'Alert dispatched — jsmith_ops and kwong_sr accounts suspended', agent: 'Orchestrator' },
        ],
      },
    },
  },
  {
    id: 'PR-9102',
    time: '09:08',
    severity: 'high',
    title: 'Synthetic ID App Spike',
    preview: '45 retail apps from RIA Node #442 in 23 min — PII clustering detected',
    product: 'wealth',
    caseData: {
      summary: 'RIA Node #442 (Pinnacle Wealth Advisors, NJ) submitted 45 new retail account applications in a 23-minute window. Node baseline is 4.2 applications per day. PII clustering across applications indicates a coordinated synthetic identity ring.',
      confidence: 87.6,
      flagCount: 45,
      stage: 'detected',
      agentFindings: [
        {
          agentName: 'Velocity Tracker',
          findings: [
            'RIA Node #442 submitted 45 applications between 08:45–09:08 UTC — a 10x intra-hour velocity spike vs. daily baseline of 4.2.',
            '38 of 45 applications requested immediate ACH funding authorization upon approval.',
            'Spike represents a 99.97th percentile event for this RIA node.',
          ],
        },
        {
          agentName: 'Identity Validator',
          findings: [
            'LexisNexis cross-reference: 23 applications share sequential NJ-area phone numbers; 31 share the same ZIP with variant street addresses.',
            '17 applications flagged for SSN-DOB mismatches — a primary synthetic identity marker.',
            'Average LexisNexis fraud score across batch: 847/1000.',
          ],
        },
        {
          agentName: 'Behavioral Sentinel',
          findings: [
            'All 45 portal sessions originated from 3 IP addresses in a single subnet — consistent with a distributed bot framework.',
            'Mouse movement entropy indicates automated form filling: field transition times averaging <95ms vs. human baseline of 180ms.',
            'No CAPTCHA events recorded despite velocity thresholds — suggests a known bypass technique.',
          ],
        },
      ],
      conclusion: 'Coordinated synthetic identity farming operation targeting the Regulation Best Interest onboarding flow. Likely preparation for a 530A-style account origination scheme. All 45 applications queued for manual review. RIA Node #442 placed in restricted status pending investigation.',
      proposedRule: 'IF ria_node_apps_per_hour > (node_baseline * 5)\nAND pii_cluster_score > 0.7\nTHEN suspend batch → flag node for manual review',
      pyspark: `def detect_synthetic_id_spike(apps_df, baseline_df):
    enriched = apps_df.join(baseline_df, "ria_node_id", "left")
    return enriched.filter(
        (F.col("hourly_app_count") > F.col("daily_baseline") * 5) &
        (F.col("pii_cluster_score") > 0.7)
    )`,
      backtest: { recall: '93.1%', fpr: '0.15%', delayed: 7, protected: '$4.2M' },
      xai: {
        contributions: [
          { feature: 'App Velocity Spike (×10)', agent: 'Velocity Tracker', value: 36, description: '45 apps in 23 minutes vs. daily node baseline of 4.2' },
          { feature: 'PII Clustering Score (0.89)', agent: 'Identity Validator', value: 29, description: 'Shared phone numbers, ZIP codes, and SSN fragment patterns across batch' },
          { feature: 'Bot Behavioral Pattern', agent: 'Behavioral Sentinel', value: 24, description: 'Sub-95ms form transitions and 3-IP subnet origin indicate automated tooling' },
          { feature: 'SSN-DOB Mismatch (17 apps)', agent: 'Identity Validator', value: 15, description: '37.8% of applications show SSN-DOB mismatches — primary synthetic ID marker' },
          { feature: 'LexisNexis Score (847/1000)', agent: 'Identity Validator', value: 12, description: 'Average batch fraud score in 98th percentile of known SID rings' },
          { feature: 'RIA Node History', agent: 'Velocity Tracker', value: -9, description: 'Node #442 had clean submission history for 14 months prior to this event' },
        ],
        counterfactual: 'Without the PII clustering signal, confidence drops from 87.6% → 52.3%. The velocity spike alone is insufficient — it\'s the combination with shared PII fragments that confirms a coordinated ring.',
        timeline: [
          { time: '08:45 UTC', event: 'First batch of 8 applications received from RIA Node #442', agent: 'Velocity Tracker' },
          { time: '08:52 UTC', event: 'Velocity threshold exceeded — 22 apps in 7 minutes (node baseline: 4.2/day)', agent: 'Velocity Tracker' },
          { time: '08:55 UTC', event: 'PII clustering detected: shared phone numbers across 23 applications', agent: 'Identity Validator' },
          { time: '09:01 UTC', event: 'LexisNexis batch query: avg fraud score 847/1000 across all 38 apps analyzed', agent: 'Identity Validator' },
          { time: '09:06 UTC', event: 'Bot fingerprint confirmed: 3-IP subnet, <95ms field transitions, CAPTCHA bypass', agent: 'Behavioral Sentinel' },
          { time: '09:08 UTC', event: 'Confidence 87.6% → all 45 applications suspended, Node #442 restricted', agent: 'Orchestrator' },
          { time: '09:08 UTC', event: 'Alert dispatched to Fraud Operations and Compliance teams', agent: 'Orchestrator' },
        ],
      },
    },
  },
]
