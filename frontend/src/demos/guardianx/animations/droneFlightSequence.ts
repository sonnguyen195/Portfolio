/**
 * Drone Flight Animation Sequence
 *
 * Flow: mission created → route drawn → drone spawns → drone takeoff → drone follows route
 * Event-driven phases with configurable durations.
 */

export type DroneFlightPhase =
  | 'idle'
  | 'mission_created'
  | 'route_drawn'
  | 'drone_spawns'
  | 'drone_takeoff'
  | 'drone_follows_route'
  | 'complete'

export const DRONE_FLIGHT_PHASES: DroneFlightPhase[] = [
  'idle',
  'mission_created',
  'route_drawn',
  'drone_spawns',
  'drone_takeoff',
  'drone_follows_route',
  'complete',
]

export type DroneFlightPhaseConfig = Record<DroneFlightPhase, number>

export const DRONE_FLIGHT_CONFIG: DroneFlightPhaseConfig = {
  idle: 0,
  mission_created: 600,
  route_drawn: 1200,
  drone_spawns: 800,
  drone_takeoff: 1000,
  drone_follows_route: 3500,
  complete: 0,
}

export function getPhaseDuration(phase: DroneFlightPhase): number {
  return DRONE_FLIGHT_CONFIG[phase] ?? 0
}

export function getPhaseIndex(phase: DroneFlightPhase): number {
  const i = DRONE_FLIGHT_PHASES.indexOf(phase)
  return i >= 0 ? i : 0
}

export function getNextPhase(phase: DroneFlightPhase): DroneFlightPhase | null {
  const i = getPhaseIndex(phase)
  const next = DRONE_FLIGHT_PHASES[i + 1]
  return next ?? null
}

export function createDroneFlightTimeline() {
  const totalMs = Object.values(DRONE_FLIGHT_CONFIG).reduce((a, b) => a + b, 0)
  return {
    phases: DRONE_FLIGHT_PHASES,
    config: DRONE_FLIGHT_CONFIG,
    totalDurationMs: totalMs,
  }
}
