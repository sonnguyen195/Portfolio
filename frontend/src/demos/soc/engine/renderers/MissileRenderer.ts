/**
 * Renders missile arcs using the "missile" shader from all-shaders.glsl.
 *
 * Each active missile gets a TRIANGLE_STRIP draw call with time-animated
 * bright segment sliding along the arc.
 */

import { createProgram, createDynamicBuffer } from '../webGLHelpers'
import { buildShader, type ShaderLib } from '../shaderParser'
import { buildMissileArc, MISSILE_FLOATS_PER_ARC, MISSILE_VERTICES_PER_ARC } from '../missileGeometry'
import { mat4 } from 'gl-matrix'
import { type ProjectFn } from '../mapProjection'

// Custom fragment shader: trail effect (head + fading tail)
const MISSILE_FRAG_OVERRIDE = /* glsl */`
precision mediump float;
varying float v_alpha;
varying float v_v;
uniform vec3  color;
uniform float time;

void main() {
  /* Head position travels 0→1 over the full lifetime */
  float head  = clamp(time * 1.05, 0.0, 1.0);

  /* Trail: tighter band so arcs read thinner on screen */
  float behind = head - v_alpha;
  float trail  = smoothstep(-0.01, 0.04, behind)
               * (1.0 - smoothstep(0.0, 0.26, behind));

  /* Sharp bright tip (slightly softer than before) */
  float tip = exp(-95.0 * (v_alpha - head) * (v_alpha - head));

  float a = max(trail * 0.52, tip * 0.85);

  /* Tube edge — sharper falloff = thinner perceived ribbon */
  float edge = 1.0 - pow(abs(v_v), 3.2);
  a *= edge;

  /* Fade in at launch, fade out near end */
  a *= smoothstep(0.0, 0.08, time) * smoothstep(1.0, 0.82, time);

  gl_FragColor = vec4(color + vec3(0.08) * tip, a * 0.55);
}`

export const MAX_MISSILES     = 512
export const ARC_LIFETIME_S   = 3.0          // seconds per missile arc (shorter = cleaner)
// In the fragment shader: head = clamp(time * HEAD_SPEED, 0, 1)
// head reaches dst (=1.0) when time = 1/HEAD_SPEED
const HEAD_SPEED              = 1.05
export const ARC_IMPACT_MS    = (ARC_LIFETIME_S / HEAD_SPEED) * 1000  // head hits dst at t=1/HEAD_SPEED
/** Base tube half-width at `zoom === 1`. Actual width is scaled by {@link missileWidthForZoom}. */
export const MISSILE_WIDTH    = 0.055

/**
 * Thinner arcs when zoomed in (high `zoom`), thicker when zoomed out — matches camera distance
 * `dist = 28 / zoom` on the globe.
 */
export function missileWidthForZoom(zoom: number): number {
  const z = Math.max(0.3, Math.min(4.0, zoom))
  return MISSILE_WIDTH * (1.0 / z)
}
const FLOAT32_BYTES           = 4

export interface MissileState {
  alive:      boolean
  startTime:  number              // performance.now() timestamp (ms)
  color:      [number, number, number]
  vertOffset: number              // float-index into vertexData
  type:       string
}

export class MissileRenderer {
  private gl:      WebGLRenderingContext
  private prog:    WebGLProgram
  private buf:     WebGLBuffer
  private vData:   Float32Array   // shared CPU-side buffer

  readonly missiles: MissileState[] = []

  constructor(gl: WebGLRenderingContext, lib: ShaderLib) {
    this.gl = gl

    const vert = buildShader(lib, 'missile', 'vertex')
    this.prog  = createProgram(gl, vert, MISSILE_FRAG_OVERRIDE)

    const totalFloats = MAX_MISSILES * MISSILE_FLOATS_PER_ARC
    this.vData = new Float32Array(totalFloats)
    this.buf   = createDynamicBuffer(gl, totalFloats * FLOAT32_BYTES)  // bytes

    for (let i = 0; i < MAX_MISSILES; i++) {
      this.missiles.push({
        alive:      false,
        startTime:  0,
        color:      [1, 0.2, 0.1],
        vertOffset: i * MISSILE_FLOATS_PER_ARC,
        type:       'oas',
      })
    }
  }

  /** Launch a new missile arc between two [lng, lat] points */
  launch(
    src:     [number, number],
    dst:     [number, number],
    color:   [number, number, number],
    project: ProjectFn,
    type:    string = 'oas',
  ): boolean {
    const slot = this.missiles.find(m => !m.alive)
    if (!slot) return false

    slot.alive     = true
    slot.startTime = performance.now()
    slot.color     = color
    slot.type      = type

    buildMissileArc(src, dst, this.vData, slot.vertOffset, project)

    // Upload just this arc's data (WebGL1: bufferSubData takes a typed array view)
    const gl = this.gl
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf)
    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      slot.vertOffset * FLOAT32_BYTES,
      this.vData.subarray(slot.vertOffset, slot.vertOffset + MISSILE_FLOATS_PER_ARC),
    )

    return true
  }

  /** Should be called when projection changes — rebuild all alive arc geometries */
  rebuildAll(_project: ProjectFn): void {
    // We don't store src/dst, so caller must re-launch. See SocWebGLEngine.
  }

  draw(
    mvp: Float32Array | mat4,
    viewPos: Float32Array,
    nowMs: number,
    cameraZoom = 1,
  ): void {
    const gl   = this.gl
    const prog = this.prog

    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf)

    const posLoc = gl.getAttribLocation(prog, 'position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 4, gl.FLOAT, false, 16, 0)

    const mvpLoc  = gl.getUniformLocation(prog, 'mvp')
    const viewLoc = gl.getUniformLocation(prog, 'view_position')
    const colLoc  = gl.getUniformLocation(prog, 'color')
    const timeLoc = gl.getUniformLocation(prog, 'time')
    const widLoc  = gl.getUniformLocation(prog, 'width')

    gl.uniformMatrix4fv(mvpLoc, false, mvp as Float32Array)
    gl.uniform3fv(viewLoc, viewPos)
    gl.uniform1f(widLoc, missileWidthForZoom(cameraZoom))

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)   // additive blending for glow

    for (const m of this.missiles) {
      if (!m.alive) continue

      const elapsed = (nowMs - m.startTime) / 1000   // seconds
      if (elapsed >= ARC_LIFETIME_S) {
        m.alive = false
        continue
      }

      const t = elapsed / ARC_LIFETIME_S   // 0 → 1
      gl.uniform3fv(colLoc, m.color)
      gl.uniform1f(timeLoc, t)

      // vertOffset is in floats; each vertex = 4 floats → divide by 4
      const firstVertex = m.vertOffset / 4
      gl.drawArrays(gl.TRIANGLE_STRIP, firstVertex, MISSILE_VERTICES_PER_ARC)
    }

    gl.disableVertexAttribArray(posLoc)
    gl.disable(gl.BLEND)
  }
}
