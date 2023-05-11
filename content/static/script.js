"use strict";

const CANVAS_SIZE_PX = 1000;
const SCENE_SIZE_AC = 100;
const ACRE_SIZE_PX = 10;

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

function drawSquare(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * ACRE_SIZE_PX, y * ACRE_SIZE_PX, x + ACRE_SIZE_PX, y + ACRE_SIZE_PX);
}

function drawBoard(ctx) {
    for (let x = 0; x < SCENE_SIZE_AC; x++) {
        for (let y = 0; y < SCENE_SIZE_AC; y++) {
            drawSquare(ctx, x, y, randomColor());
        }
    }
}

var board = document.getElementById("mainboard");
board.setAttribute("width", CANVAS_SIZE_PX);
board.setAttribute("height", CANVAS_SIZE_PX);
var ctx = board.getContext("2d");
drawBoard(ctx)


