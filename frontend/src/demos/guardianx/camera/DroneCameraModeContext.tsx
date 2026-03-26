/**
 * Camera mode context — overview vs drone POV.
 * Allows UI toggle and smooth transition.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { DroneCameraMode } from './DroneCameraModes'

type DroneCameraModeContextValue = {
  mode: DroneCameraMode
  setMode: (m: DroneCameraMode) => void
}

const Ctx = createContext<DroneCameraModeContextValue | null>(null)

export function DroneCameraModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DroneCameraMode>('mission_control')

  const setMode = useCallback((m: DroneCameraMode) => {
    setModeState(m)
  }, [])

  const value: DroneCameraModeContextValue = {
    mode,
    setMode,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useDroneCameraMode() {
  const ctx = useContext(Ctx)
  return ctx ?? { mode: 'mission_control' as const, setMode: () => {} }
}
