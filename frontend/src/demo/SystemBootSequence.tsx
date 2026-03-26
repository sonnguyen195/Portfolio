/**
 * Cinematic system boot sequence before demo scene reveal.
 * Animation sequencing + UI motion design.
 *
 * Sequence: system initializing → modules loading → AI systems online → scene reveal
 */
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
  { id: 'init', label: 'System initializing', duration: 800 },
  { id: 'modules', label: 'Modules loading', duration: 800 },
  { id: 'ai', label: 'AI systems online', duration: 800 },
  { id: 'reveal', label: 'Scene reveal', duration: 900 },
] as const

const STEP_DURATION_MS = 800
const REVEAL_DURATION_MS = 900

type SystemBootSequenceProps = {
  onComplete: () => void
}

export function SystemBootSequence({ onComplete }: SystemBootSequenceProps) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (stepIndex >= STEPS.length) {
      const t = setTimeout(onComplete, 400)
      return () => clearTimeout(t)
    }
    const step = STEPS[stepIndex]
    const duration = step.id === 'reveal' ? REVEAL_DURATION_MS : STEP_DURATION_MS
    const t = setTimeout(() => setStepIndex((i) => i + 1), duration)
    return () => clearTimeout(t)
  }, [stepIndex, onComplete])

  return (
    <div
      className="systemBootSequence"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #050a0f 0%, #0a1219 50%, #0d1a24 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Scanline overlay */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.02) 2px, rgba(0,212,255,0.02) 4px)',
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Center content */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
          zIndex: 1,
        }}
      >
        {/* Status lines */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            fontFamily: 'ui-monospace, monospace',
            fontSize: 13,
            letterSpacing: 0.15,
          }}
        >
          <AnimatePresence mode="sync">
            {STEPS.slice(0, stepIndex + 1).map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: i < stepIndex ? 'rgba(0,212,255,0.6)' : '#00d4ff',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: i < stepIndex ? '#00d4ff' : 'transparent',
                    border: '1px solid #00d4ff',
                    flexShrink: 0,
                  }}
                />
                <span>{step.label}</span>
                {i === stepIndex && (
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    style={{ marginLeft: 4 }}
                  >
                    _
                  </motion.span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: 200,
            height: 2,
            background: 'rgba(0,212,255,0.12)',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <motion.div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #00d4ff, #00ffcc)',
              borderRadius: 999,
              boxShadow: '0 0 12px rgba(0,212,255,0.5)',
            }}
            initial={{ width: 0 }}
            animate={{
              width: `${((stepIndex + 1) / STEPS.length) * 100}%`,
            }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </div>

        {/* Glow pulse on reveal step */}
        {stepIndex === STEPS.length - 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute',
              width: 320,
              height: 120,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(0,212,255,0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Corner accents */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          border: '1px solid rgba(0,212,255,0.08)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            width: 40,
            height: 40,
            borderTop: '1px solid rgba(0,212,255,0.3)',
            borderLeft: '1px solid rgba(0,212,255,0.3)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            width: 40,
            height: 40,
            borderTop: '1px solid rgba(0,212,255,0.3)',
            borderRight: '1px solid rgba(0,212,255,0.3)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 24,
            width: 40,
            height: 40,
            borderBottom: '1px solid rgba(0,212,255,0.3)',
            borderLeft: '1px solid rgba(0,212,255,0.3)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 40,
            height: 40,
            borderBottom: '1px solid rgba(0,212,255,0.3)',
            borderRight: '1px solid rgba(0,212,255,0.3)',
          }}
        />
      </div>
    </div>
  )
}
