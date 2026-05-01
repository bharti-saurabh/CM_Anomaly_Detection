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
      summary:
        'Apex Global Corp initiated a $14.5M MT103 wire to a first-occurrence Hong Kong counterparty. Beneficiary routing was modified 14 minutes before execution. Transaction value exceeds 90-day moving average by 690%.',
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
      conclusion:
        'High-confidence Business Email Compromise via supply chain injection. Attacker compromised supplier email and redirected payment to a Hong Kong shell entity. Wire is in pre-execution hold. Recommend immediate voice verification with Apex Global treasury department before any release.',
      proposedRule:
        'IF dest_country NOT IN client_historic_jurisdictions (12-month window)\nAND beneficiary_routing_age_hrs < 24\nTHEN suspend wire → route to manual voice-verification queue',
      pyspark: `def detect_bec_anomaly(tx_df, history_df):
    joined = tx_df.join(history_df, "client_id", "left")
    return joined.filter(
        (F.col("beneficiary_age_hrs") < 24) &
        (~F.array_contains(
            F.col("historic_jurisdictions"),
            F.col("dest_country")
        ))
    )`,
      backtest: {
        recall: '100%',
        fpr: '0.02%',
        delayed: 3,
        protected: '$142M',
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
      summary:
        'Sub-account CU-4419 (Meridian Capital Partners), dormant for 4 years, issued a Deliver Free MT542 instruction for 500,000 MSFT shares to Nexus Prime Securities (Cayman Islands) — an entity absent from the counterparty registry.',
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
      conclusion:
        'High-confidence coordinated insider asset misappropriation attempt. Dormant account reactivation combined with an unregistered Cayman counterparty and Maker-Checker collusion from shared hardware indicates an organized insider threat. Instruction blocked. Recommend immediate suspension of jsmith_ops and kwong_sr pending investigation.',
      proposedRule:
        'IF sub_account_dormancy_days > 365\nAND counterparty NOT IN approved_registry\nTHEN block MT542 → escalate to Senior Compliance Officer',
      pyspark: `def detect_dormancy_wakeup(mt542_df, registry_df, acct_df):
    enriched = mt542_df \\
        .join(acct_df, "sub_account_id", "left") \\
        .join(registry_df, "counterparty_id", "left")
    return enriched.filter(
        (F.col("dormancy_days") > 365) &
        (F.col("registry_status").isNull())
    )`,
      backtest: {
        recall: '96.5%',
        fpr: '0.08%',
        delayed: 1,
        protected: '$340M',
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
      summary:
        'RIA Node #442 (Pinnacle Wealth Advisors, NJ) submitted 45 new retail account applications in a 23-minute window. Node baseline is 4.2 applications per day. PII clustering across applications indicates a coordinated synthetic identity ring.',
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
      conclusion:
        'Coordinated synthetic identity farming operation targeting the Regulation Best Interest onboarding flow. Likely preparation for a 530A-style account origination scheme. All 45 applications queued for manual review. RIA Node #442 placed in restricted status pending investigation.',
      proposedRule:
        'IF ria_node_apps_per_hour > (node_baseline * 5)\nAND pii_cluster_score > 0.7\nTHEN suspend batch → flag node for manual review',
      pyspark: `def detect_synthetic_id_spike(apps_df, baseline_df):
    enriched = apps_df.join(baseline_df, "ria_node_id", "left")
    return enriched.filter(
        (F.col("hourly_app_count") > F.col("daily_baseline") * 5) &
        (F.col("pii_cluster_score") > 0.7)
    )`,
      backtest: {
        recall: '93.1%',
        fpr: '0.15%',
        delayed: 7,
        protected: '$4.2M',
      },
    },
  },
]
