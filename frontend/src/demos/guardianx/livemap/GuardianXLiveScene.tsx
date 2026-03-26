/**
 * GuardianX Live Map Scene
 *
 * Full-featured 3D drone operations map with:
 *   • WebGL city map with 3D buildings, grid, districts
 *   • Drone flight paths with animated trails
 *   • Mission zones with pulsing rings
 *   • Terminal/hub markers
 *   • Command console with CLI + live log
 *   • Drone status panel
 *   • Simulation HUD (progress, stop)
 *
 * Mirrors SOC's SocDemoScene architecture but for drone operations.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { GuardianXWebGLEngine } from '../engine/GuardianXWebGLEngine'
import {
  runGuardianXSimulation,
  GX_SIMULATION_REGISTRY,
  type GuardianXSimulationId,
} from '../engine/GuardianXSimulation'
import { GuardianXCommandConsole, type GxLogEntry } from './GuardianXCommandConsole'
import { GuardianXDronePanel } from './GuardianXDronePanel'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(ts: number): string {
  const d = new Date(ts)
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join(':')
}

const HELP_TEXT = [
  'Commands:',
  '  sim deploy              — Deploy Drone Mission',
  '  sim emergency           — Emergency Delivery',
  '  sim patrol              — Drone Patrol Simulation',
  '  sim stop                — Stop active simulation',
  '  clear                   — Clear log',
  '  rotate on|off           — Auto-rotate camera',
  '  zoom in|out             — Adjust zoom level',
]

// ── Component ────────────────────────────────────────────────────────────────

export function GuardianXLiveScene({ onExit }: { onExit?: () => void } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GuardianXWebGLEngine | null>(null)
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const touchRef = useRef<{ x: number; y: number; dist: number } | null>(null)

  const [entries, setEntries] = useState<GxLogEntry[]>([])
  const [simRunning, setSimRunning] = useState(false)
  const [simName, setSimName] = useState('')
  const [simProgress, setSimProgress] = useState(0)
  const [activeDroneCount, setActiveDroneCount] = useState(0)
  const [activeZoneCount, setActiveZoneCount] = useState(0)
  const cancelSimRef = useRef<(() => void) | null>(null)

  // ── Mount: create engine ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let eng: GuardianXWebGLEngine
    try {
      eng = new GuardianXWebGLEngine(canvas)
      engineRef.current = eng
    } catch (err) {
      console.error('[GuardianXLiveScene] WebGL init failed:', err)
      return
    }

    // ── Resize ──────────────────────────────────────────────────────────────
    const onResize = () => eng.resize(canvas)
    window.addEventListener('resize', onResize)

    // ── Mouse drag (orbit) ──────────────────────────────────────────────────
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
      eng.orbitBy(-dx * 0.35, dy * 0.25)
    }
    const onMouseUp = () => {
      dragRef.current = null
      canvas.style.cursor = 'grab'
    }

    // ── Scroll wheel (zoom) ─────────────────────────────────────────────────
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 0.92 : 1.09
      eng.zoomBy(factor)
    }

    // ── Touch (orbit + pinch-zoom) ──────────────────────────────────────────
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
        eng.orbitBy(-dx * 0.35, dy * 0.25)
      } else if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX
        const dy = e.touches[1].clientY - e.touches[0].clientY
        const dist = Math.hypot(dx, dy)
        if (touchRef.current.dist > 0) {
          eng.zoomBy(dist / touchRef.current.dist)
        }
        touchRef.current.dist = dist
      }
    }
    const onTouchEnd = () => { touchRef.current = null }

    canvas.style.cursor = 'grab'
    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)

    // ── Status polling ──────────────────────────────────────────────────────
    const statusTimer = setInterval(() => {
      if (!eng) return
      const drones = eng.drones.filter(d => d.alive).length
      const zones = eng.missionZones.filter(z => z.active).length
      setActiveDroneCount(drones)
      setActiveZoneCount(zones)
    }, 500)

    return () => {
      clearInterval(statusTimer)
      eng.dispose()
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      engineRef.current = null
    }
  }, [])

  // ── Simulation start/stop ─────────────────────────────────────────────────
  const startSimulation = useCallback((simId: GuardianXSimulationId) => {
    const engine = engineRef.current
    if (!engine) return

    if (cancelSimRef.current) {
      cancelSimRef.current()
      cancelSimRef.current = null
    }

    const scenario = GX_SIMULATION_REGISTRY[simId]
    setSimRunning(true)
    setSimName(scenario.name)
    setSimProgress(0)
    setEntries([])

    engine.clearDrones()
    engine.deactivateAllZones()

    const sysEntry = (text: string): GxLogEntry => ({
      id: Math.random().toString(36).slice(2),
      time: fmtTime(Date.now()),
      type: 'system',
      color: '#00d4ff',
      text,
    })

    cancelSimRef.current = runGuardianXSimulation(simId, engine, {
      onLog: (message: string) => {
        // Color-code messages
        let color = '#00d4ff'
        let type: GxLogEntry['type'] = 'system'
        if (message.includes('🔴') || message.includes('CRITICAL') || message.includes('ALERT')) {
          color = '#ff4444'
          type = 'alert'
        } else if (message.includes('⚠') || message.includes('WARNING')) {
          color = '#ff8800'
          type = 'warning'
        } else if (message.includes('✓')) {
          color = '#00ff88'
          type = 'success'
        } else if (message.includes('▸') || message.includes('deployed') || message.includes('launched')) {
          color = '#00d4ff'
          type = 'drone'
        } else if (message.includes('⟐')) {
          color = '#88ccff'
          type = 'telemetry'
        } else if (message.includes('📡')) {
          color = '#aaddff'
          type = 'surveillance'
        }

        setEntries(prev => [...prev.slice(-200), {
          id: Math.random().toString(36).slice(2),
          time: fmtTime(Date.now()),
          type,
          color,
          text: message,
        }])
      },
      onProgress: (progress: number) => {
        setSimProgress(progress)
      },
      onComplete: () => {
        setSimRunning(false)
        setSimProgress(1)
        cancelSimRef.current = null
        setTimeout(() => {
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
    engineRef.current?.setAutoRotate(true)
    engineRef.current?.clearDrones()
    engineRef.current?.deactivateAllZones()
  }, [])

  useEffect(() => {
    return () => { cancelSimRef.current?.() }
  }, [])

  // ── Listen for shared Command Console events ──────────────────────────────
  useEffect(() => {
    const SIM_MAP: Record<string, GuardianXSimulationId> = {
      'deploy-mission':     'deploy-mission',
      'emergency-delivery': 'emergency-delivery',
      'drone-patrol':       'drone-patrol',
    }

    const onStart = (e: Event) => {
      const detail = (e as CustomEvent).detail as { optionId: string; system: string }
      if (detail.system !== 'guardianx') return
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

  // ── Command handler ───────────────────────────────────────────────────────
  const handleCommand = useCallback((cmd: string) => {
    const parts = cmd.trim().toLowerCase().split(/\s+/)

    const sysEntry = (text: string): GxLogEntry => ({
      id: Math.random().toString(36).slice(2),
      time: fmtTime(Date.now()),
      type: 'system',
      color: '#00d4ff',
      text,
    })

    switch (parts[0]) {
      case 'help':
        setEntries(prev => [...prev, ...HELP_TEXT.map(t => sysEntry(t))])
        break

      case 'clear':
        setEntries([])
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

      case 'zoom':
        if (parts[1] === 'in') {
          engineRef.current?.zoomBy(1.3)
          setEntries(prev => [...prev, sysEntry('Zoomed in')])
        } else if (parts[1] === 'out') {
          engineRef.current?.zoomBy(0.7)
          setEntries(prev => [...prev, sysEntry('Zoomed out')])
        }
        break

      case 'sim': {
        const SIM_MAP: Record<string, GuardianXSimulationId> = {
          deploy:    'deploy-mission',
          emergency: 'emergency-delivery',
          patrol:    'drone-patrol',
        }
        if (parts[1] === 'stop') {
          if (simRunning) {
            stopSimulation()
            setEntries(prev => [...prev, sysEntry('Simulation stopped')])
          } else {
            setEntries(prev => [...prev, sysEntry('No simulation running')])
          }
        } else if (parts[1] && SIM_MAP[parts[1]]) {
          const simId = SIM_MAP[parts[1]]
          const scenario = GX_SIMULATION_REGISTRY[simId]
          setEntries(prev => [...prev, sysEntry(`▶ Starting: ${scenario.name}`)])
          setTimeout(() => startSimulation(simId), 300)
        } else {
          setEntries(prev => [
            ...prev,
            sysEntry('Usage: sim deploy | sim emergency | sim patrol | sim stop'),
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
  }, [simRunning, startSimulation, stopSimulation])

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#030810',
      overflow: 'hidden',
    }}>
      {/* WebGL canvas */}
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />

      {/* Status indicator — top-left */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        fontFamily: 'monospace',
        fontSize: 11,
        color: 'rgba(0,212,255,0.7)',
        letterSpacing: '0.08em',
        pointerEvents: 'none',
        zIndex: 10,
      }}>
        <div style={{ marginBottom: 4, fontWeight: 700, fontSize: 13, color: '#00d4ff' }}>
          GUARDIANX OPS MAP
        </div>
        <div style={{ color: simRunning ? '#ff8800' : '#00ff88' }}>
          {simRunning ? '● SIMULATION' : '● STANDBY'}
        </div>
        <div style={{ marginTop: 4, color: 'rgba(100,180,200,0.7)' }}>
          DRONES: {activeDroneCount} · ZONES: {activeZoneCount}
        </div>
      </div>

      {/* Drone status panel — top-right */}
      {!simRunning && (
        <GuardianXDronePanel engineRef={engineRef} />
      )}

      {/* Simulation Focus HUD */}
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
          border: '1px solid rgba(0,212,255,0.4)',
          borderRadius: 10,
          backdropFilter: 'blur(10px)',
          zIndex: 20,
          fontFamily: 'monospace',
          minWidth: 280,
        }}>
          <div style={{
            fontSize: 10,
            letterSpacing: '0.16em',
            color: 'rgba(0,212,255,0.7)',
            fontWeight: 800,
          }}>
            SIMULATION ACTIVE
          </div>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#00d4ff',
            letterSpacing: '0.06em',
          }}>
            {simName}
          </div>
          <div style={{
            width: '100%',
            height: 4,
            borderRadius: 2,
            background: 'rgba(0,212,255,0.15)',
            border: '1px solid rgba(0,212,255,0.25)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.round(simProgress * 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #00d4ff, #00ff88)',
              borderRadius: 2,
              transition: 'width 0.3s ease',
              boxShadow: '0 0 8px rgba(0,212,255,0.5)',
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            fontSize: 10,
            color: 'rgba(100,200,255,0.7)',
          }}>
            <span>{Math.round(simProgress * 100)}%</span>
            <span>DRONES: {activeDroneCount} · ZONES: {activeZoneCount}</span>
            <button
              type="button"
              onClick={() => {
                stopSimulation()
                setEntries(prev => [...prev, {
                  id: Math.random().toString(36).slice(2),
                  time: fmtTime(Date.now()),
                  type: 'system',
                  color: '#00d4ff',
                  text: 'Simulation stopped by operator',
                }])
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

      {/* Controls panel — top-right area */}
      {!simRunning && (
        <div style={{
          position: 'absolute',
          top: 24,
          right: 16,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background: 'rgba(3,8,28,0.88)',
          border: '1px solid rgba(0,212,255,0.22)',
          borderRadius: 12,
          backdropFilter: 'blur(8px)',
          zIndex: 10,
        }}>
          <span style={{
            color: '#00d4ff',
            fontFamily: 'monospace',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}>◈</span>

          <div style={{ width: 1, height: 18, background: 'rgba(0,212,255,0.2)' }} />

          <span style={{
            fontSize: 11,
            fontFamily: 'monospace',
            letterSpacing: '0.06em',
            color: 'rgba(0,212,255,0.65)',
          }}>
            DRONE OPS
          </span>

          {onExit && (
            <>
              <div style={{ width: 1, height: 18, background: 'rgba(0,212,255,0.2)' }} />
              <button
                type="button"
                onClick={onExit}
                aria-label="Exit demo"
                style={{
                  background: 'transparent',
                  color: 'rgba(0,212,255,0.75)',
                  border: '1px solid rgba(0,212,255,0.3)',
                  borderRadius: 4,
                  padding: '2px 10px',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                }}
              >
                EXIT
              </button>
            </>
          )}
        </div>
      )}

      {/* Command console + log */}
      <GuardianXCommandConsole entries={entries} onCommand={handleCommand} />
    </div>
  )
}
