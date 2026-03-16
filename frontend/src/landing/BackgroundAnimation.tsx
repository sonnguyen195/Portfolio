import { motion, useReducedMotion } from 'framer-motion'

export function BackgroundAnimation() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_85%_40%,rgba(139,92,246,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_15%_85%,rgba(6,182,212,0.04),transparent_50%)]" />
      {/* Minimal grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />
      {/* Soft animated glow - disabled when prefers-reduced-motion */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[100px]"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)',
          top: '-15%',
          left: '-5%',
        }}
        initial={{ opacity: 0.12 }}
        animate={reduceMotion ? { opacity: 0.12 } : { opacity: [0.12, 0.18, 0.12] }}
        transition={{
          duration: 10,
          repeat: reduceMotion ? 0 : Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}
