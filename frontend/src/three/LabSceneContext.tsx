import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import * as THREE from 'three'
import type { Project } from './projects'
import type { PortfolioSectionId } from './portfolioData'

export type FocusTarget = {
  position: THREE.Vector3
  lookAt: THREE.Vector3
} | null

type LabSceneContextValue = {
  sceneRef: React.MutableRefObject<THREE.Group | THREE.Scene | null>
  selectedProject: Project | null
  setSelectedProject: (p: Project | null) => void
  selectedSection: PortfolioSectionId | null
  setSelectedSection: (s: PortfolioSectionId | null) => void
  focusTarget: FocusTarget
  setFocusTarget: (t: FocusTarget) => void
  /** Mesh currently focused/activated (used to anchor in-scene UI). */
  focusedMesh: THREE.Mesh | null
  setFocusedMesh: (m: THREE.Mesh | null) => void
  scrollProgress: number
  setScrollProgress: (n: number) => void
  cursorPointer: boolean
  setCursorPointer: (v: boolean) => void
  hoveredObjectId: string | null
  setHoveredObjectId: (id: string | null) => void
  hoveredObjectLabel: string | null
  setHoveredObjectLabel: (label: string | null) => void
  focusedObjectId: string | null
  setFocusedObjectId: (id: string | null) => void
  resetInteraction: () => void
  /** Register a callback that animates camera back to default and then clears focus. Called from resetInteraction. */
  registerReturnCamera: (fn: (() => void) | null) => void
  /** Default camera view (position + target) computed from scene bbox once after GLB load. */
  defaultView: { position: [number, number, number]; target: [number, number, number] } | null
  setDefaultView: (v: { position: [number, number, number]; target: [number, number, number] } | null) => void
  /** True when camera has finished animating to focus (panel shows only after this). */
  focusAnimationComplete: boolean
  setFocusAnimationComplete: (v: boolean) => void
}

const LabSceneContext = createContext<LabSceneContextValue | null>(null)

export function useLabScene(): LabSceneContextValue {
  const ctx = useContext(LabSceneContext)
  if (!ctx) throw new Error('useLabScene must be used within LabSceneProvider')
  return ctx
}

export function useLabSceneOptional(): LabSceneContextValue | null {
  return useContext(LabSceneContext)
}

type LabSceneProviderProps = {
  children: ReactNode
}

export function LabSceneProvider({ children }: LabSceneProviderProps) {
  const sceneRef = useRef<THREE.Group | THREE.Scene | null>(null)
  const returnCameraRef = useRef<(() => void) | null>(null)
  const [selectedProject, setSelectedProjectState] = useState<Project | null>(null)
  const [selectedSection, setSelectedSectionState] = useState<PortfolioSectionId | null>(null)
  const [focusTarget, setFocusTargetState] = useState<FocusTarget>(null)
  const [focusedMesh, setFocusedMeshState] = useState<THREE.Mesh | null>(null)
  const [scrollProgress, setScrollProgressState] = useState(0)
  const [cursorPointer, setCursorPointerState] = useState(false)
  const [hoveredObjectId, setHoveredObjectIdState] = useState<string | null>(null)
  const [hoveredObjectLabel, setHoveredObjectLabelState] = useState<string | null>(null)
  const [focusedObjectId, setFocusedObjectIdState] = useState<string | null>(null)
  const [defaultView, setDefaultViewState] = useState<{
    position: [number, number, number]
    target: [number, number, number]
  } | null>(null)
  const [focusAnimationComplete, setFocusAnimationCompleteState] = useState(false)

  const setSelectedProject = useCallback((p: Project | null) => {
    setSelectedProjectState(p)
  }, [])

  const setSelectedSection = useCallback((s: PortfolioSectionId | null) => {
    setSelectedSectionState(s)
  }, [])

  const setFocusTarget = useCallback((t: FocusTarget) => {
    setFocusTargetState(t)
  }, [])

  const setFocusedMesh = useCallback((m: THREE.Mesh | null) => {
    setFocusedMeshState(m)
  }, [])

  const setScrollProgress = useCallback((n: number) => {
    setScrollProgressState((prev) => {
      const next = Math.max(0, Math.min(1, n))
      return next !== prev ? next : prev
    })
  }, [])

  const setCursorPointer = useCallback((v: boolean) => {
    setCursorPointerState(v)
  }, [])

  const setHoveredObjectId = useCallback((id: string | null) => {
    setHoveredObjectIdState(id)
  }, [])
  const setHoveredObjectLabel = useCallback((label: string | null) => {
    setHoveredObjectLabelState(label)
  }, [])
  const setFocusedObjectId = useCallback((id: string | null) => {
    setFocusedObjectIdState(id)
  }, [])

  const registerReturnCamera = useCallback((fn: (() => void) | null) => {
    returnCameraRef.current = fn
  }, [])

  const setDefaultView = useCallback(
    (v: { position: [number, number, number]; target: [number, number, number] } | null) => {
      setDefaultViewState(v)
    },
    []
  )

  const setFocusAnimationComplete = useCallback((v: boolean) => {
    setFocusAnimationCompleteState(v)
  }, [])

  const resetInteraction = useCallback(() => {
    setSelectedProjectState(null)
    setSelectedSectionState(null)
    setFocusedMeshState(null)
    setFocusAnimationCompleteState(false)
    setHoveredObjectIdState(null)
    setHoveredObjectLabelState(null)
    setFocusedObjectIdState(null)
    returnCameraRef.current?.()
  }, [])

  const value = useMemo<LabSceneContextValue>(
    () => ({
      sceneRef,
      selectedProject,
      setSelectedProject,
      selectedSection,
      setSelectedSection,
      focusTarget,
      setFocusTarget,
      focusedMesh,
      setFocusedMesh,
      scrollProgress,
      setScrollProgress,
      cursorPointer,
      setCursorPointer,
      hoveredObjectId,
      setHoveredObjectId,
      hoveredObjectLabel,
      setHoveredObjectLabel,
      focusedObjectId,
      setFocusedObjectId,
      resetInteraction,
      registerReturnCamera,
      defaultView,
      setDefaultView,
      focusAnimationComplete,
      setFocusAnimationComplete,
    }),
    [
      selectedProject,
      setSelectedProject,
      selectedSection,
      setSelectedSection,
      focusTarget,
      setFocusTarget,
      focusedMesh,
      setFocusedMesh,
      scrollProgress,
      setScrollProgress,
      cursorPointer,
      setCursorPointer,
      hoveredObjectId,
      setHoveredObjectId,
      hoveredObjectLabel,
      setHoveredObjectLabel,
      focusedObjectId,
      setFocusedObjectId,
      resetInteraction,
      registerReturnCamera,
      defaultView,
      setDefaultView,
      focusAnimationComplete,
      setFocusAnimationComplete,
    ]
  )
  return (
    <LabSceneContext.Provider value={value}>
      {children}
    </LabSceneContext.Provider>
  )
}
