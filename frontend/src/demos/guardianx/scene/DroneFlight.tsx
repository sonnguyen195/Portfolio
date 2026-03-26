/**
 * Drone flight — spawn, takeoff, follow route.
 * Driven by DroneFlightAnimationContext phases.
 */
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useDroneFlightAnimation } from '../animations'
import { createRouteCurve } from './routeUtils'

const SPAWN_POSITION: [number, number, number] = [-2.5, 0.8, -2.5]
const TAKEOFF_HEIGHT = 0.4

function DroneModel() {
  const ref = useRef<THREE.Group | null>(null)
  const { state } = useDroneFlightAnimation()
  const curve = useMemo(() => createRouteCurve(), [])

  useFrame(() => {
    if (!ref.current) return

    const { phase, phaseProgress } = state

    if (phase === 'idle' || phase === 'mission_created' || phase === 'route_drawn') {
      ref.current.visible = false
      return
    }

    ref.current.visible = true

    if (phase === 'drone_spawns') {
      ref.current.position.set(...SPAWN_POSITION)
      ref.current.rotation.y = 0
      return
    }

    if (phase === 'drone_takeoff') {
      const t = phaseProgress
      ref.current.position.x = SPAWN_POSITION[0]
      ref.current.position.y = SPAWN_POSITION[1] + t * TAKEOFF_HEIGHT
      ref.current.position.z = SPAWN_POSITION[2]
      ref.current.rotation.y = t * Math.PI * 0.5
      return
    }

    if (phase === 'drone_follows_route') {
      const t = phaseProgress
      const pt = curve.getPointAt(t)
      ref.current.position.copy(pt)
      ref.current.position.y += 0.06 * Math.sin(Date.now() * 0.003)
      ref.current.rotation.y = Math.atan2(
        pt.z - curve.getPointAt(Math.max(0, t - 0.02)).z,
        pt.x - curve.getPointAt(Math.max(0, t - 0.02)).x
      )
      return
    }

    if (phase === 'complete') {
      const pt = curve.getPointAt(1)
      ref.current.position.copy(pt)
      ref.current.position.y += 0.06 * Math.sin(Date.now() * 0.003)
      return
    }
  })

  return (
    <group ref={ref} visible={false}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.14, 0.05, 0.2]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[-0.1, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.08, 8]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0.1, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.08, 8]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.5} />
      </mesh>
      <pointLight color="#00d4ff" intensity={0.5} distance={0.6} decay={2} position={[0, 0, 0.12]} />
    </group>
  )
}

export function DroneFlight() {
  return <DroneModel />
}
