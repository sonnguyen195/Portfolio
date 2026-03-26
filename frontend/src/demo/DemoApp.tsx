import type { ReactNode } from 'react'

import { AdsDemo } from './ads/AdsDemo'
import { GuardianXDemo } from './guardianx/GuardianXDemo'
import { ScenarioDemoWrapper } from './ScenarioDemoWrapper'

export type DemoAppId = 'guardianx' | 'ads' | 'soc' | 'guardianx-3d'

export function DemoApp(props: { appId: DemoAppId; onExit: () => void; embedded?: boolean }): ReactNode {
  const { appId, onExit, embedded } = props

  if (appId === 'guardianx') return <GuardianXDemo onExit={onExit} embedded={embedded} />
  if (appId === 'ads') return <AdsDemo onExit={onExit} embedded={embedded} />
  if (appId === 'soc') return <ScenarioDemoWrapper variant="soc" onExit={onExit} embedded={embedded} />
  if (appId === 'guardianx-3d') return <ScenarioDemoWrapper variant="guardianx-3d" onExit={onExit} embedded={embedded} />

  return null
}

