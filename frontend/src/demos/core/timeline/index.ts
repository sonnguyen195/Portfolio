/**
 * Timeline-based animation controller.
 *
 * Usage:
 *   runTimeline("soc-attack")
 *   onTrigger("soc-attack", "threat_node_appear", (e) => ...)
 */
export type { RunTimelineOptions } from './TimelineController'
export {
  runTimeline,
  stopTimeline,
  onTrigger,
  onTriggerType,
  onTriggerTarget,
  onAnyTrigger,
  isTimelineRunning,
  getActiveScenarioId,
} from './TimelineController'
export {
  getTimelineTriggers,
  SOC_ATTACK_TRIGGERS,
  MISSION_DEPLOYMENT_TRIGGERS,
  TIMELINE_TRIGGER_REGISTRY,
} from './TimelineEvents'
export type {
  TimelineAnimationTrigger,
  TimelineAnimationEvent,
  TimelineAnimationHandler,
  AnimationTriggerType,
} from './TimelineEvents'
