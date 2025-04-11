import { useState } from 'react';

const ExportControls = ({ canvasRef, vector }) => {
  const [exportFormat, setExportFormat] = useState('png');
  const [exporting, setExporting] = useState(false);
  
  const handleExport = () => {
    if (!canvasRef.current) return;
    
    setExporting(true);
    
    try {
      const canvas = canvasRef.current;
      let dataUrl;
      
      if (exportFormat === 'png') {
        dataUrl = canvas.toDataURL('image/png');
      } else if (exportFormat === 'jpg') {
        dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      } else {
        // SVG export would require more complex implementation
        alert('SVG export is not supported yet');
        setExporting(false);
        return;
      }
      
      // Create a downloadable link
      const link = document.createElement('a');
      link.download = `church-arrangement-${vector.join('-')}.${exportFormat}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + error.message);
    } finally {
      setExporting(false);
    }
  };
  
  return (
    <div className="export-controls">
      <h3>Export Arrangement</h3>
      
      <div className="export-options">
        <div className="format-selection">
          <label>
            <input 
              type="radio" 
              name="format" 
              value="png" 
              checked={exportFormat === 'png'} 
              onChange={() => setExportFormat('png')}
            />
            PNG
          </label>
          
          <label>
            <input 
              type="radio" 
              name="format" 
              value="jpg" 
              checked={exportFormat === 'jpg'} 
              onChange={() => setExportFormat('jpg')}
            />
            JPEG
          </label>
        </div>
        
        <button 
          className="export-button"
          onClick={handleExport}
          disabled={exporting}
          type="button"
        >
          {exporting ? 'Exporting...' : 'Export Arrangement'}
        </button>
      </div>
    </div>
  );
};

export default ExportControls;