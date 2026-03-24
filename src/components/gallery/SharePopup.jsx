import React, { useState, useEffect, useRef } from 'react';

export default function SharePopup({ project, anchorRef, onClose }) {
  const [previewFrame, setPreviewFrame] = useState(0);
  const popupRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const isMultiFrame = (project.frame_count || 1) > 1;
  const frames = project.data?.frames || [];
  const thumbnail = project.thumbnail;

  // Position next to the card
  useEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const popupWidth = 320;
      const spaceRight = window.innerWidth - rect.right;
      const spaceLeft = rect.left;

      let left;
      if (spaceRight >= popupWidth + 12) {
        left = rect.right + 12;
      } else if (spaceLeft >= popupWidth + 12) {
        left = rect.left - popupWidth - 12;
      } else {
        left = Math.max(8, (window.innerWidth - popupWidth) / 2);
      }

      setPosition({
        top: Math.min(rect.top, window.innerHeight - 360),
        left,
      });
    }
  }, [anchorRef]);

  // Animate frames for multi-frame preview
  useEffect(() => {
    if (!isMultiFrame) return;
    const interval = setInterval(() => {
      setPreviewFrame((prev) => (prev + 1) % (project.frame_count || 1));
    }, 1000 / (project.fps || 12));
    return () => clearInterval(interval);
  }, [isMultiFrame, project]);

  // Dismiss on scroll
  useEffect(() => {
    const handleScroll = () => onClose();
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [onClose]);

  const handleFormatSelect = (format) => {
    // Placeholder: just close for now
    alert(`Export as: ${format}`);
    onClose();
  };

  // Current frame thumbnail or project thumbnail
  const frameThumb = isMultiFrame
    ? frames[previewFrame]?.thumbnail || thumbnail
    : thumbnail;

  return (
    <>
      {/* Backdrop - tap anywhere to close */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Popup */}
      <div
        ref={popupRef}
        className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 w-80"
        style={{ top: position.top, left: position.left }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview */}
        <div className="aspect-video bg-gray-100 rounded-t-xl overflow-hidden relative">
          {/* Checkered for transparency */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #ccc 25%, transparent 25%),
                linear-gradient(-45deg, #ccc 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #ccc 75%),
                linear-gradient(-45deg, transparent 75%, #ccc 75%)
              `,
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
            }}
          />
          {frameThumb ? (
            <img
              src={frameThumb}
              alt="preview"
              className="absolute inset-0 w-full h-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
              No preview
            </div>
          )}
          {isMultiFrame && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              {previewFrame + 1} / {project.frame_count || 1}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="p-4">
          <p className="text-center text-gray-500 text-xs font-medium uppercase tracking-wide mb-3">
            What do you want to save?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {isMultiFrame && (
              <button
                onClick={() => handleFormatSelect('video')}
                className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <span className="text-blue-600 font-bold text-sm">VIDEO</span>
                <span className="text-gray-400 text-xs">(H.264)</span>
              </button>
            )}
            {isMultiFrame && (
              <button
                onClick={() => handleFormatSelect('all-frames')}
                className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <span className="text-blue-600 font-bold text-xs">ALL FRAMES</span>
                <span className="text-gray-400 text-xs">(Multiple images)</span>
              </button>
            )}
            <button
              onClick={() => handleFormatSelect('single-frame')}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all ${!isMultiFrame ? 'col-span-3' : ''}`}
            >
              <span className="text-blue-600 font-bold text-sm">SINGLE FRAME</span>
              <span className="text-gray-400 text-xs">(PNG / jpeg)</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}