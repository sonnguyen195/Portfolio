/**
 * CountryLabels — canvas overlay that renders:
 *   • Country/region name labels (globe: ECEF projection; flat: Mercator projection)
 *   • Attack-type labels (OAS, MAV, …) near each active icon in both modes
 *
 * Each frame:
 *  1. Convert lat/lon → world position (ECEF or Mercator depending on mode)
 *  2. Multiply by the engine's MVP matrix → clip space
 *  3. Divide by w → NDC → canvas pixel
 *  4. Draw text only for visible / in-bounds points
 */
import { useEffect, useRef } from 'react'
import type { SocWebGLEngine } from '../engine/SocWebGLEngine'
import { EVENT_META }         from '../simulation/attackTypes'

// ─── Country centroids ──────────────────────────────────────────────────────

const LABELS: Array<{ name: string; lon: number; lat: number }> = [
  { name: 'RUSSIA',      lon:  95,  lat:  62 },
  { name: 'CANADA',      lon: -96,  lat:  60 },
  { name: 'USA',         lon: -100, lat:  38 },
  { name: 'CHINA',       lon:  103, lat:  35 },
  { name: 'BRAZIL',      lon:  -53, lat: -12 },
  { name: 'AUSTRALIA',   lon:  134, lat: -26 },
  { name: 'INDIA',       lon:   79, lat:  22 },
  { name: 'GREENLAND',   lon:  -41, lat:  72 },
  { name: 'MONGOLIA',    lon:  103, lat:  47 },
  { name: 'ALASKA',      lon: -153, lat:  64 },
  { name: 'ARGENTINA',   lon:  -65, lat: -36 },
  { name: 'KAZAKH',      lon:   66, lat:  48 },
  { name: 'AFRICA',      lon:   22, lat:   0 },
  { name: 'EUROPE',      lon:   18, lat:  52 },
  { name: 'INDONESIA',   lon:  118, lat:  -4 },
  { name: 'SCANDINAVIA', lon:   18, lat:  66 },
  { name: 'MEXICO',      lon: -102, lat:  24 },
  { name: 'SAUDI',       lon:   44, lat:  24 },
  { name: 'ANTARCTICA',  lon:    0, lat: -80 },
]

// ─── Math helpers ────────────────────────────────────────────────────────────

const DEG2RAD = Math.PI / 180
const GLOBE_R  = 10   // must match mapProjection GLOBE_RADIUS

/** Convert lat/lon → ECEF world pos (same convention as projectECEF in mapProjection.ts) */
function lngLatToECEF(lon: number, lat: number): [number, number, number] {
  const la = lat * DEG2RAD
  const lo = lon * DEG2RAD
  const r  = GLOBE_R * 1.01   // slightly above surface so labels clear the globe
  return [
    -r * Math.cos(la) * Math.cos(lo),
     r * Math.sin(la),
     r * Math.cos(la) * Math.sin(lo),
  ]
}

/** Convert lat/lon → Mercator world pos (same convention as projectMercator in mapProjection.ts) */
function lngLatToMercator(lon: number, lat: number): [number, number, number] {
  const x = lon * DEG2RAD
  const clampedLat = Math.max(-85, Math.min(85, lat))
  const y = Math.log(Math.tan(clampedLat * DEG2RAD * 0.5 + Math.PI / 4))
  return [x, y, 0]
}

/** Column-major mat4 × vec4 (WebGL / gl-matrix convention) */
function mvpMul(m: Float32Array, x: number, y: number, z: number): [number, number, number, number] {
  return [
    m[0]*x + m[4]*y + m[8]*z  + m[12],
    m[1]*x + m[5]*y + m[9]*z  + m[13],
    m[2]*x + m[6]*y + m[10]*z + m[14],
    m[3]*x + m[7]*y + m[11]*z + m[15],
  ]
}

/** Dot product of two 3-vectors */
function dot3(a: ArrayLike<number>, b: ArrayLike<number>): number {
  return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
}

function len3(a: [number, number, number]): number {
  return Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2])
}

/**
 * Project a world-space point through MVP → screen pixel.
 * Returns null when the point is behind the camera or outside view.
 */
function projectToScreen(
  mvp: Float32Array,
  wx: number, wy: number, wz: number,
  w: number, h: number,
): [number, number] | null {
  const [cx, cy, _cz, cw] = mvpMul(mvp, wx, wy, wz)
  if (cw <= 0) return null
  const nx = cx / cw
  const ny = cy / cw
  // Allow a small margin outside NDC so labels near the edge still draw
  if (Math.abs(nx) > 1.15 || Math.abs(ny) > 1.15) return null
  return [
    (nx *  0.5 + 0.5) * w,
    (ny * -0.5 + 0.5) * h,   // NDC y+ = up; canvas y+ = down
  ]
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  engineRef:  React.RefObject<SocWebGLEngine | null>
  isGlobe:    boolean
  earthStyle: number   // 0 = Mono Tech | 1 = Neon Cyber | 2 = Realistic
}

/** Country label colour per earth style */
function labelColor(style: number, alpha: number): string {
  if (style < 0.5) return `rgba(100, 215, 148, ${alpha * 0.50})`  // emerald
  if (style < 1.5) return `rgba(  0, 220, 255, ${alpha * 0.55})`  // cyan
  return              `rgba(255, 255, 255, ${alpha * 0.40})`       // white
}

