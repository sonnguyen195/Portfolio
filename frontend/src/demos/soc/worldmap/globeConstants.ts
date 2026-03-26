/**
 * Shared globe constants for SOC world map.
 * GLOBE_RADIUS = 10 matches cyber.js (Kaspersky) project_ecef scale.
 */
export const GLOBE_RADIUS = 10
export const FLAT_SCALE = 0.04
/** Polygon gốc / base effect scale. Grid = 0.5 × BASE_SCALE. */
export const BASE_SCALE = 0.024

/** cyber.js project_ecef: [lon, lat, alt] -> ECEF. Use for arcs + effects (same coords). */
export function projectEcef(
  lon: number,
  lat: number,
  alt: number,
  r: number
): { x: number; y: number; z: number } {
  const n = (lon * Math.PI) / 180
  const latRad = (lat * Math.PI) / 180
  const i = Math.cos(latRad)
  const a = Math.sin(latRad)
  return {
    x: -(1 + alt) * i * Math.cos(n) * r,
    y: (1 + alt) * a * r,
    z: (1 + alt) * i * Math.sin(n) * r,
  }
}

/** cyber.js project_mercator: [lon, lat, alt] -> Mercator, scale by r */
export function projectMercator(
  lon: number,
  lat: number,
  alt: number,
  r: number
): { x: number; y: number; z: number } {
  const latRad = (lat * Math.PI) / 180
  const mercY = (90 / Math.PI) * Math.log(Math.tan(0.25 * Math.PI + 0.5 * latRad))
  const y = Math.max(-1, Math.min(1, mercY / 90))
  return {
    x: (-lon / 180) * r,
    y: y * r,
    z: -alt * r,
  }
}
