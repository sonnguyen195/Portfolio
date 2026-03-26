/**
 * City map data for GuardianX 3D visualization.
 * Multiple city districts with buildings, terminals, and route waypoints.
 */
import type { CityBlock, TerminalNode, MissionZone } from './types'

// ── City Districts ───────────────────────────────────────────────────────────

const DISTRICT_CONFIGS = [
  { name: 'Downtown', cx: 0, cz: 0, count: 18, spread: 3.5, minH: 0.8, maxH: 3.5 },
  { name: 'Industrial', cx: -7, cz: -5, count: 12, spread: 2.8, minH: 0.3, maxH: 1.2 },
  { name: 'Harbor', cx: 8, cz: -4, count: 8, spread: 2.2, minH: 0.2, maxH: 0.8 },
  { name: 'Residential North', cx: -3, cz: 7, count: 14, spread: 3, minH: 0.4, maxH: 1.5 },
  { name: 'Tech Park', cx: 6, cz: 6, count: 10, spread: 2.5, minH: 0.5, maxH: 2.0 },
  { name: 'Airport', cx: -8, cz: 5, count: 4, spread: 2, minH: 0.15, maxH: 0.4 },
]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function generateCityBlocks(): CityBlock[] {
  const blocks: CityBlock[] = []
  const rand = seededRandom(42)

  for (const district of DISTRICT_CONFIGS) {
    for (let i = 0; i < district.count; i++) {
      const x = district.cx + (rand() - 0.5) * district.spread * 2
      const z = district.cz + (rand() - 0.5) * district.spread * 2
      const w = 0.25 + rand() * 0.55
      const d = 0.25 + rand() * 0.55
      const h = district.minH + rand() * (district.maxH - district.minH)
      blocks.push({
        x, z,
        width: w,
        depth: d,
        height: h,
        lit: rand() > 0.3,
      })
    }
  }
  return blocks
}

// ── Terminal / Hub nodes ─────────────────────────────────────────────────────

export const TERMINAL_NODES: TerminalNode[] = [
  { id: 'hub-central', position: [0, 0.5], label: 'Central Hub', type: 'hub', active: true, color: [0, 0.83, 1] },
  { id: 'hub-north', position: [-3, 7], label: 'North Hub', type: 'hub', active: true, color: [0, 0.83, 1] },
  { id: 'hub-south', position: [1, -5], label: 'South Hub', type: 'hub', active: true, color: [0, 0.83, 1] },
  { id: 'hub-east', position: [7, 1], label: 'East Hub', type: 'hub', active: true, color: [0, 0.83, 1] },
  { id: 'hub-west', position: [-7, -2], label: 'West Hub', type: 'hub', active: true, color: [0, 0.83, 1] },
  { id: 'wp-airport', position: [-8, 5], label: 'Airport Terminal', type: 'waypoint', active: true, color: [0, 1, 0.5] },
  { id: 'wp-harbor', position: [8, -4], label: 'Harbor Terminal', type: 'waypoint', active: true, color: [0, 1, 0.5] },
  { id: 'wp-techpark', position: [6, 6], label: 'Tech Park', type: 'waypoint', active: true, color: [0.5, 0.8, 1] },
  { id: 'target-hospital', position: [3, 3], label: 'Hospital', type: 'target', active: false, color: [1, 0.3, 0.3] },
  { id: 'target-warehouse', position: [-5, -4], label: 'Warehouse', type: 'target', active: false, color: [1, 0.6, 0] },
]

// ── Mission Zones ────────────────────────────────────────────────────────────

export const MISSION_ZONES: MissionZone[] = [
  { id: 'zone-alpha', center: [0, 0], radius: 4, color: [0, 0.83, 1], active: false, pulsePhase: 0, label: 'Zone Alpha' },
  { id: 'zone-bravo', center: [-7, -5], radius: 3, color: [0, 1, 0.53], active: false, pulsePhase: 0, label: 'Zone Bravo' },
  { id: 'zone-charlie', center: [6, 6], radius: 3.5, color: [1, 0.6, 0], active: false, pulsePhase: 0, label: 'Zone Charlie' },
  { id: 'zone-delta', center: [-3, 7], radius: 3, color: [0.8, 0.2, 1], active: false, pulsePhase: 0, label: 'Zone Delta' },
  { id: 'zone-echo', center: [8, -4], radius: 2.5, color: [1, 0.3, 0.3], active: false, pulsePhase: 0, label: 'Zone Echo' },
]

// ── Pre-defined flight routes ────────────────────────────────────────────────

export const FLIGHT_ROUTES: Record<string, [number, number, number][]> = {
  'central-to-north': [
    [0, 2.5, 0.5], [-0.5, 3, 2], [-1.5, 3.5, 4], [-2, 3.5, 5.5], [-3, 3, 7],
  ],
  'central-to-east': [
    [0, 2.5, 0.5], [1.5, 3, 0], [3, 3.5, 0.5], [5, 3.5, 0.8], [7, 3, 1],
  ],
  'central-to-south': [
    [0, 2.5, 0.5], [0.2, 3, -1], [0.5, 3.5, -2.5], [0.8, 3.5, -4], [1, 3, -5],
  ],
  'central-to-west': [
    [0, 2.5, 0.5], [-1.5, 3, 0], [-3, 3.5, -0.5], [-5, 3.5, -1], [-7, 3, -2],
  ],
  'north-to-airport': [
    [-3, 3, 7], [-4, 3.5, 6.5], [-5.5, 3.5, 6], [-7, 3, 5.5], [-8, 2.5, 5],
  ],
  'east-to-harbor': [
    [7, 3, 1], [7.5, 3.5, 0], [8, 3.5, -1.5], [8, 3, -3], [8, 2.5, -4],
  ],
  'patrol-downtown': [
    [-2, 3, -2], [2, 3.2, -2], [2, 3.4, 2], [-2, 3.2, 2], [-2, 3, -2],
  ],
  'patrol-wide': [
    [-6, 3, -4], [0, 4, -6], [7, 3.5, -3], [7, 4, 3], [3, 4.5, 7],
    [-4, 4, 7], [-8, 3.5, 3], [-6, 3, -4],
  ],
  'emergency-hospital': [
    [0, 2.5, 0.5], [0.5, 4, 0.5], [1, 5, 1], [2, 5, 2], [3, 4, 3], [3, 2.5, 3],
  ],
  'emergency-warehouse': [
    [0, 2.5, 0.5], [-1, 4, 0], [-2, 5, -1], [-3.5, 5, -2.5], [-5, 4, -4], [-5, 2.5, -4],
  ],
}

// ── City label positions ─────────────────────────────────────────────────────

export const DISTRICT_LABELS: { name: string; position: [number, number] }[] = [
  { name: 'DOWNTOWN', position: [0, 0] },
  { name: 'INDUSTRIAL', position: [-7, -5] },
  { name: 'HARBOR', position: [8, -4] },
  { name: 'RESIDENTIAL', position: [-3, 7] },
  { name: 'TECH PARK', position: [6, 6] },
  { name: 'AIRPORT', position: [-8, 5] },
]
