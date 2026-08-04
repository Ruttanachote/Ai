import type {
  EditOperation,
  EditProposal,
  Health,
  Project,
  ProjectSummary,
  Transcript,
} from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(path, {
    headers: { 'content-type': 'application/json' },
    ...init,
  })
  if (!resp.ok) {
    let message = `${resp.status} ${resp.statusText}`
    try {
      const body = await resp.json()
      if (body?.error) message = body.error
    } catch {
      // non-JSON error body — keep the status line
    }
    throw new Error(message)
  }
  return resp.json() as Promise<T>
}

export const api = {
  health: () => request<Health>('/api/health'),

  listProjects: () => request<ProjectSummary[]>('/api/projects'),

  createProject: (name: string) =>
    request<ProjectSummary>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  getProject: (id: string) => request<Project>(`/api/projects/${id}`),

  addAsset: (id: string, filename: string, duration_ms: number, transcript?: Transcript) =>
    request<ProjectSummary>(`/api/projects/${id}/assets`, {
      method: 'POST',
      body: JSON.stringify({ filename, duration_ms, transcript }),
    }),

  chat: (id: string, message: string) =>
    request<EditProposal>(`/api/projects/${id}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  applyEdits: (id: string, description: string, operations: EditOperation[]) =>
    request<ProjectSummary>(`/api/projects/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify({ description, operations }),
    }),

  undo: (id: string) =>
    request<ProjectSummary>(`/api/projects/${id}/undo`, { method: 'POST' }),
}

export function fmtMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
