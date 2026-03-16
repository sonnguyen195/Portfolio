import type { ReactNode } from 'react'

import { AdsDemo } from './ads/AdsDemo'
import { GuardianXDemo } from './guardianx/GuardianXDemo'

export type DemoAppId = 'guardianx' | 'ads'

export function DemoApp(props: { appId: DemoAppId; onExit: () => void; embedded?: boolean }): ReactNode {
  const { appId, onExit, embedded } = props

  if (appId === 'guardianx') return <GuardianXDemo onExit={onExit} embedded={embedded} />
  if (appId === 'ads') return <AdsDemo onExit={onExit} embedded={embedded} />

  return null
}

