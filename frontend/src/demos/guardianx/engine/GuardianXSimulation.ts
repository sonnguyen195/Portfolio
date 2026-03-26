/**
 * GuardianX Simulation Scenarios
 *
 * Scripted drone operation sequences:
 *   1. Deploy Drone Mission — create mission → deploy drones to zones
 *   2. Emergency Delivery — urgent package delivery with fast drones
 *   3. Drone Patrol — continuous surveillance patrol routes
 *
 * Each scenario drives the GuardianXWebGLEngine with timed steps.
 */

import type { GuardianXWebGLEngine } from './GuardianXWebGLEngine'

// ── Types ────────────────────────────────────────────────────────────────────

export type GuardianXSimulationId = 'deploy-mission' | 'emergency-delivery' | 'drone-patrol'

export interface GxSimStep {
  time: number
  action: 'log' | 'camera' | 'zone' | 'terminal' | 'deploy' | 'clear' | 'complete'
  message?: string
  cameraTarget?: [number, number]
  cameraZoom?: number
  zoneId?: string
  zoneAction?: 'activate' | 'deactivate'
  terminalId?: string
  droneId?: string
  droneLabel?: string
  routeKey?: string
  droneColor?: [number, number, number]
  droneSpeed?: number
  missionType?: 'deploy' | 'emergency' | 'patrol'
}

export interface GxSimDefinition {
  id: GuardianXSimulationId
  name: string
  description: string
  totalDurationMs: number
  steps: GxSimStep[]
}

// ── Color Presets ────────────────────────────────────────────────────────────

const CYAN: [number, number, number] = [0, 0.83, 1]
const GREEN: [number, number, number] = [0, 1, 0.53]
const ORANGE: [number, number, number] = [1, 0.6, 0]
const RED: [number, number, number] = [1, 0.3, 0.3]
const PURPLE: [number, number, number] = [0.8, 0.2, 1]
const YELLOW: [number, number, number] = [1, 0.9, 0.2]

// ── Scenario 1: Deploy Drone Mission ─────────────────────────────────────────

