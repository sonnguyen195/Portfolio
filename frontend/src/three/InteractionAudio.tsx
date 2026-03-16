import { memo, useEffect, useRef } from 'react'
import { useLabScene } from './LabSceneContext'

const BEEP_FREQ = 600
const CLICK_FREQ = 400
const PANEL_FREQ = 320
const DURATION = 0.06

const AudioContextClass =
  typeof window !== 'undefined'
    ? (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
    : null

let sharedContext: AudioContext | null = null
let unlocked = false

function unlockAudio() {
  if (unlocked || !AudioContextClass) return
  try {
    sharedContext = new AudioContextClass()
    if (sharedContext.state === 'suspended') {
      sharedContext.resume()
    }
    unlocked = true
  } catch {
    // ignore
  }
}

function playTone(freq: number, type: OscillatorType = 'sine', gain = 0.08) {
  if (!unlocked || !sharedContext || sharedContext.state === 'closed') return
  try {
    if (sharedContext.state === 'suspended') {
      sharedContext.resume()
    }
    const osc = sharedContext.createOscillator()
    const g = sharedContext.createGain()
    osc.connect(g)
    g.connect(sharedContext.destination)
    osc.frequency.value = freq
    osc.type = type
    g.gain.setValueAtTime(gain, sharedContext.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, sharedContext.currentTime + DURATION)
    osc.start(sharedContext.currentTime)
    osc.stop(sharedContext.currentTime + DURATION)
  } catch {
    // ignore
  }
}

function InteractionAudioInner() {
  const { hoveredObjectId, focusedObjectId, selectedSection, selectedProject } = useLabScene()
  const prevHover = useRef<string | null>(null)
  const prevFocus = useRef<string | null>(null)
  const prevPanel = useRef(false)

  const panelOpen = Boolean(selectedSection || selectedProject)

  useEffect(() => {
    const onGesture = () => {
      unlockAudio()
    }
    const events = ['click', 'keydown', 'touchstart', 'pointerdown'] as const
    events.forEach((e) => document.addEventListener(e, onGesture, { once: true, passive: true }))
    return () => events.forEach((e) => document.removeEventListener(e, onGesture))
  }, [])

  useEffect(() => {
    if (hoveredObjectId && hoveredObjectId !== prevHover.current) {
      playTone(BEEP_FREQ, 'sine', 0.05)
      prevHover.current = hoveredObjectId
    }
    if (!hoveredObjectId) prevHover.current = null
  }, [hoveredObjectId])

  useEffect(() => {
    if (focusedObjectId && focusedObjectId !== prevFocus.current) {
      playTone(CLICK_FREQ, 'square', 0.06)
      prevFocus.current = focusedObjectId
    }
    if (!focusedObjectId) prevFocus.current = null
  }, [focusedObjectId])

  useEffect(() => {
    if (panelOpen && !prevPanel.current) {
      playTone(PANEL_FREQ, 'sine', 0.07)
    }
    prevPanel.current = panelOpen
  }, [panelOpen])

  return null
}

export const InteractionAudio = memo(InteractionAudioInner)
