document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('plot');
    const body = document.body;
    const zoomContainer = document.querySelector('.plot_viewer');

    // --- INITIAL DIMENSION CALCULATION ---
    // Note: To get the true original dimensions of the table (1000px by 1000px if it's 100x100 cells), 
    // we temporarily remove transforms.
    table.style.transform = 'none';
    const originalWidth = table.offsetWidth;
    const originalHeight = table.offsetHeight;

    const containerWidth = zoomContainer.offsetWidth;
    const containerHeight = zoomContainer.offsetHeight;

    // Calculate the scale needed to cover the container (viewport) fully.
    // Use the maximum ratio to ensure the table is not shorter or narrower than the container.
    const calculatedMinScale = Math.max(
        containerWidth / originalWidth,
        containerHeight / originalHeight
    );

    // --- Zoom Variables ---
    // Use the calculated minimum scale, or 1.0, whichever is larger, to start.
    let currentScale = calculatedMinScale;
    const scaleFactor = 0.1;
    // Set minScale to the calculated value. We can add a tiny buffer (e.g., -0.001) 
    // to ensure the scale doesn't get stuck exactly at the boundary.
    const minScale = calculatedMinScale;
    const maxScale = 10.0;

    // Reset initial transform to the calculated starting scale
    table.style.transform = `scale(${currentScale}) translate(0px, 0px)`;


    // --- Drag Variables ---
    let isDragging = false;
    let startMouseX;
    let startMouseY;
    let currentTranslateX = 0;
    let currentTranslateY = 0;

    /**
     * Applies the combined scale and translate transforms to the table.
     */
    function applyTransform() {
        table.style.transform = `scale(${currentScale}) translate(${currentTranslateX}px, ${currentTranslateY}px)`;
    }

    // ... (clampTranslation function remains the same, but it should use a simpler
    // check for the scale factor now since we enforce a high minimum) ...

    /**
     * Clamping logic (Revised slightly for clarity with the new minScale)
     */
    function clampTranslation(tableRect, containerRect) {
        // If scaled size is less than container size (which shouldn't happen with our new minScale), 
        // center it or just lock translation to 0,0.
        if (currentScale <= minScale) {
            currentTranslateX = 0;
            currentTranslateY = 0;
            return;
        }

        // Calculation remains the same: find the maximum distance the unscaled origin 
        // can move before the scaled table edge hits the container edge.
        const originalWidth = tableRect.width / currentScale;
        const originalHeight = tableRect.height / currentScale;

        const maxPanX = Math.max(0, originalWidth - containerRect.width / currentScale);
        const maxPanY = Math.max(0, originalHeight - containerRect.height / currentScale);

        // Clamp X: Max positive (right) is 0, max negative (left) is maxPanX
        currentTranslateX = Math.max(-maxPanX, Math.min(0, currentTranslateX));

        // Clamp Y: Max positive (down) is 0, max negative (up) is maxPanY
        currentTranslateY = Math.max(-maxPanY, Math.min(0, currentTranslateY));
    }


    // ===========================================
    // 1. SCROLL-TO-ZOOM
    // ===========================================
    table.addEventListener('wheel', (event) => {
        event.preventDefault();

        // Adjust scale
        if (event.deltaY > 0) { // Scroll Down: Zoom Out
            // Clamp currentScale at the new, dynamic minScale
            currentScale = Math.max(minScale, currentScale - scaleFactor);
        } else { // Scroll Up: Zoom In
            currentScale = Math.min(maxScale, currentScale + scaleFactor);
        }

        // ... (clamping and applyTransform calls remain the same) ...
        const tableRect = table.getBoundingClientRect();
        const containerRect = zoomContainer.getBoundingClientRect();
        clampTranslation(tableRect, containerRect);
        applyTransform();
    }, { passive: false });

    // ... (Drag event listeners remain the same) ...

    // MOUSE DOWN: Initiates the dragging process on the table
    table.addEventListener('mousedown', (event) => {
        isDragging = true;
        zoomContainer.classList.add('dragging');
        body.classList.add('dragging');
        startMouseX = event.clientX;
        startMouseY = event.clientY;
        event.preventDefault();
    });

    // MOUSE MOVE: Calculates and applies the translation (pan)
    document.addEventListener('mousemove', (event) => {
        if (!isDragging) return;

        const dx = event.clientX - startMouseX;
        const dy = event.clientY - startMouseY;

        currentTranslateX += dx / currentScale;
        currentTranslateY += dy / currentScale;

        // CLAMPING STEP
        const tableRect = table.getBoundingClientRect();
        const containerRect = zoomContainer.getBoundingClientRect();
        clampTranslation(tableRect, containerRect);

        startMouseX = event.clientX;
        startMouseY = event.clientY;

        applyTransform();
    });

    // MOUSE UP/LEAVE listeners remain the same
    document.addEventListener('mouseup', () => {
        isDragging = false;
        zoomContainer.classList.remove('dragging');
        body.classList.remove('dragging');
    });

    document.addEventListener('mouseleave', () => {
        isDragging = false;
        zoomContainer.classList.remove('dragging');
        body.classList.remove('dragging');
    });

    // Ensure the table starts at the calculated minimum scale
    table.style.transform = `scale(${calculatedMinScale}) translate(0px, 0px)`;
});
