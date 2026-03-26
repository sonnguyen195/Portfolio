/**
 * React hook for scenario integration.
 * Demos can use this to run scenarios and react to phase changes.
 */
import { useCallback, useEffect, useState } from 'react'
import { runScenario, stopScenario } from './ScenarioEngine'
import type { ScenarioId } from './ScenarioEvents'
import type { TimelineEvent } from './ScenarioTimeline'

export type UseScenarioResult = {
  phase: string | null
  progress: number
  elapsedSec: number
  run: () => () => void
  stop: () => void
}

export function useScenario(id: ScenarioId): UseScenarioResult {
  const [phase, setPhase] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)

  const run = useCallback(() => {
    return runScenario(id, {
      onStep: (e: TimelineEvent) => {
        setPhase(e.step.payload?.phase ?? e.step.id)
      },
      onTick: (elapsed, prog) => {
        setElapsedSec(elapsed)
        setProgress(prog)
      },
      onComplete: () => {
        setProgress(1)
      },
    })
  }, [id])

  const stop = useCallback(() => {
    stopScenario(id)
    setPhase(null)
    setProgress(0)
    setElapsedSec(0)
  }, [id])

  useEffect(() => {
    return () => stopScenario(id)
  }, [id])

  return { phase, progress, elapsedSec, run, stop }
}
