/**
 * GuardianX WebGL Engine
 *
 * Pure WebGL renderer for the drone operations map:
 *  - 3D city blocks (instanced cubes with edge glow)
 *  - Grid ground plane
 *  - Terminal/hub markers (pulsing diamonds)
 *  - Mission zones (animated circles)
 *  - Drone flight paths (animated lines with head glow)
 *  - Drone models (lit cubes with propeller indicators)
 *  - Camera orbit/zoom with auto-rotate
 *
 * Designed to match the SOC engine's architecture but for drone operations context.
 */

import { mat4, vec3 } from 'gl-matrix'
import { generateCityBlocks, TERMINAL_NODES, MISSION_ZONES, FLIGHT_ROUTES, DISTRICT_LABELS } from './cityData'
import type { CityBlock, DroneState, MissionZone, TerminalNode } from './types'

// ── Shader sources ───────────────────────────────────────────────────────────

const CITY_VERT = /* glsl */`
  attribute vec3 aPos;
  attribute vec3 aNorm;
  attribute vec3 aInstancePos;
  attribute vec3 aInstanceScale;
  attribute float aLit;
  uniform mat4 uMVP;
  uniform float uTime;
  varying vec3 vNorm;
  varying vec3 vWorldPos;
  varying float vLit;
  varying float vHeight;

  void main() {
    vec3 scaled = aPos * aInstanceScale;
    vec3 world = scaled + aInstancePos;
    vNorm = aNorm;
    vWorldPos = world;
    vLit = aLit;
    vHeight = aInstanceScale.y;
    gl_Position = uMVP * vec4(world, 1.0);
  }
`

const CITY_FRAG = /* glsl */`
  precision mediump float;
  varying vec3 vNorm;
  varying vec3 vWorldPos;
  varying float vLit;
  varying float vHeight;
  uniform float uTime;
  uniform vec3 uViewPos;

  void main() {
    // Base building color - darker for taller buildings
    float hFactor = clamp(vHeight / 3.5, 0.0, 1.0);
    vec3 base = mix(vec3(0.12, 0.16, 0.22), vec3(0.08, 0.12, 0.18), hFactor);

    // Simple directional light
    vec3 lightDir = normalize(vec3(0.3, 1.0, 0.4));
    float diff = max(dot(vNorm, lightDir), 0.0) * 0.4 + 0.3;

    // Edge glow - brighter at top edges
    float topGlow = smoothstep(0.7, 1.0, vNorm.y) * 0.15;

    // Window lights for lit buildings
    float windowX = fract(vWorldPos.x * 3.0 + 0.5);
    float windowY = fract(vWorldPos.y * 4.0 + 0.5);
    float windowZ = fract(vWorldPos.z * 3.0 + 0.5);
    float windowMask = step(0.25, windowX) * step(windowX, 0.75)
                     * step(0.2, windowY) * step(windowY, 0.8);
    float faceMask = max(abs(vNorm.x), abs(vNorm.z));
    float windowFlicker = 0.5 + 0.5 * sin(uTime * 2.0 + vWorldPos.x * 5.0 + vWorldPos.z * 7.0);
    vec3 windowColor = mix(vec3(0.8, 0.6, 0.3), vec3(0.3, 0.7, 1.0), step(0.6, windowFlicker));
    float windowLit = windowMask * faceMask * vLit * 0.4 * windowFlicker;

    // Cyan edge outline
    float edgeDist = 1.0 - min(
      min(abs(fract(vWorldPos.x * 1.0) - 0.5), abs(fract(vWorldPos.z * 1.0) - 0.5)),
      abs(fract(vWorldPos.y * 1.0) - 0.5)
    );
    float edgeGlow = smoothstep(0.42, 0.5, edgeDist) * 0.08;

    vec3 color = base * diff + windowColor * windowLit + vec3(0.0, 0.7, 1.0) * (topGlow + edgeGlow);
    float alpha = 0.95;
    gl_FragColor = vec4(color, alpha);
  }
`

const GROUND_VERT = /* glsl */`
  attribute vec3 aPos;
  uniform mat4 uMVP;
  varying vec2 vUV;
  void main() {
    vUV = aPos.xz;
    gl_Position = uMVP * vec4(aPos, 1.0);
  }
`

