// src/utils/matrixUtils.js - Rail System with Guaranteed Direction Consistency

// --- Constants ---
export const CANONICAL_STATES = {
  DIAGONAL_1: [
    [2, 0, 0], [2, 0, 0], [2, 0, 0]
  ],
  DIAGONAL_2: [
    [0, 2, 0], [0, 2, 0], [0, 2, 0]
  ],
  DIAGONAL_3: [
    [0, 0, 2], [0, 0, 2], [0, 0, 2]
  ],
  OUTER_RING: [
    [0, 0, 0], [0, 0, 0], [2, 2, 2]
  ]
};

export const CANONICAL_STATE = CANONICAL_STATES.DIAGONAL_1;

// --- Helper Functions ---
const cloneMatrix = (matrix) => {
  if (!matrix || !Array.isArray(matrix)) {
    console.error("Invalid matrix provided to clone");
    return JSON.parse(JSON.stringify(CANONICAL_STATE));
  }
  return JSON.parse(JSON.stringify(matrix));
};

const matricesAreEqual = (matrix1, matrix2) => {
  return JSON.stringify(matrix1) === JSON.stringify(matrix2);
};

export const getPositionName = (ring, diagonal) => {
  const ringNames = ["Inner", "Middle", "Outer"];
  const diagonalNames = ["Horizontal", "Top-Right/Bot-Left", "Top-Left/Bot-Right"];
  return `${ringNames[ring]}, ${diagonalNames[diagonal]}`;
};

// --- Ring Representation ---

// Get configuration of a ring (returns the diagonal indices where pews are located)
const getRingConfig = (matrix, ringIndex) => {
  const positions = [];
  
  if (matrix && matrix[ringIndex]) {
    for (let d = 0; d < 3; d++) {
      if (matrix[ringIndex][d] === 2) {
        positions.push(d);
      }
    }
  }
  
  return positions;
};

// Get configuration of a diagonal (returns the ring indices where pews are located)
const getDiagonalConfig = (matrix, diagonalIndex) => {
  const positions = [];
  
  if (matrix) {
    for (let r = 0; r < 3; r++) {
      if (matrix[r][diagonalIndex] === 2) {
        positions.push(r);
      }
    }
  }
  
  return positions;
};

// Get ring configurations for all rings
const getAllRingConfigs = (matrix) => {
  return [0, 1, 2].map(r => getRingConfig(matrix, r));
};

// Get diagonal configurations for all diagonals
const getAllDiagonalConfigs = (matrix) => {
  return [0, 1, 2].map(d => getDiagonalConfig(matrix, d));
};

// --- Matrix Validation ---
export const isValidMatrix = (matrix) => {
  console.log("--- isValidMatrix START ---");
  console.log("isValidMatrix received input:", JSON.stringify(matrix));

  if (!matrix || !Array.isArray(matrix) || matrix.length !== 3) {
    console.log("isValidMatrix: Failed initial structure check");
    console.log("--- isValidMatrix END ---");
    return false;
  }
  
  let pairCount = 0;
  let innerRingPairCount = 0;

  for (let r = 0; r < 3; r++) {
    if (!Array.isArray(matrix[r]) || matrix[r].length !== 3) {
      console.log(`isValidMatrix: Failed row structure at row ${r}`);
      console.log("--- isValidMatrix END ---");
      return false;
    }
    
    for (let d = 0; d < 3; d++) {
      if (matrix[r][d] !== 0 && matrix[r][d] !== 2) {
        console.log(`isValidMatrix: Invalid value at [${r}][${d}]: ${matrix[r][d]}`);
        console.log("--- isValidMatrix END ---");
        return false;
      }
      
      if (matrix[r][d] === 2) {
        pairCount++;
        if (r === 0) {
          innerRingPairCount++;
        }
      }
    }
  }
  
  console.log(`isValidMatrix: Counted ${pairCount} pairs, ${innerRingPairCount} on inner ring`);
  
  // Check constraints: exactly 3 pairs, at most 1 on inner ring
  const result = pairCount === 3 && innerRingPairCount <= 1;
  
  console.log(`isValidMatrix: Matrix is ${result ? 'valid' : 'invalid'}`);
  console.log("--- isValidMatrix END ---");
  
  return result;
};

