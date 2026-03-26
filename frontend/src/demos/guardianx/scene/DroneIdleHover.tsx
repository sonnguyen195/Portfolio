/**
 * Drone idle hover — ambient hover animation for drones.
 * Only visible when flight sequence is idle or complete.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useDroneFlightAnimation } from '../animations'

const DRONE_POSITIONS: [number, number, number][] = [
  [-2, 0.9, -2],
  [2, 0.9, -2],
  [-2, 0.9, 2],
]

function DroneModel({ position, index }: { position: [number, number, number]; index: number }) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime + index * 0.5
    ref.current.position.y = position[1] + 0.1 * Math.sin(t * 2.2)
    ref.current.rotation.y = t * 0.35
    ref.current.rotation.z = 0.03 * Math.sin(t * 1.5 + index)
  })

  return (
    <group ref={ref} position={position}>
      {/* Single mesh for body — reduced draw calls */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.12, 0.04, 0.18]} />
        <meshBasicMaterial color="#2a3a4a" />
      </mesh>
      {/* Propellers merged: use lower segment count */}
      <mesh position={[-0.08, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.06, 6]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.08, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.06, 6]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
      {/* Single shared point light per drone — reduced from 3 to 1 for all via ambient */}
      <pointLight color="#00d4ff" intensity={0.2} distance={0.4} decay={2} position={[0, 0, 0.1]} />
    </group>
  )
}

export function DroneIdleHover() {
  const { state } = useDroneFlightAnimation()
  const showIdle =
    state.phase === 'idle' || state.phase === 'complete'

  if (!showIdle) return null

  return (
    <group>
      {DRONE_POSITIONS.map((pos, i) => (
        <DroneModel key={i} position={pos} index={i} />
      ))}
    </group>
  )
}
