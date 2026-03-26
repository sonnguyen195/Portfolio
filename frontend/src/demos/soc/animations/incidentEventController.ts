/**
 * Event-driven incident animation controller.
 * Manages phase transitions and progress within each phase.
 */

import type { IncidentEventPhase } from './incidentEventSequence'
import {
  INCIDENT_EVENT_PHASES,
  getPhaseDuration,
  getNextPhase,
} from './incidentEventSequence'

export type IncidentEventState = {
  phase: IncidentEventPhase
  phaseIndex: number
  phaseProgress: number
  totalProgress: number
  isPlaying: boolean
  isComplete: boolean
}

export type IncidentEventCallback = (state: IncidentEventState) => void

export type IncidentEventControllerOptions = {
  onPhaseChange?: (phase: IncidentEventPhase, prev: IncidentEventPhase) => void
  onComplete?: () => void
  loop?: boolean
}

export class IncidentEventController {
  private phase: IncidentEventPhase = 'idle'
  private phaseIndex = 0
  private phaseProgress = 0
  private phaseElapsedMs = 0
  private totalElapsedMs = 0
  private lastTickTime = 0
  private isPlaying = false
  private listeners = new Set<IncidentEventCallback>()
  private options: IncidentEventControllerOptions = {}
  private rafId: number | null = null

  getState(): IncidentEventState {
    const totalDuration = INCIDENT_EVENT_PHASES.reduce(
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

  subscribe(cb: IncidentEventCallback): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  private notify() {
    const state = this.getState()
    this.listeners.forEach((cb) => cb(state))
  }

  private advanceToPhase(next: IncidentEventPhase) {
    const prev = this.phase
    this.phase = next
    this.phaseIndex = INCIDENT_EVENT_PHASES.indexOf(next)
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
            setTimeout(() => this.start(), 1500)
          }
        }
      }
    }
    this.notify()
    this.rafId = requestAnimationFrame(this.tick)
  }

  start() {
    this.phase = 'threat_detected'
    this.phaseIndex = INCIDENT_EVENT_PHASES.indexOf('threat_detected')
    this.phaseProgress = 0
    this.phaseElapsedMs = 0
    this.totalElapsedMs = 0
    this.lastTickTime = 0
    this.isPlaying = true
    this.options.onPhaseChange?.('threat_detected', 'idle')
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

  configure(options: Partial<IncidentEventControllerOptions>) {
    this.options = { ...this.options, ...options }
  }
}
