import React, { useState, useEffect } from 'react';
import { isValidMatrix } from '../utils/matrixUtils';

const MatrixInput = ({ initialMatrix, onSubmit, customImages }) => {
  const [matrix, setMatrix] = useState([
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ]);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (initialMatrix && Array.isArray(initialMatrix) && initialMatrix.length === 3) {
      setMatrix(initialMatrix);
    }
  }, [initialMatrix]);
  
  const handleCellToggle = (ringIndex, diagIndex) => {
    const newMatrix = JSON.parse(JSON.stringify(matrix));
    newMatrix[ringIndex][diagIndex] = newMatrix[ringIndex][diagIndex] === 0 ? 2 : 0;
    setMatrix(newMatrix);
    setError(''); // Clear any previous error
    
    // Auto-check validity on each toggle
    if (isValidMatrix(newMatrix)) {
      onSubmit(newMatrix);
    }
  };
  
  // Get total pews placed
  const totalPairs = matrix.flat().reduce((sum, val) => sum + (val === 2 ? 1 : 0), 0);
  const innerRingPairs = matrix[0].reduce((sum, val) => sum + (val === 2 ? 1 : 0), 0);
  
  return (
    <div className="matrix-input">
      <div className="matrix-grid">
        {matrix.map((row, ringIndex) => (
          <React.Fragment key={`ring-${ringIndex}`}>
            {row.map((cell, diagIndex) => (
              <button
                key={`cell-${ringIndex}-${diagIndex}`}
                className={`matrix-cell ${cell === 2 ? 'pressed' : ''}`}
                onClick={() => handleCellToggle(ringIndex, diagIndex)}
                type="button"
                aria-label={`Toggle pew at ring ${ringIndex + 1}, diagonal ${diagIndex + 1}`}
                aria-pressed={cell === 2}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
      
      <div className="matrix-status">
        <div>
          {isValidMatrix(matrix) ? 
            <span className="valid-config">Valid Configuration</span> : 
            <span className="invalid-config">{totalPairs === 3 && innerRingPairs <= 1 ? 
              "Arrangement doesn't match church geometry" : 
              `Need ${3-totalPairs} more pair${3-totalPairs !== 1 ? 's' : ''} ${innerRingPairs > 1 ? '(max 1 on inner ring)' : ''}`}
            </span>
          }
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default MatrixInput;