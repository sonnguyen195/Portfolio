/**
 * GuardianX Engine Types
 */

export type DroneStatus = 'idle' | 'deploying' | 'in-transit' | 'patrolling' | 'returning' | 'landed'

export type MissionType = 'deploy' | 'emergency' | 'patrol'

export interface CityBlock {
  x: number
  z: number
  width: number
  depth: number
  height: number
  lit: boolean
}

export interface DroneState {
  id: string
  alive: boolean
  status: DroneStatus
  position: [number, number, number]
  targetPosition: [number, number, number]
  route: [number, number, number][]
  routeProgress: number
  speed: number
  color: [number, number, number]
  startTime: number
  missionType: MissionType
  label: string
}

export interface MissionZone {
  id: string
  center: [number, number]
  radius: number
  color: [number, number, number]
  active: boolean
  pulsePhase: number
  label: string
}

export interface FlightPath {
  id: string
  points: [number, number, number][]
  color: [number, number, number]
  progress: number
  active: boolean
  droneId: string
}

export interface TerminalNode {
  id: string
  position: [number, number]
  label: string
  type: 'hub' | 'waypoint' | 'target'
  active: boolean
  color: [number, number, number]
}
