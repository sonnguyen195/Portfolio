/**
 * Missile arc geometry — ported from cyber.js GTW.MissileSystem.
 *
 * Each arc = 100 sample points → 200 vertices (2 per point for tube sides).
 * Each vertex: [x, y, z, w]  where w = ±(u∈[0,1]) (sign = tube side).
 *
 * Render with gl.TRIANGLE_STRIP using the "missile" shader from all-shaders.glsl.
 * The shader uses `time` (0→1) to animate the bright segment sliding along the arc.
 */

import { type ProjectFn } from './mapProjection'

const SAMPLES    = 100            // points along the arc
const HEIGHT     = 0.005          // altitude factor — tuned for globe radius=10
export const MISSILE_FLOATS_PER_ARC = SAMPLES * 2 * 4  // 800 floats per arc
export const MISSILE_VERTICES_PER_ARC = SAMPLES * 2     // 200 vertices

/**
 * Write arc vertex data into `out` starting at `offset`.
 *
 * @param src   [lng, lat] source point
 * @param dst   [lng, lat] destination point
 * @param out   Float32Array to write into
 * @param offset float-index offset into `out`
 * @param project projection function (globe or flat)
 */
export function buildMissileArc(
  src: [number, number],
  dst: [number, number],
  out: Float32Array,
  offset: number,
  project: ProjectFn,
): void {
  const dLng = dst[0] - src[0]
  const dLat = dst[1] - src[1]
  const dist = Math.sqrt(dLng * dLng + dLat * dLat)  // angular distance in degrees

  const arcHeight = HEIGHT * dist  // scale height with distance

  const tmpFlat  = [0, 0, 0]
  const tmpWorld = [0, 0, 0]

  for (let i = 0; i < SAMPLES; i++) {
    const u = i / (SAMPLES - 1)                        // 0 → 1

    // Lerp in flat [lng, lat] space
    tmpFlat[0] = src[0] + dLng * u
    tmpFlat[1] = src[1] + dLat * u
    // Arc height: sine bell (0 at ends, max at middle)
    tmpFlat[2] = arcHeight * Math.sin(u * Math.PI) * 0.25

    project(tmpWorld, tmpFlat)

    const base = offset + i * 8
    // Left side vertex  (w = -u)
    out[base + 0] = tmpWorld[0]
    out[base + 1] = tmpWorld[1]
    out[base + 2] = tmpWorld[2]
    out[base + 3] = -u
    // Right side vertex (w = +u)
    out[base + 4] = tmpWorld[0]
    out[base + 5] = tmpWorld[1]
    out[base + 6] = tmpWorld[2]
    out[base + 7] = u
  }
}
