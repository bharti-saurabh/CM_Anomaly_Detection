import type { TimeSeriesPoint } from '../types'

export const TIME_SERIES: TimeSeriesPoint[] = [
  // ── Quiet baseline: Apr 02–14 (scores 5–14, routine operations) ──────────────
  { date: 'Apr 02', volume: 91,  anomalyCount: 0, avgScore: 7  },
  { date: 'Apr 03', volume: 87,  anomalyCount: 0, avgScore: 6  },
  { date: 'Apr 04', volume: 104, anomalyCount: 0, avgScore: 8  },
  { date: 'Apr 05', volume: 96,  anomalyCount: 0, avgScore: 9  },
  { date: 'Apr 06', volume: 79,  anomalyCount: 0, avgScore: 5  },
  { date: 'Apr 07', volume: 88,  anomalyCount: 1, avgScore: 12 },
  { date: 'Apr 08', volume: 108, anomalyCount: 0, avgScore: 7  },
  { date: 'Apr 09', volume: 99,  anomalyCount: 0, avgScore: 8  },
  { date: 'Apr 10', volume: 103, anomalyCount: 1, avgScore: 11 },
  { date: 'Apr 11', volume: 86,  anomalyCount: 0, avgScore: 6  },
  { date: 'Apr 12', volume: 74,  anomalyCount: 0, avgScore: 5  },
  { date: 'Apr 13', volume: 82,  anomalyCount: 0, avgScore: 7  },
  { date: 'Apr 14', volume: 97,  anomalyCount: 1, avgScore: 14 },
  // ── First weak signals: Apr 15–20 (scores 12–22, isolated blips) ─────────────
  { date: 'Apr 15', volume: 111, anomalyCount: 1, avgScore: 17 },
  { date: 'Apr 16', volume: 106, anomalyCount: 2, avgScore: 21 },
  { date: 'Apr 17', volume: 114, anomalyCount: 1, avgScore: 16 },
  { date: 'Apr 18', volume: 101, anomalyCount: 1, avgScore: 14 },
  { date: 'Apr 19', volume: 89,  anomalyCount: 0, avgScore: 9  },
  { date: 'Apr 20', volume: 77,  anomalyCount: 0, avgScore: 8  },
  // ── Escalation pattern: Apr 21–27 (crossing warning threshold Apr 25) ────────
  { date: 'Apr 21', volume: 121, anomalyCount: 2, avgScore: 23 },
  { date: 'Apr 22', volume: 133, anomalyCount: 2, avgScore: 28 },
  { date: 'Apr 23', volume: 128, anomalyCount: 3, avgScore: 33 },
  { date: 'Apr 24', volume: 139, anomalyCount: 3, avgScore: 38 },
  { date: 'Apr 25', volume: 145, anomalyCount: 4, avgScore: 43 },
  { date: 'Apr 26', volume: 137, anomalyCount: 4, avgScore: 46 },
  { date: 'Apr 27', volume: 149, anomalyCount: 5, avgScore: 51 },
  // ── Sustained elevated: Apr 28–30 (approaching critical) ─────────────────────
  { date: 'Apr 28', volume: 156, anomalyCount: 6, avgScore: 58 },
  { date: 'Apr 29', volume: 161, anomalyCount: 7, avgScore: 64 },
  { date: 'Apr 30', volume: 158, anomalyCount: 8, avgScore: 69 },
  // ── Critical spike: May 01 — 3 cases flagged (TR-8842, CU-4419, PR-9102) ─────
  { date: 'May 01', volume: 171, anomalyCount: 13, avgScore: 89 },
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
