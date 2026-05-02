import { useState, useRef, useEffect } from 'react'
import { Send, Wand2, Check, Settings } from 'lucide-react'
import clsx from 'clsx'

interface Message {
  role: 'assistant' | 'user'
  content: string
  code?: string
  fields?: { field: string; mapping: string }[]
  deployed?: boolean
}

const INITIAL: Message = {
  role: 'assistant',
  content: 'I am the Vigil Copilot. Describe the behavioral anomaly you want to monitor — in plain English — and I will map it to your data schema, generate a detection rule, and prepare it for deployment.',
}

const SUGGESTIONS = [
  { label: 'Rapid liquidation after credential reset',   prompt: 'Flag accounts that liquidate 80% of holdings within 3 days of a password reset' },
  { label: 'Wire to out-of-profile jurisdiction',        prompt: 'Flag wire transfers to countries outside the client\'s historical profile' },
  { label: 'Impossible travel login',                    prompt: 'Detect impossible travel — login from two distant IPs within 10 minutes' },
  { label: 'Dormant account wakeup',                     prompt: 'Alert on dormant accounts that suddenly wake up with large settlement instructions' },
]

function getResponse(input: string): Omit<Message, 'role'> {
  const low = input.toLowerCase()

  if (low.match(/liquidat|sell|withdraw|redemption/)) {
    return {
      content: 'Understood. You want to detect rapid asset liquidation following a credential change. Here is the XAI field mapping and generated rule.',
      fields: [
        { field: 'auth_logs.password_reset_dt', mapping: 'Triggers a 72-hour observation window' },
        { field: 'asset_holdings.total_aum', mapping: 'Establishes the baseline wealth metric' },
        { field: 'tx_ledger.liquidation_pct', mapping: 'Must exceed your threshold (e.g. 80%)' },
      ],
      code: `def detect_rapid_liquidation(trades_df, auth_df):
    enriched = trades_df.join(
        auth_df, "account_id", "left"
    )
    return enriched.filter(
        (F.col("liquidation_pct") > 0.80) &
        (F.col("password_reset_dt") >=
            F.date_sub(F.current_date(), 3))
    )`,
    }
  }

  if (low.match(/wire|transfer|swift|beneficiary|mt103/)) {
    return {
      content: 'Understood. You want to flag wire transfers routed to jurisdictions outside the client\'s historical profile. Here is the mapping and rule.',
      fields: [
        { field: 'client_history.jurisdictions_array', mapping: 'Client\'s approved destination countries (12-month window)' },
        { field: 'swift_messages.dest_country', mapping: 'Wire destination country from MT103 field 57' },
        { field: 'client_profile.wire_avg_usd', mapping: 'Baseline for volume anomaly scoring' },
      ],
      code: `def detect_jurisdiction_deviation(tx_df, hist_df):
    joined = tx_df.join(hist_df, "client_id", "left")
    return joined.filter(
        ~F.array_contains(
            F.col("jurisdictions_array"),
            F.col("dest_country")
        ) &
        (F.col("amount_usd") > F.col("wire_avg_usd") * 2)
    )`,
    }
  }

  if (low.match(/login|password|credential|auth|session|ip|travel/)) {
    return {
      content: 'Got it. You want to detect account takeover via impossible travel — a login from two geographically distant IPs within a short window. Here is the mapping.',
      fields: [
        { field: 'auth_logs.ip_address', mapping: 'Source IP resolved to geo-coordinates via MaxMind' },
        { field: 'auth_logs.login_ts', mapping: 'Timestamp of each login event' },
        { field: 'geo_distance_km', mapping: 'Computed haversine distance between consecutive logins' },
      ],
      code: `def detect_impossible_travel(auth_df):
    w = Window.partitionBy("user_id").orderBy("login_ts")
    enriched = auth_df.withColumn(
        "prev_ip", F.lag("ip_address").over(w)
    ).withColumn(
        "prev_ts", F.lag("login_ts").over(w)
    )
    return enriched.filter(
        (F.col("geo_distance_km") > 500) &
        (F.col("login_ts") - F.col("prev_ts") < 600)
    )`,
    }
  }

  if (low.match(/dormant|dormancy|inactive|wake/)) {
    return {
      content: 'Understood. You want to flag dormant accounts that suddenly reactivate with large settlement or withdrawal instructions. Here is the rule.',
      fields: [
        { field: 'accounts.last_activity_dt', mapping: 'Date of last recorded transaction' },
        { field: 'mt542.instruction_type', mapping: 'Settlement instruction type (Deliver Free vs. Receive Free)' },
        { field: 'counterparty_registry.status', mapping: 'Whether counterparty is in the approved registry' },
      ],
      code: `def detect_dormancy_wakeup(instr_df, acct_df, reg_df):
    enriched = instr_df \\
        .join(acct_df, "account_id", "left") \\
        .join(reg_df, "counterparty_id", "left")
    return enriched.filter(
        (F.datediff(F.current_date(),
            F.col("last_activity_dt")) > 365) &
        (F.col("registry_status").isNull())
    )`,
    }
  }

  return {
    content: 'Understood. I have mapped your request to the following data schema and generated a parametric detection rule. Review the field mappings and adjust thresholds as needed before deployment.',
    fields: [
      { field: 'events.timestamp', mapping: 'Primary temporal anchor for the observation window' },
      { field: 'entities.profile_score', mapping: 'Baseline risk score from the entity resolution engine' },
      { field: 'transactions.amount_usd', mapping: 'Normalized USD transaction value for comparison' },
    ],
    code: `def detect_custom_pattern(events_df, entities_df):
    joined = events_df.join(entities_df, "entity_id", "left")
    return joined.filter(
        (F.col("profile_score") > 0.75) &
        (F.col("amount_usd") > F.col("baseline_usd") * 3)
    )`,
  }
}

