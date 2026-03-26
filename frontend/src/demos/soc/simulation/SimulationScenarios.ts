/**
 * Simulation Scenarios — scripted attack sequences that run on the SOC globe.
 *
 * Each scenario is a series of timed steps that:
 *   1. Stop the normal random attack flow
 *   2. Focus the camera on relevant regions
 *   3. Launch scripted attacks with specific patterns
 *   4. Show progress/log messages
 *   5. Auto-restore normal mode when complete
 */

import type { SocWebGLEngine } from '../engine/SocWebGLEngine'
import type { AttackType } from './attackTypes'
import { ATTACK_COLORS } from './attackTypes'

// ── Types ────────────────────────────────────────────────────────────────────

export type SimulationId = 'cyber-attack' | 'incident-response' | 'threat-detection'

export interface SimulationStep {
  /** Delay from scenario start (ms) */
  time: number
  /** Action to execute */
  action: 'log' | 'camera' | 'attack' | 'burst' | 'sweep' | 'focus-attack' | 'defense' | 'complete'
  /** Log message (for 'log' action) */
  message?: string
  /** Camera target [lon, lat] */
  cameraTarget?: [number, number]
  /** Camera zoom level */
  cameraZoom?: number
  /** Attack source [lon, lat] */
  attackSrc?: [number, number]
  /** Attack destination [lon, lat] */
  attackDst?: [number, number]
  /** Attack type */
  attackType?: AttackType
  /** Number of attacks in burst */
  burstCount?: number
  /** Region center for sweep [lon, lat] */
  sweepCenter?: [number, number]
  /** Sweep radius in degrees */
  sweepRadius?: number
}

export interface SimulationDefinition {
  id: SimulationId
  name: string
  description: string
  totalDurationMs: number
  steps: SimulationStep[]
}

// ── Known locations ──────────────────────────────────────────────────────────

const MOSCOW:       [number, number] = [37.617, 55.755]
const BEIJING:      [number, number] = [116.407, 39.904]
const WASHINGTON:   [number, number] = [-77.036, 38.907]
const NEW_YORK:     [number, number] = [-74.006, 40.714]
const LONDON:       [number, number] = [-0.127, 51.507]
const TOKYO:        [number, number] = [139.691, 35.689]
const TEHRAN:       [number, number] = [51.388, 35.689]
const KYIV:         [number, number] = [30.523, 50.450]
const SINGAPORE:    [number, number] = [103.82, 1.352]
const SAN_FRANCISCO:[number, number] = [-122.419, 37.774]
const SEOUL:        [number, number] = [126.977, 37.566]
const DUBAI:        [number, number] = [55.27, 25.204]
const SAO_PAULO:    [number, number] = [-46.633, -23.549]
const MUMBAI:       [number, number] = [72.877, 19.076]
const BERLIN:       [number, number] = [13.405, 52.52]
const SYDNEY:       [number, number] = [151.207, -33.867]

// ── Scenario Definitions ─────────────────────────────────────────────────────

/**
 * CYBER ATTACK SIMULATION
 * A coordinated DDoS attack from multiple attacker nodes targeting
 * US East Coast infrastructure. Camera follows the action.
 */
