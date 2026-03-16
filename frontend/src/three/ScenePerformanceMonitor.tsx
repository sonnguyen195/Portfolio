import {
  memo,
  useRef,
  useLayoutEffect,
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useFrame, useThree } from '@react-three/fiber'

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true

export type PerfStats = { fps: number; drawCalls: number }

type PerfStatsContextValue = ((s: PerfStats) => void) | null
const PerfStatsContext = createContext<PerfStatsContextValue>(null)

export function useSetPerfStats(): PerfStatsContextValue {
  return useContext(PerfStatsContext)
}

/**
 * Hook for the overlay: returns [stats, providerValue]. Use providerValue in a provider wrapping Canvas; use stats for display.
 */
export function usePerfStatsState(): [PerfStats, PerfStatsContextValue] {
  const [stats, setStats] = useState<PerfStats>({ fps: 0, drawCalls: 0 })
  const setter = useCallback((s: PerfStats) => setStats(s), [])
  return [stats, setter]
}

export function PerfStatsProvider({
  children,
  value,
}: {
  children: ReactNode
  value: PerfStatsContextValue
}) {
  return (
    <PerfStatsContext.Provider value={value}>
      {children}
    </PerfStatsContext.Provider>
  )
}

/**
 * Tracks FPS and draw calls, pushes to context setter every 500ms in dev. Mount inside Canvas.
 */
function ScenePerformanceMonitorInner() {
  const setStats = useSetPerfStats()
  const { gl } = useThree()
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())

  useFrame(() => {
    frameCount.current += 1
  })

  useLayoutEffect(() => {
    if (!isDev || !setStats) return
    const interval = setInterval(() => {
      const now = performance.now()
      const elapsed = (now - lastTime.current) / 1000
      lastTime.current = now
      const fps = elapsed > 0 ? Math.round(frameCount.current / elapsed) : 0
      frameCount.current = 0
      const info = gl.info as { render?: { calls?: number } }
      setStats({ fps, drawCalls: info?.render?.calls ?? 0 })
    }, 500)
    return () => clearInterval(interval)
  }, [gl, setStats])

  return null
}

export const ScenePerformanceMonitor = memo(ScenePerformanceMonitorInner)
