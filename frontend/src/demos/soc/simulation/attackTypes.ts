/**
 * Event taxonomy aligned with Kaspersky Cyberstat-style legend:
 * each line color = one detection / product channel (not random “attack types”).
 */

export const EVENT_CODES = ['oas', 'ods', 'mav', 'wav', 'ids', 'vul', 'kas', 'rmw'] as const

export type AttackType = (typeof EVENT_CODES)[number]

/** Stable column order (left → right) as in the reference UI */
export const EVENT_ORDER: readonly AttackType[] = [
  'oas', 'ods', 'mav', 'wav', 'ids', 'vul', 'kas', 'rmw',
]

export interface EventMeta {
  label:       string
  hex:         string
  rgb:         [number, number, number]
  description: string
}

/**
 * Colours matched to the reference legend (neon on dark).
 * RGB in linear 0–1 for WebGL; `hex` for React overlays.
 */
export const EVENT_META: Record<AttackType, EventMeta> = {
  oas: {
    label: 'OAS',
    hex: '#00ff66',
    rgb: [0.05, 1.0, 0.42],
    description: 'Online Access / web & network access scans',
  },
  ods: {
    label: 'ODS',
    hex: '#ff3333',
    rgb: [1.0, 0.22, 0.18],
    description: 'On-Demand Scan',
  },
  mav: {
    label: 'MAV',
    hex: '#ff8800',
    rgb: [1.0, 0.48, 0.08],
    description: 'Malware / file anti-virus',
  },
  wav: {
    label: 'WAV',
    hex: '#55ddff',
    rgb: [0.28, 0.82, 1.0],
    description: 'Web Anti-Virus',
  },
  ids: {
    label: 'IDS',
    hex: '#ff44aa',
    rgb: [1.0, 0.22, 0.62],
    description: 'Intrusion Detection',
  },
  vul: {
    label: 'VUL',
    hex: '#ffee22',
    rgb: [1.0, 0.94, 0.18],
    description: 'Vulnerability',
  },
  kas: {
    label: 'KAS',
    hex: '#c8a8ff',
    rgb: [0.74, 0.58, 1.0],
    description: 'Kaspersky Anti-Spam',
  },
  rmw: {
    label: 'RMW',
    hex: '#2244dd',
    rgb: [0.18, 0.32, 0.92],
    description: 'Removable / device control',
  },
}

/** WebGL line + icon tint */
export const ATTACK_COLORS: Record<AttackType, [number, number, number]> = {
  oas: EVENT_META.oas.rgb,
  ods: EVENT_META.ods.rgb,
  mav: EVENT_META.mav.rgb,
  wav: EVENT_META.wav.rgb,
  ids: EVENT_META.ids.rgb,
  vul: EVENT_META.vul.rgb,
  kas: EVENT_META.kas.rgb,
  rmw: EVENT_META.rmw.rgb,
}

/** Starting totals (from reference screenshot) — session increments on top */
export const EVENT_STATS_SEED: Record<AttackType, number> = {
  oas: 1_609_923,
  ods: 2_924_755,
  mav: 68_590,
  wav: 844_109,
  ids: 402_192,
  vul: 9_908,
  kas: 1_840_451,
  rmw: 23_545,
}

export interface GeoPoint {
  lon: number
  lat: number
  label?: string
}

export interface Attack {
  id:        string
  src:       GeoPoint
  dst:       GeoPoint
  type:      AttackType
  color:     [number, number, number]
  timestamp: number
}

export function hexForType(t: AttackType): string {
  return EVENT_META[t].hex
}
