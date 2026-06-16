/**
 * FAANG-level portfolio landing page — Apple/Stripe/Linear/Vercel inspired.
 */
import { memo, useEffect, useState, useCallback } from 'react'
import type { Portfolio } from './types/portfolio'
import {
  AboutPanel,
  FeaturedProjectCarousel,
  ExperienceTimeline,
  ContactPanel,
  BackgroundAnimation,
  CommandPalette,
} from './landing'
import { staggerReveal } from './lib/animations'
import { motion, AnimatePresence } from 'framer-motion'

type LandingPageProps = {
  data: Portfolio
  year: number
  onSwitchTo3D: () => void
  onPreload3D?: () => void
}

function LandingPageInner({ data, year, onSwitchTo3D, onPreload3D }: LandingPageProps) {
  const [commandOpen, setCommandOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'projects' | 'experience'>('home')
  const { profile, skills, experience, projects } = data
  const allSkills = [...skills.core, ...skills.platform, ...skills.practice]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    // Reveal sidebar on load
    const reveals = document.querySelectorAll('.sidebar-reveal')
    staggerReveal(Array.from(reveals) as HTMLElement[], 0.2)
  }, [])

  const handleSwitch3D = useCallback(() => {
    setCommandOpen(false)
    onSwitchTo3D()
  }, [onSwitchTo3D])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-100 selection:bg-green-500/30">
      <BackgroundAnimation />
      
      {/* Utility Actions (Top Right) */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
        <button
          type="button"
          onClick={handleSwitch3D}
          onMouseEnter={onPreload3D}
          className="flex h-10 items-center justify-center rounded-full border border-white/10 bg-black/40 px-6 text-[13px] font-bold text-white backdrop-blur-md transition-all hover:bg-white hover:text-black active:scale-95"
        >
          3D Lab
        </button>
        
      </div>

      <main className="mx-auto flex h-full w-full max-w-[1800px] gap-6 px-6 pb-6 pt-24">
        {/* Persistent Sidebar (33%) */}
        <aside className="sidebar-reveal flex h-full w-[350px] flex-none flex-col gap-4">
          <div className="bezel-container h-3/4">
            <div className="bezel-inner overflow-y-auto custom-scrollbar">
              <AboutPanel
                avatar={profile.avatar}
                name={profile.name}
                title={profile.title}
                summary={profile.summary}
                skills={allSkills}
              />
            </div>
          </div>
          <div className="bezel-container h-1/5">
            <div className="bezel-inner overflow-hidden">
              <ContactPanel
                email={profile.email}
                github={profile.github}
                linkedin={profile.linkedin}
              />
            </div>
          </div>
        </aside>

        {/* Dynamic Stage (Balance) */}
        <section className="flex flex-1 flex-col gap-4 overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex h-14 items-center justify-between rounded-full border border-white/5 bg-white/5 px-2 backdrop-blur-xl">
            <div className="flex gap-1">
              {(['home', 'projects', 'experience'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative rounded-full px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                    activeTab === tab ? 'text-black' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <span className="relative z-10">{tab}</span>
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="pr-6 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              {activeTab}
            </div>
          </div>

          {/* Module Area */}
          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'home' && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                  transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                  className="h-full"
                >
                  <div className="bezel-container h-full">
                    <div className="bezel-inner flex flex-col justify-center px-16">
                      <div className="mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-green-500 to-transparent" />
                      <span className="eyebrow mb-4">Engineering premium digital products</span>
                      <h1 className="mb-12 max-w-4xl text-6xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl md:text-8xl">
                        Building <span className="text-zinc-500">high-performance</span> digital experiences.
                      </h1>
                      <p className="max-w-2xl text-2xl font-medium text-zinc-400">
                        Full-stack engineer specializing in immersive interfaces and robust backend systems. 
                        Currently crafting the next generation of web applications.
                      </p>
                      
                      <div className="mt-16 flex gap-6">
                        <button 
                          onClick={() => setActiveTab('projects')}
                          className="rounded-full bg-white px-10 py-5 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95"
                        >
                          View Work
                        </button>
                        <button 
                          onClick={() => setActiveTab('experience')}
                          className="rounded-full border border-white/10 bg-white/5 px-10 py-5 text-sm font-bold text-white transition-all hover:bg-white/10"
                        >
                          My Path
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'projects' && (
                <motion.div
                  key="projects"
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                  className="h-full"
                >
                  <div className="bezel-container h-full">
                    <div className="bezel-inner !p-0 overflow-hidden">
                      <FeaturedProjectCarousel projects={projects} />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'experience' && (
                <motion.div
                  key="experience"
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                  className="h-full"
                >
                  <div className="bezel-container h-full">
                    <div className="bezel-inner overflow-hidden">
                      <ExperienceTimeline experience={experience} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <footer className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-600">
            <span>© {year} {profile.name}</span>
            <span>Ref: {year}.dashboard.v3</span>
          </footer>
        </section>
      </main>

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onSwitchTo3D={handleSwitch3D}
      />
    </div>
  )
}

export const LandingPage = memo(LandingPageInner)
