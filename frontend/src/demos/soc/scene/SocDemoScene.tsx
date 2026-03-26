/**
 * SOC Demo Scene — main entry point.
 *
 * Mounts a raw WebGL canvas and wires up:
 *   • SocWebGLEngine   — renders the globe / flat map + attack arcs + icons
 *   • AttackSimulator  — generates random geo attacks
 *   • CommandConsole   — live log + CLI overlay
 *   • ModeToggle       — globe ↔ flat map toggle
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { SocWebGLEngine }    from '../engine/SocWebGLEngine'
import { AttackSimulator }   from '../simulation/AttackSimulator'
import { runSimulation, SIMULATION_REGISTRY, type SimulationId } from '../simulation/SimulationScenarios'
import type { EarthStyleIndex } from '../ui/EarthStyleToggle'
import SocThreatSidePanels from '../ui/SocThreatSidePanels'
import { CountryLabels }   from '../ui/CountryLabels'
import CommandConsole, { type LogEntry } from '../ui/CommandConsole'
import type { ViewMode }     from '../engine/cameraController'
import type { Attack, AttackType } from '../simulation/attackTypes'
import { EVENT_STATS_SEED, EVENT_CODES, hexForType, EVENT_META } from '../simulation/attackTypes'
import { nearestCityLabel } from '../simulation/worldCities'


function fmtTime(ts: number): string {
  const d = new Date(ts)
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join(':')
}

function attackToEntry(a: Attack): LogEntry {
  const label = EVENT_META[a.type].label
  const from = nearestCityLabel(a.src.lon, a.src.lat)
  const to = nearestCityLabel(a.dst.lon, a.dst.lat)
  return {
    id:    a.id,
    time:  fmtTime(a.timestamp),
    type:  a.type,
    color: hexForType(a.type),
    text:  `${label}  ${a.src.lon.toFixed(1)},${a.src.lat.toFixed(1)} → ${a.dst.lon.toFixed(1)},${a.dst.lat.toFixed(1)} (${from} → ${to})`,
  }
}

// Simple command help
const HELP_TEXT = [
  'Commands:',
  '  mode globe|flat          — switch view',
  '  speed fast|normal|slow   — attack rate',
  '  clear                    — clear log',
  '  pause / resume           — stop/start attacks',
  '  rotate on|off            — auto-rotate globe',
  '',
  'Simulations (focus mode — hides all panels):',
  '  sim attack               — Run Cyber Attack Simulation',
  '  sim response             — Run Incident Response',
  '  sim detect               — Run Threat Detection Sweep',
  '  sim stop                 — Stop active simulation',
]

export function SocDemoScene({ onExit }: { onExit?: () => void } = {}) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const engineRef  = useRef<SocWebGLEngine | null>(null)
  const simRef     = useRef<AttackSimulator | null>(null)
  const dragRef    = useRef<{ x: number; y: number } | null>(null)
  const touchRef   = useRef<{ x: number; y: number; dist: number } | null>(null)
  const modeRef    = useRef<ViewMode>('globe')

  const [mode,    setMode]    = useState<ViewMode>('globe')
  const [earthStyle, setEarthStyle] = useState<EarthStyleIndex>(0)
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [eventStats, setEventStats] = useState<Record<AttackType, number>>(
    () => ({ ...EVENT_STATS_SEED }),
  )
  // sessionStats starts at 0 — increments only from live attacks → real-time bars/ratios
  const [sessionStats, setSessionStats] = useState<Record<AttackType, number>>(
    () => Object.fromEntries(EVENT_CODES.map(t => [t, 0])) as Record<AttackType, number>,
  )
  const [paused,  setPaused]  = useState(false)

  // ── Simulation state ──────────────────────────────────────────────────────
  const [simRunning, setSimRunning]   = useState(false)
  const [simName, setSimName]         = useState<string>('')
  const [simProgress, setSimProgress] = useState(0)
  const cancelSimRef = useRef<(() => void) | null>(null)


  // ── Mount: create engine + simulator ──────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let eng: SocWebGLEngine
    try {
      eng = new SocWebGLEngine(canvas)
      engineRef.current = eng
    } catch (err) {
      console.error('[SocDemoScene] WebGL init failed:', err)
      return
    }

    const sim = new AttackSimulator((attack: Attack) => {
      eng.launch(
        [attack.src.lon, attack.src.lat],
        [attack.dst.lon, attack.dst.lat],
        attack.color,
        attack.type,
      )
      setEventStats(prev => ({ ...prev, [attack.type]: prev[attack.type] + 1 }))
      setSessionStats(prev => ({ ...prev, [attack.type]: prev[attack.type] + 1 }))
      setEntries(prev => [...prev.slice(-120), attackToEntry(attack)])
    }, 200)

    simRef.current = sim
    sim.start()

    // ── Resize ──────────────────────────────────────────────────────────────
    const onResize = () => eng.resize(canvas)
    window.addEventListener('resize', onResize)

    // ── Mouse drag (orbit / pan) ─────────────────────────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      dragRef.current = { x: e.clientX, y: e.clientY }
      canvas.style.cursor = 'grabbing'
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.x
      const dy = e.clientY - dragRef.current.y
      dragRef.current = { x: e.clientX, y: e.clientY }

      if (modeRef.current === 'globe') {
        eng.orbitBy(-dx * 0.35, dy * 0.25)
      } else {
        // Flat map: pan in world-units proportional to current zoom
        const ww = canvas.clientWidth  || 1
        const unitsPerPx = 20 / (ww * eng.flatZoom)
        eng.panBy(-dx * unitsPerPx, dy * unitsPerPx)
      }
    }
    const onMouseUp = () => {
      dragRef.current = null
      canvas.style.cursor = 'grab'
    }

    // ── Scroll wheel (zoom) ──────────────────────────────────────────────────
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 0.92 : 1.09
      eng.zoomBy(factor)
    }

    // ── Touch (orbit + pinch-zoom) ───────────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 }
      } else if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX
        const dy = e.touches[1].clientY - e.touches[0].clientY
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2
        touchRef.current = { x: cx, y: cy, dist: Math.hypot(dx, dy) }
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (!touchRef.current) return

      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchRef.current.x
        const dy = e.touches[0].clientY - touchRef.current.y
        touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 }
        if (modeRef.current === 'globe') {
          eng.orbitBy(-dx * 0.35, dy * 0.25)
        } else {
          const ww = canvas.clientWidth || 1
          const unitsPerPx = 20 / (ww * eng.flatZoom)
          eng.panBy(-dx * unitsPerPx, dy * unitsPerPx)
        }
      } else if (e.touches.length === 2) {
        const dx   = e.touches[1].clientX - e.touches[0].clientX
        const dy   = e.touches[1].clientY - e.touches[0].clientY
        const dist = Math.hypot(dx, dy)
        if (touchRef.current.dist > 0) {
          eng.zoomBy(dist / touchRef.current.dist)
        }
        touchRef.current.dist = dist
      }
    }
    const onTouchEnd = () => { touchRef.current = null }

    canvas.style.cursor = 'grab'
    canvas.addEventListener('mousedown',  onMouseDown)
    window.addEventListener('mousemove',  onMouseMove)
    window.addEventListener('mouseup',    onMouseUp)
    canvas.addEventListener('wheel',      onWheel,      { passive: false })
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false })
    canvas.addEventListener('touchend',   onTouchEnd)

    return () => {
      sim.stop()
      eng.dispose()
      window.removeEventListener('resize',    onResize)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
      canvas.removeEventListener('wheel',     onWheel)
      canvas.removeEventListener('touchstart',onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend',  onTouchEnd)
      engineRef.current = null
      simRef.current    = null
    }
  }, [])

  // ── Mode toggle ────────────────────────────────────────────────────────────
  const handleModeChange = useCallback((m: ViewMode) => {
    modeRef.current = m
    setMode(m)
    engineRef.current?.setMode(m)
  }, [])

  const handleEarthStyleChange = useCallback((s: EarthStyleIndex) => {
    setEarthStyle(s)
    engineRef.current?.setEarthStyle(s)
  }, [])

  // ── Simulation start/stop helpers ──────────────────────────────────────────
  const startSimulation = useCallback((simId: SimulationId) => {
    console.log('[SocDemoScene] startSimulation called with:', simId)
    const engine = engineRef.current
    if (!engine) { console.warn('[SocDemoScene] No engine!'); return }

    // Stop any running simulation first
    if (cancelSimRef.current) {
      cancelSimRef.current()
      cancelSimRef.current = null
    }

    // Stop the random attack feed — focus entirely on the simulation
    simRef.current?.stop()
    setPaused(true)

    const scenario = SIMULATION_REGISTRY[simId]
    setSimRunning(true)
    setSimName(scenario.name)
    setSimProgress(0)

    // Clear log and switch to globe mode for best visuals
    setEntries([])
    if (modeRef.current !== 'globe') {
      modeRef.current = 'globe'
      setMode('globe')
      engine.setMode('globe')
    }

    const sysEntry = (text: string): LogEntry => ({
      id: Math.random().toString(36).slice(2),
      time: fmtTime(Date.now()),
      type: 'cli',
      color: '#00e698',
      text,
    })

    cancelSimRef.current = runSimulation(simId, engine, {
      onLog: (message: string) => {
        setEntries(prev => [...prev.slice(-200), sysEntry(message)])
      },
      onProgress: (progress: number) => {
        setSimProgress(progress)
      },
      onComplete: () => {
        setSimRunning(false)
        setSimProgress(1)
        cancelSimRef.current = null

        // Resume normal attack flow after a short delay
        setTimeout(() => {
          simRef.current?.start()
          setPaused(false)
          setSimProgress(0)
          setSimName('')
        }, 2000)
      },
    })
  }, [])

  const stopSimulation = useCallback(() => {
    if (cancelSimRef.current) {
      cancelSimRef.current()
      cancelSimRef.current = null
    }
    setSimRunning(false)
    setSimProgress(0)
    setSimName('')

    // Resume normal attack flow
    simRef.current?.start()
    setPaused(false)
    engineRef.current?.setAutoRotate(true)
  }, [])

  // Clean up simulation on unmount
  useEffect(() => {
    return () => {
      if (cancelSimRef.current) {
        cancelSimRef.current()
      }
    }
  }, [])

  // ── Listen for "Run Simulation" button from shared CommandConsole ─────────
  useEffect(() => {
    const SIM_MAP: Record<string, SimulationId> = {
      'cyber-attack':      'cyber-attack',
      'incident-response': 'incident-response',
      'threat-detection':  'threat-detection',
    }

    const onStart = (e: Event) => {
      const detail = (e as CustomEvent).detail as { optionId: string; system: string }
      if (detail.system !== 'soc') return
      const simId = SIM_MAP[detail.optionId]
      if (simId) startSimulation(simId)
    }
    const onStop = () => {
      if (simRunning) stopSimulation()
    }

    window.addEventListener('demo-simulation-start', onStart)
    window.addEventListener('demo-simulation-stop', onStop)
    return () => {
      window.removeEventListener('demo-simulation-start', onStart)
      window.removeEventListener('demo-simulation-stop', onStop)
    }
  }, [startSimulation, stopSimulation, simRunning])

  // ── Command handler ────────────────────────────────────────────────────────
  const handleCommand = useCallback((cmd: string) => {
    const parts = cmd.trim().toLowerCase().split(/\s+/)

    const sysEntry = (text: string): LogEntry => ({
      id: Math.random().toString(36).slice(2),
      time: fmtTime(Date.now()),
      type: 'cli',
      color: '#00e698',
      text,
    })

    switch (parts[0]) {
      case 'help':
        setEntries(prev => [
          ...prev,
          ...HELP_TEXT.map(t => sysEntry(t)),
        ])
        break

      case 'mode':
        if (parts[1] === 'globe' || parts[1] === 'flat') {
          handleModeChange(parts[1] as ViewMode)
          setEntries(prev => [...prev, sysEntry(`Switched to ${parts[1]} mode`)])
        }
        break

      case 'speed':
        if (parts[1] === 'fast') {
          simRef.current?.setInterval(150)
          setEntries(prev => [...prev, sysEntry('Attack rate: FAST (150ms) ~33/s')])
        } else if (parts[1] === 'slow') {
          simRef.current?.setInterval(1200)
          setEntries(prev => [...prev, sysEntry('Attack rate: SLOW (1200ms) ~4/s')])
        } else if (parts[1] === 'normal') {
          simRef.current?.setInterval(400)
          setEntries(prev => [...prev, sysEntry('Attack rate: NORMAL (400ms) ~12/s')])
        }
        break

      case 'clear':
        setEntries([])
        break

      case 'pause':
        simRef.current?.stop()
        setPaused(true)
        setEntries(prev => [...prev, sysEntry('Simulation paused')])
        break

      case 'resume':
        simRef.current?.start()
        setPaused(false)
        setEntries(prev => [...prev, sysEntry('Simulation resumed')])
        break

      case 'rotate':
        if (parts[1] === 'off') {
          engineRef.current?.setAutoRotate(false)
          setEntries(prev => [...prev, sysEntry('Auto-rotate OFF')])
        } else {
          engineRef.current?.setAutoRotate(true)
          setEntries(prev => [...prev, sysEntry('Auto-rotate ON')])
        }
        break

      case 'sim': {
        const SIM_MAP: Record<string, SimulationId> = {
          attack:   'cyber-attack',
          response: 'incident-response',
          detect:   'threat-detection',
        }
        if (parts[1] === 'stop') {
          if (simRunning) {
            stopSimulation()
            setEntries(prev => [...prev, sysEntry('Simulation stopped — resuming normal feed')])
          } else {
            setEntries(prev => [...prev, sysEntry('No simulation running')])
          }
        } else if (parts[1] && SIM_MAP[parts[1]]) {
          const simId = SIM_MAP[parts[1]]
          const scenario = SIMULATION_REGISTRY[simId]
          setEntries(prev => [...prev, sysEntry(`▶ Starting: ${scenario.name}`)])
          // Small delay so the log message is visible before clearing
          setTimeout(() => startSimulation(simId), 300)
        } else {
          setEntries(prev => [
            ...prev,
            sysEntry('Usage: sim attack | sim response | sim detect | sim stop'),
          ])
        }
        break
      }

      default:
        setEntries(prev => [
          ...prev,
          sysEntry(`Unknown command: "${parts[0]}". Type "help".`),
        ])
    }
  }, [handleModeChange, simRunning, startSimulation, stopSimulation])

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#04060f',
      overflow: 'hidden',
    }}>
      {/* WebGL canvas — fills entire container */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />

      {/* Country name labels — 2-D canvas overlay projected from 3-D ECEF positions */}
      <CountryLabels engineRef={engineRef} isGlobe={mode === 'globe'} earthStyle={earthStyle} />

      {/* Threat / protocol panels — hidden during simulation focus mode */}
      {!simRunning && (
        <SocThreatSidePanels eventStats={eventStats} sessionStats={sessionStats} />
      )}

      {/* Status indicator — top-left */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        fontFamily: 'monospace',
        fontSize: 11,
        color: 'rgba(0,180,255,0.7)',
        letterSpacing: '0.08em',
        pointerEvents: 'none',
        zIndex: 10,
      }}>
        <div style={{ marginBottom: 4, fontWeight: 700, fontSize: 13, color: '#00d4ff' }}>
          SOC THREAT MAP
        </div>
        <div>MODE: {mode.toUpperCase()}</div>
        {simRunning ? (
          <div style={{ color: '#ff8800' }}>
            ● SIMULATION
          </div>
        ) : (
          <div style={{ color: paused ? '#ff4444' : '#00ff88' }}>
            {paused ? '● PAUSED' : '● LIVE'}
          </div>
        )}
        <div style={{ marginTop: 4, color: 'rgba(100,160,180,0.7)' }}>
          EVENTS: {entries.length}
        </div>
      </div>

      {/* ── Simulation Focus HUD ─────────────────────────────────────────── */}
      {simRunning && (
        <div style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          padding: '10px 24px 12px',
          background: 'rgba(3,8,28,0.92)',
          border: '1px solid rgba(255,136,0,0.4)',
          borderRadius: 10,
          backdropFilter: 'blur(10px)',
          zIndex: 20,
          fontFamily: 'monospace',
          minWidth: 280,
        }}>
          <div style={{
            fontSize: 10,
            letterSpacing: '0.16em',
            color: 'rgba(255,136,0,0.7)',
            fontWeight: 800,
          }}>
            SIMULATION ACTIVE
          </div>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#ff8800',
            letterSpacing: '0.06em',
          }}>
            {simName}
          </div>
          {/* Progress bar */}
          <div style={{
            width: '100%',
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,136,0,0.15)',
            border: '1px solid rgba(255,136,0,0.25)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.round(simProgress * 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ff8800, #ffcc00)',
              borderRadius: 2,
              transition: 'width 0.3s ease',
              boxShadow: '0 0 8px rgba(255,136,0,0.5)',
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            fontSize: 10,
            color: 'rgba(255,200,100,0.7)',
          }}>
            <span>{Math.round(simProgress * 100)}%</span>
            <button
              type="button"
              onClick={() => {
                stopSimulation()
                const sysEntry: LogEntry = {
                  id: Math.random().toString(36).slice(2),
                  time: fmtTime(Date.now()),
                  type: 'cli',
                  color: '#00e698',
                  text: 'Simulation stopped — resuming normal feed',
                }
                setEntries(prev => [...prev, sysEntry])
              }}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,68,68,0.4)',
                borderRadius: 3,
                color: '#ff4444',
                fontSize: 9,
                fontFamily: 'monospace',
                letterSpacing: '0.1em',
                padding: '1px 8px',
                cursor: 'pointer',
              }}
            >
              STOP
            </button>
          </div>
        </div>
      )}

      {/* Controls panel — hidden during simulation focus mode */}
      {!simRunning && (
      <div style={{
        position: 'absolute',
        top: 24,
        right: 352,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        background: 'rgba(3,8,28,0.88)',
        border: '1px solid rgba(0,180,255,0.22)',
        borderRadius: 12,
        backdropFilter: 'blur(8px)',
        zIndex: 10,
      }}>
        {/* Panel label */}
        <span style={{
          color: '#4dd9fc',
          fontFamily: 'monospace',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}>◈</span>

        {/* Thin divider */}
        <div style={{ width: 1, height: 18, background: 'rgba(0,180,255,0.2)' }} />

        {/* View select — inline label + select */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <span style={{
            fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.06em',
            color: 'rgba(0,180,255,0.65)', whiteSpace: 'nowrap',
          }}>VIEW</span>
          <select
            value={mode}
            onChange={e => handleModeChange(e.target.value as typeof mode)}
            style={{
              background: 'rgba(0,10,25,0.8)',
              color: '#00d4ff',
              border: '1px solid rgba(0,180,255,0.28)',
              borderRadius: 5,
              padding: '3px 6px',
              fontSize: 11,
              fontFamily: 'monospace',
              letterSpacing: '0.06em',
              outline: 'none',
              cursor: 'pointer',
              width: 88,
            }}
          >
            <option value="globe">3D Globe</option>
            <option value="flat">2D Map</option>
          </select>
        </label>

        {/* Style select — inline label + select */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <span style={{
            fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.06em',
            color: 'rgba(0,180,255,0.65)', whiteSpace: 'nowrap',
          }}>STYLE</span>
          <select
            value={earthStyle}
            onChange={e => handleEarthStyleChange(Number(e.target.value) as EarthStyleIndex)}
            style={{
              background: 'rgba(0,10,25,0.8)',
              color: '#00d4ff',
              border: '1px solid rgba(0,180,255,0.28)',
              borderRadius: 5,
              padding: '3px 6px',
              fontSize: 11,
              fontFamily: 'monospace',
              letterSpacing: '0.06em',
              outline: 'none',
              cursor: 'pointer',
              width: 104,
            }}
          >
            <option value={0}>Mono Tech</option>
            <option value={1}>Neon Cyber</option>
                      <option value={2}>Realistic</option>
          </select>
        </label>

        {/* EXIT — only when onExit is provided */}
        {onExit && (
          <>
            <div style={{ width: 1, height: 18, background: 'rgba(0,180,255,0.2)' }} />
            <button
              type="button"
              onClick={onExit}
              aria-label="Exit demo"
              style={{
                background: 'transparent',
                color: 'rgba(0,180,255,0.75)',
                border: '1px solid rgba(0,180,255,0.3)',
                borderRadius: 4,
                padding: '2px 10px',
                fontSize: 11,
                fontFamily: 'monospace',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              EXIT
            </button>
          </>
        )}
      </div>
      )}

      {/* Live attack log + command console */}
      <CommandConsole entries={entries} eventStats={eventStats} onCommand={handleCommand} />
    </div>
  )
}
