/**
 * SOC Demo Module
 *
 * Cinematic demos for SOC flows:
 * 1. Cyber Attack Detected → Incident Creation
 * 2. Incident Triage → Stage Progression → Close
 * 3. Threat Mitigation → IP Blocking
 *
 * Isolated module — does NOT modify Ironman Lab scene.
 */
import type { ReactNode } from 'react'
import { SocDemoScene } from './scene'

export type SocDemoProps = {
  onExit?: () => void
  embedded?: boolean
  autoPlay?: boolean
}

export function SocDemo(props: SocDemoProps): ReactNode {
  const { onExit, embedded } = props
  return (
    <div
      className="soc-demo"
      data-embedded={embedded ?? false}
      style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px' }}
    >
      <SocDemoScene onExit={onExit} />
    </div>
  )
}
