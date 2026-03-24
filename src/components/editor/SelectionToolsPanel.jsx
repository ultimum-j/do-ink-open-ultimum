import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Scissors,
  Copy,
  Clipboard,
  CopyPlus,
  Trash2,
  MousePointerClick,
  Layers,
  X,
  Group,
  Ungroup,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  ArrowUpToLine,
  ArrowUp,
  ArrowDown,
  ArrowDownToLine,
  FlipHorizontal2,
  FlipVertical2,
  GripVertical,
} from 'lucide-react';

export default function SelectionToolsPanel({ 
  selectedElements, 
  onCut, 
  onCopy, 
  onPaste, 
  onDuplicate, 
  onDelete,
  onSelectAll,
  onSelectAllInLayer,
  onDeselect,
  onGroup,
  onUngroup,
  onAlignLeft,
  onAlignCenterH,
  onAlignRight,
  onAlignTop,
  onAlignCenterV,
  onAlignBottom,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  onFlipHorizontal,
  onFlipVertical,
  onClose,
}) {
  const hasSelection = selectedElements && selectedElements.length > 0;
  const [position, setPosition] = useState({ x: 24, y: window.innerHeight - 500 });
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      const startX = e.clientX - position.x;
      const startY = e.clientY - position.y;

      const handleMouseMove = (moveEvent) => {
        const newX = moveEvent.clientX - startX;
        const newY = moveEvent.clientY - startY;
        
        // Add boundaries
        const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 200);
        const toolbarHeight = 64; // Bottom toolbar height
        const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 400) - toolbarHeight;
        const minY = 64; // Stop at top toolbar
        const minX = 0;

        setPosition({
          x: Math.max(minX, Math.min(maxX, newX)),
          y: Math.max(minY, Math.min(maxY, newY)),
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  return (
    <div 
      ref={panelRef}
      className="fixed bg-white/50 backdrop-blur-sm border border-gray-300 rounded-lg shadow-lg p-3 z-30"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-300">
        <div className="drag-handle cursor-grab active:cursor-grabbing flex items-center justify-center flex-1">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {/* Edit Operations */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onCut}
            title="Cut"
          >
            <Scissors className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onCopy}
            title="Copy"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onPaste}
            title="Paste"
          >
            <Clipboard className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onDuplicate}
            title="Duplicate"
          >
            <CopyPlus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete"
          >
            <Trash2 className="w-4 h-4 pointer-events-none" />
          </Button>
        </div>

        <div className="h-px bg-gray-300" />

        {/* Selection Operations */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onSelectAll}
            title="Select All"
          >
            <MousePointerClick className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onSelectAllInLayer}
            title="Select All in Layer"
          >
            <Layers className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onDeselect}
            title="Deselect"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-px bg-gray-300" />

        {/* Group Operations */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onGroup}
            title="Group"
          >
            <Group className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onUngroup}
            title="Ungroup"
          >
            <Ungroup className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-px bg-gray-300" />

        {/* Alignment Operations */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onAlignLeft}
            title="Align Left"
          >
            <AlignStartVertical className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onAlignCenterH}
            title="Align Center Horizontal"
          >
            <AlignCenterVertical className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onAlignRight}
            title="Align Right"
          >
            <AlignEndVertical className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onAlignTop}
            title="Align Top"
          >
            <AlignStartHorizontal className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onAlignCenterV}
            title="Align Center Vertical"
          >
            <AlignCenterHorizontal className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onAlignBottom}
            title="Align Bottom"
          >
            <AlignEndHorizontal className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-px bg-gray-300" />

        {/* Layer Order Operations */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onBringToFront}
            title="Bring to Front"
          >
            <ArrowUpToLine className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onBringForward}
            title="Bring Forward"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onSendBackward}
            title="Send Backward"
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onSendToBack}
            title="Send to Back"
          >
            <ArrowDownToLine className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-px bg-gray-300" />

        {/* Flip Operations */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onFlipHorizontal}
            title="Flip Horizontal"
          >
            <FlipHorizontal2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onFlipVertical}
            title="Flip Vertical"
          >
            <FlipVertical2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}