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
const PLOT_SIZE = 100

const PLOT = Array.from({ length: PLOT_SIZE * PLOT_SIZE }, (item, index) => random_color())

function random_color() {
    return COLORS[Math.floor(Math.random() * COLORS.length)]
}

function random_pos() {
    return Math.floor(Math.random() * PLOT_SIZE * PLOT_SIZE)
}

const intervalId = setInterval(changeBackground, 100);

function changeBackground() {
    PLOT[random_pos()] = random_color()

    const canvas = document.getElementById('plot');
    const ctx = canvas.getContext("2d");
    const imgData = ctx.createImageData(PLOT_SIZE, PLOT_SIZE);

    for (let i = 0; i < PLOT.length; i++) {
        const color = PLOT[i];
        const ipos = i * 4;
        imgData.data[ipos + 0] = color[0];
        imgData.data[ipos + 1] = color[1];
        imgData.data[ipos + 2] = color[2];
        imgData.data[ipos + 3] = 255;
    }

    // Create a temporary offscreen canvas to draw the image data onto
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = PLOT_SIZE;
    tempCanvas.height = PLOT_SIZE;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(imgData, 0, 0);

    const scaleFactor = 10;
    ctx.drawImage(tempCanvas, 0, 0, PLOT_SIZE * scaleFactor, PLOT_SIZE * scaleFactor);
}
