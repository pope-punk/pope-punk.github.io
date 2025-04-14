import React, { useEffect, useState, forwardRef, useCallback, useRef} from 'react';
// We'll import custom assets defined in the app
import defaultPewImage from '../assets/pew-icon.png';
import defaultChurchBackground from '../assets/church-background.png';

// --- Constants for Drawing ---
const HEXAGON_LINE_COLOR = '#444';
const HEXAGON_LINE_WIDTH = 3;
const GUIDE_LINE_COLOR = '#888';
const GUIDE_LINE_WIDTH = 1;
// Pew Size
const PEW_DISPLAY_WIDTH = 100;
const PEW_DISPLAY_HEIGHT = 100;
// Animation timing
const ANIMATION_DURATION = 2500; // ms

// --- Helper Functions ---

// Draws the main hexagon outline
const drawHexagonalOutline = (ctx, width, height, hexSize, centerX, centerY) => {
    const hexPoints = [];
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
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

// Draws the background (clipped)
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

// Draws the concentric rings and diagonal guides
const drawGuides = (ctx, width, height, hexSize, centerX, centerY) => {
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

// Fallback shape if image fails
const drawFallbackPew = (ctx) => {
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'red'; ctx.fill();
};

// Draw pews based on matrix
const drawPews = (ctx, matrix, pewImgObject, width, height, hexSize, centerX, centerY, ringRadii) => {
    if (!matrix) return;
    const imageToDraw = (pewImgObject && pewImgObject.complete && pewImgObject.naturalHeight !== 0) ? pewImgObject : null;

    // Define the base angles for diagonals
    const diagonalBaseAngles = [0, Math.PI / 3, 2 * Math.PI / 3];

    // Convert matrix to pew placement
    const pewPositions = [];
    for (let r = 0; r < 3; r++) {
        for (let d = 0; d < 3; d++) {
            if (matrix[r][d] === 2) {
                // Add symmetric pair
                pewPositions.push([r, d, 0]);
                pewPositions.push([r, d, 1]);
            }
        }
    }

    pewPositions.forEach(pew => {
        const [ringIndex, diagonalIndex, side] = pew;
        
        // 1. Get Base Angle for the diagonal
        const baseAngle = diagonalBaseAngles[diagonalIndex];

        // 2. Determine Specific Pew Angle based on 'side'
        const pewAngle = baseAngle + (side === 0 ? 0 : Math.PI);

        // 3. Get Radius for the ring
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
                let dWidth = PEW_DISPLAY_WIDTH;
                let dHeight = dWidth / imgAspect;
                if (dHeight > PEW_DISPLAY_HEIGHT) {
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

// Interpolate between matrices for smooth animation
const interpolateMatrix = (startMatrix, endMatrix, progress) => {
    // Create an interpolated matrix where 0 = not present, 1 = fading in/out, 2 = fully present
    const result = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];
    
    for (let r = 0; r < 3; r++) {
        for (let d = 0; d < 3; d++) {
            // If both have pews, keep it at 2
            if (startMatrix[r][d] === 2 && endMatrix[r][d] === 2) {
                result[r][d] = 2;
            }
            // If start has pew but end doesn't, fade out
            else if (startMatrix[r][d] === 2 && endMatrix[r][d] === 0) {
                result[r][d] = progress < 0.5 ? 2 : 0;
            }
            // If end has pew but start doesn't, fade in
            else if (startMatrix[r][d] === 0 && endMatrix[r][d] === 2) {
                result[r][d] = progress > 0.5 ? 2 : 0;
            }
        }
    }
    
    return result;
};

// --- Main Component ---
const HexagonalChurch = forwardRef(({ matrix, animationSteps, customImages }, ref) => {
    // State
    const [bgImg, setBgImg] = useState(null);
    const [pewImg, setPewImg] = useState(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [animationProgress, setAnimationProgress] = useState(1); // 0 to 1
    const [animationActive, setAnimationActive] = useState(false);
    const [interpolatedMatrix, setInterpolatedMatrix] = useState(matrix);
    const animationRef = useRef(null);

    // Image Loading
    useEffect(() => {
        const img = new Image();
        img.onload = () => { setBgImg(img); };
        img.onerror = (e) => { console.error("BG Image Load Error:", e); setBgImg(null); };
        img.src = customImages?.hexagonBackground || defaultChurchBackground;
        
        return () => { img.onload = null; img.onerror = null; };
    }, [customImages?.hexagonBackground]);
    
    useEffect(() => {
        const img = new Image();
        img.onload = () => { setPewImg(img); };
        img.onerror = (e) => { console.error("Pew Image Load Error:", e); setPewImg(null); };
        img.src = customImages?.buttonIcon || defaultPewImage;
        
        return () => { img.onload = null; img.onerror = null; };
    }, [customImages?.buttonIcon]);

    // Animation processing
    useEffect(() => {
        // If we have new animation steps, start animation
        if (animationSteps && animationSteps.length > 1) {
            setCurrentStepIndex(0);
            setAnimationProgress(0);
            setAnimationActive(true);
        }
    }, [animationSteps]);

    // Animation frame handler
    useEffect(() => {
        if (!animationActive || !animationSteps || animationSteps.length <= 1) return;
        
        let startTime;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
            
            setAnimationProgress(progress);
            
            if (progress < 1) {
                animationRef.current = requestAnimationFrame(step);
            } else {
                // Move to next step or finish animation
                if (currentStepIndex < animationSteps.length - 1) {
                    setCurrentStepIndex(prev => prev + 1);
                    setAnimationProgress(0);
                    startTime = null;
                    animationRef.current = requestAnimationFrame(step);
                } else {
                    setAnimationActive(false);
                }
            }
        };
        
        animationRef.current = requestAnimationFrame(step);
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [animationActive, currentStepIndex, animationSteps]);

    // Update interpolated matrix during animation
    useEffect(() => {
        if (!animationActive || !animationSteps || animationSteps.length <= 1) {
            setInterpolatedMatrix(matrix);
            return;
        }
        
        const currentStep = animationSteps[currentStepIndex];
        const nextStep = animationSteps[Math.min(currentStepIndex + 1, animationSteps.length - 1)];
        
        if (currentStep && nextStep) {
            setInterpolatedMatrix(interpolateMatrix(
                currentStep.matrix, 
                nextStep.matrix, 
                animationProgress
            ));
        }
    }, [animationActive, currentStepIndex, animationProgress, animationSteps, matrix]);

    // Drawing function
const drawCanvas = useCallback(() => {
    const canvas = ref?.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const hexSize = Math.min(width, height) * 0.45;

    // Clear with transparent background instead of black
    ctx.clearRect(0, 0, width, height);
    
    // Draw everything
    const hexPoints = drawHexagonalOutline(ctx, width, height, hexSize, centerX, centerY);
    drawBackground(ctx, width, height, bgImg, hexPoints);
    drawHexagonalOutline(ctx, width, height, hexSize, centerX, centerY); // Outline on top
    const ringRadii = drawGuides(ctx, width, height, hexSize, centerX, centerY);
    
    // Draw pews with current matrix or animation interpolation
    const matrixToRender = animationActive ? interpolatedMatrix : matrix;
    drawPews(ctx, matrixToRender, pewImg, width, height, hexSize, centerX, centerY, ringRadii);
}, [ref, matrix, bgImg, pewImg, animationActive, interpolatedMatrix]);

    // Effect to trigger drawing
    useEffect(() => {
        drawCanvas();
    }, [drawCanvas]);

    // Render
    return (
        <div className="church-visualization">
            <canvas
                ref={ref}
                width={600}
                height={600}
                className="church-canvas"
                aria-label="Hexagonal church layout"
                role="img"
            />
            {animationActive && (
                <div className="animation-status">
                    <div className="step-description">
                        {animationSteps[currentStepIndex]?.description || "Transformation in progress..."}
                    </div>
                </div>
            )}
        </div>
    );
});

HexagonalChurch.displayName = 'HexagonalChurch';
export default HexagonalChurch;