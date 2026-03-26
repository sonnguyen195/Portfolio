/**
 * Camera controller for both globe (perspective) and flat (orthographic) modes.
 *
 * Uses gl-matrix for matrix math, matching cyber.js's coordinate system.
 * Globe: sphere radius = 10, camera distance ≈ 28.
 * Flat:  map extent [-10, 10] × [-8, 8], camera at z = 20.
 */

import { mat4, vec3 } from 'gl-matrix'

export type ViewMode = 'globe' | 'flat'

export class CameraController {
  readonly mvp      = mat4.create()
  readonly view     = mat4.create()
  readonly proj     = mat4.create()
  readonly viewPos  = vec3.create()

  private _mode: ViewMode = 'globe'
  private _width  = 1
  private _height = 1

  // Globe orbit params
  lonDeg  = -90           // camera longitude (where we're looking from)
  latDeg  = 25            // camera latitude
  zoom    = 1             // 1 = default distance ~28 units

  // Flat-map pan offset (world units)
  panX = 0
  panY = 0

  // Auto-rotation
  autoRotate    = true
  rotateSpeedDeg = 0.05   // degrees/frame

  get mode(): ViewMode { return this._mode }

  setMode(mode: ViewMode): void {
    this._mode = mode
  }

  resize(w: number, h: number): void {
    this._width  = w
    this._height = h
  }

  /** Call once per frame before rendering */
  tick(): void {
    if (this.autoRotate && this._mode === 'globe') {
      this.lonDeg += this.rotateSpeedDeg
    }
    this._buildMatrices()
  }

  private _buildMatrices(): void {
    if (this._mode === 'globe') {
      this._buildGlobe()
    } else {
      this._buildFlat()
    }
    mat4.multiply(this.mvp, this.proj, this.view)
    // Extract view position from inverse view matrix
    const invView = mat4.create()
    mat4.invert(invView, this.view)
    this.viewPos[0] = invView[12]
    this.viewPos[1] = invView[13]
    this.viewPos[2] = invView[14]
  }

  private _buildGlobe(): void {
    const aspect = this._width / this._height
    mat4.perspective(this.proj, (40 * Math.PI) / 180, aspect, 0.1, 300)

    const DEG = Math.PI / 180
    const dist = (28 / this.zoom)
    const lat  = this.latDeg  * DEG
    const lon  = this.lonDeg  * DEG

    const eye = vec3.fromValues(
      -dist * Math.cos(lat) * Math.cos(lon),
       dist * Math.sin(lat),
       dist * Math.cos(lat) * Math.sin(lon),
    )
    const target = vec3.fromValues(0, 0, 0)
    const up     = vec3.fromValues(0, 1, 0)
    mat4.lookAt(this.view, eye, target, up)
  }

  private _buildFlat(): void {
    const aspect = this._width / this._height
    const halfW  = 10 / this.zoom
    const halfH  = halfW / aspect
    mat4.ortho(this.proj, -halfW, halfW, -halfH, halfH, -50, 50)
    mat4.lookAt(
      this.view,
      vec3.fromValues(this.panX, this.panY, 20),
      vec3.fromValues(this.panX, this.panY,  0),
      vec3.fromValues(0, 1, 0),
    )
  }
}
