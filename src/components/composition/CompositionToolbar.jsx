import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Maximize2, Image, Star, Cloud, Camera, Type, Play, Pause, Info, HelpCircle } from 'lucide-react';

export default function CompositionToolbar({ onBack, onPlay, isPlaying, onImport }) {
  return (
    <div className="bg-white border-b border-gray-300 px-4 py-3 flex items-center justify-between">
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
          <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50">
            <Maximize2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50">
            <Image className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50" onClick={onImport}>
          <Star className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50">
          <Cloud className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50">
          <Camera className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50">
          <Type className="w-5 h-5" />
        </Button>

        <Button
          onClick={onPlay}
          size="icon"
          className="text-blue-600 hover:bg-blue-50 bg-transparent ml-4"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </Button>
      </div>

      <div className="flex items-center gap-2">
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