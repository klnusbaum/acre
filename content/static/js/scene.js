import { LATEST_PLOT_SCENE, COLORS, PLOT_SIZE, ACRE_PLOT_UPDATE_EVENT, ACRE_SCENE_UPDATE_EVENT } from "./acre_lib.js";

class Scene {
    #plot
    #ctx;

    constructor() {
        this.#ctx = new OffscreenCanvas(PLOT_SIZE, PLOT_SIZE).getContext("2d");
        this.#plot = new Array(PLOT_SIZE * PLOT_SIZE).fill(0);
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

        LATEST_PLOT_SCENE.sceneState = {
            bitmap: await createImageBitmap(imgData),
            plot_size: PLOT_SIZE,
        }

        const event = new CustomEvent(ACRE_PLOT_UPDATE_EVENT, {
            detail: {
                sceneState: LATEST_PLOT_SCENE.sceneState,
            }
        })
        document.dispatchEvent(event);
    }

    async set_acres(new_acres) {
        for (const acre of new_acres) {
            this.#plot[acre.pos] = acre.color;
        }
        await this.render();
    }
}


const scene = new Scene();
document.addEventListener(ACRE_SCENE_UPDATE_EVENT, (e) => {
    scene.set_acres(e.detail.acres);
})

