import { ACRE_PLOT_UPDATE_EVENT, ACRE_CLICKED_EVENT } from "./acre_lib.js";
const ZOOM_STEP = 0.1;
const CANVAS_SIZE = 800;

const clamp = (min, max, val) => Math.min(max, Math.max(min, val));

class Interactor {
    #isDown
    #prevLeft
    #prevTop
    #isDragging

    constructor(canvas, onDownMove, onClick, onZoom) {
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
            onDownMove(dx, dy)
        });
        canvas.addEventListener('mouseup', (e) => {
            e.preventDefault();
            console.log("in mouse up");
            if (this.#isDown && !this.#isDragging) {
                onClick(e.offsetX, e.offsetY);
            }
            this.#isDown = false;
            this.#isDragging = false;
        })
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            onZoom(Math.sign(e.deltaY));
        })
    }
}


class AcrePlot extends HTMLElement {
    #ctx;
    #scale;
    #xoffset;
    #yoffset;

    #scene_data;
    #onRendered;

    connectedCallback() {
        const canvas = document.createElement("canvas");
        canvas.width = CANVAS_SIZE;
        canvas.height = CANVAS_SIZE;
        this.appendChild(canvas);
        this.#ctx = canvas.getContext("2d");
        this.#ctx.imageSmoothingEnabled = false;
        this.#scale = 1;
        this.#scene_data = null;
        this.#xoffset = 0;
        this.#yoffset = 0;

        new Interactor(
            canvas,
            (dx, dy) => this.#pan(dx, dy),
            (x, y) => this.#pixel_clicked(x, y),
            (sign) => this.#change_scale(sign));

        // TODO this always means we show loading, even when we have
        // an already existing bitmap in a Scene. Maybe try to get a good
        // initial display if we have an existing, good bitmap.
        // might have to use a global...
        this.#draw();
        this.#onRendered = (e) => this.#update_scene_data(e);
        document.addEventListener(ACRE_PLOT_UPDATE_EVENT, this.#onRendered);
    }

    disconnectedCallback() {
        document.removeEventListener(ACRE_PLOT_UPDATE_EVENT, this.#onRendered);
    }

    #update_scene_data(e) {
        this.#scene_data = {
            bitmap: e.detail.bitmap,
            plot_size: e.detail.plot_size,
            min_scale: CANVAS_SIZE / e.detail.plot_size,
            max_scale: 20, // TODO figure out a good value for this
        }
        this.#change_view(0, 0, 0);
    }

    #change_scale(sign) {
        this.#change_view(0, 0, sign * ZOOM_STEP);
    }

    #pan(dx, dy) {
        this.#change_view(dx, dy, 0);
    }

    #change_view(dx, dy, ds) {
        if (this.#scene_data == null) {
            return
        }

        this.#scale = clamp(this.#scene_data.min_scale, this.#scene_data.max_scale, this.#scale + ds);
        const min_offset = CANVAS_SIZE - this.#scale * this.#scene_data.plot_size;
        this.#xoffset = clamp(min_offset, 0, this.#xoffset + dx);
        this.#yoffset = clamp(min_offset, 0, this.#yoffset + dy);
        this.#draw();
    }

    #pixel_clicked(canvasX, canvasY) {
        const plotX = canvasX / this.#scale
        const plotY = canvasY / this.#scale
        document.dispatchEvent(new CustomEvent(ACRE_CLICKED_EVENT, {
            detail: {
                x: Math.floor(plotX),
                y: Math.floor(plotY),
            }
        }))
    }

    #draw() {
        requestAnimationFrame(() => {
            if (this.#scene_data == null) {
                this.#draw_loading();
            } else {
                this.#draw_plot();
            }
        });
    }

    #draw_loading() {
        this.#ctx.font = "28px sans-serif";
        this.#ctx.fillText("Loading...", 0, 28);
    }

    #draw_plot() {
        this.#ctx.drawImage(
            this.#scene_data.bitmap,
            this.#xoffset,
            this.#yoffset,
            this.#scene_data.plot_size * this.#scale,
            this.#scene_data.plot_size * this.#scale);
    }
}

customElements.define("acre-plot", AcrePlot);
