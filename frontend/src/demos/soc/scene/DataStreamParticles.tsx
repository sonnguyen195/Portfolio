/**
 * Data stream particles — flowing particles for cyber aesthetic.
 * Ambient motion: outward flow with slight spiral, size variation.
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 200
const SPHERE_RADIUS = 2.5
const SPEED = 0.6
const SPIRAL_STRENGTH = 0.15

function createInitialPositions(): Float32Array {
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = SPHERE_RADIUS * (0.25 + 0.75 * Math.random())
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.cos(phi)
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
  }
  return positions
}

export function DataStreamParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const positions = useMemo(() => createInitialPositions(), [])
  const velocities = useMemo(() => {
    const v = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const speed = SPEED * (0.4 + Math.random() * 0.8)
      v[i * 3] = speed * Math.sin(phi) * Math.cos(theta)
      v[i * 3 + 1] = speed * Math.cos(phi)
      v[i * 3 + 2] = speed * Math.sin(phi) * Math.sin(theta)
    }
    return v
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const pos = posAttr.array as Float32Array
    const time = performance.now() * 0.001
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3
      pos[ix] += velocities[ix] * delta
      pos[ix + 1] += velocities[ix + 1] * delta
      pos[ix + 2] += velocities[ix + 2] * delta
      const spiral = SPIRAL_STRENGTH * Math.sin(time + i * 0.1) * delta
      const perpX = -pos[ix + 2]
      const perpZ = pos[ix]
      const len = Math.sqrt(perpX * perpX + perpZ * perpZ) || 1
      pos[ix] += (perpX / len) * spiral
      pos[ix + 2] += (perpZ / len) * spiral
      const r = Math.sqrt(pos[ix] ** 2 + pos[ix + 1] ** 2 + pos[ix + 2] ** 2)
      if (r > SPHERE_RADIUS * 1.15 || r < 0.4) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const nr = SPHERE_RADIUS * 0.35
        pos[ix] = nr * Math.sin(phi) * Math.cos(theta)
        pos[ix + 1] = nr * Math.cos(phi)
        pos[ix + 2] = nr * Math.sin(phi) * Math.sin(theta)
      }
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.022}
        color="#00d4ff"
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
