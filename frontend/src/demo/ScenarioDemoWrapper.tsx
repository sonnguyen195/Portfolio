/**
 * Wrapper for Scenario demos (SOC, GuardianX 3D) with CommandConsole.
 * Auto-runs scenario on load. UI layer: AI top-left, Command top-right.
 *
 * For 'guardianx-3d', now uses the GuardianXLiveScene which has its own
 * built-in command console, WebGL city map, and drone simulations.
 */
import { useEffect, type ReactNode } from 'react'
import { SocDemo } from '../demos/soc'
import { GuardianXLiveScene } from '../demos/guardianx/livemap'
import { CommandConsole } from '../demos/ui'
import { runTimeline, stopTimeline } from '../demos/core/timeline'
import type { ScenarioId } from '../demos/core/scenario'

type ScenarioDemoWrapperProps = {
  variant: 'soc' | 'guardianx-3d'
  onExit: () => void
  embedded?: boolean
}

export function ScenarioDemoWrapper({
  variant,
  onExit,
  embedded,
}: ScenarioDemoWrapperProps): ReactNode {
  // SOC still uses the scenario timeline for its old animation system
  const scenarioId: ScenarioId = variant === 'soc' ? 'soc-attack' : 'guardianx-mission'

  useEffect(() => {
    // Only auto-run timeline for SOC; GuardianX has its own simulation system
    if (variant === 'soc') {
      const cancel = runTimeline(scenarioId)
      return () => {
        cancel()
        stopTimeline()
      }
    }
  }, [scenarioId, variant])

  if (variant === 'guardianx-3d') {
    // GuardianXLiveScene has its own built-in command console, log, and HUD
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100vh' }}>
        <GuardianXLiveScene onExit={onExit} />
      </div>
    )
  }

  // SOC demo with external CommandConsole overlay
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100vh' }}>
      <SocDemo onExit={onExit} embedded={embedded} />
      <div className="ui-layer">
        <div className="ui-panel ui-panel-top-right" style={{ position: 'absolute' }}>
          <CommandConsole defaultCollapsed={false} />
        </div>
      </div>
    </div>
  )
}