export const CYBER_ATTACK_SCENARIO: SimulationDefinition = {
  id: 'cyber-attack',
  name: 'Cyber Attack Simulation',
  description: 'Coordinated DDoS attack targeting US East Coast',
  totalDurationMs: 20000,
  steps: [
    // Phase 1: Initial reconnaissance
    { time: 0,    action: 'log', message: '━━━ CYBER ATTACK SIMULATION INITIATED ━━━' },
    { time: 200,  action: 'log', message: '◈ Phase 1: Reconnaissance scan detected' },
    { time: 400,  action: 'camera', cameraTarget: MOSCOW, cameraZoom: 1.0 },
    { time: 600,  action: 'attack', attackSrc: MOSCOW, attackDst: WASHINGTON, attackType: 'ids' },
    { time: 900,  action: 'attack', attackSrc: BEIJING, attackDst: WASHINGTON, attackType: 'ids' },
    { time: 1200, action: 'attack', attackSrc: TEHRAN, attackDst: NEW_YORK, attackType: 'ids' },
    { time: 1500, action: 'log', message: '⚠ Reconnaissance probes detected from 3 sources' },

    // Phase 2: Attack escalation
    { time: 2500, action: 'log', message: '◈ Phase 2: Attack escalation — DDoS wave incoming' },
    { time: 2800, action: 'camera', cameraTarget: NEW_YORK, cameraZoom: 1.1 },
    { time: 3000, action: 'burst', attackDst: NEW_YORK, attackType: 'ods', burstCount: 8, sweepCenter: MOSCOW, sweepRadius: 15 },
    { time: 3500, action: 'burst', attackDst: WASHINGTON, attackType: 'ods', burstCount: 6, sweepCenter: BEIJING, sweepRadius: 20 },
    { time: 4000, action: 'burst', attackDst: NEW_YORK, attackType: 'mav', burstCount: 10, sweepCenter: TEHRAN, sweepRadius: 10 },
    { time: 4500, action: 'log', message: '🔴 CRITICAL: DDoS volume exceeding 500Gbps' },

    // Phase 3: Peak attack
    { time: 5500, action: 'log', message: '◈ Phase 3: Peak attack — multiple vectors active' },
    { time: 5800, action: 'camera', cameraTarget: [-82, 38], cameraZoom: 0.9 },
    { time: 6000, action: 'burst', attackDst: NEW_YORK, attackType: 'ods', burstCount: 12, sweepCenter: MOSCOW, sweepRadius: 25 },
    { time: 6300, action: 'burst', attackDst: WASHINGTON, attackType: 'rmw', burstCount: 8, sweepCenter: KYIV, sweepRadius: 15 },
    { time: 6600, action: 'burst', attackDst: SAN_FRANCISCO, attackType: 'wav', burstCount: 6, sweepCenter: BEIJING, sweepRadius: 20 },
    { time: 7000, action: 'burst', attackDst: NEW_YORK, attackType: 'mav', burstCount: 15, sweepCenter: TEHRAN, sweepRadius: 12 },
    { time: 7500, action: 'log', message: '🔴 ALERT: Payload delivery attempted — malware injection' },

    // Phase 4: Lateral spread
    { time: 8500, action: 'log', message: '◈ Phase 4: Lateral spread to secondary targets' },
    { time: 8800, action: 'camera', cameraTarget: LONDON, cameraZoom: 1.0 },
    { time: 9000, action: 'burst', attackDst: LONDON, attackType: 'ids', burstCount: 8, sweepCenter: MOSCOW, sweepRadius: 15 },
    { time: 9500, action: 'burst', attackDst: TOKYO, attackType: 'wav', burstCount: 6, sweepCenter: BEIJING, sweepRadius: 15 },
    { time: 10000, action: 'burst', attackDst: SINGAPORE, attackType: 'mav', burstCount: 5, sweepCenter: TEHRAN, sweepRadius: 10 },
    { time: 10500, action: 'log', message: '⚠ Attack propagating to EU and APAC regions' },

    // Phase 5: Defense activation
    { time: 11500, action: 'log', message: '◈ Phase 5: Automated defense activated' },
    { time: 11800, action: 'camera', cameraTarget: [0, 20], cameraZoom: 0.9 },
    { time: 12000, action: 'defense', attackSrc: WASHINGTON, attackDst: MOSCOW, attackType: 'oas' },
    { time: 12300, action: 'defense', attackSrc: WASHINGTON, attackDst: BEIJING, attackType: 'oas' },
    { time: 12600, action: 'defense', attackSrc: LONDON, attackDst: TEHRAN, attackType: 'oas' },
    { time: 13000, action: 'log', message: '✓ IP blocking rules deployed to edge firewalls' },

    // Phase 6: Mitigation
    { time: 14000, action: 'log', message: '◈ Phase 6: Traffic scrubbing active' },
    { time: 14500, action: 'defense', attackSrc: NEW_YORK, attackDst: MOSCOW, attackType: 'kas' },
    { time: 15000, action: 'defense', attackSrc: TOKYO, attackDst: BEIJING, attackType: 'kas' },
    { time: 15500, action: 'defense', attackSrc: LONDON, attackDst: KYIV, attackType: 'kas' },
    { time: 16000, action: 'log', message: '✓ Attack volume reduced by 94%' },

    // Phase 7: Resolution
    { time: 17000, action: 'log', message: '◈ Phase 7: Threat neutralised' },
    { time: 17500, action: 'camera', cameraTarget: [0, 15], cameraZoom: 1.0 },
    { time: 18500, action: 'log', message: '✓ All attack vectors contained — systems nominal' },
    { time: 19500, action: 'log', message: '━━━ SIMULATION COMPLETE ━━━' },
    { time: 20000, action: 'complete' },
  ],
}

