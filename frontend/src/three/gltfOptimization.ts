import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { getInteractionEntry } from './interactionMap'

/** Set DRACO decoder path for compressed GLB models. Call once at app init. */
export function configureDracoDecoder(): void {
  useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
}

/** Emissive color for interactive hover glow. White works with emissiveMap; cyan for solid glow. */
const HOVER_EMISSIVE_COLOR = new THREE.Color(1, 1, 1)

/**
 * Ensure interactive meshes have visible emissive for hover effect.
 * Lab_webp may have black emissive; emissiveIntensity alone won't show glow.
 */
export function ensureInteractiveEmissiveForHover(object: THREE.Object3D): void {
  object.traverse((node) => {
    if (node.type !== 'Mesh') return
    const mesh = node as THREE.Mesh
    const name = mesh.name || (mesh.parent ? (mesh.parent as THREE.Object3D).name : '') || ''
    if (!getInteractionEntry(name)) return
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of materials) {
      const m = mat as THREE.MeshStandardMaterial | undefined
      if (!m?.emissive) continue
      const sum = m.emissive.r + m.emissive.g + m.emissive.b
      if (sum < 0.01) {
        m.emissive.copy(HOVER_EMISSIVE_COLOR)
      }
    }
  })
}

/**
 * Set correct colorSpace on textures to avoid banding and ensure proper sRGB handling.
 * For texture resolution reduction, pre-process GLB with:
 *   npx gltf-transform resize input.glb output.glb 2048 2048
 */
export function optimizeTextures(object: THREE.Object3D): void {
  object.traverse((node) => {
    if (node.type !== 'Mesh') return
    const mesh = node as THREE.Mesh
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of materials) {
      if (!mat || typeof mat !== 'object') continue
      const m = mat as THREE.Material & Record<string, unknown>
      for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap']) {
        const tex = m[key] as THREE.Texture | undefined
        if (!tex) continue
        if (key === 'map' || key === 'emissiveMap') {
          tex.colorSpace = THREE.SRGBColorSpace
        }
      }
    }
  })
}
