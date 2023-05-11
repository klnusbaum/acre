"use strict";

const CANVAS_SIZE = 1000;
const PIXEL_SIZE = 10;
const COLORS = [
    "white",
    "silver",
    "gray",
    "black",
    "red",
    "maroon",
    "yellow",
    "olive",
    "lime",
    "green",
    "aqua",
    "teal",
    "blue",
    "navy",
    "fuchsia",
    "purple",
];

function randomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function drawSquare(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, x + size, y + size);
}

function drawBoard(ctx) {
    for (let x = 0; x < CANVAS_SIZE / PIXEL_SIZE; x++) {
        for (let y = 0; y < CANVAS_SIZE / PIXEL_SIZE; y++) {
            drawSquare(ctx, x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, randomColor());
        }
    }
}

var board = document.getElementById("mainboard");
var ctx = board.getContext("2d");
drawBoard(ctx)


