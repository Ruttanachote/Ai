//! Project aggregate: assets + timeline + edit history (undo & AI audit trail).

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::ops::EditOperation;
use crate::timeline::{Clip, Timeline};
use crate::transcript::Transcript;
use crate::CoreError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaAsset {
    pub id: Uuid,
    pub filename: String,
    pub duration_ms: u64,
    #[serde(default)]
    pub transcript: Option<Transcript>,
}

/// One applied edit batch — who asked for it, what it did, and the timeline
/// snapshot needed to undo it. Doubles as the AI audit trail.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppliedEdit {
    pub description: String,
    pub operations: Vec<EditOperation>,
    snapshot_before: Timeline,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: Uuid,
    pub name: String,
    pub assets: Vec<MediaAsset>,
    pub timeline: Timeline,
    pub history: Vec<AppliedEdit>,
}

impl Project {
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            name: name.into(),
            assets: Vec::new(),
            timeline: Timeline::new(),
            history: Vec::new(),
        }
    }

    /// Register an asset and append it whole to the primary track.
    pub fn add_asset(&mut self, filename: impl Into<String>, duration_ms: u64) -> Uuid {
        let asset = MediaAsset {
            id: Uuid::new_v4(),
            filename: filename.into(),
            duration_ms,
            transcript: None,
        };
        let id = asset.id;
        self.timeline.tracks[0]
            .clips
            .push(Clip::new(id, 0, duration_ms));
        self.assets.push(asset);
        id
    }

    pub fn set_transcript(
        &mut self,
        asset_id: Uuid,
        transcript: Transcript,
    ) -> Result<(), CoreError> {
        let asset = self
            .assets
            .iter_mut()
            .find(|a| a.id == asset_id)
            .ok_or(CoreError::AssetNotFound(asset_id))?;
        asset.transcript = Some(transcript);
        Ok(())
    }

    /// Apply a batch atomically: all operations succeed or the timeline is
    /// left exactly as it was. On success the batch becomes one undo step.
    pub fn apply_edits(
        &mut self,
        description: impl Into<String>,
        operations: Vec<EditOperation>,
    ) -> Result<(), CoreError> {
        let snapshot_before = self.timeline.clone();
        let mut working = self.timeline.clone();
        for op in &operations {
            working.apply(op)?;
        }
        self.timeline = working;
        self.history.push(AppliedEdit {
            description: description.into(),
            operations,
            snapshot_before,
        });
        Ok(())
    }

    pub fn undo(&mut self) -> Result<(), CoreError> {
        let last = self.history.pop().ok_or(CoreError::NothingToUndo)?;
        self.timeline = last.snapshot_before;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ops::TimeRange;

    #[test]
    fn apply_is_atomic_across_the_batch() {
        let mut p = Project::new("test");
        p.add_asset("a.mp4", 10_000);
        // Second op is invalid (out of bounds) — first op must not stick.
        let err = p.apply_edits(
            "bad batch",
            vec![
                EditOperation::RemoveRanges {
                    ranges: vec![TimeRange::new(0, 1_000).unwrap()],
                },
                EditOperation::RemoveRanges {
                    ranges: vec![TimeRange::new(0, 99_000).unwrap()],
                },
            ],
        );
        assert!(err.is_err());
        assert_eq!(p.timeline.duration_ms(), 10_000);
        assert!(p.history.is_empty());
    }

    #[test]
    fn undo_restores_previous_timeline() {
        let mut p = Project::new("test");
        p.add_asset("a.mp4", 10_000);
        p.apply_edits(
            "cut intro",
            vec![EditOperation::RemoveRanges {
                ranges: vec![TimeRange::new(0, 2_000).unwrap()],
            }],
        )
        .unwrap();
        assert_eq!(p.timeline.duration_ms(), 8_000);

        p.undo().unwrap();
        assert_eq!(p.timeline.duration_ms(), 10_000);
        assert!(matches!(p.undo(), Err(CoreError::NothingToUndo)));
    }
}