// --- Valid Move Generation ---

// Rotate a ring configuration by a number of steps
const rotateRingConfig = (config, steps, direction) => {
  // Direction-aware rotation
  if (direction === "clockwise") {
    return config.map(pos => (pos + steps) % 3);
  } else { // counterclockwise
    return config.map(pos => (pos - steps + 3) % 3);
  }
};

// Move a diagonal configuration inward or outward
const moveDiagonalConfig = (config, direction) => {
  if (direction === "inward") {
    return config.map(pos => Math.max(0, pos - 1))
                  .filter((pos, index, arr) => arr.indexOf(pos) === index); // Remove duplicates
  } else {
    return config.map(pos => Math.min(2, pos + 1))
                  .filter((pos, index, arr) => arr.indexOf(pos) === index); // Remove duplicates
  }
};

// Create a matrix from ring configurations
const createMatrixFromRingConfigs = (ringConfigs) => {
  const matrix = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  
  for (let r = 0; r < 3; r++) {
    for (const d of ringConfigs[r]) {
      matrix[r][d] = 2;
    }
  }
  
  return matrix;
};

// Create a matrix from diagonal configurations
const createMatrixFromDiagonalConfigs = (diagonalConfigs) => {
  const matrix = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  
  for (let d = 0; d < 3; d++) {
    for (const r of diagonalConfigs[d]) {
      matrix[r][d] = 2;
    }
  }
  
  return matrix;
};

// Check if a ring rotation would create a valid matrix
const isValidRingRotation = (matrix, ringIndex, steps, direction) => {
  // Get all ring configurations
  const ringConfigs = getAllRingConfigs(matrix);
  
  // Create a new set of configurations with the specified ring rotated
  const newRingConfigs = [...ringConfigs];
  newRingConfigs[ringIndex] = rotateRingConfig(ringConfigs[ringIndex], steps, direction);
  
  // Create a new matrix and check validity
  const newMatrix = createMatrixFromRingConfigs(newRingConfigs);
  return isValidMatrix(newMatrix);
};

// Check if a diagonal movement would create a valid matrix
const isValidDiagonalMovement = (matrix, diagonalIndex, direction) => {
  // Get all diagonal configurations
  const diagonalConfigs = getAllDiagonalConfigs(matrix);
  
  // Create a new set of configurations with the specified diagonal moved
  const newDiagonalConfigs = [...diagonalConfigs];
  newDiagonalConfigs[diagonalIndex] = moveDiagonalConfig(diagonalConfigs[diagonalIndex], direction);
  
  // Create a new matrix and check validity
  const newMatrix = createMatrixFromDiagonalConfigs(newDiagonalConfigs);
  return isValidMatrix(newMatrix);
};

// --- Move Generation Functions ---

// Calculate exact angle between two diagonal positions for animation
const calculateAngularDifference = (fromDiag, toDiag) => {
  // We're working with 3 positions, 0, 1, 2, at angles 0, 60, 120 degrees
  // Calculate both clockwise and counterclockwise path
  const clockwiseSteps = (toDiag - fromDiag + 3) % 3;
  const counterclockwiseSteps = (fromDiag - toDiag + 3) % 3;
  
  // Determine whether clockwise or counterclockwise is shorter
  if (clockwiseSteps <= counterclockwiseSteps) {
    return {
      direction: "clockwise",
      steps: clockwiseSteps
    };
  } else {
    return {
      direction: "counterclockwise",
      steps: counterclockwiseSteps
    };
  }
};

