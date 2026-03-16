/**
 * FAANG-level portfolio landing page — Apple/Stripe/Linear/Vercel inspired.
 */
import { memo, useEffect, useState, useCallback } from 'react'
import type { Portfolio } from './types/portfolio'
import {
  Navbar,
  AboutPanel,
  FeaturedProjectCarousel,
  ExperienceTimeline,
  ContactPanel,
  BackgroundAnimation,
  CommandPalette,
} from './landing'

type LandingPageProps = {
  data: Portfolio
  year: number
  onSwitchTo3D: () => void
  onPreload3D?: () => void
}

function LandingPageInner({ data, year, onSwitchTo3D, onPreload3D }: LandingPageProps) {
  const [commandOpen, setCommandOpen] = useState(false)
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

  const handleSwitch3D = useCallback(() => {
    setCommandOpen(false)
    onSwitchTo3D()
  }, [onSwitchTo3D])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <BackgroundAnimation />
      <Navbar
        name={profile.name}
        onSwitchTo3D={handleSwitch3D}
        onPreload3D={onPreload3D}
        onOpenCommandPalette={() => setCommandOpen(true)}
      />

      {/* Desktop: About (full height) | Projects carousel (center) | Experience + Contact (right) */}
      <main className="mx-auto w-full max-w-none px-4 py-5 sm:px-6 lg:px-8">
        <div className="hidden lg:grid lg:h-[calc(100vh-4.5rem)] lg:min-h-[600px] lg:grid-cols-[1.2fr_1.6fr_1fr] lg:grid-rows-[1fr_1fr] lg:gap-6">
          {/* About — full height, extended for full context */}
          <div className="row-span-2 min-h-0 overflow-hidden">
            <AboutPanel
              name={profile.name}
              title={profile.title}
              summary={profile.summary}
              skills={allSkills}
            />
          </div>
          {/* Projects carousel — center, with prev/next */}
          <div className="row-span-2 min-h-0 overflow-hidden">
            <FeaturedProjectCarousel projects={projects} />
          </div>
          {/* Experience */}
          <div className="min-h-0 overflow-hidden">
            <ExperienceTimeline experience={experience} />
          </div>
          {/* Contact */}
          <div className="min-h-0 overflow-hidden">
            <ContactPanel
              email={profile.email}
              github={profile.github}
              linkedin={profile.linkedin}
            />
          </div>
        </div>

        {/* Mobile: vertical scroll */}
        <div className="flex flex-col gap-8 pb-16 pt-2 lg:hidden">
          <AboutPanel
            name={profile.name}
            title={profile.title}
            summary={profile.summary}
            skills={allSkills}
          />
          <FeaturedProjectCarousel projects={projects} />
          <ExperienceTimeline experience={experience} />
          <ContactPanel
            email={profile.email}
            github={profile.github}
            linkedin={profile.linkedin}
          />
          <footer className="py-10 text-center text-xs text-zinc-600">
            © {year} {profile.name}. Built with React · Three.js · Django
          </footer>
        </div>
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
