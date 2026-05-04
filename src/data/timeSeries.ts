import type { TimeSeriesPoint } from '../types'

// critical + high + medium = anomalyCount on days with triggers
// May 01 total: 4 + 6 + 4 = 14 → matches Active Triggers KPI
export const TIME_SERIES: TimeSeriesPoint[] = [
  // ── Quiet baseline: Apr 02–06 ────────────────────────────────────────────────
  { date: 'Apr 02', volume: 91,  anomalyCount: 1, avgScore: 7,  critical: 0, high: 0, medium: 1 },
  { date: 'Apr 03', volume: 87,  anomalyCount: 0, avgScore: 6,  critical: 0, high: 0, medium: 0 },
  { date: 'Apr 04', volume: 104, anomalyCount: 0, avgScore: 8,  critical: 0, high: 0, medium: 0 },
  { date: 'Apr 05', volume: 96,  anomalyCount: 0, avgScore: 9,  critical: 0, high: 0, medium: 0 },
  { date: 'Apr 06', volume: 79,  anomalyCount: 0, avgScore: 5,  critical: 0, high: 0, medium: 0 },
  // ── Apr 07: BEC-0008 — domain spoofing (Nexus Institutional $3.8M) ───────────
  { date: 'Apr 07', volume: 88,  anomalyCount: 3, avgScore: 12, critical: 0, high: 2, medium: 1 },
  { date: 'Apr 08', volume: 108, anomalyCount: 0, avgScore: 7,  critical: 0, high: 0, medium: 0 },
  { date: 'Apr 09', volume: 99,  anomalyCount: 0, avgScore: 8,  critical: 0, high: 0, medium: 0 },
  // ── Apr 10: BEC-0012 — real estate wire pattern ──────────────────────────────
  { date: 'Apr 10', volume: 103, anomalyCount: 1, avgScore: 11, critical: 0, high: 0, medium: 1 },
  { date: 'Apr 11', volume: 86,  anomalyCount: 0, avgScore: 6,  critical: 0, high: 0, medium: 0 },
  { date: 'Apr 12', volume: 74,  anomalyCount: 0, avgScore: 5,  critical: 0, high: 0, medium: 0 },
  { date: 'Apr 13', volume: 82,  anomalyCount: 0, avgScore: 7,  critical: 0, high: 0, medium: 0 },
  // ── Apr 14: BEC-0016 — vendor account change ─────────────────────────────────
  { date: 'Apr 14', volume: 97,  anomalyCount: 1, avgScore: 14, critical: 0, high: 0, medium: 1 },
  { date: 'Apr 15', volume: 111, anomalyCount: 1, avgScore: 17, critical: 0, high: 1, medium: 0 },
  { date: 'Apr 16', volume: 106, anomalyCount: 2, avgScore: 21, critical: 0, high: 1, medium: 1 },
  // ── Apr 17: BEC-0019 CRITICAL — Cayman Islands FinCEN match ($8.7M) ──────────
  { date: 'Apr 17', volume: 114, anomalyCount: 5, avgScore: 38, critical: 1, high: 2, medium: 2 },
  { date: 'Apr 18', volume: 101, anomalyCount: 1, avgScore: 14, critical: 0, high: 1, medium: 0 },
  { date: 'Apr 19', volume: 89,  anomalyCount: 0, avgScore: 9,  critical: 0, high: 0, medium: 0 },
  // ── Apr 20: BEC-0024 — payroll redirect ─────────────────────────────────────
  { date: 'Apr 20', volume: 77,  anomalyCount: 1, avgScore: 8,  critical: 0, high: 0, medium: 1 },
  // ── Escalation: Apr 21–30 ────────────────────────────────────────────────────
  { date: 'Apr 21', volume: 121, anomalyCount: 2, avgScore: 23, critical: 0, high: 1, medium: 1 },
  { date: 'Apr 22', volume: 133, anomalyCount: 2, avgScore: 28, critical: 0, high: 1, medium: 1 },
  // ── Apr 23: BEC-0027 HIGH — legal settlement impersonation ($5.1M) ───────────
  { date: 'Apr 23', volume: 128, anomalyCount: 4, avgScore: 33, critical: 1, high: 2, medium: 1 },
  { date: 'Apr 24', volume: 139, anomalyCount: 3, avgScore: 38, critical: 0, high: 2, medium: 1 },
  { date: 'Apr 25', volume: 145, anomalyCount: 4, avgScore: 43, critical: 1, high: 2, medium: 1 },
  // ── Apr 26: BEC-0031 HIGH — vendor account change (Thornfield) ───────────────
  { date: 'Apr 26', volume: 137, anomalyCount: 5, avgScore: 46, critical: 1, high: 2, medium: 2 },
  { date: 'Apr 27', volume: 149, anomalyCount: 6, avgScore: 51, critical: 1, high: 3, medium: 2 },
  { date: 'Apr 28', volume: 156, anomalyCount: 6, avgScore: 58, critical: 1, high: 3, medium: 2 },
  // ── Apr 29: BEC-0038 HIGH — M&A domain spoofing (Meridian $2.3M) ─────────────
  { date: 'Apr 29', volume: 161, anomalyCount: 7, avgScore: 64, critical: 2, high: 3, medium: 2 },
  { date: 'Apr 30', volume: 158, anomalyCount: 8, avgScore: 69, critical: 2, high: 4, medium: 2 },
  // ── May 01 TODAY: critical surge — TR-8842 + CU-4419 + PR-9102 ───────────────
  // 4 critical + 6 high + 4 medium = 14 → matches Active Triggers KPI
  { date: 'May 01', volume: 171, anomalyCount: 14, avgScore: 89, critical: 4, high: 6, medium: 4 },
]

export const HOURLY_TODAY: TimeSeriesPoint[] = [
  { date: '00:00', volume: 4,  anomalyCount: 0, avgScore: 6  },
  { date: '01:00', volume: 2,  anomalyCount: 0, avgScore: 4  },
  { date: '02:00', volume: 3,  anomalyCount: 0, avgScore: 5  },
  { date: '03:00', volume: 1,  anomalyCount: 0, avgScore: 3  },
  { date: '04:00', volume: 5,  anomalyCount: 0, avgScore: 7  },
  { date: '05:00', volume: 8,  anomalyCount: 0, avgScore: 8  },
  { date: '06:00', volume: 12, anomalyCount: 0, avgScore: 9  },
  { date: '07:00', volume: 18, anomalyCount: 1, avgScore: 22 },
  { date: '08:00', volume: 24, anomalyCount: 2, avgScore: 41 },
  { date: '09:00', volume: 31, anomalyCount: 5, avgScore: 88 },
  { date: '10:00', volume: 22, anomalyCount: 1, avgScore: 24 },
  { date: '11:00', volume: 19, anomalyCount: 0, avgScore: 11 },
  { date: '12:00', volume: 21, anomalyCount: 0, avgScore: 9  },
]
