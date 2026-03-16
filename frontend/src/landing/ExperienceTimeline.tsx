import { motion } from 'framer-motion'

type ExperienceEntry = {
  company: string
  role: string
  location: string
  start: string
  end: string | null
  tech: string[]
}

type ExperienceTimelineProps = {
  experience: ExperienceEntry[]
}

function formatYears(start: string, end: string | null): string {
  const s = start.slice(0, 4)
  const e = end ? end.slice(0, 4) : 'Present'
  return `${s} – ${e}`
}

export function ExperienceTimeline({ experience }: ExperienceTimelineProps) {
  const visibleItems = experience.slice(0, 3)

  return (
    <motion.section
      id="experience"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="card-base scroll-mt-20 flex h-full flex-col"
    >
      {/* Header */}
      <h3 className="mb-3 text-sm font-semibold text-zinc-300">Experience</h3>
      {/* Content — max 3 items, vertical timeline */}
      <div className="relative flex flex-1 flex-col">
        {visibleItems.map((job, i) => (
          <motion.div
            key={`${job.company}-${i}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
            className="relative pl-5"
          >
            {i < visibleItems.length - 1 && (
              <div className="absolute left-0 top-6 h-[calc(100%+1rem)] w-px bg-gradient-to-b from-cyan-500/40 to-transparent" />
            )}
            <div className="absolute -left-[3px] top-1.5 h-2 w-2 rounded-full border-2 border-zinc-900 bg-cyan-500/80 shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
            <p className="text-sm font-medium text-zinc-200">{job.role}</p>
            <p className="text-xs text-zinc-500">
              {job.company} · {job.location}
            </p>
            <p className="mt-0.5 text-[11px] text-cyan-500/80">{formatYears(job.start, job.end)}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {job.tech.slice(0, 3).map((t) => (
                <span key={t} className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-zinc-500">
                  {t}
                </span>
              ))}
            </div>
            {i < visibleItems.length - 1 && <div className="mt-3" />}
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
