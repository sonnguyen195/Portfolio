/**
 * Animation sequence: Cyber Attack Detected → Incident Creation
 *
 * Start: Rule trigger
 * Sequence: Globe pulse → Incident card → Ticket form → Serial generated
 * End: Ticket created
 */

export type CyberAttackToIncidentPhase =
  | 'idle'
  | 'alert_pulse'
  | 'incident_card'
  | 'ticket_form'
  | 'ticket_created'

export const CYBER_ATTACK_PHASES: CyberAttackToIncidentPhase[] = [
  'idle',
  'alert_pulse',
  'incident_card',
  'ticket_form',
  'ticket_created',
]

export function createCyberAttackToIncidentTimeline() {
  return {
    phases: CYBER_ATTACK_PHASES,
    durationMs: 8000,
  }
}