// Create a step for rotating a ring
const createRingRotationStep = (matrix, ringIndex, targetDiagonal) => {
  // Get current configuration
  const ringConfig = getRingConfig(matrix, ringIndex);
  if (ringConfig.length === 0) {
    return null; // No pews on this ring
  }
  
  // Get position of first pew to determine rotation
  const currentDiagonal = ringConfig[0];
  
  // Skip if target is same as current
  if (currentDiagonal === targetDiagonal) {
    return null;
  }
  
  // Calculate the rotation details (direction and steps)
  const { direction, steps } = calculateAngularDifference(currentDiagonal, targetDiagonal);
  
  // Get all ring configurations
  const ringConfigs = getAllRingConfigs(matrix);
  
  // Create new configurations with this ring rotated
  const newRingConfigs = [...ringConfigs];
  newRingConfigs[ringIndex] = rotateRingConfig(ringConfigs[ringIndex], steps, direction);
  
  // Create new matrix
  const newMatrix = createMatrixFromRingConfigs(newRingConfigs);
  
  // Validate new matrix
  if (!isValidMatrix(newMatrix)) {
    return null;
  }
  
  // Create list of all pews that will move
  const movingPews = [];
  for (const diagonal of ringConfig) {
    // Calculate where each pew will end up
    let newDiagonal;
    if (direction === "clockwise") {
      newDiagonal = (diagonal + steps) % 3;
    } else { // counterclockwise
      newDiagonal = (diagonal - steps + 3) % 3;
    }
    
    movingPews.push({
      fromRing: ringIndex,
      toRing: ringIndex,
      fromDiagonal: diagonal,
      toDiagonal: newDiagonal,
      direction: direction,
      angularDistance: steps
    });
  }
  
  return {
    matrix: newMatrix,
    description: `Rotate ${getPositionName(ringIndex, 0).split(',')[0]} Ring ${direction}`,
    animationType: "ring",
    direction: direction,
    ringIndex: ringIndex,
    angularDistance: steps,
    movingPews: movingPews,
    // For compatibility with animation system
    source: { ring: ringIndex, diagonal: currentDiagonal },
    destination: { ring: ringIndex, diagonal: targetDiagonal }
  };
};

// Create a step for moving a diagonal
const createDiagonalMoveStep = (matrix, diagonalIndex, direction) => {
  // Check direction
  if (direction !== "inward" && direction !== "outward") {
    return null;
  }
  
  // Get current configuration
  const diagonalConfig = getDiagonalConfig(matrix, diagonalIndex);
  if (diagonalConfig.length === 0) {
    return null; // No pews on this diagonal
  }
  
  // Get all diagonal configurations
  const diagonalConfigs = getAllDiagonalConfigs(matrix);
  
  // Create new configurations with this diagonal moved
  const newDiagonalConfigs = [...diagonalConfigs];
  newDiagonalConfigs[diagonalIndex] = moveDiagonalConfig(diagonalConfigs[diagonalIndex], direction);
  
  // Create new matrix
  const newMatrix = createMatrixFromDiagonalConfigs(newDiagonalConfigs);
  
  // Validate new matrix
  if (!isValidMatrix(newMatrix)) {
    return null;
  }
  
  // Create the step
  const firstPewPos = diagonalConfig[0]; // Position of first pew
  const newPewPos = direction === "inward" ? Math.max(0, firstPewPos - 1) : Math.min(2, firstPewPos + 1);
  
  // Calculate max linear distance
  let maxLinearDistance = 0;
  
  // Create list of all pews that will move
  const movingPews = [];
  for (const ring of diagonalConfig) {
    const newRing = direction === "inward" ? Math.max(0, ring - 1) : Math.min(2, ring + 1);
    
    // Skip if position didn't change
    if (ring === newRing) continue;
    
    const linearDistance = Math.abs(newRing - ring);
    maxLinearDistance = Math.max(maxLinearDistance, linearDistance);
    
    movingPews.push({
      fromRing: ring,
      toRing: newRing,
      diagonal: diagonalIndex,
      direction: direction,
      linearDistance: linearDistance
    });
  }
  
  // Skip if no pews are actually moving
  if (movingPews.length === 0) {
    return null;
  }
  
  return {
    matrix: newMatrix,
    description: `Move ${getPositionName(0, diagonalIndex).split(',')[1]} Diagonal ${direction}`,
    animationType: "diagonal",
    direction: direction,
    diagonalIndex: diagonalIndex,
    linearDistance: maxLinearDistance,
    movingPews: movingPews,
    // For compatibility with animation system
    source: { ring: firstPewPos, diagonal: diagonalIndex },
    destination: { ring: newPewPos, diagonal: diagonalIndex }
  };
};

// Store rotation directions for each ring to maintain consistency
let ringRotationDirections = {};

// Reset rotation directions (call at the start of path finding)
const resetRotationDirections = () => {
  ringRotationDirections = {};
};

