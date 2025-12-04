mod plot;

use std::convert::Infallible;

use axum::{
    Router,
    response::sse::{Event, KeepAlive, Sse},
    routing::get,
};

use tokio_stream::{Stream, StreamExt};
use tower_http::services::ServeDir;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/changes", get(changes))
        .fallback_service(ServeDir::new("content"));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
async fn changes() -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let stream = plot::change_streamer().map(Ok);
    Sse::new(stream).keep_alive(KeepAlive::default())
}
