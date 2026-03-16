import { memo } from 'react'

/**
 * Clean, performant lighting for the floating lab.
 * Ambient + main directional (above/front) + rim (edge highlights) + blue accent near reactor.
 * No shadows to keep FPS high on mid-range GPUs.
 */
function LightingRigInner() {
  return (
    <>
      <ambientLight intensity={0.22} />
      <directionalLight
        position={[4, 12, 5]}
        intensity={1.0}
        castShadow={false}
      />
      <directionalLight
        position={[-3, 5, -6]}
        intensity={0.35}
        castShadow={false}
      />
      <pointLight
        position={[0.4, 1.8, 0.6]}
        color="#4da6ff"
        intensity={0.6}
        distance={10}
        decay={2}
      />
    </>
  )
}

export const LightingRig = memo(LightingRigInner)
