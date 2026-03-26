/**
 * Curated list of ~160 major world cities used as realistic attack/target
 * coordinates. Concentrated in the same "hot zones" seen in Kaspersky-style
 * threat maps: Europe, Russia, East Asia, North America, Middle East, South Asia.
 */

export type WorldCityDef = { lon: number; lat: number; label: string }

const WORLD_CITY_DEFS: readonly WorldCityDef[] = [
  { lon: -74.006, lat: 40.714, label: 'NEW YORK' },
  { lon: -118.243, lat: 34.052, label: 'LOS ANGELES' },
  { lon: -87.629, lat: 41.878, label: 'CHICAGO' },
  { lon: -95.369, lat: 29.76, label: 'HOUSTON' },
  { lon: -80.191, lat: 25.774, label: 'MIAMI' },
  { lon: -122.419, lat: 37.774, label: 'SAN FRANCISCO' },
  { lon: -77.036, lat: 38.907, label: 'WASHINGTON DC' },
  { lon: -71.058, lat: 42.36, label: 'BOSTON' },
  { lon: -112.074, lat: 33.448, label: 'PHOENIX' },
  { lon: -104.99, lat: 39.739, label: 'DENVER' },
  { lon: -122.332, lat: 47.606, label: 'SEATTLE' },
  { lon: -79.383, lat: 43.653, label: 'TORONTO' },
  { lon: -73.567, lat: 45.501, label: 'MONTREAL' },
  { lon: -123.12, lat: 49.282, label: 'VANCOUVER' },
  { lon: -99.133, lat: 19.432, label: 'MEXICO CITY' },
  { lon: -46.633, lat: -23.549, label: 'SÃO PAULO' },
  { lon: -43.172, lat: -22.906, label: 'RIO DE JANEIRO' },
  { lon: -58.381, lat: -34.603, label: 'BUENOS AIRES' },
  { lon: -70.649, lat: -33.459, label: 'SANTIAGO' },
  { lon: -77.042, lat: -12.046, label: 'LIMA' },
  { lon: -74.072, lat: 4.711, label: 'BOGOTÁ' },
  { lon: -0.127, lat: 51.507, label: 'LONDON' },
  { lon: 2.349, lat: 48.864, label: 'PARIS' },
  { lon: 13.405, lat: 52.52, label: 'BERLIN' },
  { lon: -3.703, lat: 40.416, label: 'MADRID' },
  { lon: 2.173, lat: 41.385, label: 'BARCELONA' },
  { lon: 12.496, lat: 41.903, label: 'ROME' },
  { lon: 9.189, lat: 45.464, label: 'MILAN' },
  { lon: 4.899, lat: 52.374, label: 'AMSTERDAM' },
  { lon: 4.351, lat: 50.846, label: 'BRUSSELS' },
  { lon: 16.373, lat: 48.208, label: 'VIENNA' },
  { lon: 8.551, lat: 47.366, label: 'ZURICH' },
  { lon: 18.068, lat: 59.329, label: 'STOCKHOLM' },
  { lon: 10.757, lat: 59.913, label: 'OSLO' },
  { lon: 12.568, lat: 55.676, label: 'COPENHAGEN' },
  { lon: 24.941, lat: 60.169, label: 'HELSINKI' },
  { lon: 21.017, lat: 52.237, label: 'WARSAW' },
  { lon: 14.421, lat: 50.087, label: 'PRAGUE' },
  { lon: 19.04, lat: 47.497, label: 'BUDAPEST' },
  { lon: 26.101, lat: 44.427, label: 'BUCHAREST' },
  { lon: 23.727, lat: 37.983, label: 'ATHENS' },
  { lon: 28.978, lat: 41.015, label: 'ISTANBUL' },
  { lon: 30.523, lat: 50.45, label: 'KYIV' },
  { lon: 24.105, lat: 56.946, label: 'RIGA' },
  { lon: 25.013, lat: 54.687, label: 'VILNIUS' },
  { lon: 24.753, lat: 59.437, label: 'TALLINN' },
  { lon: 17.107, lat: 48.148, label: 'BRATISLAVA' },
  { lon: 14.505, lat: 46.056, label: 'LJUBLJANA' },
  { lon: 15.978, lat: 45.814, label: 'ZAGREB' },
  { lon: 18.427, lat: 43.847, label: 'SARAJEVO' },
  { lon: 21.433, lat: 41.997, label: 'SKOPJE' },
  { lon: 19.818, lat: 41.327, label: 'TIRANA' },
  { lon: 20.463, lat: 44.804, label: 'BELGRADE' },
  { lon: 23.322, lat: 42.697, label: 'SOFIA' },
  { lon: 28.83, lat: 47.005, label: 'CHIȘINĂU' },
  { lon: 44.793, lat: 41.694, label: 'TBILISI' },
  { lon: 49.882, lat: 40.409, label: 'BAKU' },
  { lon: 44.509, lat: 40.18, label: 'YEREVAN' },
  { lon: 69.24, lat: 41.3, label: 'TASHKENT' },
  { lon: 74.59, lat: 42.87, label: 'BISHKEK' },
  { lon: 58.383, lat: 37.96, label: 'ASHGABAT' },
  { lon: 68.779, lat: 38.559, label: 'DUSHANBE' },
  { lon: 71.43, lat: 51.18, label: 'ASTANA (NUR-SULTAN)' },
  { lon: 76.889, lat: 43.238, label: 'ALMATY' },
  { lon: 37.617, lat: 55.755, label: 'MOSCOW' },
  { lon: 30.316, lat: 59.938, label: 'SAINT PETERSBURG' },
  { lon: 82.92, lat: 55.03, label: 'NOVOSIBIRSK' },
  { lon: 60.597, lat: 56.837, label: 'YEKATERINBURG' },
  { lon: 49.106, lat: 55.796, label: 'KAZAN' },
  { lon: 39.72, lat: 47.235, label: 'ROSTOV-ON-DON' },
  { lon: 73.369, lat: 54.984, label: 'OMSK' },
  { lon: 92.892, lat: 56.01, label: 'KRASNOYARSK' },
  { lon: 27.561, lat: 53.904, label: 'MINSK' },
  { lon: 55.27, lat: 25.204, label: 'DUBAI' },
  { lon: 54.366, lat: 24.466, label: 'ABU DHABI' },
  { lon: 46.717, lat: 24.686, label: 'RIYADH' },
  { lon: 50.586, lat: 26.215, label: 'MANAMA' },
  { lon: 51.531, lat: 25.286, label: 'DOHA' },
  { lon: 57.55, lat: 23.613, label: 'MUSCAT' },
  { lon: 44.39, lat: 33.341, label: 'BAGHDAD' },
  { lon: 51.388, lat: 35.689, label: 'TEHRAN' },
  { lon: 34.781, lat: 32.085, label: 'TEL AVIV' },
  { lon: 35.501, lat: 33.889, label: 'BEIRUT' },
  { lon: 31.235, lat: 30.044, label: 'CAIRO' },
  { lon: 35.921, lat: 31.952, label: 'AMMAN' },
  { lon: 36.291, lat: 33.51, label: 'DAMASCUS' },
  { lon: 44.013, lat: 36.191, label: 'ERBIL' },
  { lon: 39.822, lat: 21.423, label: 'MECCA' },
  { lon: 56.261, lat: 27.137, label: 'MANAMA AREA' },
  { lon: 72.877, lat: 19.076, label: 'MUMBAI' },
  { lon: 77.209, lat: 28.613, label: 'DELHI' },
  { lon: 77.594, lat: 12.972, label: 'BANGALORE' },
  { lon: 88.363, lat: 22.572, label: 'KOLKATA' },
  { lon: 80.27, lat: 13.082, label: 'CHENNAI' },
  { lon: 78.486, lat: 17.385, label: 'HYDERABAD' },
  { lon: 73.856, lat: 18.52, label: 'PUNE' },
  { lon: 72.585, lat: 23.021, label: 'AHMEDABAD' },
  { lon: 67.01, lat: 24.86, label: 'KARACHI' },
  { lon: 74.343, lat: 31.548, label: 'LAHORE' },
  { lon: 73.047, lat: 33.72, label: 'ISLAMABAD' },
  { lon: 85.314, lat: 27.707, label: 'KATHMANDU' },
  { lon: 90.407, lat: 23.723, label: 'DHAKA' },
  { lon: 79.861, lat: 6.927, label: 'COLOMBO' },
  { lon: 73.221, lat: 7.873, label: 'MALE' },
  { lon: 116.407, lat: 39.904, label: 'BEIJING' },
  { lon: 121.473, lat: 31.23, label: 'SHANGHAI' },
  { lon: 113.264, lat: 23.129, label: 'GUANGZHOU' },
  { lon: 114.057, lat: 22.543, label: 'SHENZHEN' },
  { lon: 114.158, lat: 22.285, label: 'HONG KONG' },
  { lon: 103.82, lat: 1.352, label: 'SINGAPORE (SE ASIA BUT FITS DENSITY)' },
  { lon: 121.565, lat: 25.032, label: 'TAIPEI' },
  { lon: 139.691, lat: 35.689, label: 'TOKYO' },
  { lon: 135.502, lat: 34.694, label: 'OSAKA' },
  { lon: 130.401, lat: 33.59, label: 'FUKUOKA' },
  { lon: 141.347, lat: 43.063, label: 'SAPPORO' },
  { lon: 126.977, lat: 37.566, label: 'SEOUL' },
  { lon: 129.075, lat: 35.179, label: 'BUSAN' },
  { lon: 127.024, lat: 37.62, label: 'SEOUL AREA' },
  { lon: 106.845, lat: 47.921, label: 'ULAANBAATAR' },
  { lon: 102.832, lat: 24.884, label: 'KUNMING' },
  { lon: 104.066, lat: 30.572, label: 'CHENGDU' },
  { lon: 108.948, lat: 34.263, label: 'XI\'AN' },
  { lon: 114.305, lat: 30.593, label: 'WUHAN' },
  { lon: 117, lat: 36.676, label: 'JINAN' },
  { lon: 117.19, lat: 39.125, label: 'TIANJIN' },
  { lon: 106.551, lat: 29.563, label: 'CHONGQING' },
  { lon: 120.153, lat: 30.287, label: 'HANGZHOU' },
  { lon: 118.796, lat: 32.061, label: 'NANJING' },
  { lon: 100.501, lat: 13.756, label: 'BANGKOK' },
  { lon: 106.66, lat: 10.762, label: 'HO CHI MINH CITY' },
  { lon: 105.845, lat: 21.028, label: 'HANOI' },
  { lon: 101.686, lat: 3.14, label: 'KUALA LUMPUR' },
  { lon: 106.827, lat: -6.175, label: 'JAKARTA' },
  { lon: 120.984, lat: 14.599, label: 'MANILA' },
  { lon: 96.156, lat: 16.84, label: 'YANGON' },
  { lon: 102.6, lat: 17.964, label: 'VIENTIANE' },
  { lon: 104.916, lat: 11.562, label: 'PHNOM PENH' },
  { lon: 3.379, lat: 6.524, label: 'LAGOS' },
  { lon: 36.817, lat: -1.292, label: 'NAIROBI' },
  { lon: 28.043, lat: -26.201, label: 'JOHANNESBURG' },
  { lon: 18.423, lat: -33.925, label: 'CAPE TOWN' },
  { lon: 32.559, lat: 15.552, label: 'KHARTOUM' },
  { lon: 38.763, lat: 9.024, label: 'ADDIS ABABA' },
  { lon: -17.443, lat: 14.693, label: 'DAKAR' },
  { lon: -1.673, lat: 12.364, label: 'OUAGADOUGOU' },
  { lon: 2.36, lat: 6.37, label: 'COTONOU' },
  { lon: -13.677, lat: 9.64, label: 'CONAKRY' },
  { lon: 7.491, lat: 9.056, label: 'ABUJA' },
  { lon: 3.396, lat: 6.453, label: 'LAGOS AREA' },
  { lon: -5.355, lat: 5.355, label: 'ABIDJAN' },
  { lon: -7.999, lat: 12.37, label: 'BAMAKO' },
  { lon: 13.512, lat: 32.889, label: 'TRIPOLI' },
  { lon: -5.993, lat: 31.791, label: 'CASABLANCA' },
  { lon: 10.169, lat: 36.817, label: 'TUNIS' },
  { lon: 3.043, lat: 36.737, label: 'ALGIERS' },
  { lon: 151.207, lat: -33.867, label: 'SYDNEY' },
  { lon: 144.963, lat: -37.814, label: 'MELBOURNE' },
  { lon: 153.028, lat: -27.468, label: 'BRISBANE' },
  { lon: 115.86, lat: -31.953, label: 'PERTH' },
  { lon: 174.763, lat: -36.848, label: 'AUCKLAND' },
  { lon: 172.636, lat: -43.532, label: 'CHRISTCHURCH' },
]

