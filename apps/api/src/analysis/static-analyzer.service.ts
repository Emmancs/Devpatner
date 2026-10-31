import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  FindingCategory,
  FindingSeverity,
  AnalysisSource,
} from '@devpilot/shared';

export interface StaticFinding {
  filePath: string;
  startLine: number;
  endLine: number;
  title: string;
  description: string;
  category: FindingCategory;
  severity: FindingSeverity;
  confidence: string;
  source: AnalysisSource;
  evidence: string;
  recommendedFix: string;
  fingerprint: string;
}

interface Rule {
  pattern: RegExp;
  title: string;
  description: string;
  category: FindingCategory;
  severity: FindingSeverity;
  confidence: string;
  recommendedFix: string;
}

const RULES: Rule[] = [
  {
    pattern: /\beval\s*\(|\bnew\s+Function\s*\(/,
    title: 'Dynamic code execution',
    description: 'Dynamic code execution can execute untrusted input and bypass normal code review and security controls.',
    category: FindingCategory.SECURITY,
    severity: FindingSeverity.HIGH,
    confidence: 'HIGH',
    recommendedFix: 'Replace dynamic execution with explicit parsing and a safe, allow-listed operation.',
  },
  {
    pattern: /\bconsole\.log\s*\(/,
    title: 'Console logging in application code',
    description: 'Unstructured console logging can expose sensitive values and makes production diagnostics difficult to control.',
    category: FindingCategory.CODE_STYLE,
    severity: FindingSeverity.LOW,
    confidence: 'MEDIUM',
    recommendedFix: 'Use the application logging abstraction and redact sensitive fields.',
  },
  {
    pattern: /\b(TODO|FIXME)\b/,
    title: 'Unresolved implementation marker',
    description: 'This source line contains an unresolved implementation marker that may represent incomplete behavior.',
    category: FindingCategory.MAINTAINABILITY,
    severity: FindingSeverity.LOW,
    confidence: 'MEDIUM',
    recommendedFix: 'Resolve the marker or convert it into a tracked issue with acceptance criteria.',
  },
];

@Injectable()
export class StaticAnalyzerService {
  analyze(filePath: string, content: string): StaticFinding[] {
    const findings: StaticFinding[] = [];
    const lines = content.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      for (const rule of RULES) {
        if (!rule.pattern.test(line)) {
          continue;
        }
        const lineNumber = index + 1;
        findings.push({
          filePath,
          startLine: lineNumber,
          endLine: lineNumber,
          title: rule.title,
          description: rule.description,
          category: rule.category,
          severity: rule.severity,
          confidence: rule.confidence,
          source: AnalysisSource.STATIC_ANALYZER,
          evidence: line.trim().slice(0, 1000),
          recommendedFix: rule.recommendedFix,
          fingerprint: createHash('sha256')
            .update(`${filePath}:${lineNumber}:${rule.title}:${line.trim()}`)
            .digest('hex'),
        });
      }
    }

    return findings;
  }
}
