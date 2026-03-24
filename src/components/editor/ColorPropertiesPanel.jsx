import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { X, Droplet, Palette, Grid3x3, GripVertical } from 'lucide-react';

export default function ColorPropertiesPanel({ color, fillProperties, onColorChange, onFillChange, onClose }) {
  const [colorTool, setColorTool] = useState('default');
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (position === null && typeof window !== 'undefined') {
      const panelWidth = 360;
      const panelHeight = 500;
      const toolbarHeight = 80;
      const topBarHeight = 64;
      
      setPosition({ 
        x: Math.max(0, Math.min(window.innerWidth - panelWidth, window.innerWidth - panelWidth - 20)),
        y: Math.max(topBarHeight, Math.min(window.innerHeight - panelHeight - toolbarHeight - 20, window.innerHeight - panelHeight - toolbarHeight))
      });
    }
  }, [position]);
  
  const fillType = fillProperties?.type || 'solid';
  const solidColor = fillProperties?.solidColor || { h: 0, s: 100, b: 100, a: 100 };
  const gradient = fillProperties?.gradient || {
    type: 'linear',
    colors: [
      { h: 60, s: 100, b: 100, a: 100, position: 0 },
      { h: 240, s: 100, b: 100, a: 100, position: 100 }
    ]
  };

  const [activeColorIndex, setActiveColorIndex] = useState(0);
  
  // Parse hex color to HSB
  const hexToHsb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let h = 0;
    if (delta !== 0) {
      if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / delta + 2) * 60;
      else h = ((r - g) / delta + 4) * 60;
    }
    
    const s = max === 0 ? 0 : (delta / max) * 100;
    const v = max * 100;
    
    return { h: Math.round(h), s: Math.round(s), b: Math.round(v), a: 100 };
  };

  const [hsb, setHsb] = useState(hexToHsb(color || '#000000'));

  const hsbToHex = (h, s, b) => {
    s = s / 100;
    b = b / 100;
    const k = (n) => (n + h / 60) % 6;
    const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    const rgb = [f(5), f(3), f(1)].map(x => Math.round(x * 255));
    return '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('');
  };

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
  };

  const handleHsbChange = (changes) => {
    const newHsb = { ...hsb, ...changes };
    setHsb(newHsb);
    onColorChange(hsbToHex(newHsb.h, newHsb.s, newHsb.b));
  };

  const handleRgbChange = (changes) => {
    const currentRgb = hexToRgb(hsbToHex(hsb.h, hsb.s, hsb.b));
    const newRgb = { ...currentRgb, ...changes };
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHsb(hexToHsb(newHex));
    onColorChange(newHex);
  };

  const handleFillTypeChange = (type) => {
    onFillChange({ ...fillProperties, type });
  };

  const handleSolidColorChange = (changes) => {
    onFillChange({
      ...fillProperties,
      type: 'solid',
      solidColor: { ...solidColor, ...changes }
    });
  };

  const handleGradientColorChange = (changes) => {
    const newColors = [...gradient.colors];
    newColors[activeColorIndex] = { ...newColors[activeColorIndex], ...changes };
    onFillChange({
      ...fillProperties,
      type: 'gradient',
      gradient: { ...gradient, colors: newColors }
    });
  };

  const handleGradientTypeChange = (type) => {
    onFillChange({
      ...fillProperties,
      gradient: { ...gradient, type }
    });
  };

  const addGradientColor = (position) => {
    const newColors = [...gradient.colors];
    
    const beforeColors = newColors.filter(c => c.position <= position);
    const afterColors = newColors.filter(c => c.position > position);
    
    let newColor;
    if (beforeColors.length > 0 && afterColors.length > 0) {
      const before = beforeColors[beforeColors.length - 1];
      const after = afterColors[0];
      const ratio = (position - before.position) / (after.position - before.position);
      
      newColor = {
        h: Math.round(before.h + (after.h - before.h) * ratio),
        s: Math.round(before.s + (after.s - before.s) * ratio),
        b: Math.round(before.b + (after.b - before.b) * ratio),
        a: Math.round(before.a + (after.a - after.a) * ratio),
        position
      };
    } else {
      newColor = { h: 0, s: 100, b: 100, a: 100, position };
    }
    
    newColors.push(newColor);
    newColors.sort((a, b) => a.position - b.position);
    
    onFillChange({
      ...fillProperties,
      gradient: { ...gradient, colors: newColors }
    });
    setActiveColorIndex(newColors.indexOf(newColor));
  };

  const removeGradientColor = (index) => {
    if (gradient.colors.length <= 2) return;
    
    const newColors = gradient.colors.filter((_, i) => i !== index);
    onFillChange({
      ...fillProperties,
      gradient: { ...gradient, colors: newColors }
    });
    
    if (activeColorIndex >= newColors.length) {
      setActiveColorIndex(newColors.length - 1);
    }
  };

  const updateGradientColorPosition = (index, position) => {
    const newColors = [...gradient.colors];
    newColors[index] = { ...newColors[index], position: Math.max(0, Math.min(100, position)) };
    newColors.sort((a, b) => a.position - b.position);
    onFillChange({
      ...fillProperties,
      gradient: { ...gradient, colors: newColors }
    });
  };

  const activeColor = fillType === 'gradient' ? gradient.colors[activeColorIndex] : solidColor;

  const renderGradientPreview = () => {
    const stops = gradient.colors
      .map(c => `${hsbToHex(c.h, c.s, c.b)} ${c.position}%`)
      .join(', ');
    
    return gradient.type === 'linear'
      ? `linear-gradient(90deg, ${stops})`
      : `radial-gradient(circle, ${stops})`;
  };

  const defaultColors = [
    '#FF0000', '#FFBF00', '#FFFF35', '#02FF00', '#00FFFF', '#0165FC', '#7F00FF', '#FF00BF', '#FFFFFF',
    '#FF3433', '#FFCA33', '#FFFF33', '#36FE32', '#41FDFE', '#3E82FC', '#893BFF', '#FF33CC', '#CCCCCC',
    '#FF6665', '#FED866', '#FFFF9A', '#67FE66', '#7DFDFE', '#5CB3FF', '#B366FF', '#FF63E9', '#999999',
    '#FF9999', '#FFE599', '#FFFE9F', '#9AFE97', '#ACFFFC', '#A2BFFE', '#CA9BF7', '#FBA0E3', '#666666',
    '#D40000', '#CC9900', '#CBCC02', '#00CC00', '#00CED1', '#0066CC', '#6600CC', '#C71585', '#333333',
    '#993D3D', '#9E803D', '#98993D', '#3EA055', '#3D9999', '#3E6298', '#624E9A', '#993D81', '#000000',
  ];

  const currentHex = hsbToHex(hsb.h, hsb.s, hsb.b);
  const currentRgb = hexToRgb(currentHex);

  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      const startX = e.clientX - position.x;
      const startY = e.clientY - position.y;

      const handleMouseMove = (moveEvent) => {
        const newX = moveEvent.clientX - startX;
        const newY = moveEvent.clientY - startY;
        
        // Add boundaries
        const panelWidth = panelRef.current?.offsetWidth || 360;
        const panelHeight = panelRef.current?.offsetHeight || 500;
        const toolbarHeight = 64; // Bottom toolbar height
        const topBarHeight = 64;
        
        const maxX = window.innerWidth - panelWidth;
        const maxY = window.innerHeight - panelHeight - toolbarHeight;
        const minY = topBarHeight;
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

  if (!position) return null;

  return (
    <div 
      ref={panelRef}
      className="fixed w-[360px] bg-white/50 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-300 z-30"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-300 bg-white/50 rounded-t-lg drag-handle cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Fill</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-3 space-y-3">
        {/* Fill Type Selector */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="default"
            onClick={() => handleFillTypeChange('none')}
            className={`flex-1 rounded-lg font-medium ${
              fillType === 'none' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            None
          </Button>
          <Button
            variant="ghost"
            size="default"
            onClick={() => handleFillTypeChange('solid')}
            className={`flex-1 rounded-lg font-medium ${
              fillType === 'solid' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            Color
          </Button>
          <Button
            variant="ghost"
            size="default"
            onClick={() => handleFillTypeChange('gradient')}
            className={`flex-1 rounded-lg font-medium ${
              fillType === 'gradient' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            Gradient
          </Button>
        </div>

        {/* Color Selection Area */}
        {fillType !== 'none' && (
          <>
            {/* Default Colors */}
            {colorTool === 'default' && (
              <div>
                <div className="grid grid-cols-9 gap-2">
                  {defaultColors.map((defaultColor) => (
                    <button
                      key={defaultColor}
                      onClick={() => {
                        const newHsb = hexToHsb(defaultColor);
                        setHsb(newHsb);
                        if (fillType === 'solid') {
                          handleSolidColorChange(newHsb);
                        } else if (fillType === 'gradient') {
                          handleGradientColorChange(newHsb);
                        }
                        onColorChange(defaultColor);
                      }}
                      className="w-full aspect-square rounded-md hover:scale-110 transition-transform"
                      style={{ backgroundColor: defaultColor }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* HSB Tool */}
            {colorTool === 'hsb' && (
              <div className="space-y-3">
                {/* Hue Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-medium w-5 text-sm">H</span>
                  <div className="flex-1 relative h-10">
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                      }}
                    />
                    <input
                      type="range"
                      value={activeColor.h}
                      onChange={(e) => {
                        const h = parseInt(e.target.value);
                        fillType === 'gradient' 
                          ? handleGradientColorChange({ h })
                          : handleSolidColorChange({ h });
                      }}
                      min={0}
                      max={360}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-red-500 border-3 border-white shadow-lg pointer-events-none"
                      style={{
                        left: `calc(${(activeColor.h / 360) * 100}% - 14px)`,
                        backgroundColor: hsbToHex(activeColor.h, 100, 100)
                      }}
                    />
                  </div>
                  <span className="text-gray-700 font-medium w-14 text-right text-sm">{activeColor.h}°</span>
                </div>

                {/* Saturation Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-medium w-5 text-sm">S</span>
                  <div className="flex-1 relative h-10">
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `linear-gradient(to right, #ffffff 0%, ${hsbToHex(activeColor.h, 100, activeColor.b)} 100%)`
                      }}
                    />
                    <input
                      type="range"
                      value={activeColor.s}
                      onChange={(e) => {
                        const s = parseInt(e.target.value);
                        fillType === 'gradient'
                          ? handleGradientColorChange({ s })
                          : handleSolidColorChange({ s });
                      }}
                      min={0}
                      max={100}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-3 border-white shadow-lg pointer-events-none"
                      style={{
                        left: `calc(${activeColor.s}% - 14px)`,
                        backgroundColor: hsbToHex(activeColor.h, activeColor.s, activeColor.b)
                      }}
                    />
                  </div>
                  <span className="text-gray-700 font-medium w-14 text-right text-sm">{activeColor.s}%</span>
                </div>

                {/* Brightness Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-medium w-5 text-sm">B</span>
                  <div className="flex-1 relative h-10">
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `linear-gradient(to right, #000000 0%, ${hsbToHex(activeColor.h, activeColor.s, 100)} 100%)`
                      }}
                    />
                    <input
                      type="range"
                      value={activeColor.b}
                      onChange={(e) => {
                        const b = parseInt(e.target.value);
                        fillType === 'gradient'
                          ? handleGradientColorChange({ b })
                          : handleSolidColorChange({ b });
                      }}
                      min={0}
                      max={100}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-3 border-white shadow-lg pointer-events-none"
                      style={{
                        left: `calc(${activeColor.b}% - 14px)`,
                        backgroundColor: hsbToHex(activeColor.h, activeColor.s, activeColor.b)
                      }}
                    />
                  </div>
                  <span className="text-gray-700 font-medium w-14 text-right text-sm">{activeColor.b}%</span>
                </div>

                {/* Alpha/Opacity Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-medium w-5 text-sm">A</span>
                  <div className="flex-1 relative h-10">
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundImage: `
                          repeating-linear-gradient(45deg, #ccc 0px, #ccc 5px, transparent 5px, transparent 10px),
                          linear-gradient(to right, transparent 0%, ${hsbToHex(activeColor.h, activeColor.s, activeColor.b)} 100%)
                        `
                      }}
                    />
                    <input
                      type="range"
                      value={activeColor.a}
                      onChange={(e) => {
                        const a = parseInt(e.target.value);
                        fillType === 'gradient'
                          ? handleGradientColorChange({ a })
                          : handleSolidColorChange({ a });
                      }}
                      min={0}
                      max={100}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-3 border-white shadow-lg pointer-events-none"
                      style={{
                        left: `calc(${activeColor.a}% - 14px)`,
                        backgroundColor: hsbToHex(activeColor.h, activeColor.s, activeColor.b),
                        opacity: activeColor.a / 100
                      }}
                    />
                  </div>
                  <span className="text-gray-700 font-medium w-14 text-right text-sm">{activeColor.a}%</span>
                </div>
              </div>
            )}

            {/* RGB Tool */}
            {colorTool === 'rgb' && (
              <div className="space-y-3">
                {/* Red Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-medium w-5 text-sm">R</span>
                  <div className="flex-1 relative h-10">
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `linear-gradient(to right, rgb(0, ${currentRgb.g}, ${currentRgb.b}) 0%, rgb(255, ${currentRgb.g}, ${currentRgb.b}) 100%)`
                      }}
                    />
                    <input
                      type="range"
                      value={currentRgb.r}
                      onChange={(e) => handleRgbChange({ r: parseInt(e.target.value) })}
                      min={0}
                      max={255}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-3 border-white shadow-lg pointer-events-none"
                      style={{
                        left: `calc(${(currentRgb.r / 255) * 100}% - 14px)`,
                        backgroundColor: rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b)
                      }}
                    />
                  </div>
                  <span className="text-gray-700 font-medium w-14 text-right text-sm">{currentRgb.r}</span>
                </div>

                {/* Green Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-medium w-5 text-sm">G</span>
                  <div className="flex-1 relative h-10">
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `linear-gradient(to right, rgb(${currentRgb.r}, 0, ${currentRgb.b}) 0%, rgb(${currentRgb.r}, 255, ${currentRgb.b}) 100%)`
                      }}
                    />
                    <input
                      type="range"
                      value={currentRgb.g}
                      onChange={(e) => handleRgbChange({ g: parseInt(e.target.value) })}
                      min={0}
                      max={255}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-3 border-white shadow-lg pointer-events-none"
                      style={{
                        left: `calc(${(currentRgb.g / 255) * 100}% - 14px)`,
                        backgroundColor: rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b)
                      }}
                    />
                  </div>
                  <span className="text-gray-700 font-medium w-14 text-right text-sm">{currentRgb.g}</span>
                </div>

                {/* Blue Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-medium w-5 text-sm">B</span>
                  <div className="flex-1 relative h-10">
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `linear-gradient(to right, rgb(${currentRgb.r}, ${currentRgb.g}, 0) 0%, rgb(${currentRgb.r}, ${currentRgb.g}, 255) 100%)`
                      }}
                    />
                    <input
                      type="range"
                      value={currentRgb.b}
                      onChange={(e) => handleRgbChange({ b: parseInt(e.target.value) })}
                      min={0}
                      max={255}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-3 border-white shadow-lg pointer-events-none"
                      style={{
                        left: `calc(${(currentRgb.b / 255) * 100}% - 14px)`,
                        backgroundColor: rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b)
                      }}
                    />
                  </div>
                  <span className="text-gray-700 font-medium w-14 text-right text-sm">{currentRgb.b}</span>
                </div>
              </div>
            )}

            {/* Swatch Tool */}
            {colorTool === 'swatch' && (
              <div>
                <div className="grid grid-cols-9 gap-2">
                  {defaultColors.map((defaultColor) => (
                    <button
                      key={defaultColor}
                      onClick={() => {
                        const newHsb = hexToHsb(defaultColor);
                        setHsb(newHsb);
                        if (fillType === 'solid') {
                          handleSolidColorChange(newHsb);
                        } else if (fillType === 'gradient') {
                          handleGradientColorChange(newHsb);
                        }
                        onColorChange(defaultColor);
                      }}
                      className="w-full aspect-square rounded-md hover:scale-110 transition-transform"
                      style={{ backgroundColor: defaultColor }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Color Tool Selector */}
            <div className="flex gap-2 justify-start">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setColorTool('hsb')}
                className={`h-10 w-10 rounded-lg ${
                  colorTool === 'hsb' 
                    ? 'bg-white shadow-sm' 
                    : 'bg-transparent hover:bg-gray-100'
                }`}
              >
                <Droplet className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setColorTool('rgb')}
                className={`h-10 w-10 rounded-lg ${
                  colorTool === 'rgb' 
                    ? 'bg-white shadow-sm' 
                    : 'bg-transparent hover:bg-gray-100'
                }`}
              >
                <Palette className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setColorTool('swatch')}
                className={`h-10 w-10 rounded-lg ${
                  colorTool === 'swatch' 
                    ? 'bg-white shadow-sm' 
                    : 'bg-transparent hover:bg-gray-100'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </div>

            {/* Color Preview */}
            <div
              className="w-full h-16 rounded-lg"
              style={{
                backgroundColor: hsbToHex(activeColor.h, activeColor.s, activeColor.b),
                opacity: activeColor.a / 100
              }}
            />

            {/* Gradient-specific controls */}
            {fillType === 'gradient' && (
              <>
                {/* Gradient Control */}
                <div>
                  <Label className="text-sm text-gray-600">Gradient Colors</Label>
                  <div
                    className="relative w-full h-12 rounded border border-gray-300 mt-2"
                    style={{ background: renderGradientPreview() }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const position = (x / rect.width) * 100;
                      addGradientColor(position);
                    }}
                  />
                  <div className="relative w-full h-8">
                    {gradient.colors.map((color, index) => (
                      <div
                        key={index}
                        className={`absolute w-6 h-6 rounded border-2 cursor-pointer transform -translate-x-1/2 ${
                          activeColorIndex === index ? 'border-blue-500 shadow-lg' : 'border-gray-400'
                        }`}
                        style={{
                          left: `${color.position}%`,
                          top: '4px',
                          backgroundColor: hsbToHex(color.h, color.s, color.b)
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveColorIndex(index);
                        }}
                        onMouseDown={(e) => {
                          if (e.button === 0) {
                            const startX = e.clientX;
                            const startPosition = color.position;
                            const rect = e.currentTarget.parentElement.getBoundingClientRect();

                            const handleMouseMove = (moveEvent) => {
                              const deltaX = moveEvent.clientX - startX;
                              const deltaPosition = (deltaX / rect.width) * 100;
                              updateGradientColorPosition(index, startPosition + deltaPosition);
                            };

                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };

                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          removeGradientColor(index);
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Click to add colors. Drag to reposition. Double-click to remove.
                  </div>
                </div>

                {/* Gradient Type Selector */}
                <div className="flex gap-2 justify-start">
                  <button
                    onClick={() => handleGradientTypeChange('linear')}
                    className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all ${
                      gradient.type === 'linear' 
                        ? 'bg-white shadow-sm' 
                        : 'bg-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-6 h-6 rounded" style={{
                      background: 'linear-gradient(to right, #ff0000, #0000ff)'
                    }} />
                  </button>
                  <button
                    onClick={() => handleGradientTypeChange('radial')}
                    className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all ${
                      gradient.type === 'radial' 
                        ? 'bg-white shadow-sm' 
                        : 'bg-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full" style={{
                      background: 'radial-gradient(circle, #ff0000, #0000ff)'
                    }} />
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}