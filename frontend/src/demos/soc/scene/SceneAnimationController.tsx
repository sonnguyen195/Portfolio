/**
 * Starts the incident event animation when mounted.
 * Must be inside IncidentAnimationProvider.
 */
import { useEffect } from 'react'
import { useIncidentAnimation } from '../animations'

export function SceneAnimationController({ autoPlay }: { autoPlay?: boolean }) {
  const { start } = useIncidentAnimation()

  useEffect(() => {
    if (autoPlay) {
      const t = setTimeout(start, 500)
      return () => clearTimeout(t)
    }
  }, [autoPlay, start])

  return null
}
