/**
 * 3D Cyber Globe
 * Wireframe sphere with slow rotation and cyber aesthetic.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GLOBE_RADIUS } from '../worldmap/globeConstants'
const ROTATION_SPEED = 0.08

export function CyberGlobe() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += ROTATION_SPEED * delta
      groupRef.current.rotation.x = Math.sin(performance.now() * 0.0003) * 0.08
    }
  })

  return (
    <group ref={groupRef}>
      {/* Inner glow sphere — reduced segments for mid-range */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 24, 16]} />
        <meshBasicMaterial
          color="#0a1628"
          wireframe={false}
          transparent
          opacity={0.15}
        />
      </mesh>
      {/* Wireframe lat/long grid */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 1.002, 20, 12]} />
        <meshBasicMaterial
          color="#00d4ff"
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>
      {/* Pulse ring at equator */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[GLOBE_RADIUS * 0.98, GLOBE_RADIUS * 1.02, 48]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
