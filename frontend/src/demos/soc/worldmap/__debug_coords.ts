/**
 * Debug: compare projectEcef vs lonLatToSphere for same (lon, lat).
 * Run: npx ts-node src/demos/soc/worldmap/__debug_coords.ts
 */
const R = 10

function projectEcef(lon: number, lat: number, alt: number, r: number) {
  const n = (lon * Math.PI) / 180
  const latRad = (lat * Math.PI) / 180
  const i = Math.cos(latRad)
  const a = Math.sin(latRad)
  return {
    x: -(1 + alt) * i * Math.cos(n) * r,
    y: (1 + alt) * a * r,
    z: (1 + alt) * i * Math.sin(n) * r,
  }
}

function lonLatToSphere(lon: number, lat: number, r: number) {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = (lon * Math.PI) / 180
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.sin(theta),
  }
}

const testPoints = [
  { lon: 0, lat: 0 },
  { lon: 90, lat: 0 },
  { lon: -84, lat: 10 },
  { lon: 139.7, lat: 35.7 },
]

console.log('R =', R)
console.log('--- projectEcef vs lonLatToSphere (alt=0) ---\n')

for (const p of testPoints) {
  const ecef = projectEcef(p.lon, p.lat, 0, R)
  const sphere = lonLatToSphere(p.lon, p.lat, R)
  const same = Math.abs(ecef.x - sphere.x) < 1e-6 && Math.abs(ecef.y - sphere.y) < 1e-6 && Math.abs(ecef.z - sphere.z) < 1e-6
  console.log(`(${p.lon}, ${p.lat}):`)
  console.log('  projectEcef:', ecef)
  console.log('  lonLatToSphere:', sphere)
  console.log('  same?', same, same ? '' : `diff x=${ecef.x - sphere.x}`)
  console.log()
}
