import { useState, useEffect, useCallback, useRef } from 'react';
import HexagonalChurch from './components/HexagonalChurch';
import VectorInput from './components/VectorInput';
import SequentialVectorInput from './components/SequentialVectorInput';
import ArrangementsList from './components/ArrangementsList';
import ImageUploadControls from './components/ImageUploadControls';
import ExportControls from './components/ExportControls';
import { generateAllValidVectors, isValidVector, findAllArrangements } from './utils/pewArrangements';
import './index.css'; // Use index.css for main styles as per structure

function App() {
  // Start with a known valid vector from the generated list or a default
  const initialVectors = generateAllValidVectors();
  const defaultVector = initialVectors.length > 0 ? initialVectors[0] : [2, 2, 2, 2, 2, 2]; // Fallback if generation fails

  const [currentVector, setCurrentVector] = useState(defaultVector);
  const [arrangements, setArrangements] = useState([]);
  const [validVectors] = useState(initialVectors); // Set once
  const [selectedArrangementIndex, setSelectedArrangementIndex] = useState(0);
  const [isMultiplyRealizable, setIsMultiplyRealizable] = useState(false);
  const [inputMode, setInputMode] = useState('sequential'); // 'sequential' or 'direct'
  const [statusMessage, setStatusMessage] = useState(''); // Consolidated status/error message

  const [customPewImage, setCustomPewImage] = useState(null);
  const [customBgImage, setCustomBgImage] = useState(null);

  // Ref for the canvas, passed down to HexagonalChurch
  const canvasRef = useRef(null);

  // Memoized function to update arrangements based on a vector
  const updateArrangements = useCallback((vector) => {
    console.log("Attempting to find arrangements for vector:", vector);
    if (isValidVector(vector)) {
      const allArrangements = findAllArrangements(vector);
      console.log(`Found ${allArrangements.length} arrangements.`);
      setArrangements(allArrangements);
      setIsMultiplyRealizable(allArrangements.length > 1);

      // Reset selection index if it becomes invalid
      setSelectedArrangementIndex(prevIndex =>
        allArrangements.length > 0 && prevIndex < allArrangements.length ? prevIndex : 0
      );

      // Update status message
      if (allArrangements.length === 0) {
          setStatusMessage('Valid vector, but no specific arrangements found (check findAllArrangements logic).');
      } else if (allArrangements.length > 1) {
          setStatusMessage(`Multiply Realizable (${allArrangements.length} arrangements)`);
      } else {
          setStatusMessage('Uniquely Realizable');
      }

    } else {
      console.warn("Invalid vector provided:", vector);
      setArrangements([]); // Clear arrangements for invalid vector
      setIsMultiplyRealizable(false);
      setSelectedArrangementIndex(0);
      setStatusMessage('Invalid vector: Does not meet constraints.');
    }
  }, []); // No dependencies needed as it uses args or sets state

  // Initial arrangement calculation on mount
  useEffect(() => {
    updateArrangements(currentVector);
  }, [updateArrangements]); // Run once on mount with initial vector


  // Handler for vector changes from input components
  const handleVectorChange = useCallback((newVector) => {
    console.log("Vector change requested:", newVector);

    // Basic validation of the input structure
    if (!Array.isArray(newVector) || newVector.length !== 6 || newVector.some(v => typeof v !== 'number' || isNaN(v))) {
      setStatusMessage('Invalid input format for vector.');
      console.warn("Incomplete or badly formatted vector received:", newVector);
      return; // Don't proceed with invalid format
    }

    // Check if the vector is actually different before updating
    if (JSON.stringify(newVector) !== JSON.stringify(currentVector)) {
       console.log("Setting new vector:", newVector);
       setCurrentVector(newVector); // Update the current vector state
       updateArrangements(newVector); // Trigger arrangement update
    } else {
       console.log("Vector is the same as current, no update needed.");
       // Ensure status reflects current vector validity if input is re-submitted
       if (!isValidVector(newVector)) {
            setStatusMessage('Invalid vector: Does not meet constraints.');
       }
    }
  }, [currentVector, updateArrangements]); // Dependencies: currentVector for comparison, updateArrangements function


  // Handler for selecting a specific arrangement
  const handleArrangementSelect = useCallback((index) => {
    console.log("Selecting arrangement index:", index);
     if (index >= 0 && index < arrangements.length) {
        setSelectedArrangementIndex(index);
     } else {
        console.warn(`Attempted to select invalid arrangement index: ${index}`);
     }
  }, [arrangements.length]); // Dependency: arrangements.length to validate index


  const handleInputModeChange = (mode) => {
    setInputMode(mode);
    // Optionally reset status when changing modes if desired
    // setStatusMessage('');
  };

  const handlePewImageChange = (imageObj) => {
    setCustomPewImage(imageObj);
  };

  const handleBgImageChange = (imageObj) => {
    setCustomBgImage(imageObj);
  };

  return (
    <div className="app">
      <h1>Hexagonal Church Pew Arrangement</h1>

      <div className="main-container">
        <div className="controls">
          {/* Input Mode Toggle */}
          <div className="input-toggle">
            <button
              className={inputMode === 'sequential' ? 'active' : ''}
              onClick={() => handleInputModeChange('sequential')}
              type="button"
            >
              Sequential Input
            </button>
            <button
              className={inputMode === 'direct' ? 'active' : ''}
              onClick={() => handleInputModeChange('direct')}
              type="button"
            >
              Direct Input
            </button>
          </div>

          {/* Vector Input Component */}
          {inputMode === 'sequential' ? (
            <SequentialVectorInput onChange={handleVectorChange} />
          ) : (
            <VectorInput
              vector={currentVector}
              onChange={handleVectorChange}
              validVectors={validVectors}
            />
          )}

          {/* Status Display */}
          <div className="status">
            <p>Current Vector: ({currentVector.join(', ')})</p>
            {statusMessage && ( // Display status message if not empty
                 <p className={statusMessage.startsWith('Invalid') ? 'error' : ''}>
                    Status: {statusMessage}
                 </p>
             )}
          </div>

          {/* Arrangements List (only if multiple exist) */}
          {arrangements.length > 1 && (
            <ArrangementsList
              arrangements={arrangements}
              selectedIndex={selectedArrangementIndex}
              onSelect={handleArrangementSelect}
            />
          )}

          {/* Image Upload Controls */}
          <ImageUploadControls
            onPewImageChange={handlePewImageChange}
            onBgImageChange={handleBgImageChange}
          />

          {/* Export Controls (only if valid arrangement exists) */}
          {arrangements.length > 0 && arrangements[selectedArrangementIndex] && (
            <ExportControls
              canvasRef={canvasRef} // Pass the ref here
              vector={currentVector}
            />
          )}
        </div>

        <div className="visualization">
          {/* Conditional Rendering: Ensure valid arrangement before rendering */}
          {arrangements.length > 0 && arrangements[selectedArrangementIndex] ? (
            <HexagonalChurch
              ref={canvasRef} // Pass the ref to the component
              arrangement={arrangements[selectedArrangementIndex]}
              vector={currentVector}
              customPewImage={customPewImage}
              customBgImage={customBgImage}
            />
          ) : (
             // Provide feedback if no arrangement can be displayed
             <p>No valid arrangement to display for the current vector.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;