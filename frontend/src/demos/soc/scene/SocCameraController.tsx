/**
 * SOC cinematic camera choreography.
 * Orbit around globe, focus on threats. Responsive for mobile + desktop.
 */
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useIncidentAnimation } from '../animations'

/** Scale 10 (cyber.js): orbit ~2.5 radii from globe */
const ORBIT_RADIUS_DESKTOP = 25
const ORBIT_RADIUS_MOBILE = 23
const FOCUS_ORBIT_RADIUS_DESKTOP = 20
const FOCUS_ORBIT_RADIUS_MOBILE = 18
const MOBILE_BREAKPOINT = 768
const FOCUS_OFFSET_ANGLE = 0.4

function sphericalToCartesian(phi: number, theta: number, r: number): THREE.Vector3 {
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  )
}

export function SocCameraController() {
  const { camera, size } = useThree()
  const { state } = useIncidentAnimation()
  const cam = camera as THREE.PerspectiveCamera
  const orbitTheta = useRef(0)
  const isMobile = size.width < MOBILE_BREAKPOINT
  const orbitRadius = isMobile ? ORBIT_RADIUS_MOBILE : ORBIT_RADIUS_DESKTOP
  const focusRadius = isMobile ? FOCUS_ORBIT_RADIUS_MOBILE : FOCUS_ORBIT_RADIUS_DESKTOP
  const targetPos = useRef(new THREE.Vector3(0, 0, orbitRadius))
  const currentPos = useRef(new THREE.Vector3(0, 0, orbitRadius))
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))

  useFrame((_, delta) => {
    const { phase, phaseProgress } = state

    const isFocusPhase =
      phase === 'threat_detected' || phase === 'attack_pulse'

    if (!isFocusPhase) return

    const t = phaseProgress
    const radius = THREE.MathUtils.lerp(orbitRadius, focusRadius, t * 0.8)
    const theta = orbitTheta.current + FOCUS_OFFSET_ANGLE
    const phi = Math.PI / 2 - 0.2
    targetPos.current.copy(sphericalToCartesian(phi, theta, radius))
    targetLookAt.current.set(
      Math.sin(FOCUS_OFFSET_ANGLE) * 7,
      1.2,
      Math.cos(FOCUS_OFFSET_ANGLE) * 7
    )

    currentPos.current.lerp(targetPos.current, delta * 3)
    cam.position.copy(currentPos.current)
    cam.lookAt(targetLookAt.current)
    cam.updateProjectionMatrix()
  })

  return null
}
