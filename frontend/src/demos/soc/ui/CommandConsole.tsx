/**
 * Cyberstat-style legend (event channels + live totals) + terminal for demo commands.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { AttackType } from '../simulation/attackTypes'
import { EVENT_META, EVENT_ORDER } from '../simulation/attackTypes'

export type LogEntryType = AttackType | 'cli'

export interface LogEntry {
  id:      string
  time:    string
  type:    LogEntryType
  text:    string
  color:   string
}

interface Props {
  entries:     LogEntry[]
  eventStats:  Record<AttackType, number>
  onCommand:   (cmd: string) => void
}

function formatStat(n: number): string {
  return n.toLocaleString('en-US')
}

const mono = { fontFamily: '"Courier New", Courier, monospace' }

export default function CommandConsole({ entries, eventStats, onCommand }: Props) {
  const [input, setInput]       = useState('')
  const [history, setHistory]   = useState<string[]>([])
  const [histIdx, setHistIdx]   = useState(-1)
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
    if (e.key === 'Enter')     { submit(); return }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHistIdx(i => Math.min(i + 1, history.length - 1)) }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHistIdx(i => Math.max(i - 1, -1)) }
  }

  useEffect(() => {
    if (histIdx >= 0 && history.length > 0) {
      setInput(history[history.length - 1 - histIdx])
    } else if (histIdx === -1) {
      setInput('')
    }
  }, [histIdx, history])

  const labelFor = (t: LogEntryType) => {
    if (t === 'cli') return '>'
    return EVENT_META[t as AttackType].label
  }

  return (
    <>
      {/* Full-width Cyberstat-style channel bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 52,
        display: 'flex',
        borderTop: '1px solid rgba(0, 100, 80, 0.35)',
        background: 'linear-gradient(180deg, rgba(2,12,18,0.92) 0%, rgba(0,8,12,0.96) 100%)',
        zIndex: 11,
        ...mono,
      }}>
        {EVENT_ORDER.map(code => {
          const m = EVENT_META[code]
          return (
            <div
              key={code}
              title={m.description}
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderLeft: '1px solid rgba(0,80,60,0.35)',
                padding: '2px 4px',
              }}
            >
              <div style={{
                fontSize: 9,
                color: 'rgba(100, 200, 160, 0.55)',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
                textAlign: 'center',
              }}>
                {formatStat(eventStats[code])}
              </div>
              <div style={{
                fontSize: 11,
                fontWeight: 800,
                color: m.hex,
                letterSpacing: '0.06em',
                textShadow: `0 0 12px ${m.hex}55`,
              }}>
                {m.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Log + CLI — sits above the legend bar */}
      <div style={{
        position: 'absolute',
        bottom: 52,
        left: 0,
        width: 'min(640px, calc(100vw - 24px))',
        maxWidth: '100%',
        height: 200,
        background: 'rgba(3,8,18,0.88)',
        border: '1px solid rgba(0,180,255,0.2)',
        borderBottom: 'none',
        borderLeft: 'none',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        ...mono,
      }}>
        <div style={{
          padding: '4px 10px',
          borderBottom: '1px solid rgba(0,180,255,0.15)',
          fontSize: 10,
          color: 'rgba(0,180,255,0.7)',
          letterSpacing: '0.1em',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>EVENT LOG</span>
          <span style={{ color: '#00ff88' }}>● LIVE</span>
        </div>

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
              <span style={{ color: 'rgba(80,120,140,0.8)', flexShrink: 0 }}>{e.time}</span>
              <span style={{
                color: e.color,
                fontWeight: 700,
                flexShrink: 0,
                width: 34,
              }}>
                [{labelFor(e.type)}]
              </span>
              <span style={{ color: 'rgba(180,210,230,0.9)' }}>
                {e.text}
              </span>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          borderTop: '1px solid rgba(0,180,255,0.15)',
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
