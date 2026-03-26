import type { CSSProperties } from 'react'

export type EarthStyleIndex = 0 | 1 | 2

interface Props {
  styleIndex: EarthStyleIndex
  onChange: (v: EarthStyleIndex) => void
}

const styles: Array<{ id: EarthStyleIndex; label: string; hex: string }> = [
  { id: 0, label: 'Mono Tech', hex: '#00d4ff' },
  { id: 1, label: 'Neon Cyber', hex: '#ff4db8' },
  { id: 2, label: 'Blueprint', hex: '#00ffe0' },
]

export default function EarthStyleToggle({ styleIndex, onChange }: Props) {
  const base: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    gap: 0,
    border: '1px solid rgba(0,180,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    background: 'rgba(3,8,18,0.75)',
    backdropFilter: 'blur(6px)',
  }

  return (
    <div style={base}>
      {styles.map(s => {
        const active = s.id === styleIndex
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            style={{
              padding: '6px 12px',
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              cursor: 'pointer',
              border: 'none',
              background: active ? `rgba(0,180,255,0.25)` : 'transparent',
              color: active ? s.hex : 'rgba(160,200,220,0.6)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
