//! Word/segment-level transcript bound to source-media time. This is what the
//! AI agent "sees"; silence and filler detection run here so those cuts work
//! even without any LLM call.

use serde::{Deserialize, Serialize};

use crate::ops::{normalize_ranges, TimeRange};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TranscriptSegment {
    pub start_ms: u64,
    pub end_ms: u64,
    pub text: String,
    #[serde(default)]
    pub speaker: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Transcript {
    pub language: String,
    pub segments: Vec<TranscriptSegment>,
}

/// Filler tokens matched case-insensitively against whole segments.
/// Thai fillers included from day one — a deliberate product edge.
const FILLERS: &[&str] = &[
    "um",
    "uh",
    "erm",
    "hmm",
    "like,",
    "you know",
    "เอ่อ",
    "อ่า",
    "อืม",
    "แบบว่า",
    "ก็แบบ",
];

impl Transcript {
    /// Gaps between consecutive segments longer than `min_gap_ms`.
    pub fn silence_ranges(&self, min_gap_ms: u64) -> Vec<TimeRange> {
        let mut out = Vec::new();
        for pair in self.segments.windows(2) {
            let gap_start = pair[0].end_ms;
            let gap_end = pair[1].start_ms;
            if gap_end > gap_start && gap_end - gap_start >= min_gap_ms {
                out.push(TimeRange {
                    start_ms: gap_start,
                    end_ms: gap_end,
                });
            }
        }
        out
    }

    /// Segments that consist only of filler words.
    pub fn filler_ranges(&self) -> Vec<TimeRange> {
        let ranges = self
            .segments
            .iter()
            .filter(|s| {
                let t = s.text.trim().to_lowercase();
                !t.is_empty() && FILLERS.iter().any(|f| t == *f)
            })
            .map(|s| TimeRange {
                start_ms: s.start_ms,
                end_ms: s.end_ms,
            })
            .collect();
        normalize_ranges(ranges)
    }

    /// Plain-text rendering with timestamps, fed to the agent as context.
    pub fn to_prompt_text(&self, max_chars: usize) -> String {
        let mut out = String::new();
        for s in &self.segments {
            let line = format!(
                "[{} - {}] {}\n",
                fmt_ms(s.start_ms),
                fmt_ms(s.end_ms),
                s.text
            );
            if out.len() + line.len() > max_chars {
                out.push_str("…(truncated)\n");
                break;
            }
            out.push_str(&line);
        }
        out
    }
}

fn fmt_ms(ms: u64) -> String {
    let total_s = ms / 1000;
    format!("{:02}:{:02}.{:03}", total_s / 60, total_s % 60, ms % 1000)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn seg(start: u64, end: u64, text: &str) -> TranscriptSegment {
        TranscriptSegment {
            start_ms: start,
            end_ms: end,
            text: text.to_string(),
            speaker: None,
        }
    }

    #[test]
    fn detects_silence_gaps() {
        let t = Transcript {
            language: "th".into(),
            segments: vec![seg(0, 1_000, "สวัสดีครับ"), seg(4_000, 5_000, "วันนี้")],
        };
        assert_eq!(
            t.silence_ranges(1_500),
            vec![TimeRange {
                start_ms: 1_000,
                end_ms: 4_000
            }]
        );
        assert!(t.silence_ranges(5_000).is_empty());
    }

    #[test]
    fn detects_thai_and_english_fillers() {
        let t = Transcript {
            language: "th".into(),
            segments: vec![
                seg(0, 500, "เอ่อ"),
                seg(500, 2_000, "วันนี้เราจะมาพูดถึง Rust"),
                seg(2_000, 2_300, "Um"),
            ],
        };
        let ranges = t.filler_ranges();
        assert_eq!(ranges.len(), 2);
        assert_eq!(ranges[0].start_ms, 0);
        assert_eq!(ranges[1].start_ms, 2_000);
    }

    #[test]
    fn prompt_text_truncates() {
        let t = Transcript {
            language: "en".into(),
            segments: (0..100)
                .map(|i| seg(i * 1000, (i + 1) * 1000, "hello world"))
                .collect(),
        };
        let text = t.to_prompt_text(300);
        assert!(text.len() < 400);
        assert!(text.contains("truncated"));
    }
}
