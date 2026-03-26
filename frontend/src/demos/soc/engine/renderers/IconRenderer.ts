/**
 * Renders polygon "tower" icons using the "icon" shader from all-shaders.glsl.
 *
 * Each icon = 5 stacked GL_LINES polygon rings that rise and spread outward
 * as `time` increases — the exact Kaspersky cyberthreat map tower effect.
 */

import { createProgram, createStaticBuffer } from '../webGLHelpers'
import { type ShaderLib } from '../shaderParser'
import { buildIconShape, nSidesForType, ICON_LEVELS, type IconShape,
         buildConeGeometry, buildGridQuadGeometry } from '../iconGeometry'
import { buildPlacementMatrix } from '../mapProjection'
import { mat4 } from 'gl-matrix'

// ── Vivid glowing tower shaders ───────────────────────────────────────────────
const ICON_VERT_OVERRIDE = /* glsl */`
precision mediump float;
attribute vec3 vertex;
uniform mat4 mvp;
uniform mat4 mat;
uniform float time;
uniform float scale;
uniform vec3 view_position;
uniform float u_isFlat;   /* 1.0 = 2-D flat/ortho mode, 0.0 = 3-D globe */
uniform float u_zoom;     /* current camera zoom level */
varying float v_alpha;
varying float v_ring;

void main() {
  /* Rings spread outward and rise upward as time progresses */
  float lv     = vertex.z;
  float spread = 1.0 + time * 0.70 * lv;
  float height = -5.2 * lv * time;
  vec3 P = scale * spread * vec3(vertex.xy, height);
  P = P.xzy;
  P.y = -P.y;
  /* Globe: enlarge when camera is far away (zoomed out).
     Flat:  constant screen-size via 1/zoom — icons stay the same size
            regardless of ortho zoom level. */
  float distE     = length(view_position - mat[3].xyz);
  float globeBoost = 1.0 + smoothstep(14.0, 42.0, distE) * 1.15;
  float flatBoost  = 0.55 / max(u_zoom, 0.1);
  float boost = mix(globeBoost, flatBoost, u_isFlat);
  P *= boost;
  gl_Position = mvp * mat * vec4(P, 1.0);

  /* Bottom rings are brightest */
  v_alpha = 1.0 - lv / float(${ICON_LEVELS} + 1);
  v_ring  = lv;
}
`

const ICON_FRAG_OVERRIDE = /* glsl */`
precision mediump float;
uniform vec3  color;
uniform float time;
varying float v_alpha;
varying float v_ring;

void main() {
  float appear = smoothstep(0.0, 0.12, time);
  float vanish  = 1.0 - pow(time, 3.5);
  float base    = appear * vanish * v_alpha;

  float pulse = 0.65 + 0.35 * sin(time * 14.0 - v_ring * 2.2);
  float glow  = 1.0 + 0.85 * (1.0 - v_alpha);

  /* Saturated neon — same hue family as pillar / grid */
  vec3 neon = color * (4.2 * pulse * glow);
  vec3 sat  = mix(neon, normalize(max(color, vec3(0.001))) * length(color) * 5.0, 0.22);
  vec3 c    = sat;
  if (v_ring < 0.5) c = mix(c, vec3(1.0), 0.58 * appear);
  /* Extra rim bloom on outer rings */
  c += color * 0.45 * (1.0 - v_alpha) * pulse;

  gl_FragColor = vec4(c, base * 1.05);
}
`

// ── Cone (neon tower / inverted beam) ────────────────────────────────────────
// Ported 1:1 from cyber.js cone shader.
// Geometry: TRIANGLE_STRIP cylinder — y=0 base (narrow), y=1 top (wide).
const CONE_VERT = /* glsl */`
precision mediump float;
attribute vec3 position;
uniform mat4  mvp;
uniform mat4  mat;
uniform vec3  view_position;
uniform float u_isFlat;
uniform float u_zoom;
varying vec2  v_coord;
varying float v_rad;

void main() {
  v_coord = vec2(0.0, position.y);
  /* Slightly wider pillar, taller — matches ref “light column” */
  float s = 0.092 * mix(0.13, 0.44, position.y);
  vec3 P  = s * position;
  P.y    *= 6.5;
  float distE      = length(view_position - mat[3].xyz);
  float globeBoost = 1.0 + smoothstep(14.0, 42.0, distE) * 1.05;
  float flatBoost  = 0.55 / max(u_zoom, 0.1);
  P *= mix(globeBoost, flatBoost, u_isFlat);
  v_rad = length(vec2(P.x, P.z));
  gl_Position = mvp * mat * vec4(P, 1.0);
}
`
const CONE_FRAG = /* glsl */`
precision mediump float;
uniform vec3  color;
uniform float time;
varying vec2  v_coord;
varying float v_rad;

void main() {
  /* Same neon family as rings: outer = saturated color, axis = white-hot core */
  float h     = v_coord.y;
  float edgeF = smoothstep(0.02, 0.38, v_rad);
  float hot   = exp(-v_rad * 9.0) * (1.0 - h * 0.65);
  vec3  neon  = color * (2.8 + 3.5 * (1.0 - h));
  vec3  rgb   = mix(neon, vec3(1.0), min(0.92, hot * 1.15));
  rgb += color * (0.55 * edgeF) * (1.0 - h);
  rgb += color * pow(1.0 - h, 2.0) * 0.4;

  float alpha = (1.0 - h) * 1.2;
  alpha *= 1.0 - pow(2.0 * abs(time - 0.5), 2.0);
  alpha = min(1.0, alpha);

  gl_FragColor = vec4(rgb, alpha);
}
`