export const DEPLOY_MISSION: GxSimDefinition = {
  id: 'deploy-mission',
  name: 'Deploy Drone Mission',
  description: 'Create survey mission, deploy drones to multiple zones',
  totalDurationMs: 24000,
  steps: [
    // Phase 1: Mission initialization
    { time: 0,    action: 'log', message: '━━━ DRONE MISSION DEPLOYMENT INITIATED ━━━' },
    { time: 200,  action: 'log', message: '◈ Phase 1: Mission planning & zone assignment' },
    { time: 500,  action: 'camera', cameraTarget: [0, 0], cameraZoom: 0.9 },
    { time: 800,  action: 'zone', zoneId: 'zone-alpha', zoneAction: 'activate' },
    { time: 1000, action: 'log', message: '  ✓ Zone Alpha activated — Downtown sector' },
    { time: 1500, action: 'zone', zoneId: 'zone-bravo', zoneAction: 'activate' },
    { time: 1700, action: 'log', message: '  ✓ Zone Bravo activated — Industrial sector' },
    { time: 2200, action: 'zone', zoneId: 'zone-charlie', zoneAction: 'activate' },
    { time: 2400, action: 'log', message: '  ✓ Zone Charlie activated — Tech Park sector' },
    { time: 2800, action: 'terminal', terminalId: 'hub-central' },
    { time: 3000, action: 'log', message: '  ✓ Central Hub online — pre-flight checks passed' },

    // Phase 2: First drone deployment
    { time: 4000, action: 'log', message: '◈ Phase 2: Drone deployment — Wave 1' },
    { time: 4300, action: 'camera', cameraTarget: [0, 0], cameraZoom: 1.1 },
    { time: 4500, action: 'deploy', droneId: 'drone-alpha-1', droneLabel: 'DRN-A1', routeKey: 'central-to-north', droneColor: CYAN, droneSpeed: 0.35, missionType: 'deploy' },
    { time: 4700, action: 'log', message: '  ▸ DRN-A1 deployed → North Hub (survey route)' },
    { time: 5500, action: 'deploy', droneId: 'drone-alpha-2', droneLabel: 'DRN-A2', routeKey: 'central-to-east', droneColor: CYAN, droneSpeed: 0.3, missionType: 'deploy' },
    { time: 5700, action: 'log', message: '  ▸ DRN-A2 deployed → East Hub (survey route)' },
    { time: 6500, action: 'deploy', droneId: 'drone-alpha-3', droneLabel: 'DRN-A3', routeKey: 'central-to-south', droneColor: GREEN, droneSpeed: 0.32, missionType: 'deploy' },
    { time: 6700, action: 'log', message: '  ▸ DRN-A3 deployed → South Hub (survey route)' },

    // Phase 3: Second wave
    { time: 8000, action: 'log', message: '◈ Phase 3: Drone deployment — Wave 2' },
    { time: 8300, action: 'camera', cameraTarget: [-5, 0], cameraZoom: 1.0 },
    { time: 8500, action: 'deploy', droneId: 'drone-bravo-1', droneLabel: 'DRN-B1', routeKey: 'central-to-west', droneColor: ORANGE, droneSpeed: 0.28, missionType: 'deploy' },
    { time: 8700, action: 'log', message: '  ▸ DRN-B1 deployed → West Hub (cargo route)' },
    { time: 9500, action: 'zone', zoneId: 'zone-delta', zoneAction: 'activate' },
    { time: 9700, action: 'log', message: '  ✓ Zone Delta activated — Residential sector' },
    { time: 10000, action: 'terminal', terminalId: 'hub-north' },
    { time: 10200, action: 'terminal', terminalId: 'hub-east' },
    { time: 10400, action: 'log', message: '  ✓ North & East hubs confirmed receiving' },

    // Phase 4: Transit monitoring
    { time: 11500, action: 'log', message: '◈ Phase 4: In-transit monitoring' },
    { time: 11800, action: 'camera', cameraTarget: [0, 2], cameraZoom: 0.85 },
    { time: 12000, action: 'log', message: '  ⟐ DRN-A1: 45% route complete — alt 120m — speed 42km/h' },
    { time: 13000, action: 'log', message: '  ⟐ DRN-A2: 38% route complete — alt 115m — speed 38km/h' },
    { time: 14000, action: 'log', message: '  ⟐ DRN-A3: 52% route complete — alt 110m — speed 40km/h' },
    { time: 15000, action: 'log', message: '  ⟐ DRN-B1: 35% route complete — alt 105m — speed 35km/h' },

    // Phase 5: Arrival reports
    { time: 16000, action: 'log', message: '◈ Phase 5: Arrival confirmation' },
    { time: 16500, action: 'log', message: '  ✓ DRN-A1 arrived at North Hub — mission data uploaded' },
    { time: 17500, action: 'log', message: '  ✓ DRN-A2 arrived at East Hub — mission data uploaded' },
    { time: 18500, action: 'log', message: '  ✓ DRN-A3 arrived at South Hub — mission data uploaded' },
    { time: 19500, action: 'log', message: '  ✓ DRN-B1 arrived at West Hub — cargo delivered' },

    // Phase 6: Mission complete
    { time: 20500, action: 'log', message: '◈ Phase 6: Mission summary' },
    { time: 20800, action: 'camera', cameraTarget: [0, 0], cameraZoom: 0.9 },
    { time: 21000, action: 'log', message: '  DRONES DEPLOYED: 4  |  ZONES COVERED: 4  |  SUCCESS: 100%' },
    { time: 21500, action: 'log', message: '  TOTAL FLIGHT TIME: 18m 42s  |  DATA COLLECTED: 2.8GB' },
    { time: 22000, action: 'log', message: '  ALL DRONES RTB — batteries nominal' },
    { time: 23000, action: 'log', message: '━━━ MISSION DEPLOYMENT COMPLETE ━━━' },
    { time: 24000, action: 'complete' },
  ],
}

// ── Scenario 2: Emergency Delivery ───────────────────────────────────────────

