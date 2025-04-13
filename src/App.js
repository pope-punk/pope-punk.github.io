import { useState, useEffect, useRef } from "react";
import HexagonalChurch from "./components/HexagonalChurch";
import MatrixInput from "./components/MatrixInput";
import { CANONICAL_STATE, isValidMatrix, calculateTransition, generateDefaultMatrix } from "./utils/matrixUtils";
import "./index.css";

// Import custom assets
import buttonIcon from "./assets/pew-icon.png";
import keypadBackground from "./assets/keypad-background.png";
import pressedButton from "./assets/pressed-button.png";
import unpressedButton from "./assets/unpressed-button.png";
import hexagonBackground from "./assets/church-background.png";
import appBackground from "./assets/app-background.png";

function App() {
  // State for matrix input
  const [currentMatrix, setCurrentMatrix] = useState(generateDefaultMatrix());
  const [previousMatrix, setPreviousMatrix] = useState(null);

  // State for animation
  const [transformationSteps, setTransformationSteps] = useState([]);

  // Custom images setup
  const customImages = {
    buttonIcon,
    keypadBackground,
    pressedButton,
    unpressedButton,
    hexagonBackground,
    appBackground,
  };

  // Ref for the canvas
  const canvasRef = useRef(null);

  // Effect to set the app background
  useEffect(() => {
    if (appBackground) {
      document.body.style.backgroundImage = `url(${appBackground})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
    }

    return () => {
      document.body.style.backgroundImage = "none";
    };
  }, []);

  // Handle matrix input submission
  const handleMatrixSubmit = (matrix) => {
    if (!isValidMatrix(matrix)) return;

    // Only process if this is a different matrix than current
    if (JSON.stringify(matrix) !== JSON.stringify(currentMatrix)) {
      // Store the previous matrix for animation
      setPreviousMatrix(currentMatrix);

      // Calculate transformation steps
      const steps = calculateTransition(currentMatrix, matrix);

      // Set the steps and current matrix
      setTransformationSteps(steps);
      setCurrentMatrix(matrix);
    }
  };

  return (
    <div className="app">
      <div className="main-container">
        <div className="church-container">
          <HexagonalChurch
            ref={canvasRef}
            matrix={currentMatrix}
            animationSteps={transformationSteps}
            customImages={customImages}
          />
        </div>

        <div className="input-container">
          <MatrixInput
            initialMatrix={currentMatrix}
            onSubmit={handleMatrixSubmit}
            customImages={customImages}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
