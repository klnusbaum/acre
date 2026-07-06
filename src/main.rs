mod plot;

use maud::{Markup, html};
use std::convert::Infallible;

use serde::Deserialize;

use axum::{
    Router,
    extract::Query,
    response::sse::{Event, KeepAlive, Sse},
    routing::get,
};

use tokio_stream::{Stream, StreamExt};
use tower_http::services::ServeDir;

#[derive(Deserialize)]
struct AcreCoords {
    x: u32,
    y: u32,
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/changes", get(changes))
        .route("/plot", get(plot))
        .route("/acres", get(acres))
        .fallback_service(ServeDir::new("content"));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
async fn changes() -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let stream = plot::change_streamer().map(Ok);
    Sse::new(stream).keep_alive(KeepAlive::default())
}

async fn plot() -> Markup {
    html! {
        form.plot-holder.max-holder hx-get="acres" hx-target="#app" hx-push-url="true" {
            acre-plot {
            }
        }
    }
}

async fn acres(Query(acre_coords): Query<AcreCoords>) -> Markup {
    html! {
        div.acre-editor{
            h1{
                "Editing Acre " (&acre_coords.x) "," (&acre_coords.y)
            }
            button hx-get="/plot" hx-target="#app" hx-push-url="true" { "return" }
        }
    }
}
