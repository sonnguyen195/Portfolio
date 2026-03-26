/**
 * React hook for drone flight animation.
 * Subscribes to controller state and triggers re-renders.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DroneFlightController,
  type DroneFlightState,
} from './droneFlightController'
import type { DroneFlightPhase } from './droneFlightSequence'

export type UseDroneFlightAnimationOptions = {
  onPhaseChange?: (phase: DroneFlightPhase, prev: DroneFlightPhase) => void
  onComplete?: () => void
  loop?: boolean
}

export function useDroneFlightAnimation(
  options: UseDroneFlightAnimationOptions = {}
) {
  const [state, setState] = useState<DroneFlightState>(() => ({
    phase: 'idle',
    phaseIndex: 0,
    phaseProgress: 0,
    totalProgress: 0,
    isPlaying: false,
    isComplete: false,
  }))
  const controllerRef = useRef<DroneFlightController | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const ctrl = new DroneFlightController()
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
