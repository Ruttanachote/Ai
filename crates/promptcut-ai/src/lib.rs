//! The AI layer: a thin Anthropic Messages API client plus the edit agent
//! that turns natural-language instructions into validated `EditOperation`s.
//!
//! Design rule: the model can only answer through the `propose_edits` tool,
//! so its output is always structured JSON — never free text we have to parse.

pub mod agent;
pub mod cli_agent;
pub mod client;

pub use agent::{ClaudeEditAgent, EditAgent, EditProposal, MockEditAgent, ProposalRequest};
pub use cli_agent::ClaudeCliAgent;
pub use client::AnthropicClient;

#[derive(Debug, thiserror::Error)]
pub enum AiError {
    #[error("http error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("anthropic api error (status {status}): {body}")]
    Api { status: u16, body: String },
    #[error("model response did not include a propose_edits tool call")]
    NoToolCall,
    #[error("model returned operations that failed schema validation: {0}")]
    BadToolInput(#[from] serde_json::Error),
    #[error("claude CLI not found — install Claude Code and run `claude` once to log in")]
    CliMissing,
    #[error("claude CLI exited with status {status}: {stderr}")]
    CliFailed { status: i32, stderr: String },
    #[error("claude CLI timed out after {0} seconds")]
    CliTimeout(u64),
    #[error("could not parse claude CLI output: {0}")]
    CliOutput(String),
}
