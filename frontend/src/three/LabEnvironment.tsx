import { memo, Suspense, useCallback } from 'react'
import * as THREE from 'three'
import { Center } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { LabModel, preloadLabModel } from './LabModel'
import { Loader } from './Loader'
import { useLabScene } from './LabSceneContext'
import { configureDracoDecoder } from './gltfOptimization'

const FOV_DEG = 58
const FRAME_MARGIN = 1.5
const CAMERA_MIN_Y = 0.5
const DEFAULT_DIR = new THREE.Vector3(-0.25, 0.35, 1).normalize()

/**
 * Preload the lab model so loading can start before the scene mounts.
 * Call once at app init or when the hero is likely to be shown.
 */
export function preloadLabEnvironment(): void {
  configureDracoDecoder()
  preloadLabModel()
}

function LabEnvironmentInner() {
  const { camera } = useThree()
  const { setDefaultView } = useLabScene()

  const onCentered = useCallback(
    (props: { width: number; height: number; depth: number }) => {
      const { width, height, depth } = props
      const size = new THREE.Vector3(width, height, depth)
      const cam = camera as THREE.PerspectiveCamera
      const fovRad = (FOV_DEG * Math.PI) / 180
      const aspect = cam.aspect
      const tanHalfFov = Math.tan(fovRad / 2)
      const halfHeight = size.y / 2
      const halfWidth = size.x / 2
      const dHeight = halfHeight / tanHalfFov
      const dWidth = halfWidth / (aspect * tanHalfFov)
      const distance = Math.max(dHeight, dWidth) * FRAME_MARGIN

      // Center places content at origin, so target is (0,0,0)
      const target: [number, number, number] = [0, 0, 0]
      const position = DEFAULT_DIR.clone().multiplyScalar(distance)
      position.y = Math.max(CAMERA_MIN_Y, position.y)
      setDefaultView({
        position: [position.x, position.y, position.z],
        target,
      })
    },
    [camera, setDefaultView]
  )

  return (
    <Center onCentered={onCentered}>
      <LabModel />
    </Center>
  )
}

const LabEnvironmentContent = memo(LabEnvironmentInner)

/**
 * Renders the lab GLB environment centered in the scene.
 * Wraps in Suspense with Loader fallback; enables correct shadow receiving.
 * Interactive object detection (screens, reactor, console, door, table) is handled by InteractiveScreens in LabScene.
 */
export function LabEnvironment() {
  return (
    <Suspense fallback={<Loader />}>
      <LabEnvironmentContent />
    </Suspense>
  )
}
