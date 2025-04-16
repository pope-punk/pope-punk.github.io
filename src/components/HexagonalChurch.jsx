import React, { useEffect, useState, forwardRef, useRef } from 'react';
import defaultPewImage from '../assets/pew-icon.png';
import defaultChurchBackground from '../assets/church-background.png';

// Constants for base animation speeds
const ANIMATION_SPEEDS = {
  ROTATION_SPEED: 800,    // ms per diagonal position for rotation (less is faster)
  DIAGONAL_SPEED: 800,    // ms per ring position for diagonal movement
  PAUSE_BETWEEN_STEPS: 250  // 0.25 second pause between steps
};

const DIAGONAL_ANGLES = [0, Math.PI / 3, 2 * Math.PI / 3]; // 0°, 60°, 120°

// Main component
const HexagonalChurch = forwardRef(({
  matrix,              // Current matrix state to display when not animating
  animationSteps = [], // Array of steps for animation
  customImages = {},   // Custom images for rendering
  onStepComplete,      // Callback when a step completes
  isAnimating = false  // Whether animation is currently active
}, ref) => {
  
  // ===== STATE =====
  // Resources
  const [background, setBackground] = useState(null);
  const [pewImage, setPewImage] = useState(null);
  
  // Animation state
  const [animationState, setAnimationState] = useState({
    isActive: false,           // Whether animation is running
    currentStepIndex: 0,       // Current step in the animation sequence
    progress: 0,               // Progress of current step (0-1)
    isPaused: false,           // Whether we're in a pause between steps
    baseMatrix: matrix,        // Matrix to use as animation base
    stepDuration: 1000,        // Current step duration (calculated dynamically)
    safeAnimationDirection: null, // Direction that avoids collisions
  });
  
  // Canvas dimensions
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 600 });
  
  // ===== REFS =====
  const canvasRef = useRef(null);
  const animationTimerRef = useRef(null);
  const pauseTimerRef = useRef(null);
  
  // ===== INITIALIZATION =====
  // Load images once on mount
  useEffect(() => {
    // Background image loading
    const bgImg = new Image();
    bgImg.onload = () => setBackground(bgImg);
    bgImg.onerror = () => console.error("Failed to load background image");
    bgImg.src = customImages.hexagonBackground || defaultChurchBackground;
    
    // Pew image loading
    const pewImg = new Image();
    pewImg.onload = () => setPewImage(pewImg);
    pewImg.onerror = () => console.error("Failed to load pew image");
    pewImg.src = customImages.buttonIcon || defaultPewImage;
    
    // Cleanup
    return () => {
      bgImg.onload = null;
      bgImg.onerror = null;
      pewImg.onload = null;
      pewImg.onerror = null;
    };
  }, [customImages.hexagonBackground, customImages.buttonIcon]);
  
  // ===== ANIMATION CONTROL =====
  // Calculate step duration based on movement type and distance
  const calculateStepDuration = (step) => {
    if (!step) return 1000; // Default fallback
    
    if (step.animationType === 'ring') {
      // Use angular distance if available, otherwise default to 1
      const angularDistance = step.angularDistance || 1;
      
      // Scale by ring (inner rings are faster)
      const ringIndex = step.source.ring;
      const ringFactor = ringIndex === 0 ? 0.8 : (ringIndex === 1 ? 1.0 : 1.2);
      
      return angularDistance * ANIMATION_SPEEDS.ROTATION_SPEED * ringFactor;
    } 
    else if (step.animationType === 'diagonal') {
      // Use linear distance if available, otherwise default to 1
      const linearDistance = step.linearDistance || 1;
      return linearDistance * ANIMATION_SPEEDS.DIAGONAL_SPEED;
    }
    
    return 1000; // Default fallback
  };

  // NEW: Detect if a rotation direction would cause collisions
  const detectRotationCollisions = (ringIndex, movingPews, direction) => {
    // If there's only one pew on the ring, no collisions possible
    if (movingPews.length <= 1) return false;
    
    // Get all pews on this ring and their starting diagonal positions
    const pewPositions = movingPews.map(pew => pew.fromDiagonal).sort((a, b) => a - b);
    
    // Convert to a format where we can check for collisions during animation
    // Each pew will have a start and end position (in radians)
    const pewPaths = pewPositions.map(pos => {
      // Get starting angle in radians
      const startAngle = DIAGONAL_ANGLES[pos];
      
      // Calculate ending angle based on direction
      let endAngle;
      if (direction === 'clockwise') {
        // Clockwise means increasing angle
        endAngle = startAngle + (Math.PI / 3); // 60 degrees
      } else {
        // Counterclockwise means decreasing angle
        endAngle = startAngle - (Math.PI / 3); // -60 degrees
      }
      
      return { startAngle, endAngle };
    });
    
    // Check for collisions between any pair of pews
    for (let i = 0; i < pewPaths.length; i++) {
      for (let j = i + 1; j < pewPaths.length; j++) {
        const pewA = pewPaths[i];
        const pewB = pewPaths[j];
        
        // Check if paths cross during animation
        // For clockwise rotation
        if (direction === 'clockwise') {
          // Pew A starts before Pew B
          if (pewA.startAngle < pewB.startAngle) {
            // If Pew A ends after Pew B starts, they collide
            if (pewA.endAngle > pewB.startAngle) return true;
          }
          // Pew B starts before Pew A
          else {
            // If Pew B ends after Pew A starts, they collide
            if (pewB.endAngle > pewA.startAngle) return true;
          }
        }
        // For counterclockwise rotation
        else {
          // Pew A starts after Pew B
          if (pewA.startAngle > pewB.startAngle) {
            // If Pew A ends before Pew B starts, they collide
            if (pewA.endAngle < pewB.startAngle) return true;
          }
          // Pew B starts after Pew A
          else {
            // If Pew B ends before Pew A starts, they collide
            if (pewB.endAngle < pewA.startAngle) return true;
          }
        }
      }
    }
    
    // Handle special case for wraparound collisions (from position 2 to 0)
    // This requires additional checks
    const hasPewAt0 = pewPositions.includes(0);
    const hasPewAt2 = pewPositions.includes(2);
    
    if (hasPewAt0 && hasPewAt2) {
      // Check if the rotation direction would cause these to collide
      if (direction === 'clockwise' && pewPositions.includes(1)) {
        return true; // Clockwise: pew at 2 would collide with pew at 0
      }
      if (direction === 'counterclockwise' && pewPositions.includes(1)) {
        return true; // Counterclockwise: pew at 0 would collide with pew at 2
      }
    }
    
    // If no collisions detected, this direction is safe
    return false;
  };
  
  // NEW: Determine safe animation direction for a step
  const determineSafeAnimationDirection = (step) => {
    if (!step || step.animationType !== 'ring') {
      return step?.direction || 'clockwise'; // Default or use step direction for non-ring movements
    }
    
    const movingPews = step.movingPews || [];
    const ringIndex = step.ringIndex;
    
    // Check both directions for collisions
    const clockwiseCollision = detectRotationCollisions(ringIndex, movingPews, 'clockwise');
    const counterclockwiseCollision = detectRotationCollisions(ringIndex, movingPews, 'counterclockwise');
    
    // If one direction has collisions and the other doesn't, choose the collision-free path
    if (clockwiseCollision && !counterclockwiseCollision) {
      console.log(`Ring ${ringIndex} rotation: Using counterclockwise to avoid collisions`);
      return 'counterclockwise';
    }
    
    if (!clockwiseCollision && counterclockwiseCollision) {
      console.log(`Ring ${ringIndex} rotation: Using clockwise to avoid collisions`);
      return 'clockwise';
    }
    
    // If both have collisions or both are collision-free, use the provided direction
    console.log(`Ring ${ringIndex} rotation: Using provided direction ${step.direction}`);
    return step.direction;
  };
  
  // Animation setup and control
  useEffect(() => {
    // Clean up any existing animation
    clearAnimationTimers();
    
    if (isAnimating && animationSteps.length > 1) {
      // Calculate duration for the first step
      const firstStep = animationSteps[1]; // Index 1 is the first actual step (0 is initial state)
      const stepDuration = calculateStepDuration(firstStep);
      
      // Determine safe direction for animation (NEW)
      const safeDirection = determineSafeAnimationDirection(firstStep);
      
      // Initialize animation
      setAnimationState({
        isActive: true,
        currentStepIndex: 1, // Start at step 1 (0 is initial state)
        progress: 0,
        isPaused: false,
        baseMatrix: animationSteps[0].matrix, // Start with initial state
        stepDuration: stepDuration, // Set duration for first step
        safeAnimationDirection: safeDirection, // NEW: Store safe direction
      });
    } else {
      // Reset to non-animating state
      setAnimationState({
        isActive: false,
        currentStepIndex: 0,
        progress: 1,
        isPaused: false,
        baseMatrix: matrix,
        stepDuration: 1000, // Default
        safeAnimationDirection: null,
      });
    }
    
    return clearAnimationTimers;
  }, [isAnimating, animationSteps, matrix]);
  
  // Handle animation progression
  useEffect(() => {
    if (!animationState.isActive) return;
    
    const {currentStepIndex, progress, isPaused, stepDuration} = animationState;
    
    // If we're paused, wait then advance to next step
    if (isPaused) {
      pauseTimerRef.current = setTimeout(() => {
        // Calculate duration for the next step
        const nextStep = animationSteps[currentStepIndex + 1];
        const nextStepDuration = calculateStepDuration(nextStep);
        
        // Determine safe direction for animation (NEW)
        const safeDirection = determineSafeAnimationDirection(nextStep);
        
        setAnimationState(prev => ({
          ...prev,
          currentStepIndex: prev.currentStepIndex + 1,
          progress: 0,
          isPaused: false,
          stepDuration: nextStepDuration, // Update duration for next step
          safeAnimationDirection: safeDirection, // NEW: Update safe direction
        }));
      }, ANIMATION_SPEEDS.PAUSE_BETWEEN_STEPS);
      return;
    }
    
    // If we've reached the end of a step
    if (progress >= 1) {
      // Are we at the last step?
      if (currentStepIndex >= animationSteps.length - 1) {
        // Animation complete, notify parent
        if (onStepComplete) onStepComplete(-1);
        
        // Reset animation state
        setAnimationState(prev => ({
          ...prev,
          isActive: false,
          baseMatrix: animationSteps[animationSteps.length - 1].matrix,
          safeAnimationDirection: null,
        }));
        return;
      }
      
      // Update base matrix to the completed step
      const completedStepMatrix = animationSteps[currentStepIndex].matrix;
      
      // Notify parent of step completion
      if (onStepComplete) onStepComplete(currentStepIndex);
      
      // Pause before next step
      setAnimationState(prev => ({
        ...prev,
        isPaused: true,
        baseMatrix: completedStepMatrix,
      }));
      return;
    }
    
    // Calculate increment per frame (60fps target)
    const progressIncrement = 1000 / 60 / stepDuration;
    
    // Set timer to update progress
    animationTimerRef.current = setTimeout(() => {
      setAnimationState(prev => ({
        ...prev,
        progress: Math.min(prev.progress + progressIncrement, 1)
      }));
    }, 1000 / 60); // ~16.7ms for 60fps
    
    return clearAnimationTimers;
  }, [animationState, animationSteps, onStepComplete]);
  
  // Helper to clear all timers
  const clearAnimationTimers = () => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  };
  
  // ===== CANVAS RENDERING =====
  // Handle canvas size changes
  useEffect(() => {
    if (!ref.current) return;
    
    const updateCanvasSize = () => {
      if (!ref.current) return;
      
      const { clientWidth, clientHeight } = ref.current;
      if (clientWidth > 0 && clientHeight > 0) {
        setCanvasSize({
          width: clientWidth,
          height: clientHeight
        });
      }
    };
    
    // Set initial size
    updateCanvasSize();
    
    // Create observer for size changes
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(ref.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);
  
  // Main rendering function
  useEffect(() => {
    if (!ref.current) return;
    
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Update canvas dimensions if needed
    if (canvas.width !== canvasSize.width || canvas.height !== canvasSize.height) {
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate dimensions
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const hexSize = Math.min(canvas.width, canvas.height) * 0.45;
    const ringRadii = [hexSize * 0.3, hexSize * 0.6, hexSize * 0.85];
    
    // Draw hexagon and guidelines
    drawHexagon(ctx, centerX, centerY, hexSize);
    drawBackground(ctx, centerX, centerY, hexSize, background);
    drawHexagon(ctx, centerX, centerY, hexSize); // Redraw hexagon on top
    drawGuideLines(ctx, centerX, centerY, hexSize, ringRadii);
    
    // Get the current step data if we're animating
    const currentStep = animationState.isActive && animationState.currentStepIndex < animationSteps.length
      ? animationSteps[animationState.currentStepIndex]
      : null;
    
    // Draw pews
    drawAllPews(
      ctx, 
      centerX, 
      centerY, 
      ringRadii, 
      animationState.baseMatrix, 
      currentStep, 
      animationState.progress,
      pewImage,
      animationState.safeAnimationDirection // NEW: Pass the safe direction
    );
    
  }, [
    ref, 
    canvasSize, 
    animationState, 
    animationSteps, 
    background, 
    pewImage
  ]);
  
  // ===== DRAWING HELPERS =====
  // Draw hexagon outline
  const drawHexagon = (ctx, centerX, centerY, size) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = centerX + size * Math.cos(angle);
      const y = centerY + size * Math.sin(angle);
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3;
    ctx.stroke();
  };
  
  // Draw background
  const drawBackground = (ctx, centerX, centerY, size, backgroundImage) => {
    if (!backgroundImage || !backgroundImage.complete) return;
    
    // Save context for clipping
    ctx.save();
    
    // Create clipping path (hexagon)
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = centerX + size * Math.cos(angle);
      const y = centerY + size * Math.sin(angle);
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.clip();
    
    // Draw background image
    try {
      const imgRatio = backgroundImage.naturalWidth / backgroundImage.naturalHeight;
      const canvasRatio = ctx.canvas.width / ctx.canvas.height;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgRatio > canvasRatio) {
        drawHeight = ctx.canvas.height;
        drawWidth = imgRatio * drawHeight;
        drawX = (ctx.canvas.width - drawWidth) / 2;
        drawY = 0;
      } else {
        drawWidth = ctx.canvas.width;
        drawHeight = drawWidth / imgRatio;
        drawX = 0;
        drawY = (ctx.canvas.height - drawHeight) / 2;
      }
      
      ctx.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight);
    } catch (e) {
      console.error("Error drawing background:", e);
      ctx.fillStyle = '#BCBCBC';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    
    // Restore context
    ctx.restore();
  };
  
  // Draw guide lines
  const drawGuideLines = (ctx, centerX, centerY, hexSize, ringRadii) => {
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    
    // Draw rings
    ringRadii.forEach(radius => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    });
    
    // Draw diagonals
    DIAGONAL_ANGLES.forEach(angle => {
      const startX = centerX + hexSize * Math.cos(angle);
      const startY = centerY + hexSize * Math.sin(angle);
      const endX = centerX - hexSize * Math.cos(angle);
      const endY = centerY - hexSize * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    });
    
    // Draw center point
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#888';
    ctx.fill();
  };
  
  // Draw a single pew
  const drawPew = (ctx, x, y, angle, pewImage) => {
    // Adjust angle for proper orientation
    const orientedAngle = angle + Math.PI / 2;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(orientedAngle);
    
    if (pewImage && pewImage.complete) {
      try {
        const imgAspect = pewImage.naturalWidth / pewImage.naturalHeight;
        let displayWidth = 100; // Base size
        let displayHeight = displayWidth / imgAspect;
        
        // Constrain height if needed
        if (displayHeight > 100) {
          displayHeight = 100;
          displayWidth = displayHeight * imgAspect;
        }
        
        // Position centered horizontally, aligned at top
        const dx = -displayWidth / 2;
        const dy = 0;
        
        ctx.drawImage(pewImage, dx, dy, displayWidth, displayHeight);
      } catch (e) {
        console.error("Error drawing pew:", e);
        drawFallbackPew(ctx);
      }
    } else {
      drawFallbackPew(ctx);
    }
    
    ctx.restore();
  };
  
  // Draw fallback pew shape
  const drawFallbackPew = (ctx) => {
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
  };
  
  // Calculate position for a diagonally moving pew
  const calculateDiagonalPosition = (
    centerX, 
    centerY, 
    ringRadii, 
    progress,
    fromRing,
    toRing,
    diagonalIndex
  ) => {
    // Get diagonal angle
    const angle = DIAGONAL_ANGLES[diagonalIndex];
    
    // Get radii
    const sourceRadius = ringRadii[fromRing];
    const destRadius = ringRadii[toRing];
    
    // Interpolate radius based on progress
    const currentRadius = sourceRadius + (destRadius - sourceRadius) * progress;
    
    // Calculate position
    const x = centerX + currentRadius * Math.cos(angle);
    const y = centerY + currentRadius * Math.sin(angle);
    
    return { x, y, angle };
  };
  
  // UPDATED: Calculate position for a rotating pew based on collision-free direction
  const calculateRingPosition = (
    centerX, 
    centerY, 
    ringRadii, 
    progress,
    ringIndex,
    fromDiagonal,
    toDiagonal,
    direction,
    safeDirection // NEW: The safe direction that avoids collisions
  ) => {
    // Get diagonal angles
    const sourceAngle = DIAGONAL_ANGLES[fromDiagonal];
    const destAngle = DIAGONAL_ANGLES[toDiagonal];
    
    // Use the safe direction if provided, otherwise use the step's direction
    const finalDirection = safeDirection || direction;
    
    // Calculate angle change based on EXPLICIT direction
    let angleDiff;
    
    if (finalDirection === "clockwise") {
      // For clockwise, always go clockwise (positive angle change)
      // Handle wraparound correctly (0->2, 0->1, 1->2, etc.)
      if (fromDiagonal > toDiagonal) {
        // Going from higher to lower number means wrapping around 
        angleDiff = ((3 + toDiagonal - fromDiagonal) % 3) * (Math.PI / 3);
      } else {
        // Simple case
        angleDiff = (toDiagonal - fromDiagonal) * (Math.PI / 3);
      }
    } else { // counterclockwise
      // For counterclockwise, always go counterclockwise (negative angle change)
      // Handle wraparound correctly (2->0, 1->0, 2->1, etc.)
      if (fromDiagonal < toDiagonal) {
        // Going from lower to higher number means wrapping around
        angleDiff = -((3 + fromDiagonal - toDiagonal) % 3) * (Math.PI / 3);
      } else {
        // Simple case
        angleDiff = -((fromDiagonal - toDiagonal) * (Math.PI / 3));
      }
    }
    
    // Interpolate angle based on progress
    const currentAngle = sourceAngle + (angleDiff * progress);
    
    // Get radius (constant for ring movements)
    const radius = ringRadii[ringIndex];
    
    // Calculate position
    const x = centerX + radius * Math.cos(currentAngle);
    const y = centerY + radius * Math.sin(currentAngle);
    
    return { x, y, angle: currentAngle };
  };
  
  // UPDATED: Draw all pews in the current state
  const drawAllPews = (
    ctx, 
    centerX, 
    centerY, 
    ringRadii, 
    baseMatrix, 
    currentStep,
    progress,
    pewImage,
    safeAnimationDirection // NEW: The safe direction that avoids collisions
  ) => {
    // Track which pews are being animated (to avoid drawing them twice)
    const animatingPews = new Set();
    
    // Draw animating pews if we're in animation
    if (currentStep && progress < 1) {
      if (currentStep.animationType === 'diagonal') {
        // For diagonal movements, get all moving pews
        const movingPews = currentStep.movingPews || [];
        
        // Animate all moving pews
        movingPews.forEach(pew => {
          // Mark this pew as animating
          animatingPews.add(`${pew.fromRing},${pew.diagonal}`);
          
          // Calculate position
          const animPos = calculateDiagonalPosition(
            centerX, 
            centerY, 
            ringRadii, 
            progress,
            pew.fromRing,
            pew.toRing,
            pew.diagonal
          );
          
          if (animPos) {
            // Draw primary pew
            drawPew(ctx, animPos.x, animPos.y, animPos.angle, pewImage);
            
            // Draw symmetric pair (opposite side)
            const oppositeX = 2 * centerX - animPos.x;
            const oppositeY = 2 * centerY - animPos.y;
            const oppositeAngle = animPos.angle + Math.PI;
            drawPew(ctx, oppositeX, oppositeY, oppositeAngle, pewImage);
          }
        });
      } 
      else if (currentStep.animationType === 'ring') {
        // For ring rotations, get all moving pews
        const movingPews = currentStep.movingPews || [];
        const direction = currentStep.direction;
        
        // Animate all moving pews - USING THE SAFE DIRECTION
        movingPews.forEach(pew => {
          // Mark this pew as animating
          animatingPews.add(`${pew.fromRing},${pew.fromDiagonal}`);
          
          // Calculate position - USING SAFE DIRECTION TO PREVENT COLLISIONS
          const animPos = calculateRingPosition(
            centerX, 
            centerY, 
            ringRadii, 
            progress,
            pew.fromRing,
            pew.fromDiagonal,
            pew.toDiagonal,
            direction,
            safeAnimationDirection // Pass safe direction
          );
          
          if (animPos) {
            // Draw primary pew
            drawPew(ctx, animPos.x, animPos.y, animPos.angle, pewImage);
            
            // Draw symmetric pair (opposite side)
            const oppositeX = 2 * centerX - animPos.x;
            const oppositeY = 2 * centerY - animPos.y;
            const oppositeAngle = animPos.angle + Math.PI;
            drawPew(ctx, oppositeX, oppositeY, oppositeAngle, pewImage);
          }
        });
      }
    }
    
    // Draw static pews (not being animated)
    for (let r = 0; r < 3; r++) {
      for (let d = 0; d < 3; d++) {
        // Skip if no pew here
        if (!baseMatrix || baseMatrix[r]?.[d] !== 2) continue;
        
        // Skip if this pew is currently being animated
        if (animatingPews.has(`${r},${d}`)) continue;
        
        // Get position
        const angle = DIAGONAL_ANGLES[d];
        const radius = ringRadii[r];
        
        // Draw pew and its symmetric pair
        const x1 = centerX + radius * Math.cos(angle);
        const y1 = centerY + radius * Math.sin(angle);
        drawPew(ctx, x1, y1, angle, pewImage);
        
        // Symmetric pair (opposite side)
        const angle2 = angle + Math.PI;
        const x2 = centerX + radius * Math.cos(angle2);
        const y2 = centerY + radius * Math.sin(angle2);
        drawPew(ctx, x2, y2, angle2, pewImage);
      }
    }
  };
  
  // ===== RENDER COMPONENT =====
  return (
    <div className="church-visualization">
      <canvas
        ref={ref}
        className="church-canvas"
        width={600}
        height={600}
        aria-label="Hexagonal church layout"
        role="img"
      />
      
      {isAnimating && (
        <div className="animation-status">
          <div className="step-description">
            {animationState.isPaused
              ? animationSteps[Math.max(0, animationState.currentStepIndex - 1)]?.description || "Initial arrangement"
              : animationSteps[animationState.currentStepIndex]?.description || "Transforming..."}
          </div>
        </div>
      )}
    </div>
  );
});

HexagonalChurch.displayName = 'HexagonalChurch';
export default HexagonalChurch;