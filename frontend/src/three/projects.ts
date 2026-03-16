/**
 * Portfolio project data. Order maps to screen indices (first screen → projects[0], etc.).
 */
export type Project = {
  id: string
  title: string
  description: string
  image: string
  github: string | null
  demo: string | null
  stack?: string[]
}

export const PROJECTS: Project[] = [
  {
    id: 'guardianx',
    title: 'GuardianX — Surveillance Platform',
    description:
      'Camera monitoring dashboard, event & alert management, and device control for security operations.',
    image: '',
    github: null,
    demo: '/demo/guardianx',
    stack: ['Django', 'Celery', 'Channels', 'PostgreSQL', 'Redis', 'MinIO', 'OpenSearch'],
  },
  {
    id: 'ads-sop',
    title: 'ADS & SOP — Ticket & Workflow',
    description:
      'Security ticket lifecycle, incident-to-ticket flow, detection rules, SOP workflow management and analytics.',
    image: '',
    github: null,
    demo: '/demo/ads',
    stack: ['Django', 'Django REST Framework', 'Celery', 'PostgreSQL', 'Redis', 'React'],
  },
  {
    id: 'backend-apis',
    title: 'Backend APIs & Caching',
    description:
      'REST APIs with clear contracts, caching layers with TTL and selective invalidation, observability and tracing.',
    image: '',
    github: null,
    demo: null,
  },
]
