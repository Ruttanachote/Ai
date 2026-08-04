//! ffmpeg-backed media engine. Command lines are built as pure functions
//! (fully unit-testable without ffmpeg installed); only `run_*` methods spawn
//! the actual process. Source files are never modified — renders always write
//! to new outputs.

use std::path::{Path, PathBuf};
use std::process::Stdio;

use promptcut_core::{Caption, MediaAsset, Timeline};

#[derive(Debug, thiserror::Error)]
pub enum MediaError {
    #[error("ffmpeg not found on PATH — install ffmpeg to render")]
    FfmpegMissing,
    #[error("ffmpeg exited with status {status}: {stderr}")]
    FfmpegFailed { status: i32, stderr: String },
    #[error("timeline references unknown asset {0}")]
    UnknownAsset(uuid::Uuid),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}

/// One segment to extract from a source file, in source coordinates.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CutStep {
    pub input: PathBuf,
    pub source_in_ms: u64,
    pub source_out_ms: u64,
    pub output: PathBuf,
}

/// Full render plan derived from a timeline: cut each clip, concat, then
/// optionally burn captions.
#[derive(Debug, Clone)]
pub struct RenderPlan {
    pub cuts: Vec<CutStep>,
    pub concat_list: String,
    pub captions_srt: Option<String>,
}

/// Derive a render plan from the timeline's primary track.
/// `resolve_asset` maps an asset to the path of its media file on disk.
pub fn plan_render(
    timeline: &Timeline,
    assets: &[MediaAsset],
    media_dir: &Path,
    work_dir: &Path,
) -> Result<RenderPlan, MediaError> {
    let mut cuts = Vec::new();
    let mut concat_lines = String::new();

    for (i, clip) in timeline.primary_track().clips.iter().enumerate() {
        let asset = assets
            .iter()
            .find(|a| a.id == clip.asset_id)
            .ok_or(MediaError::UnknownAsset(clip.asset_id))?;
        let output = work_dir.join(format!("seg_{i:04}.mp4"));
        concat_lines.push_str(&format!("file '{}'\n", output.display()));
        cuts.push(CutStep {
            input: media_dir.join(&asset.filename),
            source_in_ms: clip.source_in_ms,
            source_out_ms: clip.source_out_ms,
            output,
        });
    }

    let captions_srt = if timeline.captions.is_empty() {
        None
    } else {
        Some(captions_to_srt(&timeline.captions))
    };

    Ok(RenderPlan {
        cuts,
        concat_list: concat_lines,
        captions_srt,
    })
}

/// `[start,end)` ms → SRT timestamp `HH:MM:SS,mmm`.
fn srt_timestamp(ms: u64) -> String {
    let h = ms / 3_600_000;
    let m = (ms % 3_600_000) / 60_000;
    let s = (ms % 60_000) / 1_000;
    format!("{h:02}:{m:02}:{s:02},{:03}", ms % 1_000)
}

pub fn captions_to_srt(captions: &[Caption]) -> String {
    let mut out = String::new();
    for (i, c) in captions.iter().enumerate() {
        out.push_str(&format!(
            "{}\n{} --> {}\n{}\n\n",
            i + 1,
            srt_timestamp(c.start_ms),
            srt_timestamp(c.end_ms),
            c.text
        ));
    }
    out
}

fn ms_to_secs(ms: u64) -> String {
    format!("{}.{:03}", ms / 1000, ms % 1000)
}

/// Args to extract one segment (re-encode for frame accuracy at cut points).
pub fn build_cut_args(step: &CutStep) -> Vec<String> {
    vec![
        "-hide_banner".into(),
        "-y".into(),
        "-ss".into(),
        ms_to_secs(step.source_in_ms),
        "-to".into(),
        ms_to_secs(step.source_out_ms),
        "-i".into(),
        step.input.display().to_string(),
        "-c:v".into(),
        "libx264".into(),
        "-preset".into(),
        "veryfast".into(),
        "-c:a".into(),
        "aac".into(),
        step.output.display().to_string(),
    ]
}

/// Args to concat pre-cut segments listed in `list_file`.
pub fn build_concat_args(list_file: &Path, output: &Path) -> Vec<String> {
    vec![
        "-hide_banner".into(),
        "-y".into(),
        "-f".into(),
        "concat".into(),
        "-safe".into(),
        "0".into(),
        "-i".into(),
        list_file.display().to_string(),
        "-c".into(),
        "copy".into(),
        output.display().to_string(),
    ]
}

