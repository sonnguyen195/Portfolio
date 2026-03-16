import { memo, useEffect, useState } from 'react'
import { useLabScene } from './LabSceneContext'

/**
 * Sci-fi cursor: circle reticle with subtle rotation and cyan glow when hovering interactive objects.
 * Renders as fixed overlay; hide default cursor when cursorPointer is true.
 */
function InteractionCursorInner() {
  const { cursorPointer } = useLabScene()
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  if (!cursorPointer) return null

  return (
    <div
      className="interaction-cursor"
      aria-hidden
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: '2px solid rgba(0, 229, 255, 0.7)',
        boxShadow: '0 0 16px rgba(0, 229, 255, 0.4)',
        pointerEvents: 'none',
        zIndex: 9999,
        animation: 'interactionCursorPulse 1.2s ease-in-out infinite',
      }}
    />
  )
}

export const InteractionCursor = memo(InteractionCursorInner)
