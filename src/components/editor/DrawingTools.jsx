import React from 'react';
import { Button } from '@/components/ui/button';
import {
  MousePointer2,
  Undo2,
  Redo2,
  Move,
  Hand,
  Image,
  Wand2,
  Brush,
  Pencil,
  PaintBucket,
  Pipette,
  Square,
  Circle,
  Star,
  Hexagon,
  Flower,
  MousePointerClick,
  Eraser,
  Sparkles,
} from 'lucide-react';

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'multiselect', icon: MousePointerClick, label: 'Multi-select' },
  { id: 'transform', icon: Move, label: 'Transform' },
  { id: 'pencil', icon: Pencil, label: 'Pencil' },
  { id: 'brush', icon: Brush, label: 'Brush' },
  { id: 'paintbucket', icon: PaintBucket, label: 'Paint Bucket' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'ellipse', icon: Circle, label: 'Ellipse' },
  { id: 'polygon', icon: Hexagon, label: 'Polygon' },
  { id: 'star', icon: Star, label: 'Star' },
  { id: 'flower', icon: Flower, label: 'Flower' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

export default function DrawingTools({ selectedTool, onToolSelect, selectedColor, onColorClick, onUndo, onRedo }) {
  return (
    <div className="bg-white border-t border-gray-300 px-4 py-3 relative z-50">
      <div className="flex items-center justify-center gap-1 max-w-5xl mx-auto">
        {/* Undo/Redo */}
        <Button variant="ghost" size="icon" className="text-blue-600" onClick={onUndo}>
          <Undo2 className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-blue-600" onClick={onRedo}>
          <Redo2 className="w-5 h-5" />
        </Button>

        <div className="w-px h-8 bg-gray-300 mx-2" />

        {/* Drawing Tools */}
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              className={`p-2 rounded transition-colors ${
                selectedTool === tool.id ? 'bg-blue-100 text-blue-600' : 'text-blue-600 hover:bg-gray-100'
              }`}
              title={tool.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}

        <div className="w-px h-8 bg-gray-300 mx-2" />

        {/* Color Preview */}
        <button 
          onClick={onColorClick}
          className="flex gap-2 ml-2 hover:opacity-80 transition-opacity"
        >
          <div
            className="w-8 h-8 rounded border-2 border-gray-300"
            style={{
              background: `
                linear-gradient(135deg, transparent 47%, #ddd 47%, #ddd 53%, transparent 53%),
                ${selectedColor}
              `,
            }}
          />
          <div
            className="w-10 h-8 rounded"
            style={{ backgroundColor: selectedColor }}
          />
        </button>
      </div>
    </div>
  );
}