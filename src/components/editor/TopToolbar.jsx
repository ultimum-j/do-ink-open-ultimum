import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Maximize2, Image, Menu, Play, Pause, Settings, Info, HelpCircle, Undo2, Redo2 } from 'lucide-react';

export default function TopToolbar({ projectName, onBack, onPlay, isPlaying, onResetZoom, zoom, onUndo, onRedo, canUndo, canRedo, onSettingsClick, onLayersClick, fps }) {
  return (
    <div className="bg-white border-b border-gray-300 px-4 py-3 flex items-center justify-between">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-blue-600 hover:bg-blue-50 flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Gallery</span>
        </Button>

        <div className="flex gap-2 ml-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-blue-600 hover:bg-blue-50"
            onClick={onResetZoom}
            title="Reset zoom to 100%"
          >
            <Maximize2 className="w-5 h-5" />
          </Button>
          <span className="text-sm text-gray-600 px-2">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50">
            <Image className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Center Section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className={`hover:bg-blue-50 ${canUndo ? 'text-blue-600' : 'text-gray-300'}`}
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`hover:bg-blue-50 ${canRedo ? 'text-blue-600' : 'text-gray-300'}`}
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-blue-600 hover:bg-blue-50"
          onClick={onLayersClick}
          title="Layers"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <Button
          onClick={onPlay}
          size="icon"
          className="text-blue-600 hover:bg-blue-50 bg-transparent"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </Button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {fps && (
          <span className="text-xs text-gray-500 mr-1">{fps} fps</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-blue-600 hover:bg-blue-50"
          onClick={onSettingsClick}
          title="Settings (ghost frames, FPS, aspect ratio)"
        >
          <Settings className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50">
          <Info className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50">
          <HelpCircle className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}