/**
 * INCIDENT RESPONSE
 * Detects suspicious activity at a specific location, triages,
 * isolates the threat, and deploys countermeasures.
 */
export const INCIDENT_RESPONSE_SCENARIO: SimulationDefinition = {
  id: 'incident-response',
  name: 'Incident Response',
  description: 'Detect, triage, isolate, and neutralize a targeted intrusion',
  totalDurationMs: 18000,
  steps: [
    // Phase 1: Detection
    { time: 0,    action: 'log', message: '━━━ INCIDENT RESPONSE INITIATED ━━━' },
    { time: 200,  action: 'log', message: '◈ Phase 1: Anomaly detected in EMEA sector' },
    { time: 500,  action: 'camera', cameraTarget: BERLIN, cameraZoom: 1.1 },
    { time: 800,  action: 'attack', attackSrc: MOSCOW, attackDst: BERLIN, attackType: 'ids' },
    { time: 1200, action: 'attack', attackSrc: KYIV, attackDst: BERLIN, attackType: 'vul' },
    { time: 1600, action: 'log', message: '⚠ IDS alert: unauthorized access attempt on DB-EU-03' },

    // Phase 2: Triage
    { time: 2500, action: 'log', message: '◈ Phase 2: Automated triage in progress' },
    { time: 2800, action: 'attack', attackSrc: MOSCOW, attackDst: BERLIN, attackType: 'mav' },
    { time: 3200, action: 'attack', attackSrc: MOSCOW, attackDst: LONDON, attackType: 'ids' },
    { time: 3600, action: 'log', message: '🔴 CRITICAL: Privilege escalation detected — SEVERITY HIGH' },
    { time: 4000, action: 'attack', attackSrc: MOSCOW, attackDst: BERLIN, attackType: 'rmw' },
    { time: 4400, action: 'log', message: '⚠ Threat actor attempting lateral movement to UK nodes' },

    // Phase 3: Containment
    { time: 5500, action: 'log', message: '◈ Phase 3: Containment — isolating affected segments' },
    { time: 5800, action: 'camera', cameraTarget: [8, 50], cameraZoom: 1.2 },
    { time: 6000, action: 'defense', attackSrc: BERLIN, attackDst: MOSCOW, attackType: 'oas' },
    { time: 6500, action: 'log', message: '✓ Segment EU-CORE isolated from external traffic' },
    { time: 7000, action: 'defense', attackSrc: LONDON, attackDst: MOSCOW, attackType: 'oas' },
    { time: 7500, action: 'log', message: '✓ UK nodes firewall rules updated' },

    // Phase 4: Investigation
    { time: 8500, action: 'log', message: '◈ Phase 4: Forensic analysis initiated' },
    { time: 9000, action: 'focus-attack', attackSrc: MOSCOW, attackDst: BERLIN, attackType: 'vul' },
    { time: 9500, action: 'log', message: '  → Entry point: CVE-2024-3094 (xz-utils backdoor)' },
    { time: 10000, action: 'log', message: '  → C2 server: 185.xxx.xxx.42 (Moscow subnet)' },
    { time: 10500, action: 'log', message: '  → Exfiltrated: 2.4GB encrypted payload' },

    // Phase 5: Eradication
    { time: 11500, action: 'log', message: '◈ Phase 5: Threat eradication' },
    { time: 11800, action: 'camera', cameraTarget: [15, 48], cameraZoom: 1.0 },
    { time: 12000, action: 'defense', attackSrc: BERLIN, attackDst: MOSCOW, attackType: 'kas' },
    { time: 12500, action: 'defense', attackSrc: LONDON, attackDst: KYIV, attackType: 'kas' },
    { time: 13000, action: 'log', message: '✓ Malware signatures added to all endpoints' },
    { time: 13500, action: 'defense', attackSrc: BERLIN, attackDst: TEHRAN, attackType: 'kas' },
    { time: 14000, action: 'log', message: '✓ C2 channels blocked at DNS level' },

    // Phase 6: Recovery
    { time: 15000, action: 'log', message: '◈ Phase 6: Systems recovery' },
    { time: 15300, action: 'camera', cameraTarget: [0, 20], cameraZoom: 1.0 },
    { time: 15800, action: 'log', message: '✓ EU-CORE segment restored from clean snapshot' },
    { time: 16500, action: 'log', message: '✓ All affected credentials rotated' },
    { time: 17200, action: 'log', message: '✓ Incident report generated — IR-2024-0847' },
    { time: 17500, action: 'log', message: '━━━ INCIDENT RESPONSE COMPLETE ━━━' },
    { time: 18000, action: 'complete' },
  ],
}