export const EMERGENCY_DELIVERY: GxSimDefinition = {
  id: 'emergency-delivery',
  name: 'Emergency Delivery',
  description: 'Urgent medical supply delivery to hospital via priority corridor',
  totalDurationMs: 18000,
  steps: [
    // Phase 1: Emergency alert
    { time: 0,    action: 'log', message: '━━━ EMERGENCY DELIVERY INITIATED ━━━' },
    { time: 200,  action: 'log', message: '🔴 PRIORITY ALERT: Medical supply request received' },
    { time: 500,  action: 'camera', cameraTarget: [0, 0], cameraZoom: 1.0 },
    { time: 800,  action: 'terminal', terminalId: 'hub-central' },
    { time: 1000, action: 'log', message: '  Source: Central Hub — Medical Supplies Depot' },
    { time: 1200, action: 'terminal', terminalId: 'target-hospital' },
    { time: 1400, action: 'log', message: '  Destination: City Hospital — URGENT priority' },
    { time: 1800, action: 'zone', zoneId: 'zone-alpha', zoneAction: 'activate' },
    { time: 2000, action: 'log', message: '  ⚠ Priority corridor activated — airspace cleared' },

    // Phase 2: Rapid deployment
    { time: 3000, action: 'log', message: '◈ Phase 2: Rapid drone deployment' },
    { time: 3200, action: 'log', message: '  Pre-flight: BYPASS (emergency override)' },
    { time: 3500, action: 'deploy', droneId: 'drone-em-1', droneLabel: 'EMR-01', routeKey: 'emergency-hospital', droneColor: RED, droneSpeed: 0.55, missionType: 'emergency' },
    { time: 3700, action: 'log', message: '  ▸ EMR-01 launched — max speed — direct route' },
    { time: 4000, action: 'camera', cameraTarget: [1.5, 1.5], cameraZoom: 1.3 },
    { time: 4500, action: 'log', message: '  ⟐ EMR-01: climbing to priority altitude 150m' },

    // Phase 3: Backup drone
    { time: 5500, action: 'log', message: '◈ Phase 3: Backup drone deployment' },
    { time: 5800, action: 'deploy', droneId: 'drone-em-2', droneLabel: 'EMR-02', routeKey: 'emergency-warehouse', droneColor: ORANGE, droneSpeed: 0.45, missionType: 'emergency' },
    { time: 6000, action: 'log', message: '  ▸ EMR-02 launched → Warehouse (backup supply)' },
    { time: 6300, action: 'terminal', terminalId: 'target-warehouse' },
    { time: 6500, action: 'log', message: '  ⚠ Warehouse terminal activated for backup retrieval' },

    // Phase 4: In-flight monitoring
    { time: 7500, action: 'log', message: '◈ Phase 4: Real-time flight monitoring' },
    { time: 7800, action: 'camera', cameraTarget: [2, 2], cameraZoom: 1.2 },
    { time: 8000, action: 'log', message: '  ⟐ EMR-01: 55% — alt 150m — speed 68km/h — ETA 45s' },
    { time: 8500, action: 'log', message: '  ⟐ EMR-01: obstacle avoidance — rerouting +2s' },
    { time: 9000, action: 'log', message: '  ⟐ EMR-01: 72% — descending to delivery altitude' },
    { time: 9500, action: 'log', message: '  ⟐ EMR-02: 40% — alt 120m — speed 55km/h' },

    // Phase 5: Delivery
    { time: 10500, action: 'log', message: '◈ Phase 5: Primary delivery' },
    { time: 10800, action: 'camera', cameraTarget: [3, 3], cameraZoom: 1.5 },
    { time: 11000, action: 'log', message: '  ✓ EMR-01 arrived at Hospital — initiating landing' },
    { time: 11500, action: 'log', message: '  ✓ Payload released — medical supplies delivered' },
    { time: 12000, action: 'log', message: '  ✓ Delivery confirmed by ground team' },
    { time: 12500, action: 'log', message: '  ⟐ EMR-01: RTB initiated — battery 62%' },

    // Phase 6: Backup delivery
    { time: 13500, action: 'log', message: '◈ Phase 6: Backup delivery' },
    { time: 14000, action: 'log', message: '  ✓ EMR-02 arrived at Warehouse — loading backup' },
    { time: 14500, action: 'log', message: '  ✓ Backup supplies secured and stored' },

    // Phase 7: Summary
    { time: 15500, action: 'log', message: '◈ Phase 7: Emergency delivery summary' },
    { time: 15800, action: 'camera', cameraTarget: [0, 0], cameraZoom: 0.9 },
    { time: 16000, action: 'log', message: '  PRIMARY: ✓ Delivered in 3m 12s (target: 5m)' },
    { time: 16400, action: 'log', message: '  BACKUP: ✓ Secured at warehouse' },
    { time: 16800, action: 'log', message: '  RESPONSE TIME: 32% faster than ground transport' },
    { time: 17200, action: 'log', message: '━━━ EMERGENCY DELIVERY COMPLETE ━━━' },
    { time: 18000, action: 'complete' },
  ],
}

// ── Scenario 3: Drone Patrol ─────────────────────────────────────────────────

