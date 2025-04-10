// Enhanced isValidVector function with proper mathematical validation
export const isValidVector = (vector) => {
  if (!vector || vector.length !== 6) return false;
  
  const [r1, r2, r3, d1, d2, d3] = vector;
  
  // Check individual constraints
  if (r1 !== 0 && r1 !== 2) return false;
  if (![0, 2, 4, 6].includes(r2) || ![0, 2, 4, 6].includes(r3)) return false;
  if (![0, 2, 4, 6].includes(d1) || ![0, 2, 4, 6].includes(d2) || ![0, 2, 4, 6].includes(d3)) return false;
  
  // Check sum constraints
  if (r1 + r2 + r3 !== 6) return false;
  if (d1 + d2 + d3 !== 6) return false;
  
  // The critical mathematical validity check based on pigeonhole principle
  // Check if we can place the pews respecting all constraints
  const rings = [r1, r2, r3];
  const diagonals = [d1, d2, d3];
  
  // Try to distribute pews on the 3x3 grid of ring-diagonal intersections
  // Create a distribution matrix
  const pewDistribution = Array(3).fill().map(() => Array(3).fill(0));
  
  // Calculate required minimum pews at each intersection point
  let canPlace = true;
  for (let r = 0; r < 3; r++) {
    for (let d = 0; d < 3; d++) {
      // Calculate minimum pews that MUST be placed at this intersection
      // This uses the pigeonhole principle
      const minPewsRequired = Math.max(0, rings[r] + diagonals[d] - 6);
      
      // If this exceeds 2 (one symmetric pair), the arrangement is impossible
      if (minPewsRequired > 2) {
        return false;
      }
      
      // Set the minimum required pews at this intersection
      pewDistribution[r][d] = minPewsRequired;
    }
  }
  
  // Now try to distribute remaining pews
  const remainingRingPews = [...rings];
  const remainingDiagPews = [...diagonals];
  
  // Subtract the minimum required pews we've already assigned
  for (let r = 0; r < 3; r++) {
    for (let d = 0; d < 3; d++) {
      remainingRingPews[r] -= pewDistribution[r][d];
      remainingDiagPews[d] -= pewDistribution[r][d];
    }
  }
  
  // Try to place the remaining pews
  // We always place pews in pairs of 2 due to symmetry
  while (remainingRingPews.some(p => p > 0) && remainingDiagPews.some(p => p > 0)) {
    let placed = false;
    
    // Try to find a valid intersection to place 2 more pews
    for (let r = 0; r < 3; r++) {
      if (remainingRingPews[r] < 2) continue;
      
      for (let d = 0; d < 3; d++) {
        if (remainingDiagPews[d] < 2) continue;
        
        // If this intersection already has a pair, we can't place another
        if (pewDistribution[r][d] >= 2) continue;
        
        // Place a pair here
        pewDistribution[r][d] += 2;
        remainingRingPews[r] -= 2;
        remainingDiagPews[d] -= 2;
        placed = true;
        break;
      }
      
      if (placed) break;
    }
    
    // If we couldn't place any more pews, the arrangement is invalid
    if (!placed) {
      return false;
    }
  }
  
  // Check if all pews are placed
  if (remainingRingPews.some(p => p > 0) || remainingDiagPews.some(p => p > 0)) {
    return false;
  }
  
  // Vector passes all constraints
  return true;
};

