//! Edit operations — the only vocabulary the AI agent is allowed to speak.
//! The agent returns these as JSON; the engine validates and applies them.
//! The agent never touches files or the timeline directly.

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::timeline::Caption;
use crate::CoreError;

/// Half-open range `[start_ms, end_ms)` in timeline coordinates.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct TimeRange {
    pub start_ms: u64,
    pub end_ms: u64,
}

impl TimeRange {
    pub fn new(start_ms: u64, end_ms: u64) -> Result<Self, CoreError> {
        if start_ms >= end_ms {
            return Err(CoreError::InvalidRange { start_ms, end_ms });
        }
        Ok(Self { start_ms, end_ms })
    }

    pub fn duration_ms(&self) -> u64 {
        self.end_ms - self.start_ms
    }
}

/// Sort and merge overlapping/adjacent ranges into a canonical disjoint set.
pub fn normalize_ranges(mut ranges: Vec<TimeRange>) -> Vec<TimeRange> {
    ranges.sort_by_key(|r| r.start_ms);
    let mut merged: Vec<TimeRange> = Vec::with_capacity(ranges.len());
    for r in ranges {
        match merged.last_mut() {
            Some(last) if r.start_ms <= last.end_ms => {
                last.end_ms = last.end_ms.max(r.end_ms);
            }
            _ => merged.push(r),
        }
    }
    merged
}

/// Complement of `ranges` within `[0, total_ms)`.
pub fn complement_ranges(ranges: &[TimeRange], total_ms: u64) -> Vec<TimeRange> {
    let mut out = Vec::new();
    let mut cursor = 0u64;
    for r in ranges {
        if r.start_ms > cursor {
            out.push(TimeRange {
                start_ms: cursor,
                end_ms: r.start_ms.min(total_ms),
            });
        }
        cursor = cursor.max(r.end_ms);
    }
    if cursor < total_ms {
        out.push(TimeRange {
            start_ms: cursor,
            end_ms: total_ms,
        });
    }
    out
}

/// A single edit the agent proposes. Tagged so the JSON the model produces is
/// self-describing, e.g. `{"type": "remove_ranges", "ranges": [...]}`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum EditOperation {
    /// Cut these timeline ranges out (silence, filler words, mistakes).
    RemoveRanges { ranges: Vec<TimeRange> },
    /// Keep only these ranges — used for rough cuts and highlights.
    KeepOnlyRanges { ranges: Vec<TimeRange> },
    /// Split the clip under `at_ms` into two clips.
    SplitClip { at_ms: u64 },
    /// Reorder clips on the primary video track by id.
    ReorderClips { clip_ids: Vec<Uuid> },
    /// Replace captions for a language.
    SetCaptions {
        language: String,
        captions: Vec<Caption>,
    },
}

impl EditOperation {
    /// Human-readable label used in history/audit entries.
    pub fn label(&self) -> String {
        match self {
            EditOperation::RemoveRanges { ranges } => {
                let total: u64 = ranges.iter().map(TimeRange::duration_ms).sum();
                format!("remove {} range(s), {} ms total", ranges.len(), total)
            }
            EditOperation::KeepOnlyRanges { ranges } => {
                format!("keep only {} range(s)", ranges.len())
            }
            EditOperation::SplitClip { at_ms } => format!("split clip at {at_ms} ms"),
            EditOperation::ReorderClips { clip_ids } => {
                format!("reorder {} clip(s)", clip_ids.len())
            }
            EditOperation::SetCaptions { language, captions } => {
                format!("set {} captions ({language})", captions.len())
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn r(a: u64, b: u64) -> TimeRange {
        TimeRange::new(a, b).unwrap()
    }

    #[test]
    fn rejects_inverted_range() {
        assert!(TimeRange::new(5, 5).is_err());
        assert!(TimeRange::new(9, 3).is_err());
    }

    #[test]
    fn normalize_merges_overlaps() {
        let out = normalize_ranges(vec![r(10, 20), r(0, 5), r(18, 30), r(5, 6)]);
        assert_eq!(out, vec![r(0, 6), r(10, 30)]);
    }

    #[test]
    fn complement_covers_gaps() {
        let kept = vec![r(10, 20), r(40, 50)];
        let out = complement_ranges(&kept, 60);
        assert_eq!(out, vec![r(0, 10), r(20, 40), r(50, 60)]);
    }

    #[test]
    fn operation_json_shape_is_stable() {
        // The AI agent produces this exact JSON shape; guard it against drift.
        let json = r#"{"type":"remove_ranges","ranges":[{"start_ms":0,"end_ms":1500}]}"#;
        let op: EditOperation = serde_json::from_str(json).unwrap();
        assert!(matches!(op, EditOperation::RemoveRanges { .. }));
    }
}
