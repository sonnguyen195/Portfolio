/**
 * React context for incident event animation state.
 * Provides phase and progress to scene components.
 */
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useIncidentEventAnimation } from './useIncidentEventAnimation'
import type { IncidentEventState } from './incidentEventController'

type IncidentAnimationContextValue = {
  state: IncidentEventState
  start: () => void
  stop: () => void
  reset: () => void
}

const IncidentAnimationContext = createContext<IncidentAnimationContextValue | null>(null)

export function IncidentAnimationProvider({
  children,
  onComplete,
  loop = false,
}: {
  children: ReactNode
  onComplete?: () => void
  loop?: boolean
}) {
  const { state, start, stop, reset } = useIncidentEventAnimation({
    onComplete,
    loop,
  })

  const value = useMemo(
    () => ({ state, start, stop, reset }),
    [state, start, stop, reset]
  )

  return (
    <IncidentAnimationContext.Provider value={value}>
      {children}
    </IncidentAnimationContext.Provider>
  )
}

export function useIncidentAnimation() {
  const ctx = useContext(IncidentAnimationContext)
  if (!ctx) {
    return {
      state: {
        phase: 'idle' as const,
        phaseIndex: 0,
        phaseProgress: 0,
        totalProgress: 0,
        isPlaying: false,
        isComplete: false,
      },
      start: () => {},
      stop: () => {},
      reset: () => {},
    }
  }
  return ctx
}
