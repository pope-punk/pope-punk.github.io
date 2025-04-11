import React, { useEffect, useState, forwardRef, useCallback } from 'react';
// Ensure your assets folder is at src/assets/
import defaultPewImage from '../assets/pew-icon.png';
import defaultChurchBackground from '../assets/church-background.png';

// --- Constants for Drawing ---
const HEXAGON_LINE_COLOR = '#444';
const HEXAGON_LINE_WIDTH = 3;
const GUIDE_LINE_COLOR = '#888';
const GUIDE_LINE_WIDTH = 1;
// Pew Size (Increased)
const PEW_DISPLAY_WIDTH = 100;
const PEW_DISPLAY_HEIGHT = 100;

// --- Helper Functions (Using STANDARD 0, 60, 120 deg base) ---

// Draws the main hexagon outline - pointy left/right, flat top/bottom
const drawHexagonalOutline = (ctx, width, height, hexSize, centerX, centerY) => {
    const hexPoints = [];
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        // Standard angle produces pointy left/right hexagon
        const angle = (Math.PI / 3) * i;
        const x = centerX + hexSize * Math.cos(angle);
        const y = centerY + hexSize * Math.sin(angle);
        hexPoints.push({ x, y });
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = HEXAGON_LINE_COLOR;
    ctx.lineWidth = HEXAGON_LINE_WIDTH;
    ctx.stroke();
    return hexPoints;
};

// Draws the background (clipped) - no changes needed
const drawBackground = (ctx, width, height, backgroundImage, hexPoints) => {
    ctx.save();
    ctx.beginPath();
    hexPoints.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.clip();
    if (backgroundImage && backgroundImage.complete && backgroundImage.naturalHeight !== 0) {
        try {
            const imgRatio = backgroundImage.naturalWidth / backgroundImage.naturalHeight;
            const canvasRatio = width / height;
            let drawWidth, drawHeight, drawX, drawY;
            if (imgRatio > canvasRatio) {
                drawHeight = height; drawWidth = imgRatio * drawHeight;
                drawX = (width - drawWidth) / 2; drawY = 0;
            } else {
                drawWidth = width; drawHeight = drawWidth / imgRatio;
                drawX = 0; drawY = (height - drawHeight) / 2;
            }
            ctx.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight);
        } catch (e) { ctx.fillStyle = '#BCBCBC'; ctx.fillRect(0, 0, width, height); }
    } else { ctx.fillStyle = '#BCBCBC'; ctx.fillRect(0, 0, width, height); }
    ctx.restore();
};

// Draws the concentric rings and diagonal guides - standard angles, scaled outer ring
const drawGuides = (ctx, width, height, hexSize, centerX, centerY) => {
    // Scaled down outer ring
    const ringRadii = [hexSize * 0.3, hexSize * 0.6, hexSize * 0.85];
    ctx.strokeStyle = GUIDE_LINE_COLOR;
    ctx.lineWidth = GUIDE_LINE_WIDTH;
    // Rings
    ringRadii.forEach(radius => {
        ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.stroke();
    });
    // Diagonals - use standard angles: 0, 60, 120 degrees
    const diagonalAngles = [0, Math.PI / 3, 2 * Math.PI / 3];
    diagonalAngles.forEach(angle => {
        const startX = centerX + hexSize * Math.cos(angle); const startY = centerY + hexSize * Math.sin(angle);
        const endX = centerX - hexSize * Math.cos(angle); const endY = centerY - hexSize * Math.sin(angle);
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
    });
    // Center point
    ctx.beginPath(); ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fillStyle = GUIDE_LINE_COLOR; ctx.fill();
    return ringRadii; // Return adjusted radii
};

// Draws the legend text (no changes needed)
const drawLegend = (ctx, vector, width, height) => {
    if (!vector || vector.length !== 6) return;
    const [r1, r2, r3, d1, d2, d3] = vector;
    ctx.font = '11px Arial'; ctx.fillStyle = '#333'; ctx.textAlign = 'left';
    const lineHeight = 14; let yPos = height - 50;
    ctx.fillText(`Vector: (${vector.join(', ')})`, 15, yPos); yPos += lineHeight;
    ctx.fillText(`Rings: ${r1} (in), ${r2} (mid), ${r3} (out)`, 15, yPos); yPos += lineHeight;
    ctx.fillText(`Diagonals: ${d1} (↔), ${d2} (↗↙), ${d3} (↖↘)`, 15, yPos);
};

// Fallback shape if image fails (no changes needed)
const drawFallbackPew = (ctx) => {
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'red'; ctx.fill();
};

