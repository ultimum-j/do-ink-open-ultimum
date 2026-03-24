import React, { useState, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ToolPropertiesPanel({ tool, properties, onPropertiesChange, onClose }) {
  const [position, setPosition] = useState({ x: window.innerWidth - 280, y: window.innerHeight - 380 });
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      const startX = e.clientX - position.x;
      const startY = e.clientY - position.y;

      const handleMouseMove = (moveEvent) => {
        const newX = moveEvent.clientX - startX;
        const newY = moveEvent.clientY - startY;
        
        const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 256);
        const toolbarHeight = 64; // Bottom toolbar height (py-3 + border + content)
        const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 200) - toolbarHeight;
        const minY = 64; // Stop at top toolbar
        const minX = 0;

        setPosition({
          x: Math.max(minX, Math.min(maxX, newX)),
          y: Math.max(minY, Math.min(maxY, newY)),
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  if (!tool) return null;

  const renderProperties = () => {
    switch (tool) {
      case 'brush':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">Brush Size</Label>
              <Slider
                value={[properties.brushSize || 10]}
                onValueChange={(value) => onPropertiesChange({ brushSize: value[0] })}
                min={0.1}
                max={60}
                step={0.1}
                className="mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">{properties.brushSize || 10}px</div>
            </div>
          </div>
        );

      case 'eraser':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">Eraser Size</Label>
              <Slider
                value={[properties.eraserSize || 10]}
                onValueChange={(value) => onPropertiesChange({ eraserSize: value[0] })}
                min={0.1}
                max={60}
                step={0.1}
                className="mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">{properties.eraserSize || 10}px</div>
            </div>
          </div>
        );

      case 'polygon':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">Vertices</Label>
              <Slider
                value={[properties.polygonVertices || 6]}
                onValueChange={(value) => onPropertiesChange({ polygonVertices: value[0] })}
                min={3}
                max={60}
                step={1}
                className="mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">{properties.polygonVertices || 6}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Inner Radius %</Label>
              <Slider
                value={[properties.polygonInnerRadius || 100]}
                onValueChange={(value) => onPropertiesChange({ polygonInnerRadius: value[0] })}
                min={10}
                max={100}
                step={1}
                className="mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">{properties.polygonInnerRadius || 100}%</div>
            </div>
          </div>
        );

      case 'flower':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">Vertices</Label>
              <Slider
                value={[properties.flowerVertices || 8]}
                onValueChange={(value) => onPropertiesChange({ flowerVertices: value[0] })}
                min={3}
                max={60}
                step={1}
                className="mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">{properties.flowerVertices || 8}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Inner Radius %</Label>
              <Slider
                value={[properties.flowerInnerRadius || 50]}
                onValueChange={(value) => onPropertiesChange({ flowerInnerRadius: value[0] })}
                min={10}
                max={100}
                step={1}
                className="mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">{properties.flowerInnerRadius || 50}%</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Inner Curve %</Label>
              <Slider
                value={[properties.flowerInnerCurve || 50]}
                onValueChange={(value) => onPropertiesChange({ flowerInnerCurve: value[0] })}
                min={0}
                max={100}
                step={1}
                className="mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">{properties.flowerInnerCurve || 50}%</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Outer Curve %</Label>
              <Slider
                value={[properties.flowerOuterCurve || 50]}
                onValueChange={(value) => onPropertiesChange({ flowerOuterCurve: value[0] })}
                min={0}
                max={100}
                step={1}
                className="mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">{properties.flowerOuterCurve || 50}%</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const content = renderProperties();
  if (!content) return null;

  return (
    <div 
      ref={panelRef}
      className="fixed bg-white/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-300 p-4 w-64 z-30"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="drag-handle cursor-grab active:cursor-grabbing flex items-center justify-center pb-2 mb-3 border-b border-gray-300">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Tool Properties</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      {content}
    </div>
  );
}