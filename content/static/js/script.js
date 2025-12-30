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
    #plot
    #ctx;

    constructor() {
        this.#ctx = new OffscreenCanvas(PLOT_SIZE, PLOT_SIZE).getContext("2d");
        this.#plot = Array.from({ length: PLOT_SIZE * PLOT_SIZE }, random_color);
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

        const bitmap = await createImageBitmap(imgData)
        const event = new CustomEvent("acre_plot_rendered", {
            detail: {
                bitmap: bitmap,
            }
        })
        document.dispatchEvent(event);
    }

    async set_acre(pos, color) {
        this.#plot[pos] = color;
        await this.render();
    }
}

class Displayer {
    #ctx;
    #scale;
    #bitmap;
    #xoffset;
    #yoffset;

    constructor(canvas) {
        this.#ctx = canvas.getContext("2d");
        this.#ctx.imageSmoothingEnabled = false;
        this.#scale = MIN_SCALE;
        this.#bitmap = null;
        this.#xoffset = 0;
        this.#yoffset = 0;
    }

    update_bitmap(bitmap) {
        this.#bitmap = bitmap
        requestAnimationFrame(() => this.draw());
    }

    change_scale(sign) {
        this.#scale = clamp(MIN_SCALE, MAX_SCALE, this.#scale + sign * ZOOM_STEP);
        // N.B. needed so that we move the scene back into proper bounds if need be.
        // e.g. we're zooming out but currently in the furthest lower right hand corner.
        // pan also calls requestAnimationFrame for us.
        this.pan(0, 0);
    }

    pan(dx, dy) {
        const min_offset = CANVAS_SIZE - this.#scale * PLOT_SIZE
        this.#xoffset = clamp(min_offset, 0, this.#xoffset + dx);
        this.#yoffset = clamp(min_offset, 0, this.#yoffset + dy);
        requestAnimationFrame(() => this.draw());
    }

    pixel_clicked(canvasX, canvasY) {
        const plotX = canvasX / this.#scale
        const plotY = canvasY / this.#scale
        document.dispatchEvent("acre_clicked", {
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
    #isDragging

    constructor(canvas, displayer) {
        this.#isDown = false
        this.#isDragging = false
        canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            console.log("in mouse down");
            this.#isDown = true
            this.#prevLeft = e.pageX;
            this.#prevTop = e.pageY;
        });
        canvas.addEventListener('mousemove', (e) => {
            e.preventDefault();
            if (!this.#isDown) {
                return
            }

            console.log("in mouse move");
            const dx = e.pageX - this.#prevLeft;
            const dy = e.pageY - this.#prevTop;
            this.#prevLeft = e.pageX;
            this.#prevTop = e.pageY;
            this.#isDragging = true;
            displayer.pan(dx, dy)
        });
        canvas.addEventListener('mouseup', (e) => {
            e.preventDefault();
            console.log("in mouse up");
            if (this.#isDown && !this.#isDragging) {
                displayer.pixel_clicked(e.offsetX, e.offsetY);
            }
            this.#isDown = false;
            this.#isDragging = false;
        })
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            displayer.change_scale(Math.sign(e.deltaY));
        })
    }
}

class AcrePlot extends HTMLElement {
    #onRendered

    connectedCallback() {
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 800;
        this.appendChild(canvas);

        const displayer = new Displayer(canvas);
        new Interactor(canvas, displayer);

        this.#onRendered = (e) => displayer.update_bitmap(e.detail.bitmap);
        document.addEventListener("acre_plot_rendered", this.#onRendered);
    }

    disconnectedCallback() {
        document.removeEventListener("acre_plot_rendered", this.#onRendered);
    }
}

customElements.define("acre-plot", AcrePlot);

const scene = new Scene();
setInterval(() => scene.set_acre(random_pos(), random_color()), UPDATE_RATE_MS);