/**
 * THREAT DETECTION
 * Scans the globe region by region, detecting and highlighting
 * threat hotspots in real-time.
 */
export const THREAT_DETECTION_SCENARIO: SimulationDefinition = {
  id: 'threat-detection',
  name: 'Threat Detection',
  description: 'Global threat detection sweep across all regions',
  totalDurationMs: 22000,
  steps: [
    // Init
    { time: 0,    action: 'log', message: '━━━ THREAT DETECTION SWEEP INITIATED ━━━' },
    { time: 300,  action: 'log', message: '◈ Deploying global sensor network...' },
    { time: 600,  action: 'camera', cameraTarget: [0, 15], cameraZoom: 0.85 },

    // Scan North America
    { time: 1500, action: 'log', message: '◈ Scanning: NORTH AMERICA' },
    { time: 1800, action: 'camera', cameraTarget: [-95, 38], cameraZoom: 1.1 },
    { time: 2000, action: 'sweep', sweepCenter: NEW_YORK, sweepRadius: 15, burstCount: 4, attackType: 'oas' },
    { time: 2400, action: 'sweep', sweepCenter: SAN_FRANCISCO, sweepRadius: 12, burstCount: 3, attackType: 'wav' },
    { time: 2800, action: 'log', message: '  → 7 suspicious endpoints detected in US-EAST' },
    { time: 3200, action: 'attack', attackSrc: NEW_YORK, attackDst: WASHINGTON, attackType: 'ids' },
    { time: 3500, action: 'log', message: '  → Threat level: MODERATE' },

    // Scan Europe
    { time: 4500, action: 'log', message: '◈ Scanning: EUROPE' },
    { time: 4800, action: 'camera', cameraTarget: [10, 50], cameraZoom: 1.1 },
    { time: 5000, action: 'sweep', sweepCenter: LONDON, sweepRadius: 10, burstCount: 5, attackType: 'ids' },
    { time: 5400, action: 'sweep', sweepCenter: BERLIN, sweepRadius: 12, burstCount: 4, attackType: 'vul' },
    { time: 5800, action: 'log', message: '  → 12 compromised nodes in EU-CENTRAL' },
    { time: 6200, action: 'attack', attackSrc: MOSCOW, attackDst: BERLIN, attackType: 'mav' },
    { time: 6500, action: 'attack', attackSrc: KYIV, attackDst: LONDON, attackType: 'ids' },
    { time: 6800, action: 'log', message: '  → Threat level: HIGH — APT activity detected' },

    // Scan Russia / Central Asia
    { time: 7800, action: 'log', message: '◈ Scanning: RUSSIA / CENTRAL ASIA' },
    { time: 8100, action: 'camera', cameraTarget: [60, 55], cameraZoom: 1.0 },
    { time: 8300, action: 'sweep', sweepCenter: MOSCOW, sweepRadius: 20, burstCount: 8, attackType: 'ods' },
    { time: 8800, action: 'log', message: '  → C2 infrastructure identified: 23 active nodes' },
    { time: 9200, action: 'log', message: '  → Threat level: CRITICAL — state-sponsored activity' },

    // Scan Middle East
    { time: 10200, action: 'log', message: '◈ Scanning: MIDDLE EAST' },
    { time: 10500, action: 'camera', cameraTarget: [45, 30], cameraZoom: 1.1 },
    { time: 10700, action: 'sweep', sweepCenter: TEHRAN, sweepRadius: 12, burstCount: 5, attackType: 'rmw' },
    { time: 11100, action: 'sweep', sweepCenter: DUBAI, sweepRadius: 8, burstCount: 3, attackType: 'wav' },
    { time: 11500, action: 'log', message: '  → 8 exploit kits active in ME region' },
    { time: 11800, action: 'log', message: '  → Threat level: HIGH' },

    // Scan Asia Pacific
    { time: 12800, action: 'log', message: '◈ Scanning: ASIA PACIFIC' },
    { time: 13100, action: 'camera', cameraTarget: [110, 25], cameraZoom: 1.0 },
    { time: 13300, action: 'sweep', sweepCenter: BEIJING, sweepRadius: 18, burstCount: 7, attackType: 'mav' },
    { time: 13800, action: 'sweep', sweepCenter: TOKYO, sweepRadius: 10, burstCount: 4, attackType: 'ids' },
    { time: 14200, action: 'sweep', sweepCenter: SEOUL, sweepRadius: 8, burstCount: 3, attackType: 'oas' },
    { time: 14600, action: 'sweep', sweepCenter: SINGAPORE, sweepRadius: 8, burstCount: 3, attackType: 'wav' },
    { time: 15000, action: 'log', message: '  → 31 botnet nodes in APAC region' },
    { time: 15300, action: 'log', message: '  → Threat level: CRITICAL' },

    // Scan South America
    { time: 16300, action: 'log', message: '◈ Scanning: SOUTH AMERICA' },
    { time: 16600, action: 'camera', cameraTarget: [-55, -15], cameraZoom: 1.0 },
    { time: 16800, action: 'sweep', sweepCenter: SAO_PAULO, sweepRadius: 15, burstCount: 4, attackType: 'kas' },
    { time: 17200, action: 'log', message: '  → 5 phishing campaigns detected' },
    { time: 17500, action: 'log', message: '  → Threat level: MODERATE' },

    // Scan Oceania + South Asia
    { time: 18200, action: 'log', message: '◈ Scanning: SOUTH ASIA / OCEANIA' },
    { time: 18500, action: 'camera', cameraTarget: [100, 5], cameraZoom: 1.0 },
    { time: 18700, action: 'sweep', sweepCenter: MUMBAI, sweepRadius: 12, burstCount: 4, attackType: 'vul' },
    { time: 19100, action: 'sweep', sweepCenter: SYDNEY, sweepRadius: 10, burstCount: 2, attackType: 'oas' },
    { time: 19400, action: 'log', message: '  → 9 vulnerable endpoints flagged' },
    { time: 19700, action: 'log', message: '  → Threat level: MODERATE' },

    // Summary
    { time: 20500, action: 'log', message: '◈ Global sweep complete — generating report...' },
    { time: 20800, action: 'camera', cameraTarget: [0, 15], cameraZoom: 0.9 },
    { time: 21000, action: 'log', message: '  TOTAL THREATS: 95  |  CRITICAL: 54  |  HIGH: 20  |  MODERATE: 21' },
    { time: 21300, action: 'log', message: '  TOP THREAT ACTORS: RU (23), CN (31), IR (8)' },
    { time: 21600, action: 'log', message: '  RECOMMENDED: Deploy enhanced monitoring on 12 segments' },
    { time: 21800, action: 'log', message: '━━━ THREAT DETECTION COMPLETE ━━━' },
    { time: 22000, action: 'complete' },
  ],
}

