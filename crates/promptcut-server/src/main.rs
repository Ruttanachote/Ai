mod config;
mod error;
mod routes;
mod state;

use std::sync::Arc;

use promptcut_ai::{AnthropicClient, ClaudeCliAgent, ClaudeEditAgent, EditAgent};

use crate::config::{AgentMode, Config};
use crate::state::AppState;

/// Resolve the AI backend from config: explicit mode wins; `auto` prefers the
/// API key and falls back to a locally installed Claude Code CLI.
async fn select_agent(config: &Config) -> (Option<Arc<dyn EditAgent>>, &'static str) {
    let api_agent = |key: &str| -> Arc<dyn EditAgent> {
        Arc::new(ClaudeEditAgent::new(AnthropicClient::new(
            key.to_string(),
            config.model.clone(),
        )))
    };
    let cli_agent = || -> Arc<dyn EditAgent> {
        Arc::new(ClaudeCliAgent {
            binary: config.claude_cli_bin.clone(),
            ..ClaudeCliAgent::default()
        })
    };

    match config.agent_mode {
        AgentMode::Api => match &config.anthropic_api_key {
            Some(key) => (Some(api_agent(key)), "api"),
            None => {
                tracing::warn!("PROMPTCUT_AGENT=api but ANTHROPIC_API_KEY not set — chat disabled");
                (None, "disabled")
            }
        },
        AgentMode::ClaudeCli => {
            if ClaudeCliAgent::is_available(&config.claude_cli_bin).await {
                (Some(cli_agent()), "claude-cli")
            } else {
                tracing::warn!(bin = %config.claude_cli_bin, "claude CLI not found — chat disabled");
                (None, "disabled")
            }
        }
        AgentMode::Auto => {
            if let Some(key) = &config.anthropic_api_key {
                (Some(api_agent(key)), "api")
            } else if ClaudeCliAgent::is_available(&config.claude_cli_bin).await {
                (Some(cli_agent()), "claude-cli")
            } else {
                tracing::warn!(
                    "no ANTHROPIC_API_KEY and no claude CLI found — chat editing disabled"
                );
                (None, "disabled")
            }
        }
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let _ = dotenvy::dotenv();
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();

    let config = Config::from_env();

    let (agent, agent_mode) = select_agent(&config).await;
    match agent_mode {
        "api" => tracing::info!(model = %config.model, "AI agent enabled via Anthropic API"),
        "claude-cli" => {
            tracing::info!(bin = %config.claude_cli_bin, "AI agent enabled via Claude Code CLI")
        }
        _ => {}
    }

    let app = routes::router(AppState::new(agent, config.model.clone(), agent_mode));
    let listener = tokio::net::TcpListener::bind(&config.bind).await?;
    tracing::info!("promptcut-server listening on {}", config.bind);
    axum::serve(listener, app)
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
            tracing::info!("shutting down");
        })
        .await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use http_body_util::BodyExt;
    use promptcut_ai::{EditProposal, MockEditAgent};
    use tower::ServiceExt;

    fn test_app(agent: Option<Arc<dyn EditAgent>>) -> axum::Router {
        let mode = if agent.is_some() { "api" } else { "disabled" };
        routes::router(AppState::new(agent, "test-model".into(), mode))
    }

    #[tokio::test]
    async fn health_reports_agent_status() {
        let resp = test_app(None)
            .oneshot(Request::get("/api/health").body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["agent_enabled"], false);
    }

    #[tokio::test]
    async fn full_flow_create_add_chat_apply_undo() {
        let agent = MockEditAgent {
            proposal: EditProposal {
                summary: "ตัด 2 วินาทีแรกออก".into(),
                operations: vec![promptcut_core::EditOperation::RemoveRanges {
                    ranges: vec![promptcut_core::TimeRange::new(0, 2_000).unwrap()],
                }],
                input_tokens: 0,
                output_tokens: 0,
            },
        };
        let app = test_app(Some(Arc::new(agent)));

        // create project
        let resp = app
            .clone()
            .oneshot(
                Request::post("/api/projects")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"name":"demo"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::CREATED);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let project: serde_json::Value = serde_json::from_slice(&body).unwrap();
        let id = project["id"].as_str().unwrap().to_string();

        // add asset
        let resp = app
            .clone()
            .oneshot(
                Request::post(format!("/api/projects/{id}/assets"))
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"filename":"a.mp4","duration_ms":10000}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        // chat returns the mock proposal
        let resp = app
            .clone()
            .oneshot(
                Request::post(format!("/api/projects/{id}/chat"))
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"message":"ตัดต้นคลิปออกหน่อย"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let proposal: serde_json::Value = serde_json::from_slice(&body).unwrap();

        // apply the proposed operations
        let apply_body = serde_json::json!({
            "description": proposal["summary"],
            "operations": proposal["operations"],
        });
        let resp = app
            .clone()
            .oneshot(
                Request::post(format!("/api/projects/{id}/apply"))
                    .header("content-type", "application/json")
                    .body(Body::from(apply_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let summary: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(summary["duration_ms"], 8_000);

        // undo restores the original duration
        let resp = app
            .clone()
            .oneshot(
                Request::post(format!("/api/projects/{id}/undo"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let summary: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(summary["duration_ms"], 10_000);
    }

    #[tokio::test]
    async fn chat_without_api_key_returns_503() {
        let app = test_app(None);
        let resp = app
            .clone()
            .oneshot(
                Request::post("/api/projects")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"name":"x"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let project: serde_json::Value = serde_json::from_slice(&body).unwrap();
        let id = project["id"].as_str().unwrap();

        let resp = app
            .oneshot(
                Request::post(format!("/api/projects/{id}/chat"))
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"message":"hi"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    }
}
