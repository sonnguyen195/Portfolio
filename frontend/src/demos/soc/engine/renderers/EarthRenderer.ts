/**
 * Renders the Earth background.
 *
 * Draw order (each frame):
 *   1. drawBackground() — full-screen quad: dark space + procedural stars
 *   2. drawGlobe(mvp)   — UV sphere with earth_map.jpg, Kaspersky dark style
 *      OR drawFlat(mvp) — flat quad with earth_map.jpg, dark teal tint
 */

import { createProgram, createStaticBuffer, loadTexture } from '../webGLHelpers'
import { mat4 } from 'gl-matrix'
import geoJson from '../../map/geo.json'

/* ─── Star-field background ───────────────────────────────────────────── */

const BG_VERT = /* glsl */`
  attribute vec2 position;
  varying vec2 v_ndc;
  void main() {
    v_ndc = position;
    gl_Position = vec4(position, 1.0, 1.0);
  }
`

const BG_FRAG = /* glsl */`
  precision mediump float;
  varying vec2 v_ndc;
  uniform float u_aspect;
  uniform float u_time;
  uniform float u_lon;   // camera longitude in radians — shifts star field
  uniform float u_lat;   // camera latitude  in radians — shifts star field

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    /* Deep space — nearly pure black with faint green nebula near edges */
    vec3 col = vec3(0.004, 0.006, 0.010);

    /* Subtle dark-green nebula glow — more pronounced toward screen edges */
    float vignette = 1.0 - dot(v_ndc, v_ndc) * 0.4;
    float nebula   = clamp(1.0 - vignette * 1.2, 0.0, 1.0);
    col += vec3(0.0, 0.025, 0.012) * nebula;

    /* Stars — UV shifted by camera lon/lat so star field rotates with Earth */
    vec2 uv    = v_ndc * vec2(u_aspect, 1.0);
    /* wrap lon through full circle → one full star-grid cycle per 2π */
    uv.x += (u_lon / 6.28318) * u_aspect * 3.2;
    uv.y += (u_lat / 3.14159) * 0.8;

    float GRID  = 70.0;
    vec2  cell  = floor(uv * GRID);
    vec2  local = fract(uv * GRID) - 0.5;

    float r      = hash(cell);
    float size   = 0.06 + 0.10 * hash(cell + 7.3);
    float bright = r > 0.91 ? smoothstep(0.91, 1.0, r) : 0.0;
    bright *= 0.7 + 0.3 * sin(u_time * 1.5 + r * 60.0);
    float star   = bright * (1.0 - smoothstep(0.0, size, length(local)));

    vec3 starCol = mix(vec3(1.0), vec3(0.75, 0.88, 1.0), hash(cell + 13.1));
    col += star * starCol;

    gl_FragColor = vec4(col, 1.0);
  }
`

/* ─── Globe (3-D mode) ────────────────────────────────────────────────── */

const GLOBE_VERT = /* glsl */`
  precision mediump float;
  attribute vec3 position;
  attribute vec2 texcoord;
  varying vec2 v_uv;
  varying float v_ndotl;
  varying float v_edge;
  varying float v_land;
  uniform mat4 mvp;
  uniform mat4 mv;
  uniform sampler2D t_earth;
  uniform sampler2D t_landMask;
  uniform float u_extrude;
  uniform float u_baseRadius;

  void main() {
    v_uv = texcoord;
    vec3 tex = texture2D(t_earth, texcoord).rgb;
    float lum  = dot(tex, vec3(0.299, 0.587, 0.114));
    float landFromLum  = smoothstep(0.15, 0.40, lum);

    // Land mask from GeoJSON rasterization: 0 ocean, 1 land (anti-aliased edges).
    float landFromMask = texture2D(t_landMask, texcoord).r;
    landFromMask = smoothstep(0.25, 0.75, landFromMask);

    // Blend to stabilize thresholding (mask is “truth”, lum provides a bit of continuity).
    float land = max(landFromMask, landFromLum * 0.35);

    vec3 N = normalize(position);
    /* Push land vertices outward — reads like extruded continents (ref: Kaspersky globe) */
    float bump = land * u_extrude;
    vec3 pos = N * (u_baseRadius + bump);
    v_land = land;

    vec3 Nsurf = normalize(pos);
    v_ndotl = dot(Nsurf, normalize(vec3(-0.5, 0.35, 0.8)));
    vec3 Nview = normalize(mat3(mv[0].xyz, mv[1].xyz, mv[2].xyz) * Nsurf);
    v_edge = 1.0 - abs(Nview.z);
    gl_Position = mvp * vec4(pos, 1.0);
  }
`

