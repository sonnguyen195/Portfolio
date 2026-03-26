/**
 * GuardianX Demo Scene
 *
 * Isolated scene for GuardianX cinematic demos.
 * Does NOT modify the Ironman Lab scene — renders in its own Canvas.
 *
 * Elements: 3D city, drone spawn points, mission markers, route holograms
 * Animations: drone idle hover, radar sweep, city lights flicker
 */
import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { CityEnvironment } from './CityEnvironment'
import { CityLightsFlicker } from './CityLightsFlicker'
import { DroneSpawnPoints } from './DroneSpawnPoints'
import { MissionMarkers } from './MissionMarkers'
import { RouteHolograms } from './RouteHolograms'
import { DroneIdleHover } from './DroneIdleHover'
import { DroneFlight } from './DroneFlight'
import { RadarSweep } from './RadarSweep'
import { SceneAnimationController } from './SceneAnimationController'
import { DroneCameraController } from '../camera'

const CAMERA_POSITION: [number, number, number] = [0, 10, 12]
const FOG_COLOR = '#0a1219'
const FOG_NEAR = 6
const FOG_FAR = 20

function GuardianXSceneContent({ autoPlay }: { autoPlay?: boolean }) {
  return (
    <>
      <SceneAnimationController autoPlay={autoPlay ?? true} />
      <DroneCameraController />
      <fog attach="fog" args={[FOG_COLOR, FOG_NEAR, FOG_FAR]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 10, 5]} intensity={0.6} castShadow />
      <pointLight position={[0, 4, 0]} intensity={0.3} color="#00d4ff" />
      <CityEnvironment />
      <CityLightsFlicker />
      <DroneSpawnPoints />
      <MissionMarkers />
      <RouteHolograms />
      <DroneIdleHover />
      <DroneFlight />
      <RadarSweep />
    </>
  )
}

export function GuardianXDemoScene({ autoPlay = true }: { autoPlay?: boolean }) {
  return (
    <div
      className="guardianx-demo-scene"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #0a1219 0%, #0d1a24 100%)',
      }}
    >
      <Canvas
        camera={{
          position: CAMERA_POSITION,
          fov: 55,
          up: [0, 1, 0],
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        onCreated={({ camera, gl }) => {
          ;(camera as THREE.PerspectiveCamera).lookAt(0, 0, 0)
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 0.85
        }}
      >
        <Suspense fallback={null}>
          <GuardianXSceneContent autoPlay={autoPlay} />
        </Suspense>
      </Canvas>
    </div>
  )
}
