import { useRef, useEffect, useState, forwardRef } from 'react';
// Update image paths to use assets directory
import defaultPewImage from '../assets/pew-icon.png';
import defaultChurchBackground from '../assets/church-background.png';

const HexagonalChurch = forwardRef(({ arrangement, vector, customPewImage, customBgImage }, ref) => {
  const canvasRef = useRef(null);
  const [pewImg, setPewImg] = useState(null);
  const [bgImg, setBgImg] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  
  // Load the default pew image if no custom image is provided
  useEffect(() => {
    if (customPewImage) {
      setPewImg(customPewImage);
    } else {
      const img = new Image();
      img.src = defaultPewImage;
      img.onload = () => {
        setPewImg(img);
      };
      img.onerror = (e) => {
        console.error("Failed to load default pew image:", e);
      };
    }
  }, [customPewImage]);
  
  // Load the default background image if no custom image is provided
  useEffect(() => {
    if (customBgImage) {
      setBgImg(customBgImage);
    } else {
      const img = new Image();
      img.src = defaultChurchBackground;
      img.onload = () => {
        setBgImg(img);
      };
      img.onerror = (e) => {
        console.error("Failed to load default background image:", e);
      };
    }
  }, [customBgImage]);
  
  // Render the canvas whenever the arrangement or images change
  useEffect(() => {
    if (!canvasRef.current || !arrangement) return;
    if (isRendering) return; // Prevent re-entrancy
    
    setIsRendering(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the church
    drawHexagonalChurch(ctx, canvas.width, canvas.height, bgImg);
    
    // Draw the pews based on the arrangement
    drawPews(ctx, arrangement, canvas.width, canvas.height, pewImg);
    
    // Draw legend
    drawLegend(ctx, vector, canvas.width, canvas.height);
    
    setIsRendering(false);
  }, [arrangement, vector, pewImg, bgImg, canvasRef]);
  
  return (
    <div className="church-visualization">
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={600} 
        className="church-canvas"
      />
    </div>
  );
});

// Helper functions to draw the church and pews
const drawHexagonalChurch = (ctx, width, height, backgroundImage) => {
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Calculate hexagon vertices
  const hexSize = Math.min(width, height) * 0.45;
  const hexPoints = [];
  
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i; // 30 degree rotation is built in
    const x = centerX + hexSize * Math.cos(angle);
    const y = centerY + hexSize * Math.sin(angle);
    hexPoints.push({ x, y });
  }
  
  // Draw hexagonal outline
  ctx.beginPath();
  hexPoints.forEach((point, i) => {
    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.closePath();
  
  // Fill with background image or default color
  if (backgroundImage) {
    try {
      // Create a clipping path for the hexagon
      ctx.save();
      ctx.clip();
      
      // Calculate how to fit the image within the hexagon
      const imageAspect = backgroundImage.width / backgroundImage.height;
      const hexAspect = width / height;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imageAspect > hexAspect) {
        // Image is wider than hexagon
        drawHeight = height;
        drawWidth = drawHeight * imageAspect;
        drawX = centerX - drawWidth / 2;
        drawY = 0;
      } else {
        // Image is taller than hexagon
        drawWidth = width;
        drawHeight = drawWidth / imageAspect;
        drawX = 0;
        drawY = centerY - drawHeight / 2;
      }
      
      // Draw the background image
      ctx.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();
    } catch (e) {
      console.error("Error drawing background image:", e);
      ctx.fillStyle = '#e0d8c0'; // Fallback color
      ctx.fill();
    }
  } else {
    // Use default color
    ctx.fillStyle = '#e0d8c0';
    ctx.fill();
  }
  
  // Draw the hexagon outline
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 5;
  ctx.stroke();
  
  // Draw concentric rings
  const ringRadii = [hexSize * 0.25, hexSize * 0.6, hexSize * 0.85];
  ringRadii.forEach(radius => {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  
  // Draw angle bisectors
  for (let i = 0; i < 3; i++) {
    // Each angle bisector connects opposite vertices
    const angle = (Math.PI / 3) * i; // 0, 60, 120 degrees
    ctx.beginPath();
    ctx.moveTo(centerX - hexSize * Math.cos(angle), centerY - hexSize * Math.sin(angle));
    ctx.lineTo(centerX + hexSize * Math.cos(angle), centerY + hexSize * Math.sin(angle));
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Draw center point
  ctx.beginPath();
  ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#444';
  ctx.fill();
};

const drawPews = (ctx, arrangement, width, height, pewImage) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const hexSize = Math.min(width, height) * 0.45;
  const ringRadii = [hexSize * 0.25, hexSize * 0.6, hexSize * 0.85];
  const pewWidth = 25;
  const pewHeight = 15;
  
  // Loop through the arrangement and draw each pew
  arrangement.forEach(pew => {
    const [ringIndex, diagonalIndex, side] = pew;
    const radius = ringRadii[ringIndex];
    // Adjust angle calculation for rotated hexagon
    const angle = (Math.PI / 3) * diagonalIndex + (side === 0 ? Math.PI : 0);
    
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    
    if (pewImage) {
      try {
        // Draw the custom pew image
        const imgWidth = pewWidth * 4.2; // Make slightly larger than default pew
        const imgHeight = pewHeight * 4.2;
        ctx.drawImage(pewImage, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
      } catch (e) {
        console.error("Error drawing pew image:", e);
        // Fallback to default pew
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-pewWidth / 2, -pewHeight / 2, pewWidth, pewHeight);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(-pewWidth / 2, -pewHeight / 2, pewWidth, pewHeight);
      }
    } else {
      // Draw default pew
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(-pewWidth / 2, -pewHeight / 2, pewWidth, pewHeight);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(-pewWidth / 2, -pewHeight / 2, pewWidth, pewHeight);
    }
    
    ctx.restore();
  });
};

const drawLegend = (ctx, vector, width, height) => {
  const [r1, r2, r3, d1, d2, d3] = vector;
  ctx.font = '14px Arial';
  ctx.fillStyle = '#000';
  ctx.fillText(`Vector: (${vector.join(', ')})`, 20, height - 60);
  ctx.fillText(`${r1} pews on innermost ring, ${r2} on middle, ${r3} on outermost`, 20, height - 40);
  ctx.fillText(`${d1} pews on horizontal, ${d2} on diagonal ↗↙, ${d3} on diagonal ↖↘`, 20, height - 20);
};

HexagonalChurch.displayName = 'HexagonalChurch';

export default HexagonalChurch;