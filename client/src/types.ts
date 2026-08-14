export type {
  CodeAnalysisError,
  CodeFinding,
  CookieFinding,
  CookieIssue,
  HeaderFinding,
  Link,
  ModelsResponse,
  RobotsTxtResult,
  RobotsTxtRule,
  Site,
  SseDoneEvent,
  SseErrorEvent,
  SsePageEvent,
  Vulnerability,
} from './types.generated';

import type { CodeFinding, RobotsTxtResult, SseDoneEvent, Site, Vulnerability } from './types.generated';

export type SeverityLevel = Vulnerability['severity'];
export type FindingType = CodeFinding['type'];

export interface ScanData {
  certificate: SseDoneEvent['certificate'];
  sites: Site[];
  robots_txt: RobotsTxtResult | null;
}

export interface PathCardStats {
  total: number;
  vulnerabilities: number;
  critical: number;
  high: number;
  medium: number;
}

export interface OverallStatsData {
  totalPages: number;
  totalFindings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export type ViewMode = 'findings' | 'code';

export type FindingTabKey =
  | 'all'
  | 'vulnerabilities'
  | 'scripts'
  | 'forms'
  | 'secrets'
  | 'comments';
