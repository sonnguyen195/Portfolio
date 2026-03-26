/**
 * 3D city environment — ground plane and building blocks.
 * Optimized: InstancedMesh for buildings (1 draw call).
 */
import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'

const GRID_SIZE = 12
const BUILDING_COUNT = 24

function createBuildingData(): { positions: Float32Array; scales: Float32Array } {
  const used = new Set<string>()
  const positions: number[] = []
  const scales: number[] = []

  for (let i = 0; i < BUILDING_COUNT; i++) {
    const x = (Math.random() - 0.5) * GRID_SIZE * 1.6
    const z = (Math.random() - 0.5) * GRID_SIZE * 1.6
    const key = `${Math.floor(x)}_${Math.floor(z)}`
    if (used.has(key)) continue
    used.add(key)
    const w = 0.4 + Math.random() * 0.5
    const d = 0.4 + Math.random() * 0.5
    const h = 0.3 + Math.random() * 1.2
    positions.push(x, h / 2, z)
    scales.push(w, h, d)
  }

  return {
    positions: new Float32Array(positions),
    scales: new Float32Array(scales),
  }
}

const BOX_GEOM = new THREE.BoxGeometry(1, 1, 1)
const BUILDING_MAT = new THREE.MeshStandardMaterial({ color: '#334050', metalness: 0.2, roughness: 0.8 })

export function CityEnvironment() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const data = useMemo(() => createBuildingData(), [])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    for (let i = 0; i < BUILDING_COUNT; i++) {
      dummy.position.set(data.positions[i * 3], data.positions[i * 3 + 1], data.positions[i * 3 + 2])
      dummy.scale.set(data.scales[i * 3], data.scales[i * 3 + 1], data.scales[i * 3 + 2])
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [data])

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[GRID_SIZE * 2, GRID_SIZE * 2]} />
        <meshStandardMaterial color="#1a2332" metalness={0.1} roughness={0.9} />
      </mesh>
      {/* Grid lines */}
      <gridHelper args={[GRID_SIZE * 2, 20, '#2a3a4a', '#1e2a38']} position={[0, 0.001, 0]} />
      {/* Buildings — single InstancedMesh (1 draw call vs 24) */}
      <instancedMesh
        ref={meshRef}
        args={[BOX_GEOM, BUILDING_MAT, BUILDING_COUNT]}
        castShadow
        receiveShadow
      />
    </group>
  )
}
