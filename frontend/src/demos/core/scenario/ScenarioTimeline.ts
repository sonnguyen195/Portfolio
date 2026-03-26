/**
 * Scenario timeline — event-driven execution.
 * Fires steps at configured timestamps.
 */
import type { ScenarioDefinition, ScenarioStep } from './ScenarioEvents'

export type TimelineEvent = {
  step: ScenarioStep
  elapsedSec: number
  progress: number
}

export type TimelineEventHandler = (event: TimelineEvent) => void

export type TimelineOptions = {
  onStep?: TimelineEventHandler
  onComplete?: () => void
  onTick?: (elapsedSec: number, progress: number) => void
}

export class ScenarioTimeline {
  private scenario: ScenarioDefinition
  private startTime = 0
  private rafId: number | null = null
  private lastStepIndex = -1
  private options: TimelineOptions = {}
  private isRunning = false

  constructor(scenario: ScenarioDefinition, options: TimelineOptions = {}) {
    this.scenario = scenario
    this.options = options
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.startTime = performance.now() / 1000
    this.lastStepIndex = -1
    this.tick()
  }

  stop(): void {
    this.isRunning = false
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  getElapsedSec(): number {
    return this.isRunning ? performance.now() / 1000 - this.startTime : 0
  }

  getProgress(): number {
    const elapsed = this.getElapsedSec()
    return Math.min(1, elapsed / this.scenario.totalDurationSec)
  }

  getCurrentPhase(): string | null {
    const elapsed = this.getElapsedSec()
    for (let i = this.scenario.steps.length - 1; i >= 0; i--) {
      if (this.scenario.steps[i].time <= elapsed) {
        return this.scenario.steps[i].payload?.phase ?? null
      }
    }
    return null
  }

  private tick = (): void => {
    if (!this.isRunning) return
    const now = performance.now() / 1000
    const elapsedSec = now - this.startTime

    this.options.onTick?.(elapsedSec, this.getProgress())

    const steps = this.scenario.steps
    for (let i = this.lastStepIndex + 1; i < steps.length; i++) {
      if (steps[i].time <= elapsedSec) {
        this.lastStepIndex = i
        const step = steps[i]
        const event: TimelineEvent = {
          step,
          elapsedSec,
          progress: elapsedSec / this.scenario.totalDurationSec,
        }
        this.options.onStep?.(event)
      }
    }

    if (elapsedSec >= this.scenario.totalDurationSec) {
      this.stop()
      this.options.onComplete?.()
      return
    }

    this.rafId = requestAnimationFrame(this.tick)
  }
}
