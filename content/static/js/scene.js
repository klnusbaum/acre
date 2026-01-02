import { ACRE_PLOT_UPDATE_EVENT } from "./acre_lib.js";

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
const PLOT_SIZE = 100;
const UPDATE_RATE_MS = 100;

const random_color = () => Math.floor(Math.random() * COLORS.length);
const random_pos = () => Math.floor(Math.random() * PLOT_SIZE * PLOT_SIZE);

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

        const bitmap = await createImageBitmap(imgData)
        const event = new CustomEvent(ACRE_PLOT_UPDATE_EVENT, {
            detail: {
                bitmap: bitmap,
                plot_size: PLOT_SIZE,
            }
        })
        document.dispatchEvent(event);
    }

    async set_acres(new_acres) {
        for (const acre of new_acres) {
            const pos = acre[0];
            const color = acre[1];
            this.#plot[pos] = color;
        }
        await this.render();
    }
}

const scene = new Scene();
const rand_n_gen = () => {
    return [
        [random_pos(), random_color()],
        [random_pos(), random_color()],
        [random_pos(), random_color()],
        [random_pos(), random_color()],
        [random_pos(), random_color()],
        [random_pos(), random_color()],
        [random_pos(), random_color()],
        [random_pos(), random_color()],
        [random_pos(), random_color()],
        [random_pos(), random_color()],
    ]
}

setInterval(() => scene.set_acres(rand_n_gen()), UPDATE_RATE_MS);
