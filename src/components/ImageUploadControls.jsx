import { useState } from 'react';

const ImageUploadControls = ({ onPewImageChange, onBgImageChange }) => {
  const [pewPreview, setPewPreview] = useState(null);
  const [bgPreview, setBgPreview] = useState(null);
  
  const handlePewImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setPewPreview(URL.createObjectURL(file));
        onPewImageChange(img);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };
  
  const handleBgImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setBgPreview(URL.createObjectURL(file));
        onBgImageChange(img);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };
  
  const resetImages = () => {
    setPewPreview(null);
    setBgPreview(null);
    onPewImageChange(null);
    onBgImageChange(null);
  };
  
  return (
    <div className="image-upload-controls">
      <h3>Customize Appearance</h3>
      
      <div className="upload-section">
        <div className="upload-row">
          <label>
            Pew Image:
            <input 
              type="file" 
              accept="image/*"
              onChange={handlePewImageChange}
            />
          </label>
          {pewPreview && (
            <div className="image-preview">
              <img src={pewPreview} alt="Pew Preview" height="40" />
            </div>
          )}
        </div>
        
        <div className="upload-row">
          <label>
            Background Image:
            <input 
              type="file" 
              accept="image/*"
              onChange={handleBgImageChange}
            />
          </label>
          {bgPreview && (
            <div className="image-preview">
              <img src={bgPreview} alt="Background Preview" height="40" />
            </div>
          )}
        </div>
        
        <button 
          className="reset-button"
          onClick={resetImages}
          type="button"
        >
          Reset to Default Images
        </button>
      </div>
    </div>
  );
};

export default ImageUploadControls;