const GROUND_FRAG = /* glsl */`
  precision mediump float;
  varying vec2 vUV;
  uniform float uTime;

  void main() {
    // Grid pattern
    float gridSize = 1.0;
    vec2 grid = abs(fract(vUV / gridSize + 0.5) - 0.5);
    float line = min(grid.x, grid.y);
    float gridLine = 1.0 - smoothstep(0.01, 0.04, line);

    // Sub-grid
    vec2 subGrid = abs(fract(vUV / (gridSize * 0.25) + 0.5) - 0.5);
    float subLine = min(subGrid.x, subGrid.y);
    float subGridLine = 1.0 - smoothstep(0.005, 0.02, subLine);

    // Base color
    vec3 base = vec3(0.04, 0.06, 0.1);
    vec3 gridColor = vec3(0.0, 0.25, 0.4);
    vec3 subGridColor = vec3(0.0, 0.12, 0.2);

    // Radial fade
    float dist = length(vUV) / 14.0;
    float fade = 1.0 - smoothstep(0.6, 1.0, dist);

    vec3 color = base + gridColor * gridLine * 0.5 * fade + subGridColor * subGridLine * 0.2 * fade;

    // Subtle scan line
    float scan = 0.5 + 0.5 * sin(vUV.y * 40.0 + uTime * 0.5);
    color += vec3(0.0, 0.03, 0.05) * scan * fade * 0.3;

    gl_FragColor = vec4(color, 1.0);
  }
`

const LINE_VERT = /* glsl */`
  attribute vec3 aPos;
  attribute float aAlpha;
  uniform mat4 uMVP;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    gl_Position = uMVP * vec4(aPos, 1.0);
  }
`

const LINE_FRAG = /* glsl */`
  precision mediump float;
  varying float vAlpha;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    gl_FragColor = vec4(uColor, vAlpha * uOpacity);
  }
`

const POINT_VERT = /* glsl */`
  attribute vec3 aPos;
  uniform mat4 uMVP;
  uniform float uPointSize;
  void main() {
    gl_Position = uMVP * vec4(aPos, 1.0);
    gl_PointSize = uPointSize;
  }
`

const POINT_FRAG = /* glsl */`
  precision mediump float;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  void main() {
    vec2 pc = gl_PointCoord - 0.5;
    float dist = length(pc);
    if (dist > 0.5) discard;

    float ring = smoothstep(0.35, 0.4, dist) * (1.0 - smoothstep(0.45, 0.5, dist));
    float center = 1.0 - smoothstep(0.0, 0.25, dist);
    float pulse = 0.7 + 0.3 * sin(uTime * 3.0);

    float a = (center * 0.8 + ring * 0.5) * pulse * uOpacity;
    gl_FragColor = vec4(uColor, a);
  }
`

// ── Helpers ──────────────────────────────────────────────────────────────────

function createShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(sh))
  }
  return sh
}

function createProgram(gl: WebGLRenderingContext, vSrc: string, fSrc: string): WebGLProgram {
  const prog = gl.createProgram()!
  gl.attachShader(prog, createShader(gl, gl.VERTEX_SHADER, vSrc))
  gl.attachShader(prog, createShader(gl, gl.FRAGMENT_SHADER, fSrc))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(prog))
  }
  return prog
}

function createBuffer(gl: WebGLRenderingContext, data: Float32Array, usage = gl.STATIC_DRAW): WebGLBuffer {
  const buf = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, data, usage)
  return buf
}

// ── Unit cube geometry ───────────────────────────────────────────────────────

function buildUnitCube(): { positions: Float32Array; normals: Float32Array } {
  // Cube from (0,0,0) to (1,1,1) - will be scaled/positioned per instance
  const p: number[] = []
  const n: number[] = []
  const face = (v: number[][], norm: number[]) => {
    // Two triangles per face
    const [a, b, c, d] = v
    ;[a, b, c, a, c, d].forEach(vtx => {
      p.push(...vtx)
      n.push(...norm)
    })
  }
  // Front (+Z)
  face([[0,0,1],[1,0,1],[1,1,1],[0,1,1]], [0,0,1])
  // Back (-Z)
  face([[1,0,0],[0,0,0],[0,1,0],[1,1,0]], [0,0,-1])
  // Top (+Y)
  face([[0,1,1],[1,1,1],[1,1,0],[0,1,0]], [0,1,0])
  // Bottom (-Y)
  face([[0,0,0],[1,0,0],[1,0,1],[0,0,1]], [0,-1,0])
  // Right (+X)
  face([[1,0,1],[1,0,0],[1,1,0],[1,1,1]], [1,0,0])
  // Left (-X)
  face([[0,0,0],[0,0,1],[0,1,1],[0,1,0]], [-1,0,0])

  return {
    positions: new Float32Array(p),
    normals: new Float32Array(n),
  }
}

