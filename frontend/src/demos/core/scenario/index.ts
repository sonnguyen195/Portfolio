/**
 * Scenario Engine — orchestrates demo flows.
 *
 * Usage:
 *   runScenario("soc-attack")
 *   runScenario("guardianx-mission", { onStep: (e) => ... })
 */
export { runScenario, stopScenario, subscribeToScenario, isScenarioRunning } from './ScenarioEngine'
export type { ScenarioEngineOptions, ScenarioEventHandler } from './ScenarioEngine'
export {
  getScenario,
  SCENARIO_REGISTRY,
  SOC_ATTACK_SCENARIO,
  MISSION_DEPLOYMENT_SCENARIO,
} from './ScenarioEvents'
export type {
  ScenarioId,
  ScenarioDefinition,
  ScenarioStep,
  ScenarioEventType,
  ScenarioEventPayload,
} from './ScenarioEvents'
export { ScenarioTimeline } from './ScenarioTimeline'
export type { TimelineEvent, TimelineOptions, TimelineEventHandler } from './ScenarioTimeline'
export { useScenario } from './useScenario'
export type { UseScenarioResult } from './useScenario'
