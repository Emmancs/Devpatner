// Shared types and interfaces for DevPilot AI

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum JobStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum FindingSeverity {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO',
}

export enum FindingCategory {
  LOGIC = 'LOGIC',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  ERROR_HANDLING = 'ERROR_HANDLING',
  CODE_STYLE = 'CODE_STYLE',
  MAINTAINABILITY = 'MAINTAINABILITY',
  RESOURCE_MANAGEMENT = 'RESOURCE_MANAGEMENT',
  ASYNC = 'ASYNC',
}

export enum FindingStatus {
  OPEN = 'OPEN',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum AnalysisSource {
  STATIC_ESLINT = 'STATIC_ESLINT',
  STATIC_ANALYZER = 'STATIC_ANALYZER',
  AI_GEMINI = 'AI_GEMINI',
  AI_REVIEW = 'AI_REVIEW',
}

export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

// Standard API response envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  correlationId?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  correlationId?: string;
  timestamp: string;
}

// User Profile
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: UserRole;
  createdAt: string;
}

// Auth Requests & Responses
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponseData {
  user: UserProfile;
  accessToken: string;
  expiresAt: string;
}

// Project summaries and details
export interface FindingsCountSummary {
  high: number;
  medium: number;
  low: number;
  info: number;
  total: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  defaultBranch: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  repositoriesCount: number;
  findingsCount: FindingsCountSummary;
  lastAnalysisStatus?: JobStatus | null;
  lastAnalysisAt?: string | null;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  defaultBranch?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  defaultBranch?: string;
  isArchived?: boolean;
}

// Repository details
export interface RepositorySummary {
  id: string;
  projectId: string;
  name: string;
  fullName: string;
  owner: string;
  defaultBranch: string;
  htmlUrl: string;
  cloneUrl?: string | null;
  isPrivate: boolean;
  sizeKb: number;
  primaryLanguage?: string | null;
  languages?: Record<string, number>;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubConnectionStatus {
  connected: boolean;
  username?: string;
  avatarUrl?: string | null;
  scopes?: string | null;
}

export interface GitHubRepositoryOption {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  defaultBranch: string;
  htmlUrl: string;
  cloneUrl?: string | null;
  isPrivate: boolean;
  sizeKb: number;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  primaryLanguage?: string | null;
}

export interface RepositoryFileEntry {
  path: string;
  filename: string;
  extension?: string | null;
  language?: string | null;
  sizeBytes: number;
  lineCount: number;
  isEligible: boolean;
}

export interface RepositoryFileContent {
  path: string;
  content: string;
  language?: string | null;
  sizeBytes: number;
  lineCount: number;
  truncated: boolean;
}

// Analysis Job Summary
export interface AnalysisJobSummary {
  id: string;
  projectId: string;
  repositoryId: string;
  commitSha: string;
  branch: string;
  status: JobStatus;
  progressPercent: number;
  currentStage?: string | null;
  queuedAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  errorReason?: string | null;
  totalFindings?: number;
  highSeverity?: number;
  durationMs?: number;
}

export interface ProjectDetail extends ProjectSummary {
  repositories: RepositorySummary[];
  recentAnalyses: AnalysisJobSummary[];
}

// Dashboard overall metrics
export interface DashboardMetrics {
  totalRepositories: number;
  totalAnalyses: number;
  findingsBySeverity: FindingsCountSummary;
  recentProjects: ProjectSummary[];
  recentAnalyses: AnalysisJobSummary[];
}

// Finding detail
export interface FindingItem {
  id: string;
  jobId: string;
  projectId: string;
  repositoryId: string;
  filePath: string;
  startLine: number;
  endLine: number;
  startColumn?: number | null;
  endColumn?: number | null;
  title: string;
  description: string;
  category: FindingCategory;
  severity: FindingSeverity;
  confidence: string;
  status: FindingStatus;
  source: AnalysisSource;
  evidence?: string | null;
  explanation?: string | null;
  recommendedFix?: string | null;
  proposedPatch?: string | null;
  fingerprint: string;
  createdAt: string;
}

// Health status response
export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  version: string;
  services: {
    database: {
      status: 'connected' | 'disconnected';
      latencyMs?: number;
    };
    aiProvider: {
      provider: string;
      status: 'configured' | 'unconfigured';
    };
    githubIntegration: {
      status: 'configured' | 'unconfigured';
    };
  };
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
}
