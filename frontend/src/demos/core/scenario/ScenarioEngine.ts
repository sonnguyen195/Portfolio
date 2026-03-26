/**
 * Scenario Engine — orchestrates demo flows.
 * Event-driven: emits events for animations, camera, and custom handlers.
 */
import type { TimelineEvent } from './ScenarioTimeline'
import { ScenarioTimeline } from './ScenarioTimeline'
import { getScenario, type ScenarioId } from './ScenarioEvents'

export type ScenarioEventHandler = (event: TimelineEvent) => void

export type ScenarioEngineOptions = {
  onStep?: ScenarioEventHandler
  onComplete?: () => void
  onTick?: (elapsedSec: number, progress: number) => void
}

type ActiveScenario = {
  timeline: ScenarioTimeline
  handlers: Set<ScenarioEventHandler>
}

const activeScenarios = new Map<ScenarioId, ActiveScenario>()

/**
 * Run a scenario by ID.
 * Returns a cancel function.
 */
export function runScenario(
  id: ScenarioId,
  options: ScenarioEngineOptions = {}
): () => void {
  stopScenario(id)

  const scenario = getScenario(id)
  const handlers = new Set<ScenarioEventHandler>()

  const onStep = (event: TimelineEvent) => {
    options.onStep?.(event)
    handlers.forEach((h) => h(event))
  }

  const timeline = new ScenarioTimeline(scenario, {
    onStep,
    onComplete: options.onComplete,
    onTick: options.onTick,
  })

  activeScenarios.set(id, { timeline, handlers })
  timeline.start()

  return () => stopScenario(id)
}

/**
 * Stop a running scenario.
 */
export function stopScenario(id: ScenarioId): void {
  const active = activeScenarios.get(id)
  if (active) {
    active.timeline.stop()
    activeScenarios.delete(id)
  }
}

/**
 * Subscribe to scenario events (for the given scenario type).
 * Returns unsubscribe.
 */
export function subscribeToScenario(
  id: ScenarioId,
  handler: ScenarioEventHandler
): () => void {
  const active = activeScenarios.get(id)
  if (!active) return () => {}
  active.handlers.add(handler)
  return () => active.handlers.delete(handler)
}

/**
 * Check if a scenario is currently running.
 */
export function isScenarioRunning(id: ScenarioId): boolean {
  return activeScenarios.has(id)
}
