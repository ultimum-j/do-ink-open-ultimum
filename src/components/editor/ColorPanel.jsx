import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function ColorPanel({ selectedColor, onColorChange }) {
  const [fillMode, setFillMode] = useState('color');
  const [hue, setHue] = useState(330);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [alpha, setAlpha] = useState(100);

  const hslToHex = (h, s, l) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).
      toString(16).
      padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  return null;



































































































































































}