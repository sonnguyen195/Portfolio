/**
 * Starts the drone flight animation when mounted.
 * Must be inside DroneFlightAnimationProvider.
 */
import { useEffect } from 'react'
import { useDroneFlightAnimation } from '../animations'

export function SceneAnimationController({ autoPlay }: { autoPlay?: boolean }) {
  const { start } = useDroneFlightAnimation()

  useEffect(() => {
    if (autoPlay) {
      const t = setTimeout(start, 600)
      return () => clearTimeout(t)
    }
  }, [autoPlay, start])

  return null
}
