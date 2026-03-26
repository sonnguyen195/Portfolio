/**
 * Attack pulse that travels across the globe.
 * Active during attack_pulse phase.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useIncidentAnimation } from '../animations'
import { GLOBE_RADIUS } from '../worldmap/globeConstants'

const PULSE_WIDTH = 0.68

export function AttackPulse() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { state } = useIncidentAnimation()

  useFrame(() => {
    if (!meshRef.current) return
    const isActive =
      state.phase === 'attack_pulse' || state.phase === 'incident_hologram'
    meshRef.current.visible = isActive
    if (isActive) {
      const t = state.phaseProgress
      const angle = t * Math.PI * 2
      meshRef.current.rotation.y = angle
    }
  })

  return (
    <mesh ref={meshRef} visible={false}>
      <ringGeometry
        args={[GLOBE_RADIUS, GLOBE_RADIUS + PULSE_WIDTH, 64]}
      />
      <meshBasicMaterial
        color="#ff4444"
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
