/**
 * SOC Incident Event Animation Sequence
 *
 * Sequence: threat detected → attack pulse → incident hologram → defense shield
 * Event-driven phases with configurable durations.
 */

export type IncidentEventPhase =
  | 'idle'
  | 'threat_detected'
  | 'attack_pulse'
  | 'incident_hologram'
  | 'defense_shield'
  | 'complete'

export const INCIDENT_EVENT_PHASES: IncidentEventPhase[] = [
  'idle',
  'threat_detected',
  'attack_pulse',
  'incident_hologram',
  'defense_shield',
  'complete',
]

export type PhaseConfig = {
  phase: IncidentEventPhase
  durationMs: number
  /** 0–1 progress within phase for sub-animations */
  progress?: number
}

export const INCIDENT_EVENT_CONFIG: Record<IncidentEventPhase, number> = {
  idle: 0,
  threat_detected: 800,
  attack_pulse: 2000,
  incident_hologram: 1500,
  defense_shield: 2500,
  complete: 0,
}

export function getPhaseDuration(phase: IncidentEventPhase): number {
  return INCIDENT_EVENT_CONFIG[phase] ?? 0
}

export function getPhaseIndex(phase: IncidentEventPhase): number {
  const i = INCIDENT_EVENT_PHASES.indexOf(phase)
  return i >= 0 ? i : 0
}

export function getNextPhase(phase: IncidentEventPhase): IncidentEventPhase | null {
  const i = getPhaseIndex(phase)
  const next = INCIDENT_EVENT_PHASES[i + 1]
  return next ?? null
}

export function createIncidentEventTimeline() {
  const totalMs = Object.values(INCIDENT_EVENT_CONFIG).reduce((a, b) => a + b, 0)
  return {
    phases: INCIDENT_EVENT_PHASES,
    config: INCIDENT_EVENT_CONFIG,
    totalDurationMs: totalMs,
  }
}
