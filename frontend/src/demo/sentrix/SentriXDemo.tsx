import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'

type Role = 'Operator' | 'Admin'

type SopStatus = 'Draft' | 'Active' | 'Disabled'
type WorkflowStatus = 'Pending' | 'Running' | 'Completed' | 'Failed'

type SopRow = {
  id: string
  name: string
  triggerEvent: string
  steps: string[]
  createdAt: string
  createdBy: string
  status: SopStatus
  lastRun?: { status: WorkflowStatus; at: string }
}

type ScreenId = 'sop' | 'analytics' | 'settings'

function nowIso(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function nextId(prefix: string): string {
  const n = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${n}`
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function seeded(n: number): number {
  const x = Math.sin(n) * 10000
  return x - Math.floor(x)
}

export function SentriXDemo(props: { onExit: () => void }): ReactNode {
  const { onExit } = props

  const [role, setRole] = useState<Role>('Operator')
  const [screen, setScreen] = useState<ScreenId>('sop')

  const [filterEventType, setFilterEventType] = useState<string>('All')
  const [filterStatus, setFilterStatus] = useState<SopStatus | 'All'>('All')
  const [searchSop, setSearchSop] = useState('')

  const [analyticsCamera, setAnalyticsCamera] = useState<string>('All')
  const [analyticsLocation, setAnalyticsLocation] = useState<string>('All')
  const [analyticsRange, setAnalyticsRange] = useState<'7d' | '30d' | '90d'>('30d')

  const [sops, setSops] = useState<SopRow[]>(() => [
    {
      id: 'SOP-2001',
      name: 'Unauthorized access response',
      triggerEvent: 'Access violation',
      steps: ['Validate alert', 'Notify operator', 'Lock down zone', 'Write incident report'],
      createdAt: nowIso(),
      createdBy: 'Admin',
      status: 'Active',
      lastRun: { status: 'Completed', at: nowIso() },
    },
    {
      id: 'SOP-2002',
      name: 'Loitering investigation',
      triggerEvent: 'Loitering',
      steps: ['Review snapshot', 'Check live stream', 'Escalate if repeated'],
      createdAt: nowIso(),
      createdBy: 'Admin',
      status: 'Draft',
    },
  ])

  const [sopForm, setSopForm] = useState<null | { mode: 'new' | 'edit'; sopId?: string }>(null)
  const [executionLog, setExecutionLog] = useState<string[]>([])
  const [simulateEventType, setSimulateEventType] = useState<string>('Access violation')

  const eventTypes = useMemo(() => {
    const all = new Set<string>()
    sops.forEach((s) => all.add(s.triggerEvent))
    return ['All', ...Array.from(all)]
  }, [sops])

  const filteredSops = useMemo(() => {
    return sops
      .filter((s) => (filterEventType === 'All' ? true : s.triggerEvent === filterEventType))
      .filter((s) => (filterStatus === 'All' ? true : s.status === filterStatus))
      .filter((s) => {
        const q = searchSop.trim().toLowerCase()
        if (!q) return true
        return `${s.id} ${s.name} ${s.triggerEvent}`.toLowerCase().includes(q)
      })
  }, [sops, filterEventType, filterStatus, searchSop])

  const canAdmin = role === 'Admin'

  const addLog = (msg: string) => setExecutionLog((l) => [`${nowIso()} · ${msg}`, ...l].slice(0, 12))

  const activateSop = (sopId: string) => {
    setSops((prev) => prev.map((s) => (s.id === sopId ? { ...s, status: 'Active' } : s)))
    addLog(`Activated ${sopId}`)
  }

  const disableSop = (sopId: string) => {
    setSops((prev) => prev.map((s) => (s.id === sopId ? { ...s, status: 'Disabled' } : s)))
    addLog(`Disabled ${sopId}`)
  }

  const deleteSop = (sopId: string) => {
    setSops((prev) => prev.filter((s) => s.id !== sopId))
    addLog(`Deleted ${sopId}`)
  }

  const duplicateSop = (sopId: string) => {
    const src = sops.find((s) => s.id === sopId)
    if (!src) return
    const id = nextId('SOP')
    setSops((prev) => [
      { ...src, id, name: `${src.name} (copy)`, status: 'Draft', createdAt: nowIso(), createdBy: role },
      ...prev,
    ])
    addLog(`Duplicated ${sopId} → ${id}`)
  }

  const simulateExecution = () => {
    const active = sops.find((s) => s.status === 'Active' && s.triggerEvent === simulateEventType) ?? null
    addLog(`Event detected: ${simulateEventType}`)
    if (!active) {
      addLog('No active SOP matched the event.')
      return
    }

    addLog(`SOP engine matched: ${active.id}`)
    setSops((prev) =>
      prev.map((s) =>
        s.id === active.id ? { ...s, lastRun: { status: 'Pending', at: nowIso() } } : s,
      ),
    )

    setTimeout(() => {
      setSops((prev) =>
        prev.map((s) =>
          s.id === active.id ? { ...s, lastRun: { status: 'Running', at: nowIso() } } : s,
        ),
      )
      addLog(`Workflow running: ${active.id}`)
    }, 350)

    setTimeout(() => {
      const ok = seeded(active.id.length + simulateEventType.length + Date.now()) > 0.2
      const status: WorkflowStatus = ok ? 'Completed' : 'Failed'
      setSops((prev) =>
        prev.map((s) =>
          s.id === active.id ? { ...s, lastRun: { status, at: nowIso() } } : s,
        ),
      )
      addLog(`Workflow ${status.toLowerCase()}: ${active.id}`)
      addLog('Notification sent to operator.')
    }, 1200)
  }

  const title =
    screen === 'sop' ? 'SOP Workflow Management' : screen === 'analytics' ? 'Surveillance Analytics' : 'Settings'

  const analyticsSeed = useMemo(() => {
    const base =
      (analyticsCamera === 'All' ? 1 : analyticsCamera.length) *
        (analyticsLocation === 'All' ? 7 : analyticsLocation.length) +
      (analyticsRange === '7d' ? 3 : analyticsRange === '30d' ? 5 : 9)
    return base
  }, [analyticsCamera, analyticsLocation, analyticsRange])

  const timeline = useMemo(() => {
    const len = analyticsRange === '7d' ? 7 : analyticsRange === '30d' ? 12 : 18
    return Array.from({ length: len }, (_, i) => Math.floor(30 + seeded(analyticsSeed * 10 + i) * 70))
  }, [analyticsSeed, analyticsRange])

  const distribution = useMemo(() => {
    const base = Math.floor(50 + seeded(analyticsSeed * 11) * 60)
    return [
      { name: 'Loitering', value: Math.floor(base * 0.35) },
      { name: 'Access violation', value: Math.floor(base * 0.28) },
      { name: 'Safety', value: Math.floor(base * 0.22) },
      { name: 'Other', value: Math.floor(base * 0.15) },
    ]
  }, [analyticsSeed])

  const heat = useMemo(() => {
    const w = 14
    const h = 7
    return Array.from({ length: w * h }, (_, i) => seeded(analyticsSeed * 30 + i))
  }, [analyticsSeed])

  const totalCameras = useMemo(() => 24 + Math.floor(seeded(analyticsSeed * 41) * 8), [analyticsSeed])
  const activeStreams = useMemo(() => 12 + Math.floor(seeded(analyticsSeed * 42) * 10), [analyticsSeed])
  const eventsToday = useMemo(() => 18 + Math.floor(seeded(analyticsSeed * 43) * 30), [analyticsSeed])
  const criticalAlerts = useMemo(() => 1 + Math.floor(seeded(analyticsSeed * 44) * 6), [analyticsSeed])

  return (
    <div className="demoRoot">
      <div className="demoShell">
        <aside className="demoSidebar">
          <div className="demoBrand">
            <span className="demoBrandMark" />
            <div>
              <div className="demoBrandName">SentriX</div>
              <div className="demoBrandMeta">SOP & analytics</div>
            </div>
          </div>

          <nav className="demoNav">
            <button className={cx('demoNavItem', screen === 'sop' && 'demoNavItemActive')} onClick={() => setScreen('sop')}>
              SOP
            </button>
            <button className={cx('demoNavItem', screen === 'analytics' && 'demoNavItemActive')} onClick={() => setScreen('analytics')}>
              Analytics
            </button>
            <button className={cx('demoNavItem', screen === 'settings' && 'demoNavItemActive')} onClick={() => setScreen('settings')}>
              Settings
            </button>
          </nav>

          <button className="demoExit" onClick={onExit}>
            ← Back to portfolio
          </button>
        </aside>

        <main className="demoMain">
          <header className="demoTopbar">
            <div className="demoTopbarLeft">
              <div className="demoTitle">{title}</div>
              <div className="demoSubtitle">System: SentriX</div>
            </div>
            <div className="demoTopbarRight">
              <label className="demoField">
                <span>Role</span>
                <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  <option value="Operator">Operator</option>
                  <option value="Admin">Admin</option>
                </select>
              </label>
            </div>
          </header>

          {screen === 'sop' ? (
            <section className="demoPanel">
              <div className="demoToolbar">
                <div className="demoFilters">
                  <label className="demoField">
                    <span>Event type</span>
                    <select value={filterEventType} onChange={(e) => setFilterEventType(e.target.value)}>
                      {eventTypes.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="demoField">
                    <span>Status</span>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as SopStatus | 'All')}>
                      <option value="All">All</option>
                      <option value="Draft">Draft</option>
                      <option value="Active">Active</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  </label>
                  <label className="demoField demoSearch">
                    <span>Search</span>
                    <input value={searchSop} onChange={(e) => setSearchSop(e.target.value)} placeholder="Search SOP…" />
                  </label>
                </div>
                <div className="demoActions">
                  <button className="demoBtn" onClick={() => setSopForm({ mode: 'new' })} disabled={!canAdmin}>
                    New SOP
                  </button>
                  <button
                    className="demoBtn"
                    onClick={() => {
                      const id = nextId('SOP')
                      setSops((prev) => [
                        {
                          id,
                          name: 'Imported template',
                          triggerEvent: 'Loitering',
                          steps: ['Review', 'Escalate', 'Close'],
                          createdAt: nowIso(),
                          createdBy: role,
                          status: 'Draft',
                        },
                        ...prev,
                      ])
                      addLog(`Imported template → ${id}`)
                    }}
                    disabled={!canAdmin}
                  >
                    Import
                  </button>
                  <button className="demoBtn" onClick={() => setSops((p) => [...p])}>
                    Refresh
                  </button>
                </div>
              </div>

              <div className="demoTableWrap">
                <table className="demoTable">
                  <thead>
                    <tr>
                      <th>SOP ID</th>
                      <th>Name</th>
                      <th>Trigger event</th>
                      <th>Steps</th>
                      <th>Created time</th>
                      <th>Created by</th>
                      <th>Status</th>
                      <th>Last run</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSops.map((s) => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td>{s.name}</td>
                        <td>{s.triggerEvent}</td>
                        <td>{s.steps.length}</td>
                        <td>{s.createdAt}</td>
                        <td>{s.createdBy}</td>
                        <td>
                          <span className={cx('badge', `badgeSop${s.status}`)}>{s.status}</span>
                        </td>
                        <td>
                          {s.lastRun ? (
                            <span className={cx('badge', `badgeRun${s.lastRun.status}`)}>{s.lastRun.status}</span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>
                          <div className="rowActions">
                            <button className="miniBtn" onClick={() => setSopForm({ mode: 'edit', sopId: s.id })} disabled={!canAdmin}>
                              Edit
                            </button>
                            <button className="miniBtn" onClick={() => duplicateSop(s.id)} disabled={!canAdmin}>
                              Duplicate
                            </button>
                            {s.status !== 'Active' ? (
                              <button className="miniBtn" onClick={() => activateSop(s.id)} disabled={!canAdmin}>
                                Activate
                              </button>
                            ) : (
                              <button className="miniBtn" onClick={() => disableSop(s.id)} disabled={!canAdmin}>
                                Disable
                              </button>
                            )}
                            <button className="miniBtn" onClick={() => deleteSop(s.id)} disabled={!canAdmin}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="demoHintRow">
                <div className="demoHint">SOP execution demo</div>
                <div className="demoActions">
                  <label className="demoField">
                    <span>Event type</span>
                    <select value={simulateEventType} onChange={(e) => setSimulateEventType(e.target.value)}>
                      {eventTypes.filter((t) => t !== 'All').map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                      <option value="Loitering">Loitering</option>
                      <option value="Access violation">Access violation</option>
                    </select>
                  </label>
                  <button className="demoBtn" onClick={simulateExecution}>
                    Simulate event
                  </button>
                </div>
              </div>

              <div className="logPanel">
                <div className="logTitle">Execution log</div>
                <ul className="logList">
                  {executionLog.length ? executionLog.map((l, i) => <li key={`${l}-${i}`}>{l}</li>) : <li className="muted">No events yet.</li>}
                </ul>
              </div>

              <div className="demoHint">Role: {role}. New/Edit/Activate requires Admin.</div>
            </section>
          ) : null}

          {screen === 'analytics' ? (
            <section className="demoPanel">
              <div className="demoToolbar">
                <div className="demoFilters">
                  <label className="demoField">
                    <span>Camera</span>
                    <select value={analyticsCamera} onChange={(e) => setAnalyticsCamera(e.target.value)}>
                      <option value="All">All</option>
                      <option value="CAM-01">CAM-01</option>
                      <option value="CAM-02">CAM-02</option>
                      <option value="CAM-03">CAM-03</option>
                    </select>
                  </label>
                  <label className="demoField">
                    <span>Location</span>
                    <select value={analyticsLocation} onChange={(e) => setAnalyticsLocation(e.target.value)}>
                      <option value="All">All</option>
                      <option value="Warehouse A">Warehouse A</option>
                      <option value="Terminal 3">Terminal 3</option>
                      <option value="HQ">HQ</option>
                    </select>
                  </label>
                  <label className="demoField">
                    <span>Date range</span>
                    <select value={analyticsRange} onChange={(e) => setAnalyticsRange(e.target.value as '7d' | '30d' | '90d')}>
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                    </select>
                  </label>
                </div>
                <div className="demoActions">
                  <button className="demoBtn" onClick={() => void 0}>
                    Export report
                  </button>
                  <button className="demoBtn" onClick={() => void 0}>
                    Refresh
                  </button>
                </div>
              </div>

              <div className="metricGrid">
                <Metric label="Total cameras" value={totalCameras} status={criticalAlerts >= 4 ? 'Warning' : 'Normal'} />
                <Metric label="Active streams" value={activeStreams} status={activeStreams < 14 ? 'Warning' : 'Normal'} />
                <Metric label="Total events today" value={eventsToday} status={eventsToday > 40 ? 'Warning' : 'Normal'} />
                <Metric label="Critical alerts" value={criticalAlerts} status={criticalAlerts >= 4 ? 'Critical' : criticalAlerts >= 2 ? 'Warning' : 'Normal'} />
              </div>

              <div className="chartGrid">
                <div className="chartCard">
                  <div className="chartTitle">Event timeline</div>
                  <TimelineChart values={timeline} />
                </div>
                <div className="chartCard">
                  <div className="chartTitle">Distribution by type</div>
                  <BarChart items={distribution} />
                </div>
                <div className="chartCard chartCardWide">
                  <div className="chartTitle">Camera activity heatmap</div>
                  <Heatmap values={heat} />
                </div>
              </div>
              <div className="demoHint">Filters update charts instantly (mock data).</div>
            </section>
          ) : null}

          {screen === 'settings' ? (
            <section className="demoPanel">
              <div className="demoEmpty">
                <div className="demoEmptyTitle">Settings</div>
                <div className="demoEmptyMeta">This screen is not part of the current demo scope.</div>
              </div>
            </section>
          ) : null}
        </main>
      </div>

      {sopForm ? (
        <SopModal
          mode={sopForm.mode}
          role={role}
          sops={sops}
          sopId={sopForm.sopId}
          onClose={() => setSopForm(null)}
          onSave={(row) => {
            if (!canAdmin) return
            if (sopForm.mode === 'new') {
              setSops((prev) => [row, ...prev])
              addLog(`Created ${row.id}`)
            } else {
              setSops((prev) => prev.map((s) => (s.id === row.id ? row : s)))
              addLog(`Updated ${row.id}`)
            }
            setSopForm(null)
          }}
        />
      ) : null}
    </div>
  )
}

function Metric(props: { label: string; value: number; status: 'Normal' | 'Warning' | 'Critical' }): ReactNode {
  const { label, value, status } = props
  return (
    <div className="metricCard">
      <div className="metricLabel">{label}</div>
      <div className="metricValue">{value}</div>
      <div className={cx('metricStatus', status === 'Critical' && 'metricCritical', status === 'Warning' && 'metricWarning')}>
        {status}
      </div>
    </div>
  )
}

function TimelineChart(props: { values: number[] }): ReactNode {
  const { values } = props
  const w = 420
  const h = 120
  const max = Math.max(...values, 1)
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * (w - 20) + 10
      const y = h - (v / max) * (h - 20) - 10
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chartSvg" aria-label="Timeline chart">
      <polyline points={pts} fill="none" stroke="rgba(96,165,250,0.9)" strokeWidth="2" />
      {values.map((v, i) => {
        const x = (i / Math.max(values.length - 1, 1)) * (w - 20) + 10
        const y = h - (v / max) * (h - 20) - 10
        return <circle key={i} cx={x} cy={y} r="2.4" fill="rgba(96,165,250,0.95)" />
      })}
    </svg>
  )
}

function BarChart(props: { items: Array<{ name: string; value: number }> }): ReactNode {
  const { items } = props
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="barList" aria-label="Distribution chart">
      {items.map((it) => (
        <div key={it.name} className="barRow2">
          <div className="barName">{it.name}</div>
          <div className="barTrack2">
            <div className="barFill2" style={{ width: `${(it.value / max) * 100}%` }} />
          </div>
          <div className="barVal">{it.value}</div>
        </div>
      ))}
    </div>
  )
}

function Heatmap(props: { values: number[] }): ReactNode {
  const { values } = props
  return (
    <div className="heatGrid" aria-label="Heatmap">
      {values.map((v, i) => (
        <div
          key={i}
          className="heatCell"
          style={{ opacity: 0.25 + v * 0.75 }}
          title={`Activity ${(v * 100).toFixed(0)}%`}
        />
      ))}
    </div>
  )
}

function SopModal(props: {
  mode: 'new' | 'edit'
  role: Role
  sops: SopRow[]
  sopId?: string
  onClose: () => void
  onSave: (row: SopRow) => void
}): ReactNode {
  const { mode, role, sops, sopId, onClose, onSave } = props
  const canAdmin = role === 'Admin'
  const editing = mode === 'edit' ? sops.find((s) => s.id === sopId) ?? null : null

  const [name, setName] = useState(editing?.name ?? '')
  const [triggerEvent, setTriggerEvent] = useState(editing?.triggerEvent ?? 'Loitering')
  const [steps, setSteps] = useState((editing?.steps ?? ['Validate', 'Notify operator']).join('\n'))
  const [status, setStatus] = useState<SopStatus>(editing?.status ?? 'Draft')

  const submit = () => {
    if (!canAdmin) return
    const parsed = steps
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const id = mode === 'new' ? nextId('SOP') : editing?.id ?? nextId('SOP')
    onSave({
      id,
      name: name.trim() || 'Untitled SOP',
      triggerEvent,
      steps: parsed.length ? parsed : ['Step 1'],
      createdAt: editing?.createdAt ?? nowIso(),
      createdBy: editing?.createdBy ?? role,
      status,
      lastRun: editing?.lastRun,
    })
  }

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalCard">
        <div className="modalHeader">
          <div>
            <div className="modalTitle">{mode === 'new' ? 'New SOP' : 'Edit SOP'}</div>
            <div className="modalMeta">Role: {role}</div>
          </div>
          <div className="modalActions">
            <button className="demoBtn" onClick={submit} disabled={!canAdmin}>
              Save
            </button>
            <button className="demoBtn demoBtnGhost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
        <div className="modalBody">
          <div className="formGrid">
            <label className="demoField">
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="SOP name…" />
            </label>
            <label className="demoField">
              <span>Trigger event</span>
              <input value={triggerEvent} onChange={(e) => setTriggerEvent(e.target.value)} />
            </label>
            <label className="demoField">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as SopStatus)}>
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
              </select>
            </label>
            <label className="demoField" style={{ gridColumn: '1 / -1' }}>
              <span>Steps (one per line)</span>
              <textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={6} />
            </label>
          </div>
          {!canAdmin ? <div className="demoHint">Switch role to Admin to edit SOPs.</div> : null}
        </div>
      </div>
    </div>
  )
}

