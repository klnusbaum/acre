"use strict";

function drawSquare(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x,y,x+size,y+size);
}

var board = document.getElementById("mainboard");
var ctx = board.getContext("2d");
drawSquare(ctx, 0,0,10,"red");


