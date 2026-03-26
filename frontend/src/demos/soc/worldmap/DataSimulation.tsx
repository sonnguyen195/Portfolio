/**
 * Data simulation — generates random attack events from geo.json country centroids.
 * Arc lifetime is measured in animation cycles (not wall-clock ms) so arcs only
 * disappear near a missile-cycle boundary — never visually mid-flight.
 *
 * Cycle number is derived from wall-clock time using TRAVEL_CYCLE_MS (must match
 * ArcTravelTimeContext.TRAVEL_CYCLE × 1000). This avoids a circular provider
 * dependency (AttackArcProvider → ArcTravelTimeProvider → AttackArcProvider).
 */
import { useEffect, useRef, useState } from 'react'
import { pushMessage } from '../../ui/ai'
import type { AttackArc } from './attackArcData'
import { pickRandomArcPair, pickRandomArcPairExcluding } from '../map/geoCoordinates'

let simArcId = 100

/** Must match ArcTravelTimeContext.TRAVEL_CYCLE × 1000 */
const TRAVEL_CYCLE_MS     = 2000
const MIN_CYCLES          = 30
const MAX_CYCLES          = 50
const INITIAL_SIM_COUNT   = 8
const MAX_ACTIVE_SIM_ARCS = 12
const SPAWN_INTERVAL_MS   = 1000

/** Epoch ms when the simulation started — used as cycle-zero reference. */
const SIM_START_MS = Date.now()

function cycleAt(ms: number): number {
  return Math.floor((ms - SIM_START_MS) / TRAVEL_CYCLE_MS)
}

type SimulatedArc = AttackArc & {
  /** Cycle index when this arc was born. */
  bornAtCycle: number
  /** How many full missile loops this arc lives for (random MIN–MAX). */
  maxCycles: number
}

function createRandomArc(existingArcs: AttackArc[], bornAtCycle: number): SimulatedArc {
  const excludeDsts = existingArcs.map((a) => ({ lon: a.dstLon, lat: a.dstLat }))
  const { src, dst } = excludeDsts.length > 0
    ? pickRandomArcPairExcluding(excludeDsts)
    : pickRandomArcPair()
  return {
    id: `sim-${++simArcId}`,
    srcLon: src.lon,
    srcLat: src.lat,
    dstLon: dst.lon,
    dstLat: dst.lat,
    severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as AttackArc['severity'],
    arcType: ['attack', 'defense', 'system'][Math.floor(Math.random() * 3)] as AttackArc['arcType'],
    bornAtCycle,
    maxCycles: MIN_CYCLES + Math.floor(Math.random() * (MAX_CYCLES - MIN_CYCLES + 1)),
  }
}

/** Hook: cycle-bounded simulated arcs — line + impact markers disappear together at cycle end. */
export function useAttackArcs(): AttackArc[] {
  const [simulated, setSimulated] = useState<SimulatedArc[]>(() => {
    // All initial arcs start at cycle 0. Random maxCycles (30–50) spreads
    // their expiry naturally over a 40-cycle / 80-second window.
    const arcs: SimulatedArc[] = []
    const existing: AttackArc[] = []
    for (let i = 0; i < INITIAL_SIM_COUNT; i++) {
      const arc = createRandomArc(existing, 0)
      arcs.push(arc)
      existing.push(arc)
    }
    return arcs
  })

  // Prevent pushing messages during React's render/update phase.
  const announcedAttackArcIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    for (const arc of simulated) {
      if (arc.arcType === 'attack') announcedAttackArcIdsRef.current.add(arc.id)
    }
    // Intentionally run once with the initial `simulated` value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const aliveIds = new Set(simulated.map((arc) => arc.id))
    for (const announcedId of announcedAttackArcIdsRef.current) {
      if (!aliveIds.has(announcedId)) announcedAttackArcIdsRef.current.delete(announcedId)
    }

    const nextAttackArcs = simulated.filter(
      (arc) => arc.arcType === 'attack' && !announcedAttackArcIdsRef.current.has(arc.id)
    )
    nextAttackArcs.forEach((arc) => {
      announcedAttackArcIdsRef.current.add(arc.id)
      pushMessage(
        `Threat detected: ${arc.srcLon.toFixed(1)}°,${arc.srcLat.toFixed(1)}° → ${arc.dstLon.toFixed(1)}°,${arc.dstLat.toFixed(1)}°`,
        'alert'
      )
    })
  }, [simulated])

  useEffect(() => {
    const iv = setInterval(() => {
      const currentCycle = cycleAt(Date.now())
      setSimulated((prev) => {
        // Arcs expire only on a cycle boundary — the check fires every 1 s but
        // `currentCycle` only increments every TRAVEL_CYCLE_MS (2 s), so an arc
        // never vanishes mid-flight.
        const alivePrev = prev.filter(
          (arc) => currentCycle - arc.bornAtCycle < arc.maxCycles
        )
        const existing: AttackArc[] = [...alivePrev]
        const nextArc = createRandomArc(existing, currentCycle)
        const next = [...alivePrev, nextArc]
        if (next.length > MAX_ACTIVE_SIM_ARCS) {
          next.splice(0, next.length - MAX_ACTIVE_SIM_ARCS)
        }
        return next
      })
    }, SPAWN_INTERVAL_MS)

    return () => clearInterval(iv)
  }, [])

  return simulated
}
