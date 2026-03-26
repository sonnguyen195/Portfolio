/**
 * Drone Camera POV system.
 * Mode 1: Mission Control (top-down/orbit)
 * Mode 2: Drone Follow (behind drone)
 * Mode 3: Drone POV (attached to drone front)
 *
 * Features: smooth lerp, camera shake during movement, transition zoom.
 */
import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDroneFlightAnimation } from '../animations'
import { createRouteCurve } from '../scene/routeUtils'
import { useDroneCameraMode } from './DroneCameraModeContext'
import type { DroneCameraMode } from './DroneCameraModes'
import {
  DEFAULT_MISSION_CONTROL,
  DEFAULT_DRONE_FOLLOW,
  DEFAULT_DRONE_POV,
} from './DroneCameraModes'

const SPAWN_POSITION: [number, number, number] = [-2.5, 0.8, -2.5]
const TAKEOFF_HEIGHT = 0.4

/** Progress threshold to switch from Follow to POV during route flight */
const POV_SWITCH_PROGRESS = 0.4

/** Simple noise for camera shake */
function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return n - Math.floor(n)
}

function getDronePosition(
  phase: string,
  phaseProgress: number,
  curve: THREE.CatmullRomCurve3
): THREE.Vector3 {
  const pos = new THREE.Vector3()

  if (phase === 'drone_spawns') {
    pos.set(...SPAWN_POSITION)
    return pos
  }

  if (phase === 'drone_takeoff') {
    pos.set(
      SPAWN_POSITION[0],
      SPAWN_POSITION[1] + phaseProgress * TAKEOFF_HEIGHT,
      SPAWN_POSITION[2]
    )
    return pos
  }

  if (phase === 'drone_follows_route' || phase === 'complete') {
    const t = phase === 'complete' ? 1 : phaseProgress
    const pt = curve.getPointAt(t)
    pt.y += 0.06 * Math.sin(Date.now() * 0.003)
    return pt
  }

  return pos.set(0, 0, 0)
}

function getDroneForward(
  phase: string,
  phaseProgress: number,
  curve: THREE.CatmullRomCurve3
): THREE.Vector3 {
  const forward = new THREE.Vector3()

  if (phase === 'drone_follows_route' || phase === 'complete') {
    const t = phase === 'complete' ? 1 : phaseProgress
    const pt = curve.getPointAt(t)
    const prev = curve.getPointAt(Math.max(0, t - 0.02))
    forward.subVectors(pt, prev).normalize()
    return forward
  }

  if (phase === 'drone_takeoff') {
    forward.set(0, 1, 0)
    return forward
  }

  return forward.set(0, 0, -1)
}

function resolveMode(phase: string, phaseProgress: number): DroneCameraMode {
  if (
    phase === 'idle' ||
    phase === 'mission_created' ||
    phase === 'route_drawn' ||
    phase === 'drone_spawns' ||
    phase === 'drone_takeoff'
  ) {
    return 'mission_control'
  }

  if (phase === 'drone_follows_route') {
    return phaseProgress >= POV_SWITCH_PROGRESS ? 'drone_pov' : 'drone_follow'
  }

  if (phase === 'complete') {
    return 'drone_pov'
  }

  return 'mission_control'
}

const LERP_SPEED = 4
const SHAKE_INTENSITY = 0.012
const SHAKE_FREQ = 8

export function DroneCameraController() {
  const { camera } = useThree()
  const { state } = useDroneFlightAnimation()
  const { mode: userMode } = useDroneCameraMode()
  const cam = camera as THREE.PerspectiveCamera
  const curve = useMemo(() => createRouteCurve(), [])

  const targetPos = useRef(new THREE.Vector3(0, 10, 12))
  const currentPos = useRef(new THREE.Vector3(0, 10, 12))
  const targetFov = useRef(55)
  const currentFov = useRef(55)
  const prevTargetPos = useRef(new THREE.Vector3(0, 10, 12))

  useFrame((_, delta) => {
    const { phase, phaseProgress } = state
    const autoMode = resolveMode(phase, phaseProgress)

    // User override: "drone POV" forces follow when drone exists
    const mode: DroneCameraMode =
      userMode === 'drone_follow' || userMode === 'drone_pov'
        ? phase === 'drone_follows_route' || phase === 'complete'
          ? phaseProgress >= POV_SWITCH_PROGRESS
            ? 'drone_pov'
            : 'drone_follow'
          : autoMode
        : userMode === 'mission_control'
          ? 'mission_control'
          : autoMode

    const dronePos = getDronePosition(phase, phaseProgress, curve)
    const droneForward = getDroneForward(phase, phaseProgress, curve)
    const droneRight = new THREE.Vector3().crossVectors(droneForward, new THREE.Vector3(0, 1, 0)).normalize()
    const droneUp = new THREE.Vector3().crossVectors(droneRight, droneForward).normalize()

    let lookAt: THREE.Vector3

    if (mode === 'mission_control') {
      const cfg = DEFAULT_MISSION_CONTROL
      const angle = Date.now() * 0.0003
      targetPos.current.set(
        Math.sin(angle) * cfg.orbitRadius,
        cfg.orbitHeight,
        Math.cos(angle) * cfg.orbitRadius
      )
      targetFov.current = cfg.fov
      lookAt =
        phase === 'drone_spawns' || phase === 'drone_takeoff'
          ? dronePos.clone()
          : new THREE.Vector3(0, 0, 0)
    } else if (mode === 'drone_follow') {
      const cfg = DEFAULT_DRONE_FOLLOW
      const behind = new THREE.Vector3(-droneForward.x, 0, -droneForward.z)
      if (behind.lengthSq() < 0.01) behind.set(0, 0, 1)
      behind.normalize()
      targetPos.current.copy(dronePos).add(behind.multiplyScalar(cfg.followDistance))
      targetPos.current.y = dronePos.y + cfg.heightOffset
      targetFov.current = cfg.fov
      lookAt = dronePos.clone()
    } else {
      const cfg = DEFAULT_DRONE_POV
      targetPos.current.copy(dronePos)
      targetPos.current.add(droneForward.clone().multiplyScalar(cfg.forwardOffset))
      targetPos.current.add(droneUp.clone().multiplyScalar(cfg.heightOffset))
      targetFov.current = cfg.fov
      lookAt = dronePos.clone().add(droneForward.clone().multiplyScalar(2))
    }

    // Ease-in-out lerp (smoother)
    const t = Math.min(1, delta * LERP_SPEED)
    const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    currentPos.current.lerp(targetPos.current, easeT)
    currentFov.current = THREE.MathUtils.lerp(currentFov.current, targetFov.current, delta * 4)

    // Camera shake during movement
    const moveDelta = prevTargetPos.current.distanceTo(targetPos.current)
    prevTargetPos.current.copy(targetPos.current)
    const shakeAmount = Math.min(1, moveDelta * 2) * SHAKE_INTENSITY
    const t2 = performance.now() * 0.001 * SHAKE_FREQ
    const shakeX = (noise2D(t2, 0) - 0.5) * 2 * shakeAmount
    const shakeY = (noise2D(t2 + 100, 0) - 0.5) * 2 * shakeAmount
    const shakeZ = (noise2D(t2 + 200, 0) - 0.5) * 2 * shakeAmount

    cam.position.copy(currentPos.current)
    cam.position.x += shakeX
    cam.position.y += shakeY
    cam.position.z += shakeZ
    cam.lookAt(lookAt)
    cam.fov = currentFov.current
    cam.updateProjectionMatrix()
  })

  return null
}