export function CountryLabels({ engineRef, isGlobe, earthStyle }: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv  = cvRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf: number

    const frame = () => {
      // Keep canvas pixel-size in sync with CSS size
      const rect = cv.getBoundingClientRect()
      const w    = Math.round(rect.width)
      const h    = Math.round(rect.height)
      if (cv.width !== w)  cv.width  = w
      if (cv.height !== h) cv.height = h

      ctx.clearRect(0, 0, w, h)

      const eng = engineRef.current
      if (!eng) { raf = requestAnimationFrame(frame); return }

      const mvp = eng.currentMVP

      // ── Country labels ────────────────────────────────────────────────────
      const fs = Math.max(6, Math.min(11, w * 0.0075))
      ctx.font         = `${fs}px "Courier New", monospace`
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'

      if (isGlobe) {
        // Globe mode: ECEF + hemisphere culling
        const viewPos = eng.currentViewPos
        const vLen    = len3([viewPos[0], viewPos[1], viewPos[2]])

        for (const lbl of LABELS) {
          const [wx, wy, wz] = lngLatToECEF(lbl.lon, lbl.lat)

          // Visibility: dot(surfNorm, eyeDir) > 0.28 (horizon threshold)
          const wLen = len3([wx, wy, wz])
          const d = dot3(
            [wx/wLen, wy/wLen, wz/wLen],
            [viewPos[0]/vLen, viewPos[1]/vLen, viewPos[2]/vLen],
          )
          if (d < 0.28) continue

          const pt = projectToScreen(mvp, wx, wy, wz, w, h)
          if (!pt) continue

          const alpha = Math.min(1, (d - 0.28) / 0.22)
          _drawCountryLabel(ctx, lbl.name, pt[0], pt[1], alpha, earthStyle)
        }
      } else {
        // Flat mode: Mercator projection, no hemisphere culling
        for (const lbl of LABELS) {
          const [wx, wy, wz] = lngLatToMercator(lbl.lon, lbl.lat)
          const pt = projectToScreen(mvp, wx, wy, wz, w, h)
          if (!pt) continue
          _drawCountryLabel(ctx, lbl.name, pt[0], pt[1], 1.0, earthStyle)
        }
      }

      // ── Attack-type labels (both modes) ───────────────────────────────────
      // Disabled: attack point labels (ODS, MAV, VUL, etc.) are not needed
      // const icons = eng.aliveIcons
      // if (icons.length > 0) {
      //   const iconFs = Math.max(7, Math.min(13, w * 0.009))
      //   ctx.font = `bold ${iconFs}px "Courier New", monospace`

      //   for (const ic of icons) {
      //     // Fade out label as icon lifetime approaches end (t → 1)
      //     const alpha = Math.max(0, 1 - ic.t * 1.4)
      //     if (alpha < 0.05) continue

      //     // World position depends on mode
      //     let wx: number, wy: number, wz: number
      //     if (isGlobe) {
      //       ;[wx, wy, wz] = lngLatToECEF(ic.coord[0], ic.coord[1])
      //     } else {
      //       ;[wx, wy, wz] = lngLatToMercator(ic.coord[0], ic.coord[1])
      //     }

      //     const pt = projectToScreen(mvp, wx, wy, wz, w, h)
      //     if (!pt) continue

      //     const meta = EVENT_META[ic.type as keyof typeof EVENT_META]
      //     const label = meta?.label ?? ic.type.toUpperCase()
      //     const hex   = meta?.hex   ?? '#00ffaa'

      //     // Offset label slightly above the icon centre
      //     const offsetY = -iconFs * 2.2

      //     // Dark halo for legibility
      //     ctx.lineWidth    = 3
      //     ctx.strokeStyle  = `rgba(0,0,0,${alpha * 0.7})`
      //     ctx.strokeText(label, pt[0], pt[1] + offsetY)

      //     // Colored label
      //     ctx.fillStyle = hexWithAlpha(hex, alpha)
      //     ctx.fillText(label, pt[0], pt[1] + offsetY)
      //   }
      // }

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [engineRef, isGlobe, earthStyle])

  return (
    <canvas
      ref={cvRef}
      style={{
        position:      'absolute',
        inset:         0,
        width:         '100%',
        height:        '100%',
        pointerEvents: 'none',
        zIndex:        2,
      }}
    />
  )
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _drawCountryLabel(
  ctx:    CanvasRenderingContext2D,
  name:   string,
  sx:     number,
  sy:     number,
  alpha:  number,
  style:  number,
): void {
  ctx.fillStyle    = `rgba(0, 0, 0, ${alpha * 0.55})`
  ctx.lineWidth    = 2.5
  ctx.strokeStyle  = `rgba(0, 0, 0, ${alpha * 0.4})`
  ctx.strokeText(name, sx, sy)
  ctx.fillText(name, sx, sy)
  ctx.fillStyle = labelColor(style, alpha)
  ctx.fillText(name, sx, sy)
}

/** Convert a hex colour + alpha → rgba() string */
function hexWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
