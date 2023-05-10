use std::sync::Arc;

use parking_lot::FairMutex;

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::response::{Html, Json};
use axum::routing::{get, post};
use axum::Router;
use axum::{headers::ContentType, TypedHeader};
use futures::stream::{Stream, StreamExt};
use std::fmt::{self, Display};

mod boardstate;
use boardstate::{Board, BoardState, Change, Player};

#[derive(Debug)]
enum BoardChangeError {
    SerializeJson,
    Lagging,
}

impl Display for BoardChangeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::SerializeJson => write!(f, "serializtion error"),
            Self::Lagging => write!(f, "fell behind in updates"),
        }
    }
}

impl std::error::Error for BoardChangeError {}

struct AppState {
    board_state: FairMutex<BoardState>,
}

fn change_json(change: &Change) -> Result<Event, BoardChangeError> {
    match serde_json::to_string(change) {
        Ok(json) => Ok(Event::default().data(json)),
        Err(_) => Err(BoardChangeError::SerializeJson),
    }
}

async fn board_updates(
    State(state): State<Arc<AppState>>,
) -> Sse<impl Stream<Item = Result<Event, BoardChangeError>>> {
    let broadcast_stream = state
        .board_state
        .lock()
        .subscribe()
        .map(|change| match change {
            Ok(c) => change_json(&c),
            Err(_) => Err(BoardChangeError::Lagging),
        });
    Sse::new(broadcast_stream).keep_alive(KeepAlive::default())
}

async fn board(State(state): State<Arc<AppState>>) -> Json<Board> {
    Json(state.board_state.lock().get_board())
}

async fn change(State(state): State<Arc<AppState>>, Json(change): Json<Change>) -> StatusCode {
    state.board_state.lock().change_pixel(change);
    StatusCode::CREATED
}

async fn new_player(State(state): State<Arc<AppState>>, Json(player): Json<Player>) -> StatusCode {
    state.board_state.lock().add_player(player);
    StatusCode::CREATED
}

async fn index() -> Html<&'static str> {
    Html(include_str!("index.html"))
}

async fn script() -> (StatusCode, TypedHeader<ContentType>, &'static str) {
    (
        StatusCode::OK,
        TypedHeader(ContentType::from(mime::TEXT_JAVASCRIPT)),
        include_str!("script.js"),
    )
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        board_state: FairMutex::new(BoardState::default()),
    });

    let app = Router::new()
        .route("/", get(index))
        .route("/board_updates", get(board_updates))
        .route("/board", get(board))
        .route("/change", post(change))
        .route("/new_player", post(new_player))
        .route("/script.js", get(script))
        .with_state(state);

    axum::Server::bind(&"0.0.0.0:8080".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}
