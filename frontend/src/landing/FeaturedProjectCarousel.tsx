import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FeaturedProject } from './FeaturedProject'

type Project = {
  id: string
  name: string
  description: string
  stack: string[]
  demoId?: 'guardianx' | 'ads'
  keyFeatures?: string[]
  systemArchitecture?: string[]
}

type FeaturedProjectCarouselProps = {
  projects: Project[]
}

export function FeaturedProjectCarousel({ projects }: FeaturedProjectCarouselProps) {
  const [index, setIndex] = useState(0)
  const total = projects.length
  const project = projects[index]

  if (total === 0) return null

  const goPrev = () => setIndex((i) => (i - 1 + total) % total)
  const goNext = () => setIndex((i) => (i + 1) % total)

  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-visible lg:h-full lg:overflow-hidden lg:min-h-[480px]">
      {/* Mobile: grow to fit content; Desktop: fixed height with overflow */}
      <div className="relative min-h-0 flex-none lg:flex-1 overflow-visible lg:overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={project.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="relative lg:absolute lg:inset-0"
          >
            <FeaturedProject project={project} />
          </motion.div>
        </AnimatePresence>
      </div>
      {total > 1 && (
        <div className="mt-3 flex shrink-0 items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 sm:px-4 py-2">
          <button
            type="button"
            onClick={goPrev}
            className="flex min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200 active:scale-95"
            aria-label="Previous project"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs text-zinc-500">
            {index + 1} / {total}
          </span>
          <button
            type="button"
            onClick={goNext}
            className="flex min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200 active:scale-95"
            aria-label="Next project"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
