"use strict";

const CANVAS_SIZE = 1000
const PIXEL_SIZE = 10

function randomColor() {
    switch (Math.floor(Math.random() * 16.0)) {
        case 0:
            return "white";
        case 1:
            return "silver";
        case 2:
            return "gray";
        case 3:
            return "black";
        case 4:
            return "red";
        case 5:
            return "maroon";
        case 6:
            return "yellow";
        case 7:
            return "olive";
        case 8:
            return "lime";
        case 9:
            return "green";
        case 10:
            return "aqua";
        case 11:
            return "teal";
        case 12:
            return "blue";
        case 13:
            return "navy";
        case 14:
            return "fuchsia";
        case 15:
            return "purple";
    }
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


