import { COLORS, PLOT_SIZE, ACRE_SCENE_UPDATE_EVENT } from "./acre_lib.js";
const UPDATE_RATE_MS = 1000;

const random_color = () => Math.floor(Math.random() * COLORS.length);
const random_pos = () => Math.floor(Math.random() * PLOT_SIZE * PLOT_SIZE);
const rand_n_gen = () => {
    return Array.from({ length: 500 }, (_) => {
        return {
            pos: random_pos(),
            color: random_color(),
        }
    });
}

setInterval(() => {
    const event = new CustomEvent(ACRE_SCENE_UPDATE_EVENT, {
        detail: {
            acres: rand_n_gen(),
        }
    })
    document.dispatchEvent(event);
}, UPDATE_RATE_MS);
