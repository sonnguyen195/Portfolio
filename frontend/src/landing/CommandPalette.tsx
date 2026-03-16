import { useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Command = {
  id: string
  label: string
  shortcut?: string
  action: () => void
}

type CommandPaletteProps = {
  open: boolean
  onClose: () => void
  onSwitchTo3D: () => void
}

export function CommandPalette({ open, onClose, onSwitchTo3D }: CommandPaletteProps) {
  const [selected, setSelected] = useState(0)

  const commands: Command[] = [
    { id: '3d', label: 'Switch to 3D Lab', shortcut: '◇', action: onSwitchTo3D },
    { id: 'about', label: 'Go to About', action: () => { document.getElementById('about')?.scrollIntoView(); onClose() } },
    { id: 'projects', label: 'Go to Projects', action: () => { document.getElementById('projects')?.scrollIntoView(); onClose() } },
    { id: 'experience', label: 'Go to Experience', action: () => { document.getElementById('experience')?.scrollIntoView(); onClose() } },
    { id: 'contact', label: 'Go to Contact', action: () => { document.getElementById('contact')?.scrollIntoView(); onClose() } },
  ]

  const runSelected = useCallback(() => {
    const cmd = commands[selected]
    if (cmd) {
      cmd.action()
    }
  }, [commands, selected])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => (s + 1) % commands.length) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => (s - 1 + commands.length) % commands.length) }
      if (e.key === 'Enter') { e.preventDefault(); runSelected() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, commands.length, runSelected])

  useEffect(() => {
    if (open) setSelected(0)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="fixed left-1/2 top-[20%] z-[101] w-full max-w-md -translate-x-1/2 rounded-2xl border border-white/10 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 px-3 py-2 text-zinc-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm">Command palette</span>
            </div>
            <div className="max-h-64 overflow-auto">
              {commands.map((cmd, i) => (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={cmd.action}
                  onMouseEnter={() => setSelected(i)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    i === selected ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  <span>{cmd.label}</span>
                  {cmd.shortcut && (
                    <span className="font-mono text-xs text-zinc-500">{cmd.shortcut}</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
