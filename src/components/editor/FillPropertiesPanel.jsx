import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { X, Droplet, Palette, Grid3x3 } from 'lucide-react';

export default function FillPropertiesPanel({ fillProperties, onFillChange, onClose }) {
  const [colorTool, setColorTool] = useState('hsb');
  
  const fillType = fillProperties?.type || 'none';
  const solidColor = fillProperties?.solidColor || { h: 0, s: 100, b: 100, a: 100 };
  const gradient = fillProperties?.gradient || {
    type: 'linear',
    colors: [
      { h: 60, s: 100, b: 100, a: 100, position: 0 },
      { h: 240, s: 100, b: 100, a: 100, position: 100 }
    ]
  };

  const [activeColorIndex, setActiveColorIndex] = useState(0);

  const hsbToHex = (h, s, b) => {
    s = s / 100;
    b = b / 100;
    const k = (n) => (n + h / 60) % 6;
    const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    const rgb = [f(5), f(3), f(1)].map(x => Math.round(x * 255));
    return '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('');
  };

  const hexToHsb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let h = 0;
    if (delta !== 0) {
      if (max === r) h = 60 * (((g - b) / delta) % 6);
      else if (max === g) h = 60 * ((b - r) / delta + 2);
      else h = 60 * ((r - g) / delta + 4);
    }
    if (h < 0) h += 360;
    
    const s = max === 0 ? 0 : (delta / max) * 100;
    const v = max * 100;
    
    return { h: Math.round(h), s: Math.round(s), b: Math.round(v) };
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
    
    // Find colors around this position to interpolate
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

  return (
    <div className="fixed right-4 top-20 w-72 bg-white/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Fill Properties</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Fill Type Selector */}
        <div>
          <Label className="text-sm text-gray-600">Fill Type</Label>
          <div className="flex gap-2 mt-2">
            <Button
              variant={fillType === 'none' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFillTypeChange('none')}
              className="flex-1"
            >
              None
            </Button>
            <Button
              variant={fillType === 'solid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFillTypeChange('solid')}
              className="flex-1"
            >
              Solid
            </Button>
            <Button
              variant={fillType === 'gradient' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFillTypeChange('gradient')}
              className="flex-1"
            >
              Gradient
            </Button>
          </div>
        </div>

        {fillType !== 'none' && (
          <>
            {/* Color Tool Selector */}
            <div className="flex gap-2">
              <Button
                variant={colorTool === 'hsb' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setColorTool('hsb')}
              >
                <Droplet className="w-4 h-4" />
              </Button>
              <Button
                variant={colorTool === 'rgb' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setColorTool('rgb')}
              >
                <Palette className="w-4 h-4" />
              </Button>
              <Button
                variant={colorTool === 'swatch' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setColorTool('swatch')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </div>

            {/* HSB Tool */}
            {colorTool === 'hsb' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600">Hue</Label>
                  <Slider
                    value={[activeColor.h]}
                    onValueChange={([h]) => {
                      fillType === 'gradient' 
                        ? handleGradientColorChange({ h })
                        : handleSolidColorChange({ h });
                    }}
                    min={0}
                    max={360}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">{activeColor.h}°</div>
                </div>

                <div>
                  <Label className="text-sm text-gray-600">Saturation</Label>
                  <Slider
                    value={[activeColor.s]}
                    onValueChange={([s]) => {
                      fillType === 'gradient'
                        ? handleGradientColorChange({ s })
                        : handleSolidColorChange({ s });
                    }}
                    min={0}
                    max={100}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">{activeColor.s}%</div>
                </div>

                <div>
                  <Label className="text-sm text-gray-600">Brightness</Label>
                  <Slider
                    value={[activeColor.b]}
                    onValueChange={([b]) => {
                      fillType === 'gradient'
                        ? handleGradientColorChange({ b })
                        : handleSolidColorChange({ b });
                    }}
                    min={0}
                    max={100}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">{activeColor.b}%</div>
                </div>

                <div>
                  <Label className="text-sm text-gray-600">Opacity</Label>
                  <Slider
                    value={[activeColor.a]}
                    onValueChange={([a]) => {
                      fillType === 'gradient'
                        ? handleGradientColorChange({ a })
                        : handleSolidColorChange({ a });
                    }}
                    min={0}
                    max={100}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">{activeColor.a}%</div>
                </div>
              </div>
            )}

            {/* Color Preview */}
            <div
              className="w-full h-12 rounded border-2 border-gray-300"
              style={{
                backgroundColor: hsbToHex(activeColor.h, activeColor.s, activeColor.b),
                opacity: activeColor.a / 100
              }}
            />

            {/* Gradient-specific controls */}
            {fillType === 'gradient' && (
              <>
                <div>
                  <Label className="text-sm text-gray-600">Gradient Type</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={gradient.type === 'linear' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleGradientTypeChange('linear')}
                      className="flex-1"
                    >
                      Linear
                    </Button>
                    <Button
                      variant={gradient.type === 'radial' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleGradientTypeChange('radial')}
                      className="flex-1"
                    >
                      Radial
                    </Button>
                  </div>
                </div>

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
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}