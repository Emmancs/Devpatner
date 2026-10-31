'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { RepositoryFileContent, RepositoryFileEntry, RepositorySummary } from '@devpilot/shared';
import { editorLanguage, filterFiles } from '@/lib/file-explorer';
import { ArrowLeft, ChevronRight, FileCode2, Folder, Loader2, RefreshCw, Search } from 'lucide-react';

export default function FilesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [repositories, setRepositories] = useState<RepositorySummary[]>([]);
  const [repositoryId, setRepositoryId] = useState('');
  const [files, setFiles] = useState<RepositoryFileEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState('');
  const [content, setContent] = useState<RepositoryFileContent | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingFile, setLoadingFile] = useState(false);

  const loadRepositories = async () => {
    try {
      const project = await apiFetch<{ repositories: RepositorySummary[] }>(`/projects/${projectId}`);
      setRepositories(project.repositories);
      if (project.repositories[0]) setRepositoryId(project.repositories[0].id);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load repositories.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadRepositories(); }, [projectId]);
  useEffect(() => {
    if (!repositoryId) return;
    setLoading(true);
    apiFetch<RepositoryFileEntry[]>(`/projects/${projectId}/repositories/${repositoryId}/files`)
      .then(setFiles)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Unable to load files.'))
      .finally(() => setLoading(false));
  }, [projectId, repositoryId]);

  const filteredFiles = useMemo(() => filterFiles(files, search), [files, search]);
  const selectFile = async (file: RepositoryFileEntry) => {
    setSelectedPath(file.path);
    setLoadingFile(true);
    setError(null);
    try {
      setContent(await apiFetch<RepositoryFileContent>(`/projects/${projectId}/repositories/${repositoryId}/file?path=${encodeURIComponent(file.path)}`));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load file content.');
    } finally {
      setLoadingFile(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-gray-100">
        <header className="border-b border-surface-border bg-surface-200/60">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
            <Link href={`/projects/${projectId}`} className="text-xs text-gray-400 hover:text-white flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Project</Link>
            <span className="text-gray-600">/</span><span className="font-semibold text-white text-sm">Files</span>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div><h1 className="text-2xl font-bold text-white">Repository File Explorer</h1><p className="text-sm text-gray-400 mt-1">Browse synchronized source files without executing repository code.</p></div>
            <div className="flex items-center gap-2">
              <select value={repositoryId} onChange={(event) => setRepositoryId(event.target.value)} className="bg-surface-100 border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-200">
                {repositories.map((repo) => <option key={repo.id} value={repo.id}>{repo.fullName}</option>)}
              </select>
              <button onClick={() => repositoryId && apiFetch(`/projects/${projectId}/repositories/${repositoryId}/sync`, { method: 'POST' }).then(() => apiFetch<RepositoryFileEntry[]>(`/projects/${projectId}/repositories/${repositoryId}/files`).then(setFiles))} className="p-2 rounded-lg border border-surface-border hover:bg-surface-50" title="Synchronize files"><RefreshCw className="w-4 h-4" /></button>
            </div>
          </div>
          {error && <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>}
          {loading && !files.length ? <div className="p-12 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading files...</div> : (
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] border border-surface-border rounded-xl overflow-hidden min-h-[620px]">
              <aside className="bg-surface-100 border-r border-surface-border">
                <div className="p-3 border-b border-surface-border relative"><Search className="w-4 h-4 absolute left-6 top-3.5 text-gray-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search files..." className="w-full pl-9 pr-3 py-2 bg-surface-200 border border-surface-border rounded-lg text-sm outline-none focus:border-brand-blue" /></div>
                <div className="p-2 max-h-[560px] overflow-auto">{filteredFiles.map((file) => <button key={file.path} onClick={() => selectFile(file)} className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2 ${selectedPath === file.path ? 'bg-brand-blue/20 text-white' : 'text-gray-400 hover:bg-surface-50 hover:text-white'}`}><FileCode2 className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{file.path}</span></button>)}</div>
              </aside>
              <section className="bg-[#1e1e1e]">
                <div className="h-10 px-4 border-b border-[#333] flex items-center text-xs text-gray-400">{selectedPath ? <><ChevronRight className="w-3 h-3" />{selectedPath}</> : <><Folder className="w-3.5 h-3.5 mr-2" />Select a file</>}</div>
                {loadingFile ? <div className="p-12 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div> : <Editor height="570px" theme="vs-dark" language={editorLanguage(files.find((file) => file.path === selectedPath) || null)} value={content?.content || ''} options={{ readOnly: true, minimap: { enabled: false }, lineNumbers: 'on', wordWrap: 'on', padding: { top: 12 } }} />}
              </section>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