export function RuleBuilder({ onOpenSettings, isConfigured }: { onOpenSettings: () => void; isConfigured: boolean }) {
  const [messages, setMessages] = useState<Message[]>([INITIAL])
  const [input, setInput] = useState('')
  const [deployedIdx, setDeployedIdx] = useState<number[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = (override?: string) => {
    const val = (override ?? input).trim()
    if (!val) return
    const userMsg: Message = { role: 'user', content: val }
    const response: Message = { role: 'assistant', ...getResponse(val) }
    setMessages(prev => [...prev, userMsg, response])
    setInput('')
  }

  const deploy = (idx: number) => {
    setDeployedIdx(prev => [...prev, idx])
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Rule Builder</h1>
          <p className="text-sm text-slate-500">Describe anomalies in plain English — Vigil maps them to your schema and generates deployment-ready code.</p>
        </div>
        {isConfigured && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            AI Connected
          </span>
        )}
        {!isConfigured && (
          <button onClick={onOpenSettings} className="flex items-center gap-1.5 text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors">
            <Settings className="w-3.5 h-3.5" /> Configure AI for live responses
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={clsx('max-w-2xl', msg.role === 'user' ? 'max-w-sm' : 'w-full')}>
              {msg.role === 'user' ? (
                <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
                  {msg.content}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Wand2 className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Vigil Copilot</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{msg.content}</p>

                  {msg.fields && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">XAI Field Mapping</p>
                      <div className="space-y-2">
                        {msg.fields.map((f, j) => (
                          <div key={j} className="flex gap-3 text-sm">
                            <code className="text-blue-600 font-mono text-xs bg-blue-50 px-2 py-0.5 rounded shrink-0">{f.field}</code>
                            <span className="text-slate-500 text-xs leading-relaxed">{f.mapping}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.code && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Generated PySpark Rule</p>
                      <pre className="bg-slate-900 text-slate-300 text-xs font-mono rounded-lg p-4 overflow-x-auto leading-relaxed">{msg.code}</pre>
                    </div>
                  )}

                  {msg.code && (
                    <button
                      onClick={() => deploy(i)}
                      disabled={deployedIdx.includes(i)}
                      className={clsx(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                        deployedIdx.includes(i)
                          ? 'bg-emerald-500 text-white cursor-default'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      )}
                    >
                      {deployedIdx.includes(i)
                        ? <><Check className="w-3.5 h-3.5" /> Deployed — Pending Checker Approval</>
                        : <><Send className="w-3.5 h-3.5" /> Deploy Monitor to EWS Radar</>}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-white space-y-3">
        {messages.length === 1 && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Suggested detections</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s.label}
                  onClick={() => send(s.prompt)}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 hover:border-blue-300 transition-colors"
                >
                  <Wand2 className="w-3 h-3 shrink-0" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Describe the anomaly or fraud pattern you want to monitor…"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim()}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
