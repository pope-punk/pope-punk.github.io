import { useState, useEffect } from 'react';
import { isValidVector } from '../utils/pewArrangements';

const VectorInput = ({ vector, onChange, validVectors }) => {
  const [inputVector, setInputVector] = useState(vector.join(','));
  const [error, setError] = useState('');
  
  // Update local state when parent vector changes
  useEffect(() => {
    setInputVector(vector.join(','));
  }, [vector]);
  
  const handleInputChange = (e) => {
    setInputVector(e.target.value);
    // Clear error when user starts typing
    setError('');
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const newVector = inputVector.split(',').map(num => parseInt(num.trim()));
      
      if (newVector.length !== 6) {
        setError('Vector must have exactly 6 components');
        return;
      }
      
      // Check individual constraints
      const [r1, r2, r3, d1, d2, d3] = newVector;
      
      if (r1 !== 0 && r1 !== 2) {
        setError('First component (innermost ring) must be 0 or 2');
        return;
      }
      
      if (!newVector.every((val, i) => i === 0 ? 
        (val === 0 || val === 2) : 
        (val === 0 || val === 2 || val === 4 || val === 6))) {
        setError('All components must be 0, 2, 4, or 6 (first component only 0 or 2)');
        return;
      }
      
      if (r1 + r2 + r3 !== 6) {
        setError('Ring components (first 3) must sum to 6');
        return;
      }
      
      if (d1 + d2 + d3 !== 6) {
        setError('Diagonal components (last 3) must sum to 6');
        return;
      }
      
      // Check geometric validity
      if (!isValidVector(newVector)) {
        setError('Invalid vector: Geometrically impossible arrangement');
        return;
      }
      
      setError('');
      onChange(newVector);
    } catch (e) {
      setError('Invalid input format. Use comma-separated numbers');
    }
  };
  
  const handleSelectVector = (e) => {
    if (!e.target.value) return;
    
    const selectedVector = validVectors[parseInt(e.target.value)];
    setInputVector(selectedVector.join(','));
    setError('');
    onChange(selectedVector);
  };
  
  return (
    <div className="vector-input">
      <form onSubmit={handleSubmit}>
        <div className="input-row">
          <label>
            Enter vector (r1,r2,r3,d1,d2,d3):
            <input
              type="text"
              value={inputVector}
              onChange={handleInputChange}
              placeholder="0,0,6,2,2,2"
            />
          </label>
          <button type="submit">Update</button>
        </div>
        {error && <p className="error" style={{color: 'red'}}>{error}</p>}
      </form>
      
      <div className="presets">
        <label>
          Select a valid vector:
          <select onChange={handleSelectVector} value="">
            <option value="">-- Select --</option>
            {validVectors.map((vector, index) => (
              <option key={index} value={index}>
                ({vector.join(', ')}) {index < 5 ? ' - Multiply Realizable' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};

export default VectorInput;