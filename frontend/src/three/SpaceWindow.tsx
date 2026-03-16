import { memo, useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PLANE_SIZE = 40
const PLANE_Y = 5
const GLASS_OPACITY = 0.12
const GLASS_ROUGHNESS = 0.15
const GLASS_METALNESS = 0.45
const BLUE_TINT = '#88aacc'

/**
 * Transparent space observation window above the lab ceiling.
 * Glass-like material with blue tint and subtle animated reflection.
 */
function SpaceWindowInner() {
  const meshRef = useRef<THREE.Mesh>(null)
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: BLUE_TINT,
      transparent: true,
      opacity: GLASS_OPACITY,
      roughness: GLASS_ROUGHNESS,
      metalness: GLASS_METALNESS,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      envMapIntensity: 0.4,
    })
    return m
  }, [])

  useEffect(() => () => material.dispose(), [material])

  useFrame((state) => {
    const mesh = meshRef.current
    const mat = mesh?.material as THREE.MeshPhysicalMaterial | undefined
    if (!mat) return
    const t = state.clock.elapsedTime * 0.08
    mat.envMapIntensity = 0.35 + Math.sin(t) * 0.08
  })

  return (
    <mesh
      ref={meshRef}
      position={[0, PLANE_Y, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
      renderOrder={1}
      frustumCulled
      raycast={() => null}
    >
      <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
    </mesh>
  )
}

export const SpaceWindow = memo(SpaceWindowInner)
