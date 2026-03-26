import type { AttackType } from '../simulation/attackTypes'
import { EVENT_META, EVENT_ORDER } from '../simulation/attackTypes'

interface Props {
  eventStats:   Record<AttackType, number>   // seed + cumulative — for traffic scale
  sessionStats: Record<AttackType, number>   // live only (starts 0) — for bars / ratios
  rightOffset?: number                        // kept for API compat, unused
}

function sumStats(stats: Record<AttackType, number>): number {
  return EVENT_ORDER.reduce((acc, t) => acc + stats[t], 0)
}

function fmt1M(v: number): string {
  return `${(v / 1_000_000).toFixed(1)}M`
}

const MONO: React.CSSProperties = { fontFamily: '"Courier New", Courier, monospace' }

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.14em',
  color: 'rgba(0,200,255,0.7)',
  fontWeight: 800,
  marginBottom: 7,
  ...MONO,
}

const DIVIDER: React.CSSProperties = {
  marginTop: 8,
  borderTop: '1px solid rgba(0,180,255,0.14)',
  marginBottom: 8,
}

const PANEL: React.CSSProperties = {
  width: 230,
  padding: '10px 12px',
  borderRadius: 6,
  border: '1px solid rgba(0,180,255,0.22)',
  background: 'rgba(3,8,18,0.62)',
  backdropFilter: 'blur(6px)',
  color: 'rgba(210,240,255,0.95)',
  ...MONO,
}

export default function SocThreatSidePanels({ eventStats, sessionStats }: Props) {
  // ── Ratios / bars use sessionStats (live, starts 0) ───────────────────────
  const sTotal       = Math.max(1, sumStats(sessionStats))
  const sCriticalRaw = sessionStats.vul + sessionStats.ids
  const sBlockedRaw  = sessionStats.ods + sessionStats.rmw
  const sActiveRaw   = Math.max(0, sTotal - sCriticalRaw - sBlockedRaw)

  const scoreTotal = 300
  const critical = Math.round((sCriticalRaw / sTotal) * scoreTotal)
  const active   = Math.round((sActiveRaw   / sTotal) * scoreTotal)
  const blocked  = Math.max(0, scoreTotal - critical - active)

  const tcpRaw   = sessionStats.oas + sessionStats.ids + sessionStats.wav
  const udpRaw   = sessionStats.ods + sessionStats.rmw
  const httpRaw  = sessionStats.oas + sessionStats.ods
  const httpsRaw = sessionStats.kas + sessionStats.ids
  const protoMax = Math.max(1, tcpRaw, udpRaw, httpRaw, httpsRaw)

  const severityIndex = Math.max(0, Math.min(10, (sCriticalRaw / sTotal) * 10 + 0.8))
  const score   = Math.round((sActiveRaw / sTotal) * 1000)
  const trendUp = severityIndex > 5

  // ── Traffic numbers use eventStats (seed + cumulative — shows real scale) ─
  const eTotal       = Math.max(1, sumStats(eventStats))
  const eCriticalRaw = eventStats.vul + eventStats.ids
  const eActiveRaw   = Math.max(0, eTotal - eCriticalRaw - (eventStats.ods + eventStats.rmw))
  const inboundRaw   = eActiveRaw * 0.66 + eCriticalRaw * 0.34
  const inbound      = fmt1M(inboundRaw)
  const outbound     = fmt1M(Math.max(0, eTotal - inboundRaw))

  return (
    /* Both panels stacked on the LEFT — avoids overlap with CommandConsole on the right */
    <div style={{
      position: 'absolute',
      left: 16,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      zIndex: 8,
      pointerEvents: 'none',
    }}>

      {/* ── Threat Overview ── */}
      <div style={PANEL}>
        <div style={SECTION_TITLE}>THREAT OVERVIEW</div>

        {[
          { label: 'ACTIVE',   val: active,   color: '#00ff66' },
          { label: 'BLOCKED',  val: blocked,  color: '#ffcc33' },
          { label: 'CRITICAL', val: critical, color: '#ff3333' },
        ].map((r, i) => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: i === 0 ? 0 : 5 }}>
            <div style={{ color: r.color, fontWeight: 800, fontSize: 10, opacity: 0.9 }}>{r.label}</div>
            <div style={{ color: r.color, fontWeight: 900, fontSize: 15 }}>{r.val}</div>
          </div>
        ))}

        <div style={DIVIDER} />
        <div style={SECTION_TITLE}>ATTACK TYPES</div>

        {EVENT_ORDER.map(t => {
          const max = Math.max(1, ...EVENT_ORDER.map(tt => sessionStats[tt]))
          const pct = Math.round(Math.max(0, Math.min(1, sessionStats[t] / max)) * 100)
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{ width: 30, fontSize: 9, color: 'rgba(170,210,230,0.85)', textTransform: 'uppercase' }}>
                {EVENT_META[t].label}
              </div>
              <div style={{ height: 3, flex: 1, background: 'rgba(0,180,255,0.10)', border: '1px solid rgba(0,180,255,0.18)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${EVENT_META[t].hex}, rgba(0,180,255,0.2))`, boxShadow: `0 0 10px ${EVENT_META[t].hex}55` }} />
              </div>
            </div>
          )
        })}

        <div style={DIVIDER} />
        <div style={SECTION_TITLE}>TRAFFIC / SEC</div>

        <div style={{ color: 'rgba(0,220,255,0.8)', fontWeight: 800, fontSize: 9 }}>INBOUND</div>
        <div style={{ color: '#00d4ff', fontWeight: 900, fontSize: 11, marginBottom: 5 }}>{inbound}</div>
        <div style={{ color: 'rgba(170,220,180,0.85)', fontWeight: 800, fontSize: 9 }}>OUTBOUND</div>
        <div style={{ color: '#00ff88', fontWeight: 900, fontSize: 11 }}>{outbound}</div>
      </div>

      {/* ── Protocol Split ── */}
      <div style={PANEL}>
        <div style={SECTION_TITLE}>PROTOCOL SPLIT</div>

        {([
          { id: 'TCP',   hex: '#00ff88', v: tcpRaw   },
          { id: 'UDP',   hex: '#ffcc33', v: udpRaw   },
          { id: 'HTTP',  hex: '#55ddff', v: httpRaw  },
          { id: 'HTTPS', hex: '#ff44aa', v: httpsRaw },
        ] as const).map(p => {
          const pct = Math.round(Math.max(0, Math.min(1, p.v / protoMax)) * 100)
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 38, fontSize: 9, color: 'rgba(170,210,230,0.85)' }}>{p.id}</div>
              <div style={{ height: 3, flex: 1, background: 'rgba(0,180,255,0.10)', border: '1px solid rgba(0,180,255,0.18)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${p.hex}, rgba(0,180,255,0.2))`, boxShadow: `0 0 10px ${p.hex}55` }} />
              </div>
            </div>
          )
        })}

        <div style={DIVIDER} />
        <div style={SECTION_TITLE}>SEVERITY INDEX</div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: trendUp ? '#ff3333' : '#ffcc33' }}>
            {severityIndex.toFixed(1)}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.12em', color: 'rgba(0,200,255,0.7)', fontWeight: 800 }}>SCORE</div>
            <div style={{ color: '#00ff88', fontWeight: 900, fontSize: 15 }}>{score}</div>
            <div style={{ marginTop: 4, color: trendUp ? '#ff44aa' : '#55ddff', fontWeight: 900, fontSize: 9 }}>
              TREND {trendUp ? 'UP' : 'DOWN'}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
