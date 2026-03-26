/**
 * Provides merged attack arcs (static + simulated) to AttackArcSystem.
 */
import { createContext, useContext, type ReactNode } from 'react'
import { useAttackArcs } from './DataSimulation'
import type { AttackArc } from './attackArcData'

const Ctx = createContext<AttackArc[]>([])

export function AttackArcProvider({ children }: { children: ReactNode }) {
  const arcs = useAttackArcs()
  return <Ctx.Provider value={arcs}>{children}</Ctx.Provider>
}

export function useAttackArcsContext(): AttackArc[] {
  return useContext(Ctx)
}
