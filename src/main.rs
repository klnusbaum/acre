mod plot;

use std::convert::Infallible;

use axum::{
    Router,
    http::StatusCode,
    response::sse::{Event, KeepAlive, Sse},
    routing::get,
};

use maud::{DOCTYPE, Markup, html};
use plot::render_viewer;
use tokio_stream::{Stream, StreamExt};
use tower_http::{compression::CompressionLayer, services::ServeDir};

use crate::plot::starter_plot;

#[tokio::main]
async fn main() {
    let compression = CompressionLayer::new()
        .br(true)
        .deflate(true)
        .gzip(true)
        .zstd(true);
    let app = Router::new()
        .fallback_service(ServeDir::new("static"))
        .route("/", get(index))
        .route("/changes", get(changes))
        .layer(compression);
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn index() -> Result<Markup, (StatusCode, String)> {
    let plot = starter_plot().map_err(server_error)?;
    Ok(html! {
        (DOCTYPE)
        html {
            head {
                link rel="stylesheet" type="text/css" href="/css/style.css";
                script src="/js/htmx.min.js" {}
                script src="/js/zoom.js" {}
                title { "Acre" }
            }
            body {
                (render_viewer(&plot))
            }
        }
    })
}

fn server_error(e: anyhow::Error) -> (StatusCode, String) {
    (StatusCode::INTERNAL_SERVER_ERROR, format!("woops {}", e))
}

async fn changes() -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let stream = plot::change_streamer().map(Ok);
    Sse::new(stream).keep_alive(KeepAlive::default())
}
