// Matrix utility functions for hexagonal church pew arrangements

// Define canonical reset state - all pews on outer ring
export const CANONICAL_STATE = [
  [0, 0, 0], // innermost ring
  [0, 0, 0], // middle ring
  [2, 2, 2]  // outermost ring
];

// Validate a matrix configuration
export const isValidMatrix = (matrix) => {
  if (!matrix || !Array.isArray(matrix) || matrix.length !== 3) return false;
  
  // Check each row is valid
  for (let r = 0; r < 3; r++) {
    if (!Array.isArray(matrix[r]) || matrix[r].length !== 3) return false;
    for (let d = 0; d < 3; d++) {
      if (matrix[r][d] !== 0 && matrix[r][d] !== 2) return false;
    }
  }
  
  // Count total pews
  const totalPews = matrix.flat().reduce((sum, val) => sum + val, 0);
  if (totalPews !== 6) return false;
  
  // Check innermost ring constraint (at most one pair)
  const innerRingTotal = matrix[0].reduce((sum, val) => sum + val, 0);
  if (innerRingTotal > 2) return false;
  
  return true;
};

// Calculate transition steps between two matrices
export const calculateTransition = (startMatrix, endMatrix) => {
  if (!isValidMatrix(startMatrix) || !isValidMatrix(endMatrix)) {
    return [];
  }
  
  const steps = [];
  
  // Step 1: Save the initial state
  steps.push({
    matrix: JSON.parse(JSON.stringify(startMatrix)),
    description: "Initial arrangement"
  });
  
  // Step 2: Transition to canonical state (all pews on outer ring)
  const toCanonicalSteps = transitionToCanonical(startMatrix);
  steps.push(...toCanonicalSteps);
  
  // Step 3: Transition from canonical to target state
  const fromCanonicalSteps = transitionFromCanonical(CANONICAL_STATE, endMatrix);
  steps.push(...fromCanonicalSteps);
  
  return steps;
};

// Helper to move pews to canonical state (all on outer ring)
const transitionToCanonical = (matrix) => {
  const steps = [];
  const currentMatrix = JSON.parse(JSON.stringify(matrix));
  
  // Move pews from inner ring to middle ring
  for (let d = 0; d < 3; d++) {
    if (currentMatrix[0][d] === 2) {
      currentMatrix[0][d] = 0;
      currentMatrix[1][d] = 2;
      steps.push({
        matrix: JSON.parse(JSON.stringify(currentMatrix)),
        description: `Move pew from inner ring to middle ring at diagonal ${d}`
      });
    }
  }
  
  // Move pews from middle ring to outer ring
  for (let d = 0; d < 3; d++) {
    if (currentMatrix[1][d] === 2) {
      currentMatrix[1][d] = 0;
      currentMatrix[2][d] = 2;
      steps.push({
        matrix: JSON.parse(JSON.stringify(currentMatrix)),
        description: `Move pew from middle ring to outer ring at diagonal ${d}`
      });
    }
  }
  
  // Make sure outer ring has all 3 pairs
  let missingDiagonals = [];
  for (let d = 0; d < 3; d++) {
    if (currentMatrix[2][d] !== 2) {
      missingDiagonals.push(d);
    }
  }
  
  // Redistribute outer ring pews if needed
  if (missingDiagonals.length > 0) {
    let extraDiagonals = [];
    for (let d = 0; d < 3; d++) {
      if (currentMatrix[2][d] > 2) {
        extraDiagonals.push(d);
      }
    }
    
    for (let i = 0; i < Math.min(missingDiagonals.length, extraDiagonals.length); i++) {
      currentMatrix[2][extraDiagonals[i]] -= 2;
      currentMatrix[2][missingDiagonals[i]] = 2;
      steps.push({
        matrix: JSON.parse(JSON.stringify(currentMatrix)),
        description: `Rotate pew on outer ring from diagonal ${extraDiagonals[i]} to diagonal ${missingDiagonals[i]}`
      });
    }
  }
  
  // If we reached canonical state, add a step
  if (JSON.stringify(currentMatrix) === JSON.stringify(CANONICAL_STATE)) {
    steps.push({
      matrix: JSON.parse(JSON.stringify(CANONICAL_STATE)),
      description: "Reached canonical arrangement (all pews on outer ring)"
    });
  }
  
  return steps;
};

// Helper to move from canonical state to target state
const transitionFromCanonical = (canonicalMatrix, targetMatrix) => {
  const steps = [];
  const currentMatrix = JSON.parse(JSON.stringify(canonicalMatrix));
  
  // Move pews from outer ring to middle ring
  for (let d = 0; d < 3; d++) {
    if (targetMatrix[1][d] === 2 && currentMatrix[1][d] !== 2) {
      currentMatrix[2][d] = 0;
      currentMatrix[1][d] = 2;
      steps.push({
        matrix: JSON.parse(JSON.stringify(currentMatrix)),
        description: `Move pew from outer ring to middle ring at diagonal ${d}`
      });
    }
  }
  
  // Move pews from middle ring to inner ring
  for (let d = 0; d < 3; d++) {
    if (targetMatrix[0][d] === 2 && currentMatrix[0][d] !== 2) {
      currentMatrix[1][d] = 0;
      currentMatrix[0][d] = 2;
      steps.push({
        matrix: JSON.parse(JSON.stringify(currentMatrix)),
        description: `Move pew from middle ring to inner ring at diagonal ${d}`
      });
    }
  }
  
  // Add a final step showing the target arrangement
  if (JSON.stringify(currentMatrix) !== JSON.stringify(targetMatrix)) {
    steps.push({
      matrix: JSON.parse(JSON.stringify(targetMatrix)),
      description: "Final arrangement reached"
    });
  }
  
  return steps;
};

// Get a descriptive name for each position in the matrix
export const getPositionName = (ring, diagonal) => {
  const ringNames = ["Inner", "Middle", "Outer"];
  const diagonalNames = ["Horizontal", "Top-Right to Bottom-Left", "Top-Left to Bottom-Right"];
  
  return `${ringNames[ring]} Ring, ${diagonalNames[diagonal]} Diagonal`;
};

// Generate a default matrix with positions
export const generateDefaultMatrix = () => {
  return JSON.parse(JSON.stringify(CANONICAL_STATE));
};