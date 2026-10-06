export interface Vulnerability {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: 'Known' | 'Unknown' | 'Under Review';
  notes: string;
  cvssScore: number;
  cwe: string;
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  eventType: string;
  sourceIp: string;
  destIp: string;
  destPort: number;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'HTTPS' | 'SSH';
  host: string;
  user?: string;
  mitreTactic: string;
  mitreTechnique: string;
  summary: string;
  rawPayload: Record<string, any>;
  alertTriggered: boolean;
}

export type TimelineStage = 'DETECTION' | 'CORRELATION' | 'CONTAINMENT' | 'FORENSICS' | 'ERADICATION';

export interface TimelineEvent {
  id: string;
  alertId: string;
  timestamp: string;
  stage: TimelineStage;
  title: string;
  description: string;
  originator: string;
  technicalDetail?: string;
}

export interface SecurityAlert {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  mitreTactic: string;
  mitreTechnique: string;
  targetHost: string;
  sourceIp: string;
  status: 'NEW' | 'INVESTIGATING' | 'CONTAINED' | 'FALSE_POSITIVE' | 'RESOLVED';
  assignee: string;
  createdAt: string;
  updatedAt: string;
  evidence: string[];
  remediationPlan: string;
}

export interface HeaderCheck {
  header: string;
  name: string;
  present: boolean;
  value: string | null;
  impact: string;
  points: number;
}

export interface UrlScanResult {
  target: string;
  hostname: string;
  statusCode: number;
  sslValid: boolean;
  latencyMs: number;
  ipAddresses: string[];
  overallScore: number;
  grade: string;
  checks: HeaderCheck[];
  rawHeaders: Record<string, string>;
  error?: string;
}

export interface IocScanResult {
  indicator: string;
  type: string;
  threatScore: number;
  classification: string;
  isPrivateIp: boolean;
  analyzedAt: string;
  details: Record<string, any>;
}

export interface MitreTechnique {
  id: string;
  name: string;
  risk: string;
  coverage: string;
}

export interface MitreTactic {
  id: string;
  name: string;
  description: string;
  activeDetections: number;
  techniques: MitreTechnique[];
}
