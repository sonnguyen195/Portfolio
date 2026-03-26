/**
 * UI toggle for camera mode: Overview | Drone POV
 */
import { useDroneCameraMode } from './DroneCameraModeContext'

export function DroneCameraModeToggle() {
  const { mode, setMode } = useDroneCameraMode()

  return (
    <div
      className="ui-panel ui-panel-bottom-left flex gap-1 rounded-lg bg-slate-900/90 border border-cyan-500/30 p-1"
      style={{ position: 'absolute', bottom: 24, left: 24, zIndex: 15 }}
    >
      <button
        type="button"
        onClick={() => setMode('mission_control')}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          mode === 'mission_control'
            ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
            : 'text-cyan-400/70 hover:bg-cyan-500/10'
        }`}
      >
        Overview
      </button>
      <button
        type="button"
        onClick={() => setMode('drone_follow')}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          mode === 'drone_follow' || mode === 'drone_pov'
            ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
            : 'text-cyan-400/70 hover:bg-cyan-500/10'
        }`}
      >
        Drone POV
      </button>
    </div>
  )
}
