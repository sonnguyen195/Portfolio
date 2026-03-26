/**
 * Scenario event types and definitions.
 * Event-driven: each step emits typed events for animations and camera.
 */
export type ScenarioId = 'soc-attack' | 'guardianx-mission'

export type ScenarioEventType =
  | 'phase'
  | 'camera'
  | 'animation'
  | 'custom'

export type ScenarioEventPayload = {
  phase?: string
  progress?: number
  cameraTarget?: string
  cameraAction?: 'focus' | 'orbit' | 'zoom' | 'reveal'
  animationTrigger?: string
  [key: string]: unknown
}

export type ScenarioStep = {
  /** Time in seconds from scenario start */
  time: number
  /** Event type for routing */
  type: ScenarioEventType
  /** Event identifier (e.g. phase name) */
  id: string
  /** Optional payload for handlers */
  payload?: ScenarioEventPayload
}

export type ScenarioDefinition = {
  id: ScenarioId
  name: string
  totalDurationSec: number
  steps: ScenarioStep[]
}

/** SOC Attack scenario — threat detection to defense */
export const SOC_ATTACK_SCENARIO: ScenarioDefinition = {
  id: 'soc-attack',
  name: 'SOC Attack Response',
  totalDurationSec: 10,
  steps: [
    { time: 0, type: 'phase', id: 'threat_detected', payload: { phase: 'threat_detected' } },
    { time: 2, type: 'phase', id: 'globe_highlight', payload: { phase: 'threat_detected', cameraAction: 'focus' } },
    { time: 4, type: 'phase', id: 'attack_pulse', payload: { phase: 'attack_pulse' } },
    { time: 6, type: 'phase', id: 'incident_hologram', payload: { phase: 'incident_hologram' } },
    { time: 8, type: 'phase', id: 'defense_shield', payload: { phase: 'defense_shield' } },
    { time: 10, type: 'phase', id: 'complete', payload: { phase: 'complete' } },
  ],
}

/** GuardianX Mission Deployment scenario */
export const MISSION_DEPLOYMENT_SCENARIO: ScenarioDefinition = {
  id: 'guardianx-mission',
  name: 'Mission Deployment',
  totalDurationSec: 12,
  steps: [
    { time: 0, type: 'phase', id: 'mission_created', payload: { phase: 'mission_created' } },
    { time: 2, type: 'phase', id: 'route_hologram', payload: { phase: 'route_drawn' } },
    { time: 4, type: 'phase', id: 'drone_spawn', payload: { phase: 'drone_spawns' } },
    { time: 6, type: 'phase', id: 'drone_takeoff', payload: { phase: 'drone_takeoff' } },
    { time: 8, type: 'phase', id: 'drone_follow', payload: { phase: 'drone_follows_route' } },
    { time: 12, type: 'phase', id: 'complete', payload: { phase: 'complete' } },
  ],
}

export const SCENARIO_REGISTRY: Record<ScenarioId, ScenarioDefinition> = {
  'soc-attack': SOC_ATTACK_SCENARIO,
  'guardianx-mission': MISSION_DEPLOYMENT_SCENARIO,
}

export function getScenario(id: ScenarioId): ScenarioDefinition {
  const def = SCENARIO_REGISTRY[id]
  if (!def) throw new Error(`Unknown scenario: ${id}`)
  return def
}
