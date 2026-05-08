//! Axum entry point.
//!
//! Run locally:  cargo run
//! Run release:  cargo run --release
//! Run in Docker: container CMD invokes the compiled binary directly.

use std::net::SocketAddr;

use axum::{routing::get, Json, Router};
use serde::Serialize;
use tower_http::trace::TraceLayer;

#[derive(Serialize)]
struct Health {
    status: &'static str,
}

#[derive(Serialize)]
struct Hello {
    hello: &'static str,
}

async fn healthz() -> Json<Health> {
    Json(Health { status: "ok" })
}

async fn root() -> Json<Hello> {
    Json(Hello { hello: "world" })
}

#[tokio::main]
async fn main() {
    // RUST_LOG=info,app=debug is a sensible default; honor whatever
    // the operator sets, fall back to "info" if unset.
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();

    let app = Router::new()
        .route("/healthz", get(healthz))
        .route("/", get(root))
        .layer(TraceLayer::new_for_http());

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(8080);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    tracing::info!("listening on {}", addr);
    axum::serve(listener, app).await.unwrap();
}
