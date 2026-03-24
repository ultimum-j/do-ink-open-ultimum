import React, { useRef, useEffect } from 'react';

export default function CompositionCanvas({ project, currentTime, selectedLayer, onLayerSelect, onUpdate }) {
  const canvasRef = useRef(null);
  const width = project?.data?.settings?.width || 800;
  const height = project?.data?.settings?.height || 600;
  const layers = project?.data?.layers || [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // Fill with white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Draw layers
    layers.forEach((layer) => {
      const keyframe = layer.keyframes?.find(kf => kf.time <= currentTime) || layer.keyframes?.[0];
      if (!keyframe) return;

      ctx.save();
      ctx.globalAlpha = keyframe.opacity || 1;
      ctx.translate(keyframe.x || 0, keyframe.y || 0);
      ctx.rotate((keyframe.rotation || 0) * Math.PI / 180);
      ctx.scale(keyframe.scale || 1, keyframe.scale || 1);

      // Draw placeholder element
      ctx.fillStyle = layer.id === selectedLayer?.id ? '#3b82f6' : '#94a3b8';
      ctx.fillRect(-50, -50, 100, 100);
      
      ctx.restore();
    });
  }, [layers, currentTime, selectedLayer, width, height]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked layer (from top to bottom)
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const keyframe = layer.keyframes?.[0];
      if (!keyframe) continue;

      const distance = Math.sqrt(
        Math.pow(x - keyframe.x, 2) + Math.pow(y - keyframe.y, 2)
      );

      if (distance < 50) {
        onLayerSelect(layer);
        return;
      }
    }

    onLayerSelect(null);
  };

  return (
    <div className="relative shadow-xl">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        className="bg-white border-2 border-gray-800 cursor-pointer"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    </div>
  );
}