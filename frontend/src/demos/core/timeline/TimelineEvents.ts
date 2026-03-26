/**
 * Timeline animation events and trigger definitions.
 * Maps scenario steps to animation triggers for orchestration.
 */
import type { ScenarioId } from '../scenario/ScenarioEvents'

export type AnimationTriggerType =
  | 'appear'
  | 'highlight'
  | 'pulse'
  | 'reveal'
  | 'spawn'
  | 'takeoff'
  | 'follow'
  | 'complete'
  | 'camera'

export type TimelineAnimationTrigger = {
  /** Unique trigger id for subscription */
  id: string
  /** Time in seconds from scenario start */
  time: number
  /** Animation type for routing */
  type: AnimationTriggerType
  /** Target (e.g. "threat_node", "globe", "drone") */
  target?: string
  /** Optional payload for handlers */
  payload?: Record<string, unknown>
}

export type TimelineAnimationEvent = {
  trigger: TimelineAnimationTrigger
  elapsedSec: number
  progress: number
  scenarioId: ScenarioId
}

export type TimelineAnimationHandler = (event: TimelineAnimationEvent) => void

/** SOC Attack — step-to-trigger mapping */
export const SOC_ATTACK_TRIGGERS: TimelineAnimationTrigger[] = [
  { id: 'threat_node_appear', time: 0, type: 'appear', target: 'threat_node' },
  { id: 'globe_highlight', time: 2, type: 'highlight', target: 'globe' },
  { id: 'attack_pulse', time: 4, type: 'pulse', target: 'attack_pulse' },
  { id: 'incident_hologram', time: 6, type: 'reveal', target: 'incident_hologram' },
  { id: 'defense_shield', time: 8, type: 'pulse', target: 'defense_shield' },
  { id: 'threat_neutralized', time: 10, type: 'complete', target: 'threat' },
]

/** GuardianX Mission — step-to-trigger mapping */
export const MISSION_DEPLOYMENT_TRIGGERS: TimelineAnimationTrigger[] = [
  { id: 'mission_marker_appear', time: 0, type: 'appear', target: 'mission_marker' },
  { id: 'route_hologram', time: 2, type: 'reveal', target: 'route_hologram' },
  { id: 'drone_spawn', time: 4, type: 'spawn', target: 'drone' },
  { id: 'drone_takeoff', time: 6, type: 'takeoff', target: 'drone' },
  { id: 'camera_follow_drone', time: 8, type: 'camera', target: 'drone' },
  { id: 'mission_complete', time: 12, type: 'complete', target: 'mission' },
]

export const TIMELINE_TRIGGER_REGISTRY: Record<ScenarioId, TimelineAnimationTrigger[]> = {
  'soc-attack': SOC_ATTACK_TRIGGERS,
  'guardianx-mission': MISSION_DEPLOYMENT_TRIGGERS,
}

export function getTimelineTriggers(scenarioId: ScenarioId): TimelineAnimationTrigger[] {
  return TIMELINE_TRIGGER_REGISTRY[scenarioId] ?? []
}
