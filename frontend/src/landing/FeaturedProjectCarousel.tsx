import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FeaturedProject } from './FeaturedProject'

type Project = {
  id: string
  name: string
  description: string
  stack: string[]
  demoId?: 'guardianx' | 'ads' | 'soc' | 'guardianx-3d'
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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Slide Area */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={project.id}
            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0"
          >
            <FeaturedProject project={project} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls — Floating Island style */}
      {total > 1 && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-white hover:text-black active:scale-90"
            aria-label="Previous project"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            {index + 1} <span className="mx-1 opacity-40">/</span> {total}
          </div>

          <button
            type="button"
            onClick={goNext}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-white hover:text-black active:scale-90"
            aria-label="Next project"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
