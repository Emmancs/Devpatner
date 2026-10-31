import { Test } from '@nestjs/testing';
import { FindingCategory, FindingSeverity } from '@devpilot/shared';
import { StaticAnalyzerService } from './static-analyzer.service';

describe('StaticAnalyzerService', () => {
  let analyzer: StaticAnalyzerService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [StaticAnalyzerService],
    }).compile();
    analyzer = module.get(StaticAnalyzerService);
  });

  it('reports security and maintainability rules with source locations', () => {
    const findings = analyzer.analyze('src/example.ts', `const value = eval(input);
// TODO: replace this`);
    expect(findings).toHaveLength(2);
    expect(findings[0].severity).toBe(FindingSeverity.HIGH);
    expect(findings[0].category).toBe(FindingCategory.SECURITY);
    expect(findings[0].startLine).toBe(1);
    expect(findings[1].startLine).toBe(2);
    expect(findings[0].fingerprint).not.toBe(findings[1].fingerprint);
  });

  it('returns no findings for clean source', () => {
    expect(analyzer.analyze('src/clean.ts', 'export const value = 1;')).toEqual([]);
  });
});
