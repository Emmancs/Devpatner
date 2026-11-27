import {
  CodeExplanationRequest,
  CodeExplanationResponse,
  CodeReference,
  FindingCategory,
  FindingSeverity,
} from '@devpilot/shared';

export interface RawAiFinding {
  title: string;
  description: string;
  category: FindingCategory;
  severity: FindingSeverity;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  filePath: string;
  startLine: number;
  endLine: number;
  evidence: string;
  explanation: string;
  recommendedFix: string;
  proposedPatch?: string;
}

export interface AiFixResult {
  proposedPatch: string;
  explanation: string;
  originalCodeSnippet: string;
  fixedCodeSnippet: string;
  isValidPatch: boolean;
}

export interface AiChatResult {
  answer: string;
  references: CodeReference[];
  tokensUsed: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface IAiProvider {
  isConfigured(): boolean;
  generateStructuredFindings(
    files: { path: string; content: string }[],
    options?: { timeoutMs?: number }
  ): Promise<{ findings: RawAiFinding[]; usage: TokenUsage }>;
  explainCode(
    request: CodeExplanationRequest,
    options?: { timeoutMs?: number }
  ): Promise<{ explanation: CodeExplanationResponse; usage: TokenUsage }>;
  suggestFix(
    finding: {
      title: string;
      description: string;
      filePath: string;
      startLine: number;
      endLine: number;
      evidence?: string | null;
    },
    surroundingCode: string,
    options?: { timeoutMs?: number }
  ): Promise<{ fix: AiFixResult; usage: TokenUsage }>;
  chatWithCodebase(
    question: string,
    retrievedSnippets: { filePath: string; snippet: string; lineRange?: string }[],
    history: { role: 'user' | 'model'; content: string }[],
    options?: { timeoutMs?: number }
  ): Promise<{ answer: string; references: CodeReference[]; usage: TokenUsage }>;
}