// ── Grid base (impact shader — procedural grid, ported from cyber.js) ─────────
const GRID_VERT = /* glsl */`
precision mediump float;
attribute vec2 position;
uniform mat4  mvp;
uniform mat4  mat;
uniform vec3  view_position;
uniform float u_isFlat;
uniform float u_zoom;
varying vec2  v_uv;

void main() {
  const float SCALE = 0.12;
  vec3 P = SCALE * vec3(2.0 * (position.x - 0.5), 0.005, 2.0 * (position.y - 0.5));
  float distE      = length(view_position - mat[3].xyz);
  float globeBoost = 1.0 + smoothstep(14.0, 42.0, distE) * 1.1;
  float flatBoost  = 0.55 / max(u_zoom, 0.1);
  P *= mix(globeBoost, flatBoost, u_isFlat);
  gl_Position = mvp * mat * vec4(P, 1.0);
  v_uv = position;
}
`
const GRID_FRAG = /* glsl */`
precision mediump float;
uniform vec3  color;
uniform float time;
varying vec2  v_uv;

void main() {
  float x = 0.0;
  vec2  t = 5.0 * (v_uv - 0.5);
  t = t - floor(t);
  if (t.x < 0.10) x += 2.0;
  if (t.y < 0.10) x += 2.0;

  float d      = length(v_uv - 0.5);
  float radial = 1.0 - smoothstep(0.22, 0.52, d);
  x *= radial;
  x  = max(x, 0.0);

  vec3 gridCol = color * x * 1.85;
  vec3 halo    = color * radial * 0.48;
  vec3 rgb     = gridCol + halo;

  float a = (1.0 - pow(2.0 * abs(time - 0.5), 2.0)) * 1.0;
  gl_FragColor = vec4(rgb, a);
}
`

export interface IconState {
  alive:      boolean
  startTime:  number
  lifetimeS:  number
  color:      [number, number, number]
  coord:      [number, number]     // [lng, lat]
  type:       string
  mat:        Float32Array         // 4×4 placement matrix (scale≈0.052, polygon rings)
  rawMat:     Float32Array         // 4×4 placement matrix (scale=1.0,  for cone & grid)
}

export const MAX_ICONS = 512
const ARC_LIFETIME_S   = 2.0      // short lifetime matches reference (~1-2s per icon)

/** Map type → GL buffer + draw info */
interface ShapeBuffer {
  buf:   WebGLBuffer
  shape: IconShape
}

export class IconRenderer {
  private gl:        WebGLRenderingContext
  private prog:      WebGLProgram
  private coneProg:  WebGLProgram
  private gridProg:  WebGLProgram
  private shapes:    Record<string, ShapeBuffer> = {}
  private coneBuf:   WebGLBuffer
  private coneCount: number
  private gridBuf:   WebGLBuffer
  private gridCount: number

  readonly icons: IconState[] = []

  constructor(gl: WebGLRenderingContext, _lib: ShaderLib) {
    this.gl       = gl
    this.prog     = createProgram(gl, ICON_VERT_OVERRIDE, ICON_FRAG_OVERRIDE)
    this.coneProg = createProgram(gl, CONE_VERT, CONE_FRAG)
    this.gridProg = createProgram(gl, GRID_VERT, GRID_FRAG)

    // Cone geometry
    const cone = buildConeGeometry(32)
    this.coneBuf   = createStaticBuffer(gl, new Float32Array(cone.floats))
    this.coneCount = cone.count

    // Grid quad geometry
    const grid = buildGridQuadGeometry()
    this.gridBuf   = createStaticBuffer(gl, new Float32Array(grid.floats))
    this.gridCount = grid.count

    // Pre-build shared VBOs for each polygon type
    const types = ['oas', 'ods', 'mav', 'wav', 'ids', 'vul', 'kas', 'rmw']
    for (const t of types) {
      const n = nSidesForType(t)
      const { floats, shape } = buildIconShape(n)
      const buf = createStaticBuffer(gl, new Float32Array(floats))
      this.shapes[t] = { buf, shape }
    }

    for (let i = 0; i < MAX_ICONS; i++) {
      this.icons.push({
        alive:     false,
        startTime: 0,
        lifetimeS: ARC_LIFETIME_S,
        color:     [1, 0.3, 0.1],
        coord:     [0, 0],
        type:      'oas',
        mat:       new Float32Array(16),
        rawMat:    new Float32Array(16),
      })
    }
  }

