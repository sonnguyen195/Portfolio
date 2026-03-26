/**
 * Map projection functions — ported 1:1 from cyber.js.
 *
 * Input coords: [longitude_deg, latitude_deg, altitude]
 * Output: [x, y, z] in world units (globe radius = 10)
 *
 * Both projections scale by 10 so the globe/map fits the camera at distance ~25.
 */

/** Extra radial altitude so arcs/icons sit above vertex-displaced land (see EarthRenderer u_extrude). */
export const GLOBE_SURFACE_ALT_BOOST = 0.038

const DEG2RAD = Math.PI / 180

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

/** Flat Mercator projection — used for 2D map mode */
export function projectMercator(out: Float32Array | number[], coords: ArrayLike<number>): void {
  const lng = coords[0]
  const lat = coords[1]
  const alt = coords[2] ?? 0
  const o = Math.PI * lat / 180
  const i = (90 / Math.PI) * Math.log(Math.tan(0.25 * Math.PI + 0.5 * o))
  out[0] = (-lng / 180) * 10
  out[1] = clamp(i / 90, -1, 1) * 10
  out[2] = -alt * 10
}

/** ECEF (Earth-Centred Earth-Fixed) projection — used for 3D globe mode */
export function projectECEF(out: Float32Array | number[], coords: ArrayLike<number>): void {
  const lng = coords[0] * DEG2RAD
  const lat = coords[1] * DEG2RAD
  const alt = coords[2] ?? 0
  const cosLat = Math.cos(lat)
  const sinLat = Math.sin(lat)
  const r = (1 + alt) * 10          // globe radius = 10
  out[0] = -r * cosLat * Math.cos(lng)
  out[1] =  r * sinLat
  out[2] =  r * cosLat * Math.sin(lng)
}

export type ProjectFn = (out: Float32Array | number[], coords: ArrayLike<number>) => void

/**
 * Build the 4×4 placement matrix (column-major, WebGL order) that positions
 * an icon/cone at a given coordinate, oriented tangent to the surface.
 *
 * Globe mode: orient Y-axis outward (radial).
 * Flat mode:  identity rotated -90° around X (so Y points "up" in screen space).
 */
export function buildPlacementMatrix(
  out: Float32Array,            // 16 elements, column-major
  coordLngLat: ArrayLike<number>,
  isGlobe: boolean,
  scale?: number,
): void {
  const pos = [0, 0, 0]
  if (isGlobe) {
    projectECEF(pos, [coordLngLat[0], coordLngLat[1], GLOBE_SURFACE_ALT_BOOST])
  } else {
    projectMercator(pos, coordLngLat)
  }

  if (isGlobe) {
    // Radial (Y) = normalize(pos)
    const len = Math.sqrt(pos[0] ** 2 + pos[1] ** 2 + pos[2] ** 2)
    const ay = pos[0] / len, bY = pos[1] / len, cy = pos[2] / len  // up = radial

    // Right (X) = cross(radial, [0,1,0]) — east direction
    let rx = cy * 1 - 0 * bY   // cross([ay,bY,cy], [0,1,0])
    let ry = 0 * ay  - ay * 0
    let rz = ay * 0  - cy * ay
    rx = bY * 0  - cy * 1   // simplified cross product with [0,1,0]
    ry = cy * 0  - ay * 0
    rz = ay * 1  - bY * 0
    // cross([ax,ay,az], [0,1,0]) = [ay*0 - az*1, az*0 - ax*0, ax*1 - ay*0]
    //                             = [-az, 0, ax]
    rx = -cy; ry = 0; rz = ay
    const rLen = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1
    rx /= rLen; ry /= rLen; rz /= rLen

    // Forward (Z) = cross(right, radial)
    const fz0 = ry * cy - rz * bY
    const fz1 = rz * ay - rx * cy
    const fz2 = rx * bY - ry * ay

    const s = scale ?? 1
    // Column-major 4×4:  col0 = right, col1 = radial(up), col2 = forward, col3 = position
    out[ 0] = rx * s;  out[ 1] = ry * s;  out[ 2] = rz * s;  out[ 3] = 0
    out[ 4] = ay * s;  out[ 5] = bY * s;  out[ 6] = cy * s;  out[ 7] = 0
    out[ 8] = fz0 * s; out[ 9] = fz1 * s; out[10] = fz2 * s; out[11] = 0
    out[12] = pos[0];  out[13] = pos[1];  out[14] = pos[2];  out[15] = 1
  } else {
    // pos already from projectMercator above
    // Flat mode: identity rotated -90° around X so that polygon Y maps to screen up
    const s = scale ?? 1
    out[ 0] = s;  out[ 1] = 0;   out[ 2] = 0;   out[ 3] = 0
    out[ 4] = 0;  out[ 5] = 0;   out[ 6] = s;   out[ 7] = 0
    out[ 8] = 0;  out[ 9] = -s;  out[10] = 0;   out[11] = 0
    out[12] = pos[0]; out[13] = pos[1]; out[14] = pos[2]; out[15] = 1
  }
}
