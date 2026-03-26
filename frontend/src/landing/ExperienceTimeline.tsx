import { useState } from 'react'
import { motion } from 'framer-motion'

type ExperienceEntry = {
  company: string
  role: string
  location: string
  start: string
  end: string | null
  bullets?: string[]
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

const BULLETS_VISIBLE_DEFAULT = 4

export function ExperienceTimeline({ experience }: ExperienceTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <motion.section
      id="experience"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="card-base scroll-mt-20 flex h-full min-w-0 flex-col overflow-hidden p-3 min-[375px]:p-4 sm:p-6"
    >
      <h3 className="mb-4 text-sm font-semibold text-zinc-300">Experience</h3>
      <div className="relative flex flex-1 flex-col gap-6 overflow-y-auto">
        {experience.map((job, i) => {
          const id = `${job.company}-${job.role}-${i}`
          const isExpanded = expandedId === id
          const bullets = job.bullets ?? []
          const hasMore = bullets.length > BULLETS_VISIBLE_DEFAULT
          const visibleBullets = isExpanded ? bullets : bullets.slice(0, BULLETS_VISIBLE_DEFAULT)

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 + i * 0.03 }}
              className="relative pl-5"
            >
              {i < experience.length - 1 && (
                <div className="absolute left-0 top-5 h-[calc(100%+1.5rem)] w-px bg-gradient-to-b from-cyan-500/40 to-transparent" />
              )}
              <div className="absolute -left-[3px] top-1.5 h-2 w-2 shrink-0 rounded-full border-2 border-zinc-900 bg-cyan-500/80 shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200">{job.role}</p>
                <p className="text-xs text-zinc-500">
                  {job.company} · {job.location}
                </p>
                <p className="mt-0.5 text-[11px] text-cyan-500/80">{formatYears(job.start, job.end)}</p>

                {bullets.length > 0 && (
                  <ul className="mt-2.5 space-y-1.5 pl-0">
                    {visibleBullets.map((b, bi) => (
                      <li key={bi} className="flex gap-2 text-[11px] leading-relaxed text-zinc-400">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-500/60" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : id)}
                    className="mt-2 text-[11px] text-cyan-500/90 hover:text-cyan-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900"
                  >
                    {isExpanded ? 'Thu gọn' : `+${bullets.length - BULLETS_VISIBLE_DEFAULT} thêm`}
                  </button>
                )}

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {job.tech.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] text-zinc-500"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.section>
  )
}
