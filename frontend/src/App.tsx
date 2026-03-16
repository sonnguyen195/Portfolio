import './App.css'
import React, { useEffect, useMemo, useState } from 'react'
import type { Portfolio } from './types/portfolio'
import type { DemoAppId } from './demo/DemoApp'
import { DemoApp } from './demo/DemoApp'
import { SceneLoadingScreen } from './three/SceneLoadingScreen'

const LabScene = React.lazy(() =>
  import('./three/LabScene').then((m) => ({ default: m.LabScene }))
)
import { LabSceneProvider } from './three/LabSceneContext'
import { LabScrollSync } from './three/LabScrollSync'
import { LabCursorSync } from './three/LabCursorSync'
import { InteractionManager } from './three/InteractionManager'
import { FocusedObjectPanel } from './three/FocusedObjectPanel'
import { ObjectHighlight } from './three/ObjectHighlight'
import { InteractionCursor } from './three/InteractionCursor'
import { InteractionAudio } from './three/InteractionAudio'

function getDemoIdFromPath(pathname: string): DemoAppId | null {
  const m = pathname.match(/^\/demo\/(guardianx|ads)$/)
  return (m?.[1] as DemoAppId) ?? null
}

const data: Portfolio = {
  profile: {
    name: 'Nguyễn Minh Sơn',
    title: 'Backend Engineer (Python)',
    location: 'Ho Chi Minh City, Vietnam',
    email: 'sonson195.sn@gmail.com',
    phone: '0384860120',
    summary:
      'Backend Engineer (Python) with 4+ years of experience building production-grade backend systems, REST APIs and realtime platforms. Strong in system design and platform integration (PostgreSQL, Redis, MinIO, OpenSearch) with a focus on performance, observability and maintainable architecture.',
  },
  highlights: [
    'Design and maintain REST APIs with clear contracts, consistent pagination and validation.',
    'Design caching and performance layers: TTL, warmup, herd protection, selective invalidation.',
    'Improve observability with focused DB logs, request tracing and middleware context.',
    'Build realtime features with Django Channels/WebSocket and stream monitoring.',
  ],
  skills: {
    core: ['Python', 'Django', 'Django REST Framework', 'Django Ninja'],
    platform: ['PostgreSQL', 'Redis', 'MinIO', 'OpenSearch'],
    practice: ['System design', 'REST API design', 'Performance & caching', 'Observability'],
  },
  experience: [
    {
      company: 'Gaion',
      role: 'Backend Engineer — GAION (Python Project)',
      location: 'Ho Chi Minh City',
      start: '2025-06',
      end: null,
      bullets: [
        'Designed DynamicSchema core (In/Out/Create/Update) with M2M support and optimized bulk loading.',
        'Built a Measurement framework (simple/range/dimensions) with unit conversion and standardized validation/formatting.',
        'Reduced latency on heavy endpoints using a universal cache with selective invalidation, warmup and herd protection.',
      ],
      tech: ['Django Ninja', 'Celery', 'Channels', 'PostgreSQL', 'Redis'],
    },
    {
      company: 'Gaion',
      role: 'Backend Engineer — GAION (Security Operations Platform)',
      location: 'Ho Chi Minh City',
      start: '2024-04',
      end: '2025-05',
      bullets: [
        'Designed a modular security operations platform: tickets/SOP, rules, reports, threat intel and dashboards.',
        'Implemented full SOP ticket workflow with audit-friendly activity logging.',
        'Hardened authentication with JWT, OTP 2FA, password rules and session control/timeout middleware.',
      ],
      tech: ['Django', 'DRF', 'SimpleJWT', 'Celery', 'PostgreSQL'],
    },
    {
      company: 'Draco Fintech (draerp.vn)',
      role: 'Back-end Developer',
      location: 'Ho Chi Minh City',
      start: '2022-04',
      end: '2023-12',
      bullets: [
        'Customized ERP modules and integrations using Frappe and Python.',
        'Developed REST APIs and webhooks for Wordpress–ERP integration.',
        'Implemented realtime dashboards/chat with socket.io and payment webhooks.',
      ],
      tech: ['Frappe', 'Python', 'VueJS', 'socket.io'],
    },
  ],
  education: [
    {
      school: 'HUTECH University',
      major: 'Information Technology',
      start: '2018-07',
      end: '2022-07',
      details: ['GPA: 2.8'],
    },
  ],
  projects: [
    {
      id: 'guardianx',
      demoId: 'guardianx',
      name: 'GuardianX — Surveillance Platform',
      description:
        'Camera monitoring dashboard, event & alert management, and device control for security operations.',
      stack: ['Django', 'Celery', 'Channels', 'PostgreSQL', 'Redis', 'MinIO', 'OpenSearch'],
      links: [],
    },
    {
      id: 'ads',
      demoId: 'ads',
      name: 'ADS & SOP — Ticket, Exception & Workflow',
      description:
        'Security ticket lifecycle, incident-to-ticket flow, detection/exception rules, SOP workflow management and analytics for security operations.',
      stack: ['Django', 'Django REST Framework', 'Celery', 'PostgreSQL', 'Redis', 'React'],
      links: [],
    },
  ],
  interests: ['Reading books', 'Travel'],
  certificates: [
    {
      name: 'Creative thinking skills and time management',
      issuer: 'HUTECH',
      date: '2021-08',
    },
    {
      name: 'Presentation Skills and Job Search',
      issuer: 'HUTECH',
      date: '2021-08',
    },
  ],
}

