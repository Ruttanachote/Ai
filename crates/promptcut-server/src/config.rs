//! Configuration from environment only — no secrets in code or repo.

/// Which AI backend to use for chat-to-edit.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AgentMode {
    /// Pick automatically: API key if present, else local Claude Code CLI.
    Auto,
    /// Anthropic API with ANTHROPIC_API_KEY.
    Api,
    /// Local Claude Code CLI (`claude -p`) — uses the user's own login.
    ClaudeCli,
}

#[derive(Debug, Clone)]
pub struct Config {
    pub bind: String,
    pub anthropic_api_key: Option<String>,
    pub model: String,
    pub agent_mode: AgentMode,
    pub claude_cli_bin: String,
}

impl Config {
    pub fn from_env() -> Self {
        let agent_mode = match std::env::var("PROMPTCUT_AGENT").as_deref() {
            Ok("api") => AgentMode::Api,
            Ok("claude-cli") => AgentMode::ClaudeCli,
            _ => AgentMode::Auto,
        };
        Self {
            bind: std::env::var("PROMPTCUT_BIND").unwrap_or_else(|_| "0.0.0.0:8080".into()),
            anthropic_api_key: std::env::var("ANTHROPIC_API_KEY")
                .ok()
                .filter(|k| !k.trim().is_empty()),
            model: std::env::var("PROMPTCUT_MODEL").unwrap_or_else(|_| "claude-sonnet-5".into()),
            agent_mode,
            claude_cli_bin: std::env::var("PROMPTCUT_CLI_BIN").unwrap_or_else(|_| "claude".into()),
        }
    }
}
