use std::collections::HashMap;
use std::sync::Arc;

use tokio::sync::RwLock;
use uuid::Uuid;

use promptcut_ai::EditAgent;
use promptcut_core::Project;

/// MVP store: in-memory, swapped for Postgres behind the same handler code
/// when persistence lands (see docs/04-architecture.md).
#[derive(Clone)]
pub struct AppState {
    pub projects: Arc<RwLock<HashMap<Uuid, Project>>>,
    pub agent: Option<Arc<dyn EditAgent>>,
    pub model_name: String,
}

impl AppState {
    pub fn new(agent: Option<Arc<dyn EditAgent>>, model_name: String) -> Self {
        Self {
            projects: Arc::new(RwLock::new(HashMap::new())),
            agent,
            model_name,
        }
    }
}
