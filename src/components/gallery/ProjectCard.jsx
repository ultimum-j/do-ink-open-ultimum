import React, { useState, useEffect, useRef } from 'react';
import { Play, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SharePopup from './SharePopup';

export default function ProjectCard({ project, onDelete, onDuplicate, onExport }) {
  const [showSwipe, setShowSwipe] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [previewFrame, setPreviewFrame] = useState(0);
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const uploadBtnRef = useRef(null);

  const frameCount = project.frame_count || 1;
  const isMultiFrame = frameCount > 1;

  // Preview animation
  useEffect(() => {
    if (!showPreview || !isMultiFrame) return;

    const interval = setInterval(() => {
      setPreviewFrame((prev) => (prev + 1) % frameCount);
    }, 1000 / (project.fps || 12));

    return () => clearInterval(interval);
  }, [showPreview, isMultiFrame, frameCount, project.fps]);

  const handleCardClick = (e) => {
    if (showSwipe) {
      setShowSwipe(false);
      return;
    }
    const editorPath = project.type === 'composition' ? 'CompositionEditor' : 'Editor';
    navigate(createPageUrl(`${editorPath}?id=${project.id}`));
  };

  const handlePreviewClick = (e) => {
    e.stopPropagation();
    if (isMultiFrame) {
      setShowPreview(true);
      setPreviewFrame(0);
    }
  };

  const handleSwipeClick = (e) => {
    e.stopPropagation();
    setShowSwipe(!showSwipe);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    setShowSwipe(false);
    setShowSharePopup(true);
  };

  return (
    <div ref={cardRef} className="relative overflow-hidden">
      <div
        className={`bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer ${
          showSwipe ? '-translate-x-32' : ''
        }`}
        style={{ transition: 'transform 0.3s ease' }}
        onClick={handleCardClick}
      >
        {/* Thumbnail */}
        <div className={`aspect-[4/3] relative ${project.type === 'composition' && !project.thumbnail ? 'bg-white' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
          {/* Checkered pattern - only for non-composition or composition with thumbnail */}
          {!(project.type === 'composition' && !project.thumbnail) && (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #ccc 25%, transparent 25%),
                  linear-gradient(-45deg, #ccc 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #ccc 75%),
                  linear-gradient(-45deg, transparent 75%, #ccc 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              }}
            />
          )}
          
          {project.thumbnail && (
            <img
              src={project.thumbnail}
              alt={project.name}
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}

          {/* Play Button */}
          {isMultiFrame && (
            <button
              onClick={handlePreviewClick}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors z-10"
            >
              <Play className="w-5 h-5 text-white ml-1" />
            </button>
          )}
        </div>

        {/* Bottom Bar */}
        <div
          className={`h-24 flex items-center justify-between px-4 ${
            project.type === 'composition' ? 'bg-[#6B46C1]' : 'bg-[#5a6b3d]'
          }`}
        >
          <span className="text-white text-sm font-semibold truncate font-display">
            {project.name}
          </span>
          
          {/* Upload Button */}
          <button
            ref={uploadBtnRef}
            onClick={handleSwipeClick}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Upload className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Swipe Actions */}
      {showSwipe && (
        <div className="absolute top-0 right-0 h-full w-32 flex flex-col">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project);
            }}
            className="flex-1 bg-red-500 text-white flex items-center justify-center text-sm font-medium hover:bg-red-600"
          >
            Delete
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(project);
            }}
            className="flex-1 bg-gray-600 text-white flex items-center justify-center text-sm font-medium hover:bg-gray-700"
          >
            Duplicate
          </button>
          <button
            onClick={handleShareClick}
            className="flex-1 bg-gray-600 text-white flex items-center justify-center text-sm font-medium hover:bg-gray-700"
          >
            Share
          </button>
        </div>
      )}

      {/* Share Popup */}
      {showSharePopup && (
        <SharePopup
          project={project}
          anchorRef={cardRef}
          onClose={() => setShowSharePopup(false)}
        />
      )}

      {/* Preview Overlay */}
      {showPreview && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={() => setShowPreview(false)}
        >
          <div className="max-w-2xl max-h-[80vh] relative">
            <div className="bg-white rounded-lg p-4">
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, #ccc 25%, transparent 25%),
                      linear-gradient(-45deg, #ccc 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #ccc 75%),
                      linear-gradient(-45deg, transparent 75%, #ccc 75%)
                    `,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-gray-400">
                  Frame {previewFrame + 1}
                </div>
              </div>
              <div className="text-center mt-2 text-sm text-gray-600">
                {project.name} - Frame {previewFrame + 1} of {frameCount}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}