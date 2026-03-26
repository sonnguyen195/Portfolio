/**
 * Animation sequence: Survey Mission Creation → Approval → Activation
 *
 * Start: Add New Mission
 * Sequence: Polygon draw → Waypoints → Submit → Approve → Activate
 * End: Mission active
 */

export type MissionCreationPhase =
  | 'idle'
  | 'polygon_draw'
  | 'waypoints'
  | 'submit'
  | 'approve'
  | 'activate'
  | 'active'

export const MISSION_CREATION_PHASES: MissionCreationPhase[] = [
  'idle',
  'polygon_draw',
  'waypoints',
  'submit',
  'approve',
  'activate',
  'active',
]

export function createMissionCreationTimeline() {
  return {
    phases: MISSION_CREATION_PHASES,
    durationMs: 10000,
  }
}
