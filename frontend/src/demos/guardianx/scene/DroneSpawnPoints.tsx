/**
 * Drone spawn points — markers where drones appear.
 * Phase-aware: visible from drone_spawns.
 * Optimized: InstancedMesh for rings and cylinders (2 draw calls vs 10).
 */
import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useDroneFlightAnimation } from '../animations'

const SPAWN_OFFSET = 2.5
const SPAWN_COUNT = 5

const SPAWN_POSITIONS: [number, number, number][] = [
  [-SPAWN_OFFSET, 0.8, -SPAWN_OFFSET],
  [SPAWN_OFFSET, 0.8, -SPAWN_OFFSET],
  [-SPAWN_OFFSET, 0.8, SPAWN_OFFSET],
  [SPAWN_OFFSET, 0.8, SPAWN_OFFSET],
  [0, 0.8, -SPAWN_OFFSET * 1.2],
]

const RING_GEOM = new THREE.RingGeometry(0.08, 0.12, 24)
const CYL_GEOM = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 6)
const RING_MAT = new THREE.MeshBasicMaterial({
  color: '#00d4ff',
  transparent: true,
  opacity: 0.7,
  side: THREE.DoubleSide,
  depthWrite: false,
})
const CYL_MAT = new THREE.MeshBasicMaterial({
  color: '#00d4ff',
  transparent: true,
  opacity: 0.8,
})

function isSpawnVisible(phase: string): boolean {
  return ['drone_spawns', 'drone_takeoff', 'drone_follows_route', 'complete'].includes(phase)
}

export function DroneSpawnPoints() {
  const { state } = useDroneFlightAnimation()
  const ringRef = useRef<THREE.InstancedMesh>(null)
  const cylRef = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    const dummy = new THREE.Object3D()
    for (let i = 0; i < SPAWN_COUNT; i++) {
      const [x, y, z] = SPAWN_POSITIONS[i]
      dummy.position.set(x, y, z)
      dummy.rotation.x = -Math.PI / 2
      dummy.rotation.y = 0
      dummy.rotation.z = 0
      dummy.updateMatrix()
      ringRef.current?.setMatrixAt(i, dummy.matrix)
      dummy.rotation.x = 0
      dummy.position.set(x, y + 0.05, z)
      dummy.updateMatrix()
      cylRef.current?.setMatrixAt(i, dummy.matrix)
    }
    ringRef.current && (ringRef.current.instanceMatrix.needsUpdate = true)
    cylRef.current && (cylRef.current.instanceMatrix.needsUpdate = true)
  }, [])

  if (!isSpawnVisible(state.phase)) return null

  return (
    <group>
      <instancedMesh ref={ringRef} args={[RING_GEOM, RING_MAT, SPAWN_COUNT]} />
      <instancedMesh ref={cylRef} args={[CYL_GEOM, CYL_MAT, SPAWN_COUNT]} />
    </group>
  )
}
