import { useRef, useState, useEffect } from 'react'


/** Reference size of the embedded demo (matches demoShell min layout ~1200px) */
const EMBED_REF_W = 1280
const EMBED_REF_H = 800

function EmbedScaledIframe({ src, title }: { src: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w <= 0 || h <= 0) return
      const s = Math.min(w / EMBED_REF_W, h / EMBED_REF_H, 1)
      setScale(s)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden flex items-center justify-center bg-[#0d0d0d]">
      <div
        className="embed-scaled-viewport"
        style={{
          width: EMBED_REF_W,
          height: EMBED_REF_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <iframe
          src={src}
          title={title}
          className="h-full w-full border-0 pointer-events-none"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  )
}

type Project = {
  id: string
  name: string
  description: string
  stack: string[]
  demoId?: 'guardianx' | 'ads' | 'soc' | 'guardianx-3d'
  keyFeatures?: string[]
  systemArchitecture?: string[]
}

type FeaturedProjectProps = {
  project: Project
}

function FakePreviewPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-zinc-800/95">
      <div className="grid w-full max-w-[240px] grid-cols-4 gap-2 rounded-lg border border-white/10 bg-black/30 p-4 backdrop-blur-sm">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-2.5 rounded bg-zinc-600/60"
            style={{ width: `${60 + (i % 4) * 12}%` }}
          />
        ))}
      </div>
      <div className="absolute top-3 left-3 flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-white/10" />
        <span className="text-[10px] text-zinc-500">00:00</span>
      </div>
    </div>
  )
}

export function FeaturedProject({ project }: FeaturedProjectProps) {
  const caseStudyBtnRef = useRef<HTMLButtonElement>(null)
  
  const demoHref = project.demoId ? `/demo/${project.demoId}` : null
  const embedSrc = project.demoId ? `${window.location.origin}/demo/${project.demoId}?embed=1` : null

  useEffect(() => {
    if (caseStudyBtnRef.current) {
      import('../lib/animations').then(({ createMagneticEffect }) => {
        createMagneticEffect(caseStudyBtnRef.current)
      })
    }
  }, [])

  return (
    <div className="group flex h-full flex-col overflow-hidden bg-zinc-950">
      {/* Preview Area */}
      <div
        className="relative flex-1 overflow-hidden"
      >
        <div className="h-full w-full bg-zinc-900/50">
          {embedSrc ? (
            <EmbedScaledIframe src={embedSrc} title={`${project.name} preview`} />
          ) : (
            <FakePreviewPlaceholder />
          )}
        </div>
        
        {/* Project Type Badge */}
        <div className="absolute top-6 left-6 z-10">
          <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
            {project.demoId ? 'Interactive Demo' : 'Case Study'}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col p-8">
        <span className="eyebrow">Featured Project</span>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">{project.name}</h3>
          <div className="flex gap-2">
            {project.stack.slice(0, 3).map((t) => (
              <span key={t} className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                {t}
              </span>
            ))}
          </div>
        </div>
        
        <p className="mb-8 text-[15px] leading-relaxed text-zinc-500 max-w-xl">
          {project.description}
        </p>

        <div className="flex items-center gap-4">
          {demoHref && (
            <a
              href={demoHref}
              className="group flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-all hover:scale-105 active:scale-95"
            >
              Launch Project
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/10 transition-transform group-hover:translate-x-1">
                ↗
              </span>
            </a>
          )}
          <button
            ref={caseStudyBtnRef}
            className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10"
          >
            Review Code
          </button>
        </div>
      </div>
    </div>
  )
}
