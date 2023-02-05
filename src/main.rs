use std::convert::Infallible;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use axum::extract::State;
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::response::Html;
use axum::routing::get;
use axum::Router;
use futures::stream::{self, Stream};
use tokio_stream::StreamExt;

struct AppState {
    counter: Mutex<Counter>,
}

struct Counter {
    count: u32,
}

impl Default for Counter {
    fn default() -> Counter {
        Counter { count: 0 }
    }
}

impl Counter {
    fn next(&mut self) -> u32 {
        let result = self.count;
        self.count += 1;
        return result;
    }
}

async fn count(
    State(state): State<Arc<AppState>>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let stream = stream::repeat_with(move || {
        let next_num = state.counter.lock().unwrap().next();
        Event::default().data(format!("{}", next_num))
    })
    .map(Ok)
    .throttle(Duration::from_secs(1));

    Sse::new(stream).keep_alive(KeepAlive::default())
}

async fn repeater() -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let stream = stream::repeat_with(|| Event::default().data("hi!"))
        .map(Ok)
        .throttle(Duration::from_secs(1));

    Sse::new(stream).keep_alive(KeepAlive::default())
}

async fn index() -> Html<&'static str> {
    Html(include_str!("index.html"))
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        counter: Mutex::new(Counter::default()),
    });

    let app = Router::new()
        .route("/", get(index))
        .route("/count", get(count))
        .route("/repeat", get(repeater))
        .with_state(state);

    axum::Server::bind(&"0.0.0.0:8080".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}
