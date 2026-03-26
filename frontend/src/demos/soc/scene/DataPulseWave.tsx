/**
 * Data pulse waves emanating from the globe.
 * Creates expanding ring effect for cyber aesthetic.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GLOBE_RADIUS } from '../worldmap/globeConstants'

const BASE_RADIUS = GLOBE_RADIUS
const PULSE_OPACITY = 0.45
const PULSE_MAX_SCALE = 1.8
const PULSE_PERIOD = 3.2

function SinglePulseRing({ delay }: { delay: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const t = (state.clock.elapsedTime + delay) * (Math.PI * 2 / PULSE_PERIOD)
    const scale = 1 + (PULSE_MAX_SCALE - 1) * (0.5 + 0.5 * Math.sin(t))
    const opacity = PULSE_OPACITY * Math.max(0, 1 - (scale - 1) / (PULSE_MAX_SCALE - 1))
    meshRef.current.scale.setScalar(scale)
    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    if (mat) mat.opacity = opacity
  })

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[BASE_RADIUS, BASE_RADIUS + 0.1, 48]} />
      <meshBasicMaterial
        color="#00d4ff"
        transparent
        opacity={PULSE_OPACITY}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

export function DataPulseWave() {
  return (
    <group>
      <SinglePulseRing delay={0} />
      <SinglePulseRing delay={0.4} />
      <SinglePulseRing delay={0.8} />
      <SinglePulseRing delay={1.2} />
    </group>
  )
}
