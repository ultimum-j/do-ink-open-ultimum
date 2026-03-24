import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Scissors, Copy, Files, Trash2, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, RotateCcw } from 'lucide-react';

export default function ClipToolsPanel({ layer, onClose, onUpdate, onDelete }) {
  return (
    <div className="absolute top-20 right-8 bg-white rounded-lg shadow-xl border border-gray-300 p-4 w-64 z-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">Selected Clip Tools</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="w-4 h-4 text-gray-500" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Edit Section */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Edit</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50">
              <Scissors className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50">
              <Copy className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50">
              <Files className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50">
              <Files className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50" onClick={onDelete}>
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Arrange Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Arrange</p>
            <p className="text-xs text-gray-500">Reset</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50">
              <ChevronsUp className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50">
              <ArrowUp className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50">
              <ArrowDown className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50">
              <ChevronsDown className="w-5 h-5" />
            </Button>
            <div className="w-px" />
            <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50">
              <RotateCcw className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50">
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}