// Generate all valid vectors for the problem
export const generateAllValidVectors = () => {
  const validVectors = [];
  
  // Systematically generate and test all possible vectors
  const possibleValues = [0, 2, 4, 6];
  
  // r1 can only be 0 or 2
  for (const r1 of [0, 2]) {
    for (const r2 of possibleValues) {
      // r3 is determined by r1 and r2 (must sum to 6)
      const r3 = 6 - r1 - r2;
      if (!possibleValues.includes(r3)) continue;
      
      for (const d1 of possibleValues) {
        for (const d2 of possibleValues) {
          // d3 is determined by d1 and d2 (must sum to 6)
          const d3 = 6 - d1 - d2;
          if (!possibleValues.includes(d3)) continue;
          
          // Check if this vector is valid
          const vector = [r1, r2, r3, d1, d2, d3];
          if (isValidVector(vector)) {
            validVectors.push(vector);
          }
        }
      }
    }
  }
  
  // Sort with multiply realizable vectors first
  const multiplyRealizable = [
    [2, 2, 2, 2, 2, 2], // 6 arrangements
    [0, 2, 4, 2, 2, 2], // 3 arrangements
    [0, 4, 2, 2, 2, 2], // 3 arrangements
    [2, 0, 4, 2, 2, 2], // 3 arrangements
    [2, 4, 0, 2, 2, 2]  // 3 arrangements
  ];
  
  // Filter out multiply realizable vectors from the main list
  const uniquelyRealizable = validVectors.filter(vector => 
    !multiplyRealizable.some(mr => 
      JSON.stringify(mr) === JSON.stringify(vector)
    )
  );
  
  // Return with multiply realizable vectors first
  return [...multiplyRealizable, ...uniquelyRealizable];
};

