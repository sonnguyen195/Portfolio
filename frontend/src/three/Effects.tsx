import { memo } from 'react'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

const BLOOM_INTENSITY = 0.7
const BLOOM_THRESHOLD = 0.4
const BLOOM_HEIGHT = 300
const VIGNETTE_OPACITY = 0.25
const RESOLUTION_SCALE = 0.65

/**
 * Minimal post-processing: Bloom + light vignette only.
 * No noise; resolutionScale and Bloom height reduced for 60 FPS on mid-range GPUs.
 */
function EffectsInner() {
  return (
    <EffectComposer resolutionScale={RESOLUTION_SCALE}>
      <Bloom
        intensity={BLOOM_INTENSITY}
        luminanceThreshold={BLOOM_THRESHOLD}
        luminanceSmoothing={0.9}
        height={BLOOM_HEIGHT}
      />
      <Vignette opacity={VIGNETTE_OPACITY} offset={0.5} darkness={0.5} />
    </EffectComposer>
  )
}

export const Effects = memo(EffectsInner)
