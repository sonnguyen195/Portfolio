/**
 * React hook for incident event animation.
 * Subscribes to controller state and triggers re-renders.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  IncidentEventController,
  type IncidentEventState,
} from './incidentEventController'
import type { IncidentEventPhase } from './incidentEventSequence'

export type UseIncidentEventAnimationOptions = {
  onPhaseChange?: (phase: IncidentEventPhase, prev: IncidentEventPhase) => void
  onComplete?: () => void
  loop?: boolean
}

export function useIncidentEventAnimation(
  options: UseIncidentEventAnimationOptions = {}
) {
  const [state, setState] = useState<IncidentEventState>(() => ({
    phase: 'idle',
    phaseIndex: 0,
    phaseProgress: 0,
    totalProgress: 0,
    isPlaying: false,
    isComplete: false,
  }))
  const controllerRef = useRef<IncidentEventController | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const ctrl = new IncidentEventController()
    ctrl.configure({
      onPhaseChange: optionsRef.current.onPhaseChange,
      onComplete: optionsRef.current.onComplete,
      loop: optionsRef.current.loop,
    })
    controllerRef.current = ctrl

    const unsub = ctrl.subscribe((s) => setState({ ...s }))

    return () => {
      unsub()
      ctrl.stop()
      controllerRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    controllerRef.current?.start()
  }, [])

  const stop = useCallback(() => {
    controllerRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    controllerRef.current?.reset()
  }, [])

  return { state, start, stop, reset }
}
