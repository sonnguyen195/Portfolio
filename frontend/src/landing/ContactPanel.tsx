import { useRef, useEffect } from 'react'

type ContactPanelProps = {
  email: string
  github?: string
  linkedin?: string
}

export function ContactPanel({ email, github, linkedin }: ContactPanelProps) {
  const emailRef = useRef<HTMLAnchorElement>(null)
  const githubRef = useRef<HTMLAnchorElement>(null)
  const linkedinRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    import('../lib/animations').then(({ createMagneticEffect }) => {
      if (emailRef.current) createMagneticEffect(emailRef.current)
      if (githubRef.current) createMagneticEffect(githubRef.current)
      if (linkedinRef.current) createMagneticEffect(linkedinRef.current)
    })
  }, [])

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <span className="eyebrow">Connection</span>
        <h3 className="mb-2 text-xl font-bold text-white">Let's Talk</h3>
        {/* <p className="text-xs text-zinc-500 line-clamp-2">Open to new opportunities and interesting collaborations.</p> */}
      </div>

      <div className="flex flex-col gap-2">
        <a
          href={`mailto:${email}`}
          ref={emailRef}
          className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3 transition-all hover:bg-white/10"
        >
          <span className="text-[10px] font-medium text-zinc-400">Email</span>
          <span className="text-[11px] font-bold text-white">{email}</span>
        </a>

        {/* <div className="flex gap-2">
          {github && (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              ref={githubRef}
              className="flex flex-1 items-center justify-center rounded-xl border border-white/5 bg-white/5 py-3 text-[11px] font-bold text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
            >
              GitHub
            </a>
          )}
          {linkedin && (
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              ref={linkedinRef}
              className="flex flex-1 items-center justify-center rounded-xl border border-white/5 bg-white/5 py-3 text-[11px] font-bold text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
            >
              LinkedIn
            </a>
          )}
        </div> */}
      </div>
    </div>
  )
}
