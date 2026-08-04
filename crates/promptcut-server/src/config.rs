//! Configuration from environment only — no secrets in code or repo.

#[derive(Debug, Clone)]
pub struct Config {
    pub bind: String,
    pub anthropic_api_key: Option<String>,
    pub model: String,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            bind: std::env::var("PROMPTCUT_BIND").unwrap_or_else(|_| "0.0.0.0:8080".into()),
            anthropic_api_key: std::env::var("ANTHROPIC_API_KEY")
                .ok()
                .filter(|k| !k.trim().is_empty()),
            model: std::env::var("PROMPTCUT_MODEL").unwrap_or_else(|_| "claude-sonnet-5".into()),
        }
    }
}
