/**
 * Mock attack arc data — source/target for visualization.
 * arcType: red=attack, blue=defense, green=system
 * Targets randomized from geo.json country centroids.
 */
import { pickRandomArcPairExcluding } from '../map/geoCoordinates'

export type ArcType = 'attack' | 'defense' | 'system'

export type AttackArc = {
  id: string
  /** Source lon (degrees) */
  srcLon: number
  /** Source lat (degrees) */
  srcLat: number
  /** Target lon */
  dstLon: number
  /** Target lat */
  dstLat: number
  /** Severity for color/intensity */
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** Type for color: attack=red, defense=blue, system=green */
  arcType: ArcType
}

const ARC_TYPES: ArcType[] = ['attack', 'defense', 'system']
const SEVERITIES: AttackArc['severity'][] = ['low', 'medium', 'high', 'critical']

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Generate N random arcs from geo.json country centroids, không trùng đích */
export function generateRandomArcs(count: number): AttackArc[] {
  const arcs: AttackArc[] = []
  const excludeDsts: { lon: number; lat: number }[] = []
  for (let i = 0; i < count; i++) {
    const { src, dst } = pickRandomArcPairExcluding(excludeDsts)
    arcs.push({
      id: `arc-${i}`,
      srcLon: src.lon,
      srcLat: src.lat,
      dstLon: dst.lon,
      dstLat: dst.lat,
      severity: pickRandom(SEVERITIES),
      arcType: pickRandom(ARC_TYPES),
    })
    excludeDsts.push({ lon: dst.lon, lat: dst.lat })
  }
  return arcs
}

export const MOCK_ATTACK_ARCS: AttackArc[] = generateRandomArcs(8)