// ── Main Engine ──────────────────────────────────────────────────────────────

const MAX_DRONES = 16
const MAX_PATH_POINTS = 256

export class GuardianXWebGLEngine {
  private gl: WebGLRenderingContext
  private rafHandle = 0
  private disposed = false
  private timers = new Set<ReturnType<typeof setTimeout>>()

  // Camera
  private camLon = -45
  private camLat = 35
  private camZoom = 1
  private camPanX = 0
  private camPanZ = 0
  private autoRotate = true
  private rotateSpeed = 0.02

  private mvp = mat4.create()
  private view = mat4.create()
  private proj = mat4.create()
  private viewPos = vec3.create()
  private width = 1
  private height = 1

  // Programs
  private cityProg!: WebGLProgram
  private groundProg!: WebGLProgram
  private lineProg!: WebGLProgram
  private pointProg!: WebGLProgram

  // City data
  private cityBlocks: CityBlock[] = []
  private cubePositionBuf!: WebGLBuffer
  private cubeNormalBuf!: WebGLBuffer
  private cubeVertexCount = 0
  private instancePosBuf!: WebGLBuffer
  private instanceScaleBuf!: WebGLBuffer
  private instanceLitBuf!: WebGLBuffer
  private instanceCount = 0

  // Ground
  private groundBuf!: WebGLBuffer

  // Dynamic line buffer for flight paths
  private linePosBuf!: WebGLBuffer
  private lineAlphaBuf!: WebGLBuffer

  // Point buffer for terminals/drones
  private pointBuf!: WebGLBuffer

  // State
  private _drones: DroneState[] = []
  private _missionZones: MissionZone[] = []
  private _terminals: TerminalNode[] = []
  private _activeFlightPaths: { points: [number, number, number][]; color: [number, number, number]; progress: number; droneId: string }[] = []

