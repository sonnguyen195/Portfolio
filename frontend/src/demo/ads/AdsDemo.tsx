import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'

type TicketStatus = 'Open' | 'In Progress' | 'Analysis' | 'Response' | 'Done' | 'Closed'
type Severity = 'Low' | 'Medium' | 'High' | 'Critical'
type TicketTag = 'Focused' | 'Normal' | 'Exception' | 'Review' | 'Separate'

const SOP_STEP_NAMES = ['Ready', 'Open', 'Analysis', 'Response', 'Advanced Analysis', 'Close'] as const
function ticketStatusToStepIndex(s: TicketStatus): number {
  switch (s) {
    case 'Open': return 1
    case 'In Progress': return 2
    case 'Analysis': return 2
    case 'Response': return 3
    case 'Done': return 4
    case 'Closed': return 5
    default: return 0
  }
}

type Ticket = {
  id: string
  serialNo: string
  status: TicketStatus
  assignee: string
  severity: Severity
  issueDate: string
  ruleCategory: string
  incidentCount: number
  group?: string
  ticketTag?: TicketTag
  ruleInformation?: string
  ruleCode?: string
  user?: string
  entity?: string
  result?: string
  merge?: number
  department?: string
  team?: string
}

type TicketComment = {
  id: string
  at: string
  by: string
  text: string
}

type ProcessCategory = 'ADS' | 'SOP'

type ProcessStepRow = {
  id: string
  stage: number
  step: number
  stepName: string
  isExplain: boolean
  readCommentPermission: string
  processPermission: string
  stepBeginNotification: string
  stepEndNotification: string
  functionActions?: string
  informationSections?: string
}

type TicketProcessRow = {
  id: string
  processName: string
  processCategory: ProcessCategory
  ruleCategory: string
  group: string
  department: string
  team: string
  creator: string
  createdDate: string
  inUseTickets: number
  stepStructure: string
  enabled: boolean
  isDefault: boolean
  steps: ProcessStepRow[]
}

type ProcessDetailTab = 'information' | 'ticket-history'
type AddStepModalTab = 'general' | 'display-items' | 'alarm-settings'

type TicketHistoryRow = {
  id: string
  processId: string
  time: string
  ticketId: string
  group: string
  state: string
  ticketTag: 'Focused' | 'Normal' | 'Exception' | 'Review' | 'Separate'
  ruleCategory: string
  ruleInformation: string
  ruleCode: string
  user: string
  severity: Severity
  entity: string
  result: string
  merge: number
}

const PERM_OPTIONS = ['user', 'manager', 'superuser', 'poweruser', 'admin'] as const
const FUNCTION_ACTIONS = ['Approve', 'Reject', 'Arbitrarily Approve', 'Withdraw', 'Transfer', 'Change User', 'Preview Mail', 'Review Ticket', 'Request Support', 'Analysis Result', 'Ticket Tag'] as const
const INFO_SECTIONS = ['Ticket Information', 'Incident Information', 'User Information', 'Related Ticket', 'Risk Score Analysis', 'Ticket Process', 'Activity Logs'] as const

type Incident = {
  id: string
  ruleName: string
  severity: Severity
  detectedAt: string
  srcIp: string
  assetScore: number
}

type Rule = {
  id: string
  name: string
  category: string
  severity: Severity
  enabled: boolean
  updatedAt: string
}

type ExceptionRule = {
  id: string
  name: string
  condition: string
  action: string
  active: boolean
}

type ExceptionListItem = {
  id: string
  ruleName: string
  result: string
  occurredAt: string
}

type SopStatus = 'Draft' | 'Active' | 'Disabled'
type WorkflowStatus = 'Pending' | 'Running' | 'Completed' | 'Failed'
type SopRow = {
  id: string
  name: string
  triggerEvent: string
  steps: string[]
  createdAt: string
  createdBy: string
  status: SopStatus
  lastRun?: { status: WorkflowStatus; at: string }
}
type Role = 'Operator' | 'Admin'

type ScreenId =
  | 'tickets-ads'
  | 'tickets-sop'
  | 'ticket-detail'
  | 'incidents'
  | 'rules'
  | 'exception-rules'
  | 'exception-list'
  | 'dashboard'
  | 'sop'
  | 'analytics'
  | 'ticket-process-settings'

