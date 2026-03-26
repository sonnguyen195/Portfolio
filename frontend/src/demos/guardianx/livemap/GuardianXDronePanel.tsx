/**
 * GuardianX Drone Status Panel — shows live drone fleet status.
 * Positioned top-right, displays active drones with status indicators.
 */

import { useEffect, useState, type MutableRefObject } from 'react'
import type { GuardianXWebGLEngine } from '../engine/GuardianXWebGLEngine'
import type { DroneState } from '../engine/types'

const STATUS_COLORS: Record<string, string> = {
  idle: '#555',
  deploying: '#ff8800',
  'in-transit': '#00d4ff',
  patrolling: '#00ff88',
  returning: '#aaddff',
  landed: '#88cc44',
}

const STATUS_LABELS: Record<string, string> = {
  idle: 'IDLE',
  deploying: 'DEPLOYING',
  'in-transit': 'IN TRANSIT',
  patrolling: 'PATROLLING',
  returning: 'RTB',
  landed: 'LANDED',
}

interface Props {
  engineRef: MutableRefObject<GuardianXWebGLEngine | null>
}

export function GuardianXDronePanel({ engineRef }: Props) {
  const [drones, setDrones] = useState<DroneState[]>([])

  useEffect(() => {
    const timer = setInterval(() => {
      const eng = engineRef.current
      if (!eng) return
      const alive = eng.drones.filter(d => d.alive)
      setDrones(alive.map(d => ({ ...d })))
    }, 500)
    return () => clearInterval(timer)
  }, [engineRef])

  if (drones.length === 0) return null

  return (
    <div style={{
      position: 'absolute',
      top: 64,
      right: 16,
      width: 220,
      background: 'rgba(3,8,28,0.88)',
      border: '1px solid rgba(0,212,255,0.22)',
      borderRadius: 10,
      backdropFilter: 'blur(8px)',
      zIndex: 10,
      fontFamily: '"Courier New", Courier, monospace',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '6px 10px',
        borderBottom: '1px solid rgba(0,212,255,0.15)',
        fontSize: 10,
        letterSpacing: '0.12em',
        color: 'rgba(0,212,255,0.7)',
        fontWeight: 700,
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>DRONE FLEET</span>
        <span style={{ color: '#00ff88' }}>{drones.length} ACTIVE</span>
      </div>

      {/* Drone list */}
      <div style={{
        maxHeight: 200,
        overflowY: 'auto',
        scrollbarWidth: 'none',
      }}>
        {drones.map(d => {
          const statusColor = STATUS_COLORS[d.status] || '#555'
          const statusLabel = STATUS_LABELS[d.status] || d.status.toUpperCase()
          const progress = Math.round(d.routeProgress * 100)

          return (
            <div
              key={d.id}
              style={{
                padding: '5px 10px',
                borderBottom: '1px solid rgba(0,212,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: `rgb(${d.color[0] * 255},${d.color[1] * 255},${d.color[2] * 255})`,
                }}>
                  {d.label || d.id}
                </span>
                <span style={{
                  fontSize: 9,
                  color: statusColor,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                }}>
                  ● {statusLabel}
                </span>
              </div>

              {/* Mini progress bar */}
              <div style={{
                height: 2,
                borderRadius: 1,
                background: 'rgba(0,212,255,0.1)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: `rgb(${d.color[0] * 255},${d.color[1] * 255},${d.color[2] * 255})`,
                  borderRadius: 1,
                  transition: 'width 0.5s ease',
                }} />
              </div>

              <div style={{
                fontSize: 9,
                color: 'rgba(100,180,200,0.5)',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span>{progress}%</span>
                <span>{d.missionType.toUpperCase()}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
