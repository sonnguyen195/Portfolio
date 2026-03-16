import { useRef, useEffect, memo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useLabScene } from './LabSceneContext'
import type { FocusTarget } from './LabSceneContext'

const FOCUS_DURATION = 1.0
const FALLBACK_POSITION = new THREE.Vector3(0, 2, 6)
const FALLBACK_LOOKAT = new THREE.Vector3(0, 0, 0)

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

type AnimPhase = 'toFocus' | 'focused' | 'toDefault'

function CameraRigInner() {
  const { camera, clock } = useThree()
  const { focusTarget, setFocusTarget, registerReturnCamera, defaultView, setFocusAnimationComplete } = useLabScene()
  const cam = camera as THREE.PerspectiveCamera

  const animPhaseRef = useRef<AnimPhase | null>(null)
  const animStartTimeRef = useRef(0)
  const startPosRef = useRef(new THREE.Vector3())
  const startLookAtRef = useRef(new THREE.Vector3())
  const endPosRef = useRef(new THREE.Vector3())
  const endLookAtRef = useRef(new THREE.Vector3())
  const currentLookAtRef = useRef(new THREE.Vector3())
  const requestReturnRef = useRef(false)
  const _dir = useRef(new THREE.Vector3())
  const lastFocusTargetRef = useRef<FocusTarget | null>(null)
  const initialDefaultAppliedRef = useRef(false)

  useEffect(() => {
    const runReturn = () => {
      requestReturnRef.current = true
    }
    registerReturnCamera(runReturn)
    return () => registerReturnCamera(null)
  }, [registerReturnCamera])

  useFrame(() => {
    const time = clock.getElapsedTime()

    const defaultPos = defaultView
      ? new THREE.Vector3(...defaultView.position)
      : FALLBACK_POSITION.clone()
    const defaultLookAt = defaultView
      ? new THREE.Vector3(...defaultView.target)
      : FALLBACK_LOOKAT.clone()

    if (!focusTarget) {
      animPhaseRef.current = null
      lastFocusTargetRef.current = null
      if (defaultView && !initialDefaultAppliedRef.current) {
        cam.position.copy(defaultPos)
        cam.lookAt(defaultLookAt)
        initialDefaultAppliedRef.current = true
      }
      return
    }

    const startPos = startPosRef.current
    const startLookAt = startLookAtRef.current
    const endPos = endPosRef.current
    const endLookAt = endLookAtRef.current
    const currentLookAt = currentLookAtRef.current

    if (requestReturnRef.current) {
      requestReturnRef.current = false
      animPhaseRef.current = 'toDefault'
      animStartTimeRef.current = time
      startPos.copy(cam.position)
      startLookAt.copy(currentLookAt)
      endPos.copy(defaultPos)
      endLookAt.copy(defaultLookAt)
    }

    if (animPhaseRef.current === 'toDefault') {
      const elapsed = time - animStartTimeRef.current
      const t = Math.min(1, elapsed / FOCUS_DURATION)
      const e = easeInOutCubic(t)
      cam.position.lerpVectors(startPos, endPos, e)
      currentLookAt.lerpVectors(startLookAt, endLookAt, e)
      cam.lookAt(currentLookAt)
      if (t >= 1) {
        setFocusTarget(null)
        animPhaseRef.current = null
      }
      return
    }

    const focusTargetChanged = lastFocusTargetRef.current !== focusTarget
    if (focusTargetChanged) lastFocusTargetRef.current = focusTarget

    /* Khi đang focused object A, click object B → animate từ vị trí hiện tại sang B thay vì nhảy thẳng */
    if (animPhaseRef.current === 'focused' && focusTargetChanged) {
      animPhaseRef.current = 'toFocus'
      animStartTimeRef.current = time
      startPos.copy(cam.position)
      startLookAt.copy(currentLookAt)
      endPos.copy(focusTarget.position)
      endLookAt.copy(focusTarget.lookAt)
      currentLookAt.copy(startLookAt)
    }

    if (animPhaseRef.current === null || animPhaseRef.current === 'toFocus') {
      if (animPhaseRef.current === null || focusTargetChanged) {
        animPhaseRef.current = 'toFocus'
        animStartTimeRef.current = time
        setFocusAnimationComplete(false)
        startPos.copy(cam.position)
        cam.getWorldDirection(_dir.current)
        startLookAt.copy(cam.position).add(_dir.current.multiplyScalar(2))
        endPos.copy(focusTarget.position)
        endLookAt.copy(focusTarget.lookAt)
        currentLookAt.copy(startLookAt)
      }
      const elapsed = time - animStartTimeRef.current
      const t = Math.min(1, elapsed / FOCUS_DURATION)
      const e = easeInOutCubic(t)
      cam.position.lerpVectors(startPos, endPos, e)
      currentLookAt.lerpVectors(startLookAt, endLookAt, e)
      cam.lookAt(currentLookAt)
      if (t >= 1) {
        animPhaseRef.current = 'focused'
        setFocusAnimationComplete(true)
      }
      return
    }

    if (animPhaseRef.current === 'focused') {
      currentLookAt.copy(focusTarget.lookAt)
      cam.position.copy(focusTarget.position)
      cam.lookAt(currentLookAt)
    }
  })

  return null
}

/**
 * Smooth focus camera: animates to mesh focus over ~1s (ease-in-out), then holds.
 * ESC or close popup triggers return animation to default view, then clears focus.
 */
export const CameraRig = memo(CameraRigInner)
