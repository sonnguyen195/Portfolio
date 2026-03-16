import type { ReactNode } from 'react'

import { AdsDemo } from './ads/AdsDemo'
import { GuardianXDemo } from './guardianx/GuardianXDemo'

export type DemoAppId = 'guardianx' | 'ads'

export function DemoApp(props: { appId: DemoAppId; onExit: () => void }): ReactNode {
  const { appId, onExit } = props

  if (appId === 'guardianx') return <GuardianXDemo onExit={onExit} />
  if (appId === 'ads') return <AdsDemo onExit={onExit} />

  return null
}

