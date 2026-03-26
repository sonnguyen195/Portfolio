/**
 * Main WebGL engine orchestrator.
 *
 * Manages a WebGL context on a provided <canvas>, loads shaders from the
 * cyber.js shader files, and orchestrates all sub-renderers + animation loop.
 *
 * Usage:
 *   const engine = new SocWebGLEngine(canvas, assetsBase)
 *   engine.launch(srcCoord, dstCoord, color, type)
 *   engine.setMode('flat')
 *   engine.dispose()
 */

import allShadersRaw   from '../map/all-shaders.glsl?raw'
import earthLightsUrl  from '../map/earth_lights.jpg'
import earthMapUrl     from '../map/earth_map.jpg'

import { parseShaderLib }              from './shaderParser'
import { CameraController, type ViewMode } from './cameraController'
import { EarthRenderer }               from './renderers/EarthRenderer'
import { MissileRenderer, ARC_IMPACT_MS } from './renderers/MissileRenderer'
import { IconRenderer }                from './renderers/IconRenderer'
import { projectECEF, projectMercator, GLOBE_SURFACE_ALT_BOOST, type ProjectFn } from './mapProjection'

type AttackColor = [number, number, number]

export class SocWebGLEngine {
  private gl:             WebGLRenderingContext
  private camera:         CameraController
  private earth:          EarthRenderer
  private missiles:       MissileRenderer
  private icons:          IconRenderer
  private rafHandle:      number = 0
  private disposed:       boolean = false
  private _pendingTimers: Set<ReturnType<typeof setTimeout>> = new Set()

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', {
      antialias:  true,
      alpha:      false,
      premultipliedAlpha: false,
    })
    if (!gl) throw new Error('WebGL not available')
    this.gl = gl

    // Parse shader library from the raw cyber.js GLSL files
    const lib = parseShaderLib(allShadersRaw)

    this.camera   = new CameraController()
    this.earth    = new EarthRenderer(gl, earthLightsUrl, earthMapUrl)
    this.missiles = new MissileRenderer(gl, lib)
    this.icons    = new IconRenderer(gl, lib)

    // Initial GL state
    gl.clearColor(0.02, 0.02, 0.06, 1)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)

    this._resize(canvas)
    this._startLoop()
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /** Current zoom level (useful for computing pan sensitivity in flat mode) */
  get flatZoom(): number { return this.camera.zoom }

  /** Set view mode: 'globe' (3D) or 'flat' (2D Mercator map) */
  setMode(mode: ViewMode): void {
    this.camera.setMode(mode)
    this.icons.rebuildMatrices(mode === 'globe')
    // Clear active effects on mode switch
    for (const m of this.missiles.missiles) m.alive = false
    for (const ic of this.icons.icons)     ic.alive = false
  }

  /** Launch one missile arc; icon spawns when the arc head reaches the destination */
  launch(
    src:   [number, number],   // [lng, lat]
    dst:   [number, number],   // [lng, lat]
    color: AttackColor,
    type:  string = 'oas',
  ): void {
    this.missiles.launch(src, dst, color, this._projectArc(), type)

    // Delay icon spawn until the arc head arrives at the destination.
    // ARC_IMPACT_MS is derived from ARC_LIFETIME_S / HEAD_SPEED (the exact moment
    // `head = 1.0` in the fragment shader), so this stays in sync automatically.
    const isGlobe = this.camera.mode === 'globe'
    const timer = window.setTimeout(() => {
      if (!this.disposed) {
        this.icons.spawn(dst, color, type, this.camera.mode === 'globe')
      }
    }, ARC_IMPACT_MS)

    // Track timer so we can clear on dispose
    this._pendingTimers.add(timer)
    window.setTimeout(() => this._pendingTimers.delete(timer), ARC_IMPACT_MS + 100)

    void isGlobe // suppress lint
  }

  /** Handle canvas resize */
  resize(canvas: HTMLCanvasElement): void {
    this._resize(canvas)
  }

  /** Toggle auto-rotate (globe only) */
  setAutoRotate(on: boolean): void {
    this.camera.autoRotate = on
  }

  /** Switch globe/terrain visual style preset (shader palette). */
  setEarthStyle(styleIndex: number): void {
    this.earth.setEarthStyle(styleIndex)
  }

  /** Current MVP matrix (column-major, updated every frame) — for CPU-side label projection */
  get currentMVP(): Float32Array { return this.camera.mvp as unknown as Float32Array }

  /** Current camera world-space position (updated every frame) — for visibility culling */
  get currentViewPos(): Float32Array { return this.camera.viewPos as unknown as Float32Array }

  /** Current view mode */
  get currentMode(): string { return this.camera.mode }

  /**
   * Snapshot of all currently alive attack icons (read-only) for label overlay.
   * Each entry has coord [lng,lat], type string, color, and t ∈ [0,1] (lifetime fraction).
   */
  get aliveIcons(): ReadonlyArray<{
    coord: [number, number]
    type:  string
    color: [number, number, number]
    t:     number
  }> {
    const now = performance.now()
    const result = []
    for (const ic of this.icons.icons) {
      if (!ic.alive) continue
      const elapsed = (now - ic.startTime) / 1000
      if (elapsed >= ic.lifetimeS) continue
      result.push({ coord: ic.coord, type: ic.type, color: ic.color, t: elapsed / ic.lifetimeS })
    }
    return result
  }

  /**
   * Orbit the camera by delta-longitude and delta-latitude (degrees).
   * Calling this disables auto-rotate so the user keeps control.
   */
  orbitBy(dLon: number, dLat: number): void {
    this.camera.lonDeg += dLon
    this.camera.latDeg  = Math.max(-80, Math.min(80, this.camera.latDeg + dLat))
    this.camera.autoRotate = false
  }

  /**
   * Zoom the camera by a multiplicative factor.
   * factor > 1 zooms in, factor < 1 zooms out.
   */
  zoomBy(factor: number): void {
    this.camera.zoom = Math.max(0.3, Math.min(4.0, this.camera.zoom * factor))
  }

  /**
   * Pan the flat map by delta world units.
   * Only meaningful in flat mode.
   */
  panBy(dx: number, dy: number): void {
    if (this.camera.mode !== 'flat') return
    this.camera.panX += dx
    this.camera.panY += dy
  }

  /** Clean up GL resources and cancel animation loop */
  dispose(): void {
    this.disposed = true
    cancelAnimationFrame(this.rafHandle)
    for (const t of this._pendingTimers) window.clearTimeout(t)
    this._pendingTimers.clear()
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  /** Globe arcs use same radial clearance as icons so tubes stay above extruded land. */
  private _projectArc(): ProjectFn {
    if (this.camera.mode !== 'globe') return projectMercator
    return (out, c) =>
      projectECEF(out, [c[0], c[1], (c[2] ?? 0) + GLOBE_SURFACE_ALT_BOOST])
  }

  private _resize(canvas: HTMLCanvasElement): void {
    const w = canvas.clientWidth  * devicePixelRatio
    const h = canvas.clientHeight * devicePixelRatio
    canvas.width  = w
    canvas.height = h
    this.gl.viewport(0, 0, w, h)
    this.camera.resize(w, h)
  }

  private _startLoop(): void {
    const loop = () => {
      if (this.disposed) return
      this.rafHandle = requestAnimationFrame(loop)
      this._frame()
    }
    this.rafHandle = requestAnimationFrame(loop)
  }

  private _frame(): void {
    const gl      = this.gl
    const now     = performance.now()
    const timeSec = now * 0.001
    const canvas  = gl.canvas as HTMLCanvasElement
    const aspect  = canvas.width / Math.max(1, canvas.height)

    this.camera.tick()

    const mvp     = this.camera.mvp      as unknown as Float32Array
    const mv      = this.camera.view     as unknown as Float32Array
    const viewPos = this.camera.viewPos  as unknown as Float32Array

    // ── 0. Starfield background (writes to colour only, no depth) ─────────
    gl.clear(gl.DEPTH_BUFFER_BIT)
    const DEG = Math.PI / 180
    this.earth.drawBackground(aspect, timeSec, this.camera.lonDeg * DEG, this.camera.latDeg * DEG)

    // ── 1. Draw Earth ─────────────────────────────────────────────────────
    gl.depthMask(true)
    if (this.camera.mode === 'globe') {
      this.earth.drawGlobe(mvp, mv)
      this.earth.drawRing(mvp)   // no-op unless Neon Cyber style
    } else {
      this.earth.drawFlat(mvp)
    }

    // ── 2. Draw missiles (additive blend, no depth write) ─────────────────
    gl.depthMask(false)
    this.missiles.draw(mvp, viewPos, now, this.camera.zoom)

    // ── 3. Draw icons (additive blend) ────────────────────────────────────
    const isFlat = this.camera.mode === 'flat'
    this.icons.draw(mvp, now, viewPos as Float32Array, isFlat, this.camera.zoom)

    gl.depthMask(true)
  }
}