export const DRONE_PATROL: GxSimDefinition = {
  id: 'drone-patrol',
  name: 'Drone Patrol Simulation',
  description: 'Continuous surveillance patrol across city zones',
  totalDurationMs: 22000,
  steps: [
    // Phase 1: Patrol initialization
    { time: 0,    action: 'log', message: '━━━ PATROL SIMULATION INITIATED ━━━' },
    { time: 200,  action: 'log', message: '◈ Phase 1: Patrol zone configuration' },
    { time: 500,  action: 'camera', cameraTarget: [0, 0], cameraZoom: 0.8 },
    { time: 800,  action: 'zone', zoneId: 'zone-alpha', zoneAction: 'activate' },
    { time: 1000, action: 'log', message: '  ✓ Patrol Zone Alpha: Downtown — HIGH priority' },
    { time: 1500, action: 'zone', zoneId: 'zone-bravo', zoneAction: 'activate' },
    { time: 1700, action: 'log', message: '  ✓ Patrol Zone Bravo: Industrial — MEDIUM priority' },
    { time: 2200, action: 'zone', zoneId: 'zone-charlie', zoneAction: 'activate' },
    { time: 2400, action: 'log', message: '  ✓ Patrol Zone Charlie: Tech Park — MEDIUM priority' },
    { time: 2800, action: 'zone', zoneId: 'zone-echo', zoneAction: 'activate' },
    { time: 3000, action: 'log', message: '  ✓ Patrol Zone Echo: Harbor — LOW priority' },

    // Phase 2: Deploy patrol drones
    { time: 4000, action: 'log', message: '◈ Phase 2: Patrol drone deployment' },
    { time: 4300, action: 'terminal', terminalId: 'hub-central' },
    { time: 4500, action: 'deploy', droneId: 'patrol-1', droneLabel: 'PTL-01', routeKey: 'patrol-downtown', droneColor: CYAN, droneSpeed: 0.2, missionType: 'patrol' },
    { time: 4700, action: 'log', message: '  ▸ PTL-01 launched — Downtown patrol route (loop)' },
    { time: 5500, action: 'deploy', droneId: 'patrol-2', droneLabel: 'PTL-02', routeKey: 'patrol-wide', droneColor: GREEN, droneSpeed: 0.18, missionType: 'patrol' },
    { time: 5700, action: 'log', message: '  ▸ PTL-02 launched — Wide perimeter patrol (loop)' },

    // Phase 3: Additional coverage
    { time: 7000, action: 'log', message: '◈ Phase 3: Extended coverage deployment' },
    { time: 7200, action: 'camera', cameraTarget: [-5, -3], cameraZoom: 1.0 },
    { time: 7500, action: 'deploy', droneId: 'patrol-3', droneLabel: 'PTL-03', routeKey: 'central-to-west', droneColor: PURPLE, droneSpeed: 0.22, missionType: 'patrol' },
    { time: 7700, action: 'log', message: '  ▸ PTL-03 launched → Industrial sector patrol' },
    { time: 8500, action: 'deploy', droneId: 'patrol-4', droneLabel: 'PTL-04', routeKey: 'east-to-harbor', droneColor: YELLOW, droneSpeed: 0.25, missionType: 'patrol' },
    { time: 8700, action: 'log', message: '  ▸ PTL-04 launched → Harbor sector patrol' },

    // Phase 4: Live surveillance feed
    { time: 10000, action: 'log', message: '◈ Phase 4: Surveillance feed active' },
    { time: 10300, action: 'camera', cameraTarget: [0, 0], cameraZoom: 0.85 },
    { time: 10500, action: 'log', message: '  📡 PTL-01: Downtown — 4 vehicles tracked, 12 pedestrians' },
    { time: 11000, action: 'log', message: '  📡 PTL-02: Perimeter — no anomalies detected' },
    { time: 11500, action: 'log', message: '  📡 PTL-03: Industrial — 2 vehicles, restricted zone clear' },
    { time: 12000, action: 'log', message: '  📡 PTL-04: Harbor — 1 vessel approaching, ID verified' },

    // Phase 5: Alert detection
    { time: 13000, action: 'log', message: '◈ Phase 5: Anomaly detection' },
    { time: 13200, action: 'camera', cameraTarget: [6, 6], cameraZoom: 1.3 },
    { time: 13500, action: 'log', message: '  ⚠ PTL-02: Suspicious activity detected — Tech Park zone' },
    { time: 14000, action: 'log', message: '  ⚠ Rerouting PTL-02 for closer inspection...' },
    { time: 14500, action: 'deploy', droneId: 'patrol-5', droneLabel: 'PTL-05', routeKey: 'central-to-east', droneColor: RED, droneSpeed: 0.4, missionType: 'patrol' },
    { time: 14700, action: 'log', message: '  ▸ PTL-05 deployed — rapid response to Tech Park' },
    { time: 15500, action: 'log', message: '  ✓ PTL-05 on scene — visual confirmation: false alarm' },
    { time: 16000, action: 'log', message: '  ✓ Anomaly cleared — maintenance crew identified' },

    // Phase 6: Status report
    { time: 17000, action: 'log', message: '◈ Phase 6: Patrol status report' },
    { time: 17300, action: 'camera', cameraTarget: [0, 0], cameraZoom: 0.8 },
    { time: 17500, action: 'log', message: '  DRONES ACTIVE: 5  |  ZONES COVERED: 4  |  ALERTS: 1 (cleared)' },
    { time: 18000, action: 'log', message: '  PTL-01: Battery 78% — 3 loops completed' },
    { time: 18500, action: 'log', message: '  PTL-02: Battery 72% — 2 loops completed' },
    { time: 19000, action: 'log', message: '  PTL-03: Battery 85% — transit to sector' },
    { time: 19500, action: 'log', message: '  PTL-04: Battery 80% — harbor coverage active' },
    { time: 20000, action: 'log', message: '  PTL-05: Battery 91% — returning to standby' },

    // Phase 7: Complete
    { time: 20800, action: 'log', message: '◈ Phase 7: Patrol simulation summary' },
    { time: 21000, action: 'log', message: '  COVERAGE: 94%  |  RESPONSE TIME: 28s avg  |  UPTIME: 100%' },
    { time: 21400, action: 'log', message: '━━━ PATROL SIMULATION COMPLETE ━━━' },
    { time: 22000, action: 'complete' },
  ],
}

