/**
 * Event-driven drone flight animation controller.
 * Manages phase transitions and progress within each phase.
 */

import type { DroneFlightPhase } from './droneFlightSequence'
import {
  DRONE_FLIGHT_PHASES,
  getPhaseDuration,
  getNextPhase,
} from './droneFlightSequence'

export type DroneFlightState = {
  phase: DroneFlightPhase
  phaseIndex: number
  phaseProgress: number
  totalProgress: number
  isPlaying: boolean
  isComplete: boolean
}

export type DroneFlightCallback = (state: DroneFlightState) => void

export type DroneFlightControllerOptions = {
  onPhaseChange?: (phase: DroneFlightPhase, prev: DroneFlightPhase) => void
  onComplete?: () => void
  loop?: boolean
}

export class DroneFlightController {
  private phase: DroneFlightPhase = 'idle'
  private phaseIndex = 0
  private phaseProgress = 0
  private phaseElapsedMs = 0
  private totalElapsedMs = 0
  private lastTickTime = 0
  private isPlaying = false
  private listeners = new Set<DroneFlightCallback>()
  private options: DroneFlightControllerOptions = {}
  private rafId: number | null = null

  getState(): DroneFlightState {
    const totalDuration = DRONE_FLIGHT_PHASES.reduce(
      (sum, p) => sum + getPhaseDuration(p),
      0
    )
    return {
      phase: this.phase,
      phaseIndex: this.phaseIndex,
      phaseProgress: this.phaseProgress,
      totalProgress: totalDuration > 0 ? this.totalElapsedMs / totalDuration : 0,
      isPlaying: this.isPlaying,
      isComplete: this.phase === 'complete',
    }
  }

  subscribe(cb: DroneFlightCallback): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  private notify() {
    const state = this.getState()
    this.listeners.forEach((cb) => cb(state))
  }

  private advanceToPhase(next: DroneFlightPhase) {
    const prev = this.phase
    this.phase = next
    this.phaseIndex = DRONE_FLIGHT_PHASES.indexOf(next)
    this.phaseProgress = 0
    this.phaseElapsedMs = 0
    this.options.onPhaseChange?.(next, prev)
    this.notify()
  }

  private tick = (now: number) => {
    if (!this.isPlaying) {
      this.rafId = null
      return
    }
    const deltaMs = this.lastTickTime > 0 ? now - this.lastTickTime : 0
    this.lastTickTime = now

    const duration = getPhaseDuration(this.phase)
    this.phaseElapsedMs += deltaMs
    this.totalElapsedMs += deltaMs
    this.phaseProgress = duration > 0 ? Math.min(1, this.phaseElapsedMs / duration) : 1

    if (duration > 0 && this.phaseElapsedMs >= duration) {
      const next = getNextPhase(this.phase)
      if (next) {
        this.advanceToPhase(next)
        this.phaseElapsedMs = 0
        if (next === 'complete') {
          this.isPlaying = false
          this.options.onComplete?.()
          if (this.options.loop) {
            setTimeout(() => this.start(), 2000)
          }
        }
      }
    }
    this.notify()
    this.rafId = requestAnimationFrame(this.tick)
  }

  start() {
    this.phase = 'mission_created'
    this.phaseIndex = DRONE_FLIGHT_PHASES.indexOf('mission_created')
    this.phaseProgress = 0
    this.phaseElapsedMs = 0
    this.totalElapsedMs = 0
    this.lastTickTime = 0
    this.isPlaying = true
    this.options.onPhaseChange?.('mission_created', 'idle')
    this.notify()
    this.rafId = requestAnimationFrame(this.tick)
  }

  stop() {
    this.isPlaying = false
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.phase = 'idle'
    this.phaseIndex = 0
    this.phaseProgress = 0
    this.notify()
  }

  reset() {
    this.stop()
    this.phase = 'idle'
    this.phaseIndex = 0
    this.phaseProgress = 0
    this.phaseElapsedMs = 0
    this.totalElapsedMs = 0
    this.notify()
  }

  configure(options: Partial<DroneFlightControllerOptions>) {
    this.options = { ...this.options, ...options }
  }
}