// Get all valid moves from a matrix
const getValidMoves = (matrix) => {
  const moves = [];
  
  // Try rotating each ring
  for (let r = 0; r < 3; r++) {
    const pewsOnRing = getRingConfig(matrix, r);
    if (pewsOnRing.length === 0) continue;
    
    // If we have a preferred direction for this ring, try it first
    if (r in ringRotationDirections) {
      const preferredDirection = ringRotationDirections[r];
      const currentPos = pewsOnRing[0];
      
      for (let targetPos = 0; targetPos < 3; targetPos++) {
        if (targetPos === currentPos) continue;
        
        // Calculate rotation details
        let steps;
        if (preferredDirection === "clockwise") {
          // Clockwise steps
          steps = (targetPos - currentPos + 3) % 3;
          if (steps === 0) continue;
        } else {
          // Counterclockwise steps
          steps = (currentPos - targetPos + 3) % 3;
          if (steps === 0) continue;
        }
        
        // Create step
        const move = createRingRotationStep(matrix, r, targetPos);
        if (move && move.direction === preferredDirection) {
          moves.push(move);
        }
      }
    } else {
      // No preference yet, try both directions
      for (let targetPos = 0; targetPos < 3; targetPos++) {
        if (targetPos === pewsOnRing[0]) continue;
        
        const move = createRingRotationStep(matrix, r, targetPos);
        if (move) {
          moves.push(move);
          
          // Remember this direction for consistency
          ringRotationDirections[r] = move.direction;
        }
      }
    }
  }
  
  // Try moving each diagonal
  for (let d = 0; d < 3; d++) {
    const inwardMove = createDiagonalMoveStep(matrix, d, "inward");
    if (inwardMove) {
      moves.push(inwardMove);
    }
    
    const outwardMove = createDiagonalMoveStep(matrix, d, "outward");
    if (outwardMove) {
      moves.push(outwardMove);
    }
  }
  
  return moves;
};

// Find the nearest canonical state to a given matrix
export const findNearestCanonicalState = (matrix) => {
  // Check if we're already in a canonical state
  for (const [name, state] of Object.entries(CANONICAL_STATES)) {
    if (matricesAreEqual(matrix, state)) {
      console.log(`Matrix is already in canonical state: ${name}`);
      return { canonicalState: state, name };
    }
  }
  
  // Count pews on each diagonal
  const diagonalCounts = [0, 0, 0];
  for (let d = 0; d < 3; d++) {
    diagonalCounts[d] = getDiagonalConfig(matrix, d).length;
  }
  
  // Find diagonal with most pews
  let maxCount = 0;
  let bestDiagonal = 0;
  
  for (let d = 0; d < 3; d++) {
    if (diagonalCounts[d] > maxCount) {
      maxCount = diagonalCounts[d];
      bestDiagonal = d;
    }
  }
  
  // Count pews on outer ring
  const outerRingCount = getRingConfig(matrix, 2).length;
  
  // Choose canonical state
  let canonicalName = "";
  let canonicalState = null;
  
  if (outerRingCount === 3) {
    canonicalName = "OUTER_RING";
    canonicalState = CANONICAL_STATES.OUTER_RING;
  } else {
    canonicalName = `DIAGONAL_${bestDiagonal + 1}`;
    canonicalState = CANONICAL_STATES[canonicalName];
  }
  
  console.log(`Nearest canonical state: ${canonicalName}`);
  return { canonicalState, name: canonicalName };
};

export const generateDefaultMatrix = () => {
  return cloneMatrix(CANONICAL_STATE);
};

// --- Path Finding Functions ---

// Calculate distance between matrices (number of different positions)
const calculateMatrixDistance = (matrix1, matrix2) => {
  let distance = 0;
  
  for (let r = 0; r < 3; r++) {
    for (let d = 0; d < 3; d++) {
      if (matrix1[r][d] !== matrix2[r][d]) {
        distance++;
      }
    }
  }
  
  return distance;
};