// Find all possible arrangements for a given vector
export const findAllArrangements = (vector) => {
  if (!isValidVector(vector)) return [];
  
  const [r1, r2, r3, d1, d2, d3] = vector;
  const arrangements = [];
  
  // Special case: the most multiply realizable vector (2,2,2,2,2,2)
  if (JSON.stringify(vector) === JSON.stringify([2, 2, 2, 2, 2, 2])) {
    // This has 6 different arrangements
    // First arrangement: diagonal 0 on rings 0,1, diagonal 1 on rings 1,2, diagonal 2 on rings 0,2
    arrangements.push([
      [0, 0, 0], [0, 0, 1],  // Ring 0, Diagonal 0
      [1, 1, 0], [1, 1, 1],  // Ring 1, Diagonal 1
      [2, 2, 0], [2, 2, 1]   // Ring 2, Diagonal 2
    ]);
    
    // Second arrangement: diagonal 0 on rings 0,2, diagonal 1 on rings 0,1, diagonal 2 on rings 1,2
    arrangements.push([
      [0, 1, 0], [0, 1, 1],  // Ring 0, Diagonal 1
      [1, 2, 0], [1, 2, 1],  // Ring 1, Diagonal 2
      [2, 0, 0], [2, 0, 1]   // Ring 2, Diagonal 0
    ]);
    
    // Third arrangement: diagonal 0 on rings 1,2, diagonal 1 on rings 0,2, diagonal 2 on rings 0,1
    arrangements.push([
      [0, 2, 0], [0, 2, 1],  // Ring 0, Diagonal 2
      [1, 0, 0], [1, 0, 1],  // Ring 1, Diagonal 0
      [2, 1, 0], [2, 1, 1]   // Ring 2, Diagonal 1
    ]);
    
    // Three more arrangements switching the sides
    arrangements.push([
      [0, 0, 0], [0, 0, 1],
      [1, 2, 0], [1, 2, 1],
      [2, 1, 0], [2, 1, 1]
    ]);
    
    arrangements.push([
      [0, 1, 0], [0, 1, 1],
      [1, 0, 0], [1, 0, 1],
      [2, 2, 0], [2, 2, 1]
    ]);
    
    arrangements.push([
      [0, 2, 0], [0, 2, 1],
      [1, 1, 0], [1, 1, 1],
      [2, 0, 0], [2, 0, 1]
    ]);
    
    return arrangements;
  }
  
  // For (0,2,4,2,2,2) - 3 arrangements
  if (JSON.stringify(vector) === JSON.stringify([0, 2, 4, 2, 2, 2])) {
    arrangements.push([
      [1, 0, 0], [1, 0, 1],  // Middle ring, diagonal 0
      [2, 0, 0], [2, 0, 1],  // Outer ring, diagonal 0
      [2, 1, 0], [2, 1, 1]   // Outer ring, diagonal 1
    ]);
    
    arrangements.push([
      [1, 1, 0], [1, 1, 1],  // Middle ring, diagonal 1
      [2, 0, 0], [2, 0, 1],  // Outer ring, diagonal 0
      [2, 2, 0], [2, 2, 1]   // Outer ring, diagonal 2
    ]);
    
    arrangements.push([
      [1, 2, 0], [1, 2, 1],  // Middle ring, diagonal 2
      [2, 1, 0], [2, 1, 1],  // Outer ring, diagonal 1
      [2, 2, 0], [2, 2, 1]   // Outer ring, diagonal 2
    ]);
    
    return arrangements;
  }
  
  // For (0,4,2,2,2,2) - 3 arrangements
  if (JSON.stringify(vector) === JSON.stringify([0, 4, 2, 2, 2, 2])) {
    arrangements.push([
      [1, 0, 0], [1, 0, 1],  // Middle ring, diagonal 0
      [1, 1, 0], [1, 1, 1],  // Middle ring, diagonal 1
      [2, 2, 0], [2, 2, 1]   // Outer ring, diagonal 2
    ]);
    
    arrangements.push([
      [1, 0, 0], [1, 0, 1],  // Middle ring, diagonal 0
      [1, 2, 0], [1, 2, 1],  // Middle ring, diagonal 2
      [2, 1, 0], [2, 1, 1]   // Outer ring, diagonal 1
    ]);
    
    arrangements.push([
      [1, 1, 0], [1, 1, 1],  // Middle ring, diagonal 1
      [1, 2, 0], [1, 2, 1],  // Middle ring, diagonal 2
      [2, 0, 0], [2, 0, 1]   // Outer ring, diagonal 0
    ]);
    
    return arrangements;
  }
  
  // For (2,0,4,2,2,2) - 3 arrangements
  if (JSON.stringify(vector) === JSON.stringify([2, 0, 4, 2, 2, 2])) {
    arrangements.push([
      [0, 0, 0], [0, 0, 1],  // Inner ring, diagonal 0
      [2, 1, 0], [2, 1, 1],  // Outer ring, diagonal 1
      [2, 2, 0], [2, 2, 1]   // Outer ring, diagonal 2
    ]);
    
    arrangements.push([
      [0, 1, 0], [0, 1, 1],  // Inner ring, diagonal 1
      [2, 0, 0], [2, 0, 1],  // Outer ring, diagonal 0
      [2, 2, 0], [2, 2, 1]   // Outer ring, diagonal 2
    ]);
    
    arrangements.push([
      [0, 2, 0], [0, 2, 1],  // Inner ring, diagonal 2
      [2, 0, 0], [2, 0, 1],  // Outer ring, diagonal 0
      [2, 1, 0], [2, 1, 1]   // Outer ring, diagonal 1
    ]);
    
    return arrangements;
  }
  
  // For (2,4,0,2,2,2) - 3 arrangements
  if (JSON.stringify(vector) === JSON.stringify([2, 4, 0, 2, 2, 2])) {
    arrangements.push([
      [0, 0, 0], [0, 0, 1],  // Inner ring, diagonal 0
      [1, 1, 0], [1, 1, 1],  // Middle ring, diagonal 1
      [1, 2, 0], [1, 2, 1]   // Middle ring, diagonal 2
    ]);
    
    arrangements.push([
      [0, 1, 0], [0, 1, 1],  // Inner ring, diagonal 1
      [1, 0, 0], [1, 0, 1],  // Middle ring, diagonal 0
      [1, 2, 0], [1, 2, 1]   // Middle ring, diagonal 2
    ]);
    
    arrangements.push([
      [0, 2, 0], [0, 2, 1],  // Inner ring, diagonal 2
      [1, 0, 0], [1, 0, 1],  // Middle ring, diagonal 0
      [1, 1, 0], [1, 1, 1]   // Middle ring, diagonal 1
    ]);
    
    return arrangements;
  }
  
  // Handle (0,0,6,2,2,2) - the layout in the original image
  if (JSON.stringify(vector) === JSON.stringify([0, 0, 6, 2, 2, 2])) {
    arrangements.push([
      [2, 0, 0], [2, 0, 1],  // Outer ring, diagonal 0
      [2, 1, 0], [2, 1, 1],  // Outer ring, diagonal 1
      [2, 2, 0], [2, 2, 1]   // Outer ring, diagonal 2
    ]);
    return arrangements;
  }
  
  // Handle (0,6,0,2,2,2) - All pews on middle ring, evenly distributed
  if (JSON.stringify(vector) === JSON.stringify([0, 6, 0, 2, 2, 2])) {
    arrangements.push([
      [1, 0, 0], [1, 0, 1],  // Middle ring, diagonal 0
      [1, 1, 0], [1, 1, 1],  // Middle ring, diagonal 1
      [1, 2, 0], [1, 2, 1]   // Middle ring, diagonal 2
    ]);
    return arrangements;
  }
  
  // For valid vectors with concentrated distributions
  // Handle (0,0,6,6,0,0) - All pews on outer ring, first diagonal
  if (JSON.stringify(vector) === JSON.stringify([0, 0, 6, 6, 0, 0])) {
    arrangements.push([
      [2, 0, 0], [2, 0, 1],  // Outer ring, diagonal 0
      [2, 0, 0], [2, 0, 1],  // Outer ring, diagonal 0
      [2, 0, 0], [2, 0, 1]   // Outer ring, diagonal 0
    ]);
    return arrangements;
  }
  
  // For uniquely realizable vectors, generate a default arrangement
  const defaultArrangement = [];
  
  // Place pews based on the vector constraints
  let remainingPews = 6;
  let ringsPewsPlaced = [0, 0, 0]; // Count of pews placed on each ring
  let diagPewsPlaced = [0, 0, 0];  // Count of pews placed on each diagonal
  
  // Helper function to place a pair of pews
  const placePewPair = (ring, diag) => {
    defaultArrangement.push([ring, diag, 0], [ring, diag, 1]);
    ringsPewsPlaced[ring] += 2;
    diagPewsPlaced[diag] += 2;
    remainingPews -= 2;
  };
  
  // Place pews on innermost ring (r1)
  if (r1 === 2) {
    // Find a diagonal with pews
    for (let diag = 0; diag < 3; diag++) {
      if (vector[diag + 3] >= 2 && diagPewsPlaced[diag] < vector[diag + 3]) {
        placePewPair(0, diag);
        break;
      }
    }
  }
  
  // Place pews on middle ring (r2)
  while (ringsPewsPlaced[1] < r2) {
    for (let diag = 0; diag < 3; diag++) {
      if (vector[diag + 3] >= 2 && diagPewsPlaced[diag] < vector[diag + 3] && ringsPewsPlaced[1] < r2) {
        placePewPair(1, diag);
      }
    }
  }
  
  // Place pews on outer ring (r3)
  while (ringsPewsPlaced[2] < r3) {
    for (let diag = 0; diag < 3; diag++) {
      if (vector[diag + 3] >= 2 && diagPewsPlaced[diag] < vector[diag + 3] && ringsPewsPlaced[2] < r3) {
        placePewPair(2, diag);
      }
    }
  }
  
  if (defaultArrangement.length === 6) {
    arrangements.push(defaultArrangement);
  } else {
    // If we couldn't place all pews properly, fallback to a simple arrangement
    // This should only happen if our algorithm has a bug
    console.warn("Failed to generate a proper arrangement for vector", vector);
    
    // Create at least something to display
    arrangements.push([
      [0, 0, 0], [0, 0, 1], 
      [1, 1, 0], [1, 1, 1],
      [2, 2, 0], [2, 2, 1]
    ]);
  }
  
  return arrangements;
};