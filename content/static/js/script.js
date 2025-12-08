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
const ZOOM_STEP = 0.1;
const PLOT_SIZE = 100;
const UPDATE_RATE_MS = 100;
const CANVAS_SIZE = 800;
const MIN_SCALE = CANVAS_SIZE / PLOT_SIZE;
const MAX_SCALE = 20

const clamp = (min, max, val) => Math.min(max, Math.max(min, val));

const random_color = () => Math.floor(Math.random() * COLORS.length);

const random_pos = () => Math.floor(Math.random() * PLOT_SIZE * PLOT_SIZE);

const plot = Array.from({ length: PLOT_SIZE * PLOT_SIZE }, random_color);
const canvas = document.getElementById('plot');
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

let scale = MIN_SCALE;
let bitmap = null;

async function render() {
    const imgData = ctx.createImageData(PLOT_SIZE, PLOT_SIZE);

    for (let i = 0; i < PLOT_SIZE * PLOT_SIZE; i++) {
        const color = COLORS[plot[i]]
        const ipos = i * 4;
        imgData.data[ipos + 0] = color[0];
        imgData.data[ipos + 1] = color[1];
        imgData.data[ipos + 2] = color[2];
        imgData.data[ipos + 3] = 255;
    }

    bitmap = await createImageBitmap(imgData)
}

function draw_plot() {
    ctx.drawImage(bitmap, 0, 0, PLOT_SIZE * scale, PLOT_SIZE * scale);
    requestAnimationFrame(draw_plot);
}

function start() {
    draw_plot()
    setInterval(async function() {
        plot[random_pos()] = random_color();
        await render();
    }, UPDATE_RATE_MS);
}

canvas.addEventListener('wheel', function(event) {
    event.preventDefault();
    scale = clamp(MIN_SCALE, MAX_SCALE, scale + Math.sign(event.deltaY) * ZOOM_STEP);
});

render().then(start);
