import { useState, useEffect } from 'react';
import { isValidVector } from '../utils/pewArrangements';

const SequentialVectorInput = ({ onChange }) => {
  // State for each component of the vector
  const [r1, setR1] = useState(null);
  const [r2, setR2] = useState(null);
  const [r3, setR3] = useState(null);
  const [d1, setD1] = useState(null);
  const [d2, setD2] = useState(null);
  const [d3, setD3] = useState(null);
  const [error, setError] = useState('');

  // Options for each position
  const [r2Options, setR2Options] = useState([]);
  const [r3Options, setR3Options] = useState([]);
  const [d1Options, setD1Options] = useState([]);
  const [d2Options, setD2Options] = useState([]);
  const [d3Options, setD3Options] = useState([]);

  // Labels for the dropdowns
  const labels = [
    "Innermost Ring",
    "Middle Ring",
    "Outermost Ring",
    "Left-Right Angle Bisector",
    "Top-Left to Bottom-Right Angle Bisector",
    "Top-Right to Bottom-Left Angle Bisector"
  ];

  // Update dropdown options when selections change
  useEffect(() => {
    // When r1 changes, update r2 options
    if (r1 !== null) {
      const remainingSum = 6 - r1;
      // r2 can be 0, 2, 4, 6 but must be <= remainingSum
      setR2Options([0, 2, 4, 6].filter(val => val <= remainingSum));
      setR2(null); // Reset subsequent selections
      setR3(null);
      setD1(null);
      setD2(null);
      setD3(null);
      setError('');
    }
  }, [r1]);

  useEffect(() => {
    // When r2 changes, update r3 options
    if (r1 !== null && r2 !== null) {
      const remainingSum = 6 - r1 - r2;
      // r3 must equal the remaining sum to satisfy r1 + r2 + r3 = 6
      if ([0, 2, 4, 6].includes(remainingSum)) {
        setR3Options([remainingSum]);
        setR3(remainingSum); // Automatically set to the only valid value
      } else {
        setR3Options([]);
        setError('Invalid ring combination: sum must be 6');
      }
      setD1(null);
      setD2(null);
      setD3(null);
    }
  }, [r1, r2]);

  useEffect(() => {
    // When r3 is set, update d1 options
    if (r1 !== null && r2 !== null && r3 !== null) {
      // d1 can be 0, 2, 4, 6
      setD1Options([0, 2, 4, 6]);
      setD1(null);
      setD2(null);
      setD3(null);
      setError('');
    }
  }, [r1, r2, r3]);

  useEffect(() => {
    // When d1 changes, update d2 options
    if (r1 !== null && r2 !== null && r3 !== null && d1 !== null) {
      const remainingSum = 6 - d1;
      // d2 can be 0, 2, 4, 6 but must be <= remainingSum
      setD2Options([0, 2, 4, 6].filter(val => val <= remainingSum));
      setD2(null);
      setD3(null);
      setError('');
    }
  }, [r1, r2, r3, d1]);

  useEffect(() => {
    // When d2 changes, calculate d3 and validate the vector
    if (r1 !== null && r2 !== null && r3 !== null && d1 !== null && d2 !== null) {
      const remainingSum = 6 - d1 - d2;
      
      // Check if the remaining sum is a valid value (0, 2, 4, 6)
      if (![0, 2, 4, 6].includes(remainingSum)) {
        setError('Invalid diagonal combination: sum must be 6');
        setD3Options([]);
        return;
      }
      
      setD3Options([remainingSum]);
      setD3(remainingSum); // Automatically set to the only valid value
    }
  }, [r1, r2, r3, d1, d2]);

  // When all values are selected, update the parent component
  useEffect(() => {
    if (r1 !== null && r2 !== null && r3 !== null && d1 !== null && d2 !== null && d3 !== null) {
      const vectorValues = [r1, r2, r3, d1, d2, d3];
      
      // Check if this forms a geometrically valid vector
      if (isValidVector(vectorValues)) {
        setError('');
        // Notify parent of valid vector
        onChange(vectorValues);
      } else {
        setError('Invalid vector: Geometrically impossible arrangement');
      }
    }
  }, [r1, r2, r3, d1, d2, d3, onChange]);

  // Check if a specific dropdown should be disabled
  const isDisabled = (index) => {
    if (index === 0) return false; // r1 is never disabled
    if (index === 1) return r1 === null;
    if (index === 2) return r1 === null || r2 === null || r3Options.length === 0;
    if (index === 3) return r1 === null || r2 === null || r3 === null;
    if (index === 4) return r1 === null || r2 === null || r3 === null || d1 === null;
    if (index === 5) return r1 === null || r2 === null || r3 === null || d1 === null || d2 === null || d3Options.length === 0;
    return false;
  };

  // Helper function to get current options for a specific index
  const getOptions = (index) => {
    if (index === 0) return [0, 2]; // r1 options are fixed
    if (index === 1) return r2Options;
    if (index === 2) return r3Options;
    if (index === 3) return d1Options;
    if (index === 4) return d2Options;
    if (index === 5) return d3Options;
    return [];
  };

  // Handle change for any dropdown
  const handleChange = (index, value) => {
    if (value === '') return; // Skip empty selections
    const numValue = parseInt(value);
    
    if (index === 0) setR1(numValue);
    else if (index === 1) setR2(numValue);
    else if (index === 2) setR3(numValue);
    else if (index === 3) setD1(numValue);
    else if (index === 4) setD2(numValue);
    else if (index === 5) setD3(numValue);
  };

  // Create a vector state for display purposes
  const vectorState = [r1, r2, r3, d1, d2, d3]; 
  const isComplete = vectorState.every(v => v !== null) && !error;

  return (
    <div className="sequential-vector-input">
      <h3>Build Your Vector</h3>
      
      <div className="dropdowns-container">
        {[0, 1, 2, 3, 4, 5].map(index => (
          <div key={index} className="vector-dropdown">
            <label>
              {labels[index]}:
              <select
                value={vectorState[index] === null ? '' : vectorState[index]}
                onChange={(e) => handleChange(index, e.target.value)}
                disabled={isDisabled(index)}
              >
                <option value="">Select...</option>
                {getOptions(index).map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </div>

      {error && <p className="error" style={{color: 'red'}}>{error}</p>}

      <div className="vector-preview">
        <strong>Vector:</strong> ({
          vectorState.map(v => v === null ? '?' : v).join(', ')
        })
        {isComplete && <div className="complete-badge">Complete ✓</div>}
      </div>
    </div>
  );
};

export default SequentialVectorInput;