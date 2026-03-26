/**
 * Radar sweep — rotating radar scan indicator.
 * Ambient motion: continuous sweep with glow trail.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const RADAR_RADIUS = 3.5
const RADAR_Y = 0.02
const SWEEP_SPEED = 0.35

export function RadarSweep() {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * SWEEP_SPEED
  })

  return (
    <group ref={ref} position={[0, RADAR_Y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[RADAR_RADIUS * 0.65, RADAR_RADIUS, 48]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[RADAR_RADIUS * 0.85, RADAR_RADIUS, 48]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[RADAR_RADIUS * 0.025, RADAR_RADIUS * 2]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[RADAR_RADIUS * 0.08, RADAR_RADIUS * 2]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
