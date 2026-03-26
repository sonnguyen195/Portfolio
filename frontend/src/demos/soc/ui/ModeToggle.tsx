import type { ViewMode } from '../engine/cameraController'

interface Props {
  mode:     ViewMode
  onChange: (m: ViewMode) => void
}

export default function ModeToggle({ mode, onChange }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      gap: 0,
      border: '1px solid rgba(0,180,255,0.3)',
      borderRadius: 4,
      overflow: 'hidden',
      background: 'rgba(3,8,18,0.75)',
      backdropFilter: 'blur(6px)',
    }}>
      {(['globe', 'flat'] as ViewMode[]).map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            padding: '6px 16px',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: 'monospace',
            cursor: 'pointer',
            border: 'none',
            background: mode === m ? 'rgba(0,180,255,0.25)' : 'transparent',
            color: mode === m ? '#00d4ff' : 'rgba(160,200,220,0.6)',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {m === 'globe' ? '3D Globe' : '2D Map'}
        </button>
      ))}
    </div>
  )
}
