import { motion } from 'framer-motion'

type Project = {
  id: string
  name: string
  description: string
  stack: string[]
  demoId?: 'guardianx' | 'ads'
}

type ProjectsGridProps = {
  projects: Project[]
}

export function ProjectsGrid({ projects }: ProjectsGridProps) {
  return (
    <motion.section
      id="projects"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="card-base scroll-mt-20 flex h-full flex-col"
    >
      {/* Header */}
      <h3 className="mb-4 text-sm font-semibold text-zinc-300">Projects</h3>
      {/* Content — consistent card structure, equal heights */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3 sm:grid-rows-1">
        {projects.map((proj, i) => (
          <motion.a
            key={proj.id}
            href={proj.demoId ? `/demo/${proj.demoId}` : '#'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.12 + i * 0.05 }}
            className="group flex min-h-0 cursor-pointer flex-col rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-500/25 hover:bg-white/[0.05] hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)]"
          >
            <div className="mb-2 aspect-video max-h-[72px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-zinc-800/90 to-zinc-900/90">
              <div className="flex h-full w-full items-center justify-center">
                <div className="grid grid-cols-3 gap-1 rounded border border-white/10 bg-black/20 p-2">
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className="h-1.5 w-4 rounded bg-zinc-600/50" />
                  ))}
                </div>
              </div>
            </div>
            <h4 className="shrink-0 text-sm font-medium text-zinc-200 transition-colors group-hover:text-cyan-400/90">{proj.name}</h4>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-zinc-500">{proj.description}</p>
            <div className="mt-1.5 flex shrink-0 flex-wrap gap-1">
              {proj.stack.slice(0, 3).map((t) => (
                <span key={t} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-zinc-500">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-2 flex shrink-0 gap-2">
              {proj.demoId && (
                <span className="text-[11px] font-medium text-cyan-400/90">View demo →</span>
              )}
            </div>
          </motion.a>
        ))}
      </div>
    </motion.section>
  )
}
