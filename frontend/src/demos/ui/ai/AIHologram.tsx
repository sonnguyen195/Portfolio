/**
 * AI hologram assistant — Jarvis-style floating panel.
 * System messages, alerts, mission updates.
 */
import { useEffect, useState, useRef } from 'react'
import { onAnyTrigger } from '../../core/timeline'
import {
  subscribeToMessages,
  pushMessage,
  getMessageForTrigger,
  type AIMessage,
  type MessageType,
} from './AIMessageSystem'
import { HOLOGRAM_ANIMATION } from './HologramAnimation'

type AIHologramProps = {
  /** Demo context: 'soc' | 'guardianx' */
  demoContext: 'soc' | 'guardianx'
  /** Optional class for positioning */
  className?: string
}

const SCENARIO_MAP = {
  soc: 'soc-attack' as const,
  guardianx: 'guardianx-mission' as const,
}

export function AIHologram({ demoContext, className = '' }: AIHologramProps) {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scenarioId = SCENARIO_MAP[demoContext]

  useEffect(() => {
    const unsubMsg = subscribeToMessages((msg) => {
      setMessages((prev) => [...prev.slice(-4), msg])
    })
    return () => {
      unsubMsg()
      if (timeoutRef.current != null) clearInterval(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const unsub = onAnyTrigger(scenarioId, (e) => {
      const text = getMessageForTrigger(scenarioId, e.trigger.id)
      if (text) {
        const type: MessageType =
          e.trigger.type === 'complete' ? 'mission'
          : e.trigger.id.includes('threat') || e.trigger.id.includes('attack') ? 'alert'
          : 'system'
        pushMessage(text, type)
      }
    })
    return unsub
  }, [scenarioId])

  useEffect(() => {
    if (messages.length === 0) return
    setCurrentIndex(messages.length - 1)
    if (timeoutRef.current) clearInterval(timeoutRef.current)
    const iv = setInterval(() => {
      setCurrentIndex((i) => (i >= messages.length - 1 ? 0 : i + 1))
    }, HOLOGRAM_ANIMATION.messageDisplay)
    timeoutRef.current = iv
    return () => {
      clearInterval(iv)
      timeoutRef.current = null
    }
  }, [messages.length])

  const current = messages[Math.min(currentIndex, Math.max(0, messages.length - 1))]

  return (
    <div
      className={`
        aiHologramPanel ui-panel ui-panel-top-left
        rounded-xl overflow-hidden
        ${className}
      `}
      style={{
        position: 'absolute',
        top: 24,
        left: 24,
        minWidth: 260,
        maxWidth: 300,
        zIndex: 20,
      }}
    >
      <div className="relative px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/90">
            AI Assistant
          </span>
        </div>
        <div className="min-h-[2.5rem] flex items-start">
          {current ? (
            <p
              key={current.id}
              className={`
                text-sm text-cyan-100/95 leading-relaxed
                ${current.type === 'alert' ? 'text-amber-300' : ''}
                ${current.type === 'mission' ? 'text-emerald-300 font-medium' : ''}
              `}
              style={{
                animation: `aiMessageFadeIn ${HOLOGRAM_ANIMATION.messageFadeIn}ms ease-out`,
              }}
            >
              {current.text}
            </p>
          ) : (
            <p className="text-sm text-cyan-400/60 italic animate-pulse">Scanning...</p>
          )}
        </div>
      </div>
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl"
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.08) 0%, transparent 70%)',
          }}
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-cyan-400/60 aiHologramParticle"
            style={{
              left: `${15 + i * 22}%`,
              top: `${20 + (i % 3) * 30}%`,
              animation: `aiParticleDrift 4s ease-in-out ${i * 0.4}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
