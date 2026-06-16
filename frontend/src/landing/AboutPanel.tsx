

type AboutPanelProps = {
  avatar?: string
  name: string
  title: string
  summary: string
  skills: string[]
}

export function AboutPanel({ avatar, name, title, summary, skills }: AboutPanelProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col items-start text-left">
        <span className="eyebrow">The Developer</span>
        <div className="mb-3 h-12 w-12 overflow-hidden rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 ring-1 ring-white/10">
          <div className="flex h-full w-full items-center justify-center overflow-hidden">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
              />
            ) : (
              <div className="text-xl font-bold text-white">{name.charAt(0)}</div>
            )}
          </div>
        </div>
        <h2 className="text-lg font-bold tracking-tight text-white">{name}</h2>
        <p className="text-xs font-medium text-zinc-500">{title}</p>
      </div>

      <div className="mt-4 mb-auto">
        <p className="text-[19px] leading-relaxed text-zinc-500">
          {summary}
        </p>
      </div>

      {/* Skills */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {skills.slice(0, 10).map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400 transition-all hover:bg-white/10"
          >
            <span className="h-1 w-1 rounded-full bg-green-500" />
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}
