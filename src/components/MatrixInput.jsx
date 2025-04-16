import React, { forwardRef, useImperativeHandle, useState } from 'react';

// Import the specific button images if needed as fallbacks
import defaultUnpressedButton from '../assets/unpressed-button.png'; 
import defaultPressedButton from '../assets/pressed-button.png'; 

// Receive matrix and onToggle function as props
const MatrixInput = forwardRef(({ matrix, onToggle, customImages }, ref) => {
    
  // State only for highlighting active button (if needed)
  const [activeButton, setActiveButton] = useState(null); 

  // Expose methods related to highlighting (if App still uses them)
  useImperativeHandle(ref, () => ({
     setActiveButton: (buttonData) => {
       setActiveButton(buttonData);
     },
     clearHighlight: () => { 
          setActiveButton(null);
     }
  }));

  // When a cell is clicked, call the onToggle prop passed from App.js
  const handleCellToggle = (ringIndex, diagIndex) => {
    if (onToggle) {
      onToggle(ringIndex, diagIndex);
    }
  };

  // Determine which image assets to use
  const keypadBg = customImages?.keypadBackground; 
  const unpressedImg = customImages?.unpressedButton || defaultUnpressedButton;
  const pressedImg = customImages?.pressedButton || defaultPressedButton;

  const keypadStyle = keypadBg ? { backgroundImage: `url(${keypadBg})` } : {};

  // Ensure matrix is a valid 2D array before trying to map it
  if (!Array.isArray(matrix) || matrix.length !== 3 || !matrix.every(row => Array.isArray(row) && row.length === 3)) {
      console.error("MatrixInput received invalid matrix prop:", matrix);
      // Render nothing or a placeholder if matrix is invalid
      return <div className="matrix-input" style={keypadStyle}>Error: Invalid matrix data</div>; 
  }

  return (
    <div className="matrix-input" style={keypadStyle}>
      <div className="matrix-grid">
        {/* Render based on the matrix prop from App.js */}
        {matrix.map((row, ringIndex) => (
          <div key={`ring-${ringIndex}`} className="matrix-row">
            {row.map((cell, diagIndex) => {
              const isPressed = cell === 2;
              const isActive = activeButton &&
                              activeButton.ring === ringIndex &&
                              activeButton.diagonal === diagIndex;
              const buttonStateImage = isPressed ? pressedImg : unpressedImg;
              
              return (
                <button
                  key={`cell-${ringIndex}-${diagIndex}`}
                  className={`matrix-cell ${isPressed ? 'pressed' : ''} ${isActive ? 'active' : ''}`}
                  onClick={() => handleCellToggle(ringIndex, diagIndex)}
                  type="button"
                  aria-label={`Toggle pew at ring ${ringIndex + 1}, diagonal ${diagIndex + 1}`}
                  aria-pressed={isPressed}
                >
                   <img 
                     src={buttonStateImage} 
                     alt={isPressed ? "Pew Placed" : "Empty Slot"} 
                     className="button-state-icon" 
                   />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

MatrixInput.displayName = 'MatrixInput'; 

export default MatrixInput;