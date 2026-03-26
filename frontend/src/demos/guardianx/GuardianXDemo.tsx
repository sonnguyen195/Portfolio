/**
 * GuardianX Demo Module
 *
 * Cinematic demos for GuardianX flows:
 * 1. Survey Mission Creation → Approval → Activation
 * 2. Drone Deployment → In-Transit → Arrival
 * 3. Surveillance Profile Execution → Flight → Video Analysis
 *
 * Isolated module — does NOT modify Ironman Lab scene.
 */
import type { ReactNode } from 'react'
import { GuardianXDemoScene } from './scene'
import { DroneFlightAnimationProvider } from './animations'
import { DroneCameraModeProvider } from './camera/DroneCameraModeContext'
import { DroneCameraModeToggle } from './camera/DroneCameraModeToggle'
import { AIHologram } from '../ui/ai'

export type GuardianXDemoProps = {
  onExit?: () => void
  embedded?: boolean
  autoPlay?: boolean
}

export function GuardianXDemo(props: GuardianXDemoProps): ReactNode {
  const { onExit, embedded, autoPlay = true } = props
  return (
    <DroneFlightAnimationProvider loop={false}>
      <DroneCameraModeProvider>
      <div
        className="guardianx-demo"
        data-embedded={embedded ?? false}
        style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px' }}
      >
        <AIHologram demoContext="guardianx" />
        <GuardianXDemoScene autoPlay={autoPlay} />
        <DroneCameraModeToggle />
      {onExit && (
        <button
          type="button"
          onClick={onExit}
          aria-label="Exit demo"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            padding: '8px 16px',
            background: 'rgba(0,0,0,0.6)',
            color: '#00d4ff',
            border: '1px solid #00d4ff',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Exit
        </button>
      )}
      </div>
      </DroneCameraModeProvider>
    </DroneFlightAnimationProvider>
  )
}
