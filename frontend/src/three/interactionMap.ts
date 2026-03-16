import type { PortfolioSectionId } from './portfolioData'

export type HtmlPanelConfig = {
  /** Position relative to object (local space) */
  position: [number, number, number]
  /** Rotation in radians [x, y, z] for panel orientation */
  rotation?: [number, number, number]
}

export type InteractionMapEntry = {
  /** Regex or exact name to match mesh/object name */
  objectName: RegExp | string
  portfolioSection: PortfolioSectionId | 'project'
  /** When portfolioSection is 'project', which project index (0, 1, …) to open */
  projectIndex?: number
  /** Optional: use this instead of computed position */
  cameraTargetPosition?: [number, number, number]
  cameraLookAt?: [number, number, number]
  /** Optional: end point for floor navigation line when hovered */
  floorLineTo?: [number, number, number]
  /** Label shown on hover */
  label: string
  /** Html panel position/rotation relative to object (e.g. table = horizontal) */
  htmlPanel?: HtmlPanelConfig
}

/**
 * Maps lab object names to portfolio sections and optional cinematic camera targets.
 * First matching entry wins. Use objectName as string for exact match or RegExp for pattern.
 */
/** Default Html panel: vertical, in front of object. */
const DEFAULT_PANEL: HtmlPanelConfig = {
  position: [0, 0, 0.45],
}

/** Hologram table: horizontal surface, panel floats above. */
const TABLE_PANEL: HtmlPanelConfig = {
  position: [0, 0.45, 0],
  rotation: [-Math.PI / 2, 0, 0],
}

export const INTERACTION_MAP: InteractionMapEntry[] = [
  { objectName: /skills_reactor/i, portfolioSection: 'skills', label: 'Skills', htmlPanel: DEFAULT_PANEL },
  { objectName: /projects_lab/i, portfolioSection: 'project', projectIndex: 0, label: 'Project showcase', htmlPanel: DEFAULT_PANEL },
  { objectName: /about_table/i, portfolioSection: 'about', label: 'About me', htmlPanel: TABLE_PANEL },
  { objectName: /projects_console/i, portfolioSection: 'project', projectIndex: 1, label: 'Project demo', htmlPanel: DEFAULT_PANEL },
  { objectName: /contact_door/i, portfolioSection: 'contact', label: 'Contact', htmlPanel: DEFAULT_PANEL },
  { objectName: /experience_server/i, portfolioSection: 'experience', label: 'Experience', htmlPanel: DEFAULT_PANEL },
  { objectName: /timeline_pipes/i, portfolioSection: 'experience', label: 'Career timeline', htmlPanel: DEFAULT_PANEL },
]

export function getInteractionEntry(name: string): InteractionMapEntry | undefined {
  const lower = name.toLowerCase()
  for (const entry of INTERACTION_MAP) {
    if (typeof entry.objectName === 'string') {
      if (lower.includes(entry.objectName.toLowerCase())) return entry
    } else if (entry.objectName.test(name)) {
      return entry
    }
  }
  return undefined
}

/** Get floor line end for navigation path from hover id (e.g. section-about, project-0). */
export function getFloorLineForHover(hoveredObjectId: string | null): [number, number, number] | null {
  if (!hoveredObjectId) return null
  const section = hoveredObjectId.startsWith('section-') ? hoveredObjectId.replace('section-', '') : null
  const isProject = hoveredObjectId.startsWith('project-')
  const entry = section
    ? INTERACTION_MAP.find((e) => e.portfolioSection === section)
    : isProject
      ? INTERACTION_MAP.find((e) => e.portfolioSection === 'project')
      : undefined
  return entry?.floorLineTo ?? null
}
