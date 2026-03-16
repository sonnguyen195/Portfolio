import { useProgress, Html } from '@react-three/drei'

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  pointerEvents: 'none',
}

const barTrackStyle: React.CSSProperties = {
  width: 'min(200px, 40vw)',
  height: 2,
  background: 'rgba(255,255,255,0.08)',
  borderRadius: 1,
  overflow: 'hidden',
  marginTop: 12,
}

const barFillStyle = (progress: number): React.CSSProperties => ({
  height: '100%',
  width: `${progress}%`,
  background: 'rgba(0, 229, 255, 0.9)',
  borderRadius: 1,
  transition: 'width 0.15s ease-out',
})

const textStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono, ui-monospace, monospace)',
  fontSize: 11,
  letterSpacing: '0.15em',
  color: 'rgba(255,255,255,0.6)',
  textTransform: 'uppercase',
}

/**
 * Loading overlay for the lab scene. Must be used inside Canvas (e.g. as Suspense fallback).
 * Uses drei useProgress for loading percentage. Renders via Html for correct DOM placement.
 */
export function Loader() {
  const { progress, active } = useProgress()

  if (!active) return null

  return (
    <Html fullscreen center style={containerStyle}>
        <div aria-live="polite" aria-busy="true">
          <div style={textStyle}>{Math.round(progress)}%</div>
          <div style={barTrackStyle}>
            <div style={barFillStyle(progress)} />
          </div>
        </div>
    </Html>
  )
}
