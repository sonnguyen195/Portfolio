import { memo } from 'react'

/**
 * Cinematic focus is handled by CameraRig (smooth lerp to focusTarget) and
 * InteractiveScreens (sets focusTarget + panel state on click).
 * This component is a placeholder for the focus camera system; actual logic
 * lives in InteractiveScreens + interactionMap + LabSceneContext.
 */
function FocusCameraControllerInner() {
  return null
}

export const FocusCameraController = memo(FocusCameraControllerInner)
