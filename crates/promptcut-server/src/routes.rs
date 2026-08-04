use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;

use promptcut_ai::{EditProposal, ProposalRequest};
use promptcut_core::{EditOperation, Project, Transcript};

use crate::error::ApiError;
use crate::state::AppState;

/// Max transcript characters sent to the agent per command (cost guardrail).
const MAX_TRANSCRIPT_PROMPT_CHARS: usize = 60_000;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/api/health", get(health))
        .route("/api/projects", get(list_projects).post(create_project))
        .route("/api/projects/{id}", get(get_project))
        .route("/api/projects/{id}/assets", post(add_asset))
        .route("/api/projects/{id}/chat", post(chat))
        .route("/api/projects/{id}/apply", post(apply_edits))
        .route("/api/projects/{id}/undo", post(undo))
        .with_state(state)
}

async fn health(State(state): State<AppState>) -> Json<serde_json::Value> {
    Json(json!({
        "status": "ok",
        "agent_enabled": state.agent.is_some(),
        "model": state.model_name,
    }))
}

#[derive(Deserialize)]
struct CreateProject {
    name: String,
}

#[derive(Serialize)]
struct ProjectSummary {
    id: Uuid,
    name: String,
    duration_ms: u64,
    assets: usize,
    history_len: usize,
}

impl From<&Project> for ProjectSummary {
    fn from(p: &Project) -> Self {
        Self {
            id: p.id,
            name: p.name.clone(),
            duration_ms: p.timeline.duration_ms(),
            assets: p.assets.len(),
            history_len: p.history.len(),
        }
    }
}

async fn create_project(
    State(state): State<AppState>,
    Json(body): Json<CreateProject>,
) -> (StatusCode, Json<ProjectSummary>) {
    let project = Project::new(body.name);
    let summary = ProjectSummary::from(&project);
    state.projects.write().await.insert(project.id, project);
    (StatusCode::CREATED, Json(summary))
}

async fn list_projects(State(state): State<AppState>) -> Json<Vec<ProjectSummary>> {
    let projects = state.projects.read().await;
    Json(projects.values().map(ProjectSummary::from).collect())
}

async fn get_project(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Project>, ApiError> {
    let projects = state.projects.read().await;
    let project = projects
        .get(&id)
        .ok_or_else(|| ApiError::not_found(format!("project {id} not found")))?;
    Ok(Json(project.clone()))
}

/// MVP: assets are registered with metadata (and optional transcript) as JSON.
/// Real multipart upload + transcription workers come later; the domain flow
/// downstream of this point is already final.
#[derive(Deserialize)]
struct AddAsset {
    filename: String,
    duration_ms: u64,
    #[serde(default)]
    transcript: Option<Transcript>,
}

async fn add_asset(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<AddAsset>,
) -> Result<Json<ProjectSummary>, ApiError> {
    let mut projects = state.projects.write().await;
    let project = projects
        .get_mut(&id)
        .ok_or_else(|| ApiError::not_found(format!("project {id} not found")))?;
    let asset_id = project.add_asset(body.filename, body.duration_ms);
    if let Some(t) = body.transcript {
        project.set_transcript(asset_id, t)?;
    }
    Ok(Json(ProjectSummary::from(&*project)))
}

#[derive(Deserialize)]
struct ChatBody {
    message: String,
}

/// Chat-to-edit: returns a *proposal*; nothing touches the timeline until
/// the client POSTs the operations back via /apply.
async fn chat(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<ChatBody>,
) -> Result<Json<EditProposal>, ApiError> {
    let agent = state.agent.clone().ok_or_else(|| {
        ApiError::unavailable("AI agent is disabled: set ANTHROPIC_API_KEY to enable chat editing")
    })?;

    let request = {
        let projects = state.projects.read().await;
        let project = projects
            .get(&id)
            .ok_or_else(|| ApiError::not_found(format!("project {id} not found")))?;
        let transcript_excerpt = project
            .assets
            .iter()
            .filter_map(|a| a.transcript.as_ref())
            .map(|t| t.to_prompt_text(MAX_TRANSCRIPT_PROMPT_CHARS))
            .collect::<Vec<_>>()
            .join("\n");
        ProposalRequest {
            instruction: body.message,
            timeline_duration_ms: project.timeline.duration_ms(),
            transcript_excerpt,
        }
    }; // read lock released before the (slow) network call

    let proposal = agent.propose(&request).await?;
    Ok(Json(proposal))
}

#[derive(Deserialize)]
struct ApplyBody {
    description: String,
    operations: Vec<EditOperation>,
}

async fn apply_edits(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<ApplyBody>,
) -> Result<Json<ProjectSummary>, ApiError> {
    let mut projects = state.projects.write().await;
    let project = projects
        .get_mut(&id)
        .ok_or_else(|| ApiError::not_found(format!("project {id} not found")))?;
    project.apply_edits(body.description, body.operations)?;
    Ok(Json(ProjectSummary::from(&*project)))
}

async fn undo(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ProjectSummary>, ApiError> {
    let mut projects = state.projects.write().await;
    let project = projects
        .get_mut(&id)
        .ok_or_else(|| ApiError::not_found(format!("project {id} not found")))?;
    project.undo()?;
    Ok(Json(ProjectSummary::from(&*project)))
}
