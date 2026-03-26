/**
 * Animation sequence: Incident Triage → Stage Progression → Close
 *
 * Start: Ticket detail opened
 * Sequence: Stage pipeline → Step complete → Advance → Close
 * End: Ticket closed
 */

export type TriageToClosePhase =
  | 'idle'
  | 'pipeline_visible'
  | 'step_complete'
  | 'stage_advance'
  | 'closed'

export const TRIAGE_PHASES: TriageToClosePhase[] = [
  'idle',
  'pipeline_visible',
  'step_complete',
  'stage_advance',
  'closed',
]

export function createTriageToCloseTimeline() {
  return {
    phases: TRIAGE_PHASES,
    durationMs: 6000,
  }
}
