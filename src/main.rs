mod plot;

use maud::{DOCTYPE, Markup, html};
use std::convert::Infallible;

use serde::Deserialize;

use axum::{
    Router,
    extract::Query,
    http::HeaderMap,
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
        .route("/", get(plot))
        .route("/acres", get(acres))
        .fallback_service(ServeDir::new("content"));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
async fn changes() -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let stream = plot::change_streamer().map(Ok);
    Sse::new(stream).keep_alive(KeepAlive::default())
}

async fn plot(headers: HeaderMap) -> Markup {
    if headers.is_htmx_request() {
        max_plot()
    } else {
        load_max_plot()
    }
}

fn max_plot() -> Markup {
    html! {
        form.plot-holder.max-holder hx-get="acres" hx-target="#app" hx-push-url="true" {
            acre-plot {}
        }
    }
}

fn load_max_plot() -> Markup {
    full_app(html! {
        h1 hx-get="/" hx-target="#app" hx-trigger="acre-plot-update from:document"{
            "Loading..."
        }
    })
}

async fn acres(headers: HeaderMap, Query(acre_coords): Query<AcreCoords>) -> Markup {
    let editor = html! {
        div.acre-editor{
            h1{
                "Editing Acre " (&acre_coords.x) "," (&acre_coords.y)
            }
            button hx-get="/" hx-target="#app" hx-push-url="true" { "return" }
        }
    };

    if headers.is_htmx_request() {
        editor
    } else {
        full_app(editor)
    }
}

fn full_app(app_content: Markup) -> Markup {
    html! {
        (DOCTYPE)
        html {
            head {
                meta charset="utf8"{}
                meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"{}
                link rel="stylesheet" href="/static/css/style.css" {}
                script type="module" src="/static/js/acre_plot.js"{}
                script type="module" src="/static/js/htmx.min.js" {}
                title { "Acre" }
            }
            body {
                header {}
                main id="app" {
                    (app_content)
                }
                footer {}
                script type="module" src="/static/js/scene.js" {}
                script type="module" src="/static/js/test_update.js" {}
            }
        }
    }
}

trait HTMXHeaderExt {
    fn is_htmx_request(&self) -> bool;
}

impl HTMXHeaderExt for HeaderMap {
    fn is_htmx_request(&self) -> bool {
        self.contains_key("HX-Request")
    }
}
