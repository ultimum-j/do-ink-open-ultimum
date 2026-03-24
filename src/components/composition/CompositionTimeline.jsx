import React from 'react';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2, ChevronDown, Diamond, Copy, Wand2, Sparkles, Settings } from 'lucide-react';

export default function CompositionTimeline({ project, currentTime, onTimeChange, selectedLayer, onLayerSelect, onUpdate }) {
  const duration = project?.data?.duration || 30;
  const layers = project?.data?.layers || [];

  return (
    <div className="bg-gray-200 border-t border-gray-300">
      {/* Timeline Controls */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-300">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-blue-600">
            <Undo2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-blue-600">
            <Redo2 className="w-5 h-5" />
          </Button>

          <div className="ml-4 flex items-center gap-2">
            <div className="text-2xl font-bold text-gray-700">{currentTime}</div>
            <div className="text-xs text-gray-500">
              <div>{Math.floor(currentTime / 30)}/{duration}</div>
              <div>seconds</div>
            </div>
          </div>

          <Button variant="ghost" size="icon" className="text-blue-600 ml-2">
            <ChevronDown className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-blue-600">
            <Diamond className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-blue-600">
            <Copy className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-blue-600">
            <Wand2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-blue-600">
            <Sparkles className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-blue-600">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Timeline Tracks */}
      <div className="relative h-48 overflow-y-auto">
        {/* Time ruler */}
        <div className="sticky top-0 bg-gray-300 h-8 flex items-center border-b border-gray-400 z-10">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 text-center text-xs text-gray-600 border-l border-gray-400">
              {i}
            </div>
          ))}
        </div>

        {/* Layer tracks */}
        {layers.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-500">
            No layers yet. Import elements to get started.
          </div>
        ) : (
          layers.map((layer, index) => (
            <div
              key={layer.id}
              className={`h-12 border-b border-gray-400 flex items-center cursor-pointer hover:bg-gray-300 ${
                selectedLayer?.id === layer.id ? 'bg-blue-100' : index % 2 === 0 ? 'bg-gray-200' : 'bg-gray-250'
              }`}
              onClick={() => onLayerSelect(layer)}
            >
              <div className="w-32 px-3 text-sm truncate border-r border-gray-400">
                {layer.name}
              </div>
              <div className="flex-1 relative">
                {/* Placeholder for keyframes */}
                <div className="absolute inset-y-0 left-0 w-full">
                  {layer.keyframes?.map((kf, kfIndex) => (
                    <div
                      key={kfIndex}
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"
                      style={{ left: `${(kf.time / duration) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-20"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full" />
        </div>
      </div>
    </div>
  );
}