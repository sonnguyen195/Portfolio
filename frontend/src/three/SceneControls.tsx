import { memo } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useLabScene } from './LabSceneContext'

/**
 * OrbitControls for free exploration (zoom, orbit, pan).
 * Disabled when focusTarget is set so CameraRig can drive the camera.
 */
function SceneControlsInner() {
  const { focusTarget, defaultView } = useLabScene()
  const target: [number, number, number] = defaultView?.target ?? [0, 0, 0]
  return (
    <OrbitControls
      enabled={!focusTarget}
      makeDefault
      enableZoom={true}
      enablePan={true}
      enableRotate={true}
      minDistance={1}
      maxDistance={20}
      target={target}
    />
  )
}

export const SceneControls = memo(SceneControlsInner)
