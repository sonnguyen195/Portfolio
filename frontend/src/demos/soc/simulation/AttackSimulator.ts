/**
 * Generates randomised attack events from geoCentroids.json.
 * Fires a new attack every `intervalMs` ms and calls onAttack().
 */

import { CITY_POOL } from './worldCities'
import {
  type Attack,
  type AttackType,
  ATTACK_COLORS,
  EVENT_CODES,
} from './attackTypes'

const EVENT_TYPES: AttackType[] = [...EVENT_CODES]

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export type AttackCallback = (attack: Attack) => void

export class AttackSimulator {
  private timer:      ReturnType<typeof setInterval> | null = null
  private _interval:  number

  // How many attacks to fire each tick (burst mode for density)
  private _batchSize = 5

  constructor(
    private readonly onAttack: AttackCallback,
    intervalMs = 50,
  ) {
    this._interval = intervalMs
  }

  start(): void {
    if (this.timer) return
    this.timer = setInterval(() => {
      for (let i = 0; i < this._batchSize; i++) this._fire()
    }, this._interval)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  setInterval(ms: number): void {
    this._interval = ms
    if (this.timer) {
      this.stop()
      this.start()
    }
  }

  private _fire(): void {
    if (CITY_POOL.length < 2) return

    // Pick two distinct cities from the pool
    let srcIdx = Math.floor(Math.random() * CITY_POOL.length)
    let dstIdx
    do { dstIdx = Math.floor(Math.random() * CITY_POOL.length) }
    while (dstIdx === srcIdx)

    const [srcLon, srcLat] = CITY_POOL[srcIdx]
    const [dstLon, dstLat] = CITY_POOL[dstIdx]
    const type = rand(EVENT_TYPES)

    this.onAttack({
      id:        uid(),
      src:       { lon: srcLon, lat: srcLat },
      dst:       { lon: dstLon, lat: dstLat },
      type,
      color:     ATTACK_COLORS[type],
      timestamp: Date.now(),
    })
  }
}
