import { describe, expect, it } from 'vitest';
import { editorLanguage, filterFiles } from './file-explorer';
import { RepositoryFileEntry } from '@devpilot/shared';

const files: RepositoryFileEntry[] = [
  { path: 'src/App.tsx', filename: 'App.tsx', extension: 'tsx', language: 'TypeScript React', sizeBytes: 10, lineCount: 1, isEligible: true },
  { path: 'README.md', filename: 'README.md', extension: 'md', language: 'Markdown', sizeBytes: 10, lineCount: 1, isEligible: true },
];

describe('file explorer helpers', () => {
  it('maps supported extensions to Monaco languages', () => {
    expect(editorLanguage(files[0])).toBe('typescript');
    expect(editorLanguage(files[1])).toBe('markdown');
    expect(editorLanguage(null)).toBe('plaintext');
  });

  it('filters paths case-insensitively and preserves the source order', () => {
    expect(filterFiles(files, 'app')).toEqual([files[0]]);
    expect(filterFiles(files, '')).toEqual(files);
  });
});
