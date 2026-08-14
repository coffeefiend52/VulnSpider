// AUTO-GENERATED — do not edit by hand.
// Run `npm run gen:types` (after `make schema` in server/) to regenerate.

export interface SsePageEvent {
  page: Site;
  type: 'page';
}
export interface Site {
  code_analysis: CodeFinding[];
  code_analysis_errors: CodeAnalysisError[];
  cookie_analysis: CookieFinding[];
  header_analysis: HeaderFinding[];
  html_content: string;
  links: Link[];
  path: string;
  response_headers: string[];
}
export interface CodeFinding {
  content: string;
  lines: number | number[];
  type:
    | 'comment'
    | 'form'
    | 'link'
    | 'package'
    | 'secret'
    | 'script:external'
    | 'script:internal'
    | 'script:in-element';
  vulnerabilities: Vulnerability[];
}
export interface Vulnerability {
  description: string;
  recommendation: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}
export interface CodeAnalysisError {
  message: string;
  source: string;
}
export interface CookieFinding {
  issues: CookieIssue[];
  name: string;
  raw: string;
}
export interface CookieIssue {
  attribute: string;
  description: string;
  recommendation: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}
export interface HeaderFinding {
  description: string;
  header: string;
  present: boolean;
  recommendation: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  value: string | null;
}
export interface Link {
  link: string;
  type: 'absolute' | 'relative';
}
export interface SseDoneEvent {
  certificate: {
    [k: string]: unknown;
  } | null;
  robots_txt: RobotsTxtResult | null;
  type: 'done';
}
export interface RobotsTxtResult {
  crawl_delay: number | null;
  found: boolean;
  raw: string | null;
  rules: RobotsTxtRule[];
  sitemaps: string[];
}
export interface RobotsTxtRule {
  allowed: string[];
  disallowed: string[];
  user_agent: string;
}
export interface SseErrorEvent {
  message: string;
  type: 'error';
}
export interface ModelsResponse {
  default: string;
  models: string[];
}