// ── Registry ─────────────────────────────────────────────────────────────────

export const GX_SIMULATION_REGISTRY: Record<GuardianXSimulationId, GxSimDefinition> = {
  'deploy-mission':     DEPLOY_MISSION,
  'emergency-delivery': EMERGENCY_DELIVERY,
  'drone-patrol':       DRONE_PATROL,
}

// ── Callbacks ────────────────────────────────────────────────────────────────

export interface GxSimCallbacks {
  onLog: (message: string) => void
  onProgress: (progress: number) => void
  onComplete: () => void
}

// ── Runner ───────────────────────────────────────────────────────────────────

export function runGuardianXSimulation(
  id: GuardianXSimulationId,
  engine: GuardianXWebGLEngine,
  callbacks: GxSimCallbacks,
): () => void {
  const scenario = GX_SIMULATION_REGISTRY[id]
  if (!scenario) {
    callbacks.onLog(`Unknown simulation: ${id}`)
    callbacks.onComplete()
    return () => {}
  }

  const timers: ReturnType<typeof setTimeout>[] = []
  let cancelled = false
  const startTime = Date.now()

  engine.setAutoRotate(false)

  // Progress ticker
  const progressTimer = setInterval(() => {
    if (cancelled) return
    const elapsed = Date.now() - startTime
    const progress = Math.min(1, elapsed / scenario.totalDurationMs)
    callbacks.onProgress(progress)
  }, 200)
  timers.push(progressTimer as unknown as ReturnType<typeof setTimeout>)

  // Schedule steps
  for (const step of scenario.steps) {
    const timer = setTimeout(() => {
      if (cancelled) return
      executeGxStep(step, engine, callbacks)
    }, step.time)
    timers.push(timer)
  }

  return () => {
    cancelled = true
    for (const t of timers) clearTimeout(t)
    clearInterval(progressTimer)
    engine.setAutoRotate(true)
  }
}

function executeGxStep(
  step: GxSimStep,
  engine: GuardianXWebGLEngine,
  callbacks: GxSimCallbacks,
): void {
  switch (step.action) {
    case 'log':
      if (step.message) callbacks.onLog(step.message)
      break

    case 'camera':
      if (step.cameraTarget) {
        engine.focusCamera(step.cameraTarget[0], step.cameraTarget[1], step.cameraZoom)
      }
      break

    case 'zone':
      if (step.zoneId) {
        if (step.zoneAction === 'activate') {
          engine.activateZone(step.zoneId)
        } else {
          engine.deactivateZone(step.zoneId)
        }
      }
      break

    case 'terminal':
      if (step.terminalId) {
        engine.activateTerminal(step.terminalId)
      }
      break

    case 'deploy':
      if (step.droneId && step.routeKey) {
        engine.deployDrone(
          step.droneId,
          step.droneLabel ?? step.droneId,
          step.routeKey,
          step.droneColor,
          step.droneSpeed,
          step.missionType,
        )
      }
      break

    case 'clear':
      engine.clearDrones()
      engine.deactivateAllZones()
      break

    case 'complete':
      callbacks.onComplete()
      break
  }
}
