/**
 * Timeline-based animation controller.
 * Integrates with Scenario Engine to orchestrate step-by-step animations.
 */
import { runScenario, stopScenario, type ScenarioId } from '../scenario'
import type { TimelineEvent } from '../scenario/ScenarioTimeline'
import {
  getTimelineTriggers,
  type TimelineAnimationEvent,
  type TimelineAnimationHandler,
  type TimelineAnimationTrigger,
} from './TimelineEvents'

type TriggerHandlerMap = Map<string, Set<TimelineAnimationHandler>>
type ScenarioHandlerMap = Map<ScenarioId, TriggerHandlerMap>

const handlers: ScenarioHandlerMap = new Map()
let activeScenarioId: ScenarioId | null = null
let cancelScenario: (() => void) | null = null

function getHandlersForScenario(id: ScenarioId): TriggerHandlerMap {
  let map = handlers.get(id)
  if (!map) {
    map = new Map()
    handlers.set(id, map)
  }
  return map
}

function dispatchTrigger(
  scenarioId: ScenarioId,
  trigger: TimelineAnimationTrigger,
  elapsedSec: number,
  progress: number
): void {
  const event: TimelineAnimationEvent = {
    trigger,
    elapsedSec,
    progress,
    scenarioId,
  }
  const scenarioHandlers = handlers.get(scenarioId)
  if (!scenarioHandlers) return

  const byTrigger = scenarioHandlers.get(trigger.id)
  if (byTrigger) byTrigger.forEach((h) => h(event))

  const byType = scenarioHandlers.get(`type:${trigger.type}`)
  if (byType) byType.forEach((h) => h(event))

  const byTarget = trigger.target ? scenarioHandlers.get(`target:${trigger.target}`) : null
  if (byTarget) byTarget.forEach((h) => h(event))

  const wildcard = scenarioHandlers.get('*')
  if (wildcard) wildcard.forEach((h) => h(event))
}

function addHandler(
  scenarioId: ScenarioId,
  key: string,
  handler: TimelineAnimationHandler
): () => void {
  const map = getHandlersForScenario(scenarioId)
  let set = map.get(key)
  if (!set) {
    set = new Set()
    map.set(key, set)
  }
  set.add(handler)
  return () => set!.delete(handler)
}

export type RunTimelineOptions = {
  onTick?: (elapsedSec: number, progress: number) => void
  onComplete?: () => void
}

/**
 * Run a timeline by scenario ID.
 * Schedules animation triggers at configured timestamps.
 */
export function runTimeline(id: ScenarioId, options: RunTimelineOptions = {}): () => void {
  stopTimeline()

  const triggers = getTimelineTriggers(id)
  const triggerByTime = new Map<number, TimelineAnimationTrigger>()
  triggers.forEach((t) => triggerByTime.set(t.time, t))

  cancelScenario = runScenario(id, {
    onStep: (e: TimelineEvent) => {
      const trigger = triggerByTime.get(e.step.time)
      if (trigger) {
        dispatchTrigger(id, trigger, e.elapsedSec, e.progress)
      }
    },
    onTick: options.onTick,
    onComplete: () => {
      activeScenarioId = null
      cancelScenario = null
      options.onComplete?.()
    },
  })

  activeScenarioId = id
  return stopTimeline
}

/**
 * Stop the active timeline.
 */
export function stopTimeline(): void {
  if (cancelScenario) {
    cancelScenario()
    cancelScenario = null
  }
  if (activeScenarioId) {
    stopScenario(activeScenarioId)
    activeScenarioId = null
  }
}

/**
 * Subscribe to a specific animation trigger by id.
 * Returns unsubscribe.
 */
export function onTrigger(
  scenarioId: ScenarioId,
  triggerId: string,
  handler: TimelineAnimationHandler
): () => void {
  return addHandler(scenarioId, triggerId, handler)
}

/**
 * Subscribe to all triggers of a given type.
 * Returns unsubscribe.
 */
export function onTriggerType(
  scenarioId: ScenarioId,
  type: string,
  handler: TimelineAnimationHandler
): () => void {
  return addHandler(scenarioId, `type:${type}`, handler)
}

/**
 * Subscribe to all triggers for a given target.
 * Returns unsubscribe.
 */
export function onTriggerTarget(
  scenarioId: ScenarioId,
  target: string,
  handler: TimelineAnimationHandler
): () => void {
  return addHandler(scenarioId, `target:${target}`, handler)
}

/**
 * Subscribe to every animation event for a scenario.
 * Returns unsubscribe.
 */
export function onAnyTrigger(
  scenarioId: ScenarioId,
  handler: TimelineAnimationHandler
): () => void {
  return addHandler(scenarioId, '*', handler)
}

/**
 * Check if a timeline is currently running.
 */
export function isTimelineRunning(): boolean {
  return activeScenarioId !== null
}

/**
 * Get the active scenario ID, if any.
 */
export function getActiveScenarioId(): ScenarioId | null {
  return activeScenarioId
}
