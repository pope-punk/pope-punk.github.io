import { useState, useEffect, useCallback, useRef } from 'react';
import HexagonalChurch from './components/HexagonalChurch';
import VectorInput from './components/VectorInput';
import SequentialVectorInput from './components/SequentialVectorInput';
import ArrangementsList from './components/ArrangementsList';
import ImageUploadControls from './components/ImageUploadControls';
import ExportControls from './components/ExportControls';
import { generateAllValidVectors, isValidVector, findAllArrangements } from './utils/pewArrangements';
import './App.css';

function App() {
  // Start with a known valid vector
  const [currentVector, setCurrentVector] = useState([0, 0, 6, 2, 2, 2]);
  const [arrangements, setArrangements] = useState([]);
  const [validVectors, setValidVectors] = useState([]);
  const [selectedArrangementIndex, setSelectedArrangementIndex] = useState(0);
  const [isMultiplyRealizable, setIsMultiplyRealizable] = useState(false);
  const [inputMode, setInputMode] = useState('sequential'); // 'sequential' or 'direct'
  const [error, setError] = useState('');
  
  // Image customization state
  const [customPewImage, setCustomPewImage] = useState(null);
  const [customBgImage, setCustomBgImage] = useState(null);
  
  // Canvas reference for exporting
  const canvasRef = useRef(null);

  // Use useCallback to ensure this function doesn't change on renders
  const handleArrangementSelect = useCallback((index) => {
    console.log("Selecting arrangement:", index);
    setSelectedArrangementIndex(index);
  }, []);

  // Load all valid vectors once on mount
  useEffect(() => {
    const vectors = generateAllValidVectors();
    setValidVectors(vectors);
    
    // Initialize with arrangements for current vector
    updateArrangements(currentVector);
  }, []);

  // Function to update arrangements when vector changes
  const updateArrangements = (vector) => {
    console.log("Finding arrangements for vector:", vector);
    if (isValidVector(vector)) {
      const allArrangements = findAllArrangements(vector);
      console.log("Found arrangements:", allArrangements.length);
      setArrangements(allArrangements);
      setIsMultiplyRealizable(allArrangements.length > 1);
      // Only reset selection index if there are no arrangements or fewer than before
      if (allArrangements.length === 0 || selectedArrangementIndex >= allArrangements.length) {
        setSelectedArrangementIndex(0);
      }
      setError('');
    } else {
      console.warn("Invalid vector:", vector);
      setArrangements([]);
      setIsMultiplyRealizable(false);
      setError('Invalid vector: Does not satisfy geometric constraints');
    }
  };

  // When currentVector changes, update arrangements
  useEffect(() => {
    updateArrangements(currentVector);
  }, [currentVector]);

  const handleVectorChange = (newVector) => {
    console.log("Vector change requested:", newVector);
    
    if (!newVector || newVector.length !== 6 || newVector.some(v => isNaN(v) || v === null)) {
      console.warn("Incomplete vector:", newVector);
      return; // Don't update with incomplete vectors
    }
    
    // Compare if this is actually a new vector
    const isNewVector = JSON.stringify(newVector) !== JSON.stringify(currentVector);
    
    if (isValidVector(newVector) && isNewVector) {
      console.log("Setting new valid vector:", newVector);
      setCurrentVector(newVector);
      // Reset selection when vector changes
      setSelectedArrangementIndex(0);
    } else if (!isValidVector(newVector)) {
      console.warn("Invalid vector rejected:", newVector);
      setError('Invalid vector: Does not satisfy geometric constraints');
    }
  };

  const handleInputModeChange = (mode) => {
    setInputMode(mode);
    // Clear any errors when switching modes
    setError('');
  };

  // Image upload handlers
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
          <div className="input-toggle">
            <button 
              className={inputMode === 'sequential' ? 'active' : ''} 
              onClick={() => handleInputModeChange('sequential')}
            >
              Sequential Input
            </button>
            <button 
              className={inputMode === 'direct' ? 'active' : ''} 
              onClick={() => handleInputModeChange('direct')}
            >
              Direct Input
            </button>
          </div>
          
          {inputMode === 'sequential' ? (
            <SequentialVectorInput onChange={handleVectorChange} />
          ) : (
            <VectorInput 
              vector={currentVector}
              onChange={handleVectorChange}
              validVectors={validVectors}
            />
          )}
          
          <div className="status">
            <p>Vector: ({currentVector.join(', ')})</p>
            {error ? (
              <p className="error" style={{color: 'red'}}>{error}</p>
            ) : (
              <p>
                Status: {
                  !isValidVector(currentVector) ? 'Invalid Vector' :
                  isMultiplyRealizable ? `Multiply Realizable (${arrangements.length} arrangements)` :
                  'Uniquely Realizable'
                }
              </p>
            )}
          </div>
          
          {arrangements.length > 1 && (
            <ArrangementsList
              arrangements={arrangements}
              selectedIndex={selectedArrangementIndex}
              onSelect={handleArrangementSelect}
            />
          )}
          
          {/* Add the image upload component */}
          <ImageUploadControls 
            onPewImageChange={handlePewImageChange}
            onBgImageChange={handleBgImageChange}
          />
          
          {/* Add the export component */}
          {arrangements.length > 0 && (
            <ExportControls 
              canvasRef={canvasRef}
              vector={currentVector}
            />
          )}
        </div>
        
        <div className="visualization">
          {arrangements.length > 0 && (
            <HexagonalChurch
              ref={canvasRef}
              arrangement={arrangements[selectedArrangementIndex]}
              vector={currentVector}
              customPewImage={customPewImage}
              customBgImage={customBgImage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;