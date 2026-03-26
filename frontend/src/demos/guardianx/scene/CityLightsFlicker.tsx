/**
 * City lights flicker — ambient building light animation.
 * Ambient motion: varied flicker patterns, warm/cool mix.
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const LIGHT_COUNT = 10
const SPREAD = 5.5

const LIGHT_COLORS = ['#ffaa44', '#ffcc66', '#ff8844', '#88ccff', '#aaddff'] as const

type LightConfig = { position: [number, number, number]; color: string; speed: number }

function createLightConfigs(): LightConfig[] {
  const configs: LightConfig[] = []
  for (let i = 0; i < LIGHT_COUNT; i++) {
    const x = (Math.random() - 0.5) * SPREAD * 2
    const z = (Math.random() - 0.5) * SPREAD * 2
    const y = 0.2 + Math.random() * 1.6
    const color = LIGHT_COLORS[i % LIGHT_COLORS.length]
    const speed = 2.5 + Math.random() * 5
    configs.push({ position: [x, y, z], color, speed })
  }
  return configs
}

function FlickeringLight({ position, color, speed, index }: LightConfig & { index: number }) {
  const ref = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * speed + index * 0.5
    const flicker = 0.5 + 0.5 * Math.sin(t * 3) * Math.sin(t * 5)
    ref.current.intensity = flicker * 0.45
  })

  return (
    <pointLight
      ref={ref}
      position={position}
      color={color}
      intensity={0.5}
      distance={2.2}
      decay={2}
    />
  )
}

export function CityLightsFlicker() {
  const configs = useMemo(() => createLightConfigs(), [])

  return (
    <group>
      {configs.map((cfg, i) => (
        <FlickeringLight key={i} {...cfg} index={i} />
      ))}
    </group>
  )
}
