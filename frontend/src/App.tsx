import './App.css'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Portfolio } from './types/portfolio'
import type { DemoAppId } from './demo/DemoApp'
import { DemoActivationProvider, DemoActivationScene } from './demo/DemoActivation'
import { SceneLoadingScreen } from './three/SceneLoadingScreen'
import { LandingPage } from './LandingPage'

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
  const m = pathname.match(/^\/demo\/(guardianx|ads|soc|guardianx-3d)$/)
  return (m?.[1] as DemoAppId) ?? null
}

const VIEW_MODE_KEY = 'portfolio-view-mode'

function getInitialViewMode(): 'landing' | '3d' {
  if (typeof window === 'undefined') return 'landing'
  return sessionStorage.getItem(VIEW_MODE_KEY) === '3d' ? '3d' : 'landing'
}

function isEmbedded(): boolean {
  return typeof window !== 'undefined' && (window.self !== window.top || new URLSearchParams(window.location.search).get('embed') === '1')
}

const data: Portfolio = {
  profile: {
    name: 'Nguyễn Minh Sơn',
    title: 'Backend Engineer (Python)',
    location: 'Ho Chi Minh City, Vietnam',
    email: 'sonson195.sn@gmail.com',
    phone: '0384860120',
    github: 'https://github.com',
    linkedin: 'www.linkedin.com/in/nguyen-son-887a84155',
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
      role: 'Backend Engineer — Python Project',
      location: 'Ho Chi Minh City',
      start: '2025-06',
      end: null,
      bullets: [
        'Designed and maintained REST APIs with consistent contracts, pagination, and validation for production services.',
        'Designed and implemented DynamicSchema core (In/Out/Create/Update), including M2M handling and optimized bulk measurement loading for flexible API outputs.',
        'Built a Measurement framework (simple/range/dimensions) with unit conversion, user preferences, and standardized formatting/validation.',
        'Implemented caching & performance optimization (universal cache, hint registry, selective invalidation, warmup, TTL, herd protection) to improve heavy-endpoint latency.',
        'Standardized pagination & response contracts using OptimizedPaginator + BaseResponse for consistent metadata and smaller list payloads.',
        'Added logging/observability (filtered DB logs, request-level middleware, context tracing) to speed up production debugging.',
        'Delivered Delivery operations: status workflow, approvals/checklists, status mapping, route/items, confirmation/return flows, and map/weather integration.',
        'Built Devices management: schema/services for packaging/sensor/camera/power/navigation, device library, measurement-ready models, and large migrations.',
        'Implemented Surveillance: mission builder, profile automation, multi-drone assignment per mission, GCS/QGroundControl integration, and video analysis/reporting.',
        'Developed Terminals & Routes: terminals, routes, operating schedules/exceptions, and route services.',
        'Built media processing pipeline including preview and detect services, integrated with surveillance and video stream monitoring.',
        'Managed Stream monitors: AI monitor schemas, MinIO integration, AI detection service integration, and realtime drawing sessions.',
        'Implemented video processing pipeline: extracted frames from RTSP streams (OpenCV), sent to AI detection service, rendered bounding boxes/labels/confidence, streamed annotated frames via FFmpeg.',
        'Delivered Dashboard & Task status: configurable panels and task progress tracking.',
        'Integrated Third-party APIs (Anyang/ETRI): schemas/services/views, API key controller, and automation/status mapping.',
      ],
      tech: ['Django Ninja', 'Django ORM', 'Celery', 'Channels', 'PostgreSQL', 'Redis', 'MinIO', 'OpenSearch'],
    },
    {
      company: 'Gaion',
      role: 'Backend Engineer — Security Operations Platform',
      location: 'Ho Chi Minh City',
      start: '2024-04',
      end: '2025-05',
      bullets: [
        'Designed and implemented a secure backend platform for security operations management, organized into modular Django apps (tickets/SOP, rules, reports, threat intel, dashboards, handover, forum).',
        'Built a full SOP Ticket incident workflow: listing/detail, controlled updates, action pipeline (approve/reject/withdraw/close/review/request support), comments, and audit-friendly activity logging.',
        'Implemented concurrency-safe ticket handling via record-locking on ticket detail to prevent conflicting edits during analyst collaboration.',
        'Delivered Report management (Report/Type/Template) with publish/unpublish flows, timezone & language-aware formatting, and document export/conversion (HTML → PDF/Word).',
        'Developed Threat Intelligence management for IOC operations (IP/CIDR validation, advanced filtering/search, CSV export, block/unblock with approval metadata) and linkage to related tickets.',
        'Built RBAC authorization using role-based Menu/SubTab permissions (C/R/U/D) and dynamic menu-tree generation with multi-language support.',
        'Implemented authentication & account security: JWT APIs, OTP (2FA) flows (QR setup/reset/verification), password rules, and session control/timeout middleware.',
        'Delivered dynamic dashboards: persisted panel configs, automatic dashboard menu creation/updates, and auto-assigned menu-role permissions for controlled access.',
        'Implemented operational modules: mail templates with in-use deletion protection, alarm sound/severity config, security news sources + crawling job triggers, forum knowledge base (attachments/comments), and handover shift/duty management.',
      ],
      tech: ['Django', 'Django REST Framework', 'SimpleJWT', 'Celery', 'Channels', 'PostgreSQL', 'Redis', 'drf-yasg', 'pandas'],
    },
    {
      company: 'Draco Fintech (draerp.vn)',
      role: 'Back-end Developer',
      location: 'Ho Chi Minh City',
      start: '2022-04',
      end: '2023-12',
      bullets: [
        'Team size: 7 | Tech stacks: Frappe, HeidiSQL, Python, VueJS, JS, HTML, CSS.',
        'Implemented projects: education system for Thai Son driving training center; warehouse management system for Multivac Vietnam; Wordpress API system connecting to ERP for Misumi.',
        'Analyzed ERP processing flow and business modules (accounting, stock, HR, education, CRM, e-commerce).',
        'Developed check-in feature based on IP and employee location (HR module).',
        'Developed REST APIs & webhooks for Wordpress–ERP integration; wrote test cases.',
        'Fixed bugs and customized features; designed UI templates (HTML/JS/CSS) with backend API integration.',
        'Integrated OCR invoice scanning using OpenCV + Tesseract; ensured stability during updates/releases.',
        'Built realtime features with socket.io (dashboards, chat); supported import/export, GitHub versioning.',
        'Integrated e-commerce platforms and payments (MoMo/banks) via realtime webhooks; built and maintained APIs.',
      ],
      tech: ['Frappe', 'Python', 'VueJS', 'socket.io', 'OpenCV', 'Tesseract'],
    },
    {
      company: 'University Project',
      role: 'Back-end Developer — Sales Website (PHP)',
      location: 'University',
      start: '2021-09',
      end: '2021-12',
      bullets: [
        'Position: dev | Team size: 2 | Tech stacks: PHP Laravel.',
        'Developed login/registration, product add/delete pages, and admin page.',
        'Wrote and optimized code; supported the team to complete other parts of the web.',
      ],
      tech: ['PHP', 'Laravel'],
    },
    {
      company: 'University Project',
      role: 'Back-end Developer — Coffee Sales Website',
      location: 'University',
      start: '2021-09',
      end: '2021-12',
      bullets: [
        'Position: dev | Team size: 2 | Tech stacks: NodeJs, MongoDB.',
        'Developed login/registration, purchase/order flows, and admin page.',
        'Wrote and optimized code; supported the team to complete other parts of the web.',
      ],
      tech: ['Node.js', 'MongoDB'],
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
      keyFeatures: [
        'Real-time event processing',
        'Websocket alert streaming',
        'Distributed camera ingestion',
        'OpenSearch analytics',
      ],
      systemArchitecture: ['Client', 'API Gateway', 'Django', 'Redis queue', 'Celery workers', 'PostgreSQL + OpenSearch'],
    },
    {
      id: 'ads',
      demoId: 'ads',
      name: 'ADS & SOP — Ticket, Exception & Workflow',
      description:
        'Security ticket lifecycle, incident-to-ticket flow, detection/exception rules, SOP workflow management and analytics for security operations.',
      stack: ['Django', 'Django REST Framework', 'Celery', 'PostgreSQL', 'Redis', 'React'],
      links: [],
      keyFeatures: [
        'Ticket lifecycle & SOP workflow',
        'Incident-to-ticket automation',
        'Detection & exception rules',
        'Risk-based analytics',
      ],
      systemArchitecture: ['Client (React)', 'Django REST API', 'Celery', 'Redis', 'PostgreSQL'],
    },
    {
      id: 'soc-scenario',
      demoId: 'soc',
      name: 'SOC Scenario — 3D Threat Demo',
      description:
        'Cinematic 3D demo: threat detection, incident response, AI hologram assistant. Run scenario from Command Console.',
      stack: ['React', 'Three.js', 'R3F'],
      links: [],
      keyFeatures: [
        'AI hologram assistant (Jarvis-style)',
        'Scenario timeline & Command Console',
        '3D cyber globe & threat visualization',
      ],
      systemArchitecture: ['React', 'R3F', 'Scenario Engine', 'Timeline'],
    },
    {
      id: 'erp',
      name: 'ERP Integration & Realtime Dashboards',
      description:
        'Customized ERP modules, REST APIs and webhooks for WordPress–ERP integration, realtime dashboards with socket.io.',
      stack: ['Frappe', 'Python', 'VueJS', 'socket.io'],
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
  onSwitchToLanding,
}: {
  data: Portfolio
  mailto: string
  phone: string | null
  year: number
  setDemoAppId: (id: DemoAppId | null) => void
  onSwitchToLanding: () => void
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
      <div className="modeToggle3d">
        <button
          type="button"
          className="modeToggle3d__btn"
          onClick={onSwitchToLanding}
          aria-label="Switch to quick view"
        >
          <span>Quick view</span>
        </button>
      </div>
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

  const [viewMode, setViewMode] = useState<'landing' | '3d'>(getInitialViewMode)
  const [hasVisited3d, setHasVisited3d] = useState(() => getInitialViewMode() === '3d')
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
    sessionStorage.setItem(VIEW_MODE_KEY, viewMode)
  }, [viewMode])

  const preloadStartedRef = useRef(false)
  const startPreload = useCallback(() => {
    if (preloadStartedRef.current || demoAppId) return
    preloadStartedRef.current = true
    import('./three/LabEnvironment').then((m) => m.preloadLabEnvironment())
    import('./three/LabScene')
  }, [demoAppId])

  useEffect(() => {
    if (!demoAppId) {
      const hasIdle = typeof window.requestIdleCallback === 'function'
      const id = hasIdle
        ? window.requestIdleCallback(startPreload, { timeout: 2500 })
        : window.setTimeout(startPreload, 2500)
      return () => {
        if (hasIdle) window.cancelIdleCallback(id)
        else clearTimeout(id)
      }
    }
  }, [demoAppId, startPreload])

  const embedded = isEmbedded()
  const demoActive = Boolean(demoAppId)
  const is3dVisible = viewMode === '3d' && !demoActive

  return (
    <DemoActivationProvider activeDemoId={demoAppId} onActivate={setDemoAppId}>
      {/* Portfolio layer — 3D view stays mounted after first visit so state is preserved on Quick view ↔ 3D Lab toggle */}
      <div className={`viewWrap viewPortfolio ${demoActive ? 'viewPortfolio--demoActive' : ''}`} key="portfolio">
        <div className="viewTransition">
          {viewMode === 'landing' && !demoActive && (
            <LandingPage
              data={data}
              year={year}
              onSwitchTo3D={() => {
                setHasVisited3d(true)
                setViewMode('3d')
              }}
              onPreload3D={startPreload}
            />
          )}
          {hasVisited3d && (
            <div
              className="view3dWrap"
              style={{
                visibility: is3dVisible ? 'visible' : 'hidden',
                position: 'fixed',
                inset: 0,
                zIndex: 10,
                pointerEvents: is3dVisible ? 'auto' : 'none',
              }}
            >
              <Portfolio3DView
                data={data}
                mailto={mailto}
                phone={phone}
                year={year}
                setDemoAppId={setDemoAppId}
                onSwitchToLanding={() => setViewMode('landing')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Demo overlay — rendered on top when demo is open; 3D view stays mounted underneath */}
      {demoActive && (
        <div
          className={`viewWrap viewDemo ${embedded ? 'viewDemo--embedded' : ''}`}
          key="demo"
          style={{ position: 'fixed', inset: 0, zIndex: 20 }}
        >
          <div className="viewTransition">
            <DemoActivationScene
              appId={demoAppId!}
              onExit={embedded ? () => {} : () => setDemoAppId(null)}
              embedded={embedded}
            />
          </div>
        </div>
      )}
    </DemoActivationProvider>
  )
}

export default App