// ── Registry ─────────────────────────────────────────────────────────────────

export const SIMULATION_REGISTRY: Record<SimulationId, SimulationDefinition> = {
  'cyber-attack':       CYBER_ATTACK_SCENARIO,
  'incident-response':  INCIDENT_RESPONSE_SCENARIO,
  'threat-detection':   THREAT_DETECTION_SCENARIO,
}

// ── Runner ───────────────────────────────────────────────────────────────────

export interface SimulationCallbacks {
  onLog: (message: string) => void
  onProgress: (progress: number) => void
  onComplete: () => void
}

/**
 * Runs a simulation scenario on the globe engine.
 * Returns a cancel function.
 */
export function runSimulation(
  id: SimulationId,
  engine: SocWebGLEngine,
  callbacks: SimulationCallbacks,
): () => void {
  const scenario = SIMULATION_REGISTRY[id]
  if (!scenario) {
    callbacks.onLog(`Unknown simulation: ${id}`)
    callbacks.onComplete()
    return () => {}
  }

  const timers: ReturnType<typeof setTimeout>[] = []
  let cancelled = false
  const startTime = Date.now()

  // Disable auto-rotate during simulation
  engine.setAutoRotate(false)

  // Schedule progress updates
  const progressTimer = setInterval(() => {
    if (cancelled) return
    const elapsed = Date.now() - startTime
    const progress = Math.min(1, elapsed / scenario.totalDurationMs)
    callbacks.onProgress(progress)
  }, 200)
  timers.push(progressTimer as unknown as ReturnType<typeof setTimeout>)

  // Schedule each step
  for (const step of scenario.steps) {
    const timer = setTimeout(() => {
      if (cancelled) return
      executeStep(step, engine, callbacks)
    }, step.time)
    timers.push(timer)
  }

  // Cancel function
  return () => {
    cancelled = true
    for (const t of timers) clearTimeout(t)
    clearInterval(progressTimer)
    engine.setAutoRotate(true)
  }
}

