/**
 * Mock mission data for GuardianX demo flows.
 */

export type MissionStatus = 'pending_approval' | 'approved' | 'active'

export type MockMission = {
  id: string
  code: string
  name: string
  status: MissionStatus
  polygon: [number, number][]
  waypointCount: number
}

export const MOCK_MISSIONS: MockMission[] = [
  {
    id: '1',
    code: 'SM-001',
    name: 'Mission Alpha',
    status: 'active',
    polygon: [
      [37.5, 127.0],
      [37.6, 127.0],
      [37.6, 127.1],
      [37.5, 127.1],
    ],
    waypointCount: 12,
  },
]
