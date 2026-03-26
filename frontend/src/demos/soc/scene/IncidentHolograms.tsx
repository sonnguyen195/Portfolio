/**
 * Incident holograms — semi-transparent cards for incident data.
 * Positioned around the globe. Appear during incident_hologram phase.
 */
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MOCK_INCIDENTS } from '../data'
import { useIncidentAnimation } from '../animations'
import { GLOBE_RADIUS } from '../worldmap/globeConstants'
const CARD_WIDTH = 0.5
const CARD_HEIGHT = 0.32

function sphericalToCartesian(phi: number, theta: number, r: number): [number, number, number] {
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ]
}

function IncidentHologram({
  index,
  severity,
}: {
  index: number
  severity: string
}) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  const { state } = useIncidentAnimation()

  const phi = (index / Math.max(1, MOCK_INCIDENTS.length)) * Math.PI * 0.6 + Math.PI * 0.2
  const theta = (index * 1.2) % (Math.PI * 2)
  const [x, y, z] = sphericalToCartesian(phi, theta, GLOBE_RADIUS)

  const color = severity === 'Critical' ? '#ff4444' : severity === 'High' ? '#ff8844' : '#00d4ff'

  const visible =
    state.phase === 'incident_hologram' ||
    state.phase === 'defense_shield' ||
    state.phase === 'complete'

  useFrame((frameState) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position)
    }
    if (meshRef.current && visible) {
      const baseOpacity = state.phase === 'incident_hologram'
        ? 0.1 + state.phaseProgress * 0.35
        : 0.3
      const pulse = 0.5 + 0.5 * Math.sin(frameState.clock.elapsedTime * 2 + index)
      const mat = meshRef.current.material as THREE.MeshBasicMaterial
      if (mat) mat.opacity = Math.min(1, baseOpacity + pulse * 0.15)
    }
  })

  return (
    <group ref={groupRef} position={[x, y, z]}>
      <mesh ref={meshRef} visible={visible}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {visible && (
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT)]} />
          <lineBasicMaterial color={color} transparent opacity={0.6} />
        </lineSegments>
      )}
    </group>
  )
}

export function IncidentHolograms() {
  return (
    <group>
      {MOCK_INCIDENTS.map((inc, i) => (
        <IncidentHologram key={inc.id} index={i} severity={inc.severity} />
      ))}
    </group>
  )
}
