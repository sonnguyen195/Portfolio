/**
 * Demo Modules — Lazy Load Exports
 *
 * Demos are isolated modules with their own scene, components, animations,
 * hooks, and data. They do NOT modify the Ironman Lab scene.
 *
 * Usage:
 *   import { SocDemoLazy, GuardianXDemoLazy } from './demos'
 *   <Suspense fallback={...}><SocDemoLazy onExit={...} /></Suspense>
 */

import { lazy } from 'react'

export type DemoAppId = 'soc' | 'guardianx'

/** Lazy-loaded SOC demo module */
export const SocDemoLazy = lazy(() =>
  import('./soc').then((m) => ({ default: m.SocDemo }))
)

/** Lazy-loaded GuardianX demo module */
export const GuardianXDemoLazy = lazy(() =>
  import('./guardianx').then((m) => ({ default: m.GuardianXDemo }))
)

export { SocDemo } from './soc'
export { GuardianXDemo } from './guardianx'
export type { SocDemoProps } from './soc'
export type { GuardianXDemoProps } from './guardianx'

export { CommandConsole, ScenarioSelector, ScenarioControls } from './ui'
export type { ScenarioOption } from './ui'
