// Mirrors the JSON shapes served by promptcut-server (see crates/promptcut-server).

export interface TimeRange {
  start_ms: number
  end_ms: number
}

export interface Caption {
  start_ms: number
  end_ms: number
  text: string
}

export type EditOperation =
  | { type: 'remove_ranges'; ranges: TimeRange[] }
  | { type: 'keep_only_ranges'; ranges: TimeRange[] }
  | { type: 'split_clip'; at_ms: number }
  | { type: 'reorder_clips'; clip_ids: string[] }
  | { type: 'set_captions'; language: string; captions: Caption[] }

export interface Clip {
  id: string
  asset_id: string
  source_in_ms: number
  source_out_ms: number
}

export interface Track {
  id: string
  kind: 'video' | 'audio'
  clips: Clip[]
}

export interface Timeline {
  tracks: Track[]
  caption_language: string | null
  captions: Caption[]
}

export interface TranscriptSegment {
  start_ms: number
  end_ms: number
  text: string
  speaker?: string | null
}

export interface Transcript {
  language: string
  segments: TranscriptSegment[]
}

export interface MediaAsset {
  id: string
  filename: string
  duration_ms: number
  transcript?: Transcript | null
}

export interface AppliedEdit {
  description: string
  operations: EditOperation[]
}

export interface Project {
  id: string
  name: string
  assets: MediaAsset[]
  timeline: Timeline
  history: AppliedEdit[]
}

export interface ProjectSummary {
  id: string
  name: string
  duration_ms: number
  assets: number
  history_len: number
}

export interface EditProposal {
  summary: string
  operations: EditOperation[]
  input_tokens: number
  output_tokens: number
}

export interface Health {
  status: string
  agent_enabled: boolean
  agent_mode: 'api' | 'claude-cli' | 'disabled'
  model: string
}
