/**
 * Scenario catalog — maps console options to Scenario Engine IDs.
 */
import type { ScenarioId } from '../core/scenario'

export type ScenarioOption = {
  id: string
  label: string
  scenarioId: ScenarioId
  system: 'soc' | 'guardianx'
}

export const SOC_OPTIONS: ScenarioOption[] = [
  { id: 'cyber-attack', label: 'Run Cyber Attack Simulation', scenarioId: 'soc-attack', system: 'soc' },
  { id: 'incident-response', label: 'Run Incident Response', scenarioId: 'soc-attack', system: 'soc' },
  { id: 'threat-detection', label: 'Run Threat Detection', scenarioId: 'soc-attack', system: 'soc' },
]

export const GUARDIANX_OPTIONS: ScenarioOption[] = [
  { id: 'deploy-mission', label: 'Deploy Drone Mission', scenarioId: 'guardianx-mission', system: 'guardianx' },
  { id: 'emergency-delivery', label: 'Run Emergency Delivery', scenarioId: 'guardianx-mission', system: 'guardianx' },
  { id: 'drone-patrol', label: 'Simulate Drone Patrol', scenarioId: 'guardianx-mission', system: 'guardianx' },
]

/** Get only the options relevant to a specific system */
export function getOptionsForSystem(system: 'soc' | 'guardianx'): ScenarioOption[] {
  return system === 'soc' ? SOC_OPTIONS : GUARDIANX_OPTIONS
}