// Use breadth-first search to find a path
const findPathBFS = (startMatrix, endMatrix, maxDepth = 8) => {
  console.log("Starting BFS search");
  
  // Reset rotation directions for a clean slate
  resetRotationDirections();
  
  if (matricesAreEqual(startMatrix, endMatrix)) {
    return [];
  }
  
  // Queue of states to explore
  const queue = [{
    matrix: startMatrix,
    path: [],
    depth: 0
  }];
  
  // Set of visited states
  const visited = new Set();
  visited.add(JSON.stringify(startMatrix));
  
  // Process queue
  while (queue.length > 0) {
    const current = queue.shift();
    const { matrix, path, depth } = current;
    
    // Check depth limit
    if (depth >= maxDepth) continue;
    
    // Get all valid moves
    const moves = getValidMoves(matrix);
    
    // Try each move
    for (const move of moves) {
      const newMatrix = move.matrix;
      const matrixString = JSON.stringify(newMatrix);
      
      // Skip if already visited
      if (visited.has(matrixString)) continue;
      
      // Update rotation direction for consistency
      if (move.animationType === "ring") {
        ringRotationDirections[move.ringIndex] = move.direction;
      }
      
      // Create new path
      const newPath = [...path, move];
      
      // Check if goal reached
      if (matricesAreEqual(newMatrix, endMatrix)) {
        console.log(`Found path with ${newPath.length} steps using BFS`);
        return newPath;
      }
      
      // Add to queue and mark as visited
      visited.add(matrixString);
      queue.push({
        matrix: newMatrix,
        path: newPath,
        depth: depth + 1
      });
    }
  }
  
  console.log(`BFS search reached depth limit without finding path`);
  return null;
};

// Use A* search to find a path
const findPathAStar = (startMatrix, endMatrix, maxDepth = 8) => {
  console.log("Starting A* search");
  
  // Reset rotation directions for a clean slate
  resetRotationDirections();
  
  if (matricesAreEqual(startMatrix, endMatrix)) {
    return [];
  }
  
  // Priority queue
  const openSet = [{
    matrix: startMatrix,
    path: [],
    depth: 0,
    cost: 0,
    priority: calculateMatrixDistance(startMatrix, endMatrix)
  }];
  
  // Set of visited states
  const visited = new Set();
  visited.add(JSON.stringify(startMatrix));
  
  // Process queue
  while (openSet.length > 0) {
    // Sort by priority
    openSet.sort((a, b) => a.priority - b.priority);
    
    // Get best state
    const current = openSet.shift();
    const { matrix, path, depth, cost } = current;
    
    // Check depth limit
    if (depth >= maxDepth) continue;
    
    // Get all valid moves
    const moves = getValidMoves(matrix);
    
    // Try each move
    for (const move of moves) {
      const newMatrix = move.matrix;
      const matrixString = JSON.stringify(newMatrix);
      
      // Skip if already visited
      if (visited.has(matrixString)) continue;
      
      // Update rotation direction for consistency
      if (move.animationType === "ring") {
        ringRotationDirections[move.ringIndex] = move.direction;
      }
      
      // Create new path
      const newPath = [...path, move];
      
      // Check if goal reached
      if (matricesAreEqual(newMatrix, endMatrix)) {
        console.log(`Found path with ${newPath.length} steps using A*`);
        return newPath;
      }
      
      // Add to open set and mark as visited
      const newCost = cost + 1;
      const heuristic = calculateMatrixDistance(newMatrix, endMatrix);
      visited.add(matrixString);
      
      openSet.push({
        matrix: newMatrix,
        path: newPath,
        depth: depth + 1,
        cost: newCost,
        priority: newCost + heuristic
      });
    }
  }
  
  console.log(`A* search reached depth limit without finding path`);
  return null;
};

