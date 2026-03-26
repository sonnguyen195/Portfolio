/**
 * Animation sequence: Threat Mitigation → IP Blocking
 *
 * Start: Malicious IP identified
 * Sequence: Globe threat → Add block form → Block list → Globe zone
 * End: IP blocked
 */

export type ThreatMitigationPhase =
  | 'idle'
  | 'threat_source'
  | 'add_form'
  | 'block_submit'
  | 'blocked'

export const THREAT_MITIGATION_PHASES: ThreatMitigationPhase[] = [
  'idle',
  'threat_source',
  'add_form',
  'block_submit',
  'blocked',
]

export function createThreatMitigationTimeline() {
  return {
    phases: THREAT_MITIGATION_PHASES,
    durationMs: 5000,
  }
}
