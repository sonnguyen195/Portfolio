import { useState } from 'react'

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
    <div className="flex h-full flex-col">
      <span className="eyebrow">Professional Path</span>
      <h3 className="mb-4 text-xl font-bold text-white">Experience</h3>
      
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        {experience.map((job, i) => {
          const id = `${job.company}-${job.role}-${i}`
          const isExpanded = expandedId === id
          const bullets = job.bullets ?? []
          const hasMore = bullets.length > BULLETS_VISIBLE_DEFAULT
          const visibleBullets = isExpanded ? bullets : bullets.slice(0, BULLETS_VISIBLE_DEFAULT)

          return (
            <div key={id} className="relative pl-6">
              {/* Timeline Line */}
              {i < experience.length - 1 && (
                <div className="absolute left-[3px] top-7 h-[calc(100%+2rem)] w-px bg-zinc-800" />
              )}
              {/* Timeline Dot */}
              <div className="absolute left-0 top-2 h-2 w-2 rounded-full border border-zinc-700 bg-white shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
              
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-bold text-white">{job.role}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    {formatYears(job.start, job.end)}
                  </p>
                </div>
                <p className="text-xs font-medium text-zinc-400">
                  {job.company} · {job.location}
                </p>

                {bullets.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {visibleBullets.map((b, bi) => (
                      <li key={bi} className="text-[13px] leading-relaxed text-zinc-500">
                        {b}
                      </li>
                    ))}
                  </ul>
                )}

                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : id)}
                    className="mt-3 w-fit text-[11px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-70"
                  >
                    {isExpanded ? 'Show Less' : `+${bullets.length - BULLETS_VISIBLE_DEFAULT} More`}
                  </button>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {job.tech.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-500 uppercase tracking-tighter"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
