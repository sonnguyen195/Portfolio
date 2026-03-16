/**
 * Portfolio section content for the lab navigation overlay.
 */

export type PortfolioSectionId = 'about' | 'skills' | 'projects' | 'experience' | 'contact'

export type PortfolioAbout = {
  title: string
  text: string
}

export type PortfolioSkills = {
  title: string
  items: string[]
}

export type PortfolioProject = {
  id: string
  name: string
  description: string
  stack: string[]
  demo?: string
  github?: string
}

export type PortfolioExperienceItem = {
  company: string
  role: string
  location: string
  start: string
  end: string | null
  bullets: string[]
  tech: string[]
}

export type PortfolioExperience = {
  title: string
  items: PortfolioExperienceItem[]
}

export type PortfolioContact = {
  title: string
  email: string
  phone?: string
  github?: string
  linkedin?: string
}

export type PortfolioData = {
  about: PortfolioAbout
  skills: PortfolioSkills
  projects: { title: string; items: PortfolioProject[] }
  experience: PortfolioExperience
  contact: PortfolioContact
}

export const portfolio: PortfolioData = {
  about: {
    title: 'About Me',
    text: 'Backend Engineer (Python) with 4+ years of experience building production-grade backend systems, REST APIs and realtime platforms. Strong in system design and platform integration (PostgreSQL, Redis, MinIO, OpenSearch) with a focus on performance, observability and maintainable architecture.',
  },
  skills: {
    title: 'Skills',
    items: [
      'Python',
      'Django',
      'Django REST Framework',
      'Django Ninja',
      'PostgreSQL',
      'Redis',
      'MinIO',
      'OpenSearch',
      'Celery',
      'Django Channels',
      'System design',
      'REST API design',
      'Performance & caching',
      'Observability',
    ],
  },
  projects: {
    title: 'Projects',
    items: [
      {
        id: 'guardianx',
        name: 'GuardianX — Surveillance Platform',
        description:
          'Camera monitoring dashboard, event & alert management, and device control for security operations.',
        stack: ['Django', 'Celery', 'Channels', 'PostgreSQL', 'Redis', 'MinIO', 'OpenSearch'],
        demo: '/demo/guardianx',
      },
      {
        id: 'ads-sop',
        name: 'ADS & SOP — Ticket & Workflow',
        description:
          'Security ticket lifecycle, incident-to-ticket flow, detection rules, SOP workflow management and analytics.',
        stack: ['Django', 'DRF', 'Celery', 'PostgreSQL', 'Redis', 'React'],
        demo: '/demo/ads',
      },
      {
        id: 'backend-apis',
        name: 'Backend APIs & Caching',
        description:
          'REST APIs with clear contracts, caching layers with TTL and selective invalidation, observability and tracing.',
        stack: ['Python', 'Django Ninja', 'PostgreSQL', 'Redis'],
      },
    ],
  },
  experience: {
    title: 'Experience',
    items: [
      {
        company: 'Gaion',
        role: 'Backend Engineer — GAION (Python Project)',
        location: 'Ho Chi Minh City',
        start: '2025-06',
        end: null,
        bullets: [
          'Designed DynamicSchema core (In/Out/Create/Update) with M2M support and optimized bulk loading.',
          'Built a Measurement framework with unit conversion and standardized validation/formatting.',
          'Reduced latency on heavy endpoints using universal cache with selective invalidation and herd protection.',
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
          'Hardened authentication with JWT, OTP 2FA, password rules and session control.',
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
  },
  contact: {
    title: 'Contact',
    email: 'sonson195.sn@gmail.com',
    phone: '0384860120',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
}
