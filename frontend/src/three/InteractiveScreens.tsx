/**
 * Action interface: collect theo INTERACTION_MAP (interactionMap.ts).
 * Mesh nào match objectName trong map → screens (project) hoặc sectionObjects (section).
 */
import { useRef, useEffect, memo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useLabScene } from './LabSceneContext'
import { PROJECTS } from './projects'
import { getInteractionEntry } from './interactionMap'
import type { PortfolioSectionId } from './portfolioData'

/** Focus distance from mesh center; min camera Y to avoid going below scene. */
const FOCUS_DISTANCE = 2.5
const CAMERA_MIN_Y = 0.3

const HOVER_DURATION = 0.15
const HOVER_EMISSIVE = 0.65
const IDLE_EMISSIVE = 0.08

type ScreenEntry = {
  mesh: THREE.Mesh
  defaultEmissive: number
  projectIndex: number
}

type SectionEntry = {
  mesh: THREE.Mesh
  section: PortfolioSectionId
  defaultEmissive: number
}

function meshName(mesh: THREE.Mesh): string {
  return mesh.name || (mesh.parent ? (mesh.parent as THREE.Object3D).name : '') || ''
}

/** Resolve mesh from hit object: direct mesh, or mesh inside interactive wrapper. */
function resolveMeshFromHit(obj: THREE.Object3D): THREE.Mesh | null {
  if (obj.type === 'Mesh') return obj as THREE.Mesh
  const wrapper = obj as THREE.Object3D & { userData?: { isInteractiveWrapper?: boolean } }
  if (wrapper.userData?.isInteractiveWrapper && wrapper.children[0]?.type === 'Mesh') {
    return wrapper.children[0] as THREE.Mesh
  }
  return null
}

function isMeshInEntry(mesh: THREE.Mesh, hitObj: THREE.Object3D): boolean {
  const resolved = resolveMeshFromHit(hitObj)
  return resolved != null && resolved === mesh
}

function collectScreens(root: THREE.Object3D): ScreenEntry[] {
  const out: ScreenEntry[] = []
  root.traverse((obj) => {
    if (obj.type !== 'Mesh') return
    const mesh = obj as THREE.Mesh
    const name = meshName(mesh)
    const entry = getInteractionEntry(name)
    if (!entry || entry.portfolioSection !== 'project') return
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    const defaultEmissive =
      mat && 'emissiveIntensity' in mat && typeof (mat as THREE.MeshStandardMaterial).emissiveIntensity === 'number'
        ? (mat as THREE.MeshStandardMaterial).emissiveIntensity
        : IDLE_EMISSIVE
    const projectIndex = entry.projectIndex ?? 0
    out.push({ mesh, defaultEmissive, projectIndex: projectIndex % PROJECTS.length })
  })
  return out
}

function collectSectionObjects(root: THREE.Object3D): SectionEntry[] {
  const out: SectionEntry[] = []
  root.traverse((obj) => {
    if (obj.type !== 'Mesh') return
    const mesh = obj as THREE.Mesh
    const name = meshName(mesh)
    const entry = getInteractionEntry(name)
    if (!entry || entry.portfolioSection === 'project') return
    const section = entry.portfolioSection as PortfolioSectionId
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    const defaultEmissive =
      mat && 'emissiveIntensity' in mat && typeof (mat as THREE.MeshStandardMaterial).emissiveIntensity === 'number'
        ? (mat as THREE.MeshStandardMaterial).emissiveIntensity
        : IDLE_EMISSIVE
    out.push({ mesh, section, defaultEmissive })
  })
  return out
}

const _normal = new THREE.Vector3()

/**
 * Compute focus: camera đặt trước mặt chính diện của object (mặt user click).
 * Dùng face normal từ raycast hit để xác định hướng; fallback dùng hướng camera hiện tại.
 */
function computeFocusFromMeshBBox(
  mesh: THREE.Mesh,
  camera: THREE.Camera,
  hit?: { object: THREE.Object3D; face?: { normal: THREE.Vector3 } | null }
): { position: THREE.Vector3; lookAt: THREE.Vector3 } {
  const box = new THREE.Box3().setFromObject(mesh)
  const center = new THREE.Vector3()
  box.getCenter(center)

  let dir: THREE.Vector3
  if (hit?.face != null && hit.object === mesh) {
    hit.object.updateWorldMatrix(true, false)
    _normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld)
    dir = _normal.clone()
  } else {
    const camPos = new THREE.Vector3()
    camera.getWorldPosition(camPos)
    dir = camPos.clone().sub(center).normalize()
  }

  const position = center.clone().add(dir.multiplyScalar(FOCUS_DISTANCE))
  position.y = Math.max(CAMERA_MIN_Y, position.y)
  return { position, lookAt: center }
}

