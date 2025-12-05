'use strict';

const COLORS = [
    [255, 255, 255],
    [228, 228, 228],
    [136, 136, 136],
    [34, 34, 34],
    [229, 0, 0],
    [255, 167, 209],
    [229, 149, 0],
    [160, 106, 66],
    [229, 217, 0],
    [148, 224, 68],
    [2, 190, 1],
    [0, 211, 221],
    [0, 131, 199],
    [0, 0, 234],
    [207, 110, 228],
    [130, 0, 128]
]
const PLOT_SIZE = 1000;
const UPDATE_RATE_MS = 1000;
const CANVAS_SIZE = 800;
const ACRE_SIZE = 10;

function random_color() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function random_pos() {
    return Math.floor(Math.random() * PLOT_SIZE);
}

const plot = Array.from({ length: PLOT_SIZE }, () => Array.from({ length: PLOT_SIZE }, random_color));
const canvas = document.getElementById('plot');
const ctx = canvas.getContext("2d");
const scale = CANVAS_SIZE / (PLOT_SIZE * ACRE_SIZE);
ctx.scale(scale, scale);
draw_plot();

setInterval(function() {
    const x = random_pos()
    const y = random_pos()
    const color = random_color()
    plot[x][y] = color;
    ctx.fillStyle = `rgb(${color[0]} ${color[1]} ${color[2]}`;
    ctx.fillRect(x * ACRE_SIZE, y * ACRE_SIZE, ACRE_SIZE, ACRE_SIZE);
}, UPDATE_RATE_MS);

function draw_plot() {
    for (let i = 0; i < PLOT_SIZE; i++) {
        for (let j = 0; j < PLOT_SIZE; j++) {
            const color = plot[i][j];
            ctx.fillStyle = `rgb(${color[0]} ${color[1]} ${color[2]}`;
            ctx.fillRect(i * 10, j * 10, 10, 10);
        }
    }
}
