/**
 * Mock ticket data for SOC demo flows.
 */

export type TicketStatus = 'Open' | 'In Progress' | 'Closed'

export type MockTicket = {
  serialNo: string
  status: TicketStatus
  assignee: string
  severity: string
  createDate: string
  incidentCount: number
}

export const MOCK_TICKETS: MockTicket[] = [
  {
    serialNo: 'TKT-001',
    status: 'Open',
    assignee: 'Analyst A',
    severity: 'High',
    createDate: '2025-03-16T10:35:00Z',
    incidentCount: 2,
  },
]
