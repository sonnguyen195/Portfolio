import { memo } from 'react'

/**
 * Placeholder for optional particle / atmosphere layer.
 * Renders nothing; add particles or dust later without changing scene structure.
 */
function ParticleFieldInner() {
  return null
}

export const ParticleField = memo(ParticleFieldInner)
