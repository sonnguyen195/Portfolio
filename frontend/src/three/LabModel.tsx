import { memo, useEffect, useState, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { GLTF } from 'three-stdlib'
import { useLabSceneOptional } from './LabSceneContext'
import { getInteractionEntry } from './interactionMap'
import { SceneWithPanels } from './SceneWithPanels'
import { optimizeTextures, ensureInteractiveEmissiveForHover } from './gltfOptimization'
import {
  extendWithBVH,
  applyBVHToScene,
  disposeSceneBVH,
  ensureFrustumCulling,
} from './sceneOptimization'

/** Public path: must match file name case (Lab.glb in public/models/) */
export const LAB_MODEL_PATH = '/models/Lab_webp.glb'

const POLYGON_OFFSET_FACTOR = 1
const POLYGON_OFFSET_UNITS = 2

function applyPolygonOffset(obj: THREE.Object3D): void {
  obj.traverse((node) => {
    if (node.type !== 'Mesh') return
    const mesh = node as THREE.Mesh
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of materials) {
      if (mat && 'polygonOffset' in mat) {
        const m = mat as THREE.Material & { polygonOffset: boolean; polygonOffsetFactor: number; polygonOffsetUnits: number }
        m.polygonOffset = true
        m.polygonOffsetFactor = POLYGON_OFFSET_FACTOR
        m.polygonOffsetUnits = POLYGON_OFFSET_UNITS
      }
    }
  })
}

/** Wrap each interactive mesh in a group so Html can be attached as a child. */
function wrapInteractiveMeshes(root: THREE.Object3D): void {
  const toWrap: { mesh: THREE.Mesh; parent: THREE.Object3D }[] = []
  root.traverse((obj) => {
    if (obj.type !== 'Mesh') return
    const mesh = obj as THREE.Mesh
    const name = mesh.name || (mesh.parent ? (mesh.parent as THREE.Object3D).name : '') || ''
    const entry = getInteractionEntry(name)
    if (!entry || !mesh.parent) return
    if ((mesh.parent as THREE.Object3D & { userData?: { isInteractiveWrapper?: boolean } }).userData?.isInteractiveWrapper) return
    toWrap.push({ mesh, parent: mesh.parent })
  })
  for (const { mesh, parent } of toWrap) {
    const wrapper = new THREE.Group()
    wrapper.name = `${mesh.name ?? 'interactive'}_wrapper`
    wrapper.userData.isInteractiveWrapper = true
    parent.remove(mesh)
    wrapper.add(mesh)
    parent.add(wrapper)
  }
}

function LabModelInner() {
  const { scene } = useGLTF(LAB_MODEL_PATH, true, true) as GLTF
  const ctx = useLabSceneOptional()
  const [wrapped, setWrapped] = useState(false)
  const sceneRef = useRef<THREE.Object3D | null>(null)

  useEffect(() => {
    extendWithBVH()
    optimizeTextures(scene)
    ensureInteractiveEmissiveForHover(scene)
    applyPolygonOffset(scene)
    applyBVHToScene(scene)
    ensureFrustumCulling(scene, ['starfield', 'background', 'sky', 'space'])
    sceneRef.current = scene
  }, [scene])

  useEffect(() => {
    return () => {
      if (sceneRef.current) {
        disposeSceneBVH(sceneRef.current)
        sceneRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    wrapInteractiveMeshes(scene)
    setWrapped(true)
  }, [scene])

  useEffect(() => {
    if (!ctx) return
    if (wrapped) return
    ctx.sceneRef.current = scene
    return () => {
      /* Only clear if still pointing to scene; when wrapped=true, SceneWithPanels sets sceneRef to groupRef */
      if (ctx.sceneRef.current === scene) ctx.sceneRef.current = null
    }
  }, [scene, ctx, wrapped])

  if (!wrapped) return <primitive object={scene} />

  return <SceneWithPanels scene={scene} />
}

export const LabModel = memo(LabModelInner)

/** Call once (e.g. in LabScene or main) to start loading the model early. DRACO enabled for compressed GLB. */
export function preloadLabModel(): void {
  useGLTF.preload(LAB_MODEL_PATH, true, true)
}
