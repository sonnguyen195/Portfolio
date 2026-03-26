/**
 * Scenario controls — Run, Stop, progress.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { runTimeline, stopTimeline, isTimelineRunning } from '../core/timeline'
import type { ScenarioOption } from './scenarioCatalog'

type ScenarioControlsProps = {
  selectedOption: ScenarioOption | null
  onRun?: () => void
  onStop?: () => void
}

export function ScenarioControls({
  selectedOption,
  onRun,
  onStop,
}: ScenarioControlsProps) {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)
  const cancelRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const check = () => setRunning(isTimelineRunning())
    check()
    const id = setInterval(check, 150)
    return () => clearInterval(id)
  }, [])

  const handleRun = useCallback(() => {
    if (!selectedOption) return
    stopTimeline()
    setProgress(0)
    setElapsedSec(0)
    setRunning(true)

    // Dispatch custom event so the actual demo scene (e.g. SOC globe) can
    // run its own simulation with the selected option's id.
    window.dispatchEvent(new CustomEvent('demo-simulation-start', {
      detail: { optionId: selectedOption.id, system: selectedOption.system },
    }))

    cancelRef.current = runTimeline(selectedOption.scenarioId, {
      onTick: (elapsed, prog) => {
        setElapsedSec(elapsed)
        setProgress(prog)
      },
      onComplete: () => {
        setRunning(false)
        setProgress(1)
      },
    })
    onRun?.()
  }, [selectedOption, onRun])

  const handleStop = useCallback(() => {
    cancelRef.current?.()
    cancelRef.current = null
    stopTimeline()
    setRunning(false)
    setProgress(0)
    setElapsedSec(0)

    // Tell the demo scene to stop its simulation too
    window.dispatchEvent(new CustomEvent('demo-simulation-stop'))

    onStop?.()
  }, [onStop])

  const canRun = selectedOption && !running
  const canStop = running

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleRun}
          disabled={!canRun}
          className={`
            flex-1 px-4 py-2 rounded-lg text-sm font-semibold
            transition-all duration-200 border
            ${canRun
              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30 hover:border-cyan-400'
              : 'bg-slate-800/30 border-slate-600/30 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          Run Simulation
        </button>
        <button
          type="button"
          onClick={handleStop}
          disabled={!canStop}
          className={`
            px-4 py-2 rounded-lg text-sm font-semibold
            transition-all duration-200 border
            ${canStop
              ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 hover:bg-amber-500/30'
              : 'bg-slate-800/30 border-slate-600/30 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          Stop
        </button>
      </div>

      {running && (
        <div className="space-y-1.5">
          <div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-cyan-400/80">
            {elapsedSec.toFixed(1)}s · {Math.round(progress * 100)}%
          </div>
        </div>
      )}
    </div>
  )
}
