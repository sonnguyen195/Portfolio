/**
 * Cyber Attack World Map — public exports after react-globe.gl migration.
 * Only the data/type surface is exported; the visual layer lives in
 * scene/SocDemoScene.tsx via react-globe.gl.
 */
export { useAttackArcs } from './DataSimulation'
export { MOCK_ATTACK_ARCS } from './attackArcData'
export type { AttackArc, ArcType } from './attackArcData'
export { AttackArcProvider, useAttackArcsContext } from './AttackArcContext'
