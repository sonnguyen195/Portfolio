/**
 * Mock delivery data for GuardianX demo flows.
 */

export type DeliveryStatus = 'verified' | 'in_transit' | 'arrived' | 'completed'

export type MockDelivery = {
  id: string
  orderCode: string
  terminalFrom: string
  terminalTo: string
  status: DeliveryStatus
  deviceName: string
}

export const MOCK_DELIVERIES: MockDelivery[] = [
  {
    id: '1',
    orderCode: 'ORD-001',
    terminalFrom: 'Hub A',
    terminalTo: 'Hub B',
    status: 'in_transit',
    deviceName: 'Drone-01',
  },
]
