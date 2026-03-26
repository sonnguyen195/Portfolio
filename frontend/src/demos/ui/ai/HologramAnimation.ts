/**
 * Hologram animation config and utilities.
 */
export const HOLOGRAM_ANIMATION = {
  /** Message fade-in duration (ms) */
  messageFadeIn: 400,
  /** Message display duration before next (ms) */
  messageDisplay: 2500,
  /** Panel float animation */
  floatDuration: 3,
  /** Particle drift speed */
  particleSpeed: 0.5,
} as const

export const HOLOGRAM_CSS = {
  panel: 'aiHologramPanel',
  message: 'aiHologramMessage',
  messageAlert: 'aiHologramMessageAlert',
  messageMission: 'aiHologramMessageMission',
  particle: 'aiHologramParticle',
} as const
