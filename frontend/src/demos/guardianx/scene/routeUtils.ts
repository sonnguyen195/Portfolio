/**
 * Shared route curve for holograms and drone flight.
 */
import * as THREE from 'three'
import { MOCK_MISSIONS } from '../data'

const ROUTE_OFFSET = 2.2

export function createRoutePoints(): [number, number, number][] {
  const points: [number, number, number][] = []
  if (MOCK_MISSIONS.length > 0 && MOCK_MISSIONS[0].polygon.length >= 2) {
    const poly = MOCK_MISSIONS[0].polygon
    poly.forEach(([lat, lon]) => {
      points.push([(lon - 127) * 0.4, 0.5, (lat - 37.5) * 0.4])
    })
    points.push(points[0])
  } else {
    points.push([-ROUTE_OFFSET, 0.5, -ROUTE_OFFSET])
    points.push([ROUTE_OFFSET, 0.5, -ROUTE_OFFSET])
    points.push([ROUTE_OFFSET, 0.5, ROUTE_OFFSET])
    points.push([-ROUTE_OFFSET, 0.5, ROUTE_OFFSET])
    points.push([-ROUTE_OFFSET, 0.5, -ROUTE_OFFSET])
  }
  return points
}

export function createRouteCurve(): THREE.CatmullRomCurve3 {
  const pts = createRoutePoints()
  return new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)))
}
