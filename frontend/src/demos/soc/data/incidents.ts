/**
 * Mock incident data for SOC demo flows.
 */

export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical'

export type MockIncident = {
  id: string
  name: string
  rule: string
  severity: IncidentSeverity
  eventCount: number
  eventTime: string
  srcIp: string
  score: number
}

export const MOCK_INCIDENTS: MockIncident[] = [
  {
    id: 'INC-001',
    name: 'Suspicious login pattern',
    rule: 'R-001',
    severity: 'High',
    eventCount: 12,
    eventTime: '2025-03-16T10:30:00Z',
    srcIp: '192.168.1.100',
    score: 85,
  },
  {
    id: 'INC-002',
    name: 'Brute force attempt',
    rule: 'R-002',
    severity: 'Critical',
    eventCount: 45,
    eventTime: '2025-03-16T10:32:00Z',
    srcIp: '10.0.0.55',
    score: 95,
  },
]
