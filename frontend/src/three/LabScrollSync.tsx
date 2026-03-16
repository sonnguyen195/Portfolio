import { useEffect } from 'react'
import { useLabScene } from './LabSceneContext'

const SCROLL_MAX_PX = 600

function clampProgress(y: number): number {
  return Math.max(0, Math.min(1, y / SCROLL_MAX_PX))
}

/**
 * Syncs window scroll to lab context for scroll-based camera motion.
 * Mount inside LabSceneProvider (e.g. in overlay or layout).
 */
export function LabScrollSync() {
  const { setScrollProgress } = useLabScene()

  useEffect(() => {
    const onScroll = () => {
      setScrollProgress(clampProgress(window.scrollY))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [setScrollProgress])

  return null
}
