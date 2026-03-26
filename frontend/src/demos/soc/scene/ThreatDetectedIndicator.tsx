/**
 * Threat detected indicator — flash/pulse on threat nodes.
 * Active during threat_detected phase.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useIncidentAnimation } from '../animations'
import { GLOBE_RADIUS } from '../worldmap/globeConstants'

export function ThreatDetectedIndicator() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { state } = useIncidentAnimation()

  useFrame(() => {
    if (!meshRef.current) return
    const isActive = state.phase === 'threat_detected' || state.phase === 'attack_pulse'
    meshRef.current.visible = isActive
    if (isActive) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial
      if (mat) {
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008)
        mat.opacity = 0.2 + pulse * 0.3
      }
      meshRef.current.scale.setScalar(1 + state.phaseProgress * 0.1)
    }
  })

  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[GLOBE_RADIUS, 16, 12]} />
      <meshBasicMaterial
        color="#ff4444"
        transparent
        opacity={0.3}
        wireframe
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
