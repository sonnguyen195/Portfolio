/**
 * React context for drone flight animation state.
 * Provides phase and progress to scene components.
 */
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useDroneFlightAnimation as useDroneFlightAnimationHook } from './useDroneFlightAnimation'
import type { DroneFlightState } from './droneFlightController'

type DroneFlightAnimationContextValue = {
  state: DroneFlightState
  start: () => void
  stop: () => void
  reset: () => void
}

const DroneFlightAnimationContext = createContext<DroneFlightAnimationContextValue | null>(null)

export function DroneFlightAnimationProvider({
  children,
  onComplete,
  loop = false,
}: {
  children: ReactNode
  onComplete?: () => void
  loop?: boolean
}) {
  const { state, start, stop, reset } = useDroneFlightAnimationHook({
    onComplete,
    loop,
  })

  const value = useMemo(
    () => ({ state, start, stop, reset }),
    [state, start, stop, reset]
  )

  return (
    <DroneFlightAnimationContext.Provider value={value}>
      {children}
    </DroneFlightAnimationContext.Provider>
  )
}

export function useDroneFlightAnimation() {
  const ctx = useContext(DroneFlightAnimationContext)
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
