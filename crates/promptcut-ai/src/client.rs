//! Minimal Anthropic Messages API client (only what the edit agent needs).

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::AiError;

const ANTHROPIC_VERSION: &str = "2023-06-01";

pub struct AnthropicClient {
    http: reqwest::Client,
    api_key: String,
    base_url: String,
    pub model: String,
}

impl AnthropicClient {
    pub fn new(api_key: impl Into<String>, model: impl Into<String>) -> Self {
        Self {
            http: reqwest::Client::new(),
            api_key: api_key.into(),
            base_url: "https://api.anthropic.com".into(),
            model: model.into(),
        }
    }

    /// Override the API endpoint (tests, proxies).
    pub fn with_base_url(mut self, base_url: impl Into<String>) -> Self {
        self.base_url = base_url.into();
        self
    }

    pub async fn create_message(&self, req: &MessagesRequest) -> Result<MessagesResponse, AiError> {
        let resp = self
            .http
            .post(format!("{}/v1/messages", self.base_url))
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", ANTHROPIC_VERSION)
            .json(req)
            .send()
            .await?;

        let status = resp.status();
        if !status.is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(AiError::Api {
                status: status.as_u16(),
                body,
            });
        }
        Ok(resp.json().await?)
    }
}

#[derive(Debug, Serialize)]
pub struct MessagesRequest {
    pub model: String,
    pub max_tokens: u32,
    pub system: String,
    pub messages: Vec<ChatMessage>,
    pub tools: Vec<ToolDefinition>,
    pub tool_choice: Value,
}

#[derive(Debug, Serialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize)]
pub struct ToolDefinition {
    pub name: String,
    pub description: String,
    pub input_schema: Value,
}

#[derive(Debug, Deserialize)]
pub struct MessagesResponse {
    pub content: Vec<ContentBlock>,
    #[serde(default)]
    pub stop_reason: Option<String>,
    #[serde(default)]
    pub usage: Usage,
}

#[derive(Debug, Default, Deserialize)]
pub struct Usage {
    #[serde(default)]
    pub input_tokens: u64,
    #[serde(default)]
    pub output_tokens: u64,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ContentBlock {
    Text {
        text: String,
    },
    ToolUse {
        id: String,
        name: String,
        input: Value,
    },
    #[serde(other)]
    Unknown,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_tool_use_response() {
        let json = r#"{
            "content": [
                {"type": "text", "text": "thinking..."},
                {"type": "tool_use", "id": "tu_1", "name": "propose_edits",
                 "input": {"summary": "cut silence", "operations": []}}
            ],
            "stop_reason": "tool_use",
            "usage": {"input_tokens": 1200, "output_tokens": 80}
        }"#;
        let resp: MessagesResponse = serde_json::from_str(json).unwrap();
        assert_eq!(resp.content.len(), 2);
        assert!(
            matches!(&resp.content[1], ContentBlock::ToolUse { name, .. } if name == "propose_edits")
        );
        assert_eq!(resp.usage.input_tokens, 1200);
    }

    #[test]
    fn unknown_block_types_do_not_break_parsing() {
        let json = r#"{"content": [{"type": "server_tool_use", "whatever": 1}]}"#;
        let resp: MessagesResponse = serde_json::from_str(json).unwrap();
        assert!(matches!(resp.content[0], ContentBlock::Unknown));
    }
}