function InteractiveScreensInner() {
  const {
    sceneRef,
    setSelectedProject,
    setSelectedSection,
    setFocusTarget,
    setFocusedMesh,
    setCursorPointer,
    setHoveredObjectId,
    setHoveredObjectLabel,
    setFocusedObjectId,
    resetInteraction,
    selectedSection,
    selectedProject,
  } = useLabScene()
  const { camera, raycaster, gl } = useThree()
  const screensRef = useRef<ScreenEntry[]>([])
  const sectionObjectsRef = useRef<SectionEntry[]>([])
  const lastCollectedFromRef = useRef<THREE.Object3D | null>(null)
  const hoveredRef = useRef<THREE.Object3D | null>(null)
  const hoverBlendRef = useRef(new Map<THREE.Mesh, number>())
  const lastHoverIdRef = useRef<string | null>(null)
  const pointerDownRef = useRef(false)
  /** Normalized click position when event hits wrapper instead of canvas (so R3F pointer can be wrong). */
  const clickPointerRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    const root = scene as THREE.Object3D
    const screens = collectScreens(root)
    const sectionObjs = collectSectionObjects(root)
    screensRef.current = screens
    sectionObjectsRef.current = sectionObjs
  }, [sceneRef])

  /* Click: listen on document so we catch events that "pass through" overlay (pointer-events: none).
   * The event target is often the canvas's parent (scene3dWrap), not the canvas, so the canvas
   * never receives it. If the click is in the canvas area (canvas or its container), set flag;
   * useFrame will consume it and run the action. */
  useEffect(() => {
    const canvas = gl.domElement
    const container = canvas.parentElement
    const inCanvasArea = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof Node)) return false
      return canvas === target || canvas.contains(target) || (container != null && container.contains(target))
    }
    const onDown = (e: PointerEvent) => {
      if (!inCanvasArea(e.target)) return
      pointerDownRef.current = true
      const rect = canvas.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      clickPointerRef.current = { x, y }
    }
    const onUp = () => {
      /* Do NOT set false here: useFrame must consume the click first. */
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('pointerup', onUp)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerup', onUp)
    }
  }, [gl.domElement])

  useFrame((state) => {
    const scene = sceneRef.current
    if (!scene) return
    let screens = screensRef.current
    let sectionObjects = sectionObjectsRef.current
    const root = scene as THREE.Object3D
    if (lastCollectedFromRef.current !== root || (screens.length === 0 && sectionObjects.length === 0)) {
      lastCollectedFromRef.current = root
      screensRef.current = collectScreens(root)
      sectionObjectsRef.current = collectSectionObjects(root)
      screens = screensRef.current
      sectionObjects = sectionObjectsRef.current
    }

    /* Use stored click position when processing a click (event often hits wrapper, not canvas); else state.pointer. */
    const pointer =
      pointerDownRef.current && clickPointerRef.current
        ? new THREE.Vector2(clickPointerRef.current.x, clickPointerRef.current.y)
        : state.pointer
    raycaster.setFromCamera(pointer, camera)
    /* Raycast only interactive objects (screens + sections) for performance; BVH accelerates each mesh */
    const interactiveObjects = [
      ...screens.map((e) => e.mesh.parent ?? e.mesh),
      ...sectionObjects.map((e) => e.mesh.parent ?? e.mesh),
    ].filter((o): o is THREE.Object3D => o != null)
    const uniqueObjects = [...new Set(interactiveObjects)]
    const hits = uniqueObjects.length > 0
      ? raycaster.intersectObjects(uniqueObjects, true)
      : raycaster.intersectObject(scene as THREE.Object3D, true)

    const sectionHit = hits.find((h) =>
      sectionObjects.some((e) => isMeshInEntry(e.mesh, h.object as THREE.Object3D))
    )
    const screenHit = sectionHit
      ? undefined
      : hits.find((h) =>
          screens.some((e) => isMeshInEntry(e.mesh, h.object as THREE.Object3D))
        )

    const hitObject = sectionHit?.object ?? screenHit?.object ?? null
    const isFocused = selectedSection != null || selectedProject != null
    /* When an object is focused/clicked, hide all hover effects (label, cursor, glow) */
    if (isFocused) {
      setCursorPointer(false)
      setHoveredObjectId(null)
      setHoveredObjectLabel(null)
      hoveredRef.current = null
      lastHoverIdRef.current = null
    } else {
      setCursorPointer(!!hitObject)
      hoveredRef.current = hitObject
    }

    const sectionEntry = hitObject
      ? sectionObjects.find((e) => isMeshInEntry(e.mesh, hitObject as THREE.Object3D))
      : undefined
    const screenEntry = hitObject && !sectionEntry
      ? screens.find((e) => isMeshInEntry(e.mesh, hitObject as THREE.Object3D))
      : undefined

    const hoverId =
      sectionEntry != null
        ? `section-${sectionEntry.section}`
        : screenEntry !== undefined
          ? `project-${screenEntry.projectIndex}`
          : null
    const hoverLabel =
      sectionEntry != null
        ? (getInteractionEntry(meshName(sectionEntry.mesh))?.label ?? sectionEntry.section)
        : screenEntry !== undefined
          ? (getInteractionEntry(meshName(screenEntry.mesh))?.label ?? 'Projects')
          : null
    if (!isFocused && hoverId !== lastHoverIdRef.current) {
      lastHoverIdRef.current = hoverId
      setHoveredObjectId(hoverId)
      setHoveredObjectLabel(hoverLabel)
    }

    if (pointerDownRef.current) {
      pointerDownRef.current = false
      clickPointerRef.current = null
      if (hitObject) {
        if (sectionEntry) {
          setSelectedProject(null)
          setSelectedSection(sectionEntry.section)
          setFocusedObjectId(`section-${sectionEntry.section}`)
          setFocusedMesh(sectionEntry.mesh)
          const hit = sectionHit?.object === sectionEntry.mesh ? sectionHit : undefined
          const { position, lookAt } = computeFocusFromMeshBBox(sectionEntry.mesh, camera, hit)
          setFocusTarget({ position, lookAt })
          return
        }
        if (screenEntry !== undefined && PROJECTS[screenEntry.projectIndex]) {
          setSelectedSection(null)
          setSelectedProject(PROJECTS[screenEntry.projectIndex])
          setFocusedObjectId(`project-${screenEntry.projectIndex}`)
          setFocusedMesh(screenEntry.mesh)
          const hit = screenHit?.object === screenEntry.mesh ? screenHit : undefined
          const { position, lookAt } = computeFocusFromMeshBBox(screenEntry.mesh, camera, hit)
          setFocusTarget({ position, lookAt })
        }
      } else if (selectedProject != null || selectedSection != null) {
        resetInteraction()
      }
    }

    const delta = state.clock.getDelta()
    const blendStep = Math.min(1, delta / HOVER_DURATION)

    for (const entry of screens) {
      const isHovered =
        hoveredRef.current === entry.mesh ||
        entry.mesh.parent === hoveredRef.current ||
        (hoveredRef.current != null && resolveMeshFromHit(hoveredRef.current) === entry.mesh)
      let blend = hoverBlendRef.current.get(entry.mesh) ?? 0
      blend = isHovered ? Math.min(1, blend + blendStep) : Math.max(0, blend - blendStep)
      hoverBlendRef.current.set(entry.mesh, blend)

      const mats = Array.isArray(entry.mesh.material) ? entry.mesh.material : [entry.mesh.material]
      const targetEmissive = THREE.MathUtils.lerp(IDLE_EMISSIVE, HOVER_EMISSIVE, blend)
      for (const mat of mats) {
        const m = mat as THREE.MeshStandardMaterial
        if (m?.emissive) m.emissiveIntensity = targetEmissive
      }
    }
    for (const entry of sectionObjects) {
      const isHovered =
        hoveredRef.current === entry.mesh ||
        entry.mesh.parent === hoveredRef.current ||
        (hoveredRef.current != null && resolveMeshFromHit(hoveredRef.current) === entry.mesh)
      let blend = hoverBlendRef.current.get(entry.mesh) ?? 0
      blend = isHovered ? Math.min(1, blend + blendStep) : Math.max(0, blend - blendStep)
      hoverBlendRef.current.set(entry.mesh, blend)

      const mats = Array.isArray(entry.mesh.material) ? entry.mesh.material : [entry.mesh.material]
      const targetEmissive = THREE.MathUtils.lerp(entry.defaultEmissive, HOVER_EMISSIVE, blend)
      for (const mat of mats) {
        const m = mat as THREE.MeshStandardMaterial
        if (m?.emissive) m.emissiveIntensity = targetEmissive
      }
    }
  })

  return null
}

export const InteractiveScreens = memo(InteractiveScreensInner)
