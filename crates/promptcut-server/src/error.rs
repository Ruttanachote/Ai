use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;

use promptcut_ai::AiError;
use promptcut_core::CoreError;

/// API error with a stable JSON body: `{"error": "..."}`.
pub struct ApiError {
    pub status: StatusCode,
    pub message: String,
}

impl ApiError {
    pub fn not_found(what: impl Into<String>) -> Self {
        Self {
            status: StatusCode::NOT_FOUND,
            message: what.into(),
        }
    }

    pub fn unavailable(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::SERVICE_UNAVAILABLE,
            message: message.into(),
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.status, Json(json!({ "error": self.message }))).into_response()
    }
}

impl From<CoreError> for ApiError {
    fn from(e: CoreError) -> Self {
        // Domain validation failures are the client's (or the agent's) fault.
        Self {
            status: StatusCode::UNPROCESSABLE_ENTITY,
            message: e.to_string(),
        }
    }
}

impl From<AiError> for ApiError {
    fn from(e: AiError) -> Self {
        let status = match &e {
            AiError::Api { status, .. } if *status == 429 => StatusCode::TOO_MANY_REQUESTS,
            AiError::NoToolCall | AiError::BadToolInput(_) => StatusCode::BAD_GATEWAY,
            _ => StatusCode::BAD_GATEWAY,
        };
        Self {
            status,
            message: e.to_string(),
        }
    }
}
