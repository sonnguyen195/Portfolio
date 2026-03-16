import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { DemoTabBar } from './DemoTabBar'

type Role = 'Operator' | 'Admin'

type CameraStatus = 'Idle' | 'Live' | 'Disconnected' | 'Maintenance'
type AlertStatus = 'Normal' | 'Alert' | 'Critical' | 'Resolved'

type EventStatus = 'New' | 'Investigating' | 'Resolved' | 'Closed'
type Severity = 'Low' | 'Medium' | 'High' | 'Critical'

type Camera = {
  id: string
  name: string
  location: string
  status: CameraStatus
  alert: AlertStatus
  lastEvent: string
  lastEventAt: string
  muted: boolean
}

type EventRow = {
  id: string
  cameraId: string
  cameraName: string
  location: string
  eventType: string
  severity: Severity
  timestamp: string
  status: EventStatus
}

type DeviceStatus = 'Active' | 'On Mission' | 'Warning' | 'Inactive'
type Device = {
  id: string
  name: string // machine_001
  model: string // UD-H40
  mainType: 'Drone' | 'Robot'
  manufacturer: string
  imageUrl: string
  active: boolean
  inUse: boolean
  status: DeviceStatus
  lastSeen: string
  deviceId: string
  payload: string
  rtspUrl: string
  color: string
  linkedTerminal: string
  location: string
  note?: string
}

type TerminalStatus = 'Online' | 'Degraded' | 'Offline' | 'Maintenance'

type Terminal = {
  id: string
  name: string
  code: string
  status: TerminalStatus
  location: string
  devicesOnline: number
  devicesTotal: number
  lastSync: string
  note?: string
}

type RouteStatus = 'Draft' | 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'

type RoutePlan = {
  id: string
  name: string
  deviceId: string
  deviceName: string
  origin: string
  destination: string
  eta: string
  status: RouteStatus
  createdAt: string
}

type DeliveryPriority = 'Low' | 'Normal' | 'High'

type DeliveryStatus = 'Planned' | 'Dispatched' | 'In Transit' | 'Delivered' | 'Failed' | 'Cancelled'

type DeliveryJob = {
  id: string
  reference: string
  terminalFrom: string
  terminalTo: string
  deviceId: string
  deviceName: string
  priority: DeliveryPriority
  status: DeliveryStatus
  eta: string
  createdAt: string
}

// Match GuardianX backend: unverified_order, verified_order, select_route_processing, select_drone_processing, in_transit_processing, arrived_order, completed_order
type DeliveryOperationStatus =
  | 'Unverified'
  | 'Verified'
  | 'SelectRoute'
  | 'SelectDrone'
  | 'InTransit'
  | 'Arrived'
  | 'Completed'
  | 'Returned'
  | 'Cancelled'

type DeliveryOperationRow = {
  id: string
  orderCode: string
  createdAt: string
  origin: string
  destination: string
  sender: string
  recipient: string
  handler: string
  numPackages: number
  status: DeliveryOperationStatus
}

type PackageAttribute = {
  id: string
  name: string
  value: string
}

type PackageRecord = PackageAttribute[]

// Match GuardianX: status__code and list/detail fields
type SurveillanceStatus = 'PendingApproval' | 'PendingDeviceCheck' | 'InProgress' | 'Completed' | 'Rejected'

type SurveillanceProfileRow = {
  id: string
  code: string
  name: string
  region: string
  missionType: 'Line' | 'Polygon'
  plannedStart: string
  plannedEnd: string
  drones: number
  status: SurveillanceStatus
  // List columns (SurveillanceProfileTabOptimized HistoryBehaviorColumns)
  purpose__name: string
  created_on: string
  start_time: string
  estimated_end_time: string
  total_distance: number
  estimated_time: number
  mission__log_collection: boolean
  mission__video_recording: boolean
  mission__video_analysis: boolean
  created_by_full_name: string
  operator_full_name: string
  // Detail (LeftDetailSurveyMission GENERAL_DATA)
  maximum_drones: number
  log_collection: boolean
  video_recording: boolean
  video_analysis: boolean
  capture_altitude: number
  note: string
  rejection_reason?: string
  // Chart mock
  chart_data: { waypointName: string; cruise_speed: number; operating_altitude: number; cumulativeDistance: number; order: number }[]
}

type SceneKind = 'parking' | 'gate' | 'warehouse' | 'dock' | 'office' | 'corridor'
type SceneObjectKind = 'vehicle' | 'person' | 'forklift' | 'pallet'
type BoxTone = 'none' | 'alert' | 'critical'

type SceneObject = {
  id: string
  kind: SceneObjectKind
  // normalized coordinates in [0..100] viewBox
  x: number
  y: number
  w: number
  h: number
  score: number
  boxedTone: BoxTone
}

type CameraSceneModel = {
  kind: SceneKind
  objects: SceneObject[]
}

type ScreenId =
  | 'camera-dashboard'
  | 'events'
  | 'devices'
  | 'drone-and-route'
  | 'terminal'
  | 'delivery'
  | 'delivery-ops'
  | 'missions'
  | 'settings'

