import { Suspense, useEffect, memo } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { PerformanceMonitor, AdaptiveDpr } from '@react-three/drei'
import { LabEnvironment, preloadLabEnvironment } from './LabEnvironment'
import { DeepSpaceBackground } from './DeepSpaceBackground'
import { CameraRig } from './CameraRig'
import { LightingRig } from './LightingRig'
import { InteractiveScreens } from './InteractiveScreens'
import { Effects } from './Effects'
import { ParticleField } from './ParticleField'
import { VolumetricLights } from './VolumetricLights'
import { SpaceWindow } from './SpaceWindow'
import { SceneControls } from './SceneControls'
import { InteractionLabels } from './InteractionLabels'
import { NavigationPath } from './NavigationPath'
import {
  ScenePerformanceMonitor,
  PerfStatsProvider,
  usePerfStatsState,
  type PerfStats,
} from './ScenePerformanceMonitor'
import { Loader } from './Loader'
import { ErrorBoundary } from './ErrorBoundary'

const FOG_COLOR = '#0a0f1c'
const FOG_NEAR = 8
const FOG_FAR = 25
const CAMERA_POSITION: [number, number, number] = [0, 2, 6]
const CAMERA_FOV = 58
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true
const TONE_MAPPING_EXPOSURE = 0.95

function LabSceneContent() {
  return (
    <>
      <fog attach="fog" args={[FOG_COLOR, FOG_NEAR, FOG_FAR]} />
      <DeepSpaceBackground />
      <LabEnvironment />
      <LightingRig />
      <ParticleField />
      <VolumetricLights />
      <SpaceWindow />
      <InteractiveScreens />
      <SceneControls />
      <CameraRig />
      <NavigationPath />
      <InteractionLabels />
      <ErrorBoundary fallback={null}>
        <Effects />
      </ErrorBoundary>
      <ScenePerformanceMonitor />
    </>
  )
}

const LabSceneContentMemo = memo(LabSceneContent)

function LabSceneCanvas({ perfStats }: { perfStats: PerfStats }) {
  useEffect(() => {
    preloadLabEnvironment()
  }, [])

  useEffect(() => {
    THREE.Cache.enabled = true
  }, [])

  return (
    <>
      <Canvas
        camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = TONE_MAPPING_EXPOSURE
        }}
        dpr={[1, 1.5]}
        shadows="basic"
      >
        <PerformanceMonitor
          bounds={(r) => (r > 100 ? [55, 60] : [45, 55])}
          onDecline={() => undefined}
          onIncline={() => undefined}
        />
        <AdaptiveDpr pixelated />
        <Suspense fallback={<Loader />}>
          <LabSceneContentMemo />
        </Suspense>
      </Canvas>
      {isDev && (
        <div
          className="scenePerfOverlay"
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 5,
            padding: '6px 10px',
            background: 'rgba(0,0,0,0.7)',
            color: '#aaa',
            fontSize: 11,
            fontFamily: 'monospace',
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        >
          FPS: {perfStats.fps} · Draw: {perfStats.drawCalls}
        </div>
      )}
    </>
  )
}

/**
 * Full-screen cinematic lab hero. Composes environment, space window, starfield, nebula, camera, and effects.
 * Layer UI on top via overlay; canvas fills viewport.
 */
export function LabScene() {
  const [perfStats, setPerfStats] = usePerfStatsState()

  return (
    <div
      className="scene3dWrap"
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      aria-hidden
    >
      <PerfStatsProvider value={setPerfStats}>
        <LabSceneCanvas perfStats={perfStats} />
      </PerfStatsProvider>
    </div>
  )
}
