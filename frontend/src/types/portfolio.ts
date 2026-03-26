export type Portfolio = {
  profile: {
    name: string
    title: string
    location: string
    email: string
    phone?: string
    dob?: string
    summary: string
    github?: string
    linkedin?: string
  }
  highlights: string[]
  skills: {
    core: string[]
    platform: string[]
    practice: string[]
  }
  experience: Array<{
    company: string
    role: string
    location: string
    start: string
    end: string | null
    bullets: string[]
    tech: string[]
  }>
  education: Array<{
    school: string
    major: string
    start: string
    end: string
    details: string[]
  }>
  projects: Array<{
    id: string
    name: string
    description: string
    stack: string[]
    links: Array<{ label: string; url: string }>
    demoId?: 'guardianx' | 'ads' | 'soc' | 'guardianx-3d'
    keyFeatures?: string[]
    systemArchitecture?: string[]
  }>
  interests: string[]
  certificates: Array<{
    name: string
    issuer: string
    date: string
  }>
}

