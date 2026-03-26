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
        role: 'Backend Engineer — Python Project',
        location: 'Ho Chi Minh City',
        start: '2025-06',
        end: null,
        bullets: [
          'Designed and maintained REST APIs with consistent contracts, pagination, and validation for production services.',
          'Designed and implemented DynamicSchema core (In/Out/Create/Update), including M2M handling and optimized bulk measurement loading.',
          'Built a Measurement framework (simple/range/dimensions) with unit conversion, user preferences, and standardized formatting/validation.',
          'Implemented caching & performance optimization (universal cache, hint registry, selective invalidation, warmup, TTL, herd protection).',
        ],
        tech: ['Django Ninja', 'Celery', 'Channels', 'PostgreSQL', 'Redis', 'MinIO', 'OpenSearch'],
      },
      {
        company: 'Gaion',
        role: 'Backend Engineer — Security Operations Platform',
        location: 'Ho Chi Minh City',
        start: '2024-04',
        end: '2025-05',
        bullets: [
          'Designed and implemented a secure backend platform for security operations management (tickets/SOP, rules, reports, threat intel, dashboards).',
          'Built full SOP Ticket incident workflow with audit-friendly activity logging and concurrency-safe record-locking.',
          'Implemented authentication & account security: JWT APIs, OTP (2FA) flows, password rules, and session control/timeout middleware.',
        ],
        tech: ['Django', 'DRF', 'SimpleJWT', 'Celery', 'PostgreSQL', 'Redis'],
      },
      {
        company: 'Draco Fintech (draerp.vn)',
        role: 'Back-end Developer',
        location: 'Ho Chi Minh City',
        start: '2022-04',
        end: '2023-12',
        bullets: [
          'Implemented projects: education system, warehouse management, Wordpress API–ERP integration.',
          'Developed REST APIs & webhooks for Wordpress–ERP integration; integrated OCR invoice scanning (OpenCV + Tesseract).',
          'Built realtime features with socket.io (dashboards, chat); integrated e-commerce platforms and payments (MoMo/banks) via webhooks.',
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
