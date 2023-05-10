use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::vec;
use tokio::sync::{broadcast, broadcast::Sender};
use tokio_stream::wrappers::BroadcastStream;

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum Color {
    Red,
    Pink,
    LightGray,
    DarkGray,
    BrightGreen,
    Orange,
    Brown,
    Yellow,
    DarkGreen,
    White,
    Black,
    LightBlue,
    Blue,
    DarkBlue,
    LightPurple,
    DarkPurple,
}

#[derive(Eq, PartialEq, Hash, Clone, Serialize, Deserialize)]
pub struct Coord {
    x: u32,
    y: u32,
}

#[derive(Eq, PartialEq, Clone, Serialize, Deserialize)]
pub struct Player {
    pub name: String,
}

#[derive(Eq, PartialEq, Clone, Serialize, Deserialize)]
pub struct Pixel {
    pub color: Color,
    pub player: Player,
}

#[derive(Eq, PartialEq, Clone, Serialize, Deserialize)]
pub struct Change {
    pub coord: Coord,
    pub pixel: Pixel,
}

#[derive(Eq, PartialEq, Clone, Serialize, Deserialize)]
pub struct Board {
    pub contents: HashMap<Coord, Pixel>,
    pub board_size: u32,
}

impl Default for Board {
    fn default() -> Self {
        Board {
            contents: HashMap::new(),
            board_size: 100,
        }
    }
}

pub struct BoardState {
    players: Vec<Player>,
    board: Board,
    change_stream: Sender<Change>,
}

impl Default for BoardState {
    fn default() -> BoardState {
        let (tx, _) = broadcast::channel(100);
        BoardState {
            players: vec![],
            board: Board::default(),
            change_stream: tx,
        }
    }
}

impl BoardState {
    pub fn add_player(&mut self, player: Player) -> () {
        self.players.push(player)
    }

    pub fn change_pixel(&mut self, change: Change) -> () {
        self.board
            .contents
            .insert(change.coord.clone(), change.pixel.clone());
        let _ = self.change_stream.send(change);
    }

    pub fn get_board(&self) -> Board {
        self.board.clone()
    }

    pub fn subscribe(&self) -> BroadcastStream<Change> {
        let rx = self.change_stream.subscribe();
        BroadcastStream::new(rx)
    }
}
