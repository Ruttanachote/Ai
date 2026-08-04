mod config;
mod error;
mod routes;
mod state;

use std::sync::Arc;

use promptcut_ai::{AnthropicClient, ClaudeEditAgent, EditAgent};

use crate::config::Config;
use crate::state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let _ = dotenvy::dotenv();
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();

    let config = Config::from_env();

    let agent: Option<Arc<dyn EditAgent>> = match &config.anthropic_api_key {
        Some(key) => {
            tracing::info!(model = %config.model, "AI agent enabled");
            Some(Arc::new(ClaudeEditAgent::new(AnthropicClient::new(
                key.clone(),
                config.model.clone(),
            ))))
        }
        None => {
            tracing::warn!("ANTHROPIC_API_KEY not set — chat editing disabled");
            None
        }
    };

    let app = routes::router(AppState::new(agent, config.model.clone()));
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
        routes::router(AppState::new(agent, "test-model".into()))
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
