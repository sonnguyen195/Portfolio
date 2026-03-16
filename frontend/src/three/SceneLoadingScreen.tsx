/**
 * HTML-only loading screen for initial 3D scene chunk load.
 * Used as Suspense fallback before Canvas mounts. For GLB loading progress,
 * the Loader (useProgress) is shown inside Canvas.
 */
export function SceneLoadingScreen() {
  return (
    <div
      className="sceneLoadingScreen"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        pointerEvents: 'none',
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div
        style={{
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          fontSize: 11,
          letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.6)',
          textTransform: 'uppercase',
        }}
      >
        Loading…
      </div>
      <div
        style={{
          width: 'min(200px, 40vw)',
          height: 2,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 1,
          overflow: 'hidden',
          marginTop: 12,
        }}
      >
        <div
          style={{
            height: '100%',
            width: '40%',
            background: 'rgba(0, 229, 255, 0.9)',
            borderRadius: 1,
            animation: 'sceneLoadingPulse 1.2s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  )
}
