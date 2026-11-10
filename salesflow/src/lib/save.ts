// Hand a generated file to the viewer. Inside claude.ai the page has no download permission,
// so it goes through the `downloads` capability (the viewer confirms); elsewhere a plain link.
type Downloads = { save(r: { filename: string; data: Blob | string }): Promise<unknown> }
type ClaudeRuntime = { use(name: string): Promise<unknown> }
let dl: Promise<Downloads | null> | undefined
function runtime(): Promise<Downloads | null> {
  const c = (window as unknown as { claude?: ClaudeRuntime }).claude
  if (!c?.use) return Promise.resolve(null)
  return (dl ??= c.use('downloads').then((d) => (d as Downloads) ?? null).catch(() => null))
}
export type SaveOutcome = 'saved' | 'declined' | 'failed'
export async function saveFile(filename: string, data: Blob): Promise<SaveOutcome> {
  const d = await runtime()
  if (d) {
    try { await d.save({ filename, data }); return 'saved' } catch (e) {
      return (e as { code?: string })?.code === 'declined' ? 'declined' : 'failed'
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(data); a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  return 'saved'
}