/**
 * Legacy tuple format — same points as WORLD_CITY_DEFS (for imports that expect [lng,lat]).
 */
export const WORLD_CITIES: Array<[number, number]> = WORLD_CITY_DEFS.map(
  c => [c.lon, c.lat],
)

/** Squared distance in degree space (fast; good enough for nearest-city). */
function distSqDeg(lon: number, lat: number, c: WorldCityDef): number {
  const dl = lon - c.lon
  const dφ = lat - c.lat
  return dl * dl + dφ * dφ
}

/**
 * Nearest major-city label for coordinates produced by CITY_POOL / WORLD_CITIES.
 * Used by the event log to show (CITY → CITY) next to raw lat/lon.
 */
export function nearestCityLabel(lon: number, lat: number): string {
  let best = WORLD_CITY_DEFS[0]
  let bestD = distSqDeg(lon, lat, best)
  for (let i = 1; i < WORLD_CITY_DEFS.length; i++) {
    const c = WORLD_CITY_DEFS[i]
    const d = distSqDeg(lon, lat, c)
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  return best.label
}

const HOT_ZONES: Array<[number, number]> = [
  [37.617, 55.755],   // Moscow  (×4)
  [37.617, 55.755],
  [37.617, 55.755],
  [37.617, 55.755],
  [116.407, 39.904],  // Beijing (×3)
  [116.407, 39.904],
  [116.407, 39.904],
  [2.349, 48.864],    // Paris   (×2)
  [2.349, 48.864],
  [-74.006, 40.714],  // New York (×2)
  [-74.006, 40.714],
  [139.691, 35.689],  // Tokyo   (×2)
  [139.691, 35.689],
  [51.388, 35.689],   // Tehran  (×2)
  [51.388, 35.689],
  [30.523, 50.450],   // Kyiv    (×3)
  [30.523, 50.450],
  [30.523, 50.450],
  [55.270, 25.204],   // Dubai   (×2)
  [55.270, 25.204],
  [28.978, 41.015],   // Istanbul (×2)
  [28.978, 41.015],
]

/** Full pool: regular cities + hot zones */
export const CITY_POOL: Array<[number, number]> = [
  ...WORLD_CITIES,
  ...HOT_ZONES,
]
