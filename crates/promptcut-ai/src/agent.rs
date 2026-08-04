//! The edit agent: instruction + transcript in, validated operations out.

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::json;

use promptcut_core::EditOperation;

use crate::client::{AnthropicClient, ChatMessage, ContentBlock, MessagesRequest, ToolDefinition};
use crate::AiError;

/// Everything the agent may see. The server trims the transcript to the
/// relevant excerpt before building this — context size is a cost control.
#[derive(Debug, Clone)]
pub struct ProposalRequest {
    pub instruction: String,
    pub timeline_duration_ms: u64,
    pub transcript_excerpt: String,
}

/// What the agent hands back. This is a *proposal*: the UI shows it to the
/// user for Apply/Reject; nothing is applied automatically.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EditProposal {
    pub summary: String,
    pub operations: Vec<EditOperation>,
    #[serde(default)]
    pub input_tokens: u64,
    #[serde(default)]
    pub output_tokens: u64,
}

/// Shape of the `propose_edits` tool input the model must produce.
#[derive(Debug, Deserialize)]
struct ProposeEditsInput {
    summary: String,
    operations: Vec<EditOperation>,
}

#[async_trait]
pub trait EditAgent: Send + Sync {
    async fn propose(&self, req: &ProposalRequest) -> Result<EditProposal, AiError>;
}

pub struct ClaudeEditAgent {
    client: AnthropicClient,
}

impl ClaudeEditAgent {
    pub fn new(client: AnthropicClient) -> Self {
        Self { client }
    }

    fn system_prompt() -> String {
        "You are a professional video editing agent inside a timeline editor. \
         You receive the user's instruction (any language, often Thai) plus a \
         timestamped transcript of the source footage. Respond ONLY by calling \
         the propose_edits tool with concrete edit operations. All times are \
         milliseconds in *timeline* coordinates and must lie within the given \
         timeline duration. Prefer few, precise operations. If the instruction \
         is too ambiguous to act on, return zero operations and use the summary \
         to ask one clarifying question in the user's language."
            .to_string()
    }

    fn tool_definition() -> ToolDefinition {
        ToolDefinition {
            name: "propose_edits".into(),
            description: "Propose a batch of timeline edit operations for user approval.".into(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "summary": {
                        "type": "string",
                        "description": "One short paragraph, in the user's language, explaining what these edits do and why."
                    },
                    "operations": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "description": "Tagged edit operation",
                            "properties": {
                                "type": {
                                    "type": "string",
                                    "enum": ["remove_ranges", "keep_only_ranges", "split_clip", "reorder_clips", "set_captions"]
                                },
                                "ranges": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "start_ms": {"type": "integer", "minimum": 0},
                                            "end_ms": {"type": "integer", "minimum": 0}
                                        },
                                        "required": ["start_ms", "end_ms"]
                                    }
                                },
                                "at_ms": {"type": "integer", "minimum": 0},
                                "clip_ids": {"type": "array", "items": {"type": "string"}},
                                "language": {"type": "string"},
                                "captions": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "start_ms": {"type": "integer"},
                                            "end_ms": {"type": "integer"},
                                            "text": {"type": "string"}
                                        },
                                        "required": ["start_ms", "end_ms", "text"]
                                    }
                                }
                            },
                            "required": ["type"]
                        }
                    }
                },
                "required": ["summary", "operations"]
            }),
        }
    }

    fn user_prompt(req: &ProposalRequest) -> String {
        format!(
            "Timeline duration: {} ms\n\nTranscript (timeline coordinates):\n{}\n\nUser instruction:\n{}",
            req.timeline_duration_ms, req.transcript_excerpt, req.instruction
        )
    }
}

#[async_trait]
impl EditAgent for ClaudeEditAgent {
    async fn propose(&self, req: &ProposalRequest) -> Result<EditProposal, AiError> {
        let request = MessagesRequest {
            model: self.client.model.clone(),
            max_tokens: 4096,
            system: Self::system_prompt(),
            messages: vec![ChatMessage {
                role: "user".into(),
                content: Self::user_prompt(req),
            }],
            tools: vec![Self::tool_definition()],
            tool_choice: json!({"type": "tool", "name": "propose_edits"}),
        };

        let resp = self.client.create_message(&request).await?;
        tracing::debug!(
            input_tokens = resp.usage.input_tokens,
            output_tokens = resp.usage.output_tokens,
            "agent call completed"
        );

        let input = resp
            .content
            .into_iter()
            .find_map(|block| match block {
                ContentBlock::ToolUse { name, input, .. } if name == "propose_edits" => Some(input),
                _ => None,
            })
            .ok_or(AiError::NoToolCall)?;

        let parsed: ProposeEditsInput = serde_json::from_value(input)?;
        Ok(EditProposal {
            summary: parsed.summary,
            operations: parsed.operations,
            input_tokens: resp.usage.input_tokens,
            output_tokens: resp.usage.output_tokens,
        })
    }
}

/// Deterministic agent for tests and offline development.
pub struct MockEditAgent {
    pub proposal: EditProposal,
}

#[async_trait]
impl EditAgent for MockEditAgent {
    async fn propose(&self, _req: &ProposalRequest) -> Result<EditProposal, AiError> {
        Ok(self.proposal.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use promptcut_core::TimeRange;

    #[test]
    fn parses_model_tool_input_into_operations() {
        let input = json!({
            "summary": "ตัดช่วงเงียบ 2 ช่วง รวม 3.5 วินาที",
            "operations": [
                {"type": "remove_ranges", "ranges": [
                    {"start_ms": 1000, "end_ms": 2500},
                    {"start_ms": 8000, "end_ms": 10000}
                ]},
                {"type": "set_captions", "language": "th", "captions": [
                    {"start_ms": 0, "end_ms": 1000, "text": "สวัสดีครับ"}
                ]}
            ]
        });
        let parsed: ProposeEditsInput = serde_json::from_value(input).unwrap();
        assert_eq!(parsed.operations.len(), 2);
        match &parsed.operations[0] {
            EditOperation::RemoveRanges { ranges } => {
                assert_eq!(
                    ranges[0],
                    TimeRange {
                        start_ms: 1000,
                        end_ms: 2500
                    }
                );
            }
            other => panic!("unexpected op: {other:?}"),
        }
    }

    #[test]
    fn rejects_malformed_tool_input() {
        let input = json!({"summary": "x", "operations": [{"type": "delete_everything"}]});
        assert!(serde_json::from_value::<ProposeEditsInput>(input).is_err());
    }
}
