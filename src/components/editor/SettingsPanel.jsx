import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

/**
 * SettingsPanel — Floating settings panel for the Drawing Editor.
 * Controls: ghost frames (onion skinning), FPS, aspect ratio, background color.
 *
 * Maintained by Ultimum (https://ultimumgroup.com)
 */
export default function SettingsPanel({
  ghostFramesBefore = 2,
  ghostFramesAfter = 0,
  fps = 16,
  aspectRatio = 'free',
  backgroundColor = 'transparent',
  onGhostFramesBeforeChange,
  onGhostFramesAfterChange,
  onFpsChange,
  onAspectRatioChange,
  onBackgroundColorChange,
  onClose,
}) {
  return (
    <div
      className="absolute top-16 right-4 bg-white rounded-lg shadow-xl border border-gray-200 w-72 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">Settings</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="w-6 h-6">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-5">
        {/* Ghost Frames / Onion Skinning */}
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Ghost Frames (Onion Skin)
          </label>

          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Previous frames</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onGhostFramesBeforeChange(Math.max(0, ghostFramesBefore - 1))}
                  className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-sm font-medium w-4 text-center">{ghostFramesBefore}</span>
                <button
                  onClick={() => onGhostFramesBeforeChange(Math.min(6, ghostFramesBefore + 1))}
                  className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Next frames</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onGhostFramesAfterChange(Math.max(0, ghostFramesAfter - 1))}
                  className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-sm font-medium w-4 text-center">{ghostFramesAfter}</span>
                <button
                  onClick={() => onGhostFramesAfterChange(Math.min(6, ghostFramesAfter + 1))}
                  className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FPS */}
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Frames Per Second
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="30"
              value={fps}
              onChange={(e) => onFpsChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-sm font-medium text-gray-700 w-8 text-right">{fps}</span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>1</span>
            <span>10</span>
            <span>16</span>
            <span>24</span>
            <span>30</span>
          </div>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Aspect Ratio
          </label>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {[
              { label: 'Free', value: 'free' },
              { label: '4:3', value: '4:3' },
              { label: '16:9', value: '16:9' },
              { label: '1:1', value: '1:1' },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => onAspectRatioChange(value)}
                className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  aspectRatio === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Background Color */}
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Preview Background
          </label>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {[
              { label: '∅', value: 'transparent', style: 'bg-gradient-to-br from-gray-100 to-gray-200' },
              { label: '', value: '#ffffff', style: 'bg-white border border-gray-200' },
              { label: '', value: '#000000', style: 'bg-black' },
              { label: '', value: '#22c55e', style: 'bg-green-500' },
              { label: '', value: '#3b82f6', style: 'bg-blue-500' },
            ].map(({ label, value, style }) => (
              <button
                key={value}
                onClick={() => onBackgroundColorChange(value)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs transition-all ${style} ${
                  backgroundColor === value ? 'ring-2 ring-blue-600 ring-offset-1' : ''
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
