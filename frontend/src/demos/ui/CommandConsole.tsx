/**
 * Command Console — run simulation scenarios.
 * Futuristic Ironman Lab style. Does NOT modify the 3D scene.
 */
import { useState, useCallback } from 'react'
import { ScenarioSelector } from './ScenarioSelector'
import { ScenarioControls } from './ScenarioControls'
import type { ScenarioOption } from './scenarioCatalog'

type CommandConsoleProps = {
  /** Optional class for positioning */
  className?: string
  /** Collapsed by default */
  defaultCollapsed?: boolean
}

export function CommandConsole({
  className = '',
  defaultCollapsed = false,
}: CommandConsoleProps) {
  const [selected, setSelected] = useState<ScenarioOption | null>(null)
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  const handleSelect = useCallback((option: ScenarioOption) => {
    setSelected(option)
  }, [])

  return (
    <div
      className={`
        hologramPanel rounded-xl overflow-hidden
        ${className}
      `}
      style={{
        width: 320,
      }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-cyan-500/10 transition-colors"
      >
        <span className="text-sm font-semibold text-cyan-200 flex items-center gap-2">
          <span className="font-mono text-cyan-400">▸</span>
          Command Console
        </span>
        <span
          className="text-cyan-400/80 transition-transform"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
        >
          ▼
        </span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-cyan-500/20">
          <div className="text-[11px] text-slate-400">
            Select scenario → Run → 3D scene executes
          </div>
          <ScenarioSelector
            onSelect={handleSelect}
            activeId={selected?.id ?? null}
          />
          <ScenarioControls
            selectedOption={selected}
          />
        </div>
      )}
    </div>
  )
}
