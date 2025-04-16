import React, { useState, useEffect, useRef } from "react";
import HexagonalChurch from "./components/HexagonalChurch";
// Make sure you are using the controlled component version of MatrixInput provided previously
import MatrixInput from "./components/MatrixInput"; 
import {
  isValidMatrix,
  calculateTransition,
  generateDefaultMatrix,
} from "./utils/matrixUtils";

// Import custom assets (ensure paths are correct)
import buttonIcon from "./assets/pew-icon.png"; // Pew icon for church
import keypadBackground from "./assets/keypad-background.png";
import pressedButton from "./assets/pressed-button.png"; // Bust Icon (Pressed)
import unpressedButton from "./assets/unpressed-button.png"; // Bust Icon (Unpressed)
import hexagonBackground from "./assets/church-background.png";
import appBackground from "./assets/app-background.png";

function App() {
  // State for the *last applied* valid matrix configuration (used by HexagonalChurch)
  const [currentMatrix, setCurrentMatrix] = useState(generateDefaultMatrix());
  // State for the matrix *currently shown* on the keypad (user's selection)
  const [selectedMatrix, setSelectedMatrix] = useState(currentMatrix); 
  // State for the validation status (determined only on button click)
  const [isInputValid, setIsInputValid] = useState(true); // Start as valid
  const [inputError, setInputError] = useState(''); // Error message

  // Animation state
  const [transformationSteps, setTransformationSteps] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Refs
  const canvasRef = useRef(null);
  const matrixInputRef = useRef(null); // For highlighting or potentially other methods if needed

  const customImages = {
    buttonIcon: buttonIcon, 
    keypadBackground,
    pressedButton,       
    unpressedButton,     
    hexagonBackground,
    appBackground,
  };

  // Effect for body background
  useEffect(() => {
    if (appBackground) {
      document.body.style.backgroundImage = `url(${appBackground})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
    }
    return () => { document.body.style.backgroundImage = "none"; };
  }, []); 

 // In src/App.js
  // Handler for when a button is toggled in MatrixInput (Updates selectedMatrix ONLY)
  const handleMatrixToggle = (ringIndex, diagIndex) => {
      console.log(`--- handleMatrixToggle ENTERED for r${ringIndex},d${diagIndex} ---`); // Keep entry log
      if (isAnimating) return; // Don't allow changes while animating

      setSelectedMatrix(prevMatrix => {
          console.log(`setSelectedMatrix updater: r${ringIndex},d${diagIndex}. Prev State:`, JSON.stringify(prevMatrix)); // Keep prev log
          
          // Ensure prevMatrix is valid structure before cloning, default if not
          const currentValidMatrix = (Array.isArray(prevMatrix) && prevMatrix.length === 3 && prevMatrix.every(r => Array.isArray(r) && r.length === 3)) 
                                   ? prevMatrix 
                                   : generateDefaultMatrix(); 
          // console.log(`setSelectedMatrix updater: Using baseMatrix:`, JSON.stringify(currentValidMatrix)); // Optional: keep if needed

          const newMatrix = JSON.parse(JSON.stringify(currentValidMatrix)); // Clone
          
          if (newMatrix[ringIndex]?.[diagIndex] !== undefined) {
             const oldValue = newMatrix[ringIndex][diagIndex];
             newMatrix[ringIndex][diagIndex] = oldValue === 0 ? 2 : 0; // Toggle logic
             console.log(`setSelectedMatrix updater: Toggled [${ringIndex}][${diagIndex}] from ${oldValue} to ${newMatrix[ringIndex][diagIndex]}`);
          } else { 
              console.error(`Invalid indices received from toggle: ring ${ringIndex}, diag ${diagIndex}`);
              return prevMatrix; // Return previous matrix without changes if indices invalid
          }

          // *** REVERTED LOGIC: Reset validity/error optimistically on toggle ***
          setIsInputValid(true); 
          setInputError('');
          // *******************************************************************

          console.log(`setSelectedMatrix updater END: r${ringIndex},d${diagIndex}. Resulting New State:`, JSON.stringify(newMatrix)); // Keep new state log
          return newMatrix; // Return the toggled matrix state
      });
  };


  // Handler for when the "Apply Configuration" button is clicked (when input is valid)
  const handleApplyConfiguration = () => {
      if (isAnimating) return; 
      
      console.log("Apply button clicked. Current selectedMatrix:", JSON.stringify(selectedMatrix));
      console.log("Current currentMatrix state:", JSON.stringify(currentMatrix));

      // 1. Validate the current selection again
      console.log(">>> BEFORE isValidMatrix call"); // Log before call
      const isValid = isValidMatrix(selectedMatrix);
      console.log("<<< AFTER isValidMatrix call. Result:", isValid); // Log result immediately

      // Set state based *only* on this result
      setIsInputValid(isValid); 

      if (isValid) {
          // **** ADD LOG INSIDE VALID BLOCK ****
          console.log("handleApplyConfiguration: Entering VALID block."); 
          // ***********************************
          setInputError(''); 

          // 2. Check if different from current state
          if (JSON.stringify(selectedMatrix) !== JSON.stringify(currentMatrix)) {
              console.log("Valid and different matrix submitted, calculating transition...");
              let steps = [];
              try {
                  // **** Wrap the potentially failing call ****
                  steps = calculateTransition(currentMatrix, selectedMatrix); 
                  // **** Log immediately after if it DOESN'T throw ****
                  console.log("calculateTransition finished, returned steps:", steps); 

              } catch (error) {
                  // **** Catch and log any internal error ****
                  console.error("!!! Error occurred INSIDE calculateTransition:", error);
                  setInputError("Error during transition calculation."); // Show user-friendly error
                  setIsInputValid(false); // Mark state as invalid because calculation failed
                  steps = []; // Ensure steps is empty/invalid
              }

              // 3. Check the result (steps array)
              if (!steps || steps.length <= 1) { // Need initial state + at least one move step
                   console.error("calculateTransition did not return sufficient steps!", steps); 
                   // Only set error if the catch block didn't already set one
                   if (isInputValid) { // Check if try block succeeded but returned bad steps
                       setInputError("Failed to calculate valid transition path."); 
                       setIsInputValid(false); // Mark invalid if path fails
                   }
              } else { 
                  // 4. Proceed with animation state updates
                  console.log("Setting state for animation...");
                  setTransformationSteps(steps); 
                  setCurrentMatrix(selectedMatrix); // Apply the valid selection
                  setIsAnimating(true);
                  matrixInputRef.current?.clearHighlight(); 
              }
          } else {
              console.log("Submitted matrix is the same as current matrix. No change needed.");
              setInputError("Configuration already applied."); 
              setIsInputValid(true); // Ensure valid state
              setTimeout(() => { if (!isAnimating) setInputError(''); }, 1500); 
          }
      } else {
          // **** ADD LOG INSIDE INVALID BLOCK ****
          console.log("handleApplyConfiguration: Entering INVALID block."); 
          // **************************************

          // 5. If invalid: JUST set error message. Reset is handled by handleResetInput.
          console.log("Selected matrix is invalid according to isValidMatrix check."); 
          const totalPairs = selectedMatrix ? selectedMatrix.flat().reduce((sum, val) => sum + (val === 2 ? 1 : 0), 0) : 0;
          const innerRingPairs = selectedMatrix?.[0] ? selectedMatrix[0].reduce((sum, val) => sum + (val === 2 ? 1 : 0), 0) : 0;
          
          if (!selectedMatrix) { setInputError("Invalid matrix state."); }
          else if (totalPairs !== 3) { setInputError(`Need ${3 - totalPairs} more pair${3 - totalPairs !== 1 ? 's' : ''} (total must be 3)`); }
          else if (innerRingPairs > 1) { setInputError("Maximum 1 pair on inner ring"); }
          else { setInputError("Arrangement doesn't match church geometry"); }
      }
  };

  // Handler for when the "Reset Invalid Input" button is clicked
  const handleResetInput = () => {
      if (isAnimating) return; // Should be disabled anyway, but safe check
      console.log("Reset button clicked. Resetting selectedMatrix to last valid currentMatrix:", JSON.stringify(currentMatrix));
      setSelectedMatrix(currentMatrix); // Reset selection display to last applied valid state
      setIsInputValid(true);           // Reset validity state to true (now showing valid state)
      setInputError('');              // Clear the error message
      matrixInputRef.current?.clearHighlight(); 
  };

  // Handle animation step completion from HexagonalChurch
  const handleStepComplete = (stepIndex) => {
     matrixInputRef.current?.clearHighlight(); 

    if (stepIndex === -1) { // Animation sequence finished completely
      setIsAnimating(false);
      console.log("Animation finished.");
    } else {
       // Logic during the pause between steps (optional highlighting could go here)
       console.log("Step completed, pause begins:", transformationSteps?.[stepIndex]?.description);
    }
  };

  // Debugging log before render
  console.log("App rendering - selectedMatrix:", JSON.stringify(selectedMatrix), "currentMatrix:", JSON.stringify(currentMatrix), "isInputValid:", isInputValid);

  return (
    <div className="app-layout">
      <div className="keypad-column">
        {/* Status Display (Uses App's state) */}
        <div className="matrix-status">
          <div>
            {inputError ? 
                <span className="invalid-config">{inputError}</span> :
                (isInputValid ? 
                    <span className="valid-config">Valid Configuration</span> :
                    <span className="invalid-config">Input Invalid</span> // Changed message slightly
                )
            }
          </div>
        </div>

        {/* Matrix Input Component (Controlled) */}
        <MatrixInput
          ref={matrixInputRef}
          matrix={selectedMatrix} // Display the currently selected matrix
          onToggle={handleMatrixToggle} // Notify App of user clicks
          customImages={customImages}
        />

        {/* Go / Reset Button */}
        <div className="action-buttons">
          <button
            className={`go-button ${isInputValid ? 'valid' : 'invalid'}`} 
            // Conditionally call the correct handler based on current validity state
            onClick={isInputValid ? handleApplyConfiguration : handleResetInput}
            type="button"
            disabled={isAnimating} 
          >
             {/* Text changes based on validity state */}
             {isInputValid ? "Apply Configuration" : "Reset Invalid Input"} 
          </button>
        </div>
      </div>

      <div className="church-column">
        <HexagonalChurch
          ref={canvasRef}
          matrix={currentMatrix} // Church base state is always the last valid applied matrix
          animationSteps={transformationSteps}
          customImages={customImages}
          onStepComplete={handleStepComplete} 
          isAnimating={isAnimating} // Pass animating state down
        />
      </div>
    </div>
  );
}

export default App;