function executeStep(
  step: SimulationStep,
  engine: SocWebGLEngine,
  callbacks: SimulationCallbacks,
): void {
  switch (step.action) {
    case 'log':
      if (step.message) callbacks.onLog(step.message)
      break

    case 'camera':
      if (step.cameraTarget) {
        animateCameraTo(engine, step.cameraTarget, step.cameraZoom ?? 1.0)
      }
      break

    case 'attack':
    case 'focus-attack':
    case 'defense':
      if (step.attackSrc && step.attackDst) {
        const color = ATTACK_COLORS[step.attackType ?? 'oas']
        engine.launch(
          step.attackSrc,
          step.attackDst,
          step.action === 'defense' ? [0.05, 1.0, 0.42] : color,
          step.attackType ?? 'oas',
        )
      }
      break

    case 'burst':
      if (step.attackDst && step.sweepCenter) {
        const count = step.burstCount ?? 5
        const radius = step.sweepRadius ?? 15
        const color = ATTACK_COLORS[step.attackType ?? 'ods']
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
          const dist = radius * (0.3 + Math.random() * 0.7)
          const srcLon = step.sweepCenter[0] + Math.cos(angle) * dist
          const srcLat = step.sweepCenter[1] + Math.sin(angle) * dist * 0.6
          // Stagger launches slightly for visual effect
          setTimeout(() => {
            engine.launch(
              [srcLon, Math.max(-85, Math.min(85, srcLat))],
              step.attackDst!,
              color,
              step.attackType ?? 'ods',
            )
          }, i * 80)
        }
      }
      break

    case 'sweep':
      if (step.sweepCenter) {
        const count = step.burstCount ?? 5
        const radius = step.sweepRadius ?? 12
        const color = ATTACK_COLORS[step.attackType ?? 'oas']
        // Launch attacks from center outward to various nearby points
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count
          const dist = radius * (0.4 + Math.random() * 0.6)
          const dstLon = step.sweepCenter[0] + Math.cos(angle) * dist
          const dstLat = step.sweepCenter[1] + Math.sin(angle) * dist * 0.6
          setTimeout(() => {
            engine.launch(
              step.sweepCenter!,
              [dstLon, Math.max(-85, Math.min(85, dstLat))],
              color,
              step.attackType ?? 'oas',
            )
          }, i * 100)
        }
      }
      break

    case 'complete':
      callbacks.onComplete()
      break
  }
}

/**
 * Smoothly animate camera to a target position.
 * Uses the engine's orbitBy to incrementally move.
 */
/**
 * Smoothly animate camera to face a target geo coordinate.
 *
 * Camera eye formula (from CameraController._buildGlobe):
 *   eye.x = -dist * cos(lat) * cos(lon)
 *   eye.y =  dist * sin(lat)
 *   eye.z =  dist * cos(lat) * sin(lon)
 *
 * For the camera to look at geo(targetLon, targetLat), we need to place
 * the eye on the OPPOSITE side of the globe from the target.
 *
 * The globe's ECEF mapping (from EarthRenderer / shaders) maps:
 *   geoLon → θ rotation around Y-axis
 *   The vertex at geoLon=0 is along +X, geoLon=90 along +Z.
 *
 * With lonDeg=-90 (default), eye is at ~(0, y, -dist), seeing the +Z hemisphere ≈ geoLon~90°.
 * Empirically: camera.lonDeg = -(targetGeoLon) maps the camera to face targetGeoLon.
 */
function animateCameraTo(
  engine: SocWebGLEngine,
  target: [number, number],
  targetZoom: number,
  durationMs: number = 1200,
): void {
  const cam = (engine as any).camera
  if (!cam) return

  // Camera eye uses same ECEF formula as geo points:
  //   eye.x = -dist * cos(latDeg) * cos(lonDeg)
  //   eye.z =  dist * cos(latDeg) * sin(lonDeg)
  // So camera.lonDeg = geoLon places the camera on the same side as the
  // target → the target faces the camera directly.
  //
  // For latitude: the camera looks at origin (0,0,0), NOT at the target point.
  // With latDeg = geoLat, the camera is at the same latitude as the target,
  // looking down toward origin → the target is directly in front.
  // We use a slight reduction (0.8x) so the camera looks slightly "above"
  // the target, giving a better overview perspective.
  const targetCameraLon = target[0]
  const targetCameraLat = Math.max(-60, Math.min(60, target[1] * 0.8))

  const totalSteps = Math.ceil(durationMs / 16)

  const startLon = cam.lonDeg as number
  const startLat = cam.latDeg as number
  const startZ   = cam.zoom   as number

  // Shortest rotation path (wrap-around)
  let deltaLon = targetCameraLon - startLon
  if (deltaLon > 180)  deltaLon -= 360
  if (deltaLon < -180) deltaLon += 360
  const endLon = startLon + deltaLon

  let currentStep = 0

  const animate = () => {
    if (currentStep >= totalSteps) return
    currentStep++
    const t = currentStep / totalSteps
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

    cam.lonDeg = startLon + (endLon - startLon) * e
    cam.latDeg = startLat + (targetCameraLat - startLat) * e
    cam.zoom   = startZ   + (targetZoom      - startZ)   * e
    cam.autoRotate = false

    requestAnimationFrame(animate)
  }
  requestAnimationFrame(animate)
}
