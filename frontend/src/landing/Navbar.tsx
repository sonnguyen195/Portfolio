import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type NavbarProps = {
  name: string
  onSwitchTo3D: () => void
  onPreload3D?: () => void
  onOpenCommandPalette: () => void
}

const NAV_LINKS = [
  { id: 'about', label: 'About', href: '#about' },
  { id: 'projects', label: 'Projects', href: '#projects' },
  { id: 'experience', label: 'Experience', href: '#experience' },
  { id: 'contact', label: 'Contact', href: '#contact' },
]

export function Navbar({ name, onSwitchTo3D, onPreload3D, onOpenCommandPalette }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-zinc-950/90 shadow-[0_1px_0_0_rgba(255,255,255,0.03)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a
          href="#"
          className="text-sm font-semibold tracking-tight text-zinc-100 transition-colors duration-200 hover:text-white"
        >
          {name}
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={link.href}
              className="relative px-3 py-2 text-sm text-zinc-400 transition-colors duration-200 hover:text-zinc-100"
            >
              <span className="relative z-10">{link.label}</span>
              <motion.span
                className="absolute inset-0 rounded-lg bg-white/5"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            </a>
          ))}
          <button
            type="button"
            onClick={onSwitchTo3D}
            onMouseEnter={onPreload3D}
            onFocus={onPreload3D}
            className="ml-2 inline-flex min-h-[40px] min-w-[40px] cursor-pointer items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-400 transition-all duration-200 hover:border-cyan-400/60 hover:bg-cyan-500/20 hover:text-cyan-300 hover:shadow-[0_0_16px_-4px_rgba(34,211,238,0.35)]"
          >
            <span className="text-cyan-400/80">◇</span>
            <span>3D Lab</span>
          </button>
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="ml-2 hidden sm:inline-flex items-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-400"
          >
            <kbd className="font-mono">⌘K</kbd>
          </button>
        </div>

        {/* Mobile: hamburger + 3D button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={onSwitchTo3D}
            onMouseEnter={onPreload3D}
            className="min-h-[44px] min-w-[44px] cursor-pointer rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-400"
          >
            3D Lab
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="min-h-[44px] min-w-[44px] cursor-pointer rounded-xl p-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-zinc-950/95 backdrop-blur-xl"
          >
            <div className="flex flex-col px-4 py-3 gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                >
                  {link.label}
                </a>
              ))}
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="rounded-lg px-3 py-2.5 text-left text-sm text-zinc-500 hover:bg-white/5 hover:text-zinc-400"
              >
                <span className="font-mono">⌘K</span> Command palette
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
