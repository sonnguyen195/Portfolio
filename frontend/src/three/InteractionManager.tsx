import { useEffect, memo } from 'react'
import { useLabScene } from './LabSceneContext'

/**
 * Listens for Escape and calls resetInteraction so camera and panels return to default.
 * Mount inside LabSceneProvider (e.g. in overlay). Central interaction state lives in LabSceneContext.
 */
function InteractionManagerInner() {
  const { resetInteraction } = useLabScene()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resetInteraction()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [resetInteraction])

  return null
}

export const InteractionManager = memo(InteractionManagerInner)