  spawn(
    coord:     [number, number],
    color:     [number, number, number],
    type:      string = 'oas',
    isGlobe:   boolean = true,
  ): boolean {
    const slot = this.icons.find(ic => !ic.alive)
    if (!slot) return false

    slot.alive     = true
    slot.startTime = performance.now()
    slot.lifetimeS = ARC_LIFETIME_S
    slot.color     = color
    slot.coord     = coord
    slot.type      = type
    buildPlacementMatrix(slot.mat,    coord, isGlobe, 0.058)   // rings — close to surface
    buildPlacementMatrix(slot.rawMat, coord, isGlobe, 1.0)    // cone + grid (unscaled)
    return true
  }

  /** Update placement matrices when projection changes */
  rebuildMatrices(isGlobe: boolean): void {
    for (const ic of this.icons) {
      if (ic.alive) {
        buildPlacementMatrix(ic.mat,    ic.coord, isGlobe, 0.058)
        buildPlacementMatrix(ic.rawMat, ic.coord, isGlobe, 1.0)
      }
    }
  }

  draw(mvp: Float32Array | mat4, nowMs: number, viewPos: Float32Array, isFlat = false, zoom = 1): void {
    const gl    = this.gl
    const mvpF  = mvp as Float32Array
    const flatF = isFlat ? 1.0 : 0.0

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)

    // ── Collect alive icons ────────────────────────────────────────────────
    const alive: Array<{ ic: IconState; t: number }> = []
    for (const ic of this.icons) {
      if (!ic.alive) continue
      const elapsed = (nowMs - ic.startTime) / 1000
      if (elapsed >= ic.lifetimeS) { ic.alive = false; continue }
      alive.push({ ic, t: elapsed / ic.lifetimeS })
    }
    if (alive.length === 0) { gl.disable(gl.BLEND); return }

    const vLocView = (prog: WebGLProgram) =>
      gl.getUniformLocation(prog, 'view_position')

    // ── Pass 1: Grid base ──────────────────────────────────────────────────
    {
      const prog = this.gridProg
      gl.useProgram(prog)
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'mvp'), false, mvpF)
      gl.uniform3fv(vLocView(prog), viewPos)
      gl.uniform1f(gl.getUniformLocation(prog, 'u_isFlat'), flatF)
      gl.uniform1f(gl.getUniformLocation(prog, 'u_zoom'),   zoom)
      gl.bindBuffer(gl.ARRAY_BUFFER, this.gridBuf)
      const posLoc = gl.getAttribLocation(prog, 'position')
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 8, 0)
      for (const { ic, t } of alive) {
        gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'mat'),   false, ic.rawMat)
        gl.uniform3fv(gl.getUniformLocation(prog, 'color'), ic.color)
        gl.uniform1f(gl.getUniformLocation(prog, 'time'),  t)
        gl.drawArrays(gl.TRIANGLES, 0, this.gridCount)
      }
      gl.disableVertexAttribArray(posLoc)
    }

    // ── Pass 2: Cone (neon spike) ──────────────────────────────────────────
    {
      const prog = this.coneProg
      gl.useProgram(prog)
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'mvp'), false, mvpF)
      gl.uniform3fv(vLocView(prog), viewPos)
      gl.uniform1f(gl.getUniformLocation(prog, 'u_isFlat'), flatF)
      gl.uniform1f(gl.getUniformLocation(prog, 'u_zoom'),   zoom)
      gl.bindBuffer(gl.ARRAY_BUFFER, this.coneBuf)
      const posLoc = gl.getAttribLocation(prog, 'position')
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 12, 0)
      for (const { ic, t } of alive) {
        gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'mat'),   false, ic.rawMat)
        gl.uniform3fv(gl.getUniformLocation(prog, 'color'), ic.color)
        gl.uniform1f(gl.getUniformLocation(prog, 'time'),  t)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.coneCount)
      }
      gl.disableVertexAttribArray(posLoc)
    }

    // ── Pass 3: Polygon rings ──────────────────────────────────────────────
    {
      const prog = this.prog
      gl.useProgram(prog)
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'mvp'), false, mvpF)
      gl.uniform3fv(vLocView(prog), viewPos)
      gl.uniform1f(gl.getUniformLocation(prog, 'u_isFlat'), flatF)
      gl.uniform1f(gl.getUniformLocation(prog, 'u_zoom'),   zoom)
      gl.uniform1f(gl.getUniformLocation(prog, 'scale'), 1.0)
      gl.lineWidth(2.0)
      for (const { ic, t } of alive) {
        const shapeInfo = this.shapes[ic.type] ?? this.shapes['oas']
        gl.bindBuffer(gl.ARRAY_BUFFER, shapeInfo.buf)
        const vLoc = gl.getAttribLocation(prog, 'vertex')
        gl.enableVertexAttribArray(vLoc)
        gl.vertexAttribPointer(vLoc, 3, gl.FLOAT, false, 12, 0)
        gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'mat'),   false, ic.mat)
        gl.uniform3fv(gl.getUniformLocation(prog, 'color'), ic.color)
        gl.uniform1f(gl.getUniformLocation(prog, 'time'), t)
        gl.drawArrays(gl.LINES, shapeInfo.shape.offset, shapeInfo.shape.count)
        gl.disableVertexAttribArray(vLoc)
      }
    }

    gl.disable(gl.BLEND)
  }
}
