/**
 * GuardianX Command Console — live log + CLI for drone operations.
 * Styled for drone ops context (cyan/green theme instead of SOC's attack theme).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'

export type GxLogEntryType = 'system' | 'drone' | 'alert' | 'warning' | 'success' | 'telemetry' | 'surveillance' | 'cli'

export interface GxLogEntry {
  id: string
  time: string
  type: GxLogEntryType
  text: string
  color: string
}

interface Props {
  entries: GxLogEntry[]
  onCommand: (cmd: string) => void
}

const TYPE_LABELS: Record<GxLogEntryType, string> = {
  system: 'SYS',
  drone: 'DRN',
  alert: 'ALT',
  warning: 'WRN',
  success: 'OK',
  telemetry: 'TEL',
  surveillance: 'SRV',
  cli: '>',
}

const mono = { fontFamily: '"Courier New", Courier, monospace' }

// ── Drone status bar channels ────────────────────────────────────────────────

const DRONE_CHANNELS = [
  { label: 'DEPLOY', color: '#00d4ff', description: 'Active deployments' },
  { label: 'TRANSIT', color: '#00ff88', description: 'Drones in transit' },
  { label: 'PATROL', color: '#88ccff', description: 'Patrol missions' },
  { label: 'EMRGNCY', color: '#ff4444', description: 'Emergency deliveries' },
  { label: 'ZONES', color: '#ff8800', description: 'Active zones' },
  { label: 'HUBS', color: '#aaddff', description: 'Online hubs' },
] as const

export function GuardianXCommandConsole({ entries, onCommand }: Props) {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [entries])

  const submit = useCallback(() => {
    const cmd = input.trim()
    if (!cmd) return
    setHistory(h => [...h, cmd])
    setHistIdx(-1)
    onCommand(cmd)
    setInput('')
  }, [input, onCommand])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { submit(); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHistIdx(i => Math.min(i + 1, history.length - 1)) }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHistIdx(i => Math.max(i - 1, -1)) }
  }

  useEffect(() => {
    if (histIdx >= 0 && history.length > 0) {
      setInput(history[history.length - 1 - histIdx])
    } else if (histIdx === -1) {
      setInput('')
    }
  }, [histIdx, history])

  return (
    <>
      {/* Bottom status bar — drone operation channels */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 48,
        display: 'flex',
        borderTop: '1px solid rgba(0, 180, 255, 0.25)',
        background: 'linear-gradient(180deg, rgba(2,12,18,0.92) 0%, rgba(0,8,12,0.96) 100%)',
        zIndex: 11,
        ...mono,
      }}>
        {DRONE_CHANNELS.map((ch, i) => (
          <div
            key={ch.label}
            title={ch.description}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderLeft: i > 0 ? '1px solid rgba(0,180,255,0.2)' : 'none',
              padding: '2px 4px',
            }}
          >
            <div style={{
              fontSize: 11,
              fontWeight: 800,
              color: ch.color,
              letterSpacing: '0.06em',
              textShadow: `0 0 12px ${ch.color}55`,
            }}>
              {ch.label}
            </div>
            <div style={{
              fontSize: 8,
              color: 'rgba(100,180,200,0.45)',
              letterSpacing: '0.02em',
              marginTop: 1,
            }}>
              ●
            </div>
          </div>
        ))}
      </div>

      {/* Log + CLI — above status bar */}
      <div style={{
        position: 'absolute',
        bottom: 48,
        left: 0,
        width: 'min(640px, calc(100vw - 24px))',
        maxWidth: '100%',
        height: 200,
        background: 'rgba(3,8,18,0.88)',
        border: '1px solid rgba(0,212,255,0.2)',
        borderBottom: 'none',
        borderLeft: 'none',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        ...mono,
      }}>
        {/* Header */}
        <div style={{
          padding: '4px 10px',
          borderBottom: '1px solid rgba(0,212,255,0.15)',
          fontSize: 10,
          color: 'rgba(0,212,255,0.7)',
          letterSpacing: '0.1em',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>OPERATIONS LOG</span>
          <span style={{ color: '#00ff88' }}>● ACTIVE</span>
        </div>

        {/* Log entries */}
        <div ref={listRef} style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '4px 6px',
          fontSize: 11,
          lineHeight: '1.5',
          scrollbarWidth: 'none',
        }}>
          {entries.slice(-60).map(e => (
            <div
              key={e.id}
              style={{
                display: 'flex',
                gap: 6,
                marginBottom: 1,
                whiteSpace: 'nowrap',
                minWidth: 'min-content',
              }}
            >
              <span style={{ color: 'rgba(80,140,160,0.8)', flexShrink: 0 }}>{e.time}</span>
              <span style={{
                color: e.color,
                fontWeight: 700,
                flexShrink: 0,
                width: 34,
              }}>
                [{TYPE_LABELS[e.type] || 'SYS'}]
              </span>
              <span style={{ color: 'rgba(180,220,240,0.9)' }}>
                {e.text}
              </span>
            </div>
          ))}
        </div>

        {/* CLI input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          borderTop: '1px solid rgba(0,212,255,0.15)',
          padding: '2px 6px',
        }}>
          <span style={{ color: '#00d4ff', marginRight: 6, fontSize: 12 }}>{'>'}</span>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#a0d4e8',
              fontSize: 12,
              ...mono,
              caretColor: '#00d4ff',
            }}
            placeholder="help"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </>
  )
}
