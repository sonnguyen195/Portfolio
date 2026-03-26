/**
 * Animation sequence: Drone Deployment → In-Transit → Arrival
 *
 * Start: Verified order, route assigned
 * Sequence: Assign drone → Upload mission → Drone flies → Arrives → Complete
 * End: Order completed
 */

export type DroneDeploymentPhase =
  | 'idle'
  | 'assign'
  | 'upload'
  | 'in_transit'
  | 'arrived'
  | 'completed'

export const DRONE_DEPLOYMENT_PHASES: DroneDeploymentPhase[] = [
  'idle',
  'assign',
  'upload',
  'in_transit',
  'arrived',
  'completed',
]

export function createDroneDeploymentTimeline() {
  return {
    phases: DRONE_DEPLOYMENT_PHASES,
    durationMs: 12000,
  }
}
