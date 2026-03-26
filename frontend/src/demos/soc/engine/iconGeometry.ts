/**
 * Polygon icon geometry — ported from cyber.js GTW.MissileSystem.init_icons().
 *
 * Each icon = 5 stacked polygon rings, each ring drawn as GL_LINES pairs.
 * Vertex: [cos(θ), sin(θ), level]  where level ∈ {0,1,2,3,4}
 *
 * The "icon" shader from all-shaders.glsl animates the rings spreading
 * outward and rising, then fading — identical to the Kaspersky tower effect.
 */

export interface IconShape {
  offset: number   // float-index into shared vertex buffer
  count: number   // number of vertices to draw with gl.LINES
}

export const ICON_LEVELS = 5  // stacked ring levels — matches cyber.js original (5)

/**
 * Build vertex data for a polygon icon with `nSides` sides.
 * Returns { floats, shape } — floats for the GPU buffer, shape for draw calls.
 *
 * nSides > 0 → regular polygon (closed)
 * nSides < 0 → open polygon (open = half-circle shape, used by cyber.js)
 */
export function buildIconShape(nSides: number): { floats: number[]; shape: IconShape } {
  const floats: number[] = []
  const shapeOffset = 0
  const open = nSides < 0
  const n = Math.abs(nSides)
  const step = open ? Math.PI / n : (2 * Math.PI) / n

  for (let lv = 0; lv < ICON_LEVELS; lv++) {
    let angle = 0
    for (let c = 0; c < n; c++) {
      floats.push(Math.cos(angle), Math.sin(angle), lv)
      floats.push(Math.cos(angle + step), Math.sin(angle + step), lv)
      angle += step
    }
    if (open) {
      floats.push(Math.cos(angle), Math.sin(angle), lv)
      floats.push(Math.cos(0), Math.sin(0), lv)
    }
  }

  return {
    floats,
    shape: { offset: shapeOffset, count: floats.length / 3 },
  }
}

// ─── Cone geometry ────────────────────────────────────────────────────────────
/**
 * Cylinder TRIANGLE_STRIP matching cyber.js exactly:
 *   position = (cos θ, y, sin θ)  y=0 base (narrow), y=1 top (wide)
 *
 * The cone shader flares it outward: wider at top → inverted tower / beam effect.
 * Drawn with gl.TRIANGLE_STRIP.
 */
export function buildConeGeometry(segments = 32): { floats: number[]; count: number } {
  const floats: number[] = []
  for (let n = 0; n < segments; n++) {
    const r = (Math.PI * 2 * n) / (segments - 1)
    const c = Math.cos(r)
    const s = Math.sin(r)
    floats.push(c, 0, s)   // base ring (y=0, narrow)
    floats.push(c, 1, s)   // top ring  (y=1, wide)
  }
  return { floats, count: floats.length / 3 }
}

// ─── Grid quad geometry ───────────────────────────────────────────────────────
/**
 * Flat quad (two triangles) with UV [0..1]. Used for the procedural grid base.
 * position = (u, v)
 */
export function buildGridQuadGeometry(): { floats: number[]; count: number } {
  const floats = [
    0, 0,  1, 0,  0, 1,   // tri 1
    1, 0,  1, 1,  0, 1,   // tri 2
  ]
  return { floats, count: 6 }
}

/** Polygon sides per event channel (visual variety on the map) */
export const ICON_SHAPES: Record<string, number> = {
  oas: 6,   // hex
  ods: 4,   // square
  mav: 3,   // triangle
  wav: 5,   // pentagon
  ids: 6,
  vul: 4,
  kas: 8,   // octagon
  rmw: 3,
}

export function nSidesForType(arcType: string): number {
  return ICON_SHAPES[arcType] ?? 6
}