function nowIso(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function nextId(prefix: string): string {
  const n = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${n}`
}

function seeded(n: number): number {
  const x = Math.sin(n) * 10000
  return x - Math.floor(x)
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

const INITIAL_TICKETS: Ticket[] = [
  { id: 't1', serialNo: 'T20240525-2011', status: 'In Progress', assignee: 'ops_nguyen', severity: 'Critical', issueDate: '2024/05/25 10:55:33', ruleCategory: 'Compromised', incidentCount: 3, group: 'Group 1', ticketTag: 'Focused', ruleInformation: 'Excessive USB usage', ruleCode: 'UEBA-31112', user: 'User 1', entity: '203.229.175.101', result: 'anomaly', merge: 1 },
  { id: 't2', serialNo: 'T20240525-2012', status: 'Open', assignee: '—', severity: 'High', issueDate: '2024/05/25 11:02:15', ruleCategory: 'Malicious', incidentCount: 1, group: 'Group 2', ticketTag: 'Normal', ruleInformation: 'System log transmission', ruleCode: 'UEBA-31212', user: 'User 12', entity: '203.229.175.102', result: 'data leak', merge: 2 },
  { id: 't3', serialNo: 'T20240525-2017', status: 'Closed', assignee: 'ops_nguyen', severity: 'Low', issueDate: '2024/05/25 11:00:01', ruleCategory: 'Malicious', incidentCount: 2, group: 'Group 3', ticketTag: 'Exception', ruleInformation: 'Error page cloaking', ruleCode: 'UEBA-31199', user: 'User 17', entity: '10.0.1.42', result: 'FP', merge: 1 },
  { id: 't4', serialNo: 'T20240525-2018', status: 'Analysis', assignee: 'ops_lam', severity: 'Medium', issueDate: '2024/05/25 09:20:00', ruleCategory: 'Compromised', incidentCount: 1, group: 'Group 1', ticketTag: 'Review', ruleInformation: 'Privilege escalation attempt', ruleCode: 'ID-401', user: 'User 5', entity: '10.0.2.11', result: 'anomaly', merge: 1 },
  { id: 't5', serialNo: 'T20240525-2019', status: 'Response', assignee: 'ops_nguyen', severity: 'High', issueDate: '2024/05/24 14:22:10', ruleCategory: 'Malicious', incidentCount: 2, group: 'Group 2', ticketTag: 'Normal', ruleInformation: 'Suspected SQL injection attempt', ruleCode: 'IN-02-A01', user: 'User 12', entity: '203.251.167.20', result: 'data leak', merge: 2 },
  { id: 't6', serialNo: 'T20240524-3001', status: 'Open', assignee: '—', severity: 'Medium', issueDate: '2024/05/24 16:45:00', ruleCategory: 'Data loss', incidentCount: 1, group: 'Group 1', ticketTag: 'Normal', ruleInformation: 'Unusual outbound traffic volume', ruleCode: 'DL-205', user: 'User 3', entity: '192.168.1.105', result: '—', merge: 1 },
  { id: 't7', serialNo: 'T20240524-3002', status: 'Done', assignee: 'ops_lam', severity: 'High', issueDate: '2024/05/24 08:30:22', ruleCategory: 'Identity', incidentCount: 1, group: 'Group 2', ticketTag: 'Review', ruleInformation: 'Multiple failed logins', ruleCode: 'AUTH-101', user: 'User 8', entity: '10.0.3.55', result: 'anomaly', merge: 1 },
  { id: 't8', serialNo: 'T20240523-4001', status: 'Analysis', assignee: 'ops_nguyen', severity: 'Critical', issueDate: '2024/05/23 13:15:40', ruleCategory: 'Compromised', incidentCount: 4, group: 'Group 3', ticketTag: 'Focused', ruleInformation: 'Signature detected WAF', ruleCode: 'IN-02-A16', user: 'User 2', entity: '98.70.56.113', result: 'anomaly', merge: 3 },
  { id: 't9', serialNo: 'T20240523-4002', status: 'Open', assignee: '—', severity: 'Low', issueDate: '2024/05/23 09:00:11', ruleCategory: 'Malicious', incidentCount: 1, group: 'Group 1', ticketTag: 'Normal', ruleInformation: 'Visiting a job site', ruleCode: 'UEBA-31001', user: 'User 1', entity: '203.229.175.101', result: '—', merge: 1 },
  { id: 't10', serialNo: 'T20240522-5001', status: 'Closed', assignee: 'ops_lam', severity: 'Medium', issueDate: '2024/05/22 17:27:00', ruleCategory: 'Compromised', incidentCount: 2, group: 'Group 2', ticketTag: 'Exception', ruleInformation: 'Excessive USB usage', ruleCode: 'UEBA-31112', user: 'User 12', entity: '203.229.175.102', result: 'FP', merge: 1 },
  { id: 't11', serialNo: 'T20240522-5002', status: 'Response', assignee: 'ops_nguyen', severity: 'High', issueDate: '2024/05/22 11:25:01', ruleCategory: 'Malicious', incidentCount: 1, group: 'Group 1', ticketTag: 'Review', ruleInformation: 'Error page cloaking', ruleCode: 'IN-02-A16', user: 'User 3', entity: '58.228.236.165', result: 'anomaly', merge: 1 },
  { id: 't12', serialNo: 'T20240521-6001', status: 'In Progress', assignee: 'ops_lam', severity: 'Medium', issueDate: '2024/05/21 14:00:00', ruleCategory: 'Data loss', incidentCount: 1, group: 'Group 3', ticketTag: 'Normal', ruleInformation: 'Large file upload to external', ruleCode: 'DL-310', user: 'User 17', entity: '10.0.1.42', result: '—', merge: 1 },
  { id: 't13', serialNo: 'T20240521-6002', status: 'Done', assignee: 'ops_nguyen', severity: 'Low', issueDate: '2024/05/21 10:33:18', ruleCategory: 'Identity', incidentCount: 1, group: 'Group 1', ticketTag: 'Normal', ruleInformation: 'Privilege change', ruleCode: 'ID-402', user: 'User 5', entity: '10.0.2.11', result: 'FP', merge: 1 },
  { id: 't14', serialNo: 'T20240520-7001', status: 'Analysis', assignee: 'ops_nguyen', severity: 'Critical', issueDate: '2024/05/20 08:15:00', ruleCategory: 'Compromised', incidentCount: 2, group: 'Group 2', ticketTag: 'Focused', ruleInformation: 'System log transmission', ruleCode: 'UEBA-31212', user: 'User 12', entity: '225.33.43.2', result: 'anomaly', merge: 2 },
]

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc-101',
    ruleName: 'Multiple failed logins',
    severity: 'High',
    detectedAt: '2026-03-14 08:05:00',
    srcIp: '10.0.1.42',
    assetScore: 72,
  },
  {
    id: 'inc-102',
    ruleName: 'Unusual outbound traffic',
    severity: 'Medium',
    detectedAt: '2026-03-14 07:58:00',
    srcIp: '10.0.2.11',
    assetScore: 45,
  },
  {
    id: 'inc-103',
    ruleName: 'Privilege escalation attempt',
    severity: 'Critical',
    detectedAt: '2026-03-14 08:10:00',
    srcIp: '10.0.1.42',
    assetScore: 88,
  },
]

const INITIAL_RULES: Rule[] = [
  { id: 'r1', name: 'Failed login threshold', category: 'Authentication', severity: 'High', enabled: true, updatedAt: '2026-03-12 10:00:00' },
  { id: 'r2', name: 'Outbound data exfil', category: 'Data loss', severity: 'Critical', enabled: true, updatedAt: '2026-03-11 14:30:00' },
  { id: 'r3', name: 'Privilege change', category: 'Access', severity: 'High', enabled: true, updatedAt: '2026-03-10 09:15:00' },
  { id: 'r4', name: 'Legacy anomaly (disabled)', category: 'Anomaly', severity: 'Medium', enabled: false, updatedAt: '2026-03-08 11:00:00' },
]

const INITIAL_EXCEPTION_RULES: ExceptionRule[] = [
  { id: 'ex1', name: 'Whitelist dev VPN', condition: 'src_ip IN (10.8.0.0/24)', action: 'Skip rule', active: true },
  { id: 'ex2', name: 'Maintenance window', condition: 'time BETWEEN 02:00-04:00 UTC', action: 'Lower severity', active: true },
]

const INITIAL_EXCEPTION_LIST: ExceptionListItem[] = [
  { id: 'el1', ruleName: 'Failed login threshold', result: 'Whitelist dev VPN', occurredAt: '2026-03-14 07:55:00' },
  { id: 'el2', ruleName: 'Outbound data exfil', result: 'Maintenance window', occurredAt: '2026-03-14 02:30:00' },
]

function defaultStepsForStructure(stepStructure: string): ProcessStepRow[] {
  const digits = stepStructure.split('').map(Number)
  const rows: ProcessStepRow[] = []
  let id = 0
  digits.forEach((stepCount, stageIndex) => {
    for (let s = 1; s <= stepCount; s++) {
      id += 1
      const names = ['Ready', 'Open', 'Explain', 'Explain Approval', 'Verify Explain', 'Verify Approval']
      rows.push({
        id: `step-${id}`,
        stage: stageIndex + 1,
        step: s,
        stepName: names[rows.length % names.length] ?? `Step ${s}`,
        isExplain: false,
        readCommentPermission: 'user',
        processPermission: 'user',
        stepBeginNotification: '—',
        stepEndNotification: '—',
      })
    }
  })
  return rows
}

const INITIAL_TICKET_PROCESSES: TicketProcessRow[] = [
  {
    id: 'proc-1',
    processName: 'Process1',
    processCategory: 'ADS',
    ruleCategory: 'threat',
    group: 'Group 1',
    department: '',
    team: '',
    creator: 'ADS',
    createdDate: '2024/04/03 11:24:20',
    inUseTickets: 6,
    stepStructure: '212',
    enabled: true,
    isDefault: true,
    steps: defaultStepsForStructure('212'),
  },
  {
    id: 'proc-2',
    processName: 'Process2',
    processCategory: 'SOP',
    ruleCategory: 'endpoint',
    group: 'Group 2',
    department: '',
    team: '',
    creator: 'Gaion',
    createdDate: '2024/04/03 11:24:20',
    inUseTickets: 10,
    stepStructure: '6',
    enabled: true,
    isDefault: false,
    steps: defaultStepsForStructure('6'),
  },
  {
    id: 'proc-3',
    processName: 'Process3',
    processCategory: 'ADS',
    ruleCategory: 'identity',
    group: '',
    department: '',
    team: '',
    creator: 'Admin1',
    createdDate: '2024/04/04 09:00:00',
    inUseTickets: 8,
    stepStructure: '222',
    enabled: true,
    isDefault: false,
    steps: defaultStepsForStructure('222'),
  },
]

const INITIAL_TICKET_HISTORY: TicketHistoryRow[] = [
  { id: 'th1', processId: 'proc-1', time: '2024/05/25 10:55:33', ticketId: 'T20240525-2011', group: 'Group 1', state: 'Analysis', ticketTag: 'Focused', ruleCategory: 'Compromised', ruleInformation: 'Excessive USB usage', ruleCode: 'UEBA-31112', user: 'User 1', severity: 'Critical', entity: '203.229.175.101', result: 'anomaly', merge: 1 },
  { id: 'th2', processId: 'proc-1', time: '2024/05/25 10:55:35', ticketId: 'T20240525-2012', group: 'Group 2', state: 'Open', ticketTag: 'Normal', ruleCategory: 'Malicious', ruleInformation: 'System log transmission', ruleCode: 'UEBA-31212', user: 'User 12', severity: 'High', entity: '203.229.175.102', result: 'data leak', merge: 2 },
  { id: 'th3', processId: 'proc-1', time: '2024/05/25 11:00:01', ticketId: 'T20240525-2017', group: 'Group 3', state: '', ticketTag: 'Exception', ruleCategory: 'Malicious', ruleInformation: 'Error page cloaking', ruleCode: 'UEBA-31199', user: 'User 17', severity: 'Medium', entity: '10.0.1.42', result: 'FP', merge: 1 },
  { id: 'th4', processId: 'proc-2', time: '2024/05/24 14:22:10', ticketId: 'T20240524-3001', group: 'Group 1', state: 'Response', ticketTag: 'Review', ruleCategory: 'Compromised', ruleInformation: 'Excessive USB usage', ruleCode: 'UEBA-31112', user: 'User 1', severity: 'Critical', entity: '203.xxx.xxx.101', result: 'anomaly', merge: 1 },
  { id: 'th5', processId: 'proc-2', time: '2024/05/24 14:30:00', ticketId: 'T20240524-3002', group: 'Group 2', state: 'Open', ticketTag: 'Normal', ruleCategory: 'Malicious', ruleInformation: 'System log transmission', ruleCode: 'UEBA-31212', user: 'User 12', severity: 'Low', entity: '203.229.175.102', result: 'data leak', merge: 2 },
  { id: 'th6', processId: 'proc-3', time: '2024/05/23 09:15:00', ticketId: 'T20240523-1001', group: 'Group 1', state: 'Analysis', ticketTag: 'Focused', ruleCategory: 'Identity', ruleInformation: 'Privilege escalation attempt', ruleCode: 'ID-401', user: 'User 5', severity: 'High', entity: '10.0.2.11', result: 'anomaly', merge: 1 },
]

const INITIAL_SOPS: SopRow[] = [
  {
    id: 'SOP-2001',
    name: 'Unauthorized access response',
    triggerEvent: 'Access violation',
    steps: ['Validate alert', 'Notify operator', 'Lock down zone', 'Write incident report'],
    createdAt: nowIso(),
    createdBy: 'Admin',
    status: 'Active',
    lastRun: { status: 'Completed', at: nowIso() },
  },
  {
    id: 'SOP-2002',
    name: 'Loitering investigation',
    triggerEvent: 'Loitering',
    steps: ['Review snapshot', 'Check live stream', 'Escalate if repeated'],
    createdAt: nowIso(),
    createdBy: 'Admin',
    status: 'Draft',
  },
]

export function AdsDemo(props: { onExit: () => void }): ReactNode {
  const { onExit } = props

  const [screen, setScreen] = useState<ScreenId>('tickets-sop')
  const [ticketDetailId, setTicketDetailId] = useState<string | null>(null)
  const [ticketListViewMode, setTicketListViewMode] = useState<'ongoing' | 'current' | 'close'>('ongoing')
  const [adsTicketMainTab, setAdsTicketMainTab] = useState<'ticket-detail' | 'ticket-process'>('ticket-detail')
  const [adsListStatusFilter, setAdsListStatusFilter] = useState<'Open' | 'Running' | 'Done' | 'Close'>('Open')
  const [adsListTableTab, setAdsListTableTab] = useState<'by-time' | 'by-risk-user'>('by-time')
  const [lockedTicketId, setLockedTicketId] = useState<string | null>(null)
  const [adsListPageSize, setAdsListPageSize] = useState<number>(10)
  const [adsListPageIndex, setAdsListPageIndex] = useState<number>(0)
  const [sopListPageSize, setSopListPageSize] = useState<number>(10)
  const [sopListPageIndex, setSopListPageIndex] = useState<number>(0)
  const [processMenuOpenId, setProcessMenuOpenId] = useState<string | null>(null)
  const [ticketComments, setTicketComments] = useState<Record<string, TicketComment[]>>({})
  const [commentDraft, setCommentDraft] = useState('')
  const [assignModalTicketId, setAssignModalTicketId] = useState<string | null>(null)
  const [toast, setToast] = useState<null | { id: string; text: string }>(null)
  const [mailPreview, setMailPreview] = useState<null | { kind: 'ADS' | 'SOP'; ticketId: string }>(null)
  const [workflowByKey, setWorkflowByKey] = useState<Record<string, { stage: number; step: number; approved: Record<string, boolean> }>>({})
  const [ticketProcesses, setTicketProcesses] = useState<TicketProcessRow[]>(INITIAL_TICKET_PROCESSES)
  const [ticketHistory, _setTicketHistory] = useState<TicketHistoryRow[]>(INITIAL_TICKET_HISTORY)
  const [addProcessPanelOpen, setAddProcessPanelOpen] = useState(false)
  const [newProcessName, setNewProcessName] = useState('')
  const [newProcessCategory, setNewProcessCategory] = useState<ProcessCategory>('ADS')
  const [newProcessRuleCategory, setNewProcessRuleCategory] = useState('')
  const [newProcessStages, setNewProcessStages] = useState(3)
  const [newProcessStepStructure, setNewProcessStepStructure] = useState('222')
  const [newProcessEnabled, setNewProcessEnabled] = useState(true)
  const [newProcessDefault, setNewProcessDefault] = useState(false)

  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null)
  const [processDetailTab, setProcessDetailTab] = useState<ProcessDetailTab>('information')
  const [addStepModal, setAddStepModal] = useState<{ processId: string; stepId: string | null } | null>(null)
  const [addStepTab, setAddStepTab] = useState<AddStepModalTab>('general')
  const [addStepStage, setAddStepStage] = useState(1)
  const [addStepStep, setAddStepStep] = useState(1)
  const [addStepName, setAddStepName] = useState('')
  const [addStepIsExplain, setAddStepIsExplain] = useState(false)
  const [addStepReadPerm, setAddStepReadPerm] = useState<string[]>(['user'])
  const [addStepProcessPerm, setAddStepProcessPerm] = useState<string[]>(['user'])
  const [addStepFunctionActions, setAddStepFunctionActions] = useState<Record<string, boolean>>({})
  const [addStepInfoSections, setAddStepInfoSections] = useState<Record<string, boolean>>({})
  const [addStepAlarmBegin, setAddStepAlarmBegin] = useState('Mail (self, poweruser)')
  const [addStepAlarmEnd, setAddStepAlarmEnd] = useState('Mail (self, poweruser)')

  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS)
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS)
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES)
  const [exceptionRules, setExceptionRules] = useState<ExceptionRule[]>(INITIAL_EXCEPTION_RULES)
  const [exceptionList, setExceptionList] = useState<ExceptionListItem[]>(INITIAL_EXCEPTION_LIST)

  const [filterStatus, _setFilterStatus] = useState<TicketStatus | 'All'>('All')
  const [filterSeverity, _setFilterSeverity] = useState<Severity | 'All'>('All')
  const [searchTicket, _setSearchTicket] = useState('')
  const [searchIncident, setSearchIncident] = useState('')
  const [searchRule, setSearchRule] = useState('')

  const [role, setRole] = useState<Role>('Operator')
  const [sops, setSops] = useState<SopRow[]>(INITIAL_SOPS)
  const [sopForm, setSopForm] = useState<null | { mode: 'new' | 'edit'; sopId?: string }>(null)
  const [executionLog, setExecutionLog] = useState<string[]>([])
  const [filterEventType, setFilterEventType] = useState<string>('All')
  const [filterSopStatus, setFilterSopStatus] = useState<SopStatus | 'All'>('All')
  const [searchSop, setSearchSop] = useState('')
  const [simulateEventType, setSimulateEventType] = useState<string>('Access violation')
  const [analyticsCamera, setAnalyticsCamera] = useState<string>('All')
  const [analyticsLocation, setAnalyticsLocation] = useState<string>('All')
  const [analyticsRange, setAnalyticsRange] = useState<'7d' | '30d' | '90d'>('30d')

  const _filteredTickets = useMemo(() => {
    return tickets
      .filter((t) => (filterStatus === 'All' ? true : t.status === filterStatus))
      .filter((t) => (filterSeverity === 'All' ? true : t.severity === filterSeverity))
      .filter((t) => {
        const q = searchTicket.trim().toLowerCase()
        if (!q) return true
        return `${t.serialNo} ${t.assignee} ${t.ruleCategory} ${t.ruleInformation ?? ''}`.toLowerCase().includes(q)
      })
  }, [tickets, filterStatus, filterSeverity, searchTicket])
  void _filteredTickets

  const detailTicket = ticketDetailId ? tickets.find((t) => t.id === ticketDetailId) ?? null : null
  const filteredTicketsForList = useMemo(() => {
    if (ticketListViewMode === 'ongoing') {
      return tickets.filter((t) => t.status !== 'Closed')
    }
    if (ticketListViewMode === 'close') {
      return tickets.filter((t) => t.status === 'Closed')
    }
    if (ticketListViewMode === 'current' && detailTicket) {
      const stepIdx = ticketStatusToStepIndex(detailTicket.status)
      return tickets.filter((t) => ticketStatusToStepIndex(t.status) === stepIdx)
    }
    return tickets.filter((t) => t.status !== 'Closed')
  }, [tickets, ticketListViewMode, detailTicket])

  const adsFilteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (adsListStatusFilter === 'Open') return t.status === 'Open'
      if (adsListStatusFilter === 'Running') return t.status === 'In Progress' || t.status === 'Analysis' || t.status === 'Response'
      if (adsListStatusFilter === 'Done') return t.status === 'Done'
      return t.status === 'Closed'
    })
  }, [tickets, adsListStatusFilter])

  const adsListPageCount = Math.max(1, Math.ceil(adsFilteredTickets.length / Math.max(1, adsListPageSize)))
  const adsListPageTickets = adsFilteredTickets.slice(
    adsListPageIndex * adsListPageSize,
    adsListPageIndex * adsListPageSize + adsListPageSize,
  )
  const sopListPageCount = Math.max(1, Math.ceil(filteredTicketsForList.length / Math.max(1, sopListPageSize)))
  const sopListPageTickets = filteredTicketsForList.slice(
    sopListPageIndex * sopListPageSize,
    sopListPageIndex * sopListPageSize + sopListPageSize,
  )

  const showToast = (text: string): void => {
    const id = nextId('toast')
    setToast({ id, text })
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev))
    }, 1800)
  }

  const addTicketComment = (ticketId: string, text: string, by: string): void => {
    const comment: TicketComment = { id: nextId('c'), at: nowIso(), by, text }
    setTicketComments((prev) => ({ ...prev, [ticketId]: [...(prev[ticketId] ?? []), comment] }))
  }

  const _advanceTicketStatus = (t: Ticket): TicketStatus => {
    switch (t.status) {
      case 'Open': return 'In Progress'
      case 'In Progress': return 'Analysis'
      case 'Analysis': return 'Response'
      case 'Response': return 'Done'
      case 'Done': return 'Closed'
      case 'Closed': return 'Closed'
      default: return 'In Progress'
    }
  }
  void _advanceTicketStatus

  const stepsPerStageForKind = (kind: 'ADS' | 'SOP'): number[] => {
    // ADS uses multi-step stages. SOP is modeled as 6 stages (each 1 step) to match the spec for Transfer on stage boundaries.
    return kind === 'ADS' ? [2, 1, 2] : [1, 1, 1, 1, 1, 1]
  }

  const workflowKey = (kind: 'ADS' | 'SOP', ticketId: string): string => `${kind}:${ticketId}`

  const statusToFlatIndex = (kind: 'ADS' | 'SOP', status: TicketStatus): number => {
    if (kind === 'ADS') {
      // Open, InProgress, Analysis, Response, Done, Closed
      switch (status) {
        case 'Open': return 0
        case 'In Progress': return 1
        case 'Analysis': return 2
        case 'Response': return 3
        case 'Done': return 4
        case 'Closed': return 5
        default: return 0
      }
    }
    // SOP (6 stages) maps into: Open, InProgress, Analysis, Response, Done, Closed
    switch (status) {
      case 'Open': return 0
      case 'In Progress': return 1
      case 'Analysis': return 2
      case 'Response': return 3
      case 'Done': return 4
      case 'Closed': return 5
      default: return 0
    }
  }

  const flatIndexToStageStep = (stepsPerStage: number[], flatIndex: number): { stage: number; step: number } => {
    let idx = Math.max(0, flatIndex)
    for (let s = 0; s < stepsPerStage.length; s += 1) {
      const cnt = stepsPerStage[s] ?? 1
      if (idx < cnt) return { stage: s + 1, step: idx + 1 }
      idx -= cnt
    }
    const lastStage = stepsPerStage.length
    return { stage: lastStage, step: stepsPerStage[lastStage - 1] ?? 1 }
  }

  const stageStepToFlatIndex = (stepsPerStage: number[], stage: number, step: number): number => {
    const s = Math.max(1, Math.min(stage, stepsPerStage.length))
    let idx = 0
    for (let i = 1; i < s; i += 1) idx += stepsPerStage[i - 1] ?? 1
    return idx + (Math.max(1, step) - 1)
  }

  const deriveStatusFromFlat = (flat: number): TicketStatus => {
    switch (flat) {
      case 0: return 'Open'
      case 1: return 'In Progress'
      case 2: return 'Analysis'
      case 3: return 'Response'
      case 4: return 'Done'
      case 5: return 'Closed'
      default: return 'In Progress'
    }
  }

  const adsProcessActiveIndex = (t: Ticket | null): number => (t ? statusToFlatIndex('ADS', t.status) : 0)

  const getWorkflow = (kind: 'ADS' | 'SOP', t: Ticket | null): { stage: number; step: number; stepsPerStage: number[]; approved: Record<string, boolean>; flat: number; flatTotal: number } => {
    const stepsPerStage = stepsPerStageForKind(kind)
    const flatTotal = stepsPerStage.reduce((a, b) => a + b, 0)
    const ticketId = t?.id ?? '—'
    const key = workflowKey(kind, ticketId)
    const fromState = workflowByKey[key]
    const initialFlat = t ? statusToFlatIndex(kind, t.status) : 0
    const initial = flatIndexToStageStep(stepsPerStage, initialFlat)
    const stage = fromState?.stage ?? initial.stage
    const step = fromState?.step ?? initial.step
    const approved = fromState?.approved ?? {}
    const flat = stageStepToFlatIndex(stepsPerStage, stage, step)
    return { stage, step, stepsPerStage, approved, flat, flatTotal }
  }

  const setWorkflow = (kind: 'ADS' | 'SOP', ticketId: string, patch: Partial<{ stage: number; step: number; approved: Record<string, boolean> }>): void => {
    const key = workflowKey(kind, ticketId)
    setWorkflowByKey((prev) => {
      const cur = prev[key] ?? { stage: 1, step: 1, approved: {} }
      return { ...prev, [key]: { ...cur, ...patch, approved: patch.approved ?? cur.approved } }
    })
  }

  const stepKey = (kind: 'ADS' | 'SOP', ticketId: string, stage: number, step: number): string => `${kind}:${ticketId}:S${stage}-${step}`

  const _ownerLabel = (stage: number, step: number): string => {
    const u = (stage - 1) * 2 + step
    return `User ${u}`
  }
  void _ownerLabel

  const ASSIGNEES_BY_STEP = ['—', 'ops_nguyen', 'ops_lam', 'ops_khanh', 'sec_lead'] as const
  const assigneeForStageStep = (kind: 'ADS' | 'SOP', stage: number, step: number): string => {
    const stepsPerStage = stepsPerStageForKind(kind)
    const flat = stageStepToFlatIndex(stepsPerStage, stage, step)
    const idx = 1 + (flat % (ASSIGNEES_BY_STEP.length - 1))
    return ASSIGNEES_BY_STEP[idx] ?? 'ops_nguyen'
  }

  const getPrevStageStep = (stepsPerStage: number[], stage: number, step: number): { stage: number; step: number } | null => {
    if (stage === 1 && step === 1) return null
    if (step > 1) return { stage, step: step - 1 }
    const prevStage = stage - 1
    const lastStepOfPrev = stepsPerStage[prevStage - 1] ?? 1
    return { stage: prevStage, step: lastStepOfPrev }
  }

  const isLastStepOfStage = (stepsPerStage: number[], stage: number, step: number): boolean =>
    step === (stepsPerStage[stage - 1] ?? 1)

  const isLastStage = (stepsPerStage: number[], stage: number): boolean => stage >= stepsPerStage.length

  const isFirstStepFirstStage = (stage: number, step: number): boolean => stage === 1 && step === 1

  const getNextStageStep = (stepsPerStage: number[], stage: number, step: number): { stage: number; step: number } | null => {
    const stepsInStage = stepsPerStage[stage - 1] ?? 1
    if (step < stepsInStage) return { stage, step: step + 1 }
    if (stage >= stepsPerStage.length) return null
    return { stage: stage + 1, step: 1 }
  }

  const runWorkflowApprove = (kind: 'ADS' | 'SOP', t: Ticket): void => {
    const w = getWorkflow(kind, t)
    const next = getNextStageStep(w.stepsPerStage, w.stage, w.step)
    if (!next) {
      updateTicket(t.id, { status: 'Closed' })
      setWorkflow(kind, t.id, { stage: w.stage, step: w.step })
      showToast('Approved: closed')
      return
    }
    const newFlat = stageStepToFlatIndex(w.stepsPerStage, next.stage, next.step)
    const newStatus = deriveStatusFromFlat(Math.min(newFlat, 5))
    const assignee = assigneeForStageStep(kind, next.stage, next.step)
    setWorkflow(kind, t.id, { stage: next.stage, step: next.step })
    updateTicket(t.id, { status: newStatus, assignee })
    showToast('Approved: next step')
  }

  const runWorkflowReject = (kind: 'ADS' | 'SOP', t: Ticket): void => {
    const w = getWorkflow(kind, t)
    const prev = getPrevStageStep(w.stepsPerStage, w.stage, w.step)
    if (!prev) {
      showToast('Cannot reject at first step')
      return
    }
    const prevFlat = stageStepToFlatIndex(w.stepsPerStage, prev.stage, prev.step)
    const newStatus = deriveStatusFromFlat(prevFlat)
    const assignee = assigneeForStageStep(kind, prev.stage, prev.step)
    const sk = stepKey(kind, t.id, w.stage, w.step)
    setWorkflow(kind, t.id, { stage: prev.stage, step: prev.step, approved: { ...w.approved, [sk]: false } })
    updateTicket(t.id, { status: newStatus, assignee })
    showToast('Rejected: back to previous step')
  }

  const runWorkflowArbitrarilyApprove = (kind: 'ADS' | 'SOP', t: Ticket): void => {
    const w = getWorkflow(kind, t)
    const lastFlat = w.flatTotal - 1
    if (w.flat >= lastFlat) {
      showToast('Already at last step')
      return
    }
    const nextStage = w.stage + 1
    if (nextStage > w.stepsPerStage.length) {
      updateTicket(t.id, { status: 'Closed' })
      showToast('Arbitrarily approved: closed')
      return
    }
    const newFlat = stageStepToFlatIndex(w.stepsPerStage, nextStage, 1)
    const newStatus = deriveStatusFromFlat(Math.min(newFlat, 5))
    const assignee = assigneeForStageStep(kind, nextStage, 1)
    setWorkflow(kind, t.id, { stage: nextStage, step: 1 })
    updateTicket(t.id, { status: newStatus, assignee })
    showToast('Arbitrarily approved: next stage')
  }

  const runWorkflowWithdraw = (kind: 'ADS' | 'SOP', t: Ticket): void => {
    const w = getWorkflow(kind, t)
    const next = getNextStageStep(w.stepsPerStage, w.stage, w.step)
    const stepsInStage = w.stepsPerStage[w.stage - 1] ?? 1
    const atLastStep = w.step >= stepsInStage && isLastStage(w.stepsPerStage, w.stage)
    if (atLastStep) {
      showToast('Cannot withdraw at last step')
      return
    }
    const nextApproved = next ? w.approved[stepKey(kind, t.id, next.stage, next.step)] : false
    if (nextApproved) {
      showToast('Cannot withdraw: next step already approved')
      return
    }
    const prev = getPrevStageStep(w.stepsPerStage, w.stage, w.step)
    if (!prev) return
    const prevFlat = stageStepToFlatIndex(w.stepsPerStage, prev.stage, prev.step)
    const newStatus = deriveStatusFromFlat(prevFlat)
    const assignee = assigneeForStageStep(kind, prev.stage, prev.step)
    setWorkflow(kind, t.id, { stage: prev.stage, step: prev.step })
    updateTicket(t.id, { status: newStatus, assignee })
    showToast('Withdrawn: back to previous step')
  }

  const canWorkflowReject = (kind: 'ADS' | 'SOP', t: Ticket | null): boolean => {
    if (!t) return false
    const w = getWorkflow(kind, t)
    return !isFirstStepFirstStage(w.stage, w.step)
  }

  const canWorkflowWithdraw = (kind: 'ADS' | 'SOP', t: Ticket | null): boolean => {
    if (!t) return false
    const w = getWorkflow(kind, t)
    const next = getNextStageStep(w.stepsPerStage, w.stage, w.step)
    const stepsInStage = w.stepsPerStage[w.stage - 1] ?? 1
    const atLastStep = w.step >= stepsInStage && isLastStage(w.stepsPerStage, w.stage)
    if (atLastStep) return false
    const nextApproved = next ? w.approved[stepKey(kind, t.id, next.stage, next.step)] : false
    return !nextApproved && !isFirstStepFirstStage(w.stage, w.step)
  }

  const canWorkflowArbitrarilyApprove = (kind: 'ADS' | 'SOP', t: Ticket | null): boolean => {
    if (!t) return false
    const w = getWorkflow(kind, t)
    return w.flat < w.flatTotal - 1
  }

  const canWorkflowTransfer = (kind: 'ADS' | 'SOP', t: Ticket | null): boolean => {
    if (!t) return false
    const w = getWorkflow(kind, t)
    return isLastStepOfStage(w.stepsPerStage, w.stage, w.step) && !isLastStage(w.stepsPerStage, w.stage)
  }

  const transferDepartmentTeam = (ticketId: string): void => {
    const t = tickets.find((x) => x.id === ticketId)
    const curDep = t?.department ?? 'Department 1'
    const curTeam = t?.team ?? 'Team 1'
    const nextDep = curDep === 'Department 1' ? 'Department 2' : curDep === 'Department 2' ? 'Department 3' : 'Department 1'
    const nextTeam = curTeam === 'Team 1' ? 'Team 2' : curTeam === 'Team 2' ? 'Team 3' : 'Team 1'
    updateTicket(ticketId, { department: nextDep, team: nextTeam })
    showToast(`Transferred to ${nextDep} / ${nextTeam}`)
  }

  const filteredIncidents = useMemo(() => {
    const q = searchIncident.trim().toLowerCase()
    if (!q) return incidents
    return incidents.filter(
      (i) =>
        `${i.ruleName} ${i.srcIp} ${i.severity}`.toLowerCase().includes(q),
    )
  }, [incidents, searchIncident])

  const filteredRules = useMemo(() => {
    const q = searchRule.trim().toLowerCase()
    if (!q) return rules
    return rules.filter((r) => `${r.name} ${r.category}`.toLowerCase().includes(q))
  }, [rules, searchRule])

  const eventTypes = useMemo(() => {
    const all = new Set<string>()
    sops.forEach((s) => all.add(s.triggerEvent))
    return ['All', ...Array.from(all)]
  }, [sops])

  const filteredSops = useMemo(() => {
    return sops
      .filter((s) => (filterEventType === 'All' ? true : s.triggerEvent === filterEventType))
      .filter((s) => (filterSopStatus === 'All' ? true : s.status === filterSopStatus))
      .filter((s) => {
        const q = searchSop.trim().toLowerCase()
        if (!q) return true
        return `${s.id} ${s.name} ${s.triggerEvent}`.toLowerCase().includes(q)
      })
  }, [sops, filterEventType, filterSopStatus, searchSop])

  const canAdmin = role === 'Admin'
  const addLog = (msg: string) => setExecutionLog((l) => [`${nowIso()} · ${msg}`, ...l].slice(0, 12))

  const activateSop = (sopId: string) => {
    setSops((prev) => prev.map((s) => (s.id === sopId ? { ...s, status: 'Active' } : s)))
    addLog(`Activated ${sopId}`)
  }
  const disableSop = (sopId: string) => {
    setSops((prev) => prev.map((s) => (s.id === sopId ? { ...s, status: 'Disabled' } : s)))
    addLog(`Disabled ${sopId}`)
  }
  const deleteSop = (sopId: string) => {
    setSops((prev) => prev.filter((s) => s.id !== sopId))
    addLog(`Deleted ${sopId}`)
  }
  const duplicateSop = (sopId: string) => {
    const src = sops.find((s) => s.id === sopId)
    if (!src) return
    const id = nextId('SOP')
    setSops((prev) => [
      { ...src, id, name: `${src.name} (copy)`, status: 'Draft', createdAt: nowIso(), createdBy: role },
      ...prev,
    ])
    addLog(`Duplicated ${sopId} → ${id}`)
  }
  const simulateExecution = () => {
    const active = sops.find((s) => s.status === 'Active' && s.triggerEvent === simulateEventType) ?? null
    addLog(`Event detected: ${simulateEventType}`)
    if (!active) {
      addLog('No active SOP matched the event.')
      return
    }
    addLog(`SOP engine matched: ${active.id}`)
    setSops((prev) =>
      prev.map((s) => (s.id === active.id ? { ...s, lastRun: { status: 'Pending', at: nowIso() } } : s)),
    )
    setTimeout(() => {
      setSops((prev) =>
        prev.map((s) => (s.id === active.id ? { ...s, lastRun: { status: 'Running', at: nowIso() } } : s)),
      )
      addLog(`Workflow running: ${active.id}`)
    }, 350)
    setTimeout(() => {
      const ok = seeded(active.id.length + simulateEventType.length + Date.now()) > 0.2
      const status: WorkflowStatus = ok ? 'Completed' : 'Failed'
      setSops((prev) =>
        prev.map((s) => (s.id === active.id ? { ...s, lastRun: { status, at: nowIso() } } : s)),
      )
      addLog(`Workflow ${status.toLowerCase()}: ${active.id}`)
      addLog('Notification sent to operator.')
    }, 1200)
  }

  const analyticsSeed = useMemo(() => {
    const base =
      (analyticsCamera === 'All' ? 1 : analyticsCamera.length) *
        (analyticsLocation === 'All' ? 7 : analyticsLocation.length) +
      (analyticsRange === '7d' ? 3 : analyticsRange === '30d' ? 5 : 9)
    return base
  }, [analyticsCamera, analyticsLocation, analyticsRange])
  const timeline = useMemo(() => {
    const len = analyticsRange === '7d' ? 7 : analyticsRange === '30d' ? 12 : 18
    return Array.from({ length: len }, (_, i) => Math.floor(30 + seeded(analyticsSeed * 10 + i) * 70))
  }, [analyticsSeed, analyticsRange])
  const distribution = useMemo(() => {
    const base = Math.floor(50 + seeded(analyticsSeed * 11) * 60)
    return [
      { name: 'Loitering', value: Math.floor(base * 0.35) },
      { name: 'Access violation', value: Math.floor(base * 0.28) },
      { name: 'Safety', value: Math.floor(base * 0.22) },
      { name: 'Other', value: Math.floor(base * 0.15) },
    ]
  }, [analyticsSeed])
  const heat = useMemo(() => Array.from({ length: 14 * 7 }, (_, i) => seeded(analyticsSeed * 30 + i)), [analyticsSeed])
  const totalCameras = useMemo(() => 24 + Math.floor(seeded(analyticsSeed * 41) * 8), [analyticsSeed])
  const activeStreams = useMemo(() => 12 + Math.floor(seeded(analyticsSeed * 42) * 10), [analyticsSeed])
  const eventsToday = useMemo(() => 18 + Math.floor(seeded(analyticsSeed * 43) * 30), [analyticsSeed])
  const criticalAlerts = useMemo(() => 1 + Math.floor(seeded(analyticsSeed * 44) * 6), [analyticsSeed])

  const stepStructureOptions = useMemo(() => {
    if (newProcessStages === 1) return ['1', '2', '3', '4', '5']
    if (newProcessStages === 2) return ['11', '22', '33', '44', '55']
    if (newProcessStages === 3) return ['111', '222', '333', '444', '555']
    return ['111', '222', '333', '444', '555']
  }, [newProcessStages])

  const createNewProcess = () => {
    const id = nextId('proc')
    const steps = defaultStepsForStructure(newProcessStepStructure)
    setTicketProcesses((prev) => [
      {
        id,
        processName: newProcessName.trim() || `Process ${prev.length + 1}`,
        processCategory: newProcessCategory,
        ruleCategory: newProcessRuleCategory || '—',
        group: '',
        department: '',
        team: '',
        creator: 'Admin',
        createdDate: nowIso(),
        inUseTickets: 0,
        stepStructure: newProcessStepStructure,
        enabled: newProcessEnabled,
        isDefault: newProcessDefault,
        steps,
      },
      ...prev,
    ])
    setAddProcessPanelOpen(false)
    setNewProcessName('')
    setNewProcessCategory('ADS')
    setNewProcessRuleCategory('')
    setNewProcessStages(3)
    setNewProcessStepStructure('222')
    setNewProcessEnabled(true)
    setNewProcessDefault(false)
  }

  const selectedProcess = selectedProcessId ? ticketProcesses.find((p) => p.id === selectedProcessId) ?? null : null

  const updateProcess = (processId: string, patch: Partial<TicketProcessRow>) => {
    setTicketProcesses((prev) => prev.map((p) => (p.id === processId ? { ...p, ...patch } : p)))
  }

  const addProcessStep = (processId: string, step: ProcessStepRow) => {
    setTicketProcesses((prev) =>
      prev.map((p) => (p.id === processId ? { ...p, steps: [...p.steps, step] } : p)),
    )
  }

  const updateProcessStep = (processId: string, stepId: string, patch: Partial<ProcessStepRow>) => {
    setTicketProcesses((prev) =>
      prev.map((p) =>
        p.id === processId
          ? { ...p, steps: p.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) }
          : p,
      ),
    )
  }

  const deleteProcessStep = (processId: string, stepId: string) => {
    setTicketProcesses((prev) =>
      prev.map((p) => (p.id === processId ? { ...p, steps: p.steps.filter((s) => s.id !== stepId) } : p)),
    )
  }

  const duplicateProcessStep = (processId: string, stepId: string) => {
    const proc = ticketProcesses.find((p) => p.id === processId)
    const src = proc?.steps.find((s) => s.id === stepId)
    if (!proc || !src) return
    const newStep: ProcessStepRow = { ...src, id: nextId('step') }
    addProcessStep(processId, newStep)
  }

  const parsePerm = (s: string): string[] => {
    if (!s?.trim()) return ['user']
    return s.split(',').map((x) => x.trim()).filter(Boolean)
  }
  const parseDisplayKeys = (s: string | undefined): Record<string, boolean> => {
    if (!s?.trim()) return {}
    const keys = s.split(',').map((x) => x.trim()).filter(Boolean)
    return Object.fromEntries(keys.map((k) => [k, true]))
  }

  const openAddStepModal = (processId: string, stepId: string | null) => {
    setAddStepModal({ processId, stepId })
    setAddStepTab('general')
    if (stepId) {
      const proc = ticketProcesses.find((p) => p.id === processId)
      const step = proc?.steps.find((s) => s.id === stepId)
      if (step) {
        setAddStepStage(step.stage)
        setAddStepStep(step.step)
        setAddStepName(step.stepName)
        setAddStepIsExplain(step.isExplain)
        setAddStepReadPerm(parsePerm(step.readCommentPermission))
        setAddStepProcessPerm(parsePerm(step.processPermission))
        setAddStepAlarmBegin(step.stepBeginNotification || 'Mail (self, poweruser)')
        setAddStepAlarmEnd(step.stepEndNotification || 'Mail (self, poweruser)')
        setAddStepFunctionActions(parseDisplayKeys(step.functionActions))
        setAddStepInfoSections(parseDisplayKeys(step.informationSections))
      }
    } else {
      const proc = ticketProcesses.find((p) => p.id === processId)
      const maxStage = proc?.steps.length ? Math.max(...proc.steps.map((s) => s.stage)) : 0
      setAddStepStage(maxStage + 1)
      setAddStepStep(1)
      setAddStepName('')
      setAddStepIsExplain(false)
      setAddStepReadPerm(['user'])
      setAddStepProcessPerm(['user'])
      setAddStepFunctionActions({})
      setAddStepInfoSections({})
      setAddStepAlarmBegin('Mail (self, poweruser)')
      setAddStepAlarmEnd('Mail (self, poweruser)')
    }
  }

  const saveAddStepModal = () => {
    if (!addStepModal) return
    const stepRow: ProcessStepRow = {
      id: addStepModal.stepId ?? nextId('step'),
      stage: addStepStage,
      step: addStepStep,
      stepName: addStepName.trim() || 'Step',
      isExplain: addStepIsExplain,
      readCommentPermission: addStepReadPerm.length ? addStepReadPerm.join(', ') : 'user',
      processPermission: addStepProcessPerm.length ? addStepProcessPerm.join(', ') : 'user',
      stepBeginNotification: addStepAlarmBegin,
      stepEndNotification: addStepAlarmEnd,
      functionActions: Object.entries(addStepFunctionActions).filter(([, v]) => v).map(([k]) => k).join(', ') || undefined,
      informationSections: Object.entries(addStepInfoSections).filter(([, v]) => v).map(([k]) => k).join(', ') || undefined,
    }
    if (addStepModal.stepId) {
      updateProcessStep(addStepModal.processId, addStepModal.stepId, stepRow)
    } else {
      addProcessStep(addStepModal.processId, stepRow)
    }
    setAddStepModal(null)
  }

  const ASSIGNEES = ['—', 'ops_nguyen', 'ops_lam', 'ops_khanh', 'sec_lead']

  const statusToAdsTab = (s: TicketStatus): 'Open' | 'Running' | 'Done' | 'Close' => {
    if (s === 'Open') return 'Open'
    if (s === 'In Progress' || s === 'Analysis' || s === 'Response') return 'Running'
    if (s === 'Done') return 'Done'
    return 'Close'
  }

  const updateTicket = (id: string, patch: Partial<Ticket>) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    setProcessMenuOpenId(null)
    if (patch.status !== undefined) {
      setAdsListStatusFilter(statusToAdsTab(patch.status))
      if (patch.status === 'Closed') setTicketListViewMode('close')
    }
  }

  const openTicketDetail = (id: string) => {
    setTicketDetailId(id)
    setTicketListViewMode('current')
    setProcessMenuOpenId(null)
  }
  const clearTicketSelection = () => {
    setTicketDetailId(null)
    setTicketListViewMode('ongoing')
  }

  const closeTicket = (id: string) => {
    updateTicket(id, { status: 'Closed' })
    if (ticketDetailId === id) {
      setTicketDetailId(null)
      setScreen('tickets-sop')
    }
  }

  const reopenTicket = (id: string) => {
    updateTicket(id, { status: 'Open', assignee: '—' })
  }

  const addCommentToTicket = (ticketId: string, text: string) => {
    if (!text.trim()) return
    const comment: TicketComment = {
      id: nextId('c'),
      at: nowIso(),
      by: 'ops_nguyen',
      text: text.trim(),
    }
    setTicketComments((prev) => ({
      ...prev,
      [ticketId]: [...(prev[ticketId] ?? []), comment],
    }))
    setCommentDraft('')
  }

  const assignTicket = (id: string, assignee: string) => {
    const t = tickets.find((x) => x.id === id)
    const patch: Partial<Ticket> = { assignee }
    if (assignee !== '—' && t?.status === 'Open') patch.status = 'In Progress'
    updateTicket(id, patch)
    setAssignModalTicketId(null)
  }

  const createTicketFromIncidents = (incidentIds: string[]) => {
    const newSerial = `ADS-2026-${String(tickets.length + 1).padStart(3, '0')}`
    const newTicket: Ticket = {
      id: nextId('t'),
      serialNo: newSerial,
      status: 'Open',
      assignee: '—',
      severity: incidents.find((i) => i.id === incidentIds[0])?.severity ?? 'Medium',
      issueDate: nowIso(),
      ruleCategory: 'Multiple',
      incidentCount: incidentIds.length,
    }
    setTickets((prev) => [newTicket, ...prev])
    setScreen('tickets-sop')
  }

  const screenTitle =
    screen === 'tickets-ads'
      ? 'Ticket Management (ADS)'
      : screen === 'tickets-sop'
        ? 'Ticket Management (SOP)'
        : screen === 'ticket-detail'
        ? 'Ticket Detail'
        : screen === 'incidents'
          ? 'Incident Management'
          : screen === 'rules'
            ? 'Rule Management'
            : screen === 'exception-rules'
              ? 'Exception Detection Rules'
              : screen === 'exception-list'
                ? 'Exception List'
                : screen === 'dashboard'
                  ? 'Dashboard'
                  : screen === 'sop'
                    ? 'SOP Workflow Management'
                    : screen === 'ticket-process-settings'
                      ? 'Ticket Process Settings'
                      : 'Surveillance Analytics'

  return (
    <div className="demoRoot">
      <div className="demoShell">
        <aside className="demoSidebar">
          <div className="demoBrand">
            <span className="demoBrandMark" />
            <div>
              <div className="demoBrandName">ADS & SOP</div>
              <div className="demoBrandMeta">Ticket, exception & workflow</div>
            </div>
          </div>

          <nav className="demoNav">
            <div className="demoNavGroup">
              <div className="demoNavGroupTitle">Tickets</div>
              <button
                className={cx('demoNavItem', screen === 'tickets-ads' && 'demoNavItemActive')}
                onClick={() => { setScreen('tickets-ads'); setTicketDetailId(null); setAdsTicketMainTab('ticket-detail'); }}
              >
                ADS Tickets
              </button>
              <button
                className={cx('demoNavItem', screen === 'tickets-sop' && 'demoNavItemActive')}
                onClick={() => { setScreen('tickets-sop'); setTicketDetailId(null); clearTicketSelection(); }}
              >
                SOP Tickets
              </button>
              <button
                className={cx('demoNavItem', screen === 'incidents' && 'demoNavItemActive')}
                onClick={() => setScreen('incidents')}
              >
                Incident Management
              </button>
            </div>
            <div className="demoNavGroup">
              <div className="demoNavGroupTitle">Rules</div>
              <button
                className={cx('demoNavItem', screen === 'rules' && 'demoNavItemActive')}
                onClick={() => setScreen('rules')}
              >
                Rule Management
              </button>
              <button
                className={cx('demoNavItem', screen === 'exception-rules' && 'demoNavItemActive')}
                onClick={() => setScreen('exception-rules')}
              >
                Exception Rules
              </button>
              <button
                className={cx('demoNavItem', screen === 'exception-list' && 'demoNavItemActive')}
                onClick={() => setScreen('exception-list')}
              >
                Exception List
              </button>
            </div>
            <div className="demoNavGroup">
              <div className="demoNavGroupTitle">Overview</div>
              <button
                className={cx('demoNavItem', screen === 'dashboard' && 'demoNavItemActive')}
                onClick={() => setScreen('dashboard')}
              >
                Dashboard
              </button>
            </div>
            <div className="demoNavGroup">
              <div className="demoNavGroupTitle">Workflow</div>
              <button
                className={cx('demoNavItem', screen === 'sop' && 'demoNavItemActive')}
                onClick={() => setScreen('sop')}
              >
                SOP Workflow
              </button>
              <button
                className={cx('demoNavItem', screen === 'analytics' && 'demoNavItemActive')}
                onClick={() => setScreen('analytics')}
              >
                Analytics
              </button>
            </div>
            <div className="demoNavGroup">
              <div className="demoNavGroupTitle">Config</div>
              <button
                className={cx('demoNavItem', screen === 'ticket-process-settings' && 'demoNavItemActive')}
                onClick={() => setScreen('ticket-process-settings')}
              >
                Ticket Process Settings
              </button>
            </div>
          </nav>

          <button className="demoExit" onClick={onExit}>
            ← Back to portfolio
          </button>
        </aside>

        <main className="demoMain">
          <header className="demoTopbar">
            <div className="demoTopbarLeft">
              <div className="demoTitle">{screenTitle}</div>
              <div className="demoSubtitle">System: ADS & SOP</div>
            </div>
            {(screen === 'sop' || screen === 'analytics') ? (
              <div className="demoTopbarRight">
                <label className="demoField">
                  <span>Role</span>
                  <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                    <option value="Operator">Operator</option>
                    <option value="Admin">Admin</option>
                  </select>
                </label>
              </div>
            ) : null}
          </header>

          {screen === 'tickets-ads' ? (
            <section className="demoPanel" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button type="button" className={cx('demoBtn', adsTicketMainTab === 'ticket-detail' && 'demoBtnPrimary')} onClick={() => setAdsTicketMainTab('ticket-detail')}>Ticket Detail</button>
                <button type="button" className={cx('demoBtn', adsTicketMainTab === 'ticket-process' && 'demoBtnPrimary')} onClick={() => setAdsTicketMainTab('ticket-process')}>Ticket Process</button>
              </div>
              {detailTicket && lockedTicketId === detailTicket.id ? (
                <div className="panel" style={{ padding: 12, background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 8 }}>
                  <strong>Ticket locked</strong> – read and comment only. Another user is editing this ticket.
                </div>
              ) : null}
              {adsTicketMainTab === 'ticket-detail' ? (
                <>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div className="panel" style={{ flex: '1 1 320px', minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                        {['Rawdata', 'Origin Log', 'SPL', 'Decode', 'Sort', 'Search', 'Extend'].map((t) => (
                          <button key={t} type="button" className="demoBtn demoBtnGhost" style={{ fontSize: 12 }}>{t}</button>
                        ))}
                      </div>
                      <pre style={{ margin: 0, padding: 12, background: 'var(--panel-2)', borderRadius: 8, fontSize: 11, width: '100%', boxSizing: 'border-box', whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflowX: 'hidden', overflowY: 'auto', maxHeight: 280 }}>
                        {detailTicket ? `date=2024/05/22 time=11:25:01 eventtime=1716373501 logid="123" type=alert severity=low srcip=${detailTicket.entity ?? '203.229.175.101'} dstip=0.0.0.0 service=file filetype=doc action=read` : 'Select a ticket to view rawdata.'}
                      </pre>
                    </div>
                    <div className="panel" style={{ flex: '1 1 320px', minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                        {['Related Tickets', 'Activity Logs', 'Comments'].map((t) => (
                          <button key={t} type="button" className="demoBtn demoBtnGhost" style={{ fontSize: 12 }}>{t}</button>
                        ))}
                      </div>
                      <div style={{ padding: 12, background: 'var(--panel-2)', borderRadius: 8, minHeight: 120 }}>
                        {detailTicket ? <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>No data</p> : <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>No ticket selected.</p>}
                      </div>
                    </div>
                  </div>
                  <div className="panel" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <button type="button" className={cx('demoBtn demoBtnGhost', adsListTableTab === 'by-time' && 'demoBtnPrimary')} onClick={() => setAdsListTableTab('by-time')}>Ticket List (By Time)</button>
                      <button type="button" className={cx('demoBtn demoBtnGhost', adsListTableTab === 'by-risk-user' && 'demoBtnPrimary')} onClick={() => setAdsListTableTab('by-risk-user')}>Ticket List (By Risk User)</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      {(['Open', 'Running', 'Done', 'Close'] as const).map((s) => (
                        <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                          <input type="radio" name="adsStatus" checked={adsListStatusFilter === s} onChange={() => setAdsListStatusFilter(s)} />
                          <span>{s}</span>
                        </label>
                      ))}
                      {['Today', 'Last hour', 'Last 4 hours', 'Last 12 hours', 'Last 7 days'].map((p) => (
                        <button key={p} type="button" className="miniBtn">{p}</button>
                      ))}
                      <button type="button" className="miniBtn" title="Search">🔍</button>
                      <button type="button" className="miniBtn" onClick={() => setTickets((p) => [...p])} title="Refresh">↻</button>
                      <button
                        type="button"
                        className="miniBtn"
                        title={lockedTicketId ? 'Unlock ticket' : 'Lock ticket'}
                        onClick={() => setLockedTicketId((prev) => (prev ? null : ticketDetailId ?? null))}
                        style={lockedTicketId ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}
                      >
                        🔒
                      </button>
                      <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>Auto</span>
                      <button type="button" className="demoBtn">Export Excel</button>
                      <select
                        value={adsListPageSize}
                        onChange={(e) => { setAdsListPageSize(Number(e.target.value)); setAdsListPageIndex(0) }}
                        style={{ padding: '4px 8px', fontSize: 12 }}
                      >
                        {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {adsFilteredTickets.length === 0 ? '0' : `${adsListPageIndex * adsListPageSize + 1}-${Math.min((adsListPageIndex + 1) * adsListPageSize, adsFilteredTickets.length)}`} of {adsFilteredTickets.length}
                      </span>
                      <button type="button" className="miniBtn">Setting</button>
                    </div>
                    {adsListStatusFilter === 'Open' ? (
                      <button type="button" className="demoBtn" style={{ marginBottom: 12 }}>Close Ticket</button>
                    ) : null}
                    <div className="demoTableWrap">
                      <table className="demoTable">
                        <thead>
                          <tr>
                            <th><input type="checkbox" /></th>
                            <th></th>
                            <th>Time</th>
                            <th>ID</th>
                            <th>Group</th>
                            <th>Ticket Tag</th>
                            <th>Rule Type</th>
                            <th>Rule Category</th>
                            <th>Rule Info</th>
                            <th>Rule Code</th>
                            <th>User</th>
                            <th>Severity</th>
                            <th>Entity</th>
                            <th>Result</th>
                            <th>Merge</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adsListPageTickets.map((t) => (
                            <tr
                              key={t.id}
                              onClick={() => { setTicketDetailId(t.id); setScreen('tickets-ads'); }}
                              style={{ cursor: 'pointer', ...(ticketDetailId === t.id ? { background: 'var(--accent-soft)' } : {}) }}
                            >
                              <td onClick={(e) => e.stopPropagation()}><input type="checkbox" /></td>
                              <td>▾</td>
                              <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{t.issueDate}</td>
                              <td><code style={{ fontSize: 11 }}>{t.serialNo}</code></td>
                              <td>{t.group ?? '—'}</td>
                              <td>
                                <span className={cx('badge', t.ticketTag === 'Focused' || t.ticketTag === 'Review' ? 'badgeSeverityHigh' : t.ticketTag === 'Normal' ? 'badgeSeverityMedium' : 'badge')}>{t.ticketTag ?? '—'}</span>
                              </td>
                              <td>{t.ruleCategory?.includes('Anomaly') ? 'Anomaly' : 'Threat'}</td>
                              <td>{t.ruleCategory}</td>
                              <td style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.ruleInformation ?? '—'}</td>
                              <td><code style={{ fontSize: 11 }}>{t.ruleCode ?? '—'}</code></td>
                              <td>{t.user ?? t.assignee}</td>
                              <td><span className={cx('badge', `badgeSeverity${t.severity}`)}>{t.severity}</span></td>
                              <td><code style={{ fontSize: 11 }}>{t.entity ?? '—'}</code></td>
                              <td>{t.result ?? '—'}</td>
                              <td>{t.merge ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8 }}>
                      <button type="button" className="miniBtn" disabled={adsListPageIndex <= 0} onClick={() => setAdsListPageIndex((p) => Math.max(0, p - 1))}>&lt;</button>
                      {Array.from({ length: Math.min(5, adsListPageCount) }, (_, i) => {
                        const page = i
                        return (
                          <button
                            key={page}
                            type="button"
                            className="miniBtn"
                            onClick={() => setAdsListPageIndex(page)}
                            style={adsListPageIndex === page ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}
                          >
                            {page + 1}
                          </button>
                        )
                      })}
                      <button type="button" className="miniBtn" disabled={adsListPageIndex >= adsListPageCount - 1} onClick={() => setAdsListPageIndex((p) => Math.min(adsListPageCount - 1, p + 1))}>&gt;</button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="panel" style={{ padding: 16 }}>
                    <div className="panelTitle" style={{ marginBottom: 12 }}>Diagnosis details</div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                      {detailTicket ? `IN-02-A16 Signature Detected_WAF(1c_10m) incident from ${detailTicket.entity ?? '98.70.56.113'} to 58.228.236.165 at ${detailTicket.issueDate}.` : 'Select a ticket.'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                      <select style={{ padding: '6px 10px', fontSize: 12 }} defaultValue="Anomaly"><option value="Anomaly">Analysis Result: Anomaly</option><option value="FP">Analysis Result: FP</option></select>
                      <select style={{ padding: '6px 10px', fontSize: 12 }} defaultValue={detailTicket?.ticketTag ?? 'Normal'}><option value="Normal">Ticket Tag: Normal</option><option value="Focused">Ticket Tag: Focused</option><option value="Review">Ticket Tag: Review</option><option value="Exception">Ticket Tag: Exception</option></select>
                      <button type="button" className="demoBtn demoBtnGhost" disabled={!detailTicket} onClick={() => { if (!detailTicket) return; updateTicket(detailTicket.id, { ticketTag: 'Review' }); showToast('Marked as Review') }}>Review Ticket</button>
                      <button type="button" className="demoBtn demoBtnGhost" disabled={!detailTicket} onClick={() => { if (!detailTicket) return; setMailPreview({ kind: 'ADS', ticketId: detailTicket.id }) }}>Preview Mail</button>
                      <button type="button" className="demoBtn demoBtnGhost" disabled={!detailTicket} onClick={() => { if (!detailTicket) return; addTicketComment(detailTicket.id, 'Request support: please review this ticket.', 'ops_support'); showToast('Support requested') }}>Request Support</button>
                      {canWorkflowReject('ADS', detailTicket) ? (
                        <button type="button" className="demoBtn demoBtnGhost" disabled={!detailTicket || lockedTicketId === detailTicket?.id} onClick={() => { if (!detailTicket) return; runWorkflowReject('ADS', detailTicket) }}>Reject</button>
                      ) : null}
                      {canWorkflowTransfer('ADS', detailTicket) ? (
                        <button type="button" className="demoBtn demoBtnGhost" disabled={!detailTicket || lockedTicketId === detailTicket?.id} onClick={() => { if (!detailTicket) return; transferDepartmentTeam(detailTicket.id); showToast('Transferred') }}>Transfer</button>
                      ) : null}
                      {canWorkflowWithdraw('ADS', detailTicket) ? (
                        <button type="button" className="demoBtn demoBtnGhost" disabled={!detailTicket || lockedTicketId === detailTicket?.id} onClick={() => { if (!detailTicket) return; runWorkflowWithdraw('ADS', detailTicket) }}>Withdraw</button>
                      ) : null}
                      {canWorkflowArbitrarilyApprove('ADS', detailTicket) ? (
                        <button type="button" className="demoBtn demoBtnGhost" disabled={!detailTicket || lockedTicketId === detailTicket?.id} onClick={() => { if (!detailTicket) return; runWorkflowArbitrarilyApprove('ADS', detailTicket) }}>Arbitrarily Approve</button>
                      ) : null}
                      <button type="button" className="demoBtn" disabled={!detailTicket || lockedTicketId === detailTicket?.id} onClick={() => { if (!detailTicket) return; runWorkflowApprove('ADS', detailTicket) }}>Approve</button>
                    </div>
                    <div style={{ marginTop: 16 }}>
                      {(() => {
                        const activeIdx = adsProcessActiveIndex(detailTicket)
                        const rows: Array<[string, string, string, string]> = [
                          ['Open', 'Department 1', 'Team 1', 'User 1'],
                          ['Analysis', 'Department 1', 'Team 1', 'User 2'],
                          ['Explain', 'Department 2', 'Team 2', 'User 3'],
                          ['Explain Approval', 'Department 3', 'Team 2', 'User 4'],
                          ['Explain Verify', 'Department 2', 'Team 2', 'User 5'],
                          ['Verify Confirm', 'Department 1', 'Team 1', 'User 6'],
                        ]
                        return rows.map(([step, dep, team, user], idx) => (
                        <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: idx === activeIdx ? 'var(--accent)' : 'var(--panel-2)', color: idx === activeIdx ? '#fff' : 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{idx + 1}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>[{step}] - {dep} - {team} - {user}</div>
                            {idx === activeIdx ? (
                              <div style={{ marginTop: 8, padding: 12, background: 'var(--panel-2)', borderRadius: 8 }}>
                                <div style={{ marginBottom: 8 }}>Incident details, Attachment, History, Remarks</div>
                                <textarea
                                  placeholder={
                                    step === 'Open' ? 'Open: initial notes…'
                                    : step === 'Analysis' ? 'Analysis: investigation notes…'
                                    : step === 'Explain' ? 'Explain: write explanation…'
                                    : step === 'Explain Approval' ? 'Approval: decision & evidence…'
                                    : step === 'Explain Verify' ? 'Verify: validation steps…'
                                    : 'Confirm: closure notes…'
                                  }
                                  style={{ width: '100%', minHeight: 80, padding: 8, fontSize: 12 }}
                                  onChange={(e) => {
                                    if (!detailTicket) return
                                    if (lockedTicketId === detailTicket.id) return
                                    setCommentDraft(e.target.value)
                                  }}
                                  value={commentDraft}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                  <button
                                    type="button"
                                    className="miniBtn"
                                    disabled={!detailTicket || lockedTicketId === detailTicket?.id || !commentDraft.trim()}
                                    onClick={() => {
                                      if (!detailTicket) return
                                      addTicketComment(detailTicket.id, commentDraft.trim(), 'ops_nguyen')
                                      setCommentDraft('')
                                      showToast('Saved remark')
                                    }}
                                  >
                                    Save remark
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        ))
                      })()}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <button type="button" className="demoBtn demoBtnGhost" style={{ fontSize: 12 }}>View Activity Logs</button>
                      <button type="button" className="demoBtn demoBtnGhost" style={{ fontSize: 12 }}>View Comments</button>
                    </div>
                  </div>
                  <div className="panel" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <button type="button" className={cx('demoBtn demoBtnGhost', adsListTableTab === 'by-time' && 'demoBtnPrimary')} onClick={() => setAdsListTableTab('by-time')}>Ticket List (By Time)</button>
                      <button type="button" className={cx('demoBtn demoBtnGhost', adsListTableTab === 'by-risk-user' && 'demoBtnPrimary')} onClick={() => setAdsListTableTab('by-risk-user')}>Ticket List (By Risk User)</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      {(['Open', 'Running', 'Done', 'Close'] as const).map((s) => (
                        <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                          <input type="radio" name="adsStatus2" checked={adsListStatusFilter === s} onChange={() => setAdsListStatusFilter(s)} />
                          <span>{s}</span>
                        </label>
                      ))}
                      <button
                        type="button"
                        className="miniBtn"
                        title={lockedTicketId ? 'Unlock ticket' : 'Lock ticket'}
                        onClick={() => setLockedTicketId((prev) => (prev ? null : ticketDetailId ?? null))}
                        style={lockedTicketId ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}
                      >🔒</button>
                      <button type="button" className="demoBtn">Export Excel</button>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {adsFilteredTickets.length === 0 ? '0' : `${adsListPageIndex * adsListPageSize + 1}-${Math.min((adsListPageIndex + 1) * adsListPageSize, adsFilteredTickets.length)}`} of {adsFilteredTickets.length}
                      </span>
                      <button type="button" className="miniBtn">Setting</button>
                    </div>
                    <div className="demoTableWrap">
                      <table className="demoTable">
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>ID</th>
                            <th>Group</th>
                            <th>Ticket Tag</th>
                            <th>Rule Type</th>
                            <th>User</th>
                            <th>Severity</th>
                            <th>Entity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adsListPageTickets.map((t) => (
                            <tr key={t.id} onClick={() => { setTicketDetailId(t.id); }} style={{ cursor: 'pointer', ...(ticketDetailId === t.id ? { background: 'var(--accent-soft)' } : {}) }}>
                              <td style={{ fontSize: 12 }}>{t.issueDate}</td>
                              <td><code style={{ fontSize: 11 }}>{t.serialNo}</code></td>
                              <td>{t.group ?? '—'}</td>
                              <td><span className="badge badgeSeverityMedium">{t.ticketTag ?? 'Normal'}</span></td>
                              <td>Anomaly</td>
                              <td>{t.user ?? t.assignee}</td>
                              <td><span className={cx('badge', `badgeSeverity${t.severity}`)}>{t.severity}</span></td>
                              <td><code style={{ fontSize: 11 }}>{t.entity ?? '—'}</code></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8 }}>
                      <button type="button" className="miniBtn" disabled={adsListPageIndex <= 0} onClick={() => setAdsListPageIndex((p) => Math.max(0, p - 1))}>&lt;</button>
                      {Array.from({ length: Math.min(5, adsListPageCount) }, (_, i) => {
                        const page = i
                        return (
                          <button
                            key={page}
                            type="button"
                            className="miniBtn"
                            onClick={() => setAdsListPageIndex(page)}
                            style={adsListPageIndex === page ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}
                          >
                            {page + 1}
                          </button>
                        )
                      })}
                      <button type="button" className="miniBtn" disabled={adsListPageIndex >= adsListPageCount - 1} onClick={() => setAdsListPageIndex((p) => Math.min(adsListPageCount - 1, p + 1))}>&gt;</button>
                    </div>
                  </div>
                </>
              )}
            </section>
          ) : screen === 'tickets-sop' ? (
            <section className="demoPanel" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div className="demoTitle">&lt; Ticket Management</div>
                <button type="button" className="demoBtn">Export Excel</button>
              </div>

              {detailTicket && lockedTicketId === detailTicket.id ? (
                <div className="panel" style={{ padding: 12, background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 8 }}>
                  <strong>Ticket locked</strong> – read and comment only.
                </div>
              ) : null}
              {detailTicket ? (
                <>
                  <div className="panel" style={{ padding: 16 }}>
                    <div className="panelTitle" style={{ marginBottom: 12 }}>Ticket Process</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      {SOP_STEP_NAMES.map((name, idx) => {
                        const stepIdx = ticketStatusToStepIndex(detailTicket.status)
                        const isActive = stepIdx === idx
                        const isPast = stepIdx > idx
                        return (
                          <button
                            key={name}
                            type="button"
                            className="demoBtn"
                            style={{
                              ...(isActive ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : isPast ? { opacity: 0.8 } : { opacity: 0.5 }),
                            }}
                          >
                            {idx + 1}. {name}
                          </button>
                        )
                      })}
                      <div style={{ flex: 1, minWidth: 80 }} />
                      <button type="button" className="demoBtn demoBtnGhost" onClick={() => closeTicket(detailTicket.id)}>Close</button>
                      {canWorkflowReject('SOP', detailTicket) ? (
                        <button type="button" className="demoBtn demoBtnGhost" onClick={() => runWorkflowReject('SOP', detailTicket)} disabled={lockedTicketId === detailTicket.id}>Reject</button>
                      ) : null}
                      {canWorkflowTransfer('SOP', detailTicket) ? (
                        <button type="button" className="demoBtn demoBtnGhost" onClick={() => { transferDepartmentTeam(detailTicket.id); showToast('Transferred') }} disabled={lockedTicketId === detailTicket.id}>Transfer</button>
                      ) : null}
                      {canWorkflowWithdraw('SOP', detailTicket) ? (
                        <button type="button" className="demoBtn demoBtnGhost" onClick={() => runWorkflowWithdraw('SOP', detailTicket)} disabled={lockedTicketId === detailTicket.id}>Withdraw</button>
                      ) : null}
                      {canWorkflowArbitrarilyApprove('SOP', detailTicket) ? (
                        <button type="button" className="demoBtn demoBtnGhost" onClick={() => runWorkflowArbitrarilyApprove('SOP', detailTicket)} disabled={lockedTicketId === detailTicket.id}>Arbitrarily Approve</button>
                      ) : null}
                      <button type="button" className="demoBtn" onClick={() => runWorkflowApprove('SOP', detailTicket)} disabled={lockedTicketId === detailTicket.id}>Approve</button>
                    </div>
                    <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--muted)' }}>
                      [Malicious] Please explain incident related to excessive USB capacity usage from IP address {detailTicket.entity ?? '203.xxx.xxx.101'} at {detailTicket.issueDate}.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <button type="button" className="demoBtn demoBtnGhost" disabled={lockedTicketId === detailTicket.id} onClick={() => { updateTicket(detailTicket.id, { ticketTag: 'Review' }); showToast('Marked as Review') }}>Review Ticket</button>
                      <button type="button" className="demoBtn demoBtnGhost" onClick={() => setMailPreview({ kind: 'SOP', ticketId: detailTicket.id })}>Preview Mail</button>
                      <button type="button" className="demoBtn demoBtnGhost" onClick={() => { addTicketComment(detailTicket.id, 'Request support: please review this SOP ticket.', 'ops_support'); showToast('Support requested') }}>Request Support</button>
                      <button type="button" className="demoBtn demoBtnGhost">Block IP</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div className="panel" style={{ flex: '1 1 300px', minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        {['Rawdata', 'Origin Log', 'SPL', 'Decode', 'Comments'].map((tab) => (
                          <button key={tab} type="button" className={'demoBtn demoBtnGhost'} style={{ fontSize: 12 }}>{tab}</button>
                        ))}
                      </div>
                      <pre style={{ margin: 0, padding: 12, background: 'var(--panel-2)', borderRadius: 8, fontSize: 11, width: '100%', boxSizing: 'border-box', whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflowX: 'hidden', overflowY: 'auto', maxHeight: 280 }}>
                        {`date=2024/05/22 time=11:25:01 eventtime=1716373501 logid="123" type=alert severity=low srcip=203.229.175.101 dstip=0.0.0.0 service=file filetype=doc action=read`}
                      </pre>
                    </div>
                    <div className="panel" style={{ flex: '1 1 320px', minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        {['Review', 'Related Tickets', 'Activity Logs', 'Comments'].map((tab) => (
                          <button key={tab} type="button" className={'demoBtn demoBtnGhost'} style={{ fontSize: 12 }}>{tab}</button>
                        ))}
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <div className="demoSubtitle" style={{ marginBottom: 4 }}>Open</div>
                        <textarea placeholder="Enter explanation…" style={{ width: '100%', minHeight: 80, padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--panel-2)', color: 'var(--text)', resize: 'vertical' }} />
                      </div>
                      <div className="panel" style={{ padding: 12, marginBottom: 8, background: 'var(--panel-2)' }}>
                        <div className="panelTitle" style={{ fontSize: 12, marginBottom: 6 }}>Incident details</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          Occurrence time: {detailTicket.issueDate}<br />
                          Detection event: Error page cloaking<br />
                          Risk Step: Low
                        </div>
                      </div>
                      <button type="button" className="demoBtn demoBtnGhost" style={{ fontSize: 12 }}>Attach File</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="panel" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
                  Select a ticket from the list below to view and process it.
                </div>
              )}

              <div className="panel" style={{ padding: 16 }}>
                <div className="panelTitle" style={{ marginBottom: 12 }}>Ticket List (By Time)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="listMode" checked={ticketListViewMode === 'current'} onChange={() => { setTicketListViewMode('current'); if (!detailTicket) setTicketDetailId(filteredTicketsForList[0]?.id ?? null); }} />
                    <span>Current</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="listMode" checked={ticketListViewMode === 'ongoing'} onChange={() => { setTicketListViewMode('ongoing'); clearTicketSelection(); }} />
                    <span>Ongoing</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="listMode" checked={ticketListViewMode === 'close'} onChange={() => { setTicketListViewMode('close'); clearTicketSelection(); }} />
                    <span>Close</span>
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['Today', 'Last hour', 'Last 4 hours', 'Last 12 hours', 'Last 7 days'].map((preset) => (
                      <button key={preset} type="button" className="miniBtn">{preset}</button>
                    ))}
                  </div>
                  <div style={{ flex: 1, minWidth: 80 }} />
                  <button type="button" className="miniBtn" title="Search">🔍</button>
                  <button type="button" className="miniBtn" onClick={() => setTickets((p) => [...p])} title="Refresh">↻</button>
                  <button
                    type="button"
                    className="miniBtn"
                    title={lockedTicketId ? 'Unlock ticket' : 'Lock ticket'}
                    onClick={() => setLockedTicketId((prev) => (prev ? null : ticketDetailId ?? null))}
                    style={lockedTicketId ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}
                  >
                    🔒
                  </button>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>1-{Math.min(10, filteredTicketsForList.length)} of {filteredTicketsForList.length}</span>
                  <select
                    value={sopListPageSize}
                    onChange={(e) => { setSopListPageSize(Number(e.target.value)); setSopListPageIndex(0) }}
                    style={{ padding: '4px 8px', fontSize: 12 }}
                  >
                    {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <button type="button" className="miniBtn">Setting</button>
                </div>
                <div className="demoTableWrap">
                  <table className="demoTable">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>ID</th>
                        <th>Group</th>
                        <th>State</th>
                        <th>Ticket Tag</th>
                        <th>Rule Category</th>
                        <th>Rule Information</th>
                        <th>Rule Code</th>
                        <th>User</th>
                        <th>Severity</th>
                        <th>Entity</th>
                        <th>Result</th>
                        <th>Merge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sopListPageTickets.map((t) => (
                        <tr
                          key={t.id}
                          onClick={() => openTicketDetail(t.id)}
                          style={{ cursor: 'pointer', ...(ticketDetailId === t.id ? { background: 'var(--accent-soft)' } : {}) }}
                        >
                          <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{t.issueDate}</td>
                          <td><code style={{ fontSize: 11 }}>{t.serialNo}</code></td>
                          <td>{t.group ?? '—'}</td>
                          <td>{t.status === 'Open' ? 'Open' : t.status === 'Closed' ? '' : t.status}</td>
                          <td>
                            <span
                              className={
                                t.ticketTag === 'Focused' || t.ticketTag === 'Review' ? 'badge badgeSeverityHigh' :
                                t.ticketTag === 'Exception' ? 'badge badgeResolved' :
                                t.ticketTag === 'Normal' ? 'badge badgeSeverityMedium' : 'badge'
                              }
                              style={t.ticketTag === 'Separate' ? { background: 'transparent', color: 'var(--accent)' } : undefined}
                            >
                              {t.ticketTag ?? '—'}
                            </span>
                          </td>
                          <td>{t.ruleCategory}</td>
                          <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.ruleInformation ?? '—'}</td>
                          <td><code style={{ fontSize: 11 }}>{t.ruleCode ?? '—'}</code></td>
                          <td>{t.user ?? t.assignee}</td>
                          <td><span className={cx('badge', `badgeSeverity${t.severity}`)}>{t.severity}</span></td>
                          <td><code style={{ fontSize: 11 }}>{t.entity ?? '—'}</code></td>
                          <td>{t.result ?? '—'}</td>
                          <td>{t.merge ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8 }}>
                  <button type="button" className="miniBtn" disabled={sopListPageIndex <= 0} onClick={() => setSopListPageIndex((p) => Math.max(0, p - 1))}>&lt;</button>
                  {Array.from({ length: Math.min(5, sopListPageCount) }, (_, i) => {
                    const page = i
                    return (
                      <button
                        key={page}
                        type="button"
                        className="miniBtn"
                        onClick={() => setSopListPageIndex(page)}
                        style={sopListPageIndex === page ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}
                      >
                        {page + 1}
                      </button>
                    )
                  })}
                  <button type="button" className="miniBtn" disabled={sopListPageIndex >= sopListPageCount - 1} onClick={() => setSopListPageIndex((p) => Math.min(sopListPageCount - 1, p + 1))}>&gt;</button>
                </div>
                <div className="demoHint" style={{ marginTop: 8 }}>
                  Ongoing: all tickets except Close. Current: filter by current step of selected ticket. Close: closed tickets. Click a row to select and load detail above.
                </div>
              </div>
            </section>
          ) : null}

          {screen === 'ticket-detail' && detailTicket ? (
            <section className="demoPanel">
              <div className="demoToolbar" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <div className="demoTitle" style={{ fontSize: '1.1rem' }}>{detailTicket.serialNo}</div>
                  <div className="demoSubtitle">
                    {detailTicket.ruleCategory} · {detailTicket.issueDate} · {detailTicket.assignee}
                  </div>
                </div>
                <div className="demoActions" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  <div className="demoDropdownWrap" style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="demoBtn"
                      onClick={() => setProcessMenuOpenId(processMenuOpenId === `detail-${detailTicket.id}` ? null : `detail-${detailTicket.id}`)}
                      aria-expanded={processMenuOpenId === `detail-${detailTicket.id}`}
                    >
                      Process ▾
                    </button>
                    {processMenuOpenId === `detail-${detailTicket.id}` ? (
                      <>
                        <div className="dropdownBackdrop" onClick={() => setProcessMenuOpenId(null)} aria-hidden="true" />
                        <div className="dropdownMenu" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, minWidth: 200 }}>
                          {detailTicket.status === 'Open' && (
                            <>
                              <button type="button" className="dropdownItem" onClick={() => { setAssignModalTicketId(detailTicket.id); setProcessMenuOpenId(null); }}>
                                Assign to me
                              </button>
                              <button type="button" className="dropdownItem" onClick={() => updateTicket(detailTicket.id, { status: 'In Progress', assignee: 'ops_nguyen' })}>
                                Start progress
                              </button>
                            </>
                          )}
                          {detailTicket.status === 'In Progress' && (
                            <button type="button" className="dropdownItem" onClick={() => updateTicket(detailTicket.id, { status: 'Analysis' })}>
                              Move to Analysis
                            </button>
                          )}
                          {detailTicket.status === 'Analysis' && (
                            <button type="button" className="dropdownItem" onClick={() => updateTicket(detailTicket.id, { status: 'Response' })}>
                              Move to Response
                            </button>
                          )}
                          {detailTicket.status === 'Response' && (
                            <button type="button" className="dropdownItem" onClick={() => closeTicket(detailTicket.id)}>
                              Close ticket
                            </button>
                          )}
                          {detailTicket.status === 'Closed' && (
                            <button type="button" className="dropdownItem" onClick={() => reopenTicket(detailTicket.id)}>
                              Reopen
                            </button>
                          )}
                          {(detailTicket.status === 'In Progress' || detailTicket.status === 'Analysis') && (
                            <button type="button" className="dropdownItem" onClick={() => setAssignModalTicketId(detailTicket.id)}>
                              Reassign
                            </button>
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>
                  <button type="button" className="demoBtn demoBtnGhost" onClick={() => setAssignModalTicketId(detailTicket.id)}>
                    Assign
                  </button>
                  <label className="demoField" style={{ margin: 0, flex: '1 1 160px', minWidth: 120 }}>
                    <span className="srOnly">Severity</span>
                    <select
                      value={detailTicket.severity}
                      onChange={(e) => updateTicket(detailTicket.id, { severity: e.target.value as Severity })}
                      style={{ padding: '6px 10px' }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </label>
                  {detailTicket.status !== 'Closed' ? (
                    <button type="button" className="demoBtn" onClick={() => closeTicket(detailTicket.id)}>
                      Close ticket
                    </button>
                  ) : (
                    <button type="button" className="demoBtn demoBtnGhost" onClick={() => reopenTicket(detailTicket.id)}>
                      Reopen
                    </button>
                  )}
                  <button
                    type="button"
                    className="demoBtn demoBtnGhost"
                    onClick={() => { setScreen('tickets-sop'); setTicketDetailId(null); clearTicketSelection() }}
                  >
                    Back to list
                  </button>
                </div>
              </div>
              <div className="split" style={{ gap: '1rem' }}>
                <div className="panel" style={{ flex: 1 }}>
                  <div className="panelTitle">Incidents in this ticket</div>
                  <ul className="timelineList">
                    {Array.from({ length: detailTicket.incidentCount }, (_, i) => (
                      <li key={i} className="timelineItem">
                        <span className="badge badgeSeverityHigh">Incident {i + 1}</span>
                        <span className="timelineText">Rule: {detailTicket.ruleCategory} · {detailTicket.issueDate}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="panel" style={{ flex: 1 }}>
                  <div className="panelTitle">Comments & history</div>
                  <ul className="timelineList">
                    <li className="timelineItem">
                      <span className="badge badgeEventNew">New</span>
                      <span className="timelineText">Ticket created · {detailTicket.issueDate}</span>
                    </li>
                    {detailTicket.status !== 'Open' && detailTicket.assignee !== '—' ? (
                      <li className="timelineItem">
                        <span className="badge badgeEventInvestigating">Assigned</span>
                        <span className="timelineText">Assigned to {detailTicket.assignee}</span>
                      </li>
                    ) : null}
                    {(ticketComments[detailTicket.id] ?? []).map((c) => (
                      <li key={c.id} className="timelineItem">
                        <span className="badge badgeEventNew">Comment</span>
                        <span className="timelineText">{c.by} · {c.at}</span>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}>{c.text}</p>
                      </li>
                    ))}
                  </ul>
                  {detailTicket.status !== 'Closed' && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                      <label className="demoField" style={{ flex: 1, margin: 0 }}>
                        <span className="srOnly">New comment</span>
                        <input
                          value={commentDraft}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          placeholder="Add a comment…"
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && addCommentToTicket(detailTicket.id, commentDraft)}
                        />
                      </label>
                      <button
                        type="button"
                        className="demoBtn"
                        onClick={() => addCommentToTicket(detailTicket.id, commentDraft)}
                        disabled={!commentDraft.trim()}
                      >
                        Add comment
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="demoHint">Process menu: change status. Assign: pick assignee. Add comment: persists in this session.</div>
            </section>
          ) : null}

          {screen === 'ticket-process-settings' && !selectedProcess ? (
            <section className="demoPanel">
              <div className="demoToolbar">
                <div className="demoFilters">
                  <label className="demoField">
                    <span>Created date</span>
                    <input type="date" style={{ padding: '6px 10px' }} />
                  </label>
                  <label className="demoField">
                    <span>→</span>
                    <input type="date" style={{ padding: '6px 10px' }} />
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button type="button" className="miniBtn">Today</button>
                    <button type="button" className="miniBtn">Last 7 days</button>
                  </div>
                </div>
                <div className="demoActions">
                  <button type="button" className="demoBtn" onClick={() => setAddProcessPanelOpen(true)}>
                    + Create new process
                  </button>
                  <button type="button" className="demoBtn demoBtnGhost" onClick={() => setTicketProcesses((p) => [...p])}>
                    Refresh
                  </button>
                </div>
              </div>
              <div className="demoTableWrap">
                <table className="demoTable">
                  <thead>
                    <tr>
                      <th>Process Name</th>
                      <th>Process Category</th>
                      <th>Rule Category</th>
                      <th>Group</th>
                      <th>Creator</th>
                      <th>Created Date</th>
                      <th>In-use</th>
                      <th>Step Structure</th>
                      <th>Default</th>
                      <th>Enabled</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketProcesses.map((proc) => (
                      <tr key={proc.id}>
                        <td>{proc.processName}</td>
                        <td>{proc.processCategory}</td>
                        <td>{proc.ruleCategory}</td>
                        <td>{proc.group || '—'}</td>
                        <td>{proc.creator}</td>
                        <td>{proc.createdDate}</td>
                        <td>{proc.inUseTickets}</td>
                        <td><code style={{ fontSize: 11 }}>{proc.stepStructure}</code></td>
                        <td>{proc.isDefault ? 'Yes' : '—'}</td>
                        <td>{proc.enabled ? 'Yes' : 'No'}</td>
                        <td>
                          <button type="button" className="miniBtn" onClick={() => setSelectedProcessId(proc.id)}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="demoHint">Process Category: ADS hoặc SOP. Bấm Edit để xem/sửa chi tiết process và các step.</div>
            </section>
          ) : null}

          {screen === 'ticket-process-settings' && selectedProcess ? (
            <section className="demoPanel">
              <div className="demoToolbar" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <button type="button" className="demoBtn demoBtnGhost" onClick={() => setSelectedProcessId(null)}>
                  ← Back
                </button>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div className="demoTitle" style={{ fontSize: '1rem' }}>Ticket Process Settings / Edit Process</div>
                  <div className="demoSubtitle">{selectedProcess.processName}</div>
                </div>
                <div className="demoActions" style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="demoBtn demoBtnGhost">Cancel</button>
                  <button type="button" className="demoBtn demoBtnGhost">Save As New Process</button>
                  <button type="button" className="demoBtn">Save</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                  type="button"
                  className={'demoBtn' + (processDetailTab === 'information' ? ' demoBtnGhost' : '')}
                  style={processDetailTab === 'information' ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : {}}
                  onClick={() => setProcessDetailTab('information')}
                >
                  Information
                </button>
                <button
                  type="button"
                  className={'demoBtn' + (processDetailTab === 'ticket-history' ? ' demoBtnGhost' : '')}
                  style={processDetailTab === 'ticket-history' ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : {}}
                  onClick={() => setProcessDetailTab('ticket-history')}
                >
                  Ticket History
                </button>
              </div>
              {processDetailTab === 'information' ? (
                <>
                  <div className="formGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
                    <label className="demoField">
                      <span>Process Name *</span>
                      <input
                        value={selectedProcess.processName}
                        onChange={(e) => updateProcess(selectedProcess.id, { processName: e.target.value })}
                      />
                    </label>
                    <label className="demoField">
                      <span>Process Category *</span>
                      <select
                        value={selectedProcess.processCategory}
                        onChange={(e) => updateProcess(selectedProcess.id, { processCategory: e.target.value as ProcessCategory })}
                      >
                        <option value="ADS">ADS</option>
                        <option value="SOP">SOP</option>
                      </select>
                    </label>
                    <label className="demoField">
                      <span>Rule Category</span>
                      <select
                        value={selectedProcess.ruleCategory}
                        onChange={(e) => updateProcess(selectedProcess.id, { ruleCategory: e.target.value })}
                      >
                        <option value="threat">threat</option>
                        <option value="endpoint">endpoint</option>
                        <option value="identity">identity</option>
                        <option value="Audit">Audit</option>
                      </select>
                    </label>
                    <label className="demoField">
                      <span>Group</span>
                      <select
                        value={selectedProcess.group}
                        onChange={(e) => updateProcess(selectedProcess.id, { group: e.target.value })}
                      >
                        <option value="">Select Group</option>
                        <option value="Group 1">Group 1</option>
                        <option value="Group 2">Group 2</option>
                      </select>
                    </label>
                    <label className="demoField">
                      <span>Department</span>
                      <select
                        value={selectedProcess.department}
                        onChange={(e) => updateProcess(selectedProcess.id, { department: e.target.value })}
                      >
                        <option value="">Select Department</option>
                      </select>
                    </label>
                    <label className="demoField">
                      <span>Team</span>
                      <select
                        value={selectedProcess.team}
                        onChange={(e) => updateProcess(selectedProcess.id, { team: e.target.value })}
                      >
                        <option value="">Select Team</option>
                      </select>
                    </label>
                    <label className="demoField" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={selectedProcess.enabled}
                        onChange={(e) => updateProcess(selectedProcess.id, { enabled: e.target.checked })}
                      />
                      <span>Enabled</span>
                    </label>
                    <label className="demoField" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={selectedProcess.isDefault}
                        onChange={(e) => updateProcess(selectedProcess.id, { isDefault: e.target.checked })}
                      />
                      <span>Default</span>
                    </label>
                  </div>
                  <div className="demoHint" style={{ marginBottom: 12 }}>
                    If you don't select rule category / group / department / team, this process will apply to all.
                  </div>
                  <div className="panelTitle" style={{ marginBottom: 8 }}>Process Steps</div>
                  <div className="demoTableWrap">
                    <table className="demoTable">
                      <thead>
                        <tr>
                          <th>Is Explain</th>
                          <th>Stage</th>
                          <th>Step</th>
                          <th>Step Name</th>
                          <th>Read/Comment</th>
                          <th>Process Permission</th>
                          <th>Step Begin Notification</th>
                          <th>Step End Notification</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProcess.steps.map((s) => (
                          <tr key={s.id}>
                            <td>{s.isExplain ? '✓' : '—'}</td>
                            <td>{s.stage}</td>
                            <td>{s.step}</td>
                            <td>{s.stepName}</td>
                            <td>{s.readCommentPermission}</td>
                            <td>{s.processPermission}</td>
                            <td style={{ fontSize: 11 }}>{s.stepBeginNotification}</td>
                            <td style={{ fontSize: 11 }}>{s.stepEndNotification}</td>
                            <td>
                              <div className="rowActions" style={{ flexWrap: 'wrap', gap: 4 }}>
                                <button type="button" className="miniBtn" onClick={() => openAddStepModal(selectedProcess.id, s.id)} title="Settings">
                                  ⚙
                                </button>
                                <button type="button" className="miniBtn" onClick={() => duplicateProcessStep(selectedProcess.id, s.id)}>Duplicate</button>
                                <button type="button" className="miniBtn" onClick={() => deleteProcessStep(selectedProcess.id, s.id)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" className="demoBtn" style={{ marginTop: 12 }} onClick={() => openAddStepModal(selectedProcess.id, null)}>
                    + Add New Step
                  </button>
                </>
              ) : (
                <>
                  <div className="demoHint" style={{ marginBottom: 12 }}>
                    Tickets that used this process. Filter by process: {selectedProcess.processName}.
                  </div>
                  <div className="demoTableWrap">
                    <table className="demoTable">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>ID</th>
                          <th>Group</th>
                          <th>State</th>
                          <th>Ticket Tag</th>
                          <th>Rule Category</th>
                          <th>Rule Information</th>
                          <th>Rule Code</th>
                          <th>User</th>
                          <th>Severity</th>
                          <th>Entity</th>
                          <th>Result</th>
                          <th>Merge</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticketHistory
                          .filter((h) => h.processId === selectedProcess.id)
                          .map((h) => (
                            <tr key={h.id}>
                              <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{h.time}</td>
                              <td><code style={{ fontSize: 11 }}>{h.ticketId}</code></td>
                              <td>{h.group}</td>
                              <td>{h.state || '—'}</td>
                              <td>
                                <span
                                  className={
                                    h.ticketTag === 'Focused' || h.ticketTag === 'Review'
                                      ? 'badge badgeSeverityHigh'
                                      : h.ticketTag === 'Exception'
                                        ? 'badge badgeResolved'
                                        : h.ticketTag === 'Normal'
                                          ? 'badge badgeSeverityMedium'
                                          : 'badge'
                                  }
                                  style={
                                    h.ticketTag === 'Separate'
                                      ? { background: 'transparent', color: 'var(--accent)' }
                                      : undefined
                                  }
                                >
                                  {h.ticketTag}
                                </span>
                              </td>
                              <td>{h.ruleCategory}</td>
                              <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.ruleInformation}</td>
                              <td><code style={{ fontSize: 11 }}>{h.ruleCode}</code></td>
                              <td>{h.user}</td>
                              <td>
                                <span className={cx('badge', `badgeSeverity${h.severity}`)}>{h.severity}</span>
                              </td>
                              <td><code style={{ fontSize: 11 }}>{h.entity}</code></td>
                              <td>{h.result}</td>
                              <td>{h.merge}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {ticketHistory.filter((h) => h.processId === selectedProcess.id).length === 0 ? (
                    <div className="demoEmpty">
                      <div className="demoEmptyMeta">No tickets have used this process yet.</div>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          ) : null}

          {screen === 'incidents' ? (
            <section className="demoPanel">
              <div className="demoToolbar">
                <div className="demoFilters">
                  <label className="demoField demoSearch">
                    <span>Search</span>
                    <input value={searchIncident} onChange={(e) => setSearchIncident(e.target.value)} placeholder="Rule, IP, severity…" />
                  </label>
                </div>
                <div className="demoActions">
                  <button
                    className="demoBtn"
                    onClick={() => createTicketFromIncidents([incidents[0]?.id].filter(Boolean) as string[])}
                    disabled={!incidents.length}
                  >
                    Create ticket from selected
                  </button>
                  <button className="demoBtn" onClick={() => setIncidents((p) => [...p])}>
                    Refresh
                  </button>
                </div>
              </div>
              <div className="demoTableWrap">
                <table className="demoTable">
                  <thead>
                    <tr>
                      <th>Rule</th>
                      <th>Severity</th>
                      <th>Detected at</th>
                      <th>Source IP</th>
                      <th>Asset score</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidents.map((i) => (
                      <tr key={i.id}>
                        <td>{i.ruleName}</td>
                        <td>
                          <span className={cx('badge', `badgeSeverity${i.severity}`)}>{i.severity}</span>
                        </td>
                        <td>{i.detectedAt}</td>
                        <td>{i.srcIp}</td>
                        <td>{i.assetScore}</td>
                        <td>
                          <button
                            className="miniBtn"
                            onClick={() => createTicketFromIncidents([i.id])}
                          >
                            Create ticket
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="demoHint">Select incidents and create a ticket, or create from a single incident.</div>
            </section>
          ) : null}

          {screen === 'rules' ? (
            <section className="demoPanel">
              <div className="demoToolbar">
                <div className="demoFilters">
                  <label className="demoField demoSearch">
                    <span>Search</span>
                    <input value={searchRule} onChange={(e) => setSearchRule(e.target.value)} placeholder="Name, category…" />
                  </label>
                </div>
                <div className="demoActions">
                  <button
                    className="demoBtn"
                    onClick={() =>
                      setRules((prev) => [
                        {
                          id: nextId('r'),
                          name: 'New detection rule',
                          category: 'Custom',
                          severity: 'Medium',
                          enabled: true,
                          updatedAt: nowIso(),
                        },
                        ...prev,
                      ])
                    }
                  >
                    Add rule
                  </button>
                  <button className="demoBtn" onClick={() => setRules((p) => [...p])}>
                    Refresh
                  </button>
                </div>
              </div>
              <div className="demoTableWrap">
                <table className="demoTable">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Severity</th>
                      <th>Enabled</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRules.map((r) => (
                      <tr key={r.id}>
                        <td>{r.name}</td>
                        <td>{r.category}</td>
                        <td>
                          <span className={cx('badge', `badgeSeverity${r.severity}`)}>{r.severity}</span>
                        </td>
                        <td>{r.enabled ? 'Yes' : 'No'}</td>
                        <td>{r.updatedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="demoHint">In production: edit rule, enable/disable, duplicate, rule search.</div>
            </section>
          ) : null}

          {screen === 'exception-rules' ? (
            <section className="demoPanel">
              <div className="demoToolbar">
                <div className="demoActions">
                  <button
                    className="demoBtn"
                    onClick={() =>
                      setExceptionRules((prev) => [
                        {
                          id: nextId('ex'),
                          name: 'New exception rule',
                          condition: 'expression',
                          action: 'Skip / Lower severity',
                          active: true,
                        },
                        ...prev,
                      ])
                    }
                  >
                    Add exception rule
                  </button>
                </div>
              </div>
              <div className="demoTableWrap">
                <table className="demoTable">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Condition</th>
                      <th>Action</th>
                      <th>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exceptionRules.map((ex) => (
                      <tr key={ex.id}>
                        <td>{ex.name}</td>
                        <td><code style={{ fontSize: 11 }}>{ex.condition}</code></td>
                        <td>{ex.action}</td>
                        <td>{ex.active ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="demoHint">Exception rules skip or downgrade detection when condition matches.</div>
            </section>
          ) : null}

          {screen === 'exception-list' ? (
            <section className="demoPanel">
              <div className="demoToolbar">
                <div className="demoActions">
                  <button className="demoBtn" onClick={() => setExceptionList((p) => [...p])}>
                    Refresh
                  </button>
                  <button className="demoBtn demoBtnGhost">Export CSV</button>
                </div>
              </div>
              <div className="demoTableWrap">
                <table className="demoTable">
                  <thead>
                    <tr>
                      <th>Rule</th>
                      <th>Result</th>
                      <th>Occurred at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exceptionList.map((e) => (
                      <tr key={e.id}>
                        <td>{e.ruleName}</td>
                        <td>{e.result}</td>
                        <td>{e.occurredAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="demoHint">History of exceptions applied. Export CSV in production.</div>
            </section>
          ) : null}

          {screen === 'dashboard' ? (
            <section className="demoPanel">
              <div className="dashboardGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card">
                  <div className="cardPad">
                    <div className="miniLabel">Open tickets</div>
                    <div className="miniValue">{tickets.filter((t) => t.status !== 'Closed').length}</div>
                  </div>
                </div>
                <div className="card">
                  <div className="cardPad">
                    <div className="miniLabel">Closed (total)</div>
                    <div className="miniValue">{tickets.filter((t) => t.status === 'Closed').length}</div>
                  </div>
                </div>
                <div className="card">
                  <div className="cardPad">
                    <div className="miniLabel">Incidents (unassigned)</div>
                    <div className="miniValue">{incidents.length}</div>
                  </div>
                </div>
                <div className="card">
                  <div className="cardPad">
                    <div className="miniLabel">Active rules</div>
                    <div className="miniValue">{rules.filter((r) => r.enabled).length}</div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="cardPad">
                  <p className="metaTitle">Tickets by status</p>
                  <div className="bars" style={{ marginTop: 12 }}>
                    {(['Open', 'In Progress', 'Analysis', 'Response', 'Done', 'Closed'] as const).map((status) => {
                      const count = tickets.filter((t) => t.status === status).length
                      const pct = tickets.length ? (count / tickets.length) * 100 : 0
                      return (
                        <div key={status} className="barRow">
                          <span className="barLabel">{status}</span>
                          <div className="barTrack">
                            <div className="barFill" style={{ width: `${pct}%` }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 24 }}>{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="demoHint">In production: custom dashboards, time range, drill-down.</div>
            </section>
          ) : null}

          {screen === 'sop' ? (
            <section className="demoPanel">
              <div className="demoToolbar">
                <div className="demoFilters">
                  <label className="demoField">
                    <span>Event type</span>
                    <select value={filterEventType} onChange={(e) => setFilterEventType(e.target.value)}>
                      {eventTypes.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="demoField">
                    <span>Status</span>
                    <select value={filterSopStatus} onChange={(e) => setFilterSopStatus(e.target.value as SopStatus | 'All')}>
                      <option value="All">All</option>
                      <option value="Draft">Draft</option>
                      <option value="Active">Active</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  </label>
                  <label className="demoField demoSearch">
                    <span>Search</span>
                    <input value={searchSop} onChange={(e) => setSearchSop(e.target.value)} placeholder="Search SOP…" />
                  </label>
                </div>
                <div className="demoActions">
                  <button className="demoBtn" onClick={() => setSopForm({ mode: 'new' })} disabled={!canAdmin}>
                    New SOP
                  </button>
                  <button className="demoBtn" onClick={() => setSops((p) => [...p])}>
                    Refresh
                  </button>
                </div>
              </div>
              <div className="demoTableWrap">
                <table className="demoTable">
                  <thead>
                    <tr>
                      <th>SOP ID</th>
                      <th>Name</th>
                      <th>Trigger event</th>
                      <th>Steps</th>
                      <th>Created</th>
                      <th>Status</th>
                      <th>Last run</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSops.map((s) => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td>{s.name}</td>
                        <td>{s.triggerEvent}</td>
                        <td>{s.steps.length}</td>
                        <td>{s.createdAt}</td>
                        <td>
                          <span className={cx('badge', `badgeSop${s.status}`)}>{s.status}</span>
                        </td>
                        <td>
                          {s.lastRun ? (
                            <span className={cx('badge', `badgeRun${s.lastRun.status}`)}>{s.lastRun.status}</span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>
                          <div className="rowActions">
                            <button className="miniBtn" onClick={() => setSopForm({ mode: 'edit', sopId: s.id })} disabled={!canAdmin}>Edit</button>
                            <button className="miniBtn" onClick={() => duplicateSop(s.id)} disabled={!canAdmin}>Duplicate</button>
                            {s.status !== 'Active' ? (
                              <button className="miniBtn" onClick={() => activateSop(s.id)} disabled={!canAdmin}>Activate</button>
                            ) : (
                              <button className="miniBtn" onClick={() => disableSop(s.id)} disabled={!canAdmin}>Disable</button>
                            )}
                            <button className="miniBtn" onClick={() => deleteSop(s.id)} disabled={!canAdmin}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="demoHintRow">
                <div className="demoHint">SOP execution demo</div>
                <div className="demoActions">
                  <label className="demoField">
                    <span>Event type</span>
                    <select value={simulateEventType} onChange={(e) => setSimulateEventType(e.target.value)}>
                      {eventTypes.filter((t) => t !== 'All').map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <button className="demoBtn" onClick={simulateExecution}>Simulate event</button>
                </div>
              </div>
              <div className="logPanel">
                <div className="logTitle">Execution log</div>
                <ul className="logList">
                  {executionLog.length ? executionLog.map((l, i) => <li key={`${l}-${i}`}>{l}</li>) : <li className="muted">No events yet.</li>}
                </ul>
              </div>
              <div className="demoHint">Role: {role}. New/Edit/Activate requires Admin.</div>
            </section>
          ) : null}

          {screen === 'analytics' ? (
            <section className="demoPanel">
              <div className="demoToolbar">
                <div className="demoFilters">
                  <label className="demoField">
                    <span>Camera</span>
                    <select value={analyticsCamera} onChange={(e) => setAnalyticsCamera(e.target.value)}>
                      <option value="All">All</option>
                      <option value="CAM-01">CAM-01</option>
                      <option value="CAM-02">CAM-02</option>
                    </select>
                  </label>
                  <label className="demoField">
                    <span>Location</span>
                    <select value={analyticsLocation} onChange={(e) => setAnalyticsLocation(e.target.value)}>
                      <option value="All">All</option>
                      <option value="Warehouse A">Warehouse A</option>
                      <option value="HQ">HQ</option>
                    </select>
                  </label>
                  <label className="demoField">
                    <span>Date range</span>
                    <select value={analyticsRange} onChange={(e) => setAnalyticsRange(e.target.value as '7d' | '30d' | '90d')}>
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                    </select>
                  </label>
                </div>
                <div className="demoActions">
                  <button className="demoBtn" onClick={() => void 0}>Export report</button>
                  <button className="demoBtn" onClick={() => void 0}>Refresh</button>
                </div>
              </div>
              <div className="metricGrid">
                <AdsMetric label="Total cameras" value={totalCameras} status={criticalAlerts >= 4 ? 'Warning' : 'Normal'} />
                <AdsMetric label="Active streams" value={activeStreams} status={activeStreams < 14 ? 'Warning' : 'Normal'} />
                <AdsMetric label="Events today" value={eventsToday} status={eventsToday > 40 ? 'Warning' : 'Normal'} />
                <AdsMetric label="Critical alerts" value={criticalAlerts} status={criticalAlerts >= 4 ? 'Critical' : criticalAlerts >= 2 ? 'Warning' : 'Normal'} />
              </div>
              <div className="chartGrid">
                <div className="chartCard">
                  <div className="chartTitle">Event timeline</div>
                  <AdsTimelineChart values={timeline} />
                </div>
                <div className="chartCard">
                  <div className="chartTitle">Distribution by type</div>
                  <AdsBarChart items={distribution} />
                </div>
                <div className="chartCard chartCardWide">
                  <div className="chartTitle">Camera activity heatmap</div>
                  <AdsHeatmap values={heat} />
                </div>
              </div>
              <div className="demoHint">Filters update charts instantly (mock data).</div>
            </section>
          ) : null}
        </main>
      </div>

      {addProcessPanelOpen ? (
        <div className="dropdownBackdrop" onClick={() => setAddProcessPanelOpen(false)} aria-hidden="true" />
      ) : null}
      {addProcessPanelOpen ? (
        <div
          className="modalCard"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 'min(400px, 100%)',
            margin: 0,
            borderRadius: 0,
            zIndex: 50,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="modalHeader" style={{ flexShrink: 0 }}>
            <div className="modalTitle">Add New Process</div>
            <button type="button" className="demoBtn demoBtnGhost" onClick={() => setAddProcessPanelOpen(false)} aria-label="Close">
              ✕
            </button>
          </div>
          <div className="modalBody" style={{ flex: 1 }}>
            <p className="demoSubtitle" style={{ marginBottom: 12 }}>
              Process để xử lý 1 ticket. Process Category ADS/SOP; Step Structure phụ thuộc Number of Stage(s).
            </p>
            <div className="formGrid" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="demoField">
                <span>Process Name *</span>
                <input
                  value={newProcessName}
                  onChange={(e) => setNewProcessName(e.target.value)}
                  placeholder="e.g. Process 1"
                />
              </label>
              <label className="demoField">
                <span>Process Category *</span>
                <select
                  value={newProcessCategory}
                  onChange={(e) => setNewProcessCategory(e.target.value as ProcessCategory)}
                >
                  <option value="ADS">ADS</option>
                  <option value="SOP">SOP</option>
                </select>
              </label>
              <label className="demoField">
                <span>Rule Category</span>
                <select
                  value={newProcessRuleCategory}
                  onChange={(e) => setNewProcessRuleCategory(e.target.value)}
                >
                  <option value="">Select Rule Category</option>
                  <option value="threat">threat</option>
                  <option value="endpoint">endpoint</option>
                  <option value="identity">identity</option>
                  <option value="network">network</option>
                  <option value="Audit">Audit</option>
                </select>
              </label>
              <label className="demoField">
                <span>Number of Stage(s) *</span>
                <select
                  value={newProcessStages}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    setNewProcessStages(n)
                    if (n === 1) setNewProcessStepStructure('1')
                    else if (n === 2) setNewProcessStepStructure('11')
                    else setNewProcessStepStructure('111')
                  }}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </label>
              <label className="demoField">
                <span>Step Structure *</span>
                <select
                  value={newProcessStepStructure}
                  onChange={(e) => setNewProcessStepStructure(e.target.value)}
                >
                  {stepStructureOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
              <div className="demoHint" style={{ marginTop: 4 }}>
                Ví dụ: 222 = 3 stage, mỗi stage 2 step. Giá trị thay đổi theo Number of Stage(s).
              </div>
              <label className="demoField" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={newProcessEnabled}
                  onChange={(e) => setNewProcessEnabled(e.target.checked)}
                />
                <span>Enabled</span>
              </label>
              <label className="demoField" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={newProcessDefault}
                  onChange={(e) => setNewProcessDefault(e.target.checked)}
                />
                <span>Default</span>
              </label>
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
              <button type="button" className="demoBtn" onClick={createNewProcess}>
                Generate
              </button>
              <button type="button" className="demoBtn demoBtnGhost" onClick={() => setAddProcessPanelOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {assignModalTicketId ? (
        <div className="modalOverlay" role="dialog" aria-modal="true" onClick={() => setAssignModalTicketId(null)}>
          <div className="modalCard" style={{ maxWidth: 320 }} onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">Assign ticket</div>
              <button type="button" className="demoBtn demoBtnGhost" onClick={() => setAssignModalTicketId(null)}>Cancel</button>
            </div>
            <div className="modalBody">
              <p className="demoSubtitle" style={{ marginBottom: 12 }}>Choose assignee</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ASSIGNEES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className="demoBtn demoBtnGhost"
                    style={{ justifyContent: 'flex-start' }}
                    onClick={() => assignTicket(assignModalTicketId, a)}
                  >
                    {a === '—' ? 'Unassigned' : a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {addStepModal ? (
        <div className="modalOverlay" role="dialog" aria-modal="true" onClick={() => setAddStepModal(null)}>
          <div className="modalCard" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">{addStepModal.stepId ? 'Edit Step' : 'Add New Step'}</div>
              <button type="button" className="demoBtn demoBtnGhost" onClick={() => setAddStepModal(null)} aria-label="Close">×</button>
            </div>
            <div style={{ display: 'flex', gap: 0, padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
              <button
                type="button"
                className="demoBtn demoBtnGhost"
                style={{ borderRadius: 0, ...(addStepTab === 'general' ? { borderBottom: '2px solid var(--accent)', color: 'var(--accent)', marginBottom: -1 } : {}) }}
                onClick={() => setAddStepTab('general')}
              >
                General
              </button>
              <button
                type="button"
                className="demoBtn demoBtnGhost"
                style={{ borderRadius: 0, ...(addStepTab === 'display-items' ? { borderBottom: '2px solid var(--accent)', color: 'var(--accent)', marginBottom: -1 } : {}) }}
                onClick={() => setAddStepTab('display-items')}
              >
                Display Items
              </button>
              <button
                type="button"
                className="demoBtn demoBtnGhost"
                style={{ borderRadius: 0, ...(addStepTab === 'alarm-settings' ? { borderBottom: '2px solid var(--accent)', color: 'var(--accent)', marginBottom: -1 } : {}) }}
                onClick={() => setAddStepTab('alarm-settings')}
              >
                Alarm Settings
              </button>
            </div>
            <div className="modalBody">
              {addStepTab === 'general' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span className="demoField" style={{ margin: 0 }}>Explain Stage</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={addStepIsExplain}
                      onClick={() => setAddStepIsExplain((v) => !v)}
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        border: 'none',
                        background: addStepIsExplain ? 'var(--accent)' : 'var(--border)',
                        cursor: 'pointer',
                        position: 'relative',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: addStepIsExplain ? 22 : 2,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#fff',
                          transition: 'left 0.2s',
                        }}
                      />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label className="demoField">
                      <span>Stage *</span>
                      <select value={addStepStage} onChange={(e) => setAddStepStage(Number(e.target.value))}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                    <label className="demoField">
                      <span>Step *</span>
                      <select value={addStepStep} onChange={(e) => setAddStepStep(Number(e.target.value))}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="demoField">
                    <span>Step Name *</span>
                    <input value={addStepName} onChange={(e) => setAddStepName(e.target.value)} placeholder="e.g. Ready, Approval" />
                  </label>
                  <label className="demoField" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <span>Read/Comment Permission *</span>
                    <div className="multiSelectTags" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 36, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--panel)' }}>
                      {addStepReadPerm.map((p) => (
                        <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'var(--accent-soft)', borderRadius: 6, fontSize: 13 }}>
                          {p}
                          <button type="button" onClick={() => setAddStepReadPerm((arr) => arr.filter((x) => x !== p))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, opacity: 0.8 }} aria-label={`Remove ${p}`}>×</button>
                        </span>
                      ))}
                      <select
                        value=""
                        onChange={(e) => {
                          const v = e.target.value
                          if (v && !addStepReadPerm.includes(v)) setAddStepReadPerm((arr) => [...arr, v])
                          e.target.value = ''
                        }}
                        style={{ border: 'none', background: 'transparent', color: 'var(--text)', minWidth: 80, cursor: 'pointer' }}
                      >
                        <option value="">+ Add</option>
                        {PERM_OPTIONS.filter((o) => !addStepReadPerm.includes(o)).map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  </label>
                  <label className="demoField" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <span>Process Permission *</span>
                    <div className="multiSelectTags" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 36, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--panel)' }}>
                      {addStepProcessPerm.map((p) => (
                        <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'var(--accent-soft)', borderRadius: 6, fontSize: 13 }}>
                          {p}
                          <button type="button" onClick={() => setAddStepProcessPerm((arr) => arr.filter((x) => x !== p))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, opacity: 0.8 }} aria-label={`Remove ${p}`}>×</button>
                        </span>
                      ))}
                      <select
                        value=""
                        onChange={(e) => {
                          const v = e.target.value
                          if (v && !addStepProcessPerm.includes(v)) setAddStepProcessPerm((arr) => [...arr, v])
                          e.target.value = ''
                        }}
                        style={{ border: 'none', background: 'transparent', color: 'var(--text)', minWidth: 80, cursor: 'pointer' }}
                      >
                        <option value="">+ Add</option>
                        {PERM_OPTIONS.filter((o) => !addStepProcessPerm.includes(o)).map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  </label>
                </div>
              ) : addStepTab === 'display-items' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <div className="panelTitle" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      Function Actions
                      <span title="Select which actions to show in this step" style={{ opacity: 0.7, fontSize: 14 }}>ⓘ</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--muted)', fontWeight: 500, padding: '4px 8px', width: 40 }}>Show</th>
                          <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--muted)', fontWeight: 500, padding: '4px 8px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {FUNCTION_ACTIONS.map((action) => (
                          <tr key={action}>
                            <td style={{ padding: '6px 8px', verticalAlign: 'middle', width: 40 }}>
                              <label style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={addStepFunctionActions[action] ?? false}
                                  onChange={(e) => setAddStepFunctionActions((prev) => ({ ...prev, [action]: e.target.checked }))}
                                />
                              </label>
                            </td>
                            <td style={{ padding: '6px 8px', verticalAlign: 'middle' }}>{action}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <div className="panelTitle" style={{ marginBottom: 12 }}>Information Sections</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--muted)', fontWeight: 500, padding: '4px 8px', width: 40 }}>Show</th>
                          <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--muted)', fontWeight: 500, padding: '4px 8px' }}>Section</th>
                        </tr>
                      </thead>
                      <tbody>
                        {INFO_SECTIONS.map((section) => (
                          <tr key={section}>
                            <td style={{ padding: '6px 8px', verticalAlign: 'middle', width: 40 }}>
                              <label style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={addStepInfoSections[section] ?? false}
                                  onChange={(e) => setAddStepInfoSections((prev) => ({ ...prev, [section]: e.target.checked }))}
                                />
                              </label>
                            </td>
                            <td style={{ padding: '6px 8px', verticalAlign: 'middle' }}>{section}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label className="demoField">
                    <span>Notify when begin step</span>
                    <select value={addStepAlarmBegin} onChange={(e) => setAddStepAlarmBegin(e.target.value)}>
                      <option value="None">None</option>
                      <option value="Mail (self, poweruser)">Mail (self, poweruser)</option>
                      <option value="Mail (all)">Mail (all)</option>
                      <option value="Slack">Slack</option>
                    </select>
                  </label>
                  <label className="demoField">
                    <span>Notify when end step</span>
                    <select value={addStepAlarmEnd} onChange={(e) => setAddStepAlarmEnd(e.target.value)}>
                      <option value="None">None</option>
                      <option value="Mail (self, poweruser)">Mail (self, poweruser)</option>
                      <option value="Mail (all)">Mail (all)</option>
                      <option value="Slack">Slack</option>
                    </select>
                  </label>
                </div>
              )}
            </div>
            <div className="modalFooter" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 16, borderTop: '1px solid var(--border)' }}>
              <button type="button" className="demoBtn demoBtnGhost" onClick={() => setAddStepModal(null)}>Cancel</button>
              <button type="button" className="demoBtn" onClick={saveAddStepModal}>{addStepModal.stepId ? 'Save' : 'Add'}</button>
            </div>
          </div>
        </div>
      ) : null}

      {sopForm ? (
        <SopModal
          mode={sopForm.mode}
          role={role}
          sops={sops}
          sopId={sopForm.sopId}
          onClose={() => setSopForm(null)}
          onSave={(row) => {
            if (!canAdmin) return
            if (sopForm.mode === 'new') {
              setSops((prev) => [row, ...prev])
              addLog(`Created ${row.id}`)
            } else {
              setSops((prev) => prev.map((s) => (s.id === row.id ? row : s)))
              addLog(`Updated ${row.id}`)
            }
            setSopForm(null)
          }}
        />
      ) : null}

      {toast ? (
        <div style={{ position: 'fixed', bottom: 18, left: 18, zIndex: 70 }}>
          <div className="panel" style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(15,23,42,0.92)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13 }}>
            {toast.text}
          </div>
        </div>
      ) : null}

      {mailPreview ? (
        <div className="modalBackdrop" onClick={() => setMailPreview(null)} role="presentation">
          <div className="modalCard" style={{ maxWidth: 720, width: 'min(720px, calc(100vw - 24px))' }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modalHeader" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div className="panelTitle" style={{ margin: 0 }}>Preview Mail</div>
                <div className="demoSubtitle" style={{ marginTop: 2 }}>{mailPreview.kind} · {tickets.find((t) => t.id === mailPreview.ticketId)?.serialNo ?? mailPreview.ticketId}</div>
              </div>
              <button type="button" className="miniBtn" onClick={() => setMailPreview(null)}>✕</button>
            </div>
            <div className="modalBody" style={{ padding: 16 }}>
              <div className="panel" style={{ padding: 14, background: 'var(--panel-2)' }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Analysis</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                  Subject: [{mailPreview.kind}] Ticket update – {tickets.find((t) => t.id === mailPreview.ticketId)?.ruleCode ?? '—'}<br />
                  Ticket ID: {tickets.find((t) => t.id === mailPreview.ticketId)?.serialNo ?? '—'}<br />
                  Ticket Stage: {tickets.find((t) => t.id === mailPreview.ticketId)?.status ?? '—'}<br />
                  Detect Time: {tickets.find((t) => t.id === mailPreview.ticketId)?.issueDate ?? '—'}<br />
                  Contents: We have received the analysis. Please review and proceed.
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="demoBtn demoBtnGhost" onClick={() => { showToast('Opened SOP connect'); setMailPreview(null) }}>
                  SentriX SOP connect
                </button>
                <button type="button" className="demoBtn" onClick={() => { showToast('Sent'); setMailPreview(null) }}>
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function AdsMetric(props: { label: string; value: number; status: 'Normal' | 'Warning' | 'Critical' }): ReactNode {
  const { label, value, status } = props
  return (
    <div className="metricCard">
      <div className="metricLabel">{label}</div>
      <div className="metricValue">{value}</div>
      <div className={cx('metricStatus', status === 'Critical' && 'metricCritical', status === 'Warning' && 'metricWarning')}>{status}</div>
    </div>
  )
}

function AdsTimelineChart(props: { values: number[] }): ReactNode {
  const { values } = props
  const w = 420
  const h = 120
  const max = Math.max(...values, 1)
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * (w - 20) + 10
      const y = h - (v / max) * (h - 20) - 10
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chartSvg" aria-label="Timeline chart">
      <polyline points={pts} fill="none" stroke="rgba(96,165,250,0.9)" strokeWidth="2" />
      {values.map((v, i) => {
        const x = (i / Math.max(values.length - 1, 1)) * (w - 20) + 10
        const y = h - (v / max) * (h - 20) - 10
        return <circle key={i} cx={x} cy={y} r="2.4" fill="rgba(96,165,250,0.95)" />
      })}
    </svg>
  )
}

function AdsBarChart(props: { items: Array<{ name: string; value: number }> }): ReactNode {
  const { items } = props
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="barList" aria-label="Distribution chart">
      {items.map((it) => (
        <div key={it.name} className="barRow2">
          <div className="barName">{it.name}</div>
          <div className="barTrack2">
            <div className="barFill2" style={{ width: `${(it.value / max) * 100}%` }} />
          </div>
          <div className="barVal">{it.value}</div>
        </div>
      ))}
    </div>
  )
}

function AdsHeatmap(props: { values: number[] }): ReactNode {
  return (
    <div className="heatGrid" aria-label="Heatmap">
      {props.values.map((v, i) => (
        <div key={i} className="heatCell" style={{ opacity: 0.25 + v * 0.75 }} title={`Activity ${(v * 100).toFixed(0)}%`} />
      ))}
    </div>
  )
}

function SopModal(props: {
  mode: 'new' | 'edit'
  role: Role
  sops: SopRow[]
  sopId?: string
  onClose: () => void
  onSave: (row: SopRow) => void
}): ReactNode {
  const { mode, role, sops, sopId, onClose, onSave } = props
  const canAdmin = role === 'Admin'
  const editing = mode === 'edit' ? sops.find((s) => s.id === sopId) ?? null : null

  const [name, setName] = useState(editing?.name ?? '')
  const [triggerEvent, setTriggerEvent] = useState(editing?.triggerEvent ?? 'Loitering')
  const [steps, setSteps] = useState((editing?.steps ?? ['Validate', 'Notify operator']).join('\n'))
  const [status, setStatus] = useState<SopStatus>(editing?.status ?? 'Draft')

  const submit = () => {
    if (!canAdmin) return
    const parsed = steps
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const id = mode === 'new' ? nextId('SOP') : editing?.id ?? nextId('SOP')
    onSave({
      id,
      name: name.trim() || 'Untitled SOP',
      triggerEvent,
      steps: parsed.length ? parsed : ['Step 1'],
      createdAt: editing?.createdAt ?? nowIso(),
      createdBy: editing?.createdBy ?? role,
      status,
      lastRun: editing?.lastRun,
    })
  }

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalCard">
        <div className="modalHeader">
          <div>
            <div className="modalTitle">{mode === 'new' ? 'New SOP' : 'Edit SOP'}</div>
            <div className="modalMeta">Role: {role}</div>
          </div>
          <div className="modalActions">
            <button className="demoBtn" onClick={submit} disabled={!canAdmin}>Save</button>
            <button className="demoBtn demoBtnGhost" onClick={onClose}>Cancel</button>
          </div>
        </div>
        <div className="modalBody">
          <div className="formGrid">
            <label className="demoField">
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="SOP name…" />
            </label>
            <label className="demoField">
              <span>Trigger event</span>
              <input value={triggerEvent} onChange={(e) => setTriggerEvent(e.target.value)} />
            </label>
            <label className="demoField">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as SopStatus)}>
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
              </select>
            </label>
            <label className="demoField" style={{ gridColumn: '1 / -1' }}>
              <span>Steps (one per line)</span>
              <textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={6} />
            </label>
          </div>
          {!canAdmin ? <div className="demoHint">Switch role to Admin to edit SOPs.</div> : null}
        </div>
      </div>
    </div>
  )
}
