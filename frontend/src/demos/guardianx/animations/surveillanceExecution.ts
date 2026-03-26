/**
 * Animation sequence: Surveillance Profile Execution → Flight → Video Analysis
 *
 * Start: Approved profile, operator at GCS
 * Sequence: Flight start → Drone flies polygon → Flight end → Analysis → Report
 * End: Profile completed, report ready
 */

export type SurveillanceExecutionPhase =
  | 'idle'
  | 'flight_start'
  | 'flying'
  | 'flight_end'
  | 'analysis'
  | 'report_ready'

export const SURVEILLANCE_EXECUTION_PHASES: SurveillanceExecutionPhase[] = [
  'idle',
  'flight_start',
  'flying',
  'flight_end',
  'analysis',
  'report_ready',
]

export function createSurveillanceExecutionTimeline() {
  return {
    phases: SURVEILLANCE_EXECUTION_PHASES,
    durationMs: 15000,
  }
}
