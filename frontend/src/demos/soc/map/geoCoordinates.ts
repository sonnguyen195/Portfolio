/**
 * Country centroids extracted from custom.geo.json.
 * Used for random arc source/target selection.
 */
import centroids from './geoCentroids.json'

export type GeoPoint = { lon: number; lat: number }

/**
 * Filter: only keep points clearly on continental land masses.
 * Excludes island nations that visually appear to float in the ocean.
 */
function isMainlandPoint(p: GeoPoint): boolean {
  const { lon, lat } = p

  // — EXCLUSIONS (blacklist) —

  // Sub-Antarctic / Antarctica
  if (lat < -47) return false

  // Pacific islands (Fiji, Vanuatu, Solomon Is, Samoa, Tonga, Kiribati, Micronesia, etc.)
  if (lon > 130 && lon <= 180 && lat > -35 && lat < 20) return false
  // Hawaii, French Polynesia, Cook Islands (mid-East Pacific)
  if (lon < -130 && lat > -35 && lat < 35) return false
  // Remaining mid-Pacific islands e.g. Kiribati eastern
  if (lon > -180 && lon < -160 && lat > -15 && lat < 5) return false

  // Caribbean island nations (Jamaica, Trinidad, Puerto Rico, Martinique, etc.)
  // Caribbean bounding box: roughly lon -85 to -58, lat 9 to 24
  if (lon > -85 && lon < -58 && lat > 9 && lat < 24) return false

  // Indian Ocean islands (Maldives, Seychelles, Comoros, etc.)
  if (lon > 42 && lon < 78 && lat > -22 && lat < 10) return false

  // East Timor (Timor-Leste) — appears over ocean
  if (lon > 124 && lon < 128 && lat > -10 && lat < -7) return false

  // Falkland Islands / remote South Atlantic
  if (lon > -65 && lon < -55 && lat < -45) return false

  // Iceland (appears isolated in North Atlantic)
  if (lon > -25 && lon < -12 && lat > 62 && lat < 67) return false

  // Greenland: though technically land, appears as isolated island
  if (lon > -60 && lon < -15 && lat > 60) return false

  return true
}

const ALL_POINTS: GeoPoint[] = centroids as GeoPoint[]
const POINTS: GeoPoint[] = ALL_POINTS.filter(isMainlandPoint)

export function getGeoPoints(): GeoPoint[] {
  return POINTS
}

export function pickRandomPoint(): GeoPoint {
  return POINTS[Math.floor(Math.random() * POINTS.length)]
}

const MIN_ARC_DIST = 5

export function pickRandomArcPair(): { src: GeoPoint; dst: GeoPoint } {
  const src = pickRandomPoint()
  let dst = pickRandomPoint()
  let attempts = 0
  while (
    (dst.lon === src.lon && dst.lat === src.lat) ||
    (Math.abs(dst.lon - src.lon) < MIN_ARC_DIST && Math.abs(dst.lat - src.lat) < MIN_ARC_DIST)
  ) {
    dst = pickRandomPoint()
    if (++attempts > 50) break
  }
  return { src, dst }
}

/** Khoảng cách tối thiểu giữa các điểm đích (degrees) để tránh đè. */
const MIN_DST_SEPARATION = 8

function distDeg(a: GeoPoint, b: GeoPoint): number {
  return Math.sqrt((a.lon - b.lon) ** 2 + (a.lat - b.lat) ** 2)
}

export function pickRandomArcPairExcluding(excludeDsts: GeoPoint[]): { src: GeoPoint; dst: GeoPoint } {
  const src = pickRandomPoint()
  let dst = pickRandomPoint()
  let attempts = 0
  const maxAttempts = 80
  while (attempts < maxAttempts) {
    const sameAsSrc = dst.lon === src.lon && dst.lat === src.lat
    const tooCloseToSrc = Math.abs(dst.lon - src.lon) < MIN_ARC_DIST && Math.abs(dst.lat - src.lat) < MIN_ARC_DIST
    const tooCloseToExisting = excludeDsts.some((e) => distDeg(dst, e) < MIN_DST_SEPARATION)
    if (!sameAsSrc && !tooCloseToSrc && !tooCloseToExisting) break
    dst = pickRandomPoint()
    attempts++
  }
  return { src, dst }
}
