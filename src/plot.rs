use anyhow::Result;
use axum::response::sse::Event;
use futures_util::stream;
use maud::{Markup, html};
use serde_repr::*;
use tokio::time::{Duration, Instant, interval};
use tokio_stream::wrappers::IntervalStream;
use tokio_stream::{Stream, StreamExt};

const PLOT_SIZE: usize = 1000;
const UPDATE_MILLIS: u64 = 5000;

#[derive(Serialize_repr, Deserialize_repr, PartialEq, Debug, Copy, Clone)]
#[repr(u8)]
pub enum Color {
    White = 0,
    Silver = 1,
    Gray = 2,
    Black = 3,
    Red = 4,
    Maroon = 5,
    Yellow = 6,
    Olive = 7,
    Lime = 8,
    Green = 9,
    Aqua = 10,
    Teal = 11,
    Blue = 12,
    Navy = 13,
    Fuchsia = 14,
    Purple = 15,
}

impl Color {
    fn css_class(&self) -> &'static str {
        match self {
            Self::White => "acre_white",
            Self::Silver => "acre_silver",
            Self::Gray => "acre_gray",
            Self::Black => "acre_black",
            Self::Red => "acre_red",
            Self::Maroon => "acre_maroon",
            Self::Yellow => "acre_yellow",
            Self::Olive => "acre_olive",
            Self::Lime => "acre_lime",
            Self::Green => "acre_green",
            Self::Aqua => "acre_aqua",
            Self::Teal => "acre_teal",
            Self::Blue => "acre_blue",
            Self::Navy => "acre_navy",
            Self::Fuchsia => "acre_fuchsia",
            Self::Purple => "acre_purple",
        }
    }

    fn random() -> Color {
        match rand::random_range(0..16) {
            0 => Self::White,
            1 => Self::Silver,
            2 => Self::Gray,
            3 => Self::Black,
            4 => Self::Red,
            5 => Self::Maroon,
            6 => Self::Yellow,
            7 => Self::Olive,
            8 => Self::Lime,
            9 => Self::Green,
            10 => Self::Aqua,
            11 => Self::Teal,
            12 => Self::Blue,
            13 => Self::Navy,
            14 => Self::Fuchsia,
            _ => Self::Purple,
        }
    }
}

pub fn starter_plot() -> Result<Vec<Vec<Color>>> {
    let mut plot = Vec::with_capacity(PLOT_SIZE);
    for _ in 0..PLOT_SIZE {
        let mut row = Vec::with_capacity(PLOT_SIZE);
        for _ in 0..PLOT_SIZE {
            row.push(Color::random());
        }
        plot.push(row);
    }
    Ok(plot)
}

pub fn render_viewer(plot: &Vec<Vec<Color>>) -> Markup {
    html! {
        div.plot_viewer {
            (render_plot(plot))
        }
    }
}

fn render_plot(plot: &Vec<Vec<Color>>) -> Markup {
    html! {
        table .plot #plot hx-get="/changes" hx-trigger="load" {
            @for (i, row) in plot.iter().enumerate() {
                tr {
                    @for (j, acre) in row.iter().enumerate() {
                        (acre_td(acre, i, j))
                    }
                }
            }
        }
    }
}

fn acre_td(color: &Color, row: usize, col: usize) -> Markup {
    html! {
        td.(color.css_class()).acre #(acre_id(row,col)) {}
    }
}

fn acre_id(row: usize, col: usize) -> String {
    format!("acre_{}_{}", row, col)
}

pub fn change_streamer() -> impl Stream<Item = Event> {
    let initial = stream::once(initial_plot());
    let updates =
        IntervalStream::new(interval(Duration::from_millis(UPDATE_MILLIS))).map(random_acre);
    initial.chain(updates)
}

fn random_acre(_: Instant) -> Event {
    let pos = rand::random_range(0..PLOT_SIZE * PLOT_SIZE);
    let color = rand::random_range(0..16);
    let acre = vec![vec![pos, color]];
    Event::default()
        .event("acres")
        .json_data(acre)
        .unwrap_or(err_event())
}

async fn initial_plot() -> Event {
    let mut plot = Vec::with_capacity(PLOT_SIZE * PLOT_SIZE);
    for (i, acre) in plot.iter_mut().enumerate() {
        *acre = vec![i, rand::random_range(0..16)];
    }

    Event::default()
        .event("acres")
        .json_data(plot)
        .unwrap_or(err_event())
}

fn err_event() -> Event {
    Event::default().event("acre-error")
}
