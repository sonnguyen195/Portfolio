/**
 * Mission markers — markers for mission/pickup locations.
 * Phase-aware: visible from mission_created, scale in.
 */
import { useMemo } from 'react'
import { MOCK_MISSIONS } from '../data'
import { useDroneFlightAnimation } from '../animations'

const MARKER_HEIGHT = 0.6

type Vec3 = [number, number, number]

function polygonToPositions(polygon: [number, number][]): Vec3[] {
  return polygon.map(([lat, lon]): Vec3 => {
    const x = (lon - 127) * 0.5
    const z = (lat - 37.5) * 0.5
    return [x, 0, z]
  })
}

function isMissionVisible(phase: string): boolean {
  return ['mission_created', 'route_drawn', 'drone_spawns', 'drone_takeoff', 'drone_follows_route', 'complete'].includes(phase)
}

export function MissionMarkers() {
  const { state } = useDroneFlightAnimation()
  const positions = useMemo((): Vec3[] => {
    const all: Vec3[] = []
    MOCK_MISSIONS.forEach((m) => {
      polygonToPositions(m.polygon).forEach((p) => all.push(p))
    })
    if (all.length === 0) {
      return [[-1.5, 0, -1.5], [1.5, 0, 1.5]]
    }
    return all
  }, [])

  const visible = isMissionVisible(state.phase)
  const scale = state.phase === 'mission_created'
    ? 0.3 + 0.7 * state.phaseProgress
    : 1

  if (!visible) return null

  return (
    <group scale={[scale, scale, scale]}>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, MARKER_HEIGHT / 2, 0]}>
            <cylinderGeometry args={[0.06, 0.1, MARKER_HEIGHT, 5]} />
            <meshBasicMaterial color="#00ff88" transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, MARKER_HEIGHT + 0.08, 0]}>
            <coneGeometry args={[0.08, 0.15, 5]} />
            <meshBasicMaterial color="#00ff88" transparent opacity={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
