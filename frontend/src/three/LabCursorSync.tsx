import { useEffect } from 'react'
import { useLabScene } from './LabSceneContext'

/**
 * Syncs lab cursor state to document.body (pointer when hovering a screen).
 * Mount inside LabSceneProvider (e.g. in overlay).
 */
export function LabCursorSync() {
  const { cursorPointer } = useLabScene()

  useEffect(() => {
    document.body.style.cursor = cursorPointer ? 'none' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [cursorPointer])

  return null
}