const GLOBE_FRAG = /* glsl */`
  precision mediump float;
  varying vec2 v_uv;
  varying float v_ndotl;
  varying float v_edge;
  varying float v_land;
  uniform sampler2D t_earth;
  uniform sampler2D t_lights;   // earth_lights.jpg  — NASA night-time city lights
  uniform float u_style;

  void main() {
    vec3  tex    = texture2D(t_earth,  v_uv).rgb;
    vec3  lights = texture2D(t_lights, v_uv).rgb;
    float lum    = dot(tex,    vec3(0.299, 0.587, 0.114));
    float litLum = dot(lights, vec3(0.299, 0.587, 0.114));
    float land   = v_land;

    // ── Style 0: Mono Tech   — dark desaturated satellite texture ────────────
    // ── Style 1: Neon Cyber  — dark teal + city lights + circuit + dual atmo ─
    // ── Style 2: Realistic   — satellite texture, natural colours + blue atmo ─

    vec3  base;
    vec3  atmo;
    vec3  gridTint = vec3(0.0);
    float gridOn   = 0.0;

    if (u_style < 0.5) {
      // ── MONO TECH ──────────────────────────────────────────────────────────
      // Fully desaturated, very dark — satellite night view in greyscale.
      // Land slightly brighter than ocean; texture shape drives all detail.
      float grey   = lum * 0.28;
      float factor = mix(0.55, 1.0, land);   // ocean dimmer than land
      base = vec3(grey * factor);

      // Day/night shading
      float wrap = 0.18 + 0.82 * max(0.0, v_ndotl);
      base *= wrap;

      // City lights — show as soft white points on the dark side
      float night   = max(0.0, 1.0 - max(0.0, v_ndotl) * 2.5);
      base += vec3(0.90, 0.92, 0.80) * litLum * night * 1.6;

      // Very subtle grey-green rim (NOT the big green blast)
      float rimA = pow(v_edge, 5.5);
      float rimB = pow(v_edge, 3.5) * land * 0.35;
      base += vec3(0.08, 0.14, 0.09) * rimB;
      atmo  = vec3(0.04, 0.10, 0.06) * rimA * 0.7;

    } else if (u_style < 1.5) {
      // ── NEON CYBER ─────────────────────────────────────────────────────────
      // Near-black base, city lights from t_lights, PCB-circuit grid, dual atmo.
      vec3 oceanC = vec3(0.002, 0.006, 0.020);
      vec3 landC  = vec3(0.005, 0.040, 0.065);
      vec3 landHi = vec3(0.012, 0.100, 0.160);
      base = mix(oceanC, mix(landC, landHi, land * 0.75), land);

      // Very tight day/night (strong contrast on the dark globe)
      float wrap = 0.12 + 0.88 * max(0.0, v_ndotl);
      base *= wrap;

      // City lights — bright yellow/cyan hotspots, peak on night side
      float nightFace = max(0.0, 0.4 - v_ndotl);
      base += vec3(1.00, 0.92, 0.55) * litLum * (0.8 + nightFace * 2.5);

      // Coastal / land-edge cyan rim
      float rimLand = pow(v_edge, 2.0) * land * (0.25 + 0.55 * land);
      base += vec3(0.00, 0.88, 1.00) * rimLand * 2.5;

      // Dual-layer atmosphere: tight cyan inner + wide purple outer
      float rimCyan  = pow(v_edge, 6.5);
      float rimPurp  = pow(v_edge, 1.9);
      atmo = vec3(0.00, 0.85, 1.00) * rimCyan * 4.5
           + vec3(0.55, 0.00, 0.88) * rimPurp * 0.85;

      // PCB circuit-trace grid on land (two frequencies like real board traces)
      gridTint = vec3(0.00, 0.68, 0.30);
      gridOn   = 1.0;

    } else {
      // ── REALISTIC ──────────────────────────────────────────────────────────
      // Use satellite texture with natural ocean/land colours.
      vec3 oceanTex = tex * vec3(0.52, 0.82, 1.40);
      vec3 landTex  = tex * vec3(1.14, 1.08, 0.88);
      base = mix(oceanTex, landTex, land);

      float wrap = 0.10 + 0.90 * max(0.0, v_ndotl);
      base *= wrap;
      base *= (0.88 + 0.12 * lum);

      float rimA = pow(v_edge, 4.0);
      float rimB = pow(v_edge, 2.5) * (0.20 + 0.35 * (1.0 - land));
      base += vec3(0.25, 0.50, 1.00) * rimB * 0.55;
      atmo  = vec3(0.18, 0.42, 0.95) * rimA * 0.80;
    }

    // Grid overlay — circuit traces (Mono Tech disabled; Neon Cyber enabled)
    if (gridOn > 0.5) {
      // Two frequencies: sparse structural traces + fine detail grid
      vec2 g1 = abs(fract(v_uv * 24.0) - 0.5);
      vec2 g2 = abs(fract(v_uv *  8.0) - 0.5);
      float c1 = (1.0 - smoothstep(0.010, 0.0, g1.x)) * (1.0 - smoothstep(0.45, 0.5, g1.y));
      float c2 = (1.0 - smoothstep(0.012, 0.0, g2.y)) * (1.0 - smoothstep(0.45, 0.5, g2.x));
      float traces = max(c1, c2);
      base += gridTint * traces * land * 0.38;
    }

    gl_FragColor = vec4(base + atmo, 1.0);
  }
`

