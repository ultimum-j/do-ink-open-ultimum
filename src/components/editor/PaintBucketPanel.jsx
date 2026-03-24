import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export default function PaintBucketPanel({ onClose, onChange, settings = {} }) {
  const [closeGap, setCloseGap] = useState(settings.closeGap || 5);
  const [expand, setExpand] = useState(settings.expand || 2);
  const [tolerance, setTolerance] = useState(settings.tolerance || 20);
  const [antiAlias, setAntiAlias] = useState(settings.antiAlias !== false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 10, y: 100 });

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('[role="slider"]')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleUpdate = (key, value) => {
    const newSettings = { closeGap, expand, tolerance, antiAlias, [key]: value };
    if (key === 'closeGap') setCloseGap(value);
    if (key === 'expand') setExpand(value);
    if (key === 'tolerance') setTolerance(value);
    if (key === 'antiAlias') setAntiAlias(value);
    onChange(newSettings);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-40 w-80"
      style={{ left: `${position.x}px`, top: `${position.y}px`, cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-sm text-gray-700">Paint Bucket Settings</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Close Gap */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Close Gap: {closeGap}px
          </label>
          <Slider
            value={[closeGap]}
            onValueChange={(val) => handleUpdate('closeGap', val[0])}
            min={0}
            max={20}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">Bridges small line breaks for cleaner fills</p>
        </div>

        {/* Area Scaling (Expand) */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Area Scaling: {expand > 0 ? '+' : ''}{expand}px
          </label>
          <Slider
            value={[expand]}
            onValueChange={(val) => handleUpdate('expand', val[0])}
            min={-5}
            max={15}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">Expands fill slightly under line art for coverage</p>
        </div>

        {/* Tolerance */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Tolerance/Threshold: {tolerance}
          </label>
          <Slider
            value={[tolerance]}
            onValueChange={(val) => handleUpdate('tolerance', val[0])}
            min={0}
            max={50}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">Keep low for precise colors (0-20 recommended)</p>
        </div>

        {/* Anti-aliasing */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={antiAlias}
              onChange={(e) => handleUpdate('antiAlias', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-xs font-medium text-gray-600">Anti-aliasing</span>
          </label>
          <p className="text-xs text-gray-500">Smooth edges on fills</p>
        </div>

        <div className="pt-2 text-xs text-gray-500 border-t">
          Tip: Use a dedicated line art layer for best results
        </div>
      </div>
    </div>
  );
}