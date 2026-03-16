/**
 * Ultra-level scene optimization: BVH, frustum culling, memory cleanup.
 * Game-engine style optimizations for real-time performance.
 */
import * as THREE from 'three'
import {
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast,
} from 'three-mesh-bvh'

/** Extend Three.js prototypes once. Call at app init. */
let bvhExtended = false
export function extendWithBVH(): void {
  if (bvhExtended) return
  ;(THREE.BufferGeometry as unknown as { prototype: { computeBoundsTree?: () => void; disposeBoundsTree?: () => void } })
    .prototype.computeBoundsTree = computeBoundsTree
  ;(THREE.BufferGeometry as unknown as { prototype: { disposeBoundsTree?: () => void } })
    .prototype.disposeBoundsTree = disposeBoundsTree
  ;(THREE.Mesh as unknown as { prototype: { raycast?: typeof acceleratedRaycast } })
    .prototype.raycast = acceleratedRaycast
  bvhExtended = true
}

/**
 * Apply BVH acceleration to all meshes in the scene for fast raycasting.
 * Call after loading GLB. Skips geometries already processed (shared refs).
 */
export function applyBVHToScene(scene: THREE.Object3D): void {
  const processed = new Set<THREE.BufferGeometry>()
  scene.traverse((obj) => {
    if (obj.type !== 'Mesh') return
    const mesh = obj as THREE.Mesh
    const geom = mesh.geometry
    if (!geom || !(geom instanceof THREE.BufferGeometry)) return
    if (processed.has(geom)) return
    processed.add(geom)
    if ('computeBoundsTree' in geom && typeof (geom as THREE.BufferGeometry & { computeBoundsTree: () => void }).computeBoundsTree === 'function') {
      try {
        ;(geom as THREE.BufferGeometry & { computeBoundsTree: () => void }).computeBoundsTree()
      } catch {
        // Skip if BVH fails (e.g. degenerate geometry)
      }
    }
  })
}

/**
 * Dispose BVH trees. Call when unloading the scene.
 * Note: Do not dispose geometry/materials if scene is cached (e.g. useGLTF cache).
 */
export function disposeSceneBVH(scene: THREE.Object3D): void {
  const processed = new Set<THREE.BufferGeometry>()
  scene.traverse((obj) => {
    if (obj.type !== 'Mesh') return
    const mesh = obj as THREE.Mesh
    const geom = mesh.geometry
    if (!geom || !(geom instanceof THREE.BufferGeometry)) return
    if (processed.has(geom)) return
    processed.add(geom)
    if ('disposeBoundsTree' in geom && typeof (geom as THREE.BufferGeometry & { disposeBoundsTree: () => void }).disposeBoundsTree === 'function') {
      try {
        ;(geom as THREE.BufferGeometry & { disposeBoundsTree: () => void }).disposeBoundsTree()
      } catch {
        // Ignore
      }
    }
  })
}

/**
 * Ensure frustum culling is enabled for meshes that should be culled.
 * Background/sky objects may need frustumCulled=false.
 */
export function ensureFrustumCulling(scene: THREE.Object3D, excludeNames: string[] = []): void {
  const excludeSet = new Set(excludeNames.map((n) => n.toLowerCase()))
  scene.traverse((obj) => {
    if (obj.type !== 'Mesh' && obj.type !== 'Points') return
    const name = (obj.name || '').toLowerCase()
    if (excludeSet.has(name)) return
    ;(obj as THREE.Mesh).frustumCulled = true
  })
}

/**
 * Dispose geometries, materials, and textures to prevent GPU memory leaks.
 */
export function disposeSceneResources(scene: THREE.Object3D): void {
  scene.traverse((obj) => {
    if (obj.type === 'Mesh') {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of mats) {
        if (!mat) continue
        const m = mat as THREE.Material & Record<string, unknown>
        mat.dispose()
        for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap']) {
          const tex = m[key] as THREE.Texture | undefined
          if (tex?.dispose) tex.dispose()
        }
      }
    }
    if (obj.type === 'Points') {
      const points = obj as THREE.Points
      if (points.geometry) points.geometry.dispose()
      const mat = points.material
      if (mat) {
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else mat.dispose()
      }
    }
  })
}