/* ─── Flat map (2-D mode) ─────────────────────────────────────────────── */

const FLAT_VERT = /* glsl */`
  attribute vec2 position;
  attribute vec2 texcoord;
  varying vec2 v_uv;
  uniform mat4 mvp;
  void main() {
    v_uv = texcoord;
    gl_Position = mvp * vec4(position, -0.5, 1.0);
  }
`

const FLAT_FRAG = /* glsl */`
  precision mediump float;
  varying vec2 v_uv;
  uniform sampler2D t_earth;
  uniform sampler2D t_landMask;
  uniform float u_style;

  void main() {
    vec3  tex  = texture2D(t_earth,    v_uv).rgb;
    float land = texture2D(t_landMask, v_uv).r;
    land = smoothstep(0.25, 0.75, land);
    float lum  = dot(tex, vec3(0.299, 0.587, 0.114));

    vec3  col;
    vec3  gridTint = vec3(0.0);
    float gridOn   = 0.0;

    if (u_style < 0.5) {
      // Mono Tech — match globe desaturated satellite look (no grid for parity)
      float grey   = lum * 0.28;
      float factor = mix(0.55, 1.0, land);
      col = vec3(grey * factor);

      // Coast / land edge soft lift (subtle grey-green)
      float coast = smoothstep(0.18, 0.32, lum) * (1.0 - smoothstep(0.32, 0.42, lum));
      col += vec3(0.08, 0.14, 0.09) * coast * 0.32;

      gridOn = 0.0; // globe mono tech has no PCB grid

    } else if (u_style < 1.5) {
      // Neon Cyber — mirror globe palette + cyan coast + PCB grid
      vec3 oceanC = vec3(0.002, 0.006, 0.020);
      vec3 landC  = vec3(0.005, 0.040, 0.065);
      vec3 landHi = vec3(0.012, 0.100, 0.160);
      col = mix(oceanC, mix(landC, landHi, land * 0.75), land);

      // Coast glow (cyan) to echo globe rim
      float coast = smoothstep(0.14, 0.22, lum) * (1.0 - smoothstep(0.22, 0.30, lum));
      col += coast * vec3(0.00, 0.88, 1.00) * 0.65;

      gridTint = vec3(0.00, 0.68, 0.30);
      gridOn   = 1.0;

    } else {
      // Realistic — natural colours matching globe
      vec3 oceanTex = tex * vec3(0.52, 0.82, 1.40);
      vec3 landTex  = tex * vec3(1.14, 1.08, 0.88);
      col = mix(oceanTex, landTex, land);
      col *= (0.88 + 0.12 * lum);

      // Gentle atmospheric rim cue via brightness near coasts
      float coast = smoothstep(0.16, 0.30, lum) * (1.0 - smoothstep(0.30, 0.42, lum));
      col += vec3(0.18, 0.42, 0.95) * coast * 0.22;
    }

    // Grid overlay
    if (gridOn > 0.5) {
      // Match globe PCB trace frequencies (24 / 8) and weighting
      vec2 g1 = abs(fract(v_uv * 24.0) - 0.5);
      vec2 g2 = abs(fract(v_uv *  8.0) - 0.5);
      float c1 = (1.0 - smoothstep(0.010, 0.0, g1.x)) * (1.0 - smoothstep(0.45, 0.5, g1.y));
      float c2 = (1.0 - smoothstep(0.012, 0.0, g2.y)) * (1.0 - smoothstep(0.45, 0.5, g2.x));
      float traces = max(c1, c2);
      col += gridTint * traces * land * 0.38;
    }

    gl_FragColor = vec4(col, 1.0);
  }
`