/// Args to burn an SRT file into the video.
pub fn build_burn_subtitles_args(input: &Path, srt: &Path, output: &Path) -> Vec<String> {
    vec![
        "-hide_banner".into(),
        "-y".into(),
        "-i".into(),
        input.display().to_string(),
        "-vf".into(),
        format!("subtitles={}", srt.display()),
        "-c:a".into(),
        "copy".into(),
        output.display().to_string(),
    ]
}

pub struct FfmpegEngine {
    pub ffmpeg_path: String,
}

impl Default for FfmpegEngine {
    fn default() -> Self {
        Self {
            ffmpeg_path: "ffmpeg".into(),
        }
    }
}

impl FfmpegEngine {
    pub async fn is_available(&self) -> bool {
        tokio::process::Command::new(&self.ffmpeg_path)
            .arg("-version")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .await
            .map(|s| s.success())
            .unwrap_or(false)
    }

    pub async fn run(&self, args: &[String]) -> Result<(), MediaError> {
        let output = tokio::process::Command::new(&self.ffmpeg_path)
            .args(args)
            .stdin(Stdio::null())
            .output()
            .await
            .map_err(|e| {
                if e.kind() == std::io::ErrorKind::NotFound {
                    MediaError::FfmpegMissing
                } else {
                    MediaError::Io(e)
                }
            })?;
        if !output.status.success() {
            return Err(MediaError::FfmpegFailed {
                status: output.status.code().unwrap_or(-1),
                stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
            });
        }
        Ok(())
    }

    /// Execute a full plan: cuts → concat → optional caption burn.
    pub async fn execute(
        &self,
        plan: &RenderPlan,
        work_dir: &Path,
        output: &Path,
    ) -> Result<(), MediaError> {
        for step in &plan.cuts {
            tracing::info!(input = %step.input.display(), "cutting segment");
            self.run(&build_cut_args(step)).await?;
        }
        let list_file = work_dir.join("concat.txt");
        tokio::fs::write(&list_file, &plan.concat_list).await?;

        match &plan.captions_srt {
            None => self.run(&build_concat_args(&list_file, output)).await?,
            Some(srt) => {
                let joined = work_dir.join("joined.mp4");
                self.run(&build_concat_args(&list_file, &joined)).await?;
                let srt_file = work_dir.join("captions.srt");
                tokio::fs::write(&srt_file, srt).await?;
                self.run(&build_burn_subtitles_args(&joined, &srt_file, output))
                    .await?;
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use promptcut_core::Project;

    #[test]
    fn srt_formatting() {
        assert_eq!(srt_timestamp(0), "00:00:00,000");
        assert_eq!(srt_timestamp(3_723_456), "01:02:03,456");
        let srt = captions_to_srt(&[Caption {
            start_ms: 500,
            end_ms: 2_000,
            text: "สวัสดีครับ".into(),
        }]);
        assert!(srt.starts_with("1\n00:00:00,500 --> 00:00:02,000\nสวัสดีครับ\n"));
    }

    #[test]
    fn cut_args_use_millisecond_precision() {
        let step = CutStep {
            input: PathBuf::from("/media/a.mp4"),
            source_in_ms: 1_500,
            source_out_ms: 10_250,
            output: PathBuf::from("/work/seg_0000.mp4"),
        };
        let args = build_cut_args(&step);
        let joined = args.join(" ");
        assert!(joined.contains("-ss 1.500"));
        assert!(joined.contains("-to 10.250"));
        assert!(joined.contains("/media/a.mp4"));
    }

    #[test]
    fn plan_render_maps_clips_to_cut_steps() {
        let mut p = Project::new("t");
        p.add_asset("a.mp4", 10_000);
        let plan = plan_render(
            &p.timeline,
            &p.assets,
            Path::new("/media"),
            Path::new("/work"),
        )
        .unwrap();
        assert_eq!(plan.cuts.len(), 1);
        assert_eq!(plan.cuts[0].input, PathBuf::from("/media/a.mp4"));
        assert!(plan.concat_list.contains("seg_0000.mp4"));
        assert!(plan.captions_srt.is_none());
    }
}
