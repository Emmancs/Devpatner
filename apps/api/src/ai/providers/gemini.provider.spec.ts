import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { GeminiProvider } from './gemini.provider';

describe('GeminiProvider', () => {
  const config = {
    get: (key: string) => {
      if (key === 'GEMINI_API_KEY') return 'unit-test-key';
      if (key === 'GEMINI_MODEL') return 'test-model';
      return undefined;
    },
  } as ConfigService;
  let provider: GeminiProvider;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    provider = new GeminiProvider(config);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('only accepts findings for supplied files and valid line ranges', async () => {
    const findings = [
      {
        title: 'Valid finding',
        description: 'A concrete issue',
        category: 'LOGIC',
        severity: 'MEDIUM',
        confidence: 'HIGH',
        filePath: 'src/example.ts',
        startLine: 1,
        endLine: 1,
        evidence: 'const x = 1;',
        explanation: 'Reasoning',
        recommendedFix: 'Validate the value.',
      },
      {
        title: 'Hallucinated path',
        description: 'Must not be persisted',
        category: 'LOGIC',
        severity: 'MEDIUM',
        confidence: 'HIGH',
        filePath: '../outside.ts',
        startLine: 1,
        endLine: 1,
        evidence: 'bad',
        explanation: 'Reasoning',
        recommendedFix: 'Fix it.',
      },
    ];
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ findings }) }] } }],
        usageMetadata: {},
      }),
    } as Response);

    const result = await provider.generateStructuredFindings([
      { path: 'src/example.ts', content: 'const x = 1;' },
    ]);

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].filePath).toBe('src/example.ts');
    expect(fetchSpy.mock.calls[0][0]).not.toContain('unit-test-key');
    expect(fetchSpy.mock.calls[0][1].headers['x-goog-api-key']).toBe('unit-test-key');
  });

  it('rejects malformed structured responses instead of returning empty results', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'not json' }] } }],
        usageMetadata: {},
      }),
    } as Response);

    await expect(
      provider.generateStructuredFindings([{ path: 'src/example.ts', content: 'const x = 1;' }])
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('sends prior conversation turns as Gemini history', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Grounded answer' }] } }],
        usageMetadata: {},
      }),
    } as Response);

    await provider.chatWithCodebase(
      'Where is this called?',
      [],
      [{ role: 'user', content: 'What does this file do?' }]
    );

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string);
    expect(body.contents[0]).toEqual({
      role: 'user',
      parts: [{ text: 'What does this file do?' }],
    });
    expect(body.contents[1].parts[0].text).toContain('Where is this called?');
  });
});
