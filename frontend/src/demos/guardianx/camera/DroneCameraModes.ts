/**
 * Drone camera mode definitions.
 * Used by DroneCameraController for mission simulation choreography.
 */
export type DroneCameraMode =
  | 'mission_control'
  | 'drone_follow'
  | 'drone_pov'

export const DRONE_CAMERA_MODES = {
  MISSION_CONTROL: 'mission_control' as const,
  DRONE_FOLLOW: 'drone_follow' as const,
  DRONE_POV: 'drone_pov' as const,
} satisfies Record<string, DroneCameraMode>

/** Mission Control: top-down or cinematic orbit view */
export type MissionControlConfig = {
  /** Top-down height (Y) */
  orbitHeight: number
  /** Orbit distance from center */
  orbitRadius: number
  /** FOV */
  fov: number
}

/** Drone Follow: camera trails behind drone */
export type DroneFollowConfig = {
  /** Offset behind drone (local -Z) */
  followDistance: number
  /** Height offset above drone */
  heightOffset: number
  /** Lateral offset */
  lateralOffset: number
  /** FOV */
  fov: number
}

/** Drone POV: camera attached to drone front */
export type DronePOVConfig = {
  /** Forward offset from drone center (nose) */
  forwardOffset: number
  /** Height offset (slightly above center) */
  heightOffset: number
  /** FOV for immersive view */
  fov: number
}

export const DEFAULT_MISSION_CONTROL: MissionControlConfig = {
  orbitHeight: 10,
  orbitRadius: 12,
  fov: 55,
}

export const DEFAULT_DRONE_FOLLOW: DroneFollowConfig = {
  followDistance: 4,
  heightOffset: 2,
  lateralOffset: 0,
  fov: 42,
}

export const DEFAULT_DRONE_POV: DronePOVConfig = {
  forwardOffset: 0.15,
  heightOffset: 0.02,
  fov: 65,
}