// --- Draw Pews Logic (Relative to STANDARD 0, 60, 120 deg base) ---
const drawPews = (ctx, arrangement, pewImgObject, width, height, hexSize, centerX, centerY, ringRadii) => {
    if (!arrangement) return;
    const imageToDraw = (pewImgObject && pewImgObject.complete && pewImgObject.naturalHeight !== 0) ? pewImgObject : null;

    // Define the base angles for diagonals in the STANDARD orientation
    const diagonalBaseAngles = [0, Math.PI / 3, 2 * Math.PI / 3];

    arrangement.forEach((pew, index) => {
        if (!Array.isArray(pew) || pew.length < 3) return;
        const [ringIndex, diagonalIndex, side] = pew;
        if (ringIndex < 0 || ringIndex >= ringRadii.length || diagonalIndex < 0 || diagonalIndex > 2 || (side !== 0 && side !== 1)) return;

        // 1. Get Base Angle for the diagonal (standard orientation)
        const baseAngle = diagonalBaseAngles[diagonalIndex];

        // 2. Determine Specific Pew Angle based on 'side'
        const pewAngle = baseAngle + (side === 0 ? 0 : Math.PI);

        // 3. Get Radius for the ring (uses scaled outer radius)
        const radius = ringRadii[ringIndex];

        // 4. Calculate Coordinates
        const x = centerX + radius * Math.cos(pewAngle);
        const y = centerY + radius * Math.sin(pewAngle);

        // 5. Translate origin to the pew's location
        ctx.save();
        ctx.translate(x, y);

        // 6. Calculate Orientation Angle (perpendicular to the diagonal)
        const orientationAngle = pewAngle + Math.PI / 2;

        // 7. Rotate context
        ctx.rotate(orientationAngle);

        // 8. Draw Image (or fallback)
        if (imageToDraw) {
            try {
                const imgAspect = imageToDraw.naturalWidth / imageToDraw.naturalHeight;
                let dWidth = PEW_DISPLAY_WIDTH; // Use larger constant
                let dHeight = dWidth / imgAspect;
                if (dHeight > PEW_DISPLAY_HEIGHT) { // Use larger constant
                    dHeight = PEW_DISPLAY_HEIGHT;
                    dWidth = dHeight * imgAspect;
                }
                // Align top/narrow edge midpoint with origin
                const dx = -dWidth / 2;
                const dy = 0;
                ctx.drawImage(imageToDraw, dx, dy, dWidth, dHeight);
            } catch (e) { drawFallbackPew(ctx); }
        } else { drawFallbackPew(ctx); }

        // 9. Restore context
        ctx.restore();
    });
};

// --- Main Component (State, Effects, Render - mostly unchanged) ---
const HexagonalChurch = forwardRef(({ arrangement, vector, customPewImage, customBgImage }, ref) => {
    // State
    const [bgImg, setBgImg] = useState(null);
    const [bgImgError, setBgImgError] = useState(false);
    const [pewImg, setPewImg] = useState(null);
    const [pewImgError, setPewImgError] = useState(false);

    // Image Loading Effects
    useEffect(() => { /* ...bg image loading... */
        const img = new Image();
        img.onload = () => { setBgImg(img); setBgImgError(false); };
        img.onerror = (e) => { console.error("BG Img Load Error:", e); setBgImg(null); setBgImgError(true); };
        img.src = customBgImage?.src || defaultChurchBackground;
        if (img.complete && img.naturalHeight !== 0) img.onload();
        return () => { img.onload = null; img.onerror = null; };
    }, [customBgImage]);
    useEffect(() => { /* ...pew image loading... */
        const img = new Image();
        img.onload = () => { console.log("Pew image loaded:", img.src); setPewImg(img); setPewImgError(false); };
        img.onerror = (e) => { console.error("Pew Img Load Error:", img.src, e); setPewImg(null); setPewImgError(true); };
        img.src = customPewImage?.src || defaultPewImage;
        if (img.complete && img.naturalHeight !== 0) img.onload();
        return () => { img.onload = null; img.onerror = null; };
    }, [customPewImage]);

    // Main Drawing Callback - Uses updated helpers with standard orientation
    const drawCanvas = useCallback(() => {
        const canvas = ref?.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        const { width, height } = canvas;
        const centerX = width / 2; const centerY = height / 2;
        const hexSize = Math.min(width, height) * 0.45;

        ctx.clearRect(0, 0, width, height);

        // Draw everything in the standard orientation
        const hexPoints = drawHexagonalOutline(ctx, width, height, hexSize, centerX, centerY); // Standard orientation
        drawBackground(ctx, width, height, bgImg, hexPoints);
        drawHexagonalOutline(ctx, width, height, hexSize, centerX, centerY); // Outline on top
        const ringRadii = drawGuides(ctx, width, height, hexSize, centerX, centerY); // Standard orientation + scaled ring
        drawPews(ctx, arrangement, pewImg, width, height, hexSize, centerX, centerY, ringRadii); // Uses standard base angles
        drawLegend(ctx, vector, width, height); // Legend drawn last

    }, [ref, arrangement, vector, bgImg, pewImg]); // Dependencies

    // Effect to trigger drawing
    useEffect(() => { drawCanvas(); }, [drawCanvas]);

    // Render
    return (
        <div className="church-visualization">
            {/* Add CSS rotation here if desired for final presentation */}
            <canvas
                ref={ref}
                width={600}
                height={600}
                className="church-canvas"
                // style={{ transform: 'rotate(60deg)' }} // Example CSS rotation - uncomment if needed
                aria-label={`Hexagonal church layout for vector ${vector?.join(', ')}`}
                role="img"
            />
            {bgImgError && <p className="error" style={{color: 'red', textAlign: 'center'}}>BG Load Fail</p>}
            {pewImgError && <p className="error" style={{color: 'red', textAlign: 'center'}}>Pew Load Fail</p>}
        </div>
    );
});

HexagonalChurch.displayName = 'HexagonalChurch';
export default HexagonalChurch;