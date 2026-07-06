import { LATEST_PLOT_SCENE, ACRE_PLOT_UPDATE_EVENT, ACRE_CLICKED_EVENT } from "./acre_lib.js";
const ZOOM_STEP = 0.1;

const clamp = (min, max, val) => Math.min(max, Math.max(min, val));
const dist = (p1, p2) => Math.hypot(p1.pageX - p2.pageX, p1.pageY - p2.pageY);

class Interactor {
    #currentPoints
    #isDragging

    constructor(canvas, onMove, onClick, onZoom) {
        this.#currentPoints = new Map();
        this.#isDragging = true;

        // Primary Events
        canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.#currentPoints.set(e.pointerId, e);
        });
        canvas.addEventListener('pointermove', (e) => {
            e.preventDefault();
            if (this.#currentPoints.size == 1) {
                const dx = e.pageX - this.#currentPoints.get(e.pointerId).pageX;
                const dy = e.pageY - this.#currentPoints.get(e.pointerId).pageY;
                this.#currentPoints.set(e.pointerId, e);
                this.#isDragging = true;
                onMove(dx, dy)
            } else if (this.#currentPoints.size > 1) {
                const [prev1, prev2] = this.#currentPoints.values()
                const prevDist = dist(prev1, prev2);
                this.#currentPoints.set(e.pointerId, e);
                const [new1, new2] = this.#currentPoints.values()
                const newDist = dist(new1, new2);
                onZoom(Math.sign(newDist - prevDist));
            }
        });
        const removePointer = (e) => {
            e.preventDefault();
            if (!this.#isDragging) {
                onClick(e.offsetX, e.offsetY);
            }
            this.#isDragging = false;
            this.#currentPoints.delete(e.pointerId);
        }
        canvas.addEventListener('pointerup', removePointer);
        canvas.addEventListener('pointercancel', removePointer);

        // Mouse wheel zoom
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            onZoom(Math.sign(e.deltaY));
        })
    }
}

class AcrePlot extends HTMLElement {
    // View
    #canvas;
    #ctx;
    #scale;
    #xOffset;
    #yOffset;

    // Scene
    #sceneState;

    // Callbacks
    #onRendered;
    #resizeObserver;

    connectedCallback() {
        this.#canvas = document.createElement("canvas");
        this.#canvas.width = 0;
        this.#canvas.height = 0;
        this.#ctx = this.#canvas.getContext("2d");
        this.#ctx.imageSmoothingEnabled = false;
        this.#scale = 0;
        this.#xOffset = 0;
        this.#yOffset = 0;
        this.#sceneState = LATEST_PLOT_SCENE.sceneState;

        new Interactor(
            this.#canvas,
            (dx, dy) => this.#pan(dx, dy),
            (x, y) => this.#pixel_clicked(x, y),
            (sign) => this.#change_scale(sign));

        this.appendChild(this.#canvas);

        this.#onRendered = (e) => this.#update_scene_data(e);
        document.addEventListener(ACRE_PLOT_UPDATE_EVENT, this.#onRendered);

        this.#resizeObserver = new ResizeObserver((entries) => {
            this.#canvas.width = entries[0].contentRect.width;
            this.#canvas.height = entries[0].contentRect.height;
            this.#ctx.imageSmoothingEnabled = false;
            this.#change_view(0, 0, 0);
        });
        this.#resizeObserver.observe(this);
    }

    disconnectedCallback() {
        this.#resizeObserver.unobserve(this);
        document.removeEventListener(ACRE_PLOT_UPDATE_EVENT, this.#onRendered);
    }

    #update_scene_data(e) {
        this.#sceneState = e.detail.sceneState;
        this.#change_view(0, 0, 0);
    }

    #change_scale(sign) {
        this.#change_view(0, 0, sign * ZOOM_STEP);
    }

    #pan(dx, dy) {
        this.#change_view(dx, dy, 0);
    }

    #change_view(dx, dy, ds) {
        if (this.#sceneState == null) {
            return
        }

        const min_offset = this.#canvas.width - this.#scale * this.#sceneState.plot_size;
        const min_scale = this.#canvas.width / this.#sceneState.plot_size;
        const max_scale = 20; // TODO figure out a good value for this

        this.#scale = clamp(min_scale, max_scale, this.#scale + ds);
        this.#xOffset = clamp(min_offset, 0, this.#xOffset + dx);
        this.#yOffset = clamp(min_offset, 0, this.#yOffset + dy);
        this.#draw();
    }

    #draw() {
        requestAnimationFrame(() => {
            if (this.#sceneState != null) {
                this.#draw_plot();
            }
        });
    }

    #draw_plot() {
        this.#ctx.drawImage(
            this.#sceneState.bitmap,
            this.#xOffset,
            this.#yOffset,
            this.#sceneState.plot_size * this.#scale,
            this.#sceneState.plot_size * this.#scale);
    }

    #pixel_clicked(canvasX, canvasY) {
        const plotX = Math.floor((canvasX - this.#xOffset) / this.#scale);
        const plotY = Math.floor((canvasY - this.#yOffset) / this.#scale);

        document.dispatchEvent(new CustomEvent(ACRE_CLICKED_EVENT, {
            detail: {
                x: plotX,
                y: plotY,
            }
        }))
    }
}

customElements.define("acre-plot", AcrePlot);
