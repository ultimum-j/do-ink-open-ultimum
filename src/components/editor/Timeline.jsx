import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Copy, Trash2, Scissors, ClipboardPaste } from 'lucide-react';

export default function Timeline({ project, currentFrame, onFrameChange, onUpdate }) {
  const frameCount = project?.data?.frames?.length || 1;
  const [copiedFrame, setCopiedFrame] = React.useState(null);

  const handleAddFrame = () => {
    const frames = [...(project.data?.frames || [{ elements: [] }])];
    frames.splice(currentFrame + 1, 0, { elements: [] });
    onUpdate({ ...project.data, frames });
    onFrameChange(currentFrame + 1);
  };

  const handleDuplicateFrame = () => {
    const frames = [...(project.data?.frames || [{ elements: [] }])];
    const currentFrameData = JSON.parse(JSON.stringify(frames[currentFrame] || { elements: [] }));
    frames.splice(currentFrame + 1, 0, currentFrameData);
    onUpdate({ ...project.data, frames });
    onFrameChange(currentFrame + 1);
  };

  const handleDeleteFrame = () => {
    if (frameCount <= 1) return;
    const frames = [...(project.data?.frames || [])];
    frames.splice(currentFrame, 1);
    onUpdate({ ...project.data, frames });
    if (currentFrame >= frames.length) {
      onFrameChange(frames.length - 1);
    }
  };

  const handleCopyFrame = () => {
    const frames = project.data?.frames || [{ elements: [] }];
    setCopiedFrame(JSON.parse(JSON.stringify(frames[currentFrame] || { elements: [] })));
  };

  const handlePasteFrame = () => {
    if (!copiedFrame) return;
    const frames = [...(project.data?.frames || [{ elements: [] }])];
    frames.splice(currentFrame + 1, 0, JSON.parse(JSON.stringify(copiedFrame)));
    onUpdate({ ...project.data, frames });
    onFrameChange(currentFrame + 1);
  };

  return (
    <div className="bg-gray-200 border-t border-gray-300 px-4 py-3 relative z-50">
      <div className="flex items-center gap-4">
        {/* Frame Counter */}
        <div className="text-gray-700 font-medium min-w-[80px]">
          <span className="text-2xl">{currentFrame + 1}</span>
          <span className="text-sm text-gray-500 ml-1">
            frame
            <br />
            of {frameCount}
          </span>
        </div>

        {/* Frame Strip */}
        <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-400">
          <div className="flex items-center gap-2 bg-gray-400 rounded px-4 py-2 min-w-full w-max">
          {Array.from({ length: frameCount }).map((_, index) => {
            const frameElements = project?.data?.frames?.[index]?.elements || [];
            const hasContent = frameElements.length > 0;
            
            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => onFrameChange(index)}
                  className={`w-20 h-14 rounded-lg flex-shrink-0 transition-all overflow-hidden border-2 ${
                    currentFrame === index
                      ? 'bg-white border-blue-500 shadow-md'
                      : 'bg-gray-300 border-gray-400 hover:border-gray-500'
                  }`}
                >
                  {hasContent ? (
                    <svg viewBox="0 0 1080 1080" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                      {frameElements.map((element, idx) => {
                        if (element.type === 'path' && element.segments) {
                          const pathData = element.segments.map((seg, i) => 
                            `${i === 0 ? 'M' : 'L'} ${seg.start.x} ${seg.start.y}`
                          ).join(' ');
                          return (
                            <path
                              key={idx}
                              d={pathData}
                              stroke={element.color || '#000'}
                              strokeWidth={element.strokeWidth || 2}
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          );
                        }
                        return null;
                      })}
                    </svg>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                  )}
                </button>
                <span className="text-xs font-bold text-gray-700">{index + 1}</span>
              </div>
            );
          })}
          </div>
        </div>

        {/* Frame Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAddFrame}
            className="text-blue-600"
            title="Add Frame"
          >
            <Plus className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDuplicateFrame}
            className="text-blue-600"
            title="Duplicate Frame"
          >
            <Copy className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteFrame}
            className="text-blue-600"
            disabled={frameCount <= 1}
            title="Delete Frame"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyFrame}
            className="text-blue-600"
            title="Copy Frame"
          >
            <Scissors className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePasteFrame}
            className={copiedFrame ? 'text-blue-600' : 'text-gray-300'}
            disabled={!copiedFrame}
            title="Paste Frame After Current"
          >
            <ClipboardPaste className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}