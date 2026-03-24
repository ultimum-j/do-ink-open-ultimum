import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Plus, Minus, GripVertical } from 'lucide-react';

export default function FlowerToolPanel({ properties, onPropertiesChange, onClose }) {
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (position === null && typeof window !== 'undefined') {
      const panelWidth = 600;
      const panelHeight = 240;
      const bottomToolbarHeight = 64; // Bottom toolbar height
      const topBarHeight = 64;

      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - panelWidth, window.innerWidth - panelWidth - 20)),
        y: Math.max(topBarHeight, Math.min(window.innerHeight - panelHeight - bottomToolbarHeight - 20, window.innerHeight - panelHeight - bottomToolbarHeight))
      });
    }
  }, [position]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      const startX = e.clientX - position.x;
      const startY = e.clientY - position.y;

      const handleMouseMove = (moveEvent) => {
        const newX = moveEvent.clientX - startX;
        const newY = moveEvent.clientY - startY;

        const panelWidth = panelRef.current?.offsetWidth || 600;
        const panelHeight = panelRef.current?.offsetHeight || 240;
        const toolbarHeight = 160;
        const topBarHeight = 64;

        const maxX = window.innerWidth - panelWidth;
        const bottomToolbarHeight = 64; // Bottom toolbar height
        const maxY = window.innerHeight - panelHeight - bottomToolbarHeight;
        const minY = topBarHeight;
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

  if (!position) return null;

  const flowerVertices = properties?.flowerVertices || 8;
  const flowerInnerRadius = properties?.flowerInnerRadius || 40;
  const flowerInnerCurve = properties?.flowerInnerCurve || 100;
  const flowerOuterCurve = properties?.flowerOuterCurve || 100;

  const handleChange = (prop, value) => {
    onPropertiesChange({ [prop]: Math.max(0, Math.min(prop === 'flowerVertices' ? 60 : 100, value)) });
  };

  const renderFlower = () => {
    const svg = `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        ${Array.from({ length: flowerVertices }).map((_, i) => {
          const angle = (i / flowerVertices) * Math.PI * 2;
          const outerRadius = 80 * (flowerOuterCurve / 100);
          const innerRadius = 40 * (flowerInnerRadius / 100) * (flowerInnerCurve / 100);
          
          const x1 = 100 + Math.cos(angle) * outerRadius;
          const y1 = 100 + Math.sin(angle) * outerRadius;
          
          const nextAngle = ((i + 1) / flowerVertices) * Math.PI * 2;
          const controlX = 100 + Math.cos(angle + Math.PI / flowerVertices) * innerRadius;
          const controlY = 100 + Math.sin(angle + Math.PI / flowerVertices) * innerRadius;
          
          return `<path d="M 100 100 Q ${controlX} ${controlY} ${x1} ${y1}" fill="red" stroke="red" stroke-width="2"/>`;
        }).join('')}
      </svg>
    `;
    return svg;
  };

  return (
    <div
      ref={panelRef}
      className="fixed w-[600px] bg-white/50 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-200 z-30"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="drag-handle cursor-grab active:cursor-grabbing flex items-center justify-between px-5 pt-3 pb-2">
        <h3 className="text-base font-semibold text-gray-600">Flower</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-gray-400 hover:text-gray-600" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>
      <div className="px-5 pb-5 pt-2">
        {/* Main Content: 2x2 Grid with Center Preview */}
        <div className="grid grid-cols-3 gap-5 items-center">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Points */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-gray-400 text-xs font-medium">Points:</label>
                <span className="text-gray-800 font-bold text-sm">{flowerVertices}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleChange('flowerVertices', Math.max(3, flowerVertices - 1))}
                  className="h-5 w-5 p-0 flex-shrink-0 -ml-1"
                >
                  <Minus className="w-3 h-3 text-blue-600" />
                </Button>
                <input
                  type="range"
                  min="3"
                  max="60"
                  value={flowerVertices}
                  onChange={(e) => handleChange('flowerVertices', parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-gray-300 rounded appearance-none cursor-pointer accent-blue-600"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((flowerVertices - 3) / 57) * 100}%, #e5e7eb ${((flowerVertices - 3) / 57) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleChange('flowerVertices', Math.min(60, flowerVertices + 1))}
                  className="h-5 w-5 p-0 flex-shrink-0 -mr-1"
                >
                  <Plus className="w-3 h-3 text-blue-600" />
                </Button>
              </div>
            </div>

            {/* Inner Radius */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-gray-400 text-xs font-medium">Inner Radius:</label>
                <span className="text-gray-800 font-bold text-sm">{flowerInnerRadius}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleChange('flowerInnerRadius', Math.max(1, flowerInnerRadius - 1))}
                  className="h-5 w-5 p-0 flex-shrink-0 -ml-1"
                >
                  <Minus className="w-3 h-3 text-blue-600" />
                </Button>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={flowerInnerRadius}
                  onChange={(e) => handleChange('flowerInnerRadius', parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-gray-300 rounded appearance-none cursor-pointer accent-blue-600"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((flowerInnerRadius - 1) / 99) * 100}%, #e5e7eb ${((flowerInnerRadius - 1) / 99) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleChange('flowerInnerRadius', Math.min(100, flowerInnerRadius + 1))}
                  className="h-5 w-5 p-0 flex-shrink-0 -mr-1"
                >
                  <Plus className="w-3 h-3 text-blue-600" />
                </Button>
              </div>
            </div>
          </div>

          {/* Center: Flower Preview */}
          <div className="flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-32 h-32">
              {Array.from({ length: flowerVertices }).map((_, i) => {
                const angle = (Math.PI * 2 / flowerVertices) * i - Math.PI / 2;
                const nextAngle = (Math.PI * 2 / flowerVertices) * (i + 1) - Math.PI / 2;
                const midAngle = angle + Math.PI / flowerVertices;

                const outerRadius = 80;
                const innerRadius = 40 * (flowerInnerRadius / 100);

                const outerStart = {
                  x: 100 + outerRadius * Math.cos(angle) * (flowerOuterCurve / 100),
                  y: 100 + outerRadius * Math.sin(angle) * (flowerOuterCurve / 100)
                };

                const petalTip = {
                  x: 100 + outerRadius * Math.cos(midAngle),
                  y: 100 + outerRadius * Math.sin(midAngle)
                };

                const outerEnd = {
                  x: 100 + outerRadius * Math.cos(nextAngle) * (flowerOuterCurve / 100),
                  y: 100 + outerRadius * Math.sin(nextAngle) * (flowerOuterCurve / 100)
                };

                const innerControl = {
                  x: 100 + innerRadius * Math.cos(midAngle) * (flowerInnerCurve / 100),
                  y: 100 + innerRadius * Math.sin(midAngle) * (flowerInnerCurve / 100)
                };

                return (
                  <path
                    key={i}
                    d={`M ${outerStart.x} ${outerStart.y} Q ${petalTip.x} ${petalTip.y} ${outerEnd.x} ${outerEnd.y} Q ${innerControl.x} ${innerControl.y} ${outerStart.x} ${outerStart.y}`}
                    fill="#dc2626"
                    stroke="none"
                  />
                );
              })}
            </svg>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Inner Curve */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-gray-400 text-xs font-medium">Inner Curve:</label>
                <span className="text-gray-800 font-bold text-sm">{flowerInnerCurve}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleChange('flowerInnerCurve', Math.max(1, flowerInnerCurve - 1))}
                  className="h-5 w-5 p-0 flex-shrink-0 -ml-1"
                >
                  <Minus className="w-3 h-3 text-blue-600" />
                </Button>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={flowerInnerCurve}
                  onChange={(e) => handleChange('flowerInnerCurve', parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-gray-300 rounded appearance-none cursor-pointer accent-blue-600"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((flowerInnerCurve - 1) / 99) * 100}%, #e5e7eb ${((flowerInnerCurve - 1) / 99) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleChange('flowerInnerCurve', Math.min(100, flowerInnerCurve + 1))}
                  className="h-5 w-5 p-0 flex-shrink-0 -mr-1"
                >
                  <Plus className="w-3 h-3 text-blue-600" />
                </Button>
              </div>
            </div>

            {/* Outer Curve */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-gray-400 text-xs font-medium">Outer Curve:</label>
                <span className="text-gray-800 font-bold text-sm">{flowerOuterCurve}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleChange('flowerOuterCurve', Math.max(1, flowerOuterCurve - 1))}
                  className="h-5 w-5 p-0 flex-shrink-0 -ml-1"
                >
                  <Minus className="w-3 h-3 text-blue-600" />
                </Button>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={flowerOuterCurve}
                  onChange={(e) => handleChange('flowerOuterCurve', parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-gray-300 rounded appearance-none cursor-pointer accent-blue-600"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((flowerOuterCurve - 1) / 99) * 100}%, #e5e7eb ${((flowerOuterCurve - 1) / 99) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleChange('flowerOuterCurve', Math.min(100, flowerOuterCurve + 1))}
                  className="h-5 w-5 p-0 flex-shrink-0 -mr-1"
                >
                  <Plus className="w-3 h-3 text-blue-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}