import { memo, useRef, useMemo, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

const CANVAS_SIZE = 256
const STAR_COUNT = 1000
const SPHERE_RADIUS = 400
const STAR_SIZE = 1.2
const GRADIENT_CENTER = '#0a0f1c'
const GRADIENT_EDGE = '#050810'

function createGradientTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)
  const centerX = CANVAS_SIZE / 2
  const centerY = CANVAS_SIZE / 2
  const radius = Math.sqrt(centerX * centerX + centerY * centerY)
  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, radius
  )
  gradient.addColorStop(0, GRADIENT_CENTER)
  gradient.addColorStop(0.6, GRADIENT_CENTER)
  gradient.addColorStop(1, GRADIENT_EDGE)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function createStarPositions(): Float32Array {
  const positions = new Float32Array(STAR_COUNT * 3)
  for (let i = 0; i < STAR_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = SPHERE_RADIUS * (0.7 + 0.3 * Math.random())
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  return positions
}

/**
 * Deep space background: dark blue gradient + subtle procedural starfield.
 * No HDR; fills viewport; lightweight for mid-range GPUs.
 */
function DeepSpaceBackgroundInner() {
  const { scene } = useThree()
  const textureRef = useRef<THREE.CanvasTexture | null>(null)
  const starPositions = useMemo(() => createStarPositions(), [])

  const pointsGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    return geo
  }, [starPositions])

  useEffect(() => {
    const tex = createGradientTexture()
    textureRef.current = tex
    scene.background = tex
    return () => {
      scene.background = null
      tex.dispose()
      textureRef.current = null
    }
  }, [scene])

  useEffect(() => {
    return () => pointsGeometry.dispose()
  }, [pointsGeometry])

  return (
    <points geometry={pointsGeometry} renderOrder={-10} frustumCulled={false}>
      <pointsMaterial
        size={STAR_SIZE}
        color="#e8eeff"
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        fog={false}
      />
    </points>
  )
}

export const DeepSpaceBackground = memo(DeepSpaceBackgroundInner)
