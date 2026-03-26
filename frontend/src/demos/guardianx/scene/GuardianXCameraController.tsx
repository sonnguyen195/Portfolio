/**
 * GuardianX cinematic camera choreography.
 * Wide city reveal, zoom during takeoff, follow drone.
 */
import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDroneFlightAnimation } from '../animations'
import { createRouteCurve } from './routeUtils'

const SPAWN_POSITION: [number, number, number] = [-2.5, 0.8, -2.5]
const TAKEOFF_HEIGHT = 0.4

const WIDE_POSITION: [number, number, number] = [0, 10, 12]
const WIDE_FOV = 55
const FOLLOW_OFFSET = new THREE.Vector3(2, 5, 6)
const FOLLOW_FOV = 42
const ZOOM_FOV = 35

export function GuardianXCameraController() {
  const { camera } = useThree()
  const { state } = useDroneFlightAnimation()
  const cam = camera as THREE.PerspectiveCamera
  const curve = useMemo(() => createRouteCurve(), [])
  const targetPos = useRef(new THREE.Vector3(...WIDE_POSITION))
  const currentPos = useRef(new THREE.Vector3(...WIDE_POSITION))
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const targetFov = useRef(WIDE_FOV)
  const currentFov = useRef(WIDE_FOV)

  useFrame((_, delta) => {
    const { phase, phaseProgress } = state

    if (phase === 'idle' || phase === 'mission_created' || phase === 'route_drawn') {
      targetPos.current.set(...WIDE_POSITION)
      targetLookAt.current.set(0, 0, 0)
      targetFov.current = WIDE_FOV
    } else if (phase === 'drone_spawns') {
      targetPos.current.set(
        SPAWN_POSITION[0] + 3,
        SPAWN_POSITION[1] + 4,
        SPAWN_POSITION[2] + 5
      )
      targetLookAt.current.set(...SPAWN_POSITION)
      targetFov.current = WIDE_FOV
    } else if (phase === 'drone_takeoff') {
      const y = SPAWN_POSITION[1] + phaseProgress * TAKEOFF_HEIGHT
      targetPos.current.set(
        SPAWN_POSITION[0] + 2,
        y + 3,
        SPAWN_POSITION[2] + 4
      )
      targetLookAt.current.set(SPAWN_POSITION[0], y, SPAWN_POSITION[2])
      targetFov.current = THREE.MathUtils.lerp(WIDE_FOV, ZOOM_FOV, phaseProgress)
    } else if (phase === 'drone_follows_route' || phase === 'complete') {
      const t = phase === 'complete' ? 1 : phaseProgress
      const pt = curve.getPointAt(t)
      const lookAt = pt.clone()
      lookAt.y += 0.06 * Math.sin(Date.now() * 0.003)
      targetPos.current.copy(lookAt).add(FOLLOW_OFFSET)
      targetLookAt.current.copy(lookAt)
      targetFov.current = FOLLOW_FOV
    }

    currentPos.current.lerp(targetPos.current, delta * 4)
    currentFov.current = THREE.MathUtils.lerp(currentFov.current, targetFov.current, delta * 3)
    cam.position.copy(currentPos.current)
    cam.lookAt(targetLookAt.current)
    cam.fov = currentFov.current
    cam.updateProjectionMatrix()
  })

  return null
}
