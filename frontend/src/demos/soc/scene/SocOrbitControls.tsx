/**
 * OrbitControls for globe — enabled when in globe mode and not in focus phase.
 * User can drag to rotate, scroll to zoom.
 */
import { OrbitControls } from '@react-three/drei'
import { useIncidentAnimation } from '../animations'
import { useGlobeProjection } from '../worldmap'

export function SocOrbitControls() {
  const { state } = useIncidentAnimation()
  const { mode, isTransitioning } = useGlobeProjection()

  const isFocusPhase =
    state.phase === 'threat_detected' || state.phase === 'attack_pulse'

  const enabled =
    mode === 'globe' && !isTransitioning && !isFocusPhase

  return (
    <OrbitControls
      enablePan={false}
      enableZoom={true}
      minDistance={16}
      maxDistance={45}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI - 0.1}
      target={[0, 0, 0]}
      enabled={enabled}
    />
  )
}
