import { motion } from 'framer-motion'

type AboutPanelProps = {
  name: string
  title: string
  summary: string
  skills: string[]
}

export function AboutPanel({ name, title, summary, skills }: AboutPanelProps) {
  return (
    <motion.section
      id="about"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="card-base scroll-mt-20 flex h-full flex-col overflow-hidden p-3 min-[375px]:p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <div className="mb-3 min-[375px]:mb-4 h-12 w-12 min-[375px]:h-14 min-[375px]:w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/25 to-violet-500/20 ring-1 ring-white/10 shadow-lg">
          <div className="flex h-full w-full items-center justify-center text-lg min-[375px]:text-xl font-semibold text-cyan-400/90">
            {name.charAt(0)}
          </div>
        </div>
        <h2 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-100">{name}</h2>
        <p className="mt-1 text-xs sm:text-sm text-cyan-400/90">{title}</p>
      </div>
      {/* Content — full context, no truncation */}
      <p className="mt-2 min-[375px]:mt-3 text-xs sm:text-[13px] leading-relaxed text-zinc-500">{summary}</p>
      {/* Footer — skills */}
      <div className="mt-3 min-[375px]:mt-4 flex flex-wrap justify-center gap-1.5 min-[375px]:gap-2 lg:justify-start">
        {skills.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs text-zinc-400 transition-colors hover:border-cyan-500/30 hover:text-zinc-300"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/60" />
            <span>{s}</span>
          </span>
        ))}
      </div>
    </motion.section>
  )
}