function Portfolio3DView({
  data,
  year,
}: {
  data: Portfolio
  mailto: string
  phone: string | null
  year: number
  setDemoAppId: (id: DemoAppId | null) => void
}) {
  const { profile } = data
  return (
    <LabSceneProvider>
      {/* Full-screen 3D lab environment (GLB) as background hero */}
      <React.Suspense fallback={<SceneLoadingScreen />}>
        <LabScene />
      </React.Suspense>
      <LabScrollSync />
      <LabCursorSync />
      <InteractionManager />
      <FocusedObjectPanel />
      <ObjectHighlight />
      <InteractionCursor />
      <InteractionAudio />
      <div className="overlay3d">
        <footer className="footer footer3d">
          <div className="container">© {year} {profile.name}. Built with React • Three.js • Django.</div>
        </footer>
      </div>
    </LabSceneProvider>
  )
}

function App() {
  const { profile } = data
  const mailto = `mailto:${profile.email}`
  const phone = profile.phone ? `tel:${profile.phone.replace(/\s/g, '')}` : null
  const year = useMemo(() => new Date().getFullYear(), [])

  const [demoAppId, setDemoAppIdState] = useState<DemoAppId | null>(() =>
    getDemoIdFromPath(window.location.pathname)
  )

  const setDemoAppId = (id: DemoAppId | null) => {
    setDemoAppIdState(id)
    if (id) window.history.pushState(null, '', `/demo/${id}`)
    else window.history.replaceState(null, '', '/')
  }

  useEffect(() => {
    const onPopState = () => setDemoAppIdState(getDemoIdFromPath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!demoAppId) {
      import('./three/LabEnvironment').then((m) => m.preloadLabEnvironment())
      import('./three/LabScene')
    }
  }, [demoAppId])

  if (demoAppId) {
    return (
      <div className="viewWrap viewDemo" key="demo">
        <div className="viewTransition">
          <DemoApp appId={demoAppId} onExit={() => setDemoAppId(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="viewWrap viewPortfolio" key="portfolio">
      <div className="viewTransition">
        <Portfolio3DView
          data={data}
          mailto={mailto}
          phone={phone}
          year={year}
          setDemoAppId={setDemoAppId}
        />
      </div>
    </div>
  )
}

export default App
