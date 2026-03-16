import { memo } from 'react'
import { useLabScene } from './LabSceneContext'

/**
 * Hologram label overlay when hovering an interactive object.
 * Emissive/glow is handled in InteractiveScreens; this renders the label UI.
 */
function ObjectHighlightInner() {
  const { hoveredObjectLabel, cursorPointer } = useLabScene()

  if (!cursorPointer || !hoveredObjectLabel) return null

  return (
    <div
      className="object-highlight-label"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '24%',
        transform: 'translateX(-50%)',
        padding: '6px 14px',
        background: 'rgba(0, 229, 255, 0.12)',
        border: '1px solid rgba(0, 229, 255, 0.4)',
        borderRadius: 6,
        color: '#a0e8f0',
        fontSize: 13,
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 500,
        boxShadow: '0 0 20px rgba(0, 229, 255, 0.2)',
        pointerEvents: 'none',
        zIndex: 15,
        transition: 'opacity 0.2s ease',
      }}
    >
      {hoveredObjectLabel}
    </div>
  )
}

export const ObjectHighlight = memo(ObjectHighlightInner)
