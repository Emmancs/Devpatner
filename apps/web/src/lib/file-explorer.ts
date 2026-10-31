import { RepositoryFileEntry } from '@devpilot/shared';

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  json: 'json', md: 'markdown', py: 'python', java: 'java', go: 'go',
  rs: 'rust', css: 'css', html: 'html', sql: 'sql', yaml: 'yaml', yml: 'yaml',
};

export function editorLanguage(file: RepositoryFileEntry | null): string {
  return file?.extension ? LANGUAGE_BY_EXTENSION[file.extension] || 'plaintext' : 'plaintext';
}

export function filterFiles(files: RepositoryFileEntry[], search: string): RepositoryFileEntry[] {
  const query = search.trim().toLowerCase();
  return query ? files.filter((file) => file.path.toLowerCase().includes(query)) : files;
}