function nowIso(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function captureVideoFrame(video: HTMLVideoElement): string | null {
  if (video.readyState < 2) return null
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(video, 0, 0)
  return canvas.toDataURL('image/png')
}

function hash01(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

function nextId(prefix: string): string {
  const n = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${n}`
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function sceneKindForCamera(camera: Camera): SceneKind {
  const t = `${camera.name} ${camera.location}`.toLowerCase()
  if (t.includes('parking')) return 'parking'
  if (t.includes('gate') || t.includes('checkpoint')) return 'gate'
  if (t.includes('loading') || t.includes('dock')) return 'dock'
  if (t.includes('warehouse')) return 'warehouse'
  if (t.includes('office') || t.includes('lobby') || t.includes('hq')) return 'office'
  return 'corridor'
}

function sceneForCamera(camera: Camera): CameraSceneModel {
  const kind = sceneKindForCamera(camera)
  const r = (key: string) => hash01(`${camera.id}:${key}`)

  const mk = (id: string, objKind: SceneObjectKind, x: number, y: number, w: number, h: number): SceneObject => {
    const w2 = clamp(w, 6, 96)
    const h2 = clamp(h, 6, 96)
    return {
      id,
      kind: objKind,
      x: clamp(x, 0, 100 - w2),
      y: clamp(y, 0, 100 - h2),
      w: w2,
      h: h2,
      score: 0.74 + r(`${id}:score`) * 0.22,
      boxedTone: 'none',
    }
  }

  const objects: SceneObject[] = []

  if (kind === 'parking') {
    const v1w = 26 + r('v1:w') * 9
    const v1h = 14 + r('v1:h') * 5
    const v1x = 6 + r('v1:x') * (100 - v1w - 12)
    const v1y = 60 + r('v1:y') * (34 - v1h)
    objects.push(mk('veh-1', 'vehicle', v1x, v1y, v1w, v1h))

    const v2w = 24 + r('v2:w') * 10
    const v2h = 13 + r('v2:h') * 6
    const v2x = 10 + r('v2:x') * (100 - v2w - 20)
    const v2y = 48 + r('v2:y') * (44 - v2h)
    objects.push(mk('veh-2', 'vehicle', v2x, v2y, v2w, v2h))

    const pw = 9 + r('p:w') * 5
    const ph = 18 + r('p:h') * 6
    const px = 14 + r('p:x') * (100 - pw - 28)
    const py = 40 + r('p:y') * (42 - ph)
    objects.push(mk('per-1', 'person', px, py, pw, ph))
  } else if (kind === 'gate') {
    const pw = 9 + r('p:w') * 4
    const ph = 18 + r('p:h') * 6
    const px = 12 + r('p:x') * (100 - pw - 24)
    const py = 44 + r('p:y') * (36 - ph)
    objects.push(mk('per-1', 'person', px, py, pw, ph))

    const v1w = 24 + r('v1:w') * 10
    const v1h = 13 + r('v1:h') * 6
    const v1x = 8 + r('v1:x') * (100 - v1w - 16)
    const v1y = 64 + r('v1:y') * (30 - v1h)
    objects.push(mk('veh-1', 'vehicle', v1x, v1y, v1w, v1h))
  } else if (kind === 'warehouse') {
    const fw = 22 + r('f:w') * 8
    const fh = 16 + r('f:h') * 6
    const fx = 10 + r('f:x') * (100 - fw - 20)
    const fy = 60 + r('f:y') * (34 - fh)
    objects.push(mk('fork-1', 'forklift', fx, fy, fw, fh))

    const pw = 13 + r('pal:w') * 6
    const ph = 10 + r('pal:h') * 6
    const px = 62 + r('pal:x') * (100 - pw - 70)
    const py = 66 + r('pal:y') * (28 - ph)
    objects.push(mk('pal-1', 'pallet', px, py, pw, ph))

    const opw = 9 + r('p:w') * 4
    const oph = 18 + r('p:h') * 5
    const opx = 18 + r('p:x') * (100 - opw - 36)
    const opy = 42 + r('p:y') * (46 - oph)
    objects.push(mk('per-1', 'person', opx, opy, opw, oph))
  } else if (kind === 'dock') {
    const v1w = 30 + r('t:w') * 10
    const v1h = 16 + r('t:h') * 8
    const v1x = 6 + r('t:x') * (100 - v1w - 12)
    const v1y = 60 + r('t:y') * (34 - v1h)
    objects.push(mk('veh-1', 'vehicle', v1x, v1y, v1w, v1h))

    const palw = 13 + r('pal:w') * 7
    const palh = 10 + r('pal:h') * 6
    const palx = 68 + r('pal:x') * (100 - palw - 76)
    const paly = 66 + r('pal:y') * (28 - palh)
    objects.push(mk('pal-1', 'pallet', palx, paly, palw, palh))

    const opw = 9 + r('p:w') * 4
    const oph = 18 + r('p:h') * 6
    const opx = 16 + r('p:x') * (100 - opw - 32)
    const opy = 44 + r('p:y') * (42 - oph)
    objects.push(mk('per-1', 'person', opx, opy, opw, oph))
  } else if (kind === 'office') {
    const opw = 9 + r('p:w') * 5
    const oph = 18 + r('p:h') * 6
    const opx = 20 + r('p:x') * (100 - opw - 40)
    const opy = 46 + r('p:y') * (40 - oph)
    objects.push(mk('per-1', 'person', opx, opy, opw, oph))

    const palw = 12 + r('pal:w') * 7
    const palh = 10 + r('pal:h') * 6
    const palx = 62 + r('pal:x') * (100 - palw - 70)
    const paly = 68 + r('pal:y') * (26 - palh)
    objects.push(mk('pal-1', 'pallet', palx, paly, palw, palh))
  } else {
    const opw = 9 + r('p:w') * 5
    const oph = 18 + r('p:h') * 7
    const opx = 24 + r('p:x') * (100 - opw - 48)
    const opy = 46 + r('p:y') * (42 - oph)
    objects.push(mk('per-1', 'person', opx, opy, opw, oph))

    const v1w = 22 + r('v1:w') * 10
    const v1h = 12 + r('v1:h') * 6
    const v1x = 10 + r('v1:x') * (100 - v1w - 20)
    const v1y = 68 + r('v1:y') * (28 - v1h)
    objects.push(mk('veh-1', 'vehicle', v1x, v1y, v1w, v1h))
  }

  const tone: BoxTone = camera.alert === 'Critical' ? 'critical' : camera.alert === 'Alert' ? 'alert' : 'none'
  if (tone !== 'none') {
    const t = camera.lastEvent.toLowerCase()
    const prefer: SceneObjectKind =
      t.includes('loiter') || t.includes('unauthorized') || t.includes('access') || t.includes('tamper')
        ? 'person'
        : kind === 'parking' || kind === 'dock'
          ? 'vehicle'
          : 'person'

    const primary = objects.find((o) => o.kind === prefer) ?? objects[0]
    if (primary) {
      primary.boxedTone = tone
      primary.score = 0.86 + r('det:primary') * 0.12
    }

    if (tone === 'critical') {
      const secondaryPrefer: SceneObjectKind = prefer === 'person' ? 'vehicle' : 'person'
      const secondary =
        objects.find((o) => o !== primary && o.kind === secondaryPrefer) ?? objects.find((o) => o !== primary) ?? null
      if (secondary) {
        secondary.boxedTone = tone
        secondary.score = 0.84 + r('det:secondary') * 0.13
      }
    }
  }

  return { kind, objects }
}

function CameraSceneSvg(props: {
  seed: string
  idSuffix?: string
  kind: SceneKind
  objects: SceneObject[]
  dim: boolean
  variant: 'card' | 'fullscreen'
}): ReactNode {
  const seedKey = props.seed.replace(/[^a-zA-Z0-9_-]/g, '')
  const suffix = (props.idSuffix ?? '0').replace(/[^a-zA-Z0-9_-]/g, '')
  const uid = `${seedKey}-${props.variant}-${suffix}`
  const bgId = `gx-bg-${uid}`
  const vigId = `gx-vig-${uid}`

  const scene = props.kind
  const tint = hash01(`${seedKey}:tint`)
  const baseA =
    scene === 'parking'
      ? ['#07111f', '#0b253a']
      : scene === 'gate'
        ? ['#06131f', '#241b27']
        : scene === 'warehouse'
          ? ['#061827', '#0b2b2a']
          : scene === 'dock'
            ? ['#07111f', '#2a2443']
            : scene === 'office'
              ? ['#061a1f', '#1f2a44']
              : ['#06131f', '#1a2a44']

  const glow =
    tint > 0.66 ? 'rgba(96, 165, 250, 0.18)' : tint > 0.33 ? 'rgba(167, 139, 250, 0.16)' : 'rgba(34, 197, 94, 0.12)'

  const cls = cx('camScene', props.variant === 'fullscreen' && 'camSceneFull', props.dim && 'camSceneDim')

  return (
    <svg className={cls} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={baseA[0]} />
          <stop offset="100%" stopColor={baseA[1]} />
        </linearGradient>
        <radialGradient id={vigId} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor={glow} />
          <stop offset="70%" stopColor="rgba(2, 6, 23, 0.0)" />
          <stop offset="100%" stopColor="rgba(2, 6, 23, 0.45)" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="100" height="100" fill={`url(#${bgId})`} />
      <rect x="0" y="0" width="100" height="100" fill={`url(#${vigId})`} />

      {scene === 'parking' ? (
        <g opacity="0.28">
          {[10, 24, 38, 52, 66, 80, 94].map((x) => (
            <rect key={x} x={x} y="10" width="1.6" height="90" fill="rgba(226, 232, 240, 0.25)" />
          ))}
          <rect x="0" y="54" width="100" height="1.6" fill="rgba(226, 232, 240, 0.22)" />
          <rect x="0" y="78" width="100" height="1.6" fill="rgba(226, 232, 240, 0.18)" />
        </g>
      ) : null}

      {scene === 'gate' ? (
        <>
          <g opacity="0.26">
            <rect x="0" y="64" width="100" height="36" fill="rgba(2, 6, 23, 0.35)" />
            <path d="M0 70 L100 60" stroke="rgba(226, 232, 240, 0.18)" strokeWidth="2" />
            <path d="M0 86 L100 76" stroke="rgba(226, 232, 240, 0.14)" strokeWidth="2" />
          </g>
          <g opacity="0.9">
            <rect x="0" y="50" width="100" height="4" fill="rgba(2, 6, 23, 0.55)" />
            <rect x="6" y="46" width="64" height="8" rx="2" fill="rgba(226, 232, 240, 0.18)" />
            <path d="M6 50 L70 50" stroke="rgba(250, 204, 21, 0.5)" strokeWidth="1.4" strokeDasharray="5 4" />
          </g>
          <g opacity="0.22">
            {[0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96].map((x) => (
              <rect key={x} x={x} y="18" width="1.2" height="32" fill="rgba(148, 163, 184, 0.25)" />
            ))}
          </g>
        </>
      ) : null}

      {scene === 'warehouse' ? (
        <g opacity="0.26">
          <rect x="0" y="62" width="100" height="38" fill="rgba(2, 6, 23, 0.34)" />
          <path d="M0 82 L100 72" stroke="rgba(226, 232, 240, 0.14)" strokeWidth="2" />
          <path d="M0 94 L100 84" stroke="rgba(226, 232, 240, 0.12)" strokeWidth="2" />
          <rect x="2" y="16" width="20" height="40" rx="4" fill="rgba(148, 163, 184, 0.12)" />
          <rect x="78" y="14" width="20" height="42" rx="4" fill="rgba(148, 163, 184, 0.1)" />
        </g>
      ) : null}

      {scene === 'dock' ? (
        <g opacity="0.26">
          <rect x="0" y="62" width="100" height="38" fill="rgba(2, 6, 23, 0.34)" />
          <path d="M0 80 L100 66" stroke="rgba(226, 232, 240, 0.14)" strokeWidth="2" />
          <rect x="0" y="44" width="100" height="5" fill="rgba(2, 6, 23, 0.45)" />
          <rect x="6" y="38" width="34" height="10" rx="3" fill="rgba(148, 163, 184, 0.16)" />
        </g>
      ) : null}

      {scene === 'office' ? (
        <g opacity="0.26">
          <rect x="0" y="62" width="100" height="38" fill="rgba(2, 6, 23, 0.3)" />
          <rect x="10" y="50" width="38" height="10" rx="3" fill="rgba(148, 163, 184, 0.14)" />
          <rect x="56" y="44" width="30" height="18" rx="4" fill="rgba(148, 163, 184, 0.12)" />
          <path d="M0 86 L100 78" stroke="rgba(226, 232, 240, 0.12)" strokeWidth="2" />
        </g>
      ) : null}

      {scene === 'corridor' ? (
        <g opacity="0.26">
          <path d="M10 100 L40 0" stroke="rgba(148, 163, 184, 0.18)" strokeWidth="2" />
          <path d="M90 100 L60 0" stroke="rgba(148, 163, 184, 0.18)" strokeWidth="2" />
          <path d="M0 74 L100 60" stroke="rgba(226, 232, 240, 0.12)" strokeWidth="2" />
        </g>
      ) : null}

      {props.objects.map((o) => (
        <SceneObjectSvg key={o.id} seed={seedKey} o={o} />
      ))}

      <rect x="0" y="0" width="100" height="100" fill="rgba(2, 6, 23, 0.06)" />
    </svg>
  )
}

function SceneObjectSvg(props: { seed: string; o: SceneObject }): ReactNode {
  const { seed, o } = props
  const sx = o.w / 100
  const sy = o.h / 100
  const t = hash01(`${seed}:${o.id}:t`)
  const focus = o.boxedTone !== 'none'

  const vehiclePalette = ['#60a5fa', '#a78bfa', '#f59e0b', '#22c55e', '#f97373']
  const bodyColor = vehiclePalette[Math.min(vehiclePalette.length - 1, Math.floor(t * vehiclePalette.length))]
  const body = focus ? bodyColor : `${bodyColor}CC`
  const roof = 'rgba(15, 23, 42, 0.78)'
  const glass = 'rgba(226, 232, 240, 0.22)'
  const shadow = 'rgba(0, 0, 0, 0.35)'

  if (o.kind === 'vehicle') {
    return (
      <g transform={`translate(${o.x} ${o.y}) scale(${sx} ${sy})`} opacity={focus ? 0.96 : 0.84}>
        <ellipse cx="50" cy="86" rx="44" ry="10" fill={shadow} />
        <rect x="6" y="46" width="88" height="28" rx="12" fill={body} />
        <rect x="24" y="30" width="52" height="20" rx="10" fill={roof} />
        <rect x="30" y="34" width="40" height="12" rx="6" fill={glass} />
        <circle cx="26" cy="78" r="10" fill="#020617" />
        <circle cx="74" cy="78" r="10" fill="#020617" />
        <circle cx="26" cy="78" r="5" fill="rgba(148, 163, 184, 0.6)" />
        <circle cx="74" cy="78" r="5" fill="rgba(148, 163, 184, 0.6)" />
        <path d="M16 58 L40 58" stroke="rgba(226, 232, 240, 0.35)" strokeWidth="3" strokeLinecap="round" />
      </g>
    )
  }

  if (o.kind === 'person') {
    const suit = focus ? 'rgba(226, 232, 240, 0.92)' : 'rgba(226, 232, 240, 0.76)'
    return (
      <g transform={`translate(${o.x} ${o.y}) scale(${sx} ${sy})`} opacity={focus ? 0.98 : 0.86}>
        <ellipse cx="50" cy="92" rx="30" ry="8" fill={shadow} />
        <circle cx="50" cy="22" r="16" fill="rgba(148, 163, 184, 0.95)" />
        <rect x="30" y="38" width="40" height="40" rx="16" fill={suit} />
        <rect x="34" y="74" width="12" height="22" rx="6" fill="rgba(148, 163, 184, 0.92)" />
        <rect x="54" y="74" width="12" height="22" rx="6" fill="rgba(148, 163, 184, 0.92)" />
      </g>
    )
  }

  if (o.kind === 'forklift') {
    const lift = focus ? 'rgba(250, 204, 21, 0.92)' : 'rgba(250, 204, 21, 0.78)'
    return (
      <g transform={`translate(${o.x} ${o.y}) scale(${sx} ${sy})`} opacity={focus ? 0.98 : 0.86}>
        <ellipse cx="50" cy="92" rx="40" ry="8" fill={shadow} />
        <rect x="10" y="52" width="64" height="26" rx="10" fill={lift} />
        <rect x="68" y="24" width="10" height="54" rx="4" fill="rgba(148, 163, 184, 0.7)" />
        <rect x="78" y="66" width="16" height="6" rx="2" fill="rgba(148, 163, 184, 0.65)" />
        <circle cx="24" cy="82" r="10" fill="#020617" />
        <circle cx="58" cy="82" r="10" fill="#020617" />
      </g>
    )
  }

  // pallet
  const wood = focus ? 'rgba(180, 83, 9, 0.92)' : 'rgba(180, 83, 9, 0.78)'
  return (
    <g transform={`translate(${o.x} ${o.y}) scale(${sx} ${sy})`} opacity={focus ? 0.98 : 0.86}>
      <ellipse cx="50" cy="94" rx="44" ry="8" fill={shadow} />
      <rect x="10" y="56" width="80" height="30" rx="8" fill={wood} />
      <rect x="10" y="66" width="80" height="3" fill="rgba(2, 6, 23, 0.25)" />
      <rect x="10" y="76" width="80" height="3" fill="rgba(2, 6, 23, 0.22)" />
      <rect x="20" y="52" width="60" height="10" rx="6" fill="rgba(217, 119, 6, 0.55)" />
    </g>
  )
}

const SCREEN_STORAGE_KEY = 'guardianx-demo-screen'
const SCROLL_STORAGE_KEY = 'guardianx-demo-scroll'

export function GuardianXDemo(props: { onExit: () => void; embedded?: boolean }): ReactNode {
  const { onExit, embedded } = props

  const [role, setRole] = useState<Role>('Operator')
  const [screen, setScreen] = useState<ScreenId>(() => {
    if (typeof window === 'undefined') return 'camera-dashboard'
    const stored = window.localStorage.getItem(SCREEN_STORAGE_KEY) as ScreenId | null
    return stored ?? 'camera-dashboard'
  })
  const [monitorView, setMonitorView] = useState<'surveillance' | 'multi-stream'>('surveillance')

  const [layoutSize, setLayoutSize] = useState<1 | 4 | 9 | 16>(4)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [fullscreenCameraId, setFullscreenCameraId] = useState<string | null>(null)
  const [detailsCameraId, setDetailsCameraId] = useState<string | null>(null)
  const [snapshotCameraId, setSnapshotCameraId] = useState<string | null>(null)
  const [snapshotDataUrl, setSnapshotDataUrl] = useState<string | null>(null)
  const videoRefsByCameraId = useRef<Record<string, HTMLVideoElement | null>>({})

  const [cameraFilter, setCameraFilter] = useState<string>('All')
  const [locationFilter, setLocationFilter] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<CameraStatus | 'All'>('All')
  const [searchCamera, setSearchCamera] = useState('')

  const [eventCameraFilter, setEventCameraFilter] = useState<string>('All')
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('All')
  const [severityFilter, setSeverityFilter] = useState<Severity | 'All'>('All')
  const [searchEvent, setSearchEvent] = useState('')

  const [deviceLocationFilter, setDeviceLocationFilter] = useState<string>('All')
  const [deviceStatusFilter, setDeviceStatusFilter] = useState<DeviceStatus | 'All'>('All')
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>('All')
  const [searchDevice, setSearchDevice] = useState('')

  const [routeDeviceFilter, setRouteDeviceFilter] = useState<string>('All')
  const [routeStatusFilter, setRouteStatusFilter] = useState<RouteStatus | 'All'>('All')
  const [searchRoute, setSearchRoute] = useState('')

  const [terminalStatusFilter, setTerminalStatusFilter] = useState<TerminalStatus | 'All'>('All')
  const [searchTerminal, setSearchTerminal] = useState('')

  const [deliveryTerminalFilter, setDeliveryTerminalFilter] = useState<string>('All')
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<DeliveryStatus | 'All'>('All')
  const [deliveryPriorityFilter, setDeliveryPriorityFilter] = useState<DeliveryPriority | 'All'>('All')
  const [searchDelivery, setSearchDelivery] = useState('')

  const [deliveryOpsMainTab, setDeliveryOpsMainTab] = useState<
    'verification' | 'processing' | 'completed' | 'returned' | 'cancelled'
  >('verification')
  const [deliveryOpsProcessingSubTab, setDeliveryOpsProcessingSubTab] = useState(0)
  const [deliveryOpsStatusFilter, setDeliveryOpsStatusFilter] = useState<DeliveryOperationStatus | 'All'>('All')
  const [searchDeliveryOps, setSearchDeliveryOps] = useState('')

  const [deviceForm, setDeviceForm] = useState<null | { mode: 'add' | 'edit'; deviceId?: string }>(
    null,
  )
  const [streamDeviceId, setStreamDeviceId] = useState<string | null>(null)
  const [deviceDetailsId, setDeviceDetailsId] = useState<string | null>(null)
  const [routeDetailsId, setRouteDetailsId] = useState<string | null>(null)
  const [terminalDetailsId, setTerminalDetailsId] = useState<string | null>(null)
  const [deliveryDetailsId, setDeliveryDetailsId] = useState<string | null>(null)
  const [deviceDetailTab, setDeviceDetailTab] = useState<
    'technical' | 'payload' | 'regulatory' | 'attachments'
  >('technical')
  const [deliveryOpDetailsId, setDeliveryOpDetailsId] = useState<string | null>(null)
  const [deliveryOpPackages, setDeliveryOpPackages] = useState<PackageRecord[]>([])
  const [surveillanceStatusFilter, setSurveillanceStatusFilter] = useState<SurveillanceStatus | 'All'>('All')
  const [searchSurveillance, setSearchSurveillance] = useState('')
  const [surveillanceDetailsId, setSurveillanceDetailsId] = useState<string | null>(null)

  const initialCameras = useMemo<Camera[]>(
    () => {
      const ts = nowIso()
      const locationsPool = [
        'Warehouse A',
        'Warehouse B',
        'Terminal 3',
        'HQ',
        'Gate 7',
        'Dock 2',
        'Parking',
        'Office',
      ]
      const labels = [
        'Entrance',
        'Parking',
        'Gate',
        'Loading bay',
        'Warehouse',
        'Dock',
        'Office',
        'Corridor',
        'Fence',
        'Yard',
        'Control room',
        'Lobby',
        'Hallway',
        'Terminal',
        'Perimeter',
        'Checkpoint',
      ]

      const list: Camera[] = []
      for (let i = 1; i <= 16; i++) {
        const id = `cam-${String(i).padStart(2, '0')}`
        const name = `CAM-${String(i).padStart(2, '0')} ${labels[(i - 1) % labels.length]}`
        const location = locationsPool[i % locationsPool.length]
        const status: CameraStatus =
          i % 9 === 0 ? 'Disconnected' : i % 7 === 0 ? 'Maintenance' : i % 4 === 0 ? 'Idle' : 'Live'
        const alert: AlertStatus =
          i === 3 || i === 12 ? 'Critical' : i === 2 || i === 8 || i === 15 ? 'Alert' : 'Normal'
        const muted = status !== 'Live' || i % 5 === 0
        const lastEvent =
          alert === 'Critical'
            ? 'Unauthorized access'
            : alert === 'Alert'
              ? 'Loitering detected'
              : status === 'Maintenance'
                ? 'Maintenance window'
                : status === 'Disconnected'
                  ? 'Stream lost'
                  : 'No recent events'

        list.push({
          id,
          name,
          location,
          status,
          alert,
          lastEvent,
          lastEventAt: ts,
          muted,
        })
      }

      return list
    },
    [],
  )

  const [cameras, setCameras] = useState<Camera[]>(initialCameras)

  const [events, setEvents] = useState<EventRow[]>(() => {
    const base = Date.now()
    const tsMinus = (mins: number) =>
      new Date(base - mins * 60_000).toISOString().slice(0, 19).replace('T', ' ')

    const seeded: EventRow[] = []
    let seq = 1020
    for (const c of initialCameras) {
      if (c.alert !== 'Alert' && c.alert !== 'Critical') continue
      const isCritical = c.alert === 'Critical'
      const eventType = isCritical ? 'Access violation' : 'Loitering'
      seeded.push({
        id: `EVT-${seq++}`,
        cameraId: c.id,
        cameraName: c.name,
        location: c.location,
        eventType,
        severity: isCritical ? 'Critical' : 'Medium',
        timestamp: tsMinus(isCritical ? 6 : 18),
        status: isCritical ? 'Investigating' : 'New',
      })
    }

    seeded.unshift(
      {
        id: `EVT-${seq++}`,
        cameraId: 'cam-01',
        cameraName: 'CAM-01 Entrance',
        location: 'Warehouse A',
        eventType: 'Safety',
        severity: 'Low',
        timestamp: tsMinus(34),
        status: 'Resolved',
      },
      {
        id: `EVT-${seq++}`,
        cameraId: 'cam-07',
        cameraName: 'CAM-07 Office',
        location: 'Office',
        eventType: 'Tampering',
        severity: 'High',
        timestamp: tsMinus(52),
        status: 'Closed',
      },
    )

    return seeded
  })

  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())
  const [eventDetailsId, setEventDetailsId] = useState<string | null>(null)
  const [confirmBulkResolve, setConfirmBulkResolve] = useState(false)

  const [devices, setDevices] = useState<Device[]>(() => {
    const ts = nowIso()
    return [
      {
        id: 'DR-1001',
        name: 'machine_001',
        model: 'UD-H40',
        mainType: 'Drone',
        manufacturer: 'Gaion',
        imageUrl: '/figma/guardianx/drone-quad-1.png',
        active: true,
        inUse: true,
        status: 'On Mission',
        lastSeen: ts,
        deviceId: 'DR1234',
        payload: '5kg',
        rtspUrl: 'RTSP://D1231',
        color: '#2563eb',
        linkedTerminal: 'Terminal 1',
        location: 'Terminal 1',
        note: '',
      },
      {
        id: 'DR-1002',
        name: 'machine_002',
        model: 'UD-H40',
        mainType: 'Drone',
        manufacturer: 'Gaion',
        imageUrl: '/figma/guardianx/drone-quad-2.png',
        active: true,
        inUse: false,
        status: 'Active',
        lastSeen: ts,
        deviceId: 'DR1235',
        payload: '5kg',
        rtspUrl: 'RTSP://D1232',
        color: '#2563eb',
        linkedTerminal: 'Terminal 2',
        location: 'Terminal 2',
        note: '',
      },
      {
        id: 'DR-1003',
        name: 'machine_003',
        model: 'UD-H40',
        mainType: 'Drone',
        manufacturer: 'Gaion',
        imageUrl: '/figma/guardianx/drone-quad-3.png',
        active: true,
        inUse: false,
        status: 'Warning',
        lastSeen: ts,
        deviceId: 'DR1236',
        payload: '5kg',
        rtspUrl: 'RTSP://D1233',
        color: '#f97316',
        linkedTerminal: 'Terminal 3',
        location: 'Terminal 3',
        note: 'Battery health degraded',
      },
      {
        id: 'DR-1004',
        name: 'machine_004',
        model: 'UD-H40',
        mainType: 'Drone',
        manufacturer: 'Gaion',
        imageUrl: '/figma/guardianx/drone-quad-4.png',
        active: false,
        inUse: false,
        status: 'Inactive',
        lastSeen: ts,
        deviceId: 'DR1237',
        payload: '5kg',
        rtspUrl: 'RTSP://D1234',
        color: '#6b7280',
        linkedTerminal: 'Terminal 4',
        location: 'Terminal 4',
        note: 'Scheduled maintenance',
      },
      {
        id: 'DR-1005',
        name: 'machine_005',
        model: 'UD-H40',
        mainType: 'Drone',
        manufacturer: 'Gaion',
        imageUrl: '/figma/guardianx/drone-quad-5.png',
        active: true,
        inUse: false,
        status: 'Active',
        lastSeen: ts,
        deviceId: 'DR1238',
        payload: '5kg',
        rtspUrl: 'RTSP://D1235',
        color: '#22c55e',
        linkedTerminal: 'Terminal 5',
        location: 'Terminal 5',
        note: '',
      },
    ]
  })

  const [routes, setRoutes] = useState<RoutePlan[]>(() => {
    const ts = nowIso()
    if (!devices.length) return []
    const primary = devices[0]
    const secondary = devices[1] ?? primary
    return [
      {
        id: nextId('RT'),
        name: 'Perimeter sweep A',
        deviceId: primary.id,
        deviceName: primary.name,
        origin: primary.location,
        destination: 'Perimeter north gate',
        eta: '00:18',
        status: 'In Progress',
        createdAt: ts,
      },
      {
        id: nextId('RT'),
        name: 'Cargo lane patrol',
        deviceId: secondary.id,
        deviceName: secondary.name,
        origin: secondary.location,
        destination: 'Cargo lane 3',
        eta: '00:25',
        status: 'Scheduled',
        createdAt: ts,
      },
    ]
  })

  const [terminals, setTerminals] = useState<Terminal[]>(() => {
    const ts = nowIso()
    const byLocation = new Map<string, { total: number; online: number }>()
    devices.forEach((d) => {
      const entry = byLocation.get(d.location) ?? { total: 0, online: 0 }
      entry.total += 1
      if (d.status === 'Active' || d.status === 'On Mission') entry.online += 1
      byLocation.set(d.location, entry)
    })
    const list: Terminal[] = []
    let idx = 1
    for (const [loc, counts] of byLocation.entries()) {
      const ratio = counts.online / Math.max(1, counts.total)
      const status: TerminalStatus =
        ratio === 0
          ? 'Offline'
          : ratio < 0.5
            ? 'Degraded'
            : counts.online === counts.total
              ? 'Online'
              : 'Maintenance'
      list.push({
        id: `TM-${String(idx).padStart(2, '0')}`,
        name: `Terminal ${idx}`,
        code: `T${idx}`,
        status,
        location: loc,
        devicesOnline: counts.online,
        devicesTotal: counts.total,
        lastSync: ts,
        note: '',
      })
      idx += 1
    }
    return list
  })

  const [deliveries, setDeliveries] = useState<DeliveryJob[]>(() => {
    const ts = nowIso()
    const firstTerminal = terminals[0]
    const secondTerminal = terminals[1] ?? firstTerminal
    const firstDevice = devices[0]
    const secondDevice = devices[1] ?? firstDevice
    return [
      {
        id: nextId('DLV'),
        reference: 'DLV-1001',
        terminalFrom: firstTerminal?.name ?? 'Terminal 1',
        terminalTo: secondTerminal?.name ?? 'Terminal 2',
        deviceId: firstDevice?.id ?? 'DR-1001',
        deviceName: firstDevice?.name ?? 'machine_001',
        priority: 'High',
        status: 'In Transit',
        eta: '00:12',
        createdAt: ts,
      },
      {
        id: nextId('DLV'),
        reference: 'DLV-1002',
        terminalFrom: secondTerminal?.name ?? 'Terminal 2',
        terminalTo: firstTerminal?.name ?? 'Terminal 1',
        deviceId: secondDevice?.id ?? 'DR-1002',
        deviceName: secondDevice?.name ?? 'machine_002',
        priority: 'Normal',
        status: 'Planned',
        eta: '00:25',
        createdAt: ts,
      },
    ]
  })

  const [deliveryOperations, setDeliveryOperations] = useState<DeliveryOperationRow[]>(() => {
    const ts = nowIso()
    return [
      {
        id: nextId('OP'),
        orderCode: 'ORD-0998',
        createdAt: ts,
        origin: 'Warehouse A',
        destination: 'Terminal 2',
        sender: 'GuardianX HQ',
        recipient: 'Customer C',
        handler: 'Operator Kim',
        numPackages: 1,
        status: 'Unverified',
      },
      {
        id: nextId('OP'),
        orderCode: 'ORD-0999',
        createdAt: ts,
        origin: 'Warehouse B',
        destination: 'Dock 1',
        sender: 'GuardianX HQ',
        recipient: 'Customer D',
        handler: 'Operator Park',
        numPackages: 2,
        status: 'Verified',
      },
      {
        id: nextId('OP'),
        orderCode: 'ORD-1001',
        createdAt: ts,
        origin: 'Warehouse A',
        destination: 'Terminal 3',
        sender: 'GuardianX HQ',
        recipient: 'Terminal Ops',
        handler: 'Operator Kim',
        numPackages: 3,
        status: 'SelectRoute',
      },
      {
        id: nextId('OP'),
        orderCode: 'ORD-1002',
        createdAt: ts,
        origin: 'Warehouse B',
        destination: 'Terminal 1',
        sender: 'GuardianX HQ',
        recipient: 'Customer A',
        handler: 'Operator Park',
        numPackages: 2,
        status: 'SelectDrone',
      },
      {
        id: nextId('OP'),
        orderCode: 'ORD-1003',
        createdAt: ts,
        origin: 'Terminal 2',
        destination: 'Dock 4',
        sender: 'Terminal Ops',
        recipient: 'Customer B',
        handler: 'Operator Lee',
        numPackages: 4,
        status: 'InTransit',
      },
      {
        id: nextId('OP'),
        orderCode: 'ORD-1004',
        createdAt: ts,
        origin: 'Dock 2',
        destination: 'Terminal 5',
        sender: 'Customer B',
        recipient: 'Terminal Ops',
        handler: 'Operator Lee',
        numPackages: 2,
        status: 'Arrived',
      },
      {
        id: nextId('OP'),
        orderCode: 'ORD-1005',
        createdAt: ts,
        origin: 'Warehouse A',
        destination: 'Dock 3',
        sender: 'GuardianX HQ',
        recipient: 'Customer A',
        handler: 'Operator Kim',
        numPackages: 1,
        status: 'Completed',
      },
    ]
  })

  const [surveillanceListTab, setSurveillanceListTab] = useState<'processing' | 'completed' | 'cancelled'>('processing')
  const [surveillanceProcessingSubTab, setSurveillanceProcessingSubTab] = useState<number>(0)
  const [showSurveillanceRejectModal, setShowSurveillanceRejectModal] = useState(false)
  const [surveillanceRejectReason, setSurveillanceRejectReason] = useState('')
  const [surveillanceEditMode, setSurveillanceEditMode] = useState(false)
  const [surveillanceEditDraft, setSurveillanceEditDraft] = useState<{ name: string; region: string } | null>(null)
  const [selectedWaypoint, setSelectedWaypoint] = useState<{ lat: number; lng: number; name?: string } | null>(null)
  type DeviceCheckItem = { battery: boolean; imu: boolean; gps: boolean; camera: boolean }
  const [surveillanceDeviceCheckDraft, setSurveillanceDeviceCheckDraft] = useState<Record<string, Record<string, DeviceCheckItem>>>({})
  const [gcsSelectedProfileId, setGcsSelectedProfileId] = useState<string | null>(null)
  const [gcsMissionUploaded, setGcsMissionUploaded] = useState(false)
  const [gcsDroneStatus, setGcsDroneStatus] = useState<Record<string, 'idle' | 'ready' | 'flying'>>({ 'DR-01': 'idle', 'DR-02': 'idle' })
  const [gcsDroneProgress, setGcsDroneProgress] = useState<Record<string, number>>({ 'DR-01': 0, 'DR-02': 0 })
  const gcsFlightAnimRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    const flying = Object.entries(gcsDroneStatus).every(([, s]) => s === 'flying')
    if (!flying) {
      if (gcsFlightAnimRef.current) {
        clearInterval(gcsFlightAnimRef.current)
        gcsFlightAnimRef.current = null
      }
      setGcsDroneProgress({ 'DR-01': 0, 'DR-02': 0 })
      return
    }
    gcsFlightAnimRef.current = setInterval(() => {
      setGcsDroneProgress((prev) => ({
        'DR-01': (prev['DR-01'] + 0.006) % 1,
        'DR-02': (prev['DR-02'] + 0.008) % 1,
      }))
    }, 50)
    return () => {
      if (gcsFlightAnimRef.current) clearInterval(gcsFlightAnimRef.current)
    }
  }, [gcsDroneStatus])
  const GCS_MAP_WAYPOINTS = [
    [50, 160], [130, 115], [200, 75], [270, 105], [350, 150],
  ]
  const getPointAlongPath = (t: number): [number, number] => {
    const pts = GCS_MAP_WAYPOINTS
    if (t <= 0) return [pts[0][0], pts[0][1]]
    if (t >= 1) return [pts[pts.length - 1][0], pts[pts.length - 1][1]]
    const seg = (pts.length - 1) * t
    const i = Math.floor(seg)
    const f = seg - i
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    return [x0 + f * (x1 - x0), y0 + f * (y1 - y0)]
  }

  const defaultChartData = (): SurveillanceProfileRow['chart_data'] => [
    { waypointName: 'WP1', cruise_speed: 5, operating_altitude: 50, cumulativeDistance: 0, order: 1 },
    { waypointName: 'WP2', cruise_speed: 8, operating_altitude: 80, cumulativeDistance: 120, order: 2 },
    { waypointName: 'WP3', cruise_speed: 8, operating_altitude: 80, cumulativeDistance: 280, order: 3 },
    { waypointName: 'WP4', cruise_speed: 6, operating_altitude: 60, cumulativeDistance: 420, order: 4 },
    { waypointName: 'WP5', cruise_speed: 5, operating_altitude: 50, cumulativeDistance: 550, order: 5 },
  ]

  const [surveillanceProfiles, setSurveillanceProfiles] = useState<SurveillanceProfileRow[]>(() => {
    const ts = nowIso()
    const chart = defaultChartData()
    return [
      {
        id: nextId('SP'),
        code: 'SP-2026-001',
        name: 'Perimeter sweep – north fence',
        region: 'Warehouse A perimeter',
        missionType: 'Line',
        plannedStart: ts,
        plannedEnd: ts,
        drones: 2,
        status: 'PendingApproval',
        purpose__name: 'Security patrol',
        created_on: ts,
        start_time: ts,
        estimated_end_time: ts,
        total_distance: 550,
        estimated_time: 420,
        mission__log_collection: true,
        mission__video_recording: true,
        mission__video_analysis: false,
        created_by_full_name: 'Alex Operator',
        operator_full_name: 'Alex Operator',
        maximum_drones: 4,
        log_collection: true,
        video_recording: true,
        video_analysis: false,
        capture_altitude: 80,
        note: 'Night shift preferred.',
        chart_data: chart,
      },
      {
        id: nextId('SP'),
        code: 'SP-2026-002',
        name: 'Parking lot patrol – night',
        region: 'Parking / Gate 7',
        missionType: 'Polygon',
        plannedStart: ts,
        plannedEnd: ts,
        drones: 1,
        status: 'PendingDeviceCheck',
        purpose__name: 'Perimeter',
        created_on: ts,
        start_time: ts,
        estimated_end_time: ts,
        total_distance: 320,
        estimated_time: 180,
        mission__log_collection: true,
        mission__video_recording: true,
        mission__video_analysis: true,
        created_by_full_name: 'Jordan Admin',
        operator_full_name: 'Jordan Admin',
        maximum_drones: 2,
        log_collection: true,
        video_recording: true,
        video_analysis: true,
        capture_altitude: 60,
        note: '',
        chart_data: chart,
      },
      {
        id: nextId('SP'),
        code: 'SP-2026-003',
        name: 'Dock 2 cargo corridor',
        region: 'Dock 2 / Yard',
        missionType: 'Line',
        plannedStart: ts,
        plannedEnd: ts,
        drones: 3,
        status: 'InProgress',
        purpose__name: 'Cargo surveillance',
        created_on: ts,
        start_time: ts,
        estimated_end_time: ts,
        total_distance: 800,
        estimated_time: 600,
        mission__log_collection: true,
        mission__video_recording: true,
        mission__video_analysis: true,
        created_by_full_name: 'Sam Operator',
        operator_full_name: 'Sam Operator',
        maximum_drones: 4,
        log_collection: true,
        video_recording: true,
        video_analysis: true,
        capture_altitude: 70,
        note: '',
        chart_data: chart,
      },
      {
        id: nextId('SP'),
        code: 'SP-2026-004',
        name: 'Roof perimeter – cancelled',
        region: 'Building B roof',
        missionType: 'Line',
        plannedStart: ts,
        plannedEnd: ts,
        drones: 1,
        status: 'Rejected',
        purpose__name: 'Security patrol',
        created_on: ts,
        start_time: ts,
        estimated_end_time: ts,
        total_distance: 200,
        estimated_time: 90,
        mission__log_collection: false,
        mission__video_recording: true,
        mission__video_analysis: false,
        created_by_full_name: 'Ops User',
        operator_full_name: '-',
        maximum_drones: 1,
        log_collection: false,
        video_recording: true,
        video_analysis: false,
        capture_altitude: 40,
        note: '',
        rejection_reason: 'Altitude exceeds site limit for this zone.',
        chart_data: chart,
      },
      {
        id: nextId('SP'),
        code: 'SP-2026-005',
        name: 'Completed yard sweep',
        region: 'Yard North',
        missionType: 'Polygon',
        plannedStart: ts,
        plannedEnd: ts,
        drones: 2,
        status: 'Completed',
        purpose__name: 'Perimeter',
        created_on: ts,
        start_time: ts,
        estimated_end_time: ts,
        total_distance: 450,
        estimated_time: 300,
        mission__log_collection: true,
        mission__video_recording: true,
        mission__video_analysis: true,
        created_by_full_name: 'Alex Operator',
        operator_full_name: 'Alex Operator',
        maximum_drones: 2,
        log_collection: true,
        video_recording: true,
        video_analysis: true,
        capture_altitude: 60,
        note: '',
        chart_data: chart,
      },
    ]
  })

  const locations = useMemo(() => {
    const all = new Set<string>()
    cameras.forEach((c) => all.add(c.location))
    return ['All', ...Array.from(all)]
  }, [cameras])

  const deviceLocations = useMemo(() => {
    const all = new Set<string>()
    devices.forEach((d) => all.add(d.location))
    return ['All', ...Array.from(all)]
  }, [devices])

  const cameraNameOptions = useMemo(() => ['All', ...cameras.map((c) => c.name)], [cameras])

  const filteredCameras = useMemo(() => {
    return cameras
      .filter((c) => (cameraFilter === 'All' ? true : c.name === cameraFilter))
      .filter((c) => (locationFilter === 'All' ? true : c.location === locationFilter))
      .filter((c) => (statusFilter === 'All' ? true : c.status === statusFilter))
      .filter((c) => {
        const q = searchCamera.trim().toLowerCase()
        if (!q) return true
        return `${c.name} ${c.location}`.toLowerCase().includes(q)
      })
  }, [cameras, cameraFilter, locationFilter, statusFilter, searchCamera])

  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => (eventCameraFilter === 'All' ? true : e.cameraName === eventCameraFilter))
      .filter((e) => (eventTypeFilter === 'All' ? true : e.eventType === eventTypeFilter))
      .filter((e) => (severityFilter === 'All' ? true : e.severity === severityFilter))
      .filter((e) => {
        const q = searchEvent.trim().toLowerCase()
        if (!q) return true
        return `${e.id} ${e.cameraName} ${e.location} ${e.eventType} ${e.status}`
          .toLowerCase()
          .includes(q)
      })
  }, [events, eventCameraFilter, eventTypeFilter, severityFilter, searchEvent])

  const eventTypes = useMemo(() => {
    const all = new Set<string>()
    events.forEach((e) => all.add(e.eventType))
    return ['All', ...Array.from(all)]
  }, [events])

  const filteredDevices = useMemo(() => {
    return devices
      .filter((d) => (deviceLocationFilter === 'All' ? true : d.location === deviceLocationFilter))
      .filter((d) => (deviceStatusFilter === 'All' ? true : d.status === deviceStatusFilter))
      .filter((d) => (deviceTypeFilter === 'All' ? true : d.mainType === deviceTypeFilter))
      .filter((d) => {
        const q = searchDevice.trim().toLowerCase()
        if (!q) return true
        return `${d.id} ${d.name} ${d.location} ${d.model} ${d.deviceId} ${d.manufacturer} ${d.linkedTerminal}`
          .toLowerCase()
          .includes(q)
      })
  }, [devices, deviceLocationFilter, deviceStatusFilter, deviceTypeFilter, searchDevice])

  const deviceTypes = useMemo(() => {
    const all = new Set<string>()
    devices.forEach((d) => all.add(d.mainType))
    return ['All', ...Array.from(all)]
  }, [devices])

  const routeDeviceOptions = useMemo(() => {
    return devices.map((d) => ({ id: d.id, label: d.name }))
  }, [devices])

  const filteredRoutes = useMemo(() => {
    return routes
      .filter((r) => (routeDeviceFilter === 'All' ? true : r.deviceId === routeDeviceFilter))
      .filter((r) => (routeStatusFilter === 'All' ? true : r.status === routeStatusFilter))
      .filter((r) => {
        const q = searchRoute.trim().toLowerCase()
        if (!q) return true
        return `${r.name} ${r.deviceName} ${r.origin} ${r.destination} ${r.status}`.toLowerCase().includes(q)
      })
  }, [routes, routeDeviceFilter, routeStatusFilter, searchRoute])

  const filteredTerminals = useMemo(() => {
    return terminals
      .filter((t) => (terminalStatusFilter === 'All' ? true : t.status === terminalStatusFilter))
      .filter((t) => {
        const q = searchTerminal.trim().toLowerCase()
        if (!q) return true
        return `${t.name} ${t.code} ${t.location} ${t.status}`.toLowerCase().includes(q)
      })
  }, [terminals, terminalStatusFilter, searchTerminal])

  const terminalNameOptions = useMemo(() => ['All', ...terminals.map((t) => t.name)], [terminals])

  const filteredDeliveries = useMemo(() => {
    return deliveries
      .filter((d) => (deliveryTerminalFilter === 'All' ? true : d.terminalFrom === deliveryTerminalFilter || d.terminalTo === deliveryTerminalFilter))
      .filter((d) => (deliveryStatusFilter === 'All' ? true : d.status === deliveryStatusFilter))
      .filter((d) => (deliveryPriorityFilter === 'All' ? true : d.priority === deliveryPriorityFilter))
      .filter((d) => {
        const q = searchDelivery.trim().toLowerCase()
        if (!q) return true
        return `${d.reference} ${d.terminalFrom} ${d.terminalTo} ${d.deviceName} ${d.status} ${d.priority}`
          .toLowerCase()
          .includes(q)
      })
  }, [deliveries, deliveryTerminalFilter, deliveryStatusFilter, deliveryPriorityFilter, searchDelivery])

  const deliveryOpsStatusByMainTab: Record<
    'verification' | 'processing' | 'completed' | 'returned' | 'cancelled',
    DeliveryOperationStatus[]
  > = {
    verification: ['Unverified', 'Verified'],
    processing: ['SelectRoute', 'SelectDrone', 'InTransit'],
    completed: ['Arrived', 'Completed'],
    returned: ['Returned'],
    cancelled: ['Cancelled'],
  }

  const filteredDeliveryOperations = useMemo(() => {
    const byTab = deliveryOperations.filter((op) =>
      deliveryOpsStatusByMainTab[deliveryOpsMainTab].includes(op.status),
    )
    const byStatus =
      deliveryOpsStatusFilter === 'All'
        ? byTab
        : byTab.filter((op) => op.status === deliveryOpsStatusFilter)
    const q = searchDeliveryOps.trim().toLowerCase()
    if (!q) return byStatus
    return byStatus.filter((op) =>
      `${op.orderCode} ${op.origin} ${op.destination} ${op.sender} ${op.recipient} ${op.handler}`
        .toLowerCase()
        .includes(q),
    )
  }, [
    deliveryOperations,
    deliveryOpsMainTab,
    deliveryOpsStatusFilter,
    searchDeliveryOps,
  ])

  const deliveryOpsRowsForTable = useMemo(() => {
    if (deliveryOpsMainTab !== 'processing') return filteredDeliveryOperations
    if (deliveryOpsStatusFilter !== 'All') return filteredDeliveryOperations

    const subTabStatus: Record<number, DeliveryOperationStatus | 'ALL'> = {
      0: 'SelectRoute', // Ready to Ship
      1: 'SelectDrone', // Device Check (demo simplification)
      2: 'InTransit', // In Transit
      3: 'ALL', // Package Status: show all processing orders
    }
    const status = subTabStatus[deliveryOpsProcessingSubTab] ?? 'ALL'
    if (status === 'ALL') return filteredDeliveryOperations
    return filteredDeliveryOperations.filter((op) => op.status === status)
  }, [
    deliveryOpsMainTab,
    deliveryOpsProcessingSubTab,
    deliveryOpsStatusFilter,
    filteredDeliveryOperations,
  ])

  const filteredSurveillanceProfiles = useMemo(() => {
    let list = surveillanceProfiles
    if (surveillanceListTab === 'processing') list = list.filter((p) => p.status === 'PendingApproval')
    else if (surveillanceListTab === 'completed') list = list.filter((p) => p.status === 'Completed' || p.status === 'InProgress')
    else list = list.filter((p) => p.status === 'Rejected')
    if (surveillanceStatusFilter !== 'All') list = list.filter((p) => p.status === surveillanceStatusFilter)
    const q = searchSurveillance.trim().toLowerCase()
    if (q) list = list.filter((p) => [p.code, p.id, p.name, p.region, p.purpose__name, p.status].some((s) => String(s).toLowerCase().includes(q)))
    return list
  }, [surveillanceProfiles, surveillanceListTab, surveillanceStatusFilter, searchSurveillance])

  const canAdmin = role === 'Admin'

  const openFullscreen = (cameraId: string) => setFullscreenCameraId(cameraId)
  const closeFullscreen = () => setFullscreenCameraId(null)

  const handleRefreshCameras = () => {
    setCameras((prev) =>
      prev.map((c) => ({
        ...c,
        lastEventAt: nowIso(),
      })),
    )
  }

  const handleChangeLayout = () => {
    setLayoutSize((prev) => (prev === 1 ? 4 : prev === 4 ? 9 : prev === 9 ? 16 : 1))
  }

  const handleExportSnapshot = () => {
    const target = filteredCameras[0]?.id
    if (!target) return
    const video = videoRefsByCameraId.current[target]
    const dataUrl = video ? captureVideoFrame(video) : null
    setSnapshotDataUrl(dataUrl)
    setSnapshotCameraId(target)
  }

  const setAlertResolved = (cameraId: string, eventId?: string) => {
    setCameras((prev) =>
      prev.map((c) => (c.id === cameraId ? { ...c, alert: 'Resolved', lastEvent: 'Marked as resolved' } : c)),
    )
    if (eventId) {
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: 'Resolved' } : e)),
      )
    }
  }

  const raiseEventFromCamera = (cameraId: string, severity: Severity) => {
    const cam = cameras.find((c) => c.id === cameraId)
    if (!cam) return
    const eventId = nextId('EVT')
    const eventType = severity === 'Critical' ? 'Access violation' : 'Loitering'
    const ts = nowIso()
    setEvents((prev) => [
      {
        id: eventId,
        cameraId: cam.id,
        cameraName: cam.name,
        location: cam.location,
        eventType,
        severity,
        timestamp: ts,
        status: 'New',
      },
      ...prev,
    ])
    setCameras((prev) =>
      prev.map((c) =>
        c.id === cam.id
          ? {
              ...c,
              alert: severity === 'Critical' ? 'Critical' : 'Alert',
              lastEvent: eventType,
              lastEventAt: ts,
            }
          : c,
      ),
    )
  }

  const toggleMuteAlert = (cameraId: string) => {
    setCameras((prev) => prev.map((c) => (c.id === cameraId ? { ...c, muted: !c.muted } : c)))
  }

  const handleResolveEvent = (eventId: string) => {
    const ev = events.find((e) => e.id === eventId)
    if (!ev) return
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, status: 'Resolved' } : e)))
    setAlertResolved(ev.cameraId, eventId)
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
    setSelectedEventIds((prev) => {
      const next = new Set(prev)
      next.delete(eventId)
      return next
    })
  }

  const handleBulkResolve = () => {
    const ids = Array.from(selectedEventIds)
    if (!ids.length) return
    setEvents((prev) => prev.map((e) => (selectedEventIds.has(e.id) ? { ...e, status: 'Resolved' } : e)))
    ids.forEach((id) => {
      const ev = events.find((e) => e.id === id)
      if (ev) setAlertResolved(ev.cameraId, id)
    })
    setSelectedEventIds(new Set())
    setConfirmBulkResolve(false)
  }

  const handleAddDevice = (d: Omit<Device, 'id' | 'lastSeen'>) => {
    const id = nextId('DV')
    setDevices((prev) => [
      { ...d, id, lastSeen: nowIso() },
      ...prev,
    ])
  }

  const handleUpdateDevice = (deviceId: string, patch: Partial<Device>) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, ...patch, lastSeen: nowIso() } : d)),
    )
  }

  const handleDeleteDevice = (deviceId: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId))
  }

  const activeFullscreenCamera = fullscreenCameraId
    ? cameras.find((c) => c.id === fullscreenCameraId) ?? null
    : null


  const cameraDetails = detailsCameraId
    ? cameras.find((c) => c.id === detailsCameraId) ?? null
    : null

  const cameraDetailsEvents = cameraDetails ? events.filter((e) => e.cameraId === cameraDetails.id).slice(0, 6) : []

  const snapshotCamera = snapshotCameraId
    ? cameras.find((c) => c.id === snapshotCameraId) ?? null
    : null

  const eventDetails = eventDetailsId ? events.find((e) => e.id === eventDetailsId) ?? null : null
  const eventDetailsCamera = eventDetails ? cameras.find((c) => c.id === eventDetails.cameraId) ?? null : null
  const eventDetailsScene = eventDetailsCamera ? sceneForCamera(eventDetailsCamera) : null

  const activeStreamDevice = streamDeviceId
    ? devices.find((d) => d.id === streamDeviceId) ?? null
    : null

  const streamCamera = (() => {
    if (!activeStreamDevice || !cameras.length) return null
    const deviceIndex = devices.findIndex((d) => d.id === activeStreamDevice.id)
    if (deviceIndex >= 0) {
      const mapped = cameras[deviceIndex % cameras.length]
      if (mapped) return mapped
    }
    // Fallback: first live camera, else first camera
    return cameras.find((c) => c.status === 'Live') ?? cameras[0] ?? null
  })()
  const streamEvents = streamCamera ? events.filter((e) => e.cameraId === streamCamera.id).slice(0, 6) : []

  const deviceDetails = deviceDetailsId ? devices.find((d) => d.id === deviceDetailsId) ?? null : null
  const routeDetails = routeDetailsId ? routes.find((r) => r.id === routeDetailsId) ?? null : null
  const terminalDetails = terminalDetailsId ? terminals.find((t) => t.id === terminalDetailsId) ?? null : null
  const deliveryDetails = deliveryDetailsId ? deliveries.find((d) => d.id === deliveryDetailsId) ?? null : null
  const deliveryOperationDetails = deliveryOpDetailsId
    ? deliveryOperations.find((op) => op.id === deliveryOpDetailsId) ?? null
    : null

  const buildPackagesFromOperation = (op: DeliveryOperationRow): PackageRecord[] => {
    const baseId = op.orderCode
    const pkgs: PackageRecord[] = []
    for (let i = 1; i <= op.numPackages; i++) {
      const suffix = String(i).padStart(2, '0')
      pkgs.push([
        { id: `${baseId}-PK-${suffix}`, name: 'Package ID', value: `${baseId}-PK-${suffix}` },
        { id: `${baseId}-DV-${suffix}`, name: 'Device ID', value: `DR-${1000 + i}` },
        {
          id: `${baseId}-ST-${suffix}`,
          name: 'Package Status (Device)',
          value:
            op.status === 'Completed' || op.status === 'Arrived'
              ? 'Arrived'
              : op.status === 'InTransit'
                ? 'In transit'
                : 'Pending',
        },
        {
          id: `${baseId}-AT-${suffix}`,
          name: 'Arrival Time',
          value: op.status === 'Completed' || op.status === 'Arrived' ? nowIso() : '-',
        },
        {
          id: `${baseId}-UST-${suffix}`,
          name: 'Package Status (User)',
          value:
            op.status === 'Completed'
              ? 'Delivered'
              : op.status === 'Arrived'
                ? 'Awaiting confirm'
                : 'Pending',
        },
        { id: `${baseId}-USR-${suffix}`, name: 'User', value: op.recipient },
        {
          id: `${baseId}-CK-${suffix}`,
          name: 'Check Time',
          value: op.status === 'Completed' ? nowIso() : '-',
        },
      ])
    }
    return pkgs
  }

  useEffect(() => {
    if (deliveryOperationDetails) {
      setDeliveryOpPackages(buildPackagesFromOperation(deliveryOperationDetails))
    }
  }, [deliveryOperationDetails])

  const surveillanceDetails = surveillanceDetailsId
    ? surveillanceProfiles.find((p) => p.id === surveillanceDetailsId) ?? null
    : null


  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SCREEN_STORAGE_KEY, screen)
  }, [screen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(SCROLL_STORAGE_KEY)
    if (stored) {
      const y = Number.parseInt(stored, 10)
      if (!Number.isNaN(y)) {
        window.scrollTo({ top: y, behavior: 'auto' })
      }
    }
    const handleScroll = () => {
      window.localStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY ?? 0))
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const screenTitle =
    screen === 'camera-dashboard'
      ? monitorView === 'multi-stream'
        ? 'Multi-Stream Monitor'
        : 'Camera Monitoring Dashboard'
      : screen === 'events'
        ? 'Operational Notice'
        : screen === 'devices'
          ? 'Device Template'
          : screen === 'drone-and-route'
            ? 'Drone & Route Planner'
            : screen === 'terminal'
              ? 'Terminal Overview'
              : screen === 'delivery'
                ? 'Delivery Control'
                : screen === 'delivery-ops'
                  ? 'Delivery Operations'
                  : screen === 'missions'
                    ? 'Surveillance Profiles'
                    : 'Settings'

  return (
    <div className={cx('demoRoot', embedded && 'demoRoot--embedded')}>
      <div className="demoShell">
        <aside className={cx('demoSidebar', mobileMenuOpen && 'demoSidebar--menuOpen')}>
          <div className="demoSidebarHeader">
            <div className="demoBrand">
              <span className="demoBrandMark" />
              <div>
                <div className="demoBrandName">GuardianX</div>
                <div className="demoBrandMeta">Security & surveillance</div>
              </div>
            </div>
            <div className="demoSidebarHeaderActions">
              <button
                type="button"
                className="demoMobileMenuBtn"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((o) => !o)}
              >
                <span className="demoMobileMenuBtnIcon" aria-hidden />
              </button>
              {!embedded && (
                <button className="demoExit" onClick={onExit}>
                  ← Back
                </button>
              )}
            </div>
          </div>

          <nav className="demoNav" onClick={() => setMobileMenuOpen(false)}>
            <div className="demoNavGroup">
              <div className="demoNavGroupTitle">Surveillance</div>
              <button
                className={cx(
                  'demoNavItem',
                  screen === 'camera-dashboard' && monitorView === 'surveillance' && 'demoNavItemActive',
                )}
                onClick={() => {
                  setMonitorView('surveillance')
                  setLayoutSize(4)
                  setScreen('camera-dashboard')
                }}
              >
                Surveillance Monitor
              </button>
              <button
                className={cx('demoNavItem', screen === 'missions' && 'demoNavItemActive')}
                onClick={() => setScreen('missions')}
              >
                Surveillance Profiles
              </button>
            </div>

            <div className="demoNavGroup">
              <div className="demoNavGroupTitle">Assets & Routes</div>
              <button
                className={cx('demoNavItem', screen === 'devices' && 'demoNavItemActive')}
                onClick={() => setScreen('devices')}
              >
                Device Management
              </button>
              <button
                className={cx('demoNavItem', screen === 'drone-and-route' && 'demoNavItemActive')}
                onClick={() => setScreen('drone-and-route')}
              >
                Drone & Route
              </button>
              <button
                className={cx('demoNavItem', screen === 'terminal' && 'demoNavItemActive')}
                onClick={() => setScreen('terminal')}
              >
                Terminal
              </button>
              <button
                className={cx('demoNavItem', screen === 'delivery' && 'demoNavItemActive')}
                onClick={() => setScreen('delivery')}
              >
                Delivery
              </button>
              <button
                className={cx('demoNavItem', screen === 'delivery-ops' && 'demoNavItemActive')}
                onClick={() => setScreen('delivery-ops')}
              >
                Delivery Operations
              </button>
            </div>

            {/* Settings and profile screens are out of demo scope; nav items removed */}
          </nav>
        </aside>

        <main className="demoMain">
          <header className="demoTopbar">
            <div className="demoTopbarLeft">
              <div className="demoTitle">{screenTitle}</div>
              <div className="demoSubtitle">System: GuardianX</div>
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

          {screen === 'camera-dashboard' ? (
            <section className="demoPanel">
              <div className="demoToolbar">
                <div className="demoFilters">
                  <label className="demoField">
                    <span>Camera</span>
                    <select value={cameraFilter} onChange={(e) => setCameraFilter(e.target.value)}>
                      {cameraNameOptions.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="demoField">
                    <span>Location</span>
                    <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                      {locations.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="demoField">
                    <span>Status</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as CameraStatus | 'All')}
                    >
                      <option value="All">All</option>
                      <option value="Idle">Idle</option>
                      <option value="Live">Live</option>
                      <option value="Disconnected">Disconnected</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </label>
                  <label className="demoField demoSearch">
                    <span>Search</span>
                    <input
                      value={searchCamera}
                      onChange={(e) => setSearchCamera(e.target.value)}
                      placeholder="Search camera…"
                    />
                  </label>
                </div>
                <div className="demoActions">
                  <button className="demoBtn" onClick={handleRefreshCameras}>
                    Refresh
                  </button>
                  <button className="demoBtn" onClick={handleChangeLayout}>
                    Change layout · {layoutSize}
                  </button>
                  <button
                    className="demoBtn"
                    onClick={() => {
                      const target = filteredCameras[0]?.id
                      if (target) openFullscreen(target)
                    }}
                    disabled={!filteredCameras.length}
                  >
                    Fullscreen
                  </button>
                  <button className="demoBtn" onClick={handleExportSnapshot} disabled={!filteredCameras.length}>
                    Export snapshot
                  </button>
                </div>
              </div>

              <div className={cx('camGrid', `camGrid${layoutSize}`)}>
                {filteredCameras.slice(0, layoutSize).map((c) => (
                    <div
                      key={c.id}
                      className={cx('camCard', c.status === 'Live' && 'camCardLive')}
                      role="button"
                      tabIndex={0}
                      onClick={() => openFullscreen(c.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') openFullscreen(c.id)
                      }}
                    >
                      <div className="camHeader">
                        <div>
                          <div className="camName">{c.name}</div>
                          <div className="camMeta">{c.location}</div>
                        </div>
                        <div className="camBadges">
                          <span className={cx('badge', `badgeStatus${c.status.replaceAll(' ', '')}`)}>{c.status}</span>
                        </div>
                      </div>

                      <div className="camStream">
                        {c.status === 'Live' ? (
                          <video
                            ref={(el) => {
                              if (el) videoRefsByCameraId.current[c.id] = el
                            }}
                            className="camVideo"
                            src="/media/cctv-demo.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        ) : (
                          <div className="camStreamDisconnected" />
                        )}
                        <div className="camStreamOverlay" />
                        <div className="camStreamGrid" />
                        <div className="camScanline" />
                        <div className="camStreamText">{c.status === 'Live' ? 'LIVE' : 'STREAM'}</div>
                        <div className="camTimestamp">{c.lastEventAt}</div>
                        {c.status !== 'Live' ? (
                          <>
                            <div className="camNoiseOverlay" aria-hidden="true">
                              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                <filter id={`noise-${c.id}`}>
                                  <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="n">
                                    <animate attributeName="seed" from="0" to="20" dur="0.12s" repeatCount="indefinite" />
                                  </feTurbulence>
                                  <feColorMatrix in="n" type="saturate" values="0" result="mono" />
                                  <feBlend in="mono" in2="SourceGraphic" mode="overlay" />
                                </filter>
                                <rect width="100%" height="100%" filter={`url(#noise-${c.id})`} fill="rgba(30,41,59,0.6)" />
                              </svg>
                            </div>
                            <div className="camStreamCenter">Mất kết nối</div>
                          </>
                        ) : null}
                      </div>

                      <div className="camFooter">
                        <div className="camEvent">
                          <div className="camEventLabel">Last event</div>
                          <div className="camEventValue">{c.lastEvent}</div>
                        </div>
                        <div className="camCardActions" onClick={(e) => e.stopPropagation()}>
                          <button className="miniBtn" onClick={() => setDetailsCameraId(c.id)}>
                            View details
                          </button>
                          <button
                            className="miniBtn"
                            onClick={() => {
                              const video = videoRefsByCameraId.current[c.id]
                              const dataUrl = c.status === 'Live' && video ? captureVideoFrame(video) : null
                              setSnapshotDataUrl(dataUrl)
                              setSnapshotCameraId(c.id)
                            }}
                          >
                            Snapshot
                          </button>
                          <button className="miniBtn" onClick={() => toggleMuteAlert(c.id)}>
                            {c.muted ? 'Unmute' : 'Mute alert'}
                          </button>
                        </div>
                      </div>
                    </div>
                ))}
              </div>

              <div className="demoHintRow">
                <button className="demoBtn demoBtnGhost" onClick={() => raiseEventFromCamera('cam-01', 'High')}>
                  Simulate AI event
                </button>
                <div className="demoHint">Tip: click a camera card to enter fullscreen. Use “View details” for alert flow.</div>
              </div>
            </section>
          ) : null}

          {screen === 'events' ? (
            <section className="demoPanel">
              <div className="demoToolbar">
                <div className="demoFilters">
                  <label className="demoField">
                    <span>Camera</span>
                    <select value={eventCameraFilter} onChange={(e) => setEventCameraFilter(e.target.value)}>
                      {cameraNameOptions.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="demoField">
                    <span>Event type</span>
                    <select value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)}>
                      {eventTypes.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="demoField">
                    <span>Severity</span>
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value as Severity | 'All')}
                    >
                      <option value="All">All</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </label>
                  <label className="demoField demoSearch">
                    <span>Search</span>
                    <input
                      value={searchEvent}
                      onChange={(e) => setSearchEvent(e.target.value)}
                      placeholder="Search event…"
                    />
                  </label>
                </div>
                <div className="demoActions">
                  <button className="demoBtn" onClick={() => setEvents((p) => [...p])}>
                    Refresh
                  </button>
                  <button className="demoBtn" onClick={() => setConfirmBulkResolve(true)} disabled={!selectedEventIds.size}>
                    Bulk resolve
                  </button>
                  <button className="demoBtn" onClick={() => setEventDetailsId(filteredEvents[0]?.id ?? null)} disabled={!filteredEvents.length}>
                    View details
                  </button>
                  <button
                    className="demoBtn"
                    onClick={() => {
                      const header = 'Event ID,Camera,Location,Event type,Severity,Timestamp,Status'
                      const rows = filteredEvents.map((e) =>
                        [e.id, e.cameraName, e.location, e.eventType, e.severity, e.timestamp, e.status]
                          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                          .join(','),
                      )
                      const csv = [header, ...rows].join('\n')
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `events-export-${nowIso().replace(/[:.]/g, '-')}.csv`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    disabled={!filteredEvents.length}
                  >
                    Export
                  </button>
                </div>
              </div>

              <div className="demoTableWrap">
                <table className="demoTable">
                  <thead>
                    <tr>
                      <th />
                      <th>Event ID</th>
                      <th>Camera</th>
                      <th>Location</th>
                      <th>Event type</th>
                      <th>Severity</th>
                      <th>Timestamp</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((e) => {
                      const checked = selectedEventIds.has(e.id)
                      return (
                        <tr key={e.id} className={checked ? 'rowSelected' : undefined}>
                          <td>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(ev) => {
                                const on = ev.target.checked
                                setSelectedEventIds((prev) => {
                                  const next = new Set(prev)
                                  if (on) next.add(e.id)
                                  else next.delete(e.id)
                                  return next
                                })
                              }}
                            />
                          </td>
                          <td>{e.id}</td>
                          <td>{e.cameraName}</td>
                          <td>{e.location}</td>
                          <td>{e.eventType}</td>
                          <td>
                            <span className={cx('badge', `badgeSeverity${e.severity}`)}>{e.severity}</span>
                          </td>
                          <td>{e.timestamp}</td>
                          <td>
                            <span className={cx('badge', `badgeEvent${e.status.replaceAll(' ', '')}`)}>{e.status}</span>
                          </td>
                          <td>
                            <div className="rowActions">
                              <button className="miniBtn" onClick={() => setEventDetailsId(e.id)}>
                                View details
                              </button>
                              <button className="miniBtn" onClick={() => handleResolveEvent(e.id)}>
                                Resolve
                              </button>
                              <button className="miniBtn" onClick={() => handleDeleteEvent(e.id)} disabled={!canAdmin}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="demoHint">Role: {role}. Delete requires Admin.</div>
            </section>
          ) : null}

          {screen === 'devices' ? (
            <section className="demoPanel">
              <div className="demoToolbar">
                <div className="demoFilters">
                  <label className="demoField">
                    <span>Terminal</span>
                    <select value={deviceLocationFilter} onChange={(e) => setDeviceLocationFilter(e.target.value)}>
                      {deviceLocations.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="demoField">
                    <span>Status</span>
                    <select
                      value={deviceStatusFilter}
                      onChange={(e) => setDeviceStatusFilter(e.target.value as DeviceStatus | 'All')}
                    >
                      <option value="All">All</option>
                      <option value="Active">Active</option>
                      <option value="On Mission">On Mission</option>
                      <option value="Warning">Warning</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </label>
                  <label className="demoField">
                    <span>Main type</span>
                    <select value={deviceTypeFilter} onChange={(e) => setDeviceTypeFilter(e.target.value)}>
                      {deviceTypes.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="demoField demoSearch">
                    <span>Search</span>
                    <input
                      value={searchDevice}
                      onChange={(e) => setSearchDevice(e.target.value)}
                      placeholder="Search device…"
                    />
                  </label>
                </div>
                <div className="demoActions">
                  <button className="demoBtn" onClick={() => setDeviceForm({ mode: 'add' })} disabled={!canAdmin}>
                    Add device
                  </button>
                  <button
                    className="demoBtn"
                    onClick={() => {
                      setDevices((prev) => [
                        ...prev,
                        {
                          id: nextId('DV'),
                          name: 'imported_machine',
                          model: 'UD-H40',
                          mainType: 'Drone',
                          manufacturer: 'Gaion',
                          imageUrl: '/figma/guardianx/drone-quad-import.png',
                          active: true,
                          inUse: false,
                          status: 'Active',
                          lastSeen: nowIso(),
                          deviceId: 'DR9999',
                          payload: '5kg',
                          rtspUrl: 'RTSP://D1999',
                          color: '#22c55e',
                          linkedTerminal: 'Terminal X',
                          location: 'Terminal X',
                          note: 'Imported from CSV',
                        },
                      ])
                    }}
                    disabled={!canAdmin}
                  >
                    Import
                  </button>
                  <button className="demoBtn" onClick={() => setDevices((p) => [...p])}>
                    Refresh
                  </button>
                </div>
              </div>

              <div className="demoTableWrap">
                <table className="demoTable">
                  <thead>
                    <tr>
                      <th>
                        <input type="checkbox" disabled />
                      </th>
                      <th>Name</th>
                      <th>Model / Platform</th>
                      <th>Image</th>
                      <th>Active?</th>
                      <th>In use</th>
                      <th>Status</th>
                      <th>Device ID</th>
                      <th>Main type</th>
                      <th>Manufacturer</th>
                      <th>Payload</th>
                      <th>RTSP</th>
                      <th>Linked terminal</th>
                      <th>Note</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevices.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <input type="checkbox" />
                        </td>
                        <td>{d.name}</td>
                        <td>{d.model}</td>
                        <td>
                          <div className="deviceImageCell">
                            <div className="deviceImageThumb" />
                          </div>
                        </td>
                        <td>{d.active ? 'On' : 'Off'}</td>
                        <td>{d.inUse ? 'Yes' : 'No'}</td>
                        <td>
                          <span className={cx('badge', `badgeDevice${d.status}`)}>{d.status}</span>
                        </td>
                        <td>{d.deviceId}</td>
                        <td>{d.mainType}</td>
                        <td>{d.manufacturer}</td>
                        <td>{d.payload}</td>
                        <td>{d.rtspUrl}</td>
                        <td>{d.linkedTerminal}</td>
                        <td>{d.note || '-'}</td>
                        <td>
                          <div className="rowActions">
                            <button className="miniBtn" onClick={() => setDeviceDetailsId(d.id)}>
                              Details
                            </button>
                            <button className="miniBtn" onClick={() => setDeviceForm({ mode: 'edit', deviceId: d.id })} disabled={!canAdmin}>
                              Edit
                            </button>
                            <button className="miniBtn" onClick={() => setStreamDeviceId(d.id)}>
                              View stream
                            </button>
                            <button className="miniBtn" onClick={() => handleDeleteDevice(d.id)} disabled={!canAdmin}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="demoHint">Role: {role}. Add/Edit/Delete requires Admin.</div>
            </section>
          ) : null}

          {screen === 'drone-and-route' ? (
            <section className="demoPanel">
              <div className="demoToolbar">
                <div className="demoFilters">
                  <label className="demoField">
                    <span>Device</span>
                    <select value={routeDeviceFilter} onChange={(e) => setRouteDeviceFilter(e.target.value)}>
                      <option value="All">All</option>
                      {routeDeviceOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="demoField">
                    <span>Status</span>
                    <select
                      value={routeStatusFilter}
                      onChange={(e) => setRouteStatusFilter(e.target.value as RouteStatus | 'All')}
                    >
                      <option value="All">All</option>
                      <option value="Draft">Draft</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </label>
                  <label className="demoField demoSearch">
                    <span>Search</span>
                    <input
                      value={searchRoute}
                      onChange={(e) => setSearchRoute(e.target.value)}
                      placeholder="Search route…"
                    />
                  </label>
                </div>
                <div className="demoActions">
                  <button
                    className="demoBtn"
                    onClick={() => {
                      if (!devices.length || !canAdmin) return
                      const d = devices[0]
                      const ts = nowIso()
                      setRoutes((prev) => [
                        {
                          id: nextId('RT'),
                          name: 'New patrol route',
                          deviceId: d.id,
                          deviceName: d.name,
                          origin: d.location,
                          destination: 'Custom checkpoint',
                          eta: '00:15',
                          status: 'Draft',
                          createdAt: ts,
                        },
                        ...prev,
                      ])
                    }}
                    disabled={!canAdmin || !devices.length}
                  >
                    Quick add
                  </button>
                </div>
              </div>

              <div className="demoTableWrap">
                <table className="demoTable">
                  <thead>
                    <tr>
                      <th>Route name</th>
                      <th>Device</th>
                      <th>Origin</th>
                      <th>Destination</th>
                      <th>ETA</th>
                      <th>Status</th>
                      <th>Created at</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.map((r) => (
                      <tr key={r.id}>
                        <td>{r.name}</td>
                        <td>{r.deviceName}</td>
                        <td>{r.origin}</td>
                        <td>{r.destination}</td>
                        <td>{r.eta}</td>
                        <td>
                          <select
                            value={r.status}
                            onChange={(e) => {
                              const value = e.target.value as RouteStatus
                              setRoutes((prev) =>
                                prev.map((x) => (x.id === r.id ? { ...x, status: value } : x)),
                              )
                            }}
                          >
                            <option value="Draft">Draft</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td>{r.createdAt}</td>
                        <td>
                          <div className="rowActions">
                            <button
                              className="miniBtn"
                              onClick={() => setRouteDetailsId(r.id)}
                            >
                              Details
                            </button>
                            <button
                              className="miniBtn"
                              onClick={() => {
                                const ts = nowIso()
                                setRoutes((prev) =>
                                  prev.map((x) =>
                                    x.id === r.id && x.status === 'Draft'
                                      ? { ...x, status: 'Scheduled', createdAt: ts }
                                      : x,
                                  ),
                                )
                              }}
                              disabled={!canAdmin || r.status !== 'Draft'}
                            >
                              Schedule
                            </button>
                            <button
                              className="miniBtn"
                              onClick={() =>
                                setRoutes((prev) => prev.filter((x) => x.id !== r.id))
                              }
                              disabled={!canAdmin}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!filteredRoutes.length ? (
                      <tr>
                        <td colSpan={8}>
                          <div className="demoEmpty">
                            <div className="demoEmptyTitle">No routes</div>
                            <div className="demoEmptyMeta">
                              Use Quick add to create a mock patrol route for a drone.
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="demoHint">
                This page mocks the Drone & Route planning flow: filter by device, adjust status, and
                schedule or remove routes.
              </div>
            </section>
          ) : null}

          {screen === 'terminal' ? (
            <section className="demoPanel">
              <div className="demoToolbar">
                <div className="demoFilters">
                  <label className="demoField">
                    <span>Status</span>
                    <select
                      value={terminalStatusFilter}
                      onChange={(e) => setTerminalStatusFilter(e.target.value as TerminalStatus | 'All')}
                    >
                      <option value="All">All</option>
                      <option value="Online">Online</option>
                      <option value="Degraded">Degraded</option>
                      <option value="Offline">Offline</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </label>
                  <label className="demoField demoSearch">
                    <span>Search</span>
                    <input
                      value={searchTerminal}
                      onChange={(e) => setSearchTerminal(e.target.value)}
                      placeholder="Search terminal…"
                    />
                  </label>
                </div>
                <div className="demoActions">
                  <button
                    className="demoBtn"
                    onClick={() => {
                      if (!canAdmin) return
                      const idx = terminals.length + 1
                      const ts = nowIso()
                      setTerminals((prev) => [
                        ...prev,
                        {
                          id: `TM-${String(idx).padStart(2, '0')}`,
                          name: `Terminal ${idx}`,
                          code: `T${idx}`,
                          status: 'Online',
                          location: `Custom zone ${idx}`,
                          devicesOnline: 0,
                          devicesTotal: 0,
                          lastSync: ts,
                          note: 'Added from mock UI',
                        },
                      ])
                    }}
                    disabled={!canAdmin}
                  >
                    Add terminal
                  </button>
                </div>
              </div>

              <div className="demoTableWrap">
                <table className="demoTable">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Devices online</th>
                      <th>Devices total</th>
                      <th>Last sync</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTerminals.map((t) => (
                      <tr key={t.id}>
                        <td>{t.name}</td>
                        <td>{t.code}</td>
                        <td>
                          <select
                            value={t.status}
                            onChange={(e) => {
                              const value = e.target.value as TerminalStatus
                              setTerminals((prev) =>
                                prev.map((x) => (x.id === t.id ? { ...x, status: value } : x)),
                              )
                            }}
                          >
                            <option value="Online">Online</option>
                            <option value="Degraded">Degraded</option>
                            <option value="Offline">Offline</option>
                            <option value="Maintenance">Maintenance</option>
                          </select>
                        </td>
                        <td>{t.location}</td>
                        <td>
                          {t.devicesOnline} / {t.devicesTotal}
                        </td>
                        <td>{t.devicesTotal}</td>
                        <td>{t.lastSync}</td>
                        <td>
                          <div className="rowActions">
                            <button
                              className="miniBtn"
                              onClick={() => setTerminalDetailsId(t.id)}
                            >
                              Details
                            </button>
                            <button
                              className="miniBtn"
                              onClick={() => {
                                const ts = nowIso()
                                setTerminals((prev) =>
                                  prev.map((x) => (x.id === t.id ? { ...x, lastSync: ts } : x)),
                                )
                              }}
                            >
                              Sync
                            </button>
                            <button
                              className="miniBtn"
                              onClick={() => {
                                const name = t.name
                                setDevices((prev) =>
                                  prev.map((d) =>
                                    d.location === t.location
                                      ? { ...d, note: `Pinned from ${name}` }
                                      : d,
                                  ),
                                )
                              }}
                            >
                              Pin devices
                            </button>
                            <button
                              className="miniBtn"
                              onClick={() =>
                                setTerminals((prev) => prev.filter((x) => x.id !== t.id))
                              }
                              disabled={!canAdmin}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!filteredTerminals.length ? (
                      <tr>
                        <td colSpan={8}>
                          <div className="demoEmpty">
                            <div className="demoEmptyTitle">No terminals</div>
                            <div className="demoEmptyMeta">
                              Use Add terminal to create a mock terminal configuration.
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="demoHint">
                This page aggregates drones/robots by terminal to mirror the Terminal page in the
                design: status, sync and linking to devices.
              </div>
            </section>
          ) : null}

          {screen === 'delivery' ? (
            <section className="demoPanel">
              <div className="demoToolbar">
                <div className="demoFilters">
                  <label className="demoField">
                    <span>Terminal</span>
                    <select
                      value={deliveryTerminalFilter}
                      onChange={(e) => setDeliveryTerminalFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      {terminalNameOptions.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="demoField">
                    <span>Status</span>
                    <select
                      value={deliveryStatusFilter}
                      onChange={(e) => setDeliveryStatusFilter(e.target.value as DeliveryStatus | 'All')}
                    >
                      <option value="All">All</option>
                      <option value="Planned">Planned</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Failed">Failed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </label>
                  <label className="demoField">
                    <span>Priority</span>
                    <select
                      value={deliveryPriorityFilter}
                      onChange={(e) =>
                        setDeliveryPriorityFilter(e.target.value as DeliveryPriority | 'All')
                      }
                    >
                      <option value="All">All</option>
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                    </select>
                  </label>
                  <label className="demoField demoSearch">
                    <span>Search</span>
                    <input
                      value={searchDelivery}
                      onChange={(e) => setSearchDelivery(e.target.value)}
                      placeholder="Search delivery…"
                    />
                  </label>
                </div>
                <div className="demoActions">
                  <button
                    className="demoBtn"
                    onClick={() => {
                      if (!terminals.length || !devices.length || !canAdmin) return
                      const fromIndex = Math.floor(Math.random() * terminals.length)
                      let toIndex = fromIndex
                      if (terminals.length > 1) {
                        while (toIndex === fromIndex) {
                          toIndex = Math.floor(Math.random() * terminals.length)
                        }
                      }
                      const from = terminals[fromIndex]
                      const to = terminals[toIndex]
                      const dev = devices[Math.floor(Math.random() * devices.length)]
                      const ts = nowIso()
                      setDeliveries((prev) => [
                        {
                          id: nextId('DLV'),
                          reference: `DLV-${1000 + prev.length + 1}`,
                          terminalFrom: from.name,
                          terminalTo: to.name,
                          deviceId: dev.id,
                          deviceName: dev.name,
                          priority: 'Normal',
                          status: 'Planned',
                          eta: '00:30',
                          createdAt: ts,
                        },
                        ...prev,
                      ])
                    }}
                    disabled={!canAdmin || !terminals.length || !devices.length}
                  >
                    New delivery
                  </button>
                </div>
              </div>

              <div className="demoTableWrap">
                <table className="demoTable">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Device</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>ETA</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeliveries.map((d) => (
                      <tr key={d.id}>
                        <td>{d.reference}</td>
                        <td>{d.terminalFrom}</td>
                        <td>{d.terminalTo}</td>
                        <td>{d.deviceName}</td>
                        <td>
                          <select
                            value={d.priority}
                            onChange={(e) => {
                              const value = e.target.value as DeliveryPriority
                              setDeliveries((prev) =>
                                prev.map((x) => (x.id === d.id ? { ...x, priority: value } : x)),
                              )
                            }}
                          >
                            <option value="Low">Low</option>
                            <option value="Normal">Normal</option>
                            <option value="High">High</option>
                          </select>
                        </td>
                        <td>
                          <select
                            value={d.status}
                            onChange={(e) => {
                              const value = e.target.value as DeliveryStatus
                              setDeliveries((prev) =>
                                prev.map((x) => (x.id === d.id ? { ...x, status: value } : x)),
                              )
                            }}
                          >
                            <option value="Planned">Planned</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Failed">Failed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td>{d.eta}</td>
                        <td>{d.createdAt}</td>
                        <td>
                          <div className="rowActions">
                            <button
                              className="miniBtn"
                              onClick={() => setDeliveryDetailsId(d.id)}
                            >
                              Details
                            </button>
                            <button
                              className="miniBtn"
                              onClick={() => {
                                if (d.status !== 'Planned') return
                                setDeliveries((prev) =>
                                  prev.map((x) =>
                                    x.id === d.id ? { ...x, status: 'Dispatched' } : x,
                                  ),
                                )
                              }}
                              disabled={!canAdmin || d.status !== 'Planned'}
                            >
                              Dispatch
                            </button>
                            <button
                              className="miniBtn"
                              onClick={() =>
                                setDeliveries((prev) => prev.filter((x) => x.id !== d.id))
                              }
                              disabled={!canAdmin}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!filteredDeliveries.length ? (
                      <tr>
                        <td colSpan={9}>
                          <div className="demoEmpty">
                            <div className="demoEmptyTitle">No deliveries</div>
                            <div className="demoEmptyMeta">
                              Use New delivery to create a mock routing task between terminals.
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="demoHint">
                This page mirrors the Delivery page in Figma: each row is a delivery mission with
                mock status transitions and priority changes.
              </div>
            </section>
          ) : null}

          {screen === 'delivery-ops' ? (
            <section className="demoPanel">
              <div className="demoToolbar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <DemoTabBar
                      variant="primary"
                      tabs={[
                        { value: 'verification', label: 'Verification' },
                        { value: 'processing', label: 'Processing' },
                        { value: 'completed', label: 'Completed' },
                        { value: 'returned', label: 'Returned' },
                        { value: 'cancelled', label: 'Cancelled' },
                      ]}
                      activeValue={deliveryOpsMainTab}
                      onChange={(v) => {
                        const tab = v as 'verification' | 'processing' | 'completed' | 'returned' | 'cancelled'
                        setDeliveryOpsMainTab(tab)
                      }}
                      aria-label="Delivery operation status"
                    />
                  </div>
                  {deliveryOpsMainTab === 'verification' ? (
                    <button
                      type="button"
                      className="demoBtn"
                      onClick={() => {
                        const ts = nowIso()
                        setDeliveryOperations((prev) => [
                          ...prev,
                          {
                            id: nextId('OP'),
                            orderCode: `ORD-${String(1000 + prev.length + 1).padStart(4, '0')}`,
                            createdAt: ts,
                            origin: 'Warehouse A',
                            destination: 'Terminal 1',
                            sender: 'GuardianX HQ',
                            recipient: 'Customer',
                            handler: 'Operator',
                            numPackages: 1,
                            status: 'Unverified',
                          },
                        ])
                        setDeliveryOpsMainTab('verification')
                        setDeliveryOpsStatusFilter('All')
                      }}
                    >
                      Add New Order
                    </button>
                  ) : null}
                </div>
                {deliveryOpsMainTab === 'processing' ? (
                  <div style={{ width: '100%' }}>
                    <DemoTabBar
                      variant="secondary"
                      tabs={[
                        { value: '0', label: 'Ready to Ship' },
                        { value: '1', label: 'Device Check' },
                        { value: '2', label: 'In Transit' },
                        { value: '3', label: 'Package Status' },
                      ]}
                      activeValue={String(deliveryOpsProcessingSubTab)}
                      onChange={(v) => setDeliveryOpsProcessingSubTab(Number(v))}
                      aria-label="Processing steps"
                    />
                  </div>
                ) : null}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <label className="demoField demoSearch" style={{ marginRight: 'auto' }}>
                    <span>Search</span>
                    <input
                      value={searchDeliveryOps}
                      onChange={(e) => setSearchDeliveryOps(e.target.value)}
                      placeholder="Search order…"
                    />
                  </label>
                  {['verification', 'processing', 'completed'].includes(deliveryOpsMainTab) ? (
                    <label className="demoField">
                      <span>Status</span>
                      <select
                        value={deliveryOpsStatusFilter}
                        onChange={(e) =>
                          setDeliveryOpsStatusFilter(
                            e.target.value as DeliveryOperationStatus | 'All',
                          )
                        }
                      >
                        <option value="All">All</option>
                        {deliveryOpsStatusByMainTab[deliveryOpsMainTab].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
              </div>

              <div className="demoTableWrap">
                {deliveryOpsMainTab === 'processing' ? (
                  <div className="demoTabMeta">
                    Showing:{" "}
                    {['Ready to Ship', 'Device Check', 'In Transit', 'Package Status'][deliveryOpsProcessingSubTab] ??
                      'Processing'}
                  </div>
                ) : null}
                <table className="demoTable">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Order Time</th>
                      <th>Origin</th>
                      <th>Destination</th>
                      <th>Sender</th>
                      <th>Recipient</th>
                      <th>Creator</th>
                      <th>Number of Package</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryOpsRowsForTable.map((op) => (
                      <tr key={op.id}>
                        <td>{op.orderCode}</td>
                        <td>{op.createdAt}</td>
                        <td>{op.origin}</td>
                        <td>{op.destination}</td>
                        <td>{op.sender}</td>
                        <td>{op.recipient}</td>
                        <td>{op.handler}</td>
                        <td>{op.numPackages}</td>
                        <td>{op.status}</td>
                        <td>
                          <div className="rowActions">
                            <button
                              className="miniBtn"
                              onClick={() => {
                                setDeliveryOpDetailsId(op.id)
                                setDeliveryOpPackages(buildPackagesFromOperation(op))
                              }}
                            >
                              Packages
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!deliveryOpsRowsForTable.length ? (
                      <tr>
                        <td colSpan={10}>
                          <div className="demoEmpty">
                            <div className="demoEmptyTitle">No delivery operations</div>
                            <div className="demoEmptyMeta">
                              This screen summarizes orders in processing, from route selection to
                              completion.
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="demoHint">
                Main tabs match GuardianX: Verification (Add New Order) | Processing (Ready to Ship,
                Device Check, In Transit, Package Status) | Completed | Returned | Cancelled. Click
                &quot;Packages&quot; to open order detail with Package List Status.
              </div>
            </section>
          ) : null}
          {screen === 'missions' ? (
            <section className="demoPanel">
              <div className="demoToolbar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                <div className="demoActions" style={{ marginLeft: 'auto' }}>
                  <button
                    className="demoBtn"
                    onClick={() => {
                      const ts = nowIso()
                      const chart = defaultChartData()
                      setSurveillanceProfiles((prev) => [
                        {
                          id: nextId('SP'),
                          code: `SP-NEW-${prev.length + 1}`,
                          name: 'Ad‑hoc corridor patrol',
                          region: 'HQ corridor',
                          missionType: 'Line',
                          plannedStart: ts,
                          plannedEnd: ts,
                          drones: 1,
                          status: 'PendingApproval',
                          purpose__name: 'Security patrol',
                          created_on: ts,
                          start_time: ts,
                          estimated_end_time: ts,
                          total_distance: 300,
                          estimated_time: 200,
                          mission__log_collection: true,
                          mission__video_recording: true,
                          mission__video_analysis: false,
                          created_by_full_name: 'Operator',
                          operator_full_name: 'Operator',
                          maximum_drones: 2,
                          log_collection: true,
                          video_recording: true,
                          video_analysis: false,
                          capture_altitude: 50,
                          note: '',
                          chart_data: chart,
                        },
                        ...prev,
                      ])
                    }}
                  >
                    Add New Profile
                  </button>
                </div>
              </div>
              <DemoTabBar
                variant="primary"
                tabs={[
                  { value: 'processing', label: 'Processing' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled/Rejected' },
                ]}
                activeValue={surveillanceListTab}
                onChange={(v) => setSurveillanceListTab(v as 'processing' | 'completed' | 'cancelled')}
                aria-label="Survey mission status"
                className="demoTabsBlock"
              />
              {surveillanceListTab === 'processing' ? (
                <DemoTabBar
                  variant="secondary"
                  tabs={[
                    { value: '0', label: 'Surveillance Profile' },
                    { value: '1', label: 'Device Check' },
                    { value: '2', label: 'Surveillance GCS' },
                  ]}
                  activeValue={String(surveillanceProcessingSubTab)}
                  onChange={(v) => setSurveillanceProcessingSubTab(Number(v))}
                  aria-label="Processing sub-steps"
                  className="demoTabsBlock"
                />
              ) : null}
              {surveillanceListTab !== 'processing' || surveillanceProcessingSubTab === 0 ? (
                <>
                  <div className="demoFilters" style={{ marginBottom: '0.9rem', marginTop: '0.25rem' }}>
                    <label className="demoField demoSearch">
                      <span>Search</span>
                      <input
                        value={searchSurveillance}
                        onChange={(e) => setSearchSurveillance(e.target.value)}
                        placeholder="Profile ID, name, purpose…"
                      />
                    </label>
                    {surveillanceListTab === 'processing' ? null : (
                      <label className="demoField">
                        <span>Status</span>
                        <select
                          value={surveillanceStatusFilter}
                          onChange={(e) => setSurveillanceStatusFilter(e.target.value as SurveillanceStatus | 'All')}
                        >
                          <option value="All">All</option>
                          <option value="PendingApproval">Pending approval</option>
                          <option value="PendingDeviceCheck">Pending device check</option>
                          <option value="InProgress">In progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </label>
                    )}
                  </div>
                  <div className="demoTableWrap">
                    <table className="demoTable">
                      <thead>
                        <tr>
                          <th style={{ width: '2rem' }} title="View" />
                          <th>Profile ID</th>
                          <th>Profile Name</th>
                          <th>Purpose</th>
                          <th>Created Date</th>
                          <th>Start Time</th>
                          <th>End Time</th>
                          <th>Total Distance</th>
                          <th>Estimated Time</th>
                          <th>Log</th>
                          <th>Record</th>
                          <th>Analysis</th>
                          <th>Created By</th>
                          <th>Operator</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSurveillanceProfiles.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <button type="button" className="miniBtn" title="View" onClick={() => setSurveillanceDetailsId(p.id)} style={{ padding: '2px 6px' }}>
                                View
                              </button>
                            </td>
                            <td>{p.id}</td>
                            <td>{p.name}</td>
                            <td>{p.purpose__name}</td>
                            <td>{p.created_on}</td>
                            <td>{p.start_time}</td>
                            <td>{p.estimated_end_time}</td>
                            <td>{p.total_distance}</td>
                            <td>{p.estimated_time}</td>
                            <td>{p.mission__log_collection ? 'Yes' : 'No'}</td>
                            <td>{p.mission__video_recording ? 'Yes' : 'No'}</td>
                            <td>{p.mission__video_analysis ? 'Yes' : 'No'}</td>
                            <td>{p.created_by_full_name}</td>
                            <td>{p.operator_full_name}</td>
                            <td>
                              <div className="rowActions">
                                {p.status === 'PendingApproval' ? (
                                  <>
                                    <button className="miniBtn" onClick={() => setSurveillanceDetailsId(p.id)}>Details</button>
                                    <button className="miniBtn" onClick={() => { setSurveillanceProfiles((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: 'PendingDeviceCheck' as const } : x))); setSurveillanceDetailsId(null); }}>Approve</button>
                                    <button className="miniBtn" onClick={() => { setSurveillanceProfiles((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: 'Rejected' as const, rejection_reason: 'Rejected from list.' } : x))); setSurveillanceDetailsId(null); }}>Reject</button>
                                  </>
                                ) : (
                                  <button className="miniBtn" onClick={() => setSurveillanceDetailsId(p.id)}>Details</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!filteredSurveillanceProfiles.length ? (
                          <tr>
                            <td colSpan={15}>
                              <div className="demoEmpty">
                                <div className="demoEmptyTitle">No surveillance profiles</div>
                                <div className="demoEmptyMeta">Add New Profile or switch tab.</div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : surveillanceProcessingSubTab === 1 ? (
                <div className="demoGcsDeviceCheckWrap">
                  <div className="panelTitle">Device Check</div>
                  <div className="panelMeta">Profiles pending device check. Complete checklist per assigned drone then launch or schedule.</div>
                  {(() => {
                    const pending = surveillanceProfiles.filter((p) => p.status === 'PendingDeviceCheck')
                    const MOCK_DEVICES = ['DR-01', 'DR-02']
                    const getDraft = (profileId: string, deviceId: string): DeviceCheckItem => {
                      const p = surveillanceDeviceCheckDraft[profileId]?.[deviceId]
                      return p ?? { battery: false, imu: false, gps: false, camera: false }
                    }
                    const setDraft = (profileId: string, deviceId: string, field: keyof DeviceCheckItem, value: boolean) => {
                      setSurveillanceDeviceCheckDraft((prev) => ({
                        ...prev,
                        [profileId]: {
                          ...(prev[profileId] ?? {}),
                          [deviceId]: { ...getDraft(profileId, deviceId), [field]: value },
                        },
                      }))
                    }
                    const allChecked = (profileId: string) =>
                      MOCK_DEVICES.every((d) => {
                        const c = getDraft(profileId, d)
                        return c.battery && c.imu && c.gps && c.camera
                      })
                    if (!pending.length) {
                      return (
                        <div className="demoEmpty">
                          <div className="demoEmptyTitle">No profiles pending device check</div>
                          <div className="demoEmptyMeta">Approve a profile from Surveillance Profile tab to see it here.</div>
                        </div>
                      )
                    }
                    return (
                      <div className="demoTableWrap" style={{ marginTop: '0.75rem' }}>
                        <table className="demoTable">
                          <thead>
                            <tr>
                              <th>Profile</th>
                              <th>Drone</th>
                              <th>Battery</th>
                              <th>IMU</th>
                              <th>GPS</th>
                              <th>Camera</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pending.flatMap((p) =>
                              MOCK_DEVICES.map((deviceId) => (
                                <tr key={`${p.id}-${deviceId}`}>
                                  {deviceId === MOCK_DEVICES[0] ? (
                                    <td rowSpan={MOCK_DEVICES.length} style={{ verticalAlign: 'middle' }}>
                                      <div>{p.name}</div>
                                      <div className="panelMeta">{p.code}</div>
                                    </td>
                                  ) : null}
                                  <td>{deviceId}</td>
                                  {(['battery', 'imu', 'gps', 'camera'] as const).map((key) => (
                                    <td key={key}>
                                      <label className="demoCheck">
                                        <input
                                          type="checkbox"
                                          checked={getDraft(p.id, deviceId)[key]}
                                          onChange={(e) => setDraft(p.id, deviceId, key, e.target.checked)}
                                        />
                                        <span>{key === 'battery' ? 'OK' : key.toUpperCase()}</span>
                                      </label>
                                    </td>
                                  ))}
                                  {deviceId === MOCK_DEVICES[0] ? (
                                    <td rowSpan={MOCK_DEVICES.length} style={{ verticalAlign: 'middle' }}>
                                      <div className="rowActions">
                                        <button
                                          className="demoBtn miniBtn"
                                          disabled={!allChecked(p.id)}
                                          onClick={() => {
                                            setSurveillanceProfiles((prev) =>
                                              prev.map((x) => (x.id === p.id ? { ...x, status: 'InProgress' as const } : x)),
                                            )
                                          }}
                                        >
                                          Complete — Launch now
                                        </button>
                                        <button
                                          className="demoBtn demoBtnGhost miniBtn"
                                          disabled={!allChecked(p.id)}
                                          onClick={() => {
                                            setSurveillanceProfiles((prev) =>
                                              prev.map((x) => (x.id === p.id ? { ...x, status: 'InProgress' as const } : x)),
                                            )
                                          }}
                                        >
                                          Complete — Schedule
                                        </button>
                                      </div>
                                    </td>
                                  ) : null}
                                </tr>
                              )),
                            )}
                          </tbody>
                        </table>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div className="demoGcsDeviceCheckWrap">
                  <div className="panelTitle">Surveillance GCS</div>
                  <div className="panelMeta">Ground control: select mission, upload to GCS, then start/pause/return.</div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    <label className="demoField" style={{ minWidth: '200px' }}>
                      <span>Mission (profile)</span>
                      <select
                        value={gcsSelectedProfileId ?? ''}
                        onChange={(e) => {
                          const v = e.target.value || null
                          setGcsSelectedProfileId(v)
                          if (!v) setGcsMissionUploaded(false)
                        }}
                      >
                        <option value="">— Select —</option>
                        {surveillanceProfiles
                          .filter((p) => p.status === 'PendingDeviceCheck' || p.status === 'InProgress')
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code} — {p.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="demoBtn"
                        disabled={!gcsSelectedProfileId}
                        onClick={() => gcsSelectedProfileId && setGcsMissionUploaded(true)}
                      >
                        Upload to GCS
                      </button>
                      <button
                        type="button"
                        className="demoBtn"
                        disabled={!gcsMissionUploaded || !gcsSelectedProfileId}
                        onClick={() => setGcsDroneStatus({ 'DR-01': 'flying', 'DR-02': 'flying' })}
                      >
                        Start mission
                      </button>
                      <button
                        type="button"
                        className="demoBtn demoBtnGhost"
                        disabled={Object.values(gcsDroneStatus).every((s) => s !== 'flying')}
                        onClick={() => setGcsDroneStatus((prev) => ({ ...prev, 'DR-01': 'ready', 'DR-02': 'ready' }))}
                      >
                        Pause
                      </button>
                      <button
                        type="button"
                        className="demoBtn demoBtnGhost"
                        disabled={Object.values(gcsDroneStatus).every((s) => s !== 'flying')}
                        onClick={() => setGcsDroneStatus({ 'DR-01': 'idle', 'DR-02': 'idle' })}
                      >
                        RTL
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', minHeight: '200px' }}>
                    <div className="demoPanel" style={{ flex: '1 1 300px', background: 'var(--demo-bg-elevated)', borderRadius: 8, padding: '0.5rem', overflow: 'hidden' }}>
                      <div className="panelMeta" style={{ padding: '0.25rem 0.5rem 0' }}>Map (mock)</div>
                      <svg
                        viewBox="0 0 400 200"
                        preserveAspectRatio="xMidYMid meet"
                        style={{ width: '100%', height: 200, display: 'block' }}
                        aria-label="Mission map with waypoints and drones"
                      >
                        <defs>
                          <linearGradient id="gcsMapGround" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(30,41,59,0.4)" />
                            <stop offset="100%" stopColor="rgba(51,65,85,0.5)" />
                          </linearGradient>
                          <filter id="gcsDroneGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="1" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <rect width="400" height="200" fill="url(#gcsMapGround)" />
                        {Array.from({ length: 9 }, (_, i) => (
                          <line key={`gx${i}`} x1={0} y1={i * 20} x2={400} y2={i * 20} stroke="rgba(148,163,184,0.15)" strokeWidth="0.5" />
                        ))}
                        {Array.from({ length: 21 }, (_, i) => (
                          <line key={`gy${i}`} x1={i * 20} y1={0} x2={i * 20} y2={200} stroke="rgba(148,163,184,0.15)" strokeWidth="0.5" />
                        ))}
                        <polyline
                          points={GCS_MAP_WAYPOINTS.map(([x, y]) => `${x},${y}`).join(' ')}
                          fill="none"
                          stroke="rgba(59,130,246,0.6)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {GCS_MAP_WAYPOINTS.map(([x, y], i) => (
                          <g key={`wp${i}`}>
                            <circle cx={x} cy={y} r="4" fill="rgba(59,130,246,0.9)" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
                            <text x={x} y={y - 8} textAnchor="middle" fill="rgba(226,232,240,0.9)" fontSize="9">WP{i + 1}</text>
                          </g>
                        ))}
                        {(['DR-01', 'DR-02'] as const).map((id, idx) => {
                          const status = gcsDroneStatus[id]
                          const isFlying = status === 'flying'
                          const progress = isFlying ? gcsDroneProgress[id] ?? 0 : 0
                          const [dx, dy] = getPointAlongPath(progress)
                          // Slight offset for second drone so they don't overlap completely
                          const offsetX = idx === 1 ? 10 : 0
                          const offsetY = idx === 1 ? 6 : 0
                          return (
                            <g
                              key={id}
                              filter="url(#gcsDroneGlow)"
                              transform={`translate(${dx + offsetX}, ${dy + offsetY})`}
                            >
                              {isFlying ? (
                                <circle className="gcsDroneFlying" r="7" fill="rgba(34,197,94,0.9)" stroke="rgba(15,23,42,0.9)" strokeWidth="1.4" />
                              ) : (
                                <circle r="7" fill="rgba(148,163,184,0.9)" stroke="rgba(15,23,42,0.9)" strokeWidth="1.4" />
                              )}
                              <text y="4" textAnchor="middle" fill="var(--text)" fontSize="7" fontWeight="600">{id.replace('DR-', '')}</text>
                            </g>
                          )
                        })}
                        <text x="8" y="14" fill="rgba(148,163,184,0.6)" fontSize="8">N</text>
                        <path d="M8 14 L8 24 L5 20 L8 24 L11 20 Z" fill="rgba(148,163,184,0.5)" />
                      </svg>
                    </div>
                    <div style={{ flex: '0 0 280px' }}>
                      <div className="panelTitle" style={{ marginBottom: '0.5rem' }}>Drones</div>
                      {['DR-01', 'DR-02'].map((id) => (
                        <div key={id} className="demoPanel" style={{ background: 'var(--demo-bg-elevated)', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{id}</span>
                            <span className={gcsDroneStatus[id] === 'flying' ? 'panelMeta' : undefined} style={{ textTransform: 'capitalize' }}>
                              {gcsDroneStatus[id]}
                            </span>
                          </div>
                          <div className="panelMeta" style={{ marginTop: 4 }}>Battery 94% · Alt 0 m · Speed 0 m/s</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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

      {activeFullscreenCamera ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalCard modalFullscreen">
            <div className="modalHeader">
              <div>
                <div className="modalTitle">{activeFullscreenCamera.name}</div>
                <div className="modalMeta">{activeFullscreenCamera.location}</div>
              </div>
              <div className="modalActions">
                <button
                  className="demoBtn"
                  onClick={() => {
                    const video = videoRefsByCameraId.current[activeFullscreenCamera.id]
                    const dataUrl =
                      activeFullscreenCamera.status === 'Live' && video ? captureVideoFrame(video) : null
                    setSnapshotDataUrl(dataUrl)
                    setSnapshotCameraId(activeFullscreenCamera.id)
                    closeFullscreen()
                  }}
                >
                  Snapshot
                </button>
                <button className="demoBtn" onClick={() => toggleMuteAlert(activeFullscreenCamera.id)}>
                  {activeFullscreenCamera.muted ? 'Unmute' : 'Mute alert'}
                </button>
                <button className="demoBtn demoBtnGhost" onClick={closeFullscreen}>
                  Back
                </button>
              </div>
            </div>
            <div className="videoFrame">
              {activeFullscreenCamera.status === 'Live' ? (
                <video
                  ref={(el) => {
                    if (el) videoRefsByCameraId.current[activeFullscreenCamera.id] = el
                  }}
                  className="camVideo"
                  src="/media/cctv-demo.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <>
                  <div className="camStreamDisconnected" />
                  <div className="camNoiseOverlay videoFrameNoise" aria-hidden="true">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                      <filter id="noise-fullscreen-card">
                        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="n">
                          <animate attributeName="seed" from="0" to="20" dur="0.12s" repeatCount="indefinite" />
                        </feTurbulence>
                        <feColorMatrix in="n" type="saturate" values="0" result="mono" />
                        <feBlend in="mono" in2="SourceGraphic" mode="overlay" />
                      </filter>
                      <rect width="100%" height="100%" filter="url(#noise-fullscreen-card)" fill="rgba(30,41,59,0.6)" />
                    </svg>
                  </div>
                  <div className="camStreamCenter">Mất kết nối</div>
                </>
              )}
              <div className="videoGridLines" />
              <div className="videoStamp">{activeFullscreenCamera.status === 'Live' ? 'LIVE' : activeFullscreenCamera.status}</div>
              <div className="videoTimestamp">{activeFullscreenCamera.lastEventAt}</div>
              <div className="videoScanline" />
              {activeFullscreenCamera.alert === 'Alert' || activeFullscreenCamera.alert === 'Critical' ? (
                <div className={cx('videoAlert', activeFullscreenCamera.alert === 'Critical' && 'videoAlertCritical')}>
                  {activeFullscreenCamera.alert} · {activeFullscreenCamera.lastEvent}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {cameraDetails ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalCard">
            <div className="modalHeader">
              <div>
                <div className="modalTitle">{cameraDetails.name}</div>
                <div className="modalMeta">{cameraDetails.location}</div>
              </div>
              <div className="modalActions">
                <button
                  className="demoBtn"
                  onClick={() => {
                    const video = videoRefsByCameraId.current[cameraDetails.id]
                    const dataUrl =
                      cameraDetails.status === 'Live' && video ? captureVideoFrame(video) : null
                    setSnapshotDataUrl(dataUrl)
                    setSnapshotCameraId(cameraDetails.id)
                  }}
                >
                  Snapshot
                </button>
                <button
                  className="demoBtn"
                  onClick={() => {
                    const linked = events.find((e) => e.cameraId === cameraDetails.id && e.status !== 'Resolved')
                    setAlertResolved(cameraDetails.id, linked?.id)
                  }}
                >
                  Mark resolved
                </button>
                <button className="demoBtn demoBtnGhost" onClick={() => setDetailsCameraId(null)}>
                  Close
                </button>
              </div>
            </div>
            <div className="modalBody">
              <div className="split">
                <div className="panel">
                  <div className="panelTitle">Event timeline</div>
                  <ul className="timelineList">
                    {cameraDetailsEvents.length ? (
                      cameraDetailsEvents.map((e) => (
                        <li key={e.id} className="timelineItem">
                          <span className={cx('badge', `badgeSeverity${e.severity}`)}>{e.severity}</span>
                          <span className="timelineText">
                            {e.eventType} · {e.timestamp}
                          </span>
                          <span className={cx('badge', `badgeEvent${e.status.replaceAll(' ', '')}`)}>{e.status}</span>
                        </li>
                      ))
                    ) : (
                      <li className="timelineEmpty">No events recorded for this camera.</li>
                    )}
                  </ul>
                </div>
                <div className="panel">
                  <div className="panelTitle">Preview</div>
                  <div className="videoThumb">
                    {cameraDetails.status === 'Live' ? (
                      <video
                        ref={(el) => {
                          if (el) videoRefsByCameraId.current[cameraDetails.id] = el
                        }}
                        className="camVideo"
                        src="/media/cctv-demo.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <>
                        <div className="camStreamDisconnected" />
                        <div className="camNoiseOverlay" aria-hidden="true">
                          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                            <filter id={`noise-details-${cameraDetails.id}`}>
                              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="n">
                                <animate attributeName="seed" from="0" to="20" dur="0.12s" repeatCount="indefinite" />
                              </feTurbulence>
                              <feColorMatrix in="n" type="saturate" values="0" result="mono" />
                              <feBlend in="mono" in2="SourceGraphic" mode="overlay" />
                            </filter>
                            <rect width="100%" height="100%" filter={`url(#noise-details-${cameraDetails.id})`} fill="rgba(30,41,59,0.6)" />
                          </svg>
                        </div>
                        <div className="camStreamCenter">Mất kết nối</div>
                      </>
                    )}
                    <div className="videoThumbStamp">{cameraDetails.status === 'Live' ? 'LIVE' : 'Snapshot preview'}</div>
                  </div>
                  <div className="panelMeta">Use Snapshot to export a frame. Mark resolved will clear the alert badge.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {snapshotCamera ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalCard">
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Snapshot</div>
                <div className="modalMeta">
                  {snapshotCamera.name} · {nowIso()}
                </div>
              </div>
              <div className="modalActions">
                <button
                  className="demoBtn demoBtnGhost"
                  onClick={() => {
                    setSnapshotCameraId(null)
                    setSnapshotDataUrl(null)
                  }}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="modalBody">
              <div className="snapshotFrame">
                {snapshotDataUrl ? (
                  <img
                    src={snapshotDataUrl}
                    alt="Exported frame"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      borderRadius: 12,
                    }}
                  />
                ) : (
                  <>
                    <div className="snapshotGrid" />
                    <div className="snapshotLabel">Exported frame</div>
                  </>
                )}
              </div>
              <div className="demoHint">
                {snapshotDataUrl
                  ? 'Frame captured from stream. In production this would trigger a download.'
                  : 'In production this would download an image; here it demonstrates the UX flow.'}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {eventDetails ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalCard">
            <div className="modalHeader">
              <div>
                <div className="modalTitle">{eventDetails.id}</div>
                <div className="modalMeta">
                  {eventDetails.cameraName} · {eventDetails.eventType}
                </div>
              </div>
              <div className="modalActions">
                <button className="demoBtn" onClick={() => handleResolveEvent(eventDetails.id)}>
                  Resolve
                </button>
                <button className="demoBtn demoBtnGhost" onClick={() => setEventDetailsId(null)}>
                  Close
                </button>
              </div>
            </div>
            <div className="modalBody">
              <div className="split">
                <div className="panel">
                  <div className="panelTitle">Video playback</div>
                  <div className="videoThumb">
                    {eventDetailsCamera && eventDetailsScene ? (
                      <CameraSceneSvg
                        seed={eventDetailsCamera.id}
                        idSuffix="event-playback-thumb"
                        kind={eventDetailsScene.kind}
                        objects={eventDetailsScene.objects}
                        dim={eventDetailsCamera.status !== 'Live'}
                        variant="card"
                      />
                    ) : null}
                    <div className="videoThumbStamp">Playback</div>
                  </div>
                </div>
                <div className="panel">
                  <div className="panelTitle">Snapshot</div>
                  <div className="videoThumb">
                    {eventDetailsCamera && eventDetailsScene ? (
                      <CameraSceneSvg
                        seed={eventDetailsCamera.id}
                        idSuffix="event-snapshot-thumb"
                        kind={eventDetailsScene.kind}
                        objects={eventDetailsScene.objects}
                        dim={eventDetailsCamera.status !== 'Live'}
                        variant="card"
                      />
                    ) : null}
                    <div className="videoThumbStamp">Snapshot</div>
                  </div>
                  <div className="panelMeta">
                    Status: <strong>{eventDetails.status}</strong> · Severity: <strong>{eventDetails.severity}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {confirmBulkResolve ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalCard modalSmall">
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Bulk resolve</div>
                <div className="modalMeta">Mark selected events as Resolved?</div>
              </div>
              <div className="modalActions">
                <button className="demoBtn" onClick={handleBulkResolve}>
                  Confirm
                </button>
                <button className="demoBtn demoBtnGhost" onClick={() => setConfirmBulkResolve(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deviceForm ? (
        <DeviceModal
          mode={deviceForm.mode}
          role={role}
          devices={devices}
          deviceId={deviceForm.deviceId}
          onClose={() => setDeviceForm(null)}
          onAdd={handleAddDevice}
          onUpdate={handleUpdateDevice}
        />
      ) : null}

      {activeStreamDevice ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalCard">
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Live stream</div>
                <div className="modalMeta">{activeStreamDevice.name}</div>
              </div>
              <div className="modalActions">
                <button
                  className="demoBtn"
                  onClick={() => {
                    if (streamCamera) {
                      const video = videoRefsByCameraId.current[streamCamera.id]
                      const dataUrl =
                        streamCamera.status === 'Live' && video ? captureVideoFrame(video) : null
                      setSnapshotDataUrl(dataUrl)
                      setSnapshotCameraId(streamCamera.id)
                    }
                    setStreamDeviceId(null)
                  }}
                  disabled={!streamCamera}
                >
                  Snapshot
                </button>
                <button className="demoBtn demoBtnGhost" onClick={() => setStreamDeviceId(null)}>
                  Close
                </button>
              </div>
            </div>
            <div className="modalBody">
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
                <div className="videoFrame" style={{ flex: '1 1 540px' }}>
                  {streamCamera && streamCamera.status === 'Live' ? (
                    <video
                      ref={(el) => {
                        if (el && streamCamera) videoRefsByCameraId.current[streamCamera.id] = el
                      }}
                      className="camVideo"
                      src="/media/cctv-demo.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : streamCamera ? (
                    <>
                      <div className="camStreamDisconnected" />
                      <div className="camNoiseOverlay videoFrameNoise" aria-hidden="true">
                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                          <filter id="noise-fullscreen">
                            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="n">
                              <animate attributeName="seed" from="0" to="20" dur="0.12s" repeatCount="indefinite" />
                            </feTurbulence>
                            <feColorMatrix in="n" type="saturate" values="0" result="mono" />
                            <feBlend in="mono" in2="SourceGraphic" mode="overlay" />
                          </filter>
                          <rect width="100%" height="100%" filter="url(#noise-fullscreen)" fill="rgba(30,41,59,0.6)" />
                        </svg>
                      </div>
                      <div className="camStreamCenter">Mất kết nối</div>
                    </>
                  ) : null}
                  <div className="videoGridLines" />
                  <div className="videoStamp">
                    {streamCamera ? (streamCamera.status === 'Live' ? 'LIVE' : streamCamera.status) : 'LIVE'}
                  </div>
                  {streamCamera ? <div className="videoTimestamp">{streamCamera.lastEventAt}</div> : null}
                  <div className="videoScanline" />
                </div>
                <aside
                  className="panel"
                  style={{
                    flex: '0 0 260px',
                    maxHeight: 360,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div className="panelTitle" style={{ fontSize: '0.9rem' }}>
                    AI events for this stream
                  </div>
                  <div className="panelMeta" style={{ fontSize: 11 }}>
                    Showing last {streamEvents.length || 0} events on {streamCamera?.name ?? '—'}.
                  </div>
                  <div style={{ marginTop: '0.25rem', overflowY: 'auto', paddingRight: '2px' }}>
                    {streamEvents.length ? (
                      streamEvents.map((e) => (
                        <div
                          key={e.id}
                          className="panel"
                          style={{
                            marginBottom: '0.4rem',
                            padding: '0.5rem 0.55rem',
                            borderRadius: 10,
                            borderColor:
                              e.severity === 'Critical'
                                ? 'rgba(248, 113, 113, 0.7)'
                                : e.severity === 'High'
                                  ? 'rgba(249, 115, 22, 0.7)'
                                  : 'rgba(148, 163, 184, 0.45)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: 2,
                            }}
                          >
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{e.timestamp}</span>
                            <span
                              className="badge"
                              style={{
                                fontSize: 10,
                                paddingInline: 6,
                                borderColor:
                                  e.severity === 'Critical'
                                    ? 'rgba(248, 113, 113, 0.8)'
                                    : e.severity === 'High'
                                      ? 'rgba(249, 115, 22, 0.8)'
                                      : 'rgba(148, 163, 184, 0.6)',
                              }}
                            >
                              {e.severity}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, marginBottom: 2 }}>{e.eventType}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Status: {e.status}</div>
                        </div>
                      ))
                    ) : (
                      <div className="panelMeta" style={{ fontSize: 11 }}>
                        No AI events yet. Use “Simulate AI event” on the dashboard to generate detections.
                      </div>
                    )}
                  </div>
                </aside>
              </div>
              <div className="demoHint">This is a mock stream modal to demonstrate the “View Stream + AI events” workflow.</div>
            </div>
          </div>
        </div>
      ) : null}

      {deviceDetails ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalCard modalFullscreen">
            <div className="modalHeader">
              <div>
                <div className="modalTitle">
                  {deviceDetails.name} · {deviceDetails.model}
                </div>
                <div className="modalMeta">
                  {deviceDetails.mainType} · {deviceDetails.manufacturer} · ID {deviceDetails.deviceId}
                </div>
              </div>
              <div className="modalActions">
                <button
                  className="demoBtn"
                  onClick={() => setDeviceForm({ mode: 'edit', deviceId: deviceDetails.id })}
                  disabled={!canAdmin}
                >
                  Edit
                </button>
                <button
                  className="demoBtn demoBtnGhost"
                  onClick={() => {
                    setDeviceDetailsId(null)
                    setDeviceDetailTab('technical')
                  }}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="modalBody">
              <div className="demoToolbar">
                <div className="demoFilters">
                  <button
                    className={cx(
                      'demoBtn',
                      deviceDetailTab === 'technical' && 'demoBtnPrimary',
                    )}
                    onClick={() => setDeviceDetailTab('technical')}
                  >
                    Technical Specifications
                  </button>
                  <button
                    className={cx(
                      'demoBtn',
                      deviceDetailTab === 'payload' && 'demoBtnPrimary',
                    )}
                    onClick={() => setDeviceDetailTab('payload')}
                  >
                    Payload &amp; Sensor Systems
                  </button>
                  <button
                    className={cx(
                      'demoBtn',
                      deviceDetailTab === 'regulatory' && 'demoBtnPrimary',
                    )}
                    onClick={() => setDeviceDetailTab('regulatory')}
                  >
                    Regulatory &amp; Operational
                  </button>
                  <button
                    className={cx(
                      'demoBtn',
                      deviceDetailTab === 'attachments' && 'demoBtnPrimary',
                    )}
                    onClick={() => setDeviceDetailTab('attachments')}
                  >
                    Attachments
                  </button>
                </div>
              </div>

              {deviceDetailTab === 'technical' ? (
                <div className="split">
                  <div className="panel">
                    <div className="panelTitle">Physical Specifications</div>
                    <div className="panelMeta">
                      <div>Frame size: 1200mm x 400mm</div>
                      <div>Maximum takeoff weight (MTOW): 25kg</div>
                      <div>Payload capacity: {deviceDetails.payload}</div>
                      <div>Empty weight: 15kg</div>
                    </div>
                    <div className="panelTitle">Propulsion System</div>
                    <div className="panelMeta">
                      <div>Number of motors: 8</div>
                      <div>Motor type: Brushless DC</div>
                      <div>Motor power: 2.5kW each</div>
                      <div>Propeller size: 18 inches</div>
                      <div>Battery type: Lithium Polymer (LiPo)</div>
                      <div>Battery capacity: 20,000mAh</div>
                      <div>Flight time: 45 minutes</div>
                      <div>Charging time: 60 minutes</div>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panelTitle">Performance Specifications</div>
                    <div className="panelMeta">
                      <div>Maximum speed: 60 km/h</div>
                      <div>Cruise speed: 40 km/h</div>
                      <div>Maximum altitude: 500 m</div>
                      <div>Operating altitude: 100–300 m</div>
                      <div>Maximum range: 8 km</div>
                      <div>Wind resistance: Up to 40 km/h</div>
                    </div>
                    <div className="panelTitle">Navigation and Control</div>
                    <div className="panelMeta">
                      <div>GPS accuracy: ±1.5 m</div>
                      <div>IMU: 9‑axis (accelerometer, gyroscope, magnetometer)</div>
                      <div>Barometric altimeter: Yes</div>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panelTitle">Communication Systems</div>
                    <div className="panelMeta">
                      <div>Radio frequency: 5.8 GHz</div>
                      <div>Range: 15 km (line of sight)</div>
                    </div>
                    <div className="panelTitle">Telemetry</div>
                    <div className="panelMeta">
                      <div>Real‑time flight data transmission: Yes</div>
                      <div>Video streaming (1080p): Yes</div>
                      <div>Battery status monitoring: Yes</div>
                      <div>GPS position tracking: Yes</div>
                      <div>System health monitoring: Yes</div>
                    </div>
                    <div className="panelTitle">Communication Protocols</div>
                    <div className="panelMeta">
                      <div>Flight control protocols: SBUS</div>
                      <div>Telemetry protocols: MAVLink, DroneCAN</div>
                      <div>Sensor communication: I2C</div>
                      <div>Video &amp; data link: RTSP / UDP video stream</div>
                    </div>
                  </div>
                </div>
              ) : null}

              {deviceDetailTab === 'payload' ? (
                <div className="split">
                  <div className="panel">
                    <div className="panelTitle">Payload System</div>
                    <div className="panelMeta">
                      <div>Cargo compartment: 400mm x 300mm x 300mm</div>
                      <div>Weight capacity: {deviceDetails.payload}</div>
                      <div>Temperature control: Yes</div>
                      <div>Secure locking mechanism: Yes</div>
                      <div>Quick‑release system: Yes</div>
                    </div>
                    <div className="panelTitle">Surveillance Systems – Camera 1</div>
                    <div className="panelMeta">
                      <div>Type: 4K camera</div>
                      <div>Resolution: 3840 x 2160</div>
                      <div>Frame rate: 60 fps</div>
                      <div>Field of view: 70°–100°</div>
                      <div>Image stabilization: Digital (EIS)</div>
                    </div>
                    <div className="panelTitle">Surveillance Systems – Camera 2</div>
                    <div className="panelMeta">
                      <div>Type: Thermal camera</div>
                      <div>Resolution: 3840 x 2160</div>
                      <div>Frame rate: 30 fps</div>
                      <div>Field of view: 70°–100°</div>
                      <div>Image stabilization: Digital (EIS)</div>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panelTitle">Packaging Specifications – Option 1</div>
                    <div className="panelMeta">
                      <div>Small carton box (PKG001): 150mm x 100mm x 50mm / 0.5kg</div>
                      <div>Medium carton box (PKG002): 300mm x 200mm x 100mm / 1kg</div>
                    </div>
                    <div className="panelTitle">Packaging Specifications – Option 2</div>
                    <div className="panelMeta">
                      <div>Medium carton box (PKG002): 300mm x 200mm x 100mm / 2kg</div>
                      <div>Medium plastic pouch (PKG003): 250mm x 150mm x 50mm / 1kg</div>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panelTitle">Sensor Suite</div>
                    <div className="panelMeta">
                      <div>GNSS: GPS, GLONASS, Galileo, BeiDou, QZSS</div>
                      <div>Optical flow sensor: Yes</div>
                      <div>Ultrasonic sensors: Yes</div>
                      <div>LIDAR for obstacle detection: Yes</div>
                      <div>AIS (Automatic Identification System): Optional</div>
                      <div>ADS‑B receiver: Optional</div>
                      <div>RF signal detector: Yes</div>
                      <div>Chemical sensor array: Optional</div>
                      <div>Radiation detector: Optional</div>
                      <div>Weather sensors: Yes</div>
                    </div>
                  </div>
                </div>
              ) : null}

              {deviceDetailTab === 'regulatory' ? (
                <div className="split">
                  <div className="panel">
                    <div className="panelTitle">Drone Manufacturing Information</div>
                    <div className="panelMeta">
                      <div>Manufacturer: {deviceDetails.manufacturer}</div>
                      <div>Country of origin: Korea</div>
                      <div>Model / product code: {deviceDetails.model}</div>
                      <div>Serial number: 15BDJM3P093248</div>
                      <div>Production date: 06‑15‑2024</div>
                      <div>
                        Note: Assigned to Route A. Should not be used during storm season. Recalibrated on
                        03‑01‑2025.
                      </div>
                    </div>
                    <div className="panelTitle">Drone Insurance Information</div>
                    <div className="panelMeta">
                      <div>Insurance status: Active</div>
                      <div>Insurance type: Liability &amp; Physical Damage</div>
                      <div>Insurance provider: SkyShield Insurance Ltd.</div>
                      <div>Policy number: SKY‑DR‑2024‑00183</div>
                      <div>Validity period: 07‑01‑2024 – 06‑30‑2025</div>
                      <div>Current status: Active</div>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panelTitle">Environmental Specifications</div>
                    <div className="panelMeta">
                      <div>Temperature range: ‑10°C to 50°C</div>
                      <div>Humidity: 0–95% non‑condensing</div>
                      <div>Precipitation: Light rain operation</div>
                      <div>Wind speed: Up to 40 km/h</div>
                    </div>
                    <div className="panelTitle">Noise Levels</div>
                    <div className="panelMeta">
                      <div>Takeoff: 65 dB</div>
                      <div>Cruise: 55 dB</div>
                      <div>Landing: 60 dB</div>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panelTitle">Safety Features</div>
                    <div className="panelMeta">
                      <div>Dual IMU: Yes</div>
                      <div>Dual GPS: Yes</div>
                      <div>Dual battery system: Yes</div>
                      <div>Emergency parachute system: Optional</div>
                      <div>Return‑to‑home capability: Yes</div>
                      <div>360° obstacle detection: Yes</div>
                      <div>Forward‑facing stereo cameras: Yes</div>
                      <div>LIDAR‑based obstacle mapping: Yes</div>
                      <div>Automatic emergency braking: Yes</div>
                    </div>
                  </div>
                </div>
              ) : null}

              {deviceDetailTab === 'attachments' ? (
                <div className="panel">
                  <div className="panelTitle">Attachments</div>
                  <ul className="timelineList">
                    <li className="timelineItem">
                      <span className="timelineText">Drone_Serial_Number.jpg</span>
                    </li>
                    <li className="timelineItem">
                      <span className="timelineText">Drone_Side_Photo.jpg</span>
                    </li>
                    <li className="timelineItem">
                      <span className="timelineText">Specs_And_Performance_Form.hwp</span>
                    </li>
                    <li className="timelineItem">
                      <span className="timelineText">ISO_14001_2015.pdf</span>
                    </li>
                    <li className="timelineItem">
                      <span className="timelineText">Hanwha_Insurance.jpg</span>
                    </li>
                  </ul>
                  <div className="panelMeta">
                    In the real app these rows would support preview and download. Here they are static
                    mock entries to match the design.
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {routeDetails ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalCard">
            <div className="modalHeader">
              <div>
                <div className="modalTitle">{routeDetails.name}</div>
                <div className="modalMeta">
                  Device: {routeDetails.deviceName} · ETA: {routeDetails.eta}
                </div>
              </div>
              <div className="modalActions">
                <button
                  className="demoBtn"
                  onClick={() => {
                    setRoutes((prev) =>
                      prev.map((x) =>
                        x.id === routeDetails.id ? { ...x, status: 'In Progress' } : x,
                      ),
                    )
                  }}
                  disabled={!canAdmin}
                >
                  Start
                </button>
                <button className="demoBtn demoBtnGhost" onClick={() => setRouteDetailsId(null)}>
                  Close
                </button>
              </div>
            </div>
            <div className="modalBody">
              <div className="split">
                <div className="panel">
                  <div className="panelTitle">Route information</div>
                  <div className="panelMeta">
                    <div>Origin: {routeDetails.origin}</div>
                    <div>Destination: {routeDetails.destination}</div>
                    <div>Status: {routeDetails.status}</div>
                    <div>Created at: {routeDetails.createdAt}</div>
                  </div>
                </div>
                <div className="panel">
                  <div className="panelTitle">Linked device</div>
                  <div className="panelMeta">
                    <div>ID: {routeDetails.deviceId}</div>
                    <div>Name: {routeDetails.deviceName}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {terminalDetails ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalCard">
            <div className="modalHeader">
              <div>
                <div className="modalTitle">{terminalDetails.name}</div>
                <div className="modalMeta">
                  {terminalDetails.code} · {terminalDetails.location}
                </div>
              </div>
              <div className="modalActions">
                <button className="demoBtn demoBtnGhost" onClick={() => setTerminalDetailsId(null)}>
                  Close
                </button>
              </div>
            </div>
            <div className="modalBody">
              <div className="split">
                <div className="panel">
                  <div className="panelTitle">Status</div>
                  <div className="panelMeta">
                    <div>Status: {terminalDetails.status}</div>
                    <div>
                      Devices: {terminalDetails.devicesOnline}/{terminalDetails.devicesTotal}
                    </div>
                    <div>Last sync: {terminalDetails.lastSync}</div>
                    <div>Note: {terminalDetails.note || '-'}</div>
                  </div>
                </div>
                <div className="panel">
                  <div className="panelTitle">Context</div>
                  <div className="panelMeta">
                    This modal groups the same information visible in the terminal row into a focused
                    view, like the detail page in the design.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deliveryDetails ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalCard">
            <div className="modalHeader">
              <div>
                <div className="modalTitle">{deliveryDetails.reference}</div>
                <div className="modalMeta">
                  {deliveryDetails.terminalFrom} → {deliveryDetails.terminalTo} ·{' '}
                  {deliveryDetails.deviceName}
                </div>
              </div>
              <div className="modalActions">
                <button
                  className="demoBtn"
                  onClick={() =>
                    setDeliveries((prev) =>
                      prev.map((x) =>
                        x.id === deliveryDetails.id ? { ...x, status: 'In Transit' } : x,
                      ),
                    )
                  }
                  disabled={!canAdmin}
                >
                  Mark in transit
                </button>
                <button className="demoBtn demoBtnGhost" onClick={() => setDeliveryDetailsId(null)}>
                  Close
                </button>
              </div>
            </div>
            <div className="modalBody">
              <div className="split">
                <div className="panel">
                  <div className="panelTitle">Delivery details</div>
                  <div className="panelMeta">
                    <div>Status: {deliveryDetails.status}</div>
                    <div>Priority: {deliveryDetails.priority}</div>
                    <div>ETA: {deliveryDetails.eta}</div>
                    <div>Created: {deliveryDetails.createdAt}</div>
                  </div>
                </div>
                <div className="panel">
                  <div className="panelTitle">Linked device</div>
                  <div className="panelMeta">
                    <div>Device ID: {deliveryDetails.deviceId}</div>
                    <div>Device name: {deliveryDetails.deviceName}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deliveryOperationDetails ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalCard" style={{ width: 'min(95vw, 1400px)', maxWidth: '95vw' }}>
            <div className="modalHeader">
              <div>
                <div className="modalTitle">{deliveryOperationDetails.orderCode}</div>
                <div className="modalMeta">
                  {deliveryOperationDetails.origin} → {deliveryOperationDetails.destination} ·{' '}
                  {deliveryOperationDetails.handler}
                </div>
              </div>
              <div className="modalActions">
                {deliveryOperationDetails.status === 'Unverified' ? (
                  <button
                    className="demoBtn"
                    onClick={() => {
                      setDeliveryOperations((prev) =>
                        prev.map((op) =>
                          op.id === deliveryOperationDetails.id
                            ? { ...op, status: 'Verified' }
                            : op,
                        ),
                      )
                    }}
                  >
                    Verify
                  </button>
                ) : null}
                {deliveryOperationDetails.status === 'Arrived' ? (
                  <button
                    className="demoBtn"
                    onClick={() => {
                      setDeliveryOperations((prev) =>
                        prev.map((op) =>
                          op.id === deliveryOperationDetails.id
                            ? { ...op, status: 'Completed' }
                            : op,
                        ),
                      )
                      setDeliveryOpDetailsId(null)
                    }}
                  >
                    Mark completed
                  </button>
                ) : null}
                <button
                  className="demoBtn demoBtnGhost"
                  onClick={() => setDeliveryOpDetailsId(null)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="modalBody" style={{ overflowX: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 28%) 1fr', gap: '1.25rem', alignItems: 'start', minWidth: 0 }}>
                <div className="panel" style={{ minWidth: 0 }}>
                  <div className="panelTitle">Operation flow</div>
                  <ul className="timelineList">
                    <li className="timelineItem">
                      <span className="timelineText">
                        1. Select route (status: select_route_processing)
                      </span>
                      <button
                        className="miniBtn"
                        onClick={() =>
                          setDeliveryOperations((prev) =>
                            prev.map((op) =>
                              op.id === deliveryOperationDetails.id
                                ? { ...op, status: 'SelectRoute' }
                                : op,
                            ),
                          )
                        }
                      >
                        Set
                      </button>
                    </li>
                    <li className="timelineItem">
                      <span className="timelineText">
                        2. Assign drone (status: select_drone_processing)
                      </span>
                      <button
                        className="miniBtn"
                        onClick={() =>
                          setDeliveryOperations((prev) =>
                            prev.map((op) =>
                              op.id === deliveryOperationDetails.id
                                ? { ...op, status: 'SelectDrone' }
                                : op,
                            ),
                          )
                        }
                      >
                        Set
                      </button>
                    </li>
                    <li className="timelineItem">
                      <span className="timelineText">
                        3. Start mission (status: in_transit_processing)
                      </span>
                      <button
                        className="miniBtn"
                        onClick={() =>
                          setDeliveryOperations((prev) =>
                            prev.map((op) =>
                              op.id === deliveryOperationDetails.id
                                ? { ...op, status: 'InTransit' }
                                : op,
                            ),
                          )
                        }
                      >
                        Start
                      </button>
                    </li>
                    <li className="timelineItem">
                      <span className="timelineText">
                        4. Arrived at terminal (status: arrived_order)
                      </span>
                      <button
                        className="miniBtn"
                        onClick={() =>
                          setDeliveryOperations((prev) =>
                            prev.map((op) =>
                              op.id === deliveryOperationDetails.id
                                ? { ...op, status: 'Arrived' }
                                : op,
                            ),
                          )
                        }
                      >
                        Arrived
                      </button>
                    </li>
                    <li className="timelineItem">
                      <span className="timelineText">
                        5. Complete order (status: completed_order)
                      </span>
                      <button
                        className="miniBtn"
                        onClick={() =>
                          setDeliveryOperations((prev) =>
                            prev.map((op) =>
                              op.id === deliveryOperationDetails.id
                                ? { ...op, status: 'Completed' }
                                : op,
                            ),
                          )
                        }
                      >
                        Complete
                      </button>
                    </li>
                  </ul>
                  <div className="panelMeta">
                    These buttons simulate the backend flow described in
                    `GUARDIANX_DELIVERY_SURVEILLANCE_FLOW.md`: verify, processing, in transit, and
                    completion.
                  </div>
                </div>
                <div className="panel" style={{ minWidth: 0, overflow: 'visible' }}>
                  <div className="panelTitle">Package List Status</div>
                  <table className="demoTable" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '40%' }}>Attribute</th>
                        <th style={{ width: '60%' }}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveryOpPackages.map((pkg) =>
                        pkg.map((attr) => (
                          <tr key={`${attr.id}-${attr.name}`}>
                            <td style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{attr.name}</td>
                            <td style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{attr.value}</td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {surveillanceDetails ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalCard" style={{ maxWidth: 'min(1200px, 100%)' }}>
            <div className="modalHeader">
              <div>
                <div className="modalTitle" style={{ fontSize: '0.95rem' }}>
                  Survey Mission · Detailed Information
                </div>
                <div className="modalMeta">{surveillanceDetails.code} — {surveillanceDetails.name}</div>
              </div>
              <div className="modalActions">
                <button
                      className="demoBtn demoBtnGhost"
                      onClick={() => {
                        setSurveillanceDetailsId(null)
                        setSurveillanceEditMode(false)
                        setSurveillanceEditDraft(null)
                      }}
                    >
                      Close
                    </button>
                {surveillanceDetails.status !== 'Rejected' && surveillanceDetails.status !== 'Completed' ? (
                  <>
                    <button
                      className="demoBtn demoBtnGhost"
                      onClick={() => {
                        setSurveillanceEditMode(true)
                        setSurveillanceEditDraft({
                          name: surveillanceDetails.name,
                          region: surveillanceDetails.region,
                        })
                      }}
                    >
                      Edit
                    </button>
                    {surveillanceDetails.status === 'PendingApproval' ? (
                      <>
                        <button className="demoBtn demoBtnGhost" onClick={() => setShowSurveillanceRejectModal(true)}>Reject</button>
                        <button
                        className="demoBtn"
                        onClick={() => {
                          setSurveillanceProfiles((prev) =>
                            prev.map((p) =>
                              p.id === surveillanceDetails.id
                                ? { ...p, status: 'PendingDeviceCheck' as const }
                                : p,
                            ),
                          )
                          setSurveillanceDetailsId(null)
                          setSurveillanceEditMode(false)
                          setSurveillanceEditDraft(null)
                        }}
                      >
                        Approve
                      </button>
                      </>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
            <div className="modalBody">
              {surveillanceEditMode && surveillanceEditDraft ? (
                <div className="panel" style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
                  <div className="panelTitle">Edit profile</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 400 }}>
                    <label className="demoField">
                      <span>Name</span>
                      <input
                        value={surveillanceEditDraft.name}
                        onChange={(e) =>
                          setSurveillanceEditDraft((d) => (d ? { ...d, name: e.target.value } : null))
                        }
                      />
                    </label>
                    <label className="demoField">
                      <span>Region</span>
                      <input
                        value={surveillanceEditDraft.region}
                        onChange={(e) =>
                          setSurveillanceEditDraft((d) => (d ? { ...d, region: e.target.value } : null))
                        }
                      />
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="demoBtn"
                        onClick={() => {
                          if (!surveillanceEditDraft) return
                          setSurveillanceProfiles((prev) =>
                            prev.map((p) =>
                              p.id === surveillanceDetails.id
                                ? { ...p, name: surveillanceEditDraft.name, region: surveillanceEditDraft.region }
                                : p,
                            ),
                          )
                          setSurveillanceEditMode(false)
                          setSurveillanceEditDraft(null)
                        }}
                      >
                        Save
                      </button>
                      <button
                        className="demoBtn demoBtnGhost"
                        onClick={() => {
                          setSurveillanceEditMode(false)
                          setSurveillanceEditDraft(null)
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
              {surveillanceDetails.status === 'Rejected' && surveillanceDetails.rejection_reason ? (
                <div className="panel" style={{ gridColumn: '1 / -1', backgroundColor: 'rgba(120,53,15,0.2)', border: '1px solid rgba(180,83,9,0.4)', marginBottom: '1rem' }}>
                  <div className="panelMeta">{surveillanceDetails.rejection_reason}</div>
                </div>
              ) : null}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="panel">
                    <div className="panelTitle" style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '1rem' }}>General</div>
                    <div className="panelMeta" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {[
                        { label: 'SurveyMission.Name', value: surveillanceDetails.name },
                        { label: 'Maximum Number of Drones', value: String(surveillanceDetails.maximum_drones) },
                        { label: 'SurveyMission.Purpose', value: surveillanceDetails.purpose__name },
                        { label: 'SurveyMission.Log Collection', value: surveillanceDetails.log_collection ? 'Allow' : 'Not Allow' },
                        { label: 'SurveyMission.Video Recording', value: surveillanceDetails.video_recording ? 'Allow' : 'Not Allow' },
                        { label: 'SurveyMission.Video Analysis', value: surveillanceDetails.video_analysis ? 'Allow' : 'Not Allow' },
                        { label: 'SurveyMission.Capture Altitude', value: `${surveillanceDetails.capture_altitude} m` },
                        { label: 'SurveyMission.Total Distance', value: `${surveillanceDetails.total_distance} m` },
                        { label: 'SurveyMission.Total Estimated Time', value: `${surveillanceDetails.estimated_time} min` },
                        { label: 'Region', value: surveillanceDetails.region },
                        { label: 'Note', value: surveillanceDetails.note || '-' },
                      ].map((row, i) => (
                        <div key={row.label} style={{ borderBottom: i < 10 ? '1px solid rgba(148,163,184,0.25)' : 'none', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                          <span>{row.label.replace('SurveyMission.', '')}</span>
                          <span>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panelTitle" style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '1rem' }}>Flight speed and altitude chart</div>
                    <div style={{ width: '100%', height: '280px', position: 'relative', background: 'rgba(15,23,42,0.6)', borderRadius: 8 }}>
                      <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
                        <defs>
                          <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7086FD" stopOpacity="0.4" /><stop offset="100%" stopColor="#7086FD" stopOpacity="0" /></linearGradient>
                          <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6FD195" stopOpacity="0.4" /><stop offset="100%" stopColor="#6FD195" stopOpacity="0" /></linearGradient>
                        </defs>
                        <line x1="40" y1="20" x2="40" y2="200" stroke="rgba(148,163,184,0.4)" strokeWidth="1" />
                        <line x1="40" y1="200" x2="380" y2="200" stroke="rgba(148,163,184,0.4)" strokeWidth="1" />
                        <text x="200" y="215" fill="rgba(148,163,184,0.9)" fontSize="10" textAnchor="middle">Cumulative Distance (m)</text>
                        <text x="15" y="110" fill="rgba(148,163,184,0.9)" fontSize="10" textAnchor="middle" transform="rotate(-90, 15, 110)">Value</text>
                        {surveillanceDetails.chart_data.length > 0 ? (() => {
                          const xs = surveillanceDetails.chart_data.map((_, i) => 40 + (i / Math.max(1, surveillanceDetails.chart_data.length - 1)) * 340)
                          const speedMax = Math.max(...surveillanceDetails.chart_data.map((d) => d.cruise_speed), 1)
                          const altMax = Math.max(...surveillanceDetails.chart_data.map((d) => d.operating_altitude), 1)
                          const scaleY = 160 / Math.max(speedMax, altMax)
                          const speedPoints = surveillanceDetails.chart_data.map((d, i) => `${xs[i]},${200 - d.cruise_speed * scaleY}`).join(' ')
                          const altPoints = surveillanceDetails.chart_data.map((d, i) => `${xs[i]},${200 - d.operating_altitude * scaleY}`).join(' ')
                          return (
                            <>
                              <polyline fill="none" stroke="#7086FD" strokeWidth="2" points={speedPoints} />
                              <polyline fill="none" stroke="#6FD195" strokeWidth="2" points={altPoints} />
                              {surveillanceDetails.chart_data.map((d, i) => (
                                <circle key={i} cx={xs[i]} cy={200 - d.cruise_speed * scaleY} r="4" fill="#7086FD" />
                              ))}
                              {surveillanceDetails.chart_data.map((d, i) => (
                                <circle key={`alt-${i}`} cx={xs[i]} cy={200 - d.operating_altitude * scaleY} r="4" fill="#6FD195" />
                              ))}
                              <text x="360" y="30" fill="#7086FD" fontSize="10">Cruise Speed (m/s)</text>
                              <text x="360" y="44" fill="#6FD195" fontSize="10">Altitude/Z</text>
                            </>
                          )
                        })() : null}
                      </svg>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="panel" style={{ flex: 1, minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
                    <div className="panelTitle" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Map</div>
                    <div style={{ flex: 1, background: 'rgba(15,23,42,0.85)', borderRadius: 8, border: '1px solid rgba(148,163,184,0.2)', padding: '0.5rem' }}>
                      <svg
                        viewBox="0 0 400 260"
                        preserveAspectRatio="xMidYMid meet"
                        style={{ width: '100%', height: '100%', display: 'block' }}
                        aria-label="Surveillance mission map"
                      >
                        <defs>
                          <linearGradient id="survMapBg" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(30,41,59,0.6)" />
                            <stop offset="100%" stopColor="rgba(15,23,42,0.9)" />
                          </linearGradient>
                          <filter id="survWpGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="1" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <rect x="0" y="0" width="400" height="260" fill="url(#survMapBg)" />
                        {Array.from({ length: 11 }, (_, i) => (
                          <line
                            key={`mx${i}`}
                            x1={0}
                            y1={30 + i * 18}
                            x2={400}
                            y2={30 + i * 18}
                            stroke="rgba(30,64,175,0.25)"
                            strokeWidth="0.5"
                          />
                        ))}
                        {Array.from({ length: 21 }, (_, i) => (
                          <line
                            key={`my${i}`}
                            x1={20 + i * 18}
                            y1={20}
                            x2={20 + i * 18}
                            y2={240}
                            stroke="rgba(30,64,175,0.25)"
                            strokeWidth="0.5"
                          />
                        ))}
                        {surveillanceDetails.chart_data.length > 0 ? (() => {
                          const pts = surveillanceDetails.chart_data
                          const xs = pts.map((_, i) => 30 + (i / Math.max(1, pts.length - 1)) * 340)
                          const ys = pts.map((d) => 220 - d.operating_altitude * 1.2)
                          const poly = xs.map((x, i) => `${x},${ys[i]}`).join(' ')
                          return (
                            <>
                              <polyline
                                points={poly}
                                fill="none"
                                stroke="rgba(59,130,246,0.85)"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              {pts.map((d, i) => {
                                const x = xs[i]
                                const y = ys[i]
                                const isSelected = selectedWaypoint?.name === d.waypointName
                                return (
                                  <g
                                    key={d.order}
                                    filter="url(#survWpGlow)"
                                    onClick={() =>
                                      setSelectedWaypoint({
                                        lat: 21.0 + i * 0.001,
                                        lng: 105.8 + i * 0.001,
                                        name: d.waypointName,
                                      })
                                    }
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r={isSelected ? 6 : 4}
                                      fill={isSelected ? 'rgba(34,197,94,0.95)' : 'rgba(59,130,246,0.95)'}
                                      stroke="rgba(15,23,42,0.9)"
                                      strokeWidth="1.4"
                                    />
                                    <text
                                      x={x}
                                      y={y - 8}
                                      textAnchor="middle"
                                      fill="rgba(226,232,240,0.95)"
                                      fontSize="9"
                                    >
                                      {d.waypointName}
                                    </text>
                                  </g>
                                )
                              })}
                              <text x="16" y="32" fill="rgba(148,163,184,0.9)" fontSize="9">
                                N
                              </text>
                              <path d="M16 34 L16 46 L12 40 L16 46 L20 40 Z" fill="rgba(148,163,184,0.7)" />
                            </>
                          )
                        })() : (
                          <text
                            x="200"
                            y="140"
                            textAnchor="middle"
                            fill="rgba(148,163,184,0.7)"
                            fontSize="12"
                          >
                            No waypoints — map preview unavailable
                          </text>
                        )}
                      </svg>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panelTitle" style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>SurveyMission.Waypoint Details</div>
                    <div className="panelMeta" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {[
                        { label: 'Command', value: selectedWaypoint ? 'WAYPOINT' : '-' },
                        { label: 'Frame', value: selectedWaypoint ? 'GLOBAL' : '-' },
                        { label: 'Param 1', value: selectedWaypoint ? '0' : '-' },
                        { label: 'Param 2', value: selectedWaypoint ? '0' : '-' },
                        { label: 'Param 3', value: selectedWaypoint ? '0' : '-' },
                        { label: 'Param 4', value: selectedWaypoint ? '0' : '-' },
                        { label: 'Latitude', value: selectedWaypoint ? String(selectedWaypoint.lat) : '-' },
                        { label: 'Longitude', value: selectedWaypoint ? String(selectedWaypoint.lng) : '-' },
                        { label: 'SurveyMission.Altitude', value: selectedWaypoint ? '10.0' : '-' },
                      ].map((row, i) => (
                        <div key={row.label} style={{ borderBottom: i < 8 ? '1px solid rgba(148,163,184,0.25)' : 'none', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                          <span>{row.label.replace('SurveyMission.', '')}</span>
                          <span>{row.value}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'rgba(148,163,184,0.7)' }}>Click a waypoint on the map to see details (mock).</div>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panelTitle">Lifecycle actions (mock)</div>
                    <div className="panelMeta" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <button className="miniBtn" onClick={() => setSurveillanceProfiles((prev) => prev.map((p) => (p.id === surveillanceDetails.id ? { ...p, status: 'PendingApproval' as const } : p)))}>Set pending approval</button>
                      <button className="miniBtn" onClick={() => setSurveillanceProfiles((prev) => prev.map((p) => (p.id === surveillanceDetails.id ? { ...p, status: 'PendingDeviceCheck' as const } : p)))}>Complete approval</button>
                      <button className="miniBtn" onClick={() => setSurveillanceProfiles((prev) => prev.map((p) => (p.id === surveillanceDetails.id ? { ...p, status: 'InProgress' as const } : p)))}>Activate mission</button>
                      <button className="miniBtn" onClick={() => setSurveillanceProfiles((prev) => prev.map((p) => (p.id === surveillanceDetails.id ? { ...p, status: 'Completed' as const } : p)))}>Complete mission</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {showSurveillanceRejectModal && surveillanceDetailsId ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalCard modalSmall">
            <div className="modalHeader">
              <div className="modalTitle">Reject Mission</div>
              <button className="demoBtn demoBtnGhost" onClick={() => setShowSurveillanceRejectModal(false)}>Cancel</button>
            </div>
            <div className="modalBody">
              <p style={{ marginBottom: '0.75rem' }}>Enter the reason or feedback so the creator can revise and resubmit.</p>
              <label className="demoField" style={{ display: 'block', marginBottom: '1rem' }}>
                <span>Reason</span>
                <input value={surveillanceRejectReason} onChange={(e) => setSurveillanceRejectReason(e.target.value)} placeholder="Reason (required)" />
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="demoBtn demoBtnGhost" onClick={() => setShowSurveillanceRejectModal(false)}>Cancel</button>
                <button
                className="demoBtn"
                onClick={() => {
                  const id = surveillanceDetailsId
                  setSurveillanceProfiles((prev) =>
                    prev.map((p) =>
                      p.id === id
                        ? {
                            ...p,
                            status: 'Rejected' as const,
                            rejection_reason:
                              surveillanceRejectReason || 'Rejected by operator.',
                          }
                        : p,
                    ),
                  )
                  setSurveillanceDetailsId(null)
                  setShowSurveillanceRejectModal(false)
                  setSurveillanceRejectReason('')
                  setSurveillanceEditMode(false)
                  setSurveillanceEditDraft(null)
                }}
              >
                Reject
              </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function DeviceModal(props: {
  mode: 'add' | 'edit'
  role: Role
  devices: Device[]
  deviceId?: string
  onClose: () => void
  onAdd: (d: Omit<Device, 'id' | 'lastSeen'>) => void
  onUpdate: (deviceId: string, patch: Partial<Device>) => void
}): ReactNode {
  const { mode, role, devices, deviceId, onClose, onAdd, onUpdate } = props
  const canAdmin = role === 'Admin'
  const editing = mode === 'edit' ? devices.find((d) => d.id === deviceId) ?? null : null

  const [name, setName] = useState(editing?.name ?? '')
  const [model, setModel] = useState(editing?.model ?? 'UD-H40')
  const [mainType, setMainType] = useState<Device['mainType']>(editing?.mainType ?? 'Drone')
  const [manufacturer, setManufacturer] = useState(editing?.manufacturer ?? 'Gaion')
  const [deviceCode, setDeviceCode] = useState(editing?.deviceId ?? 'DR1234')
  const [payload, setPayload] = useState(editing?.payload ?? '5kg')
  const [rtspUrl, setRtspUrl] = useState(editing?.rtspUrl ?? 'RTSP://D1234')
  const [linkedTerminal, setLinkedTerminal] = useState(editing?.linkedTerminal ?? 'Terminal 1')
  const [location, setLocation] = useState(editing?.location ?? 'Terminal 1')
  const [note, setNote] = useState(editing?.note ?? '')
  const [status, setStatus] = useState<DeviceStatus>(editing?.status ?? 'Active')

  const submit = () => {
    if (!canAdmin) return
    if (!name.trim()) return
    if (mode === 'add') {
      onAdd({
        name,
        model,
        mainType,
        manufacturer,
        imageUrl: '/figma/guardianx/drone-quad-new.png',
        active: status === 'Active' || status === 'On Mission',
        inUse: status === 'On Mission',
        status,
        deviceId: deviceCode,
        payload,
        rtspUrl,
        color: '#2563eb',
        linkedTerminal,
        location,
        note,
      })
      onClose()
      return
    }
    if (editing) {
      onUpdate(editing.id, {
        name,
        model,
        mainType,
        manufacturer,
        status,
        deviceId: deviceCode,
        payload,
        rtspUrl,
        linkedTerminal,
        location,
        note,
        active: status === 'Active' || status === 'On Mission',
        inUse: status === 'On Mission',
      })
      onClose()
    }
  }

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalCard">
        <div className="modalHeader">
          <div>
            <div className="modalTitle">{mode === 'add' ? 'Add camera' : 'Edit camera'}</div>
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
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="machine_001" />
            </label>
            <label className="demoField">
              <span>Model / Platform</span>
              <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="UD-H40" />
            </label>
            <label className="demoField">
              <span>Main type</span>
              <select value={mainType} onChange={(e) => setMainType(e.target.value as Device['mainType'])}>
                <option value="Drone">Drone</option>
                <option value="Robot">Robot</option>
              </select>
            </label>
            <label className="demoField">
              <span>Manufacturer</span>
              <input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
            </label>
            <label className="demoField">
              <span>Device ID</span>
              <input value={deviceCode} onChange={(e) => setDeviceCode(e.target.value)} />
            </label>
            <label className="demoField">
              <span>Payload</span>
              <input value={payload} onChange={(e) => setPayload(e.target.value)} />
            </label>
            <label className="demoField">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as DeviceStatus)}>
                <option value="Active">Active</option>
                <option value="On Mission">On Mission</option>
                <option value="Warning">Warning</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
            <label className="demoField">
              <span>RTSP URL</span>
              <input value={rtspUrl} onChange={(e) => setRtspUrl(e.target.value)} />
            </label>
            <label className="demoField">
              <span>Linked terminal</span>
              <input value={linkedTerminal} onChange={(e) => setLinkedTerminal(e.target.value)} />
            </label>
            <label className="demoField">
              <span>Location</span>
              <input value={location} onChange={(e) => setLocation(e.target.value)} />
            </label>
            <label className="demoField">
              <span>Note</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
          </div>
          {!canAdmin ? <div className="demoHint">Switch role to Admin to edit device configuration.</div> : null}
        </div>
      </div>
    </div>
  )
}

