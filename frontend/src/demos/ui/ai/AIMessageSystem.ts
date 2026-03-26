/**
 * AI message system — system messages, alerts, mission updates.
 * Maps scenario phases to hologram messages.
 */
import type { ScenarioId } from '../../core/scenario'

export type MessageType = 'system' | 'alert' | 'mission'

export type AIMessage = {
  id: string
  text: string
  type: MessageType
  timestamp: number
}

type MessageHandler = (msg: AIMessage) => void

const handlers = new Set<MessageHandler>()
let messageId = 0

function nextId(): string {
  return `msg-${++messageId}`
}

export function pushMessage(text: string, type: MessageType = 'system'): void {
  const msg: AIMessage = {
    id: nextId(),
    text,
    type,
    timestamp: Date.now(),
  }
  handlers.forEach((h) => h(msg))
}

export function subscribeToMessages(handler: MessageHandler): () => void {
  handlers.add(handler)
  return () => handlers.delete(handler)
}

/** SOC trigger id → message mapping (matches TimelineEvents) */
export const SOC_TRIGGER_MESSAGES: Record<string, string> = {
  threat_node_appear: 'Threat detected in Europe',
  globe_highlight: 'Scanning region...',
  attack_pulse: 'Incident response activated',
  incident_hologram: 'Incident hologram displayed',
  defense_shield: 'Defense shield engaged',
  threat_neutralized: 'Attack neutralized',
}

/** GuardianX trigger id → message mapping */
export const GUARDIANX_TRIGGER_MESSAGES: Record<string, string> = {
  mission_marker_appear: 'Mission created',
  route_hologram: 'Drone route locked',
  drone_spawn: 'Drone deployed',
  drone_takeoff: 'Drone takeoff initiated',
  camera_follow_drone: 'Drone following route',
  mission_complete: 'Mission complete',
}

export function getMessageForTrigger(
  scenarioId: ScenarioId,
  triggerId: string
): string | null {
  const map =
    scenarioId === 'soc-attack' ? SOC_TRIGGER_MESSAGES : GUARDIANX_TRIGGER_MESSAGES
  return map[triggerId] ?? null
}
