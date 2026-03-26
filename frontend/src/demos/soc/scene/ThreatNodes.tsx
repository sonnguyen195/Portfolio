/**
 * Threat nodes positioned around the globe.
 * Represent malicious IPs / threat sources.
 */
import { useMemo } from 'react'
import { GLOBE_RADIUS } from '../worldmap/globeConstants'
const NODE_COUNT = 8
const NODE_SIZE = 0.04

function sphericalToCartesian(phi: number, theta: number, r: number): [number, number, number] {
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ]
}

const THREAT_POSITIONS = Array.from({ length: NODE_COUNT }, (_, i) => {
  const phi = (i / NODE_COUNT) * Math.PI * 0.8 + Math.PI * 0.1
  const theta = (i * 0.7) % (Math.PI * 2)
  return sphericalToCartesian(phi, theta, GLOBE_RADIUS)
})

export function ThreatNodes() {
  const positions = useMemo(() => {
    const arr = new Float32Array(NODE_COUNT * 3)
    THREAT_POSITIONS.forEach((p, i) => {
      arr[i * 3] = p[0]
      arr[i * 3 + 1] = p[1]
      arr[i * 3 + 2] = p[2]
    })
    return arr
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={NODE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={NODE_SIZE}
        color="#ff4444"
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
