/**
 * Panel cố định giữa màn hình khi focus vào object.
 * Không gắn với object trong 3D — luôn hiển thị ở center để dễ đọc.
 * Responsive: mobile có nút đóng + tap outside (không có ESC).
 */
import { memo, useMemo, useCallback } from 'react'
import { useLabScene } from './LabSceneContext'
import { useDemoActivation } from '../demo/DemoActivation'
import type { DemoAppId } from '../demo/DemoApp'
import { portfolio } from './portfolioData'
import { PROJECTS } from './projects'
import type {
  PortfolioSectionId,
  PortfolioSkills,
  PortfolioExperience,
  PortfolioContact,
} from './portfolioData'
import type { Project } from './projects'

function HoloFrame({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="focusedPanelFrame"
      style={{
        width: 'min(360px, calc(100vw - 24px))',
        maxWidth: 'calc(100vw - 24px)',
        borderRadius: 10,
        padding: '14px 14px 12px',
        color: '#bdf6ff',
        background: 'rgba(0, 255, 200, 0.08)',
        border: '1px solid rgba(0, 255, 200, 0.4)',
        boxShadow:
          '0 0 34px rgba(0,229,255,0.18), inset 0 0 44px rgba(0,229,255,0.04)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        letterSpacing: 0.2,
        userSelect: 'none',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          fontSize: 12,
          opacity: 0.9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: 'rgba(0,229,255,0.9)',
              boxShadow: '0 0 16px rgba(0,229,255,0.55)',
            }}
          />
          <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="focusedPanelHint" style={{ opacity: 0.55 }}>
            ESC to exit
          </span>
          <button
            type="button"
            className="focusedPanelClose"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 36,
              height: 36,
              minWidth: 36,
              minHeight: 36,
              padding: 0,
              border: '1px solid rgba(0,229,255,0.35)',
              borderRadius: 8,
              background: 'rgba(0,229,255,0.08)',
              color: '#bdf6ff',
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 10,
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.03) 2px, rgba(0,229,255,0.03) 4px)',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}

function getDemoAppIdFromPath(path: string | null): DemoAppId | null {
  const m = path?.match(/\/demo\/(guardianx|ads|soc|guardianx-3d)$/)
  return (m?.[1] as DemoAppId) ?? null
}

