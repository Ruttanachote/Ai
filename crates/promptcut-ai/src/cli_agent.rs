//! Edit agent backed by the locally installed Claude Code CLI (`claude -p`).
//!
//! This lets a user run PromptCut against their own Claude Code login instead
//! of an API key. Intended for personal/local use on the user's own machine —
//! Anthropic's terms require API keys for products distributed to third
//! parties, so production deployments should use `ClaudeEditAgent` instead.

use std::process::Stdio;
use std::time::Duration;

use async_trait::async_trait;

use crate::agent::{EditAgent, EditProposal, ProposalRequest, ProposeEditsInput};
use crate::AiError;

pub struct ClaudeCliAgent {
    pub binary: String,
    pub timeout: Duration,
}

impl Default for ClaudeCliAgent {
    fn default() -> Self {
        Self {
            binary: "claude".into(),
            timeout: Duration::from_secs(180),
        }
    }
}

impl ClaudeCliAgent {
    /// True when the CLI is on PATH and runnable.
    pub async fn is_available(binary: &str) -> bool {
        tokio::process::Command::new(binary)
            .arg("--version")
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .await
            .map(|s| s.success())
            .unwrap_or(false)
    }

    /// The whole task in one prompt: the CLI has no tool-forcing, so we ask
    /// for the exact JSON shape and validate it just as strictly afterwards.
    fn build_prompt(req: &ProposalRequest) -> String {
        format!(
            "You are a video editing agent inside a timeline editor. Based on the \
             transcript and the user's instruction, propose timeline edits.\n\
             \n\
             Timeline duration: {} ms\n\
             \n\
             Transcript (timeline coordinates):\n{}\n\
             User instruction:\n{}\n\
             \n\
             Respond with ONLY a JSON object, no prose and no code fences:\n\
             {{\"summary\": \"<short explanation in the user's language>\", \"operations\": [...]}}\n\
             \n\
             Each operation is one of (all times are milliseconds within the timeline duration):\n\
             {{\"type\": \"remove_ranges\", \"ranges\": [{{\"start_ms\": int, \"end_ms\": int}}]}}\n\
             {{\"type\": \"keep_only_ranges\", \"ranges\": [{{\"start_ms\": int, \"end_ms\": int}}]}}\n\
             {{\"type\": \"split_clip\", \"at_ms\": int}}\n\
             {{\"type\": \"set_captions\", \"language\": \"th\", \"captions\": [{{\"start_ms\": int, \"end_ms\": int, \"text\": \"...\"}}]}}\n\
             \n\
             Prefer few, precise operations. If the instruction is too ambiguous, return \
             zero operations and ask one clarifying question in the summary.",
            req.timeline_duration_ms, req.transcript_excerpt, req.instruction
        )
    }

    /// `claude -p --output-format json` wraps the answer in a result envelope;
    /// unwrap it, then pull the proposal JSON out of the answer text.
    fn parse_cli_output(stdout: &str) -> Result<EditProposal, AiError> {
        let envelope: serde_json::Value = serde_json::from_str(stdout.trim())
            .map_err(|e| AiError::CliOutput(format!("invalid result envelope: {e}")))?;

        if envelope.get("is_error").and_then(|v| v.as_bool()) == Some(true) {
            return Err(AiError::CliOutput(
                envelope
                    .get("result")
                    .and_then(|v| v.as_str())
                    .unwrap_or("claude CLI reported an error")
                    .to_string(),
            ));
        }

        let text = envelope
            .get("result")
            .and_then(|v| v.as_str())
            .ok_or_else(|| AiError::CliOutput("missing `result` field".into()))?;

        let json = Self::extract_json_object(text)
            .ok_or_else(|| AiError::CliOutput(format!("no JSON object in answer: {text}")))?;
        let parsed: ProposeEditsInput = serde_json::from_str(json)?;

        Ok(EditProposal {
            summary: parsed.summary,
            operations: parsed.operations,
            input_tokens: envelope
                .pointer("/usage/input_tokens")
                .and_then(|v| v.as_u64())
                .unwrap_or(0),
            output_tokens: envelope
                .pointer("/usage/output_tokens")
                .and_then(|v| v.as_u64())
                .unwrap_or(0),
        })
    }

    /// Tolerate prose or code fences around the object the model returns.
    fn extract_json_object(text: &str) -> Option<&str> {
        let start = text.find('{')?;
        let end = text.rfind('}')?;
        (end > start).then(|| &text[start..=end])
    }
}

#[async_trait]
impl EditAgent for ClaudeCliAgent {
    async fn propose(&self, req: &ProposalRequest) -> Result<EditProposal, AiError> {
        let mut command = tokio::process::Command::new(&self.binary);
        command
            .arg("-p")
            .arg(Self::build_prompt(req))
            .arg("--output-format")
            .arg("json")
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        tracing::info!(binary = %self.binary, "running Claude Code CLI agent");
        let output = tokio::time::timeout(self.timeout, command.output())
            .await
            .map_err(|_| AiError::CliTimeout(self.timeout.as_secs()))?
            .map_err(|e| {
                if e.kind() == std::io::ErrorKind::NotFound {
                    AiError::CliMissing
                } else {
                    AiError::CliOutput(e.to_string())
                }
            })?;

        if !output.status.success() {
            return Err(AiError::CliFailed {
                status: output.status.code().unwrap_or(-1),
                stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
            });
        }

        Self::parse_cli_output(&String::from_utf8_lossy(&output.stdout))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use promptcut_core::EditOperation;

    #[test]
    fn parses_result_envelope_with_clean_json() {
        let stdout = r#"{
            "type": "result", "subtype": "success", "is_error": false,
            "result": "{\"summary\": \"ตัดช่วงเงียบ 1 ช่วง\", \"operations\": [{\"type\": \"remove_ranges\", \"ranges\": [{\"start_ms\": 1000, \"end_ms\": 2000}]}]}",
            "usage": {"input_tokens": 900, "output_tokens": 60}
        }"#;
        let proposal = ClaudeCliAgent::parse_cli_output(stdout).unwrap();
        assert_eq!(proposal.operations.len(), 1);
        assert!(matches!(
            proposal.operations[0],
            EditOperation::RemoveRanges { .. }
        ));
        assert_eq!(proposal.input_tokens, 900);
    }

    #[test]
    fn tolerates_prose_and_code_fences_around_json() {
        let stdout = r#"{"is_error": false, "result": "Here you go:\n```json\n{\"summary\": \"ok\", \"operations\": []}\n```"}"#;
        let proposal = ClaudeCliAgent::parse_cli_output(stdout).unwrap();
        assert_eq!(proposal.summary, "ok");
        assert!(proposal.operations.is_empty());
    }

    #[test]
    fn surfaces_cli_error_envelope() {
        let stdout = r#"{"is_error": true, "result": "Not logged in"}"#;
        let err = ClaudeCliAgent::parse_cli_output(stdout).unwrap_err();
        assert!(matches!(err, AiError::CliOutput(msg) if msg.contains("Not logged in")));
    }

    #[test]
    fn rejects_answers_without_json() {
        let stdout = r#"{"is_error": false, "result": "I cannot help with that."}"#;
        assert!(ClaudeCliAgent::parse_cli_output(stdout).is_err());
    }
}
