/**
 * Demo Activation System
 *
 * Flow: user interacts with console → boot sequence → demo module loads (lazy) → scene activates
 * Does NOT modify Ironman Lab scene.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DemoAppId } from './DemoApp'
import { SystemBootSequence } from './SystemBootSequence'

export type DemoActivationState = 'idle' | 'loading' | 'active'

type DemoActivationContextValue = {
  state: DemoActivationState
  activeDemoId: DemoAppId | null
  activateDemo: (id: DemoAppId | null) => void
  preloadDemo: (id: DemoAppId) => void
  reportSceneLoaded: () => void
}

const DemoActivationContext = createContext<DemoActivationContextValue | null>(null)

export function useDemoActivation(): DemoActivationContextValue {
  const ctx = useContext(DemoActivationContext)
  if (!ctx) {
    return {
      state: 'idle',
      activeDemoId: null,
      activateDemo: () => {},
      preloadDemo: () => {},
      reportSceneLoaded: () => {},
    }
  }
  return ctx
}

const GuardianXDemoLazy = lazy(() =>
  import('./guardianx/GuardianXDemo').then((m) => ({ default: m.GuardianXDemo }))
)
const AdsDemoLazy = lazy(() =>
  import('./ads/AdsDemo').then((m) => ({ default: m.AdsDemo }))
)
const SocDemoLazy = lazy(() =>
  import('./ScenarioDemoWrapper').then((m) => ({
    default: (p: { onExit: () => void; embedded?: boolean }) => <m.ScenarioDemoWrapper variant="soc" {...p} />,
  }))
)
const GuardianXScenarioLazy = lazy(() =>
  import('./ScenarioDemoWrapper').then((m) => ({
    default: (p: { onExit: () => void; embedded?: boolean }) => <m.ScenarioDemoWrapper variant="guardianx-3d" {...p} />,
  }))
)

const DEMO_LAZY_MAP: Record<DemoAppId, React.LazyExoticComponent<React.ComponentType<any>>> = {
  guardianx: GuardianXDemoLazy,
  ads: AdsDemoLazy,
  soc: SocDemoLazy,
  'guardianx-3d': GuardianXScenarioLazy,
}

const preloadCache = new Set<DemoAppId>()

function preloadDemoModule(id: DemoAppId) {
  if (preloadCache.has(id)) return
  preloadCache.add(id)
  if (id === 'guardianx') import('./guardianx/GuardianXDemo')
  else if (id === 'ads') import('./ads/AdsDemo')
  else if (id === 'soc') import('../demos/soc')
  else if (id === 'guardianx-3d') import('../demos/guardianx')
}

type DemoActivationProviderProps = {
  children: ReactNode
  activeDemoId: DemoAppId | null
  onActivate: (id: DemoAppId | null) => void
}

export function DemoActivationProvider({
  children,
  activeDemoId,
  onActivate,
}: DemoActivationProviderProps) {
  const [state, setState] = useState<DemoActivationState>(
    activeDemoId ? 'loading' : 'idle'
  )

  const activateDemo = useCallback(
    (id: DemoAppId | null) => {
      onActivate(id)
      setState(id ? 'loading' : 'idle')
    },
    [onActivate]
  )

  const preloadDemo = useCallback((id: DemoAppId) => {
    preloadDemoModule(id)
  }, [])

  const reportSceneLoaded = useCallback(() => {
    setState('active')
  }, [])

  const value = useMemo<DemoActivationContextValue>(
    () => ({
      state: activeDemoId ? state : 'idle',
      activeDemoId,
      activateDemo,
      preloadDemo,
      reportSceneLoaded,
    }),
    [activeDemoId, state, activateDemo, preloadDemo, reportSceneLoaded]
  )

  return (
    <DemoActivationContext.Provider value={value}>
      {children}
    </DemoActivationContext.Provider>
  )
}

type DemoActivationSceneProps = {
  appId: DemoAppId
  onExit: () => void
  embedded?: boolean
}

function SceneMountedNotifier({ onMounted }: { onMounted: () => void }) {
  useEffect(() => {
    onMounted()
  }, [onMounted])
  return null
}

function DemoActivationSceneInner({
  appId,
  onExit,
  embedded,
  reportSceneLoaded,
}: DemoActivationSceneProps & { reportSceneLoaded: () => void }) {
  const [bootComplete, setBootComplete] = useState(false)
  const DemoComponent = DEMO_LAZY_MAP[appId]
  if (!DemoComponent) return null

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100vh' }}>
      {/* Cinematic boot sequence overlay */}
      <AnimatePresence>
        {!bootComplete && (
          <motion.div
            key="boot"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <SystemBootSequence onComplete={() => setBootComplete(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo scene — loads in parallel, revealed when boot completes */}
      <motion.div
        animate={{ opacity: bootComplete ? 1 : 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: bootComplete ? 'auto' : 'none',
        }}
      >
        <Suspense fallback={null}>
          <SceneMountedNotifier onMounted={reportSceneLoaded} />
          <DemoComponent onExit={onExit} embedded={embedded} />
        </Suspense>
      </motion.div>
    </div>
  )
}

export function DemoActivationScene(props: DemoActivationSceneProps) {
  const { reportSceneLoaded } = useDemoActivation()
  return <DemoActivationSceneInner {...props} reportSceneLoaded={reportSceneLoaded} />
}
