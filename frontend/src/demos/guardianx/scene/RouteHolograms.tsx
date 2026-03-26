/**
 * Route holograms — lines connecting waypoints.
 * Phase-aware: draw progressively in route_drawn, full in drone_spawns+.
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useDroneFlightAnimation } from '../animations'
import { createRouteCurve } from './routeUtils'

const SEGMENTS = 64

function isRouteVisible(phase: string): boolean {
  return ['route_drawn', 'drone_spawns', 'drone_takeoff', 'drone_follows_route', 'complete'].includes(phase)
}

export function RouteHolograms() {
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const { state } = useDroneFlightAnimation()

  const { tubePoints, positions } = useMemo(() => {
    const c = createRouteCurve()
    const pts = c.getPoints(SEGMENTS)
    const arr = new Float32Array(pts.flatMap((p) => [p.x, p.y, p.z]))
    return { tubePoints: pts, positions: arr }
  }, [])

  useFrame(() => {
    if (!geomRef.current) return
    const geom = geomRef.current
    if (!isRouteVisible(state.phase)) {
      geom.setDrawRange(0, 0)
      return
    }
    const drawCount =
      state.phase === 'route_drawn'
        ? Math.max(2, Math.floor(state.phaseProgress * SEGMENTS) + 1)
        : tubePoints.length
    geom.setDrawRange(0, drawCount)
  })

  if (!isRouteVisible(state.phase)) return null

  return (
    <group>
      <line>
        <bufferGeometry ref={geomRef}>
          <bufferAttribute
            attach="attributes-position"
            count={tubePoints.length}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.6}
        />
      </line>
    </group>
  )
}
