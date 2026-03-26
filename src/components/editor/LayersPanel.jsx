import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Plus, Trash2, Copy, Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown } from 'lucide-react';
import { playClick, playPop, playUndo } from '@/hooks/use-ui-sound';

/**
 * LayersPanel — Floating layer management panel for the Drawing Editor.
 * Accessed via the hamburger menu icon in the top toolbar.
 *
 * Maintained by Ultimum (https://ultimumgroup.com)
 */
export default function LayersPanel({
  layers = [],
  activeLayerId,
  onActiveLayerChange,
  onAddLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onToggleVisibility,
  onToggleLock,
  onReorderLayer,
  onOpacityChange,
  onRenameLayer,
  onClose,
}) {
  return (
    <div
      className="absolute top-16 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 w-80 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">Layers</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-blue-600 hover:bg-blue-50"
            onClick={() => { onAddLayer(); playPop(); }}
            title="Add Layer"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="w-7 h-7">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Layer List — rendered top-to-bottom (topmost layer = first in visual list) */}
      <div className="max-h-64 overflow-y-auto">
        {[...layers].reverse().map((layer, reverseIdx) => {
          const realIdx = layers.length - 1 - reverseIdx;
          const isActive = layer.id === activeLayerId;

          return (
            <div
              key={layer.id}
              className={`flex items-center gap-2 px-3 py-2 border-b border-gray-50 cursor-pointer transition-colors ${
                isActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50'
              }`}
              onClick={() => { onActiveLayerChange(layer.id); playClick(); }}
            >
              {/* Visibility toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); playClick(); }}
                className={`w-6 h-6 flex items-center justify-center rounded ${
                  layer.visible ? 'text-blue-600' : 'text-gray-300'
                }`}
                title={layer.visible ? 'Hide layer' : 'Show layer'}
              >
                {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              {/* Lock toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleLock(layer.id); playClick(); }}
                className={`w-6 h-6 flex items-center justify-center rounded ${
                  layer.locked ? 'text-red-400' : 'text-gray-300'
                }`}
                title={layer.locked ? 'Unlock layer' : 'Lock layer'}
              >
                {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>

              {/* Layer name */}
              <span
                className={`flex-1 text-sm truncate ${isActive ? 'font-semibold text-gray-800' : 'text-gray-600'}`}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  const newName = prompt('Rename layer:', layer.name);
                  if (newName && newName.trim()) onRenameLayer(layer.id, newName.trim());
                }}
                title="Double-click to rename"
              >
                {layer.name}
              </span>

              {/* Opacity indicator */}
              <span className="text-[10px] text-gray-400 w-8 text-right">
                {Math.round(layer.opacity * 100)}%
              </span>

              {/* Reorder buttons */}
              <div className="flex flex-col">
                <button
                  onClick={(e) => { e.stopPropagation(); onReorderLayer(layer.id, 'up'); playClick(); }}
                  disabled={realIdx === layers.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-20"
                  title="Move layer up"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReorderLayer(layer.id, 'down'); playClick(); }}
                  disabled={realIdx === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-20"
                  title="Move layer down"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active layer controls */}
      {activeLayerId && (() => {
        const activeLayer = layers.find(l => l.id === activeLayerId);
        if (!activeLayer) return null;
        return (
          <div className="px-4 py-3 border-t border-gray-100 space-y-2">
            {/* Opacity slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-14">Opacity</span>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(activeLayer.opacity * 100)}
                onChange={(e) => onOpacityChange(activeLayer.id, parseInt(e.target.value) / 100)}
                className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-xs text-gray-600 w-8 text-right">
                {Math.round(activeLayer.opacity * 100)}%
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-7"
                onClick={() => { onDuplicateLayer(activeLayer.id); playPop(); }}
              >
                <Copy className="w-3 h-3 mr-1" /> Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => { onDeleteLayer(activeLayer.id); playUndo(); }}
                disabled={layers.length <= 1}
              >
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
