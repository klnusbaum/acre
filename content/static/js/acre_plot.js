import { LATEST_PLOT_SCENE, ACRE_PLOT_UPDATE_EVENT } from "./acre_lib.js";
const ZOOM_STEP = 0.1;

const clamp = (min, max, val) => Math.min(max, Math.max(min, val));
const dist = (p1, p2) => Math.hypot(p1.pageX - p2.pageX, p1.pageY - p2.pageY);

class Interactor {
    #currentPoints
    #isDragging

    constructor(canvas, onMove, onClick, onZoom) {
        this.#currentPoints = new Map();
        this.#isDragging = false;

        // Primary Events
        canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.#currentPoints.set(e.pointerId, e);
        });
        canvas.addEventListener('pointermove', (e) => {
            e.preventDefault();

            if (this.#currentPoints.size == 0) {
                return
            }
            if (this.#currentPoints.size == 1 &&
                e.pageX == this.#currentPoints.get(e.pointerId).pageX &&
                e.pageY == this.#currentPoints.get(e.pointerId).pageY
            ) {
                // N.B.
                // on mobile, we get moved events even when the page coordinates
                // didn't change.
                // That's not really a move...
                return
            }

            this.#isDragging = true;
            if (this.#currentPoints.size == 1) {
                const dx = e.pageX - this.#currentPoints.get(e.pointerId).pageX;
                const dy = e.pageY - this.#currentPoints.get(e.pointerId).pageY;
                this.#currentPoints.set(e.pointerId, e);
                onMove(dx, dy)
            } else if (this.#currentPoints.size > 1) {
                const [prev1, prev2] = this.#currentPoints.values()
                const prevDist = dist(prev1, prev2);
                this.#currentPoints.set(e.pointerId, e);

                const [new1, new2] = this.#currentPoints.values()
                const newDist = dist(new1, new2);
                const anchorX = (new1.offsetX + new2.offsetX) / 2;
                const anchorY = (new1.offsetY + new2.offsetY) / 2;

                onZoom(Math.sign(newDist - prevDist), anchorX, anchorY);
            }
        });
        const removePointer = (e) => {
            e.preventDefault();
            if (this.#currentPoints.size == 0) {
                return
            }

            if (!this.#isDragging) {
                onClick(e.offsetX, e.offsetY);
            }

            this.#currentPoints.delete(e.pointerId);
            if (this.#currentPoints.size == 0) {
                this.#isDragging = false;
            }
        }
        canvas.addEventListener('pointerup', removePointer);
        canvas.addEventListener('pointercancel', removePointer);
        canvas.addEventListener('pointerleave', removePointer);

        // Mouse wheel zoom
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            onZoom(Math.sign(e.deltaY), e.offsetX, e.offsetY,);
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

    static formAssociated = true;

    constructor() {
        super();
        this.internals = this.attachInternals();
    }

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
            (x, y) => this.#acre_clicked(x, y),
            (direction, anchorX, anchorY) => this.#zoom(direction, anchorX, anchorY));

        this.appendChild(this.#canvas);

        this.#onRendered = (e) => this.#update_scene_data(e);
        document.addEventListener(ACRE_PLOT_UPDATE_EVENT, this.#onRendered);

        this.#resizeObserver = new ResizeObserver(([entry]) => this.#canvas_resize(entry.contentRect))
        this.#resizeObserver.observe(this.#canvas);
    }

    disconnectedCallback() {
        this.#resizeObserver.unobserve(this.#canvas);
        document.removeEventListener(ACRE_PLOT_UPDATE_EVENT, this.#onRendered);
    }

    #canvas_resize(contentRect) {
        this.#canvas.width = contentRect.width;
        this.#canvas.height = contentRect.height;
        this.#ctx.imageSmoothingEnabled = false;
        this.#update_view(() => {
            this.#clamp_scale()
            this.#clamp_offsets();
        });
    }

    #update_scene_data(e) {
        this.#sceneState = e.detail.sceneState;
        this.#update_view(() => {
            this.#clamp_scale()
            this.#clamp_offsets();
        });
    }

    #zoom(direction, anchorX, anchorY) {
        this.#update_view(() => {
            const focusX = (anchorX - this.#xOffset) / this.#scale;
            const focusY = (anchorY - this.#yOffset) / this.#scale;

            this.#scale = this.#scale + direction * ZOOM_STEP
            this.#clamp_scale();

            this.#xOffset = anchorX - focusX * this.#scale;
            this.#yOffset = anchorY - focusY * this.#scale;
            this.#clamp_offsets();
        });
    }

    #pan(dx, dy) {
        this.#update_view(() => {
            this.#xOffset = this.#xOffset + dx;
            this.#yOffset = this.#yOffset + dy;
            this.#clamp_offsets();
        })
    }

    #update_view(change_view) {
        if (this.#sceneState == null) {
            return
        }

        change_view();

        requestAnimationFrame(() => {
            this.#ctx.drawImage(
                this.#sceneState.bitmap,
                this.#xOffset,
                this.#yOffset,
                this.#sceneState.plot_size * this.#scale,
                this.#sceneState.plot_size * this.#scale);
        });
    }

    #clamp_scale() {
        const MAX_SCALE_TARGET_ACRES = 10;

        const min_scale = this.#canvas.width / this.#sceneState.plot_size;
        const max_scale = this.#canvas.width / MAX_SCALE_TARGET_ACRES;
        this.#scale = clamp(min_scale, max_scale, this.#scale);
    }

    #clamp_offsets() {
        const min_offset = this.#canvas.width - this.#scale * this.#sceneState.plot_size;
        this.#xOffset = clamp(min_offset, 0, this.#xOffset);
        this.#yOffset = clamp(min_offset, 0, this.#yOffset);
    }

    #acre_clicked(canvasX, canvasY) {
        const plotX = Math.floor((canvasX - this.#xOffset) / this.#scale);
        const plotY = Math.floor((canvasY - this.#yOffset) / this.#scale);
        const formData = new FormData()
        formData.set("x", plotX);
        formData.set("y", plotY);
        this.internals.setFormValue(formData);
        this.internals.form?.requestSubmit();
    }

}

customElements.define("acre-plot", AcrePlot);
