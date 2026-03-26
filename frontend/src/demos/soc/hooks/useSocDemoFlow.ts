/**
 * Hook for SOC demo flow state.
 * Manages current flow, phase, and playback control.
 */
import { useState, useCallback } from 'react'

export type SocDemoFlowId = 'cyber-attack' | 'triage' | 'threat-mitigation'

export function useSocDemoFlow() {
  const [flowId, setFlowId] = useState<SocDemoFlowId | null>(null)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const startFlow = useCallback((id: SocDemoFlowId) => {
    setFlowId(id)
    setPhaseIndex(0)
    setIsPlaying(true)
  }, [])

  const stopFlow = useCallback(() => {
    setFlowId(null)
    setPhaseIndex(0)
    setIsPlaying(false)
  }, [])

  const advancePhase = useCallback(() => {
    setPhaseIndex((i) => i + 1)
  }, [])

  return { flowId, phaseIndex, isPlaying, startFlow, stopFlow, advancePhase }
}