/* ─── Geometry helpers ────────────────────────────────────────────────── */

function buildSphere(radius: number, stacks: number, slices: number) {
  const verts: number[] = []
  for (let i = 0; i <= stacks; i++) {
    const lat = Math.PI / 2 - (i * Math.PI) / stacks
    const y   = Math.sin(lat)
    const r   = Math.cos(lat)
    const vv  = i / stacks
    for (let j = 0; j <= slices; j++) {
      const lon = ((j / slices) * 2 - 1) * Math.PI
      verts.push(r * Math.cos(lon) * radius, y * radius, r * Math.sin(lon) * radius, j / slices, vv)
    }
  }
  const idx: number[] = []
  for (let i = 0; i < stacks; i++) {
    for (let j = 0; j < slices; j++) {
      const a = i * (slices + 1) + j, b = a + slices + 1
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  return { verts: new Float32Array(verts), idx: new Uint16Array(idx) }
}

/* Full-screen clip-space quad (-1..1) */
const SCREEN_QUAD = new Float32Array([-1, -1,  1, -1,  -1, 1,  1, 1])

const FLAT_VERTS = new Float32Array([
  -10, -10,  0, 1,
   10, -10,  1, 1,
  -10,  10,  0, 0,
   10,  10,  1, 0,
])


/* ─── Orbital ring (Neon Cyber) ─────────────────────────── */

const RING_VERT = /* glsl */`
  attribute vec4 a_pos;  /* xyz = world pos, w = edge factor 0..1 */
  uniform mat4 u_mvp;
  varying float v_edge;
  void main() {
    v_edge = a_pos.w;
    gl_Position = u_mvp * vec4(a_pos.xyz, 1.0);
  }
`

const RING_FRAG = /* glsl */`
  precision mediump float;
  varying float v_edge;
  void main() {
    /* Glow profile: peak bright cyan near inner edge (v_edge~0.06)
       then transition to purple halo toward outer edge (v_edge~1). */
    float t = v_edge;

    float innerGlow = exp(-pow((t - 0.06) / 0.07, 2.0));   /* tight cyan band */
    float outerGlow = exp(-pow((t - 0.48) / 0.30, 2.0));   /* wide purple halo */

    vec3 col   = vec3(0.00, 0.88, 1.00) * innerGlow
               + vec3(0.55, 0.00, 0.88) * outerGlow * 0.70;
    float alpha = clamp(innerGlow * 0.95 + outerGlow * 0.55, 0.0, 0.95);

    gl_FragColor = vec4(col, alpha);
  }
`

/**
 * Build a tilted annulus (flat ring) for the Neon Cyber orbital ring.
 * Returns TRIANGLE_STRIP vertex data: each vertex = [x, y, z, edgeFactor].
 * edgeFactor: 0 = inner radius, 1 = outer radius.
 */
function buildRing(innerR: number, outerR: number, tiltDeg: number, segs: number): Float32Array {
  const verts: number[] = []
  const tilt  = tiltDeg * Math.PI / 180
  const cosT  = Math.cos(tilt)
  const sinT  = Math.sin(tilt)
  for (let i = 0; i <= segs; i++) {
    const ang = (i / segs) * Math.PI * 2
    const ca  = Math.cos(ang)
    const sa  = Math.sin(ang)
    // Ring lies in XZ plane, then tilted around X-axis by tiltDeg.
    // Original point: (r*ca, 0, r*sa)
    // After X-rotation: x'=r*ca, y'=-r*sa*sinT, z'=r*sa*cosT
    const addV = (r: number, e: number) => {
      verts.push(r * ca, -r * sa * sinT, r * sa * cosT, e)
    }
    addV(innerR, 0.0)
    addV(outerR, 1.0)
  }
  return new Float32Array(verts)
}

/* ─── EarthRenderer ───────────────────────────────────────────────────── */

export class EarthRenderer {
  private gl:        WebGLRenderingContext
  private bgProg:    WebGLProgram
  private globeProg: WebGLProgram
  private flatProg:  WebGLProgram
  private bgVBO:     WebGLBuffer
  private sphereVBO: WebGLBuffer
  private sphereIBO: WebGLBuffer
  private sphereN:   number
  private flatVBO:   WebGLBuffer
  private texMap:    WebGLTexture
  private texLights: WebGLTexture
  private landMaskTex: WebGLTexture
  private ringProg:  WebGLProgram
  private ringVBO:   WebGLBuffer
  private ringN:     number
  private earthStyle: number = 0

  constructor(gl: WebGLRenderingContext, texLightsUrl: string, texMapUrl: string) {
    this.gl = gl
    this.bgProg    = createProgram(gl, BG_VERT, BG_FRAG)
    this.globeProg = createProgram(gl, GLOBE_VERT, GLOBE_FRAG)
    this.flatProg  = createProgram(gl, FLAT_VERT, FLAT_FRAG)
    this.ringProg  = createProgram(gl, RING_VERT, RING_FRAG)

    this.bgVBO    = createStaticBuffer(gl, SCREEN_QUAD)

    /* Finer mesh so vertex displacement follows coastlines more smoothly */
    const { verts, idx } = buildSphere(10, 72, 128)
    this.sphereVBO = createStaticBuffer(gl, verts)
    this.sphereIBO = gl.createBuffer()!
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sphereIBO)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW)
    this.sphereN = idx.length

    /* Orbital ring — tilted 24 deg, inner r=11.8, outer r=16.0, 192 segments */
    const ringData = buildRing(11.8, 16.0, 24, 192)
    this.ringVBO   = createStaticBuffer(gl, ringData)
    this.ringN     = (192 + 1) * 2   /* (segs+1) * 2 vertices */

    this.flatVBO    = createStaticBuffer(gl, FLAT_VERTS)
    this.texMap     = loadTexture(gl, texMapUrl)
    this.texLights  = loadTexture(gl, texLightsUrl)
    this.landMaskTex = this._createLandMaskTexture(gl, geoJson, 1024)
  }

  setEarthStyle(styleIndex: number): void {
    this.earthStyle = Math.max(0, Math.min(2, styleIndex | 0))
  }

  private _createLandMaskTexture(
    gl: WebGLRenderingContext,
    geo: any,
    size: number,
  ): WebGLTexture {
    // Browser-only helper: rasterize GeoJSON polygons into an offscreen canvas mask.
    if (typeof document === 'undefined') {
      const tex = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]))
      return tex
    }

    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true })
    if (!ctx) throw new Error('Cannot create land mask canvas')

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
    const lonToX = (lon: number) => clamp01((lon + 180) / 360) * (size - 1)
    const latToY = (lat: number) => clamp01((90 - lat) / 180) * (size - 1)

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, size, size)

    // Draw all admin-0 polygons as land; use even-odd fill to support holes in MultiPolygons.
    ctx.fillStyle = '#fff'

    const addRing = (path: Path2D, ring: number[][]) => {
      if (!ring || ring.length < 3) return
      const [lon0, lat0] = ring[0]
      path.moveTo(lonToX(lon0), latToY(lat0))
      for (let i = 1; i < ring.length; i++) {
        const [lon, lat] = ring[i]
        path.lineTo(lonToX(lon), latToY(lat))
      }
      path.closePath()
    }

    const drawPolygon = (polygonRings: number[][][]) => {
      const path = new Path2D()
      for (const ring of polygonRings) addRing(path, ring)
      ctx.fill(path, 'evenodd')
    }

    for (const f of geo?.features ?? []) {
      const geom = f?.geometry
      if (!geom) continue
      if (geom.type === 'Polygon') {
        drawPolygon(geom.coordinates as number[][][])
      } else if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates as number[][][][]) {
          drawPolygon(poly as number[][][])
        }
      }
    }

    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)

    return tex
  }

  /** Must be called first — clears to dark space + draws stars */
  drawBackground(aspect: number, time: number, lonRad = 0, latRad = 0): void {
    const gl = this.gl
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.BLEND)
    gl.useProgram(this.bgProg)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bgVBO)
    const p = gl.getAttribLocation(this.bgProg, 'position')
    gl.enableVertexAttribArray(p)
    gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 8, 0)
    gl.uniform1f(gl.getUniformLocation(this.bgProg, 'u_aspect'), aspect)
    gl.uniform1f(gl.getUniformLocation(this.bgProg, 'u_time'),   time)
    gl.uniform1f(gl.getUniformLocation(this.bgProg, 'u_lon'),    lonRad)
    gl.uniform1f(gl.getUniformLocation(this.bgProg, 'u_lat'),    latRad)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    gl.disableVertexAttribArray(p)
    gl.enable(gl.DEPTH_TEST)
  }

  drawGlobe(mvp: Float32Array | mat4, mv: Float32Array | mat4): void {
    const gl = this.gl
    gl.useProgram(this.globeProg)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sphereVBO)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sphereIBO)
    const pos = gl.getAttribLocation(this.globeProg, 'position')
    const uv  = gl.getAttribLocation(this.globeProg, 'texcoord')
    gl.enableVertexAttribArray(pos)
    gl.enableVertexAttribArray(uv)
    gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 20, 0)
    gl.vertexAttribPointer(uv,  2, gl.FLOAT, false, 20, 12)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.globeProg, 'mvp'), false, mvp as Float32Array)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.globeProg, 'mv'),  false, mv  as Float32Array)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texMap)
    gl.uniform1i(gl.getUniformLocation(this.globeProg, 't_earth'), 0)
    gl.uniform1f(gl.getUniformLocation(this.globeProg, 'u_style'), this.earthStyle)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.landMaskTex)
    gl.uniform1i(gl.getUniformLocation(this.globeProg, 't_landMask'), 1)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, this.texLights)
    gl.uniform1i(gl.getUniformLocation(this.globeProg, 't_lights'), 2)
    /* World-units: ~2–3% of radius — visible 3D lift without clipping arcs */
    gl.uniform1f(gl.getUniformLocation(this.globeProg, 'u_extrude'), 0.28)
    gl.uniform1f(gl.getUniformLocation(this.globeProg, 'u_baseRadius'), 10.0)
    gl.drawElements(gl.TRIANGLES, this.sphereN, gl.UNSIGNED_SHORT, 0)
    gl.disableVertexAttribArray(pos)
    gl.disableVertexAttribArray(uv)
  }

  drawFlat(mvp: Float32Array | mat4): void {
    const gl = this.gl
    gl.useProgram(this.flatProg)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.flatVBO)
    const pos = gl.getAttribLocation(this.flatProg, 'position')
    const uv  = gl.getAttribLocation(this.flatProg, 'texcoord')
    gl.enableVertexAttribArray(pos)
    gl.enableVertexAttribArray(uv)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 16, 0)
    gl.vertexAttribPointer(uv,  2, gl.FLOAT, false, 16, 8)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.flatProg, 'mvp'), false, mvp as Float32Array)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texMap)
    gl.uniform1i(gl.getUniformLocation(this.flatProg, 't_earth'), 0)
    gl.uniform1f(gl.getUniformLocation(this.flatProg, 'u_style'), this.earthStyle)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.landMaskTex)
    gl.uniform1i(gl.getUniformLocation(this.flatProg, 't_landMask'), 1)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    gl.disableVertexAttribArray(pos)
    gl.disableVertexAttribArray(uv)
  }
  /** Orbital ring — only rendered for Neon Cyber (earthStyle === 1). */
  drawRing(mvp: Float32Array | mat4): void {
    if (this.earthStyle !== 1) return
    const gl = this.gl

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)   // additive — pure glow
    gl.disable(gl.DEPTH_TEST)

    gl.useProgram(this.ringProg)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ringVBO)

    const a = gl.getAttribLocation(this.ringProg, 'a_pos')
    gl.enableVertexAttribArray(a)
    gl.vertexAttribPointer(a, 4, gl.FLOAT, false, 16, 0)

    gl.uniformMatrix4fv(gl.getUniformLocation(this.ringProg, 'u_mvp'), false, mvp as Float32Array)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.ringN)

    gl.disableVertexAttribArray(a)
    gl.disable(gl.BLEND)
    gl.enable(gl.DEPTH_TEST)
  }
}
