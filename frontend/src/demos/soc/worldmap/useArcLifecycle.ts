import { useMemo } from 'react'

/**
 * useArcLifecycle Hook
 * Centralized state for controlling the visual lifetime (fade in/out) of attack arc components.
 * Unifies the timing of 'aliveMs', 'isDead', and 'alphaFade'.
 *
 * @param lifetimeMs Length of time the effect remains visible (default 5000ms).
 * @param fadeOutDurationMs Length of the opacity fade out at the end of the lifetime (default 1000ms).
 * @param externalMountTime Optional externally controlled mount time (e.g., from a stable React map). Uses Date.now() by default.
 */
export function useArcLifecycle(
    lifetimeMs: number = 5000,
    fadeOutDurationMs: number = 1000,
    externalMountTime?: number
) {
    const internalMountTime = useMemo(() => Date.now(), [])
    const mountTime = externalMountTime ?? internalMountTime

    return function evaluateLifecycle() {
        const aliveMs = Math.max(0, Date.now() - mountTime)
        let alphaFade = 1.0
        let isDead = false

        if (aliveMs >= lifetimeMs) {
            alphaFade = 0.0
            isDead = true
        } else {
            const fadeOutStartMs = lifetimeMs - fadeOutDurationMs
            if (aliveMs > fadeOutStartMs) {
                alphaFade = Math.max(0, 1.0 - (aliveMs - fadeOutStartMs) / fadeOutDurationMs)
            }
        }

        return { aliveMs, alphaFade, isDead }
    }
}