function usePanelBody(
  selectedSection: PortfolioSectionId | null,
  selectedProject: Project | null
): React.ReactNode {
  const { activateDemo, preloadDemo } = useDemoActivation()

  return useMemo(() => {
    if (selectedProject) {
      const projectsWithDemo = PROJECTS.filter((p) => p.demo)
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13, lineHeight: 1.45 }}>
          {projectsWithDemo.map((proj) => {
            const demoAppId = getDemoAppIdFromPath(proj.demo)
            return (
            <div
              key={proj.id}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgba(0,229,255,0.2)',
                background: 'rgba(0,20,35,0.25)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{proj.title}</div>
              <div style={{ opacity: 0.9, marginBottom: 10 }}>{proj.description}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {(proj.stack ?? []).slice(0, 10).map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      padding: '3px 8px',
                      borderRadius: 999,
                      border: '1px solid rgba(0,255,180,0.22)',
                      color: '#a9ffe6',
                      background: 'rgba(0,255,180,0.06)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {proj.demo && demoAppId ? (
                  <button
                    type="button"
                    onClick={() => activateDemo(demoAppId)}
                    onMouseEnter={() => preloadDemo(demoAppId)}
                    style={{
                      fontSize: 12,
                      padding: '7px 10px',
                      borderRadius: 8,
                      background: 'rgba(0,229,255,0.12)',
                      border: '1px solid rgba(0,229,255,0.34)',
                      color: '#c8fbff',
                      cursor: 'pointer',
                    }}
                  >
                    Open demo
                  </button>
                ) : proj.demo ? (
                  <a
                    href={proj.demo}
                    style={{
                      fontSize: 12,
                      padding: '7px 10px',
                      borderRadius: 8,
                      background: 'rgba(0,229,255,0.12)',
                      border: '1px solid rgba(0,229,255,0.34)',
                      color: '#c8fbff',
                      textDecoration: 'none',
                    }}
                  >
                    Open demo
                  </a>
                ) : null}
                {proj.github ? (
                  <a
                    href={proj.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 12,
                      padding: '7px 10px',
                      borderRadius: 8,
                      background: 'rgba(0,255,180,0.08)',
                      border: '1px solid rgba(0,255,180,0.22)',
                      color: '#a9ffe6',
                      textDecoration: 'none',
                    }}
                  >
                    GitHub
                  </a>
                ) : null}
              </div>
            </div>
            )
          })}
        </div>
      )
    }

    if (!selectedSection) return null
    const section = portfolio[selectedSection]
    if (!section) return null

    if (selectedSection === 'skills') {
      const skillsSection = section as PortfolioSkills
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {skillsSection.items.slice(0, 18).map((s) => (
            <span
              key={s}
              style={{
                fontSize: 11,
                padding: '5px 10px',
                borderRadius: 999,
                color: '#b6fff1',
                border: '1px solid rgba(0,255,180,0.22)',
                background: 'rgba(0,255,180,0.07)',
                boxShadow: '0 0 18px rgba(0,255,180,0.08)',
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )
    }

    if (selectedSection === 'about' && 'text' in section) {
      return (
        <div style={{ fontSize: 13, lineHeight: 1.55, opacity: 0.92 }}>
          {section.text}
        </div>
      )
    }

    if (selectedSection === 'experience') {
      const expSection = section as PortfolioExperience
      return (
        <div style={{ display: 'grid', gap: 10 }}>
          {expSection.items.slice(0, 3).map((job, i) => (
            <div
              key={`${job.company}-${i}`}
              style={{
                padding: '10px 10px',
                borderRadius: 10,
                border: '1px solid rgba(0,229,255,0.18)',
                background: 'rgba(0,20,35,0.35)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 12 }}>{job.role}</div>
              <div style={{ opacity: 0.8, fontSize: 11, marginTop: 2 }}>
                {job.company} · {job.start}
                {job.end ? ` – ${job.end}` : ' – present'}
              </div>
              <div style={{ opacity: 0.9, fontSize: 12, marginTop: 8 }}>
                {job.bullets[0] ?? ''}
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (selectedSection === 'contact') {
      const contactSection = section as PortfolioContact
      return (
        <div style={{ fontSize: 13, lineHeight: 1.55 }}>
          <div style={{ marginBottom: 10 }}>
            <a
              href={`mailto:${contactSection.email}`}
              style={{ color: '#c8fbff', textDecoration: 'none' }}
            >
              {contactSection.email}
            </a>
          </div>
          {contactSection.github ? (
            <div style={{ marginBottom: 6 }}>
              <a
                href={contactSection.github}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#a9ffe6', textDecoration: 'none' }}
              >
                GitHub
              </a>
            </div>
          ) : null}
          {contactSection.linkedin ? (
            <div>
              <a
                href={contactSection.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#a9ffe6', textDecoration: 'none' }}
              >
                LinkedIn
              </a>
            </div>
          ) : null}
        </div>
      )
    }

    return null
  }, [selectedProject, selectedSection])
}

function FocusedObjectPanelInner() {
  const { selectedSection, selectedProject, focusedMesh, focusAnimationComplete, resetInteraction } = useLabScene()
  const active = (selectedSection != null || selectedProject != null) && focusAnimationComplete

  const body = usePanelBody(selectedSection, selectedProject)
  const handleClose = useCallback(() => resetInteraction(), [resetInteraction])

  if (!active || !focusedMesh || !body) return null

  const title = selectedProject
    ? 'Projects'
    : selectedSection
      ? portfolio[selectedSection]?.title ?? selectedSection
      : ''

  return (
    <div
      className="focusedPanelOverlay"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        pointerEvents: 'auto',
        padding: 12,
      }}
      onClick={handleClose}
    >
      <div
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <HoloFrame title={title} onClose={handleClose}>
          {body}
        </HoloFrame>
      </div>
    </div>
  )
}

export const FocusedObjectPanel = memo(FocusedObjectPanelInner)
