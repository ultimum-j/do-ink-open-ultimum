import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { X, Droplet, Palette, Grid3x3, GripVertical } from 'lucide-react';

export default function StrokePropertiesPanel({ strokeProperties, onStrokeChange, onClose }) {
  const [colorTool, setColorTool] = useState('hsb');
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef(null);
  
  const hasStroke = strokeProperties?.enabled || false;
  const color = strokeProperties?.color || { h: 0, s: 0, b: 0, a: 100 };
  const width = strokeProperties?.width || 3;
  const lineCap = strokeProperties?.lineCap || 'round';
  const lineJoin = strokeProperties?.lineJoin || 'round';

  const hsbToHex = (h, s, b) => {
    s = s / 100;
    b = b / 100;
    const k = (n) => (n + h / 60) % 6;
    const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    const rgb = [f(5), f(3), f(1)].map(x => Math.round(x * 255));
    return '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('');
  };

  const handleStrokeEnabledChange = (enabled) => {
    onStrokeChange({ ...strokeProperties, enabled });
  };

  const handleColorChange = (changes) => {
    onStrokeChange({
      ...strokeProperties,
      enabled: true,
      color: { ...color, ...changes }
    });
  };

  const handleWidthChange = (newWidth) => {
    onStrokeChange({
      ...strokeProperties,
      width: newWidth
    });
  };

  const handleLineCapChange = (cap) => {
    onStrokeChange({
      ...strokeProperties,
      lineCap: cap
    });
  };

  const handleLineJoinChange = (join) => {
    onStrokeChange({
      ...strokeProperties,
      lineJoin: join
    });
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      const startX = e.clientX - position.x;
      const startY = e.clientY - position.y;

      const handleMouseMove = (moveEvent) => {
        const newX = moveEvent.clientX - startX;
        const newY = moveEvent.clientY - startY;
        
        const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 288);
        const toolbarHeight = 64; // Bottom toolbar height
        const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 500) - toolbarHeight;
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

  return (
    <div 
      ref={panelRef}
      className="fixed w-72 bg-white/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-300 z-50 max-h-[calc(100vh-120px)] overflow-y-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-300 bg-white/50 rounded-t-lg drag-handle cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Stroke</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Stroke Enable/Disable */}
        <div>
          <Label className="text-sm text-gray-600">Stroke</Label>
          <div className="flex gap-2 mt-2">
            <Button
              variant={!hasStroke ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStrokeEnabledChange(false)}
              className="flex-1"
            >
              No Stroke
            </Button>
            <Button
              variant={hasStroke ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStrokeEnabledChange(true)}
              className="flex-1"
            >
              Solid Stroke
            </Button>
          </div>
        </div>

        {hasStroke && (
          <>
            {/* Color Tool Selector */}
            <div className="flex gap-2">
              <Button
                variant={colorTool === 'hsb' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setColorTool('hsb')}
              >
                <Droplet className="w-4 h-4" />
              </Button>
              <Button
                variant={colorTool === 'rgb' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setColorTool('rgb')}
              >
                <Palette className="w-4 h-4" />
              </Button>
              <Button
                variant={colorTool === 'swatch' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setColorTool('swatch')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </div>

            {/* HSB Tool */}
            {colorTool === 'hsb' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600">Hue</Label>
                  <Slider
                    value={[color.h]}
                    onValueChange={([h]) => handleColorChange({ h })}
                    min={0}
                    max={360}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">{color.h}°</div>
                </div>

                <div>
                  <Label className="text-sm text-gray-600">Saturation</Label>
                  <Slider
                    value={[color.s]}
                    onValueChange={([s]) => handleColorChange({ s })}
                    min={0}
                    max={100}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">{color.s}%</div>
                </div>

                <div>
                  <Label className="text-sm text-gray-600">Brightness</Label>
                  <Slider
                    value={[color.b]}
                    onValueChange={([b]) => handleColorChange({ b })}
                    min={0}
                    max={100}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">{color.b}%</div>
                </div>

                <div>
                  <Label className="text-sm text-gray-600">Opacity</Label>
                  <Slider
                    value={[color.a]}
                    onValueChange={([a]) => handleColorChange({ a })}
                    min={0}
                    max={100}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">{color.a}%</div>
                </div>
              </div>
            )}

            {/* Color Preview */}
            <div
              className="w-full h-12 rounded border-2 border-gray-300"
              style={{
                backgroundColor: hsbToHex(color.h, color.s, color.b),
                opacity: color.a / 100
              }}
            />

            {/* Line Width */}
            <div>
              <Label className="text-sm text-gray-600">Line Width</Label>
              <Slider
                value={[width]}
                onValueChange={([w]) => handleWidthChange(w)}
                min={0.1}
                max={50}
                step={0.1}
                className="mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">{width}px</div>
            </div>

            {/* Line Cap */}
            <div>
              <Label className="text-sm text-gray-600">Line Cap</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  variant={lineCap === 'butt' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleLineCapChange('butt')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <svg width="40" height="20" className="mb-1">
                    <line x1="5" y1="10" x2="35" y2="10" stroke="currentColor" strokeWidth="6" strokeLinecap="butt" />
                  </svg>
                  <span className="text-xs">Butt</span>
                </Button>
                <Button
                  variant={lineCap === 'round' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleLineCapChange('round')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <svg width="40" height="20" className="mb-1">
                    <line x1="5" y1="10" x2="35" y2="10" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                  <span className="text-xs">Round</span>
                </Button>
                <Button
                  variant={lineCap === 'square' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleLineCapChange('square')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <svg width="40" height="20" className="mb-1">
                    <line x1="5" y1="10" x2="35" y2="10" stroke="currentColor" strokeWidth="6" strokeLinecap="square" />
                  </svg>
                  <span className="text-xs">Square</span>
                </Button>
              </div>
            </div>

            {/* Line Join */}
            <div>
              <Label className="text-sm text-gray-600">Line Join</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  variant={lineJoin === 'miter' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleLineJoinChange('miter')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <svg width="40" height="30" className="mb-1">
                    <polyline points="5,25 20,5 35,25" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="miter" />
                  </svg>
                  <span className="text-xs">Miter</span>
                </Button>
                <Button
                  variant={lineJoin === 'round' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleLineJoinChange('round')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <svg width="40" height="30" className="mb-1">
                    <polyline points="5,25 20,5 35,25" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs">Round</span>
                </Button>
                <Button
                  variant={lineJoin === 'bevel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleLineJoinChange('bevel')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <svg width="40" height="30" className="mb-1">
                    <polyline points="5,25 20,5 35,25" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="bevel" />
                  </svg>
                  <span className="text-xs">Bevel</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}