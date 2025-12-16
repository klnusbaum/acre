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

class Scene {
    #plot;
    #ctx;
    #scale;
    #bitmap;
    #xoffset;
    #yoffset;

    constructor(canvas) {
        this.#ctx = canvas.getContext("2d");
        this.#ctx.imageSmoothingEnabled = false;
        this.#plot = Array.from({ length: PLOT_SIZE * PLOT_SIZE }, random_color);
        this.#scale = MIN_SCALE;
        this.#bitmap = null;
        this.#xoffset = 0;
        this.#yoffset = 0;
    }

    async render() {
        const imgData = this.#ctx.createImageData(PLOT_SIZE, PLOT_SIZE);

        for (let i = 0; i < PLOT_SIZE * PLOT_SIZE; i++) {
            const color = COLORS[this.#plot[i]]
            const ipos = i * 4;
            imgData.data[ipos + 0] = color[0];
            imgData.data[ipos + 1] = color[1];
            imgData.data[ipos + 2] = color[2];
            imgData.data[ipos + 3] = 255;
        }

        this.#bitmap = await createImageBitmap(imgData)
    }

    async set_acre(pos, color) {
        this.#plot[pos] = color;
        await this.render();
    }

    async change_scale(sign) {
        this.#scale = clamp(MIN_SCALE, MAX_SCALE, this.#scale + sign * ZOOM_STEP);
    }

    async pan(dx, dy) {
        const min_offset = CANVAS_SIZE - this.#scale * PLOT_SIZE
        this.#xoffset = clamp(min_offset, 0, this.#xoffset + dx);
        this.#yoffset = clamp(min_offset, 0, this.#yoffset + dy);
    }

    pixel_clicked(canvasX, canvasY) {
        const plotX = canvasX / this.#scale
        const plotY = canvasY / this.#scale
        document.dispatchEvent("acreclicked", {
            detail: {
                x: Math.floor(plotX),
                y: Math.floor(plotY),
            }
        })
    }


    draw() {
        if (this.#bitmap == null) {
            this.#draw_loading();
        } else {
            this.#draw_plot();
        }
        requestAnimationFrame(() => this.draw());
    }

    #draw_loading() {
        this.#ctx.font = "28px sans-serif";
        this.#ctx.fillText("Loading...", 0, 28);
    }

    #draw_plot() {
        this.#ctx.drawImage(
            this.#bitmap,
            this.#xoffset,
            this.#yoffset,
            PLOT_SIZE * this.#scale,
            PLOT_SIZE * this.#scale);
    }
}

class Interactor {
    #isDown
    #prevLeft
    #prevTop
    #onMove
    #onClick
    #onWheel
    #isDragging

    constructor(toWatch, onMove, onClick, onWheel) {
        this.#isDown = false
        this.#isDragging = false
        this.#onMove = onMove;
        this.#onClick = onClick;
        this.#onWheel = onWheel;
        toWatch.addEventListener('mousedown', (e) => {
            e.preventDefault();
            console.log("in mouse down");
            this.#isDown = true
            this.#prevLeft = e.pageX;
            this.#prevTop = e.pageY;
        });
        toWatch.addEventListener('mousemove', (e) => {
            e.preventDefault();
            if (!this.#isDown) {
                return
            }

            console.log("in mouse move");
            const dx = e.pageX - this.#prevLeft;
            const dy = e.pageY - this.#prevTop;
            this.#prevLeft = e.pageX;
            this.#prevTop = e.pageY;
            this.#onMove(dx, dy);
            this.#isDragging = true;
        });
        toWatch.addEventListener('mouseup', (e) => {
            e.preventDefault();
            console.log("in mouse up");
            if (this.#isDown && !this.#isDragging) {
                this.#onClick(e.offsetX, e.offsetY)
            }
            this.#isDown = false;
            this.#isDragging = false;
        })
        toWatch.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.#onWheel(Math.sign(e.deltaY));
        })
    }
}


const canvas = document.getElementById('plot');
const scene = new Scene(canvas);
const interactor = new Interactor(
    canvas,
    (dx, dy) => scene.pan(dx, dy),
    (x, y) => scene.pixel_clicked(x, y),
    (sign) => scene.change_scale(sign)
);


scene.draw();
setInterval(() => scene.set_acre(random_pos(), random_color()), UPDATE_RATE_MS);
