//! Non-destructive timeline: clips only *reference* source assets via
//! in/out points. Cutting never touches media files.

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::ops::{complement_ranges, normalize_ranges, EditOperation, TimeRange};
use crate::CoreError;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TrackKind {
    Video,
    Audio,
}

/// A slice of a source asset placed on the timeline. Clips on a track are
/// laid out sequentially (no gaps) — MVP model, matches transcript-driven
/// editing where removals close up automatically.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Clip {
    pub id: Uuid,
    pub asset_id: Uuid,
    pub source_in_ms: u64,
    pub source_out_ms: u64,
}

impl Clip {
    pub fn new(asset_id: Uuid, source_in_ms: u64, source_out_ms: u64) -> Self {
        Self {
            id: Uuid::new_v4(),
            asset_id,
            source_in_ms,
            source_out_ms,
        }
    }

    pub fn duration_ms(&self) -> u64 {
        self.source_out_ms - self.source_in_ms
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Track {
    pub id: Uuid,
    pub kind: TrackKind,
    pub clips: Vec<Clip>,
}

impl Track {
    pub fn new(kind: TrackKind) -> Self {
        Self {
            id: Uuid::new_v4(),
            kind,
            clips: Vec::new(),
        }
    }

    pub fn duration_ms(&self) -> u64 {
        self.clips.iter().map(Clip::duration_ms).sum()
    }

    /// Remove one timeline-coordinate range, splitting clips that straddle it.
    fn remove_range(&mut self, range: &TimeRange) {
        let mut new_clips = Vec::with_capacity(self.clips.len() + 1);
        let mut pos = 0u64;
        for clip in self.clips.drain(..) {
            let clip_start = pos;
            let clip_end = pos + clip.duration_ms();
            pos = clip_end;

            let ov_start = range.start_ms.max(clip_start);
            let ov_end = range.end_ms.min(clip_end);
            if ov_start >= ov_end {
                new_clips.push(clip);
                continue;
            }
            if ov_start > clip_start {
                let mut left = clip.clone();
                left.source_out_ms = clip.source_in_ms + (ov_start - clip_start);
                new_clips.push(left);
            }
            if ov_end < clip_end {
                let mut right = clip.clone();
                right.id = Uuid::new_v4();
                right.source_in_ms = clip.source_in_ms + (ov_end - clip_start);
                new_clips.push(right);
            }
        }
        self.clips = new_clips;
    }

    fn split_at(&mut self, at_ms: u64) -> Result<(), CoreError> {
        let mut pos = 0u64;
        for (i, clip) in self.clips.iter().enumerate() {
            let clip_start = pos;
            let clip_end = pos + clip.duration_ms();
            pos = clip_end;
            if at_ms > clip_start && at_ms < clip_end {
                let offset = at_ms - clip_start;
                let original = self.clips[i].clone();
                let mut right = original.clone();
                right.id = Uuid::new_v4();
                right.source_in_ms = original.source_in_ms + offset;
                self.clips[i].source_out_ms = original.source_in_ms + offset;
                self.clips.insert(i + 1, right);
                return Ok(());
            }
        }
        Err(CoreError::SplitOutsideClips { at_ms })
    }
}

/// A caption cue in timeline coordinates.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Caption {
    pub start_ms: u64,
    pub end_ms: u64,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Timeline {
    pub tracks: Vec<Track>,
    pub caption_language: Option<String>,
    pub captions: Vec<Caption>,
}

impl Default for Timeline {
    fn default() -> Self {
        Self::new()
    }
}

impl Timeline {
    pub fn new() -> Self {
        Self {
            tracks: vec![Track::new(TrackKind::Video)],
            caption_language: None,
            captions: Vec::new(),
        }
    }

    pub fn duration_ms(&self) -> u64 {
        self.tracks
            .iter()
            .map(Track::duration_ms)
            .max()
            .unwrap_or(0)
    }

    pub fn primary_track(&self) -> &Track {
        &self.tracks[0]
    }

    fn validate_ranges(&self, ranges: &[TimeRange]) -> Result<Vec<TimeRange>, CoreError> {
        let duration = self.duration_ms();
        let mut checked = Vec::with_capacity(ranges.len());
        for r in ranges {
            // Re-validate: these come from the AI as raw JSON.
            let r = TimeRange::new(r.start_ms, r.end_ms)?;
            if r.end_ms > duration {
                return Err(CoreError::RangeOutOfBounds {
                    end_ms: r.end_ms,
                    duration_ms: duration,
                });
            }
            checked.push(r);
        }
        Ok(normalize_ranges(checked))
    }

    /// Validate and apply a single operation. Errors leave the timeline untouched.
    pub fn apply(&mut self, op: &EditOperation) -> Result<(), CoreError> {
        match op {
            EditOperation::RemoveRanges { ranges } => {
                let ranges = self.validate_ranges(ranges)?;
                let removed: u64 = ranges.iter().map(TimeRange::duration_ms).sum();
                if removed >= self.duration_ms() {
                    return Err(CoreError::WouldEmptyTimeline);
                }
                // Apply back-to-front so earlier removals don't shift later ranges.
                for range in ranges.iter().rev() {
                    for track in &mut self.tracks {
                        track.remove_range(range);
                    }
                }
                Ok(())
            }
            EditOperation::KeepOnlyRanges { ranges } => {
                let keep = self.validate_ranges(ranges)?;
                if keep.is_empty() {
                    return Err(CoreError::WouldEmptyTimeline);
                }
                let drop = complement_ranges(&keep, self.duration_ms());
                for range in drop.iter().rev() {
                    for track in &mut self.tracks {
                        track.remove_range(range);
                    }
                }
                Ok(())
            }
            EditOperation::SplitClip { at_ms } => {
                for track in &mut self.tracks {
                    track.split_at(*at_ms)?;
                }
                Ok(())
            }
            EditOperation::ReorderClips { clip_ids } => {
                let track = &mut self.tracks[0];
                let mut reordered = Vec::with_capacity(track.clips.len());
                for id in clip_ids {
                    let idx = track
                        .clips
                        .iter()
                        .position(|c| c.id == *id)
                        .ok_or(CoreError::ClipNotFound(*id))?;
                    reordered.push(track.clips.remove(idx));
                }
                // Clips the agent didn't mention keep their relative order at the end.
                reordered.append(&mut track.clips);
                track.clips = reordered;
                Ok(())
            }
            EditOperation::SetCaptions { language, captions } => {
                for c in captions {
                    TimeRange::new(c.start_ms, c.end_ms)?;
                }
                self.caption_language = Some(language.clone());
                self.captions = captions.clone();
                Ok(())
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn timeline_with_one_clip(asset: Uuid, len_ms: u64) -> Timeline {
        let mut t = Timeline::new();
        t.tracks[0].clips.push(Clip::new(asset, 0, len_ms));
        t
    }

    #[test]
    fn remove_middle_splits_clip_and_shortens_timeline() {
        let asset = Uuid::new_v4();
        let mut t = timeline_with_one_clip(asset, 10_000);
        t.apply(&EditOperation::RemoveRanges {
            ranges: vec![TimeRange::new(2_000, 4_000).unwrap()],
        })
        .unwrap();

        assert_eq!(t.duration_ms(), 8_000);
        let clips = &t.primary_track().clips;
        assert_eq!(clips.len(), 2);
        assert_eq!((clips[0].source_in_ms, clips[0].source_out_ms), (0, 2_000));
        assert_eq!(
            (clips[1].source_in_ms, clips[1].source_out_ms),
            (4_000, 10_000)
        );
    }

    #[test]
    fn remove_multiple_ranges_applies_in_timeline_coordinates() {
        let asset = Uuid::new_v4();
        let mut t = timeline_with_one_clip(asset, 10_000);
        t.apply(&EditOperation::RemoveRanges {
            ranges: vec![
                TimeRange::new(1_000, 2_000).unwrap(),
                TimeRange::new(8_000, 9_000).unwrap(),
            ],
        })
        .unwrap();
        assert_eq!(t.duration_ms(), 8_000);
        // Source material 2000..8000 and 9000..10000 must survive intact.
        let clips = &t.primary_track().clips;
        assert_eq!(clips[1].source_in_ms, 2_000);
        assert_eq!(clips[1].source_out_ms, 8_000);
        assert_eq!(clips[2].source_in_ms, 9_000);
    }

    #[test]
    fn keep_only_is_complement_of_remove() {
        let asset = Uuid::new_v4();
        let mut t = timeline_with_one_clip(asset, 60_000);
        t.apply(&EditOperation::KeepOnlyRanges {
            ranges: vec![
                TimeRange::new(10_000, 20_000).unwrap(),
                TimeRange::new(40_000, 45_000).unwrap(),
            ],
        })
        .unwrap();
        assert_eq!(t.duration_ms(), 15_000);
    }

    #[test]
    fn refuses_to_empty_the_timeline() {
        let asset = Uuid::new_v4();
        let mut t = timeline_with_one_clip(asset, 5_000);
        let err = t
            .apply(&EditOperation::RemoveRanges {
                ranges: vec![TimeRange::new(0, 5_000).unwrap()],
            })
            .unwrap_err();
        assert!(matches!(err, CoreError::WouldEmptyTimeline));
        assert_eq!(t.duration_ms(), 5_000); // untouched
    }

    #[test]
    fn rejects_out_of_bounds_ranges_from_agent() {
        let asset = Uuid::new_v4();
        let mut t = timeline_with_one_clip(asset, 5_000);
        let err = t
            .apply(&EditOperation::RemoveRanges {
                ranges: vec![TimeRange::new(1_000, 99_000).unwrap()],
            })
            .unwrap_err();
        assert!(matches!(err, CoreError::RangeOutOfBounds { .. }));
    }

    #[test]
    fn split_then_reorder() {
        let asset = Uuid::new_v4();
        let mut t = timeline_with_one_clip(asset, 10_000);
        t.apply(&EditOperation::SplitClip { at_ms: 6_000 }).unwrap();
        let clips = t.primary_track().clips.clone();
        assert_eq!(clips.len(), 2);

        t.apply(&EditOperation::ReorderClips {
            clip_ids: vec![clips[1].id, clips[0].id],
        })
        .unwrap();
        let after = &t.primary_track().clips;
        assert_eq!(after[0].source_in_ms, 6_000);
        assert_eq!(after[1].source_in_ms, 0);
        assert_eq!(t.duration_ms(), 10_000);
    }
}