  // For label overlay
  private _mvpOut = new Float32Array(16)

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', {
      antialias: true,
      alpha: false,
      premultipliedAlpha: false,
    })
    if (!gl) throw new Error('WebGL not available')
    this.gl = gl

    // Enable extensions for instancing
    const instExt = gl.getExtension('ANGLE_instanced_arrays')
    if (instExt) {
      (gl as any)._inst = instExt
    }

    gl.clearColor(0.03, 0.04, 0.08, 1)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)

    this._initPrograms()
    this._initCity()
    this._initGround()
    this._initDynamicBuffers()
    this._initState()

    this._resize(canvas)
    this._startLoop()
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  get currentMVP(): Float32Array {
    mat4.copy(this._mvpOut as unknown as mat4, this.mvp)
    return this._mvpOut
  }

  get currentViewPos(): Float32Array {
    return this.viewPos as unknown as Float32Array
  }

  get drones(): ReadonlyArray<DroneState> { return this._drones }
  get missionZones(): ReadonlyArray<MissionZone> { return this._missionZones }
  get terminals(): ReadonlyArray<TerminalNode> { return this._terminals }

  /** Spawn a drone on a route */
  deployDrone(
    droneId: string,
    label: string,
    routeKey: string,
    color: [number, number, number] = [0, 0.83, 1],
    speed: number = 0.3,
    missionType: 'deploy' | 'emergency' | 'patrol' = 'deploy',
  ): void {
    const route = FLIGHT_ROUTES[routeKey]
    if (!route || route.length < 2) return

    // Find or create drone slot
    let drone = this._drones.find(d => d.id === droneId)
    if (!drone) {
      drone = this._drones.find(d => !d.alive)
      if (!drone) return // no free slots
    }

    drone.id = droneId
    drone.alive = true
    drone.status = 'deploying'
    drone.position = [...route[0]]
    drone.targetPosition = [...route[route.length - 1]]
    drone.route = route.map(p => [...p] as [number, number, number])
    drone.routeProgress = 0
    drone.speed = speed
    drone.color = color
    drone.startTime = performance.now()
    drone.missionType = missionType
    drone.label = label

    // Create/update flight path
    const existingPath = this._activeFlightPaths.find(p => p.droneId === droneId)
    if (existingPath) {
      existingPath.points = drone.route
      existingPath.color = color
      existingPath.progress = 0
    } else {
      this._activeFlightPaths.push({
        points: drone.route,
        color,
        progress: 0,
        droneId,
      })
    }
  }

  /** Activate a mission zone */
  activateZone(zoneId: string): void {
    const zone = this._missionZones.find(z => z.id === zoneId)
    if (zone) {
      zone.active = true
      zone.pulsePhase = performance.now()
    }
  }

  /** Deactivate a mission zone */
  deactivateZone(zoneId: string): void {
    const zone = this._missionZones.find(z => z.id === zoneId)
    if (zone) zone.active = false
  }

  /** Deactivate all zones */
  deactivateAllZones(): void {
    for (const z of this._missionZones) z.active = false
  }

  /** Activate a terminal node */
  activateTerminal(termId: string): void {
    const t = this._terminals.find(n => n.id === termId)
    if (t) t.active = true
  }

  /** Kill all drones and paths */
  clearDrones(): void {
    for (const d of this._drones) {
      d.alive = false
      d.status = 'idle'
    }
    this._activeFlightPaths.length = 0
  }

  /** Focus camera on a position [x, z] */
  focusCamera(x: number, z: number, zoom?: number, duration = 1500): void {
    const startLon = this.camLon
    const startLat = this.camLat
    const startZoom = this.camZoom

    // Convert world position to camera angle
    const targetLon = Math.atan2(x, z) * (180 / Math.PI)
    const targetZoom = zoom ?? this.camZoom

    this.autoRotate = false
    const startTime = performance.now()

    const animate = () => {
      if (this.disposed) return
      const elapsed = performance.now() - startTime
      const t = Math.min(1, elapsed / duration)
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

      let dLon = targetLon - startLon
      if (dLon > 180) dLon -= 360
      if (dLon < -180) dLon += 360

      this.camLon = startLon + dLon * e
      this.camZoom = startZoom + (targetZoom - startZoom) * e

      if (t < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }

  /** Orbit camera by delta degrees */
  orbitBy(dLon: number, dLat: number): void {
    this.camLon += dLon
    this.camLat = Math.max(10, Math.min(80, this.camLat + dLat))
    this.autoRotate = false
  }

  /** Zoom camera */
  zoomBy(factor: number): void {
    this.camZoom = Math.max(0.4, Math.min(3.0, this.camZoom * factor))
  }

  /** Set auto rotate */
  setAutoRotate(on: boolean): void {
    this.autoRotate = on
  }

  /** Resize handler */
  resize(canvas: HTMLCanvasElement): void {
    this._resize(canvas)
  }

  /** Clean up */
  dispose(): void {
    this.disposed = true
    cancelAnimationFrame(this.rafHandle)
    for (const t of this.timers) clearTimeout(t)
    this.timers.clear()
  }

  // ─── Initialization ────────────────────────────────────────────────────

  private _initPrograms(): void {
    const gl = this.gl
    this.cityProg = createProgram(gl, CITY_VERT, CITY_FRAG)
    this.groundProg = createProgram(gl, GROUND_VERT, GROUND_FRAG)
    this.lineProg = createProgram(gl, LINE_VERT, LINE_FRAG)
    this.pointProg = createProgram(gl, POINT_VERT, POINT_FRAG)
  }

  private _initCity(): void {
    const gl = this.gl
    this.cityBlocks = generateCityBlocks()

    // Unit cube
    const cube = buildUnitCube()
    this.cubePositionBuf = createBuffer(gl, cube.positions)
    this.cubeNormalBuf = createBuffer(gl, cube.normals)
    this.cubeVertexCount = cube.positions.length / 3

    // Instance data
    this.instanceCount = this.cityBlocks.length
    const posData = new Float32Array(this.instanceCount * 3)
    const scaleData = new Float32Array(this.instanceCount * 3)
    const litData = new Float32Array(this.instanceCount)

    for (let i = 0; i < this.instanceCount; i++) {
      const b = this.cityBlocks[i]
      // Position: center of building base
      posData[i * 3 + 0] = b.x - b.width / 2
      posData[i * 3 + 1] = 0
      posData[i * 3 + 2] = b.z - b.depth / 2
      // Scale
      scaleData[i * 3 + 0] = b.width
      scaleData[i * 3 + 1] = b.height
      scaleData[i * 3 + 2] = b.depth
      // Lit
      litData[i] = b.lit ? 1.0 : 0.0
    }

    this.instancePosBuf = createBuffer(gl, posData)
    this.instanceScaleBuf = createBuffer(gl, scaleData)
    this.instanceLitBuf = createBuffer(gl, litData)
  }

  private _initGround(): void {
    const gl = this.gl
    const S = 14
    const groundVerts = new Float32Array([
      -S, -0.01, -S,
       S, -0.01, -S,
       S, -0.01,  S,
      -S, -0.01, -S,
       S, -0.01,  S,
      -S, -0.01,  S,
    ])
    this.groundBuf = createBuffer(gl, groundVerts)
  }

  private _initDynamicBuffers(): void {
    const gl = this.gl
    // Line path buffers
    this.linePosBuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.linePosBuf)
    gl.bufferData(gl.ARRAY_BUFFER, MAX_PATH_POINTS * 3 * 4, gl.DYNAMIC_DRAW)

    this.lineAlphaBuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineAlphaBuf)
    gl.bufferData(gl.ARRAY_BUFFER, MAX_PATH_POINTS * 4, gl.DYNAMIC_DRAW)

    // Point buffer
    this.pointBuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuf)
    gl.bufferData(gl.ARRAY_BUFFER, 64 * 3 * 4, gl.DYNAMIC_DRAW)
  }

  private _initState(): void {
    // Drones
    for (let i = 0; i < MAX_DRONES; i++) {
      this._drones.push({
        id: `drone-${i}`,
        alive: false,
        status: 'idle',
        position: [0, 0, 0],
        targetPosition: [0, 0, 0],
        route: [],
        routeProgress: 0,
        speed: 0.3,
        color: [0, 0.83, 1],
        startTime: 0,
        missionType: 'deploy',
        label: '',
      })
    }

    // Copy mission zones and terminals
    this._missionZones = MISSION_ZONES.map(z => ({ ...z }))
    this._terminals = TERMINAL_NODES.map(t => ({ ...t }))
  }

  // ─── Render loop ────────────────────────────────────────────────────────

  private _resize(canvas: HTMLCanvasElement): void {
    const w = canvas.clientWidth * devicePixelRatio
    const h = canvas.clientHeight * devicePixelRatio
    canvas.width = w
    canvas.height = h
    this.gl.viewport(0, 0, w, h)
    this.width = w
    this.height = h
  }

  private _startLoop(): void {
    const loop = () => {
      if (this.disposed) return
      this.rafHandle = requestAnimationFrame(loop)
      this._frame()
    }
    this.rafHandle = requestAnimationFrame(loop)
  }

  private _updateCamera(): void {
    if (this.autoRotate) {
      this.camLon += this.rotateSpeed
    }

    const aspect = this.width / Math.max(1, this.height)
    const fov = (45 * Math.PI) / 180
    mat4.perspective(this.proj, fov, aspect, 0.1, 200)

    const dist = 22 / this.camZoom
    const latRad = this.camLat * (Math.PI / 180)
    const lonRad = this.camLon * (Math.PI / 180)

    const eye = vec3.fromValues(
      dist * Math.cos(latRad) * Math.sin(lonRad) + this.camPanX,
      dist * Math.sin(latRad),
      dist * Math.cos(latRad) * Math.cos(lonRad) + this.camPanZ,
    )
    const target = vec3.fromValues(this.camPanX, 0, this.camPanZ)
    const up = vec3.fromValues(0, 1, 0)
    mat4.lookAt(this.view, eye, target, up)
    mat4.multiply(this.mvp, this.proj, this.view)

    this.viewPos[0] = eye[0]
    this.viewPos[1] = eye[1]
    this.viewPos[2] = eye[2]
  }

  private _updateDrones(now: number): void {
    for (const drone of this._drones) {
      if (!drone.alive || drone.route.length < 2) continue

      const elapsed = (now - drone.startTime) / 1000
      const totalDist = this._routeLength(drone.route)
      const traveled = elapsed * drone.speed * 5
      drone.routeProgress = Math.min(1, traveled / totalDist)

      // Interpolate position along route
      const pos = this._interpolateRoute(drone.route, drone.routeProgress)
      drone.position = pos

      // Update status
      if (drone.routeProgress < 0.05) {
        drone.status = 'deploying'
      } else if (drone.routeProgress < 0.95) {
        drone.status = drone.missionType === 'patrol' ? 'patrolling' : 'in-transit'
      } else {
        drone.status = drone.missionType === 'patrol' ? 'patrolling' : 'landed'
        // Patrol drones loop
        if (drone.missionType === 'patrol' && drone.routeProgress >= 1) {
          drone.startTime = now
          drone.routeProgress = 0
        }
      }

      // Update associated flight path
      const path = this._activeFlightPaths.find(p => p.droneId === drone.id)
      if (path) path.progress = drone.routeProgress
    }
  }

  private _routeLength(route: [number, number, number][]): number {
    let len = 0
    for (let i = 1; i < route.length; i++) {
      const dx = route[i][0] - route[i - 1][0]
      const dy = route[i][1] - route[i - 1][1]
      const dz = route[i][2] - route[i - 1][2]
      len += Math.sqrt(dx * dx + dy * dy + dz * dz)
    }
    return len
  }

  private _interpolateRoute(route: [number, number, number][], t: number): [number, number, number] {
    if (t <= 0) return [...route[0]]
    if (t >= 1) return [...route[route.length - 1]]

    const totalLen = this._routeLength(route)
    const targetLen = t * totalLen
    let accumulated = 0

    for (let i = 1; i < route.length; i++) {
      const dx = route[i][0] - route[i - 1][0]
      const dy = route[i][1] - route[i - 1][1]
      const dz = route[i][2] - route[i - 1][2]
      const segLen = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (accumulated + segLen >= targetLen) {
        const segT = (targetLen - accumulated) / segLen
        return [
          route[i - 1][0] + dx * segT,
          route[i - 1][1] + dy * segT,
          route[i - 1][2] + dz * segT,
        ]
      }
      accumulated += segLen
    }
    return [...route[route.length - 1]]
  }

  private _frame(): void {
    const gl = this.gl
    const now = performance.now()
    const timeSec = now * 0.001

    this._updateCamera()
    this._updateDrones(now)

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // 1. Draw ground
    this._drawGround(timeSec)

    // 2. Draw city buildings
    this._drawCity(timeSec)

    // 3. Draw mission zones (transparent, no depth write)
    gl.depthMask(false)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
    this._drawMissionZones(timeSec)

    // 4. Draw flight paths
    this._drawFlightPaths(timeSec)

    // 5. Draw terminal nodes
    this._drawTerminals(timeSec)

    // 6. Draw drones
    this._drawDrones(timeSec)

    gl.disable(gl.BLEND)
    gl.depthMask(true)
  }

  private _drawGround(time: number): void {
    const gl = this.gl
    gl.useProgram(this.groundProg)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.groundBuf)
    const posLoc = gl.getAttribLocation(this.groundProg, 'aPos')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0)

    gl.uniformMatrix4fv(gl.getUniformLocation(this.groundProg, 'uMVP'), false, this.mvp as unknown as Float32Array)
    gl.uniform1f(gl.getUniformLocation(this.groundProg, 'uTime'), time)

    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.disableVertexAttribArray(posLoc)
  }

  private _drawCity(time: number): void {
    const gl = this.gl
    const inst = (gl as any)._inst

    gl.useProgram(this.cityProg)

    gl.uniformMatrix4fv(gl.getUniformLocation(this.cityProg, 'uMVP'), false, this.mvp as unknown as Float32Array)
    gl.uniform1f(gl.getUniformLocation(this.cityProg, 'uTime'), time)
    gl.uniform3fv(gl.getUniformLocation(this.cityProg, 'uViewPos'), this.viewPos as unknown as Float32Array)

    // Cube vertices
    const aPosLoc = gl.getAttribLocation(this.cityProg, 'aPos')
    gl.enableVertexAttribArray(aPosLoc)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.cubePositionBuf)
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0)

    const aNormLoc = gl.getAttribLocation(this.cityProg, 'aNorm')
    gl.enableVertexAttribArray(aNormLoc)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeNormalBuf)
    gl.vertexAttribPointer(aNormLoc, 3, gl.FLOAT, false, 0, 0)

    if (inst) {
      // Use instancing
      const aInstPosLoc = gl.getAttribLocation(this.cityProg, 'aInstancePos')
      gl.enableVertexAttribArray(aInstPosLoc)
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instancePosBuf)
      gl.vertexAttribPointer(aInstPosLoc, 3, gl.FLOAT, false, 0, 0)
      inst.vertexAttribDivisorANGLE(aInstPosLoc, 1)

      const aInstScaleLoc = gl.getAttribLocation(this.cityProg, 'aInstanceScale')
      gl.enableVertexAttribArray(aInstScaleLoc)
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceScaleBuf)
      gl.vertexAttribPointer(aInstScaleLoc, 3, gl.FLOAT, false, 0, 0)
      inst.vertexAttribDivisorANGLE(aInstScaleLoc, 1)

      const aLitLoc = gl.getAttribLocation(this.cityProg, 'aLit')
      gl.enableVertexAttribArray(aLitLoc)
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceLitBuf)
      gl.vertexAttribPointer(aLitLoc, 1, gl.FLOAT, false, 0, 0)
      inst.vertexAttribDivisorANGLE(aLitLoc, 1)

      inst.drawArraysInstancedANGLE(gl.TRIANGLES, 0, this.cubeVertexCount, this.instanceCount)

      inst.vertexAttribDivisorANGLE(aInstPosLoc, 0)
      inst.vertexAttribDivisorANGLE(aInstScaleLoc, 0)
      inst.vertexAttribDivisorANGLE(aLitLoc, 0)
      gl.disableVertexAttribArray(aInstPosLoc)
      gl.disableVertexAttribArray(aInstScaleLoc)
      gl.disableVertexAttribArray(aLitLoc)
    } else {
      // Fallback: draw each building individually (slower)
      for (let i = 0; i < this.instanceCount; i++) {
        // Would need per-building uniforms - skip for now, instancing is widely supported
      }
    }

    gl.disableVertexAttribArray(aPosLoc)
    gl.disableVertexAttribArray(aNormLoc)
  }

  private _drawMissionZones(time: number): void {
    const gl = this.gl
    gl.useProgram(this.lineProg)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.lineProg, 'uMVP'), false, this.mvp as unknown as Float32Array)

    for (const zone of this._missionZones) {
      if (!zone.active) continue

      const segments = 48
      const posData = new Float32Array((segments + 1) * 3)
      const alphaData = new Float32Array(segments + 1)

      const pulse = 0.5 + 0.5 * Math.sin((time - zone.pulsePhase * 0.001) * 2)

      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2
        const r = zone.radius * (0.95 + 0.05 * pulse)
        posData[i * 3 + 0] = zone.center[0] + Math.cos(angle) * r
        posData[i * 3 + 1] = 0.05
        posData[i * 3 + 2] = zone.center[1] + Math.sin(angle) * r
        alphaData[i] = 0.6 + 0.4 * pulse
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, this.linePosBuf)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, posData)
      const posLoc = gl.getAttribLocation(this.lineProg, 'aPos')
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0)

      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineAlphaBuf)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, alphaData)
      const alphaLoc = gl.getAttribLocation(this.lineProg, 'aAlpha')
      gl.enableVertexAttribArray(alphaLoc)
      gl.vertexAttribPointer(alphaLoc, 1, gl.FLOAT, false, 0, 0)

      gl.uniform3fv(gl.getUniformLocation(this.lineProg, 'uColor'), zone.color)
      gl.uniform1f(gl.getUniformLocation(this.lineProg, 'uOpacity'), 0.7)

      gl.drawArrays(gl.LINE_STRIP, 0, segments + 1)

      // Inner ring
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2
        const r = zone.radius * 0.4 * (0.9 + 0.1 * Math.sin(time * 3 + angle * 2))
        posData[i * 3 + 0] = zone.center[0] + Math.cos(angle) * r
        posData[i * 3 + 1] = 0.05
        posData[i * 3 + 2] = zone.center[1] + Math.sin(angle) * r
        alphaData[i] = 0.3 + 0.2 * pulse
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.linePosBuf)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, posData)
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineAlphaBuf)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, alphaData)
      gl.uniform1f(gl.getUniformLocation(this.lineProg, 'uOpacity'), 0.4)
      gl.drawArrays(gl.LINE_STRIP, 0, segments + 1)

      gl.disableVertexAttribArray(posLoc)
      gl.disableVertexAttribArray(alphaLoc)
    }
  }

  private _drawFlightPaths(time: number): void {
    const gl = this.gl
    gl.useProgram(this.lineProg)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.lineProg, 'uMVP'), false, this.mvp as unknown as Float32Array)

    for (const path of this._activeFlightPaths) {
      if (path.points.length < 2) continue

      // Interpolate points for smooth curve
      const interpCount = Math.min(MAX_PATH_POINTS, path.points.length * 8)
      const posData = new Float32Array(interpCount * 3)
      const alphaData = new Float32Array(interpCount)

      for (let i = 0; i < interpCount; i++) {
        const t = i / (interpCount - 1)
        const pos = this._interpolateRoute(path.points, t)
        posData[i * 3 + 0] = pos[0]
        posData[i * 3 + 1] = pos[1]
        posData[i * 3 + 2] = pos[2]

        // Alpha: bright at head, fading trail
        const dist = Math.abs(t - path.progress)
        const headGlow = Math.exp(-dist * dist * 200) * 1.0
        const trail = t <= path.progress ? (0.3 + 0.7 * (t / Math.max(0.001, path.progress))) : 0.1
        alphaData[i] = Math.max(trail * 0.6, headGlow)

        // Dash pattern
        const dash = 0.7 + 0.3 * Math.sin(t * 40 - time * 4)
        if (t <= path.progress) {
          alphaData[i] *= dash
        }
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, this.linePosBuf)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, posData)
      const posLoc = gl.getAttribLocation(this.lineProg, 'aPos')
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0)

      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineAlphaBuf)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, alphaData)
      const alphaLoc = gl.getAttribLocation(this.lineProg, 'aAlpha')
      gl.enableVertexAttribArray(alphaLoc)
      gl.vertexAttribPointer(alphaLoc, 1, gl.FLOAT, false, 0, 0)

      gl.uniform3fv(gl.getUniformLocation(this.lineProg, 'uColor'), path.color)
      gl.uniform1f(gl.getUniformLocation(this.lineProg, 'uOpacity'), 0.9)

      gl.drawArrays(gl.LINE_STRIP, 0, interpCount)

      gl.disableVertexAttribArray(posLoc)
      gl.disableVertexAttribArray(alphaLoc)
    }
  }

  private _drawTerminals(time: number): void {
    const gl = this.gl
    gl.useProgram(this.pointProg)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.pointProg, 'uMVP'), false, this.mvp as unknown as Float32Array)
    gl.uniform1f(gl.getUniformLocation(this.pointProg, 'uTime'), time)

    const activeTerminals = this._terminals.filter(t => t.active)
    if (activeTerminals.length === 0) return

    const posData = new Float32Array(activeTerminals.length * 3)
    for (let i = 0; i < activeTerminals.length; i++) {
      const t = activeTerminals[i]
      posData[i * 3 + 0] = t.position[0]
      posData[i * 3 + 1] = 0.2
      posData[i * 3 + 2] = t.position[1]
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuf)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, posData)
    const posLoc = gl.getAttribLocation(this.pointProg, 'aPos')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0)

    // Draw each type with different size/color
    for (let i = 0; i < activeTerminals.length; i++) {
      const t = activeTerminals[i]
      const size = t.type === 'hub' ? 12.0 : t.type === 'target' ? 10.0 : 8.0
      gl.uniform3fv(gl.getUniformLocation(this.pointProg, 'uColor'), t.color)
      gl.uniform1f(gl.getUniformLocation(this.pointProg, 'uOpacity'), 0.9)
      gl.uniform1f(gl.getUniformLocation(this.pointProg, 'uPointSize'), size / this.camZoom)
      gl.drawArrays(gl.POINTS, i, 1)
    }

    gl.disableVertexAttribArray(posLoc)
  }

  private _drawDrones(time: number): void {
    const gl = this.gl
    gl.useProgram(this.pointProg)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.pointProg, 'uMVP'), false, this.mvp as unknown as Float32Array)
    gl.uniform1f(gl.getUniformLocation(this.pointProg, 'uTime'), time)

    const aliveDrones = this._drones.filter(d => d.alive)
    if (aliveDrones.length === 0) return

    const posData = new Float32Array(aliveDrones.length * 3)
    for (let i = 0; i < aliveDrones.length; i++) {
      const d = aliveDrones[i]
      // Add hover effect
      const hover = 0.15 * Math.sin(time * 3 + i * 1.5)
      posData[i * 3 + 0] = d.position[0]
      posData[i * 3 + 1] = d.position[1] + hover
      posData[i * 3 + 2] = d.position[2]
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuf)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, posData)
    const posLoc = gl.getAttribLocation(this.pointProg, 'aPos')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0)

    for (let i = 0; i < aliveDrones.length; i++) {
      const d = aliveDrones[i]
      gl.uniform3fv(gl.getUniformLocation(this.pointProg, 'uColor'), d.color)
      gl.uniform1f(gl.getUniformLocation(this.pointProg, 'uOpacity'), 1.0)
      gl.uniform1f(gl.getUniformLocation(this.pointProg, 'uPointSize'), 16.0 / this.camZoom)
      gl.drawArrays(gl.POINTS, i, 1)
    }

    gl.disableVertexAttribArray(posLoc)
  }
}