// Try direct path using greedy approach
const findDirectPath = (startMatrix, endMatrix, maxSteps = 8) => {
  console.log("Trying direct path");
  
  // Reset rotation directions for a clean slate
  resetRotationDirections();
  
  if (matricesAreEqual(startMatrix, endMatrix)) {
    return [];
  }
  
  const path = [];
  let currentMatrix = cloneMatrix(startMatrix);
  
  for (let step = 0; step < maxSteps; step++) {
    // Get all valid moves
    const moves = getValidMoves(currentMatrix);
    if (moves.length === 0) break;
    
    // Find best move (closest to goal)
    let bestMove = null;
    let bestDistance = Infinity;
    
    for (const move of moves) {
      const distance = calculateMatrixDistance(move.matrix, endMatrix);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMove = move;
      }
    }
    
    if (!bestMove) break;
    
    // Update rotation direction for consistency
    if (bestMove.animationType === "ring") {
      ringRotationDirections[bestMove.ringIndex] = bestMove.direction;
    }
    
    // Apply best move
    path.push(bestMove);
    currentMatrix = bestMove.matrix;
    
    // Check if reached goal
    if (matricesAreEqual(currentMatrix, endMatrix)) {
      console.log(`Found direct path with ${path.length} steps`);
      return path;
    }
    
    // If we're getting closer, continue direct path
    // Otherwise, try BFS from here
    if (bestDistance <= 2) {
      const remainingPath = findPathBFS(currentMatrix, endMatrix, 4);
      if (remainingPath) {
        return [...path, ...remainingPath];
      }
    }
  }
  
  console.log(`Direct path approach failed`);
  return null;
};

// Path via canonical intermediate state
const findPathViaCanonical = (startMatrix, endMatrix) => {
  console.log("Trying path via canonical state");
  
  // Reset rotation directions for a clean slate
  resetRotationDirections();
  
  // Find nearest canonical state
  const { canonicalState } = findNearestCanonicalState(endMatrix);
  
  // Find path to canonical state
  const path1 = findPathAStar(startMatrix, canonicalState, 6);
  if (!path1) {
    console.log(`Failed to find path to canonical state`);
    return null;
  }
  
  // Update rotation directions for phase 2
  for (const step of path1) {
    if (step.animationType === "ring") {
      ringRotationDirections[step.ringIndex] = step.direction;
    }
  }
  
  // Find path from canonical to end
  const finalMatrix = path1[path1.length - 1].matrix;
  const path2 = findPathAStar(finalMatrix, endMatrix, 6);
  if (!path2) {
    console.log(`Failed to find path from canonical state to end`);
    return null;
  }
  
  // Combine paths
  console.log(`Found path via canonical state with ${path1.length + path2.length} steps`);
  return [...path1, ...path2];
};

// Main function to calculate transition
export const calculateTransition = (startMatrix, endMatrix) => {
  console.log("calculateTransition - START");
  console.log("Start matrix:", JSON.stringify(startMatrix));
  console.log("End matrix:", JSON.stringify(endMatrix));
  
  // Validate matrices
  if (!isValidMatrix(startMatrix)) {
    console.error("Invalid start matrix");
    return [{ 
      matrix: generateDefaultMatrix(), 
      description: "Error: Invalid start matrix" 
    }];
  }
  
  if (!isValidMatrix(endMatrix)) {
    console.error("Invalid end matrix");
    return [{ 
      matrix: cloneMatrix(startMatrix), 
      description: "Error: Invalid end matrix" 
    }];
  }
  
  // If matrices are equal, no transition needed
  if (matricesAreEqual(startMatrix, endMatrix)) {
    console.log("Start and end matrices are the same. No transition needed.");
    return [];
  }
  
  // Reset rotation directions
  resetRotationDirections();
  
  // Prepare steps array
  const allSteps = [];
  allSteps.push({
    matrix: cloneMatrix(startMatrix),
    description: "Initial arrangement"
  });
  
  // Try different path-finding strategies
  const strategies = [
    { name: "Direct Path", fn: () => findDirectPath(startMatrix, endMatrix, 10) },
    { name: "A*", fn: () => findPathAStar(startMatrix, endMatrix, 10) },
    { name: "BFS", fn: () => findPathBFS(startMatrix, endMatrix, 10) },
    { name: "Via Canonical", fn: () => findPathViaCanonical(startMatrix, endMatrix) }
  ];
  
  for (const strategy of strategies) {
    console.log(`Trying strategy: ${strategy.name}`);
    const path = strategy.fn();
    
    if (path && path.length > 0) {
      console.log(`Found valid path using ${strategy.name}`);
      allSteps.push(...path);
      
      // Update final step description
      if (allSteps.length > 1) {
        allSteps[allSteps.length - 1].description = "Final arrangement reached";
      }
      
      return allSteps;
    }
  }
  
  console.error("Failed to find path between matrices using any strategy");
  return [{ 
    matrix: cloneMatrix(startMatrix), 
    description: "Could not find a valid transition path" 
  }];
};