/**
 * Defense shield that activates around the globe.
 * Active during defense_shield phase.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useIncidentAnimation } from '../animations'
import { GLOBE_RADIUS } from '../worldmap/globeConstants'

const SHIELD_OFFSET = 1.0

export function DefenseShield() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { state } = useIncidentAnimation()

  useFrame(() => {
    if (!meshRef.current) return
    const isActive = state.phase === 'defense_shield' || state.phase === 'complete'
    meshRef.current.visible = isActive
    if (isActive) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial
      if (mat) {
        mat.opacity = 0.15 + state.phaseProgress * 0.25
      }
    }
  })

  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[GLOBE_RADIUS + SHIELD_OFFSET, 32, 24]} />
      <meshBasicMaterial
        color="#00ff88"
        transparent
        opacity={0.2}
        wireframe
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
