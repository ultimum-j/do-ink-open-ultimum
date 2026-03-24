import React, { useRef, useEffect, useState, useCallback } from 'react';
import PaintBucketPanel from './PaintBucketPanel';

export default function Canvas({ project, currentFrame, selectedTool, selectedColor, toolProperties, onUpdate, selectedElements: externalSelectedElements, onSelectedElementsChange, zoom = 1, onZoomChange }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [currentPath, setCurrentPath] = useState(null);
  const [pencilPoints, setPencilPoints] = useState([]); // raw points for pencil tool
  const [nearStartPoint, setNearStartPoint] = useState(false); // for pencil close-loop indicator
  const brushPointsRef = useRef([]); // live brush stroke points (no state lag)
  const [transformState, setTransformState] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const renderedCanvasRef = useRef(null);
  const [showPaintBucketPanel, setShowPaintBucketPanel] = useState(false);
  const [paintBucketSettings, setPaintBucketSettings] = useState({ closeGap: 5, expand: 2, tolerance: 20, antiAlias: true });

  const selectedElements = externalSelectedElements || [];
  const setSelectedElements = (elements) => {
    if (onSelectedElementsChange) {
      onSelectedElementsChange(elements);
    }
  };

  const width = 4000;
  const height = 4000;

  // Only load elements from project on initial mount or frame change, not on every project update
  const loadedFrameRef = useRef(null);
  useEffect(() => {
    const frameKey = `${project?.id}-${currentFrame}`;
    if (project?.data?.frames?.[currentFrame]?.elements && loadedFrameRef.current !== frameKey) {
      loadedFrameRef.current = frameKey;
      setElements(project.data.frames[currentFrame].elements);
    }
  }, [project?.id, currentFrame]);

  // Calculate bounding box for selected elements
  const calculateBoundingBox = (indices) => {
    if (indices.length === 0) return null;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    indices.forEach(idx => {
      const element = elements[idx];
      if (element.type === 'path') {
        element.segments.forEach(seg => {
          minX = Math.min(minX, seg.start.x, seg.end.x);
          minY = Math.min(minY, seg.start.y, seg.end.y);
          maxX = Math.max(maxX, seg.start.x, seg.end.x);
          maxY = Math.max(maxY, seg.start.y, seg.end.y);
        });
      } else if (element.type === 'shape') {
        if (element.shape === 'circle' || element.shape === 'star' || element.shape === 'polygon') {
          minX = Math.min(minX, element.x - element.radius);
          minY = Math.min(minY, element.y - element.radius);
          maxX = Math.max(maxX, element.x + element.radius);
          maxY = Math.max(maxY, element.y + element.radius);
        } else if (element.shape === 'rectangle') {
          minX = Math.min(minX, element.x);
          minY = Math.min(minY, element.y);
          maxX = Math.max(maxX, element.x + element.width);
          maxY = Math.max(maxY, element.y + element.height);
        }
      }
    });
    
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // Draw live pencil preview — smooth Catmull-Rom curve
    if (pencilPoints.length > 1) {
      ctx.save();
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([]);
      ctx.beginPath();
      const pts = pencilPoints;
      ctx.moveTo(pts[0].x, pts[0].y);
      if (pts.length === 2) {
        ctx.lineTo(pts[1].x, pts[1].y);
      } else {
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2;
          const my = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        const last = pts[pts.length - 1];
        const prev = pts[pts.length - 2];
        ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw current path (for visual feedback during drawing)
    if (currentPath && currentPath.type === 'eraser') {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.lineWidth = currentPath.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      currentPath.segments.forEach((segment, segIdx) => {
        if (segIdx === 0) {
          ctx.moveTo(segment.start.x, segment.start.y);
        }
        ctx.lineTo(segment.end.x, segment.end.y);
      });
      ctx.stroke();
    }

    // Draw all elements
    elements.forEach((element, idx) => {
      const isSelected = selectedElement === idx || selectedElements.includes(idx);
      
      if (element.type === 'path') {
        // Draw the path
        ctx.strokeStyle = element.color;
        ctx.lineWidth = element.width || 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (element.filled) {
          ctx.fillStyle = element.fillColor || element.color;
        }
        
        ctx.beginPath();
        
        element.segments.forEach((segment, segIdx) => {
          if (segIdx === 0) {
            ctx.moveTo(segment.start.x, segment.start.y);
          }
          
          if (segment.type === 'line') {
            ctx.lineTo(segment.end.x, segment.end.y);
          } else if (segment.type === 'curve') {
            ctx.bezierCurveTo(
              segment.control1.x, segment.control1.y,
              segment.control2.x, segment.control2.y,
              segment.end.x, segment.end.y
            );
          }
        });
        
        if (element.closed) {
          ctx.closePath();
        }
        
        if (element.filled) {
          ctx.fill();
        }
        
        ctx.stroke();
        
        // Draw nodes and control points if selected
        if (isSelected && selectedTool === 'select') {
          element.segments.forEach((segment) => {
            // Draw nodes (square handles)
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(segment.start.x - 4, segment.start.y - 4, 8, 8);
            ctx.fillRect(segment.end.x - 4, segment.end.y - 4, 8, 8);
            
            // Draw control points (circular handles)
            if (segment.type === 'curve') {
              ctx.fillStyle = '#60a5fa';
              ctx.beginPath();
              ctx.arc(segment.control1.x, segment.control1.y, 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(segment.control2.x, segment.control2.y, 4, 0, Math.PI * 2);
              ctx.fill();
              
              // Draw control point lines
              ctx.strokeStyle = '#93c5fd';
              ctx.lineWidth = 1;
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              ctx.moveTo(segment.start.x, segment.start.y);
              ctx.lineTo(segment.control1.x, segment.control1.y);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(segment.end.x, segment.end.y);
              ctx.lineTo(segment.control2.x, segment.control2.y);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          });
        }
      } else if (element.type === 'fill') {
        // Draw paint bucket fill region
        const img = new Image();
        img.src = element.imageData;
        ctx.drawImage(img, element.x, element.y);
      } else if (element.type === 'shape') {
        // Draw geometric shapes
        ctx.strokeStyle = element.strokeColor || element.color;
        ctx.lineWidth = element.strokeWidth || 3;
        
        if (element.filled) {
          ctx.fillStyle = element.fillColor || element.color;
        }
        
        ctx.beginPath();
        
        switch (element.shape) {
          case 'circle':
            ctx.arc(element.x, element.y, element.radius, 0, Math.PI * 2);
            break;
          case 'rectangle':
            ctx.rect(element.x, element.y, element.width, element.height);
            break;
          case 'star':
            drawStar(ctx, element.x, element.y, element.points || 5, element.radius, element.innerRadius);
            break;
          case 'polygon':
            drawPolygon(ctx, element.x, element.y, element.sides || 6, element.radius);
            break;
          case 'flower':
            drawFlower(ctx, element.x, element.y, element.points || 8, element.radius, element.innerRadius, element.innerCurve, element.outerCurve);
            break;
          case 'ellipse':
            ctx.ellipse(element.x + element.width / 2, element.y + element.height / 2, 
              element.width / 2, element.height / 2, 0, 0, Math.PI * 2);
            break;
        }
        
        if (element.filled) {
          ctx.fill();
        }
        ctx.stroke();
      }
    });

    // Draw transform selection box
    if (selectedTool === 'transform' && selectedElements.length > 0) {
      const bbox = calculateBoundingBox(selectedElements);
      if (bbox) {
        // Draw selection box
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
        ctx.setLineDash([]);
        
        // Draw corner handles
        const handleSize = 10;
        const corners = [
          { x: bbox.x, y: bbox.y },
          { x: bbox.x + bbox.width, y: bbox.y },
          { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
          { x: bbox.x, y: bbox.y + bbox.height },
        ];
        
        ctx.fillStyle = '#3b82f6';
        corners.forEach(corner => {
          ctx.beginPath();
          ctx.arc(corner.x, corner.y, handleSize / 2, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }

    // Draw selection box while dragging
    if (selectionBox) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(
        selectionBox.startX,
        selectionBox.startY,
        selectionBox.width,
        selectionBox.height
      );
      ctx.setLineDash([]);
    }
  }, [elements, selectedElement, selectedElements, selectedTool, selectionBox, width, height, pencilPoints, nearStartPoint, selectedColor]);

  // Helper functions for geometric shapes
  const drawStar = (ctx, cx, cy, points, outerRadius, innerRadius) => {
    const step = Math.PI / points;
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < 2 * points; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * step - Math.PI / 2;
      ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    }
    ctx.closePath();
  };

  const drawPolygon = (ctx, cx, cy, sides, radius) => {
    const angle = (2 * Math.PI) / sides;
    ctx.moveTo(cx + radius * Math.cos(-Math.PI / 2), cy + radius * Math.sin(-Math.PI / 2));
    for (let i = 1; i < sides; i++) {
      ctx.lineTo(
        cx + radius * Math.cos(i * angle - Math.PI / 2),
        cy + radius * Math.sin(i * angle - Math.PI / 2)
      );
    }
    ctx.closePath();
  };

  const drawFlower = (ctx, cx, cy, petals, outerRadius, innerRadius, innerCurve = 50, outerCurve = 100) => {
    const angle = (Math.PI * 2) / petals;
    
    for (let i = 0; i < petals; i++) {
      const startAngle = i * angle - Math.PI / 2;
      const midAngle = startAngle + angle / 2;
      const endAngle = startAngle + angle;
      
      const outerStart = {
        x: cx + outerRadius * Math.cos(startAngle) * (outerCurve / 100),
        y: cy + outerRadius * Math.sin(startAngle) * (outerCurve / 100)
      };
      
      const petalTip = {
        x: cx + outerRadius * Math.cos(midAngle),
        y: cy + outerRadius * Math.sin(midAngle)
      };
      
      const outerEnd = {
        x: cx + outerRadius * Math.cos(endAngle) * (outerCurve / 100),
        y: cy + outerRadius * Math.sin(endAngle) * (outerCurve / 100)
      };
      
      const innerControl = {
        x: cx + innerRadius * Math.cos(midAngle) * (innerCurve / 100),
        y: cy + innerRadius * Math.sin(midAngle) * (innerCurve / 100)
      };
      
      ctx.moveTo(outerStart.x, outerStart.y);
      ctx.quadraticCurveTo(petalTip.x, petalTip.y, outerEnd.x, outerEnd.y);
      ctx.quadraticCurveTo(innerControl.x, innerControl.y, outerStart.x, outerStart.y);
      ctx.closePath();
    }
  };

  const getCanvasCoords = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - panX) / zoom;
    const y = (clientY - rect.top - panY) / zoom;
    return { x, y };
  };

  // Render canvas once per element change
  useEffect(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d');

    elements.forEach((element) => {
      if (element.type === 'fill') return; // Skip fill elements when rendering base
      if (element.type === 'path') {
        ctx.strokeStyle = element.color;
        ctx.lineWidth = element.width || 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (element.filled) ctx.fillStyle = element.fillColor || element.color;
        ctx.beginPath();
        element.segments.forEach((segment, segIdx) => {
          if (segIdx === 0) ctx.moveTo(segment.start.x, segment.start.y);
          if (segment.type === 'line') {
            ctx.lineTo(segment.end.x, segment.end.y);
          } else if (segment.type === 'curve') {
            ctx.bezierCurveTo(segment.control1.x, segment.control1.y, segment.control2.x, segment.control2.y, segment.end.x, segment.end.y);
          }
        });
        if (element.closed) ctx.closePath();
        if (element.filled) ctx.fill();
        ctx.stroke();
      } else if (element.type === 'shape') {
        ctx.strokeStyle = element.strokeColor || element.color;
        ctx.lineWidth = element.strokeWidth || 3;
        if (element.filled) ctx.fillStyle = element.fillColor || element.color;
        ctx.beginPath();
        switch (element.shape) {
          case 'circle': ctx.arc(element.x, element.y, element.radius, 0, Math.PI * 2); break;
          case 'rectangle': ctx.rect(element.x, element.y, element.width, element.height); break;
          case 'star': drawStar(ctx, element.x, element.y, element.points || 5, element.radius, element.innerRadius); break;
          case 'polygon': drawPolygon(ctx, element.x, element.y, element.sides || 6, element.radius); break;
          case 'flower': drawFlower(ctx, element.x, element.y, element.points || 8, element.radius, element.innerRadius, element.innerCurve, element.outerCurve); break;
          case 'ellipse': ctx.ellipse(element.x + element.width / 2, element.y + element.height / 2, element.width / 2, element.height / 2, 0, 0, Math.PI * 2); break;
        }
        if (element.filled) ctx.fill();
        ctx.stroke();
      }
    });
    renderedCanvasRef.current = offscreen;
  }, [elements]);

  // Find which line element contains the clicked point
  const getLineAtPoint = (x, y) => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (element.type === 'path') {
        const hitThreshold = 10;
        for (const segment of element.segments) {
          const dist = Math.sqrt(Math.pow(x - segment.start.x, 2) + Math.pow(y - segment.start.y, 2));
          if (dist < hitThreshold) return i;
        }
      }
    }
    return -1;
  };

  // --- Paint Bucket Fill Logic with Gap Closing, Expansion & Anti-aliasing ---
  const handlePaintBucketFill = (x, y) => {
    const { closeGap, expand, tolerance, antiAlias } = paintBucketSettings;
    
    // Find which line element was clicked
    const lineIndex = getLineAtPoint(x, y);
    
    // Create canvas with only the clicked line
    const singleLineCanvas = document.createElement('canvas');
    singleLineCanvas.width = width;
    singleLineCanvas.height = height;
    const singleCtx = singleLineCanvas.getContext('2d');
    
    if (lineIndex >= 0 && elements[lineIndex].type === 'path') {
      const element = elements[lineIndex];
      singleCtx.strokeStyle = element.color;
      singleCtx.lineWidth = element.width || 3;
      singleCtx.lineCap = 'round';
      singleCtx.lineJoin = 'round';
      
      if (element.filled) {
        singleCtx.fillStyle = element.fillColor || element.color;
      }
      
      singleCtx.beginPath();
      element.segments.forEach((segment, segIdx) => {
        if (segIdx === 0) singleCtx.moveTo(segment.start.x, segment.start.y);
        if (segment.type === 'line') {
          singleCtx.lineTo(segment.end.x, segment.end.y);
        } else if (segment.type === 'curve') {
          singleCtx.bezierCurveTo(segment.control1.x, segment.control1.y, segment.control2.x, segment.control2.y, segment.end.x, segment.end.y);
        }
      });
      if (element.closed) singleCtx.closePath();
      if (element.filled) singleCtx.fill();
      singleCtx.stroke();
    } else {
      // If not on a line, use the full rendered canvas
      singleCtx.drawImage(renderedCanvasRef.current, 0, 0);
    }

    let workingCanvas = singleLineCanvas;
    
    if (closeGap > 0) {
      workingCanvas = document.createElement('canvas');
      workingCanvas.width = width;
      workingCanvas.height = height;
      const workCtx = workingCanvas.getContext('2d');
      
      // Dilate the canvas using Gaussian-like expansion for smoother results
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Apply multiple dilation passes with proper interpolation
      tempCtx.drawImage(singleLineCanvas, 0, 0);
      
      for (let pass = 0; pass < Math.ceil(closeGap / 2); pass++) {
        const source = pass === 0 ? singleLineCanvas : workingCanvas;
        const imgData = tempCtx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const expanded = new Uint8ClampedArray(data);
        
        // Use 8-directional dilation for better coverage
        for (let i = 0; i < width * height; i++) {
          if (data[i * 4 + 3] > 0) {
            const py = Math.floor(i / width);
            const px = i % width;
            const radius = 2;
            for (let dy = -radius; dy <= radius; dy++) {
              for (let dx = -radius; dx <= radius; dx++) {
                const nx = px + dx;
                const ny = py + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const ni = (ny * width + nx) * 4;
                  // Spread the alpha and color
                  expanded[ni] = data[i * 4];
                  expanded[ni + 1] = data[i * 4 + 1];
                  expanded[ni + 2] = data[i * 4 + 2];
                  expanded[ni + 3] = Math.max(expanded[ni + 3], data[i * 4 + 3]);
                }
              }
            }
          }
        }
        imgData.data.set(expanded);
        tempCtx.putImageData(imgData, 0, 0);
      }
      
      workCtx.drawImage(tempCanvas, 0, 0);
    }

    const px = Math.floor(x);
    const py = Math.floor(y);
    const imgData = workingCanvas.getContext('2d').getImageData(0, 0, width, height);
    const data = imgData.data;

    const idx = (px + py * width) * 4;
    const targetR = data[idx], targetG = data[idx + 1], targetB = data[idx + 2], targetA = data[idx + 3];

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1; tempCanvas.height = 1;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = selectedColor;
    tempCtx.fillRect(0, 0, 1, 1);
    const colorData = tempCtx.getImageData(0, 0, 1, 1).data;
    const fillR = colorData[0], fillG = colorData[1], fillB = colorData[2];

    if (targetR === fillR && targetG === fillG && targetB === fillB) return;

    const colorMatch = (i) => {
      return Math.abs(data[i] - targetR) <= tolerance &&
             Math.abs(data[i + 1] - targetG) <= tolerance &&
             Math.abs(data[i + 2] - targetB) <= tolerance &&
             Math.abs(data[i + 3] - targetA) <= tolerance;
    };

    const visited = new Uint8Array(width * height);
    const stack = [[px, py]];
    const filledPixels = [];
    visited[px + py * width] = 1;

    while (stack.length > 0) {
      const [cx, cy] = stack.pop();
      filledPixels.push([cx, cy]);

      for (const [nx, ny] of [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]]) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        if (visited[nx + ny * width]) continue;
        const ni = (nx + ny * width) * 4;
        if (colorMatch(ni)) {
          visited[nx + ny * width] = 1;
          stack.push([nx, ny]);
        }
      }
    }

    if (filledPixels.length === 0) return;

    let expandedPixels = filledPixels;
    if (expand !== 0) {
      const pixelSet = new Set(filledPixels.map(([px, py]) => `${px},${py}`));
      const toAdd = [];
      const expandRadius = Math.ceil(Math.abs(expand));
      
      // Use circular expansion for smoother results
      for (const [px, py] of filledPixels) {
        for (let dy = -expandRadius; dy <= expandRadius; dy++) {
          for (let dx = -expandRadius; dx <= expandRadius; dx++) {
            // Only add pixels within the circular radius
            if (dx * dx + dy * dy <= expandRadius * expandRadius) {
              const nx = px + dx;
              const ny = py + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const key = `${nx},${ny}`;
                if (!pixelSet.has(key)) toAdd.push([nx, ny]);
              }
            }
          }
        }
      }
      expandedPixels = [...filledPixels, ...toAdd];
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [fx, fy] of expandedPixels) {
      if (fx < minX) minX = fx;
      if (fx > maxX) maxX = fx;
      if (fy < minY) minY = fy;
      if (fy > maxY) maxY = fy;
    }

    const fillWidth = maxX - minX + 1;
    const fillHeight = maxY - minY + 1;
    const regionCanvas = document.createElement('canvas');
    regionCanvas.width = fillWidth;
    regionCanvas.height = fillHeight;
    const regionCtx = regionCanvas.getContext('2d');
    
    regionCtx.fillStyle = selectedColor;
    
    if (antiAlias && expand !== 0) {
      // Create a smoother fill by using imageSmoothingEnabled
      regionCtx.imageSmoothingEnabled = true;
      
      // Draw pixels with slight overlap to create anti-aliased edges
      for (const [fx, fy] of expandedPixels) {
        regionCtx.fillRect(fx - minX - 0.5, fy - minY - 0.5, 2, 2);
      }
      
      // Apply additional blur for smoother edges
      const imgData = regionCtx.getImageData(0, 0, fillWidth, fillHeight);
      const data = imgData.data;
      
      // Simple box blur pass
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0 && data[i + 3] < 255) {
          // Partial opacity pixel - this is an edge
          data[i + 3] = Math.min(255, data[i + 3] * 1.1);
        }
      }
      regionCtx.putImageData(imgData, 0, 0);
    } else {
      // Standard pixel-perfect fill
      for (const [fx, fy] of expandedPixels) {
        regionCtx.fillRect(fx - minX, fy - minY, 1, 1);
      }
    }

    const dataUrl = regionCanvas.toDataURL();
    const newElement = {
      type: 'fill',
      x: minX,
      y: minY,
      width: fillWidth,
      height: fillHeight,
      color: selectedColor,
      imageData: dataUrl,
    };

    const updatedElements = [...elements, newElement];
    setElements(updatedElements);
    const updatedFrames = [...(project.data?.frames || [])];
    updatedFrames[currentFrame] = { elements: updatedElements };
    onUpdate({ ...project.data, frames: updatedFrames });
  };

  const handleMouseDown = (e) => {
    if (e.button === 2 || (e.ctrlKey && e.button === 0)) {
      setIsPanning(true);
      return;
    }

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (selectedTool === 'select') {
      // Select element
      for (let i = elements.length - 1; i >= 0; i--) {
        if (isPointInElement(x, y, elements[i])) {
          setSelectedElement(i);
          return;
        }
      }
      setSelectedElement(null);
    } else if (selectedTool === 'transform') {
      const bbox = calculateBoundingBox(selectedElements);
      
      // Check if clicking on handle
      if (bbox) {
        const handleSize = 10;
        const corners = [
          { x: bbox.x, y: bbox.y, corner: 'tl' },
          { x: bbox.x + bbox.width, y: bbox.y, corner: 'tr' },
          { x: bbox.x + bbox.width, y: bbox.y + bbox.height, corner: 'br' },
          { x: bbox.x, y: bbox.y + bbox.height, corner: 'bl' },
        ];
        
        for (const corner of corners) {
          const dist = Math.sqrt(Math.pow(x - corner.x, 2) + Math.pow(y - corner.y, 2));
          if (dist < handleSize) {
            setTransformState({
              mode: 'handle',
              corner: corner.corner,
              startX: x,
              startY: y,
              bbox: bbox,
              centerX: bbox.x + bbox.width / 2,
              centerY: bbox.y + bbox.height / 2,
            });
            setIsDrawing(true);
            return;
          }
        }
        
        // Check if clicking inside bbox (move)
        if (x >= bbox.x && x <= bbox.x + bbox.width && y >= bbox.y && y <= bbox.y + bbox.height) {
          setTransformState({
            mode: 'move',
            startX: x,
            startY: y,
            offsetX: x - bbox.x,
            offsetY: y - bbox.y,
          });
          setIsDrawing(true);
          return;
        }
      }
      
      // Start selection box or select single element
      for (let i = elements.length - 1; i >= 0; i--) {
        if (isPointInElement(x, y, elements[i])) {
          setSelectedElements([i]);
          return;
        }
      }
      
      // Start selection box
      setSelectionBox({ startX: x, startY: y, width: 0, height: 0 });
      setIsDrawing(true);
    } else if (selectedTool === 'eraser') {
      setIsDrawing(true);
      setCurrentPath({
        type: 'eraser',
        width: toolProperties?.eraserSize || 10,
        segments: [],
      });
      
      const newSegment = {
        type: 'line',
        start: { x, y },
        end: { x, y },
      };
      
      setCurrentPath(prev => ({
        ...prev,
        segments: [newSegment]
      }));
    } else if (selectedTool === 'paintbucket') {
      if (e.shiftKey) {
        setShowPaintBucketPanel(!showPaintBucketPanel);
      } else {
        handlePaintBucketFill(x, y);
      }
    } else if (selectedTool === 'pencil') {
      setIsDrawing(true);
      setPencilPoints([{ x, y }]);
      setNearStartPoint(false);
    } else if (selectedTool === 'brush') {
      setIsDrawing(true);
      brushPointsRef.current = [{ x, y }];
      setCurrentPath({
        type: 'path',
        color: selectedColor,
        width: toolProperties?.brushSize || 10,
        segments: [],
        filled: false,
        closed: false,
      });
    } else if (['rectangle', 'ellipse', 'polygon', 'star', 'flower'].includes(selectedTool)) {
      setIsDrawing(true);
      const newElement = {
        type: 'shape',
        shape: selectedTool === 'polygon' ? 'polygon' : selectedTool === 'flower' ? 'flower' : selectedTool,
        x,
        y,
        color: selectedColor,
        strokeColor: selectedColor,
        fillColor: selectedColor,
        filled: true,
        strokeWidth: 3,
        radius: 0,
        width: 0,
        height: 0,
        sides: toolProperties?.polygonVertices || 6,
        points: toolProperties?.flowerVertices || 8,
        innerRadius: 0,
        innerRadiusPercent: selectedTool === 'polygon' ? (toolProperties?.polygonInnerRadius || 100) : (toolProperties?.flowerInnerRadius || 50),
        innerCurve: toolProperties?.flowerInnerCurve || 50,
        outerCurve: toolProperties?.flowerOuterCurve || 50,
      };
      setElements([...elements, newElement]);
    }
  };

  const isPointInElement = (x, y, element) => {
    if (element.type === 'path') {
      return element.segments.some(seg => {
        const dist = Math.sqrt(Math.pow(x - seg.start.x, 2) + Math.pow(y - seg.start.y, 2));
        return dist < 10;
      });
    } else if (element.type === 'shape') {
      if (element.shape === 'circle') {
        const dist = Math.sqrt(Math.pow(x - element.x, 2) + Math.pow(y - element.y, 2));
        return dist <= element.radius;
      } else if (element.shape === 'rectangle') {
        return x >= element.x && x <= element.x + element.width &&
               y >= element.y && y <= element.y + element.height;
      }
    }
    return false;
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPanX(panX + e.movementX);
      setPanY(panY + e.movementY);
      return;
    }

    if (!isDrawing) return;

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (selectedTool === 'transform' && transformState) {
      if (transformState.mode === 'move') {
        const dx = x - transformState.startX;
        const dy = y - transformState.startY;
        
        setElements(prev => prev.map((el, idx) => {
          if (!selectedElements.includes(idx)) return el;
          
          if (el.type === 'path') {
            return {
              ...el,
              segments: el.segments.map(seg => ({
                ...seg,
                start: { x: seg.start.x + dx, y: seg.start.y + dy },
                end: { x: seg.end.x + dx, y: seg.end.y + dy },
                control1: seg.control1 ? { x: seg.control1.x + dx, y: seg.control1.y + dy } : undefined,
                control2: seg.control2 ? { x: seg.control2.x + dx, y: seg.control2.y + dy } : undefined,
              }))
            };
          } else if (el.type === 'shape') {
            return { ...el, x: el.x + dx, y: el.y + dy };
          }
          return el;
        }));
        
        setTransformState({ ...transformState, startX: x, startY: y });
      } else if (transformState.mode === 'handle') {
        const dx = x - transformState.startX;
        const dy = y - transformState.startY;
        const centerX = transformState.centerX;
        const centerY = transformState.centerY;
        
        // Calculate if it's a scale or rotate gesture
        const startDist = Math.sqrt(
          Math.pow(transformState.startX - centerX, 2) + 
          Math.pow(transformState.startY - centerY, 2)
        );
        const currentDist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        const distRatio = currentDist / startDist;
        
        // Simple scaling for now
        const bbox = transformState.bbox;
        const scaleX = (bbox.width * distRatio) / bbox.width;
        const scaleY = (bbox.height * distRatio) / bbox.height;
        
        setElements(prev => prev.map((el, idx) => {
          if (!selectedElements.includes(idx)) return el;
          
          if (el.type === 'path') {
            return {
              ...el,
              segments: el.segments.map(seg => ({
                ...seg,
                start: {
                  x: centerX + (seg.start.x - centerX) * scaleX,
                  y: centerY + (seg.start.y - centerY) * scaleY,
                },
                end: {
                  x: centerX + (seg.end.x - centerX) * scaleX,
                  y: centerY + (seg.end.y - centerY) * scaleY,
                },
                control1: seg.control1 ? {
                  x: centerX + (seg.control1.x - centerX) * scaleX,
                  y: centerY + (seg.control1.y - centerY) * scaleY,
                } : undefined,
                control2: seg.control2 ? {
                  x: centerX + (seg.control2.x - centerX) * scaleX,
                  y: centerY + (seg.control2.y - centerY) * scaleY,
                } : undefined,
              }))
            };
          } else if (el.type === 'shape') {
            if (el.shape === 'circle' || el.shape === 'star' || el.shape === 'polygon' || el.shape === 'flower') {
              return {
                ...el,
                x: centerX + (el.x - centerX) * scaleX,
                y: centerY + (el.y - centerY) * scaleY,
                radius: el.radius * Math.max(scaleX, scaleY),
              };
            } else if (el.shape === 'rectangle' || el.shape === 'ellipse') {
              return {
                ...el,
                x: centerX + (el.x - centerX) * scaleX,
                y: centerY + (el.y - centerY) * scaleY,
                width: el.width * scaleX,
                height: el.height * scaleY,
              };
            }
          }
          return el;
        }));
      }
      return;
    }

    if (selectedTool === 'transform' && selectionBox) {
      setSelectionBox({
        ...selectionBox,
        width: x - selectionBox.startX,
        height: y - selectionBox.startY,
      });
      return;
    }

    if (selectedTool === 'pencil' && isDrawing) {
      const pts = pencilPoints;
      if (pts.length > 0) {
        const startPt = pts[0];
        const distToStart = Math.sqrt(Math.pow(x - startPt.x, 2) + Math.pow(y - startPt.y, 2));
        setNearStartPoint(pts.length > 10 && distToStart < 20);
        // Only add point if it's far enough from the last one (reduces jitter)
        const last = pts[pts.length - 1];
        const distToLast = Math.sqrt(Math.pow(x - last.x, 2) + Math.pow(y - last.y, 2));
        if (distToLast >= 12) {
          // Heavy smoothing: blend strongly toward previous point to kill wobble
          const smoothed = {
            x: last.x * 0.6 + x * 0.4,
            y: last.y * 0.6 + y * 0.4,
          };
          setPencilPoints(prev => [...prev, smoothed]);
        }
      }
    } else if (selectedTool === 'eraser') {
      setCurrentPath(prev => {
        if (!prev || prev.segments.length === 0) return prev;
        const newSegments = [...prev.segments];
        const lastSegment = newSegments[newSegments.length - 1];
        newSegments.push({
          type: 'line',
          start: lastSegment.end,
          end: { x, y }
        });
        return { ...prev, segments: newSegments };
      });
    } else if (selectedTool === 'brush') {
      // Draw live stroke directly on canvas without state
      const pts = brushPointsRef.current;
      if (pts.length > 0) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const brushWidth = toolProperties?.brushSize || 10;
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = brushWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      brushPointsRef.current = [...brushPointsRef.current, { x, y }];
    } else if (['rectangle', 'ellipse', 'polygon', 'star', 'flower'].includes(selectedTool)) {
      setElements((prev) => {
        const newElements = [...prev];
        const lastElement = newElements[newElements.length - 1];
        
        const dx = x - lastElement.x;
        const dy = y - lastElement.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        
        if (lastElement.shape === 'circle' || lastElement.shape === 'star' || lastElement.shape === 'polygon' || lastElement.shape === 'flower' || lastElement.shape === 'ellipse') {
          if (lastElement.shape === 'ellipse') {
            lastElement.width = Math.abs(dx) * 2;
            lastElement.height = Math.abs(dy) * 2;
            lastElement.x = x - lastElement.width / 2;
            lastElement.y = y - lastElement.height / 2;
          } else {
            lastElement.radius = radius;
            if (lastElement.shape === 'star' || lastElement.shape === 'polygon' || lastElement.shape === 'flower') {
              lastElement.innerRadius = radius * (lastElement.innerRadiusPercent / 100);
            }
          }
        } else if (lastElement.shape === 'rectangle') {
          lastElement.width = dx;
          lastElement.height = dy;
        }
        
        return newElements;
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (isDrawing) {
      setIsDrawing(false);
      
      if (selectedTool === 'transform' && selectionBox) {
        // Select elements within box
        const box = {
          x: Math.min(selectionBox.startX, selectionBox.startX + selectionBox.width),
          y: Math.min(selectionBox.startY, selectionBox.startY + selectionBox.height),
          width: Math.abs(selectionBox.width),
          height: Math.abs(selectionBox.height),
        };
        
        const selected = [];
        elements.forEach((el, idx) => {
          if (el.type === 'path') {
            const inBox = el.segments.some(seg => 
              seg.start.x >= box.x && seg.start.x <= box.x + box.width &&
              seg.start.y >= box.y && seg.start.y <= box.y + box.height
            );
            if (inBox) selected.push(idx);
          } else if (el.type === 'shape') {
            if (el.x >= box.x && el.x <= box.x + box.width &&
                el.y >= box.y && el.y <= box.y + box.height) {
              selected.push(idx);
            }
          }
        });
        
        setSelectedElements(selected);
        setSelectionBox(null);
      }
      
      if (transformState) {
        setTransformState(null);
      }
      
      // Finalize pencil path from raw points
      if (selectedTool === 'pencil' && pencilPoints.length > 1) {
        const pts = pencilPoints;
        const firstPt = pts[0];
        const lastPt = pts[pts.length - 1];
        const dist = Math.sqrt(Math.pow(lastPt.x - firstPt.x, 2) + Math.pow(lastPt.y - firstPt.y, 2));
        const isClosed = pts.length > 10 && dist < 20;

        // Build smoothed segments using Catmull-Rom style control points
        const segments = [];
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[Math.max(0, i - 1)];
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const p3 = pts[Math.min(pts.length - 1, i + 2)];
          segments.push({
            type: 'curve',
            start: { x: p1.x, y: p1.y },
            end: { x: p2.x, y: p2.y },
            control1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
            control2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
          });
        }

        const newPath = {
          type: 'path',
          color: selectedColor,
          width: 2,
          segments,
          filled: true,        // always fill pencil strokes
          fillColor: selectedColor,
          closed: isClosed,    // still mark as closed if endpoints are near
        };

        // Clear preview FIRST so the thin follow-line vanishes before the committed stroke renders
        setPencilPoints([]);
        setNearStartPoint(false);
        const updatedElements = [...elements, newPath];
        setElements(updatedElements);

        const updatedFrames = [...(project.data?.frames || [])];
        updatedFrames[currentFrame] = { elements: updatedElements };
        onUpdate({ ...project.data, frames: updatedFrames });
        return;
      }

      // Finalize brush stroke from ref points
      if (selectedTool === 'brush' && brushPointsRef.current.length > 1) {
        const pts = brushPointsRef.current;

        // Check if the stroke self-intersects at any point
        const brushWidth = toolProperties?.brushSize || 10;
        const collisionRadius = brushWidth / 2 + 2;
        let selfIntersects = false;

        // For each new point (after a warm-up period), check against earlier points
        for (let i = 20; i < pts.length && !selfIntersects; i++) {
          const p = pts[i];
          // Only check against points well before the current tip (skip nearby points)
          for (let j = 0; j < i - 10 && !selfIntersects; j++) {
            const q = pts[j];
            const dist = Math.sqrt(Math.pow(p.x - q.x, 2) + Math.pow(p.y - q.y, 2));
            if (dist < collisionRadius) {
              selfIntersects = true;
            }
          }
        }

        const segments = [];
        for (let i = 0; i < pts.length - 1; i++) {
          segments.push({ type: 'line', start: pts[i], end: pts[i + 1] });
        }
        const newPath = {
          type: 'path',
          color: selectedColor,
          width: brushWidth,
          segments,
          filled: false,
          closed: false,       // never auto-connect endpoints
          selfIntersects,      // metadata only, does not affect rendering
        };
        const updatedElements = [...elements, newPath];
        brushPointsRef.current = [];
        setElements(updatedElements);
        setCurrentPath(null);
        const updatedFrames = [...(project.data?.frames || [])];
        updatedFrames[currentFrame] = { elements: updatedElements };
        onUpdate({ ...project.data, frames: updatedFrames });
        return;
      }

      if (currentPath && currentPath.segments.length > 0) {
        if (currentPath.type === 'eraser') {
          // Process eraser path - remove elements that overlap
          const eraserRadius = currentPath.width / 2;
          const hasSelection = selectedElements.length > 0;
          
          const newElements = elements.filter((element, idx) => {
            // If there's a selection, only erase selected elements
            if (hasSelection && !selectedElements.includes(idx)) {
              return true;
            }
            
            // Check if element overlaps with eraser path
            let overlaps = false;
            
            if (element.type === 'path') {
              // Check if any segment overlaps with eraser
              overlaps = element.segments.some(seg => {
                return currentPath.segments.some(eraserSeg => {
                  const dist = Math.sqrt(
                    Math.pow(seg.start.x - eraserSeg.start.x, 2) + 
                    Math.pow(seg.start.y - eraserSeg.start.y, 2)
                  );
                  return dist < eraserRadius + 5;
                });
              });
            } else if (element.type === 'shape') {
              // Check if shape center overlaps with eraser
              const centerX = element.x + (element.width || element.radius || 0) / 2;
              const centerY = element.y + (element.height || element.radius || 0) / 2;
              
              overlaps = currentPath.segments.some(eraserSeg => {
                const dist = Math.sqrt(
                  Math.pow(centerX - eraserSeg.start.x, 2) + 
                  Math.pow(centerY - eraserSeg.start.y, 2)
                );
                return dist < eraserRadius + (element.radius || 20);
              });
            }
            
            return !overlaps;
          });
          
          setElements(newElements);
          setCurrentPath(null);
        } else {
          const updatedElements = [...elements, currentPath];
          setElements(updatedElements);
          setCurrentPath(null);
          // Save updated elements (including new stroke)
          const updatedFrames = [...(project.data?.frames || [])];
          updatedFrames[currentFrame] = { elements: updatedElements };
          onUpdate({ ...project.data, frames: updatedFrames });
          return;
        }
      }
      
      // Save to project (eraser case or other)
      const updatedFrames = [...(project.data?.frames || [])];
      updatedFrames[currentFrame] = { elements };
      onUpdate({ ...project.data, frames: updatedFrames });
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const newZoom = Math.max(0.5, Math.min(10, zoom - e.deltaY * 0.01));
    onZoomChange?.(newZoom);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );

      if (lastTouchDistance > 0) {
        const scale = dist / lastTouchDistance;
        const newZoom = Math.max(0.5, Math.min(10, zoom * scale));
        onZoomChange?.(newZoom);
      }
      setLastTouchDistance(dist);
    }
  };

  const handleTouchEnd = () => {
    setLastTouchDistance(0);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50">
      {showPaintBucketPanel && (
        <PaintBucketPanel
          onClose={() => setShowPaintBucketPanel(false)}
          onChange={setPaintBucketSettings}
          settings={paintBucketSettings}
        />
      )}
      {/* Infinite checkered background */}
      <div
        className="absolute"
        style={{
          inset: '-200%',
          backgroundImage: `
            linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
            linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
            linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)
          `,
          backgroundSize: '30px 30px',
          backgroundPosition: '0 0, 0 15px, 15px -15px, -15px 0px',
        }}
      />
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
        className={`absolute ${
          selectedTool === 'select' || selectedTool === 'transform' ? 'cursor-default' : 
          selectedTool === 'eraser' ? 'cursor-pointer' :
          selectedTool === 'paintbucket' ? 'cursor-cell' :
          selectedTool === 'pencil' ? (nearStartPoint ? 'cursor-cell' : 'cursor-crosshair') :
          'cursor-crosshair'
        } ${isPanning ? 'cursor-grabbing' : ''}`}
        style={{ 
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isPanning ? 'none' : 'transform 0.2s'
        }}
      />
    </div>
  );
}