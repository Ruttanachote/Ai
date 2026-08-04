//! Pure domain logic for PromptCut: projects, timelines, transcripts, and the
//! edit operations an AI agent may propose. No I/O — everything here is
//! deterministic and unit-testable, and can later target WASM.

pub mod ops;
pub mod project;
pub mod timeline;
pub mod transcript;

pub use ops::{EditOperation, TimeRange};
pub use project::{MediaAsset, Project};
pub use timeline::{Caption, Clip, Timeline, Track, TrackKind};
pub use transcript::{Transcript, TranscriptSegment};

#[derive(Debug, thiserror::Error)]
pub enum CoreError {
    #[error("invalid time range: start {start_ms}ms must be before end {end_ms}ms")]
    InvalidRange { start_ms: u64, end_ms: u64 },
    #[error("range end {end_ms}ms exceeds timeline duration {duration_ms}ms")]
    RangeOutOfBounds { end_ms: u64, duration_ms: u64 },
    #[error("operation produced an empty timeline; rejected to avoid data loss")]
    WouldEmptyTimeline,
    #[error("clip {0} not found")]
    ClipNotFound(uuid::Uuid),
    #[error("asset {0} not found")]
    AssetNotFound(uuid::Uuid),
    #[error("split point {at_ms}ms does not fall inside any clip")]
    SplitOutsideClips { at_ms: u64 },
    #[error("nothing to undo")]
    NothingToUndo,
}
