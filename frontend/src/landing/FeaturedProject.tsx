import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'

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
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div
        className="embed-scaled-viewport origin-top-left"
        style={{
          width: EMBED_REF_W,
          height: EMBED_REF_H,
          transform: `scale(${scale})`,
        }}
      >
        <div className="embed-auto-scroll">
          <iframe
            src={src}
            title={title}
            className="h-full w-full border-0 pointer-events-none"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}

type Project = {
  id: string
  name: string
  description: string
  stack: string[]
  demoId?: 'guardianx' | 'ads'
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
  const [previewHovered, setPreviewHovered] = useState(false)
  const demoHref = project.demoId ? `/demo/${project.demoId}` : null
  const embedSrc = project.demoId ? `${window.location.origin}/demo/${project.demoId}?embed=1` : null

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group card-base flex h-full flex-col p-0 transition-shadow duration-300 hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)]"
    >
      {/* Preview area — embed demo via iframe when demoId exists */}
      <div
        className="featured-preview-border relative min-h-0 flex-1 overflow-hidden rounded-t-[15px]"
        onMouseEnter={() => setPreviewHovered(true)}
        onMouseLeave={() => setPreviewHovered(false)}
      >
        <div
          className={`relative h-full w-full overflow-hidden rounded-t-[14px] bg-zinc-950 transition-all duration-300 ${
            previewHovered ? 'shadow-[0_0_32px_-6px_rgba(34,211,238,0.4)]' : ''
          }`}
        >
          {embedSrc ? (
            <>
              <EmbedScaledIframe src={embedSrc} title={`${project.name} preview`} />
              <div className="absolute top-3 left-3 z-10 flex gap-1.5 pointer-events-none">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
              </div>
            </>
          ) : (
            <FakePreviewPlaceholder />
          )}
        </div>
      </div>
      {/* Content — compact footer, buttons always visible */}
      <div className="flex shrink-0 flex-col p-4">
        <h3 className="shrink-0 text-base font-semibold text-zinc-100">{project.name}</h3>
        <p className="mt-1.5 line-clamp-2 shrink-0 text-sm text-zinc-500">{project.description}</p>
        <div className="mt-2 flex shrink-0 flex-wrap gap-1.5">
          {project.stack.slice(0, 5).map((t) => (
            <span key={t} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-zinc-500">
              {t}
            </span>
          ))}
        </div>
        <div className="mt-3 flex shrink-0 gap-2">
          {demoHref && (
            <a
              href={demoHref}
              className="inline-flex min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-400 transition-all duration-200 hover:bg-cyan-500/30 hover:shadow-[0_0_20px_-4px_rgba(34,211,238,0.4)]"
            >
              Live Demo
            </a>
          )}
          <button
            type="button"
            className="inline-flex min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-zinc-400 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.04] hover:text-zinc-300"
          >
            Case Study
          </button>
        </div>
      </div>
    </motion.section>
  )
}
