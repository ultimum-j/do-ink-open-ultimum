import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, Download } from 'lucide-react';

export default function ExportDialog({ project, onClose }) {
  const [step, setStep] = useState('format'); // 'format', 'size', 'export'
  const [exportFormat, setExportFormat] = useState(null);
  const [exportSize, setExportSize] = useState(null);
  const [imageFormat, setImageFormat] = useState('png');
  const [previewFrame, setPreviewFrame] = useState(0);

  const isMultiFrame = (project.frame_count || 1) > 1;
  const isComposition = project.type === 'composition';
  const hasElements = isComposition && project.data?.layers?.length > 0;

  // Animation preview for compositions
  useEffect(() => {
    if (!isComposition || !hasElements) return;

    const frameCount = project.data?.layers?.reduce((max, layer) => {
      const lastKeyframe = layer.keyframes?.[layer.keyframes.length - 1];
      return Math.max(max, lastKeyframe?.time || 0);
    }, 30) || 30;

    const interval = setInterval(() => {
      setPreviewFrame((prev) => (prev + 1) % frameCount);
    }, 1000 / (project.fps || 12));

    return () => clearInterval(interval);
  }, [isComposition, hasElements, project]);

  const videoSizes = isComposition ? [
    { label: '480 × 360', value: '480x360' },
    { label: '640 × 480', value: '640x480' },
    { label: '1024 × 768', value: '1024x768' },
  ] : [
    { label: '480 × 480', value: '480x480' },
    { label: '600 × 600', value: '600x600' },
    { label: '720 × 720', value: '720x720' },
  ];

  const imageSizes = isComposition ? [
    { label: '1280 × 960', value: '1280x960' },
    { label: '1600 × 1200', value: '1600x1200' },
    { label: '2048 × 1536', value: '2048x1536' },
  ] : [
    { label: '1280 × 1280', value: '1280x1280' },
    { label: '1600 × 1600', value: '1600x1600' },
    { label: '2048 × 2048', value: '2048x2048' },
  ];

  const handleFormatSelect = (format) => {
    setExportFormat(format);
    setStep('size');
  };

  const handleSizeSelect = (size) => {
    setExportSize(size);
    setStep('export');
  };

  const handleExport = (destination) => {
    // Handle export logic here
    console.log('Exporting:', { format: exportFormat, size: exportSize, imageFormat, destination });
    onClose();
  };

  const handleImageFormatSelect = (format) => {
    setImageFormat(format);
    setStep('size');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          {step !== 'format' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep(step === 'export' ? 'size' : 'format')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <h2 className="text-lg font-semibold text-gray-800 flex-1 text-center">
            {step === 'format' && 'What do you want to save?'}
            {step === 'size' && 'What size do you want?'}
            {step === 'export' && 'Export Options'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Composition Preview */}
          {isComposition && (
            <div className="mb-6">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg relative overflow-hidden">
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
                {hasElements ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-700 mb-2">
                        {project.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Frame {previewFrame + 1}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    No elements to preview
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'format' && (
            <div className="space-y-3">
              {(isMultiFrame || isComposition) && (
                <button
                  onClick={() => handleFormatSelect('video')}
                  className="w-full p-6 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                >
                  <div className="text-blue-600 font-semibold text-lg">VIDEO</div>
                  <div className="text-gray-500 text-sm">(H.264)</div>
                </button>
              )}
              
              <button
                onClick={() => setExportFormat('image')}
                className="w-full p-6 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
              >
                <div className="text-blue-600 font-semibold text-lg">IMAGE</div>
                <div className="text-gray-500 text-sm">(PNG / JPEG)</div>
              </button>

              {!isComposition && isMultiFrame && (
                <button
                  onClick={() => handleFormatSelect('frames')}
                  className="w-full p-6 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                >
                  <div className="text-blue-600 font-semibold text-lg">ALL FRAMES</div>
                  <div className="text-gray-500 text-sm">(MULTIPLE IMAGES)</div>
                </button>
              )}
            </div>
          )}

          {/* Image Format Selection */}
          {exportFormat === 'image' && step === 'format' && (
            <div className="space-y-3 mt-4">
              <p className="text-center text-gray-600 text-sm mb-3">Select image format:</p>
              <button
                onClick={() => handleImageFormatSelect('png')}
                className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
              >
                <div className="text-blue-600 font-semibold">PNG</div>
              </button>
              <button
                onClick={() => handleImageFormatSelect('jpeg')}
                className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
              >
                <div className="text-blue-600 font-semibold">JPEG</div>
              </button>
            </div>
          )}

          {step === 'size' && (
            <div className="space-y-3">
              {(exportFormat === 'video' ? videoSizes : imageSizes).map((size) => (
                <button
                  key={size.value}
                  onClick={() => handleSizeSelect(size.value)}
                  className="w-full p-6 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="text-blue-600 font-semibold text-2xl">{size.label}</div>
                </button>
              ))}
            </div>
          )}

          {step === 'export' && (
            <div className="space-y-4">
              <p className="text-center text-gray-600 mb-6">
                Ready to export {exportFormat === 'video' ? 'video' : `${imageFormat.toUpperCase()} image`} at {exportSize}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleExport('camera-roll')}
                  className="p-6 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <Download className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-sm font-medium">Save to Camera Roll</div>
                </button>

                <button
                  onClick={() => handleExport('share')}
                  className="p-6 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <Download className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-sm font-medium">Share to Apps</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}