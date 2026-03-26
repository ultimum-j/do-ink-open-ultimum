import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectStorage } from '@/api/storage';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TopToolbar from '../components/editor/TopToolbar';
import Canvas from '../components/editor/Canvas';
import ColorPanel from '../components/editor/ColorPanel';
import DrawingTools from '../components/editor/DrawingTools';
import Timeline from '../components/editor/Timeline';
import ToolPropertiesPanel from '../components/editor/ToolPropertiesPanel';
import FlowerToolPanel from '../components/editor/FlowerToolPanel';
import SelectionToolsPanel from '../components/editor/SelectionToolsPanel';
import FillPropertiesPanel from '../components/editor/FillPropertiesPanel';
import StrokePropertiesPanel from '../components/editor/StrokePropertiesPanel';
import ColorPropertiesPanel from '../components/editor/ColorPropertiesPanel';
import SettingsPanel from '../components/editor/SettingsPanel';
import LayersPanel from '../components/editor/LayersPanel';
import { playClick, playUndo } from '@/hooks/use-ui-sound';

/** Create a default layer wrapping elements for backward compat */
function createDefaultLayer(elements = []) {
  return { id: `layer-${Date.now()}`, name: 'Layer 1', visible: true, locked: false, opacity: 1, elements };
}

/** Ensure a frame has the layers format (migrate from flat elements if needed) */
function ensureLayeredFrame(frame) {
  if (!frame) return { layers: [createDefaultLayer()] };
  if (frame.layers && frame.layers.length > 0) return frame;
  // Migrate: wrap flat elements into a single default layer
  return { layers: [createDefaultLayer(frame.elements || [])] };
}

export default function Editor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  const [currentFrame, setCurrentFrame] = useState(0);
  const [selectedTool, setSelectedTool] = useState('brush');
  const [selectedColor, setSelectedColor] = useState('#ff0080');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedElements, setSelectedElements] = useState([]);
  const [clipboard, setClipboard] = useState(null);
  const [showToolPanel, setShowToolPanel] = useState(true);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [fillProperties, setFillProperties] = useState({
    type: 'solid',
    solidColor: { h: 330, s: 100, b: 100, a: 100 },
    gradient: {
      type: 'linear',
      colors: [
        { h: 60, s: 100, b: 100, a: 100, position: 0 },
        { h: 240, s: 100, b: 100, a: 100, position: 100 }
      ]
    }
  });
  const [strokeProperties, setStrokeProperties] = useState({
    enabled: true,
    color: { h: 0, s: 0, b: 0, a: 100 },
    width: 3,
    lineCap: 'round',
    lineJoin: 'round'
  });
  const [toolProperties, setToolProperties] = useState({
    brushSize: 10,
    eraserSize: 10,
    polygonVertices: 6,
    polygonInnerRadius: 100,
    flowerVertices: 8,
    flowerInnerRadius: 50,
    flowerInnerCurve: 50,
    flowerOuterCurve: 50,
  });
  const [showSelectionPanel, setShowSelectionPanel] = useState(true);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [ghostFramesBefore, setGhostFramesBefore] = useState(2);
  const [ghostFramesAfter, setGhostFramesAfter] = useState(0);
  const [fps, setFps] = useState(16);
  const [aspectRatio, setAspectRatio] = useState('free');
  const [previewBackgroundColor, setPreviewBackgroundColor] = useState('transparent');
  const projectDataRef = useRef(null);

  // Undo/Redo history stack
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const isUndoRedoRef = useRef(false);
  const MAX_HISTORY = 50;

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectStorage.get(projectId),
    enabled: !!projectId,
  });

  // Update ref when project changes + seed undo history on first load
  const initialHistoryPushedRef = useRef(false);
  useEffect(() => {
    if (project?.data) {
      projectDataRef.current = project.data;
      // Seed undo history with the initial state so first undo has somewhere to go
      if (!initialHistoryPushedRef.current) {
        initialHistoryPushedRef.current = true;
        historyRef.current = [JSON.stringify(project.data)];
        historyIndexRef.current = 0;
      }
    }
  }, [project]);

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => projectStorage.update(id, { data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', projectId]);
    },
  });

  // Create stable autosave function
  const saveProject = useCallback(async () => {
    if (project?.id && projectDataRef.current) {
      try {
        await projectStorage.update(project.id, { data: projectDataRef.current });
      } catch (error) {
        console.error('Autosave failed:', error);
      }
    }
  }, [project?.id]);

  // Periodic autosave every 5 seconds
  const lastSavedRef = useRef(null);
  useEffect(() => {
    const interval = setInterval(() => {
      if (projectDataRef.current && projectDataRef.current !== lastSavedRef.current) {
        saveProject();
        lastSavedRef.current = projectDataRef.current;
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [saveProject]);

  // Also save on page close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (projectDataRef.current) {
        saveProject();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveProject]);

  // Push state to undo history
  const pushHistory = useCallback((data) => {
    if (isUndoRedoRef.current) return;
    const serialized = JSON.stringify(data);
    // Avoid duplicate entries
    if (historyRef.current.length > 0 && historyRef.current[historyIndexRef.current] === serialized) return;
    // Truncate any future states if we're not at the end
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(serialized);
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    }
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    isUndoRedoRef.current = true;
    historyIndexRef.current--;
    const prevData = JSON.parse(historyRef.current[historyIndexRef.current]);
    projectDataRef.current = prevData;
    updateProjectMutation.mutate({ id: project?.id, data: prevData });
    isUndoRedoRef.current = false;
    playUndo();
  }, [project?.id, updateProjectMutation]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    isUndoRedoRef.current = true;
    historyIndexRef.current++;
    const nextData = JSON.parse(historyRef.current[historyIndexRef.current]);
    projectDataRef.current = nextData;
    updateProjectMutation.mutate({ id: project?.id, data: nextData });
    isUndoRedoRef.current = false;
    playClick();
  }, [project?.id, updateProjectMutation]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (isMeta && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleBack = async () => {
    // Auto-save before exiting with latest data
    await saveProject();
    navigate(createPageUrl('Gallery'));
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Animation playback loop — advance frames at configured FPS
  useEffect(() => {
    if (!isPlaying || !project?.data?.frames) return;
    const frameCount = project.data.frames.length;
    if (frameCount <= 1) {
      setIsPlaying(false);
      return;
    }
    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % frameCount);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [isPlaying, fps, project?.data?.frames?.length]);

  // --- Layer-aware helpers ---
  const getFrameLayers = () => {
    const frame = project?.data?.frames?.[currentFrame];
    return ensureLayeredFrame(frame).layers;
  };

  // Auto-set activeLayerId when frame changes or on first load
  useEffect(() => {
    const layers = getFrameLayers();
    if (layers.length > 0 && (!activeLayerId || !layers.find(l => l.id === activeLayerId))) {
      setActiveLayerId(layers[layers.length - 1].id); // default to top layer
    }
  }, [currentFrame, project?.data?.frames]);

  const getElements = () => {
    const layers = getFrameLayers();
    const active = layers.find(l => l.id === activeLayerId);
    return active?.elements || [];
  };

  const updateElements = (newElements) => {
    const frames = [...(project.data?.frames || [])];
    const frame = ensureLayeredFrame(frames[currentFrame]);
    const newLayers = frame.layers.map(l =>
      l.id === activeLayerId ? { ...l, elements: newElements } : l
    );
    frames[currentFrame] = { layers: newLayers };
    const newData = { ...project.data, frames };
    projectDataRef.current = newData;
    pushHistory(newData);
    updateProjectMutation.mutate({ id: project.id, data: newData });
  };

  const updateFrameLayers = (newLayers) => {
    const frames = [...(project.data?.frames || [])];
    frames[currentFrame] = { layers: newLayers };
    const newData = { ...project.data, frames };
    projectDataRef.current = newData;
    pushHistory(newData);
    updateProjectMutation.mutate({ id: project.id, data: newData });
  };

  // Layer CRUD operations
  const handleAddLayer = () => {
    const layers = getFrameLayers();
    const newLayer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
      elements: [],
    };
    updateFrameLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const handleDeleteLayer = (layerId) => {
    const layers = getFrameLayers();
    if (layers.length <= 1) return;
    const newLayers = layers.filter(l => l.id !== layerId);
    updateFrameLayers(newLayers);
    if (activeLayerId === layerId) {
      setActiveLayerId(newLayers[newLayers.length - 1].id);
    }
  };

  const handleDuplicateLayer = (layerId) => {
    const layers = getFrameLayers();
    const source = layers.find(l => l.id === layerId);
    if (!source) return;
    const dup = {
      ...JSON.parse(JSON.stringify(source)),
      id: `layer-${Date.now()}`,
      name: `${source.name} (Copy)`,
    };
    const idx = layers.findIndex(l => l.id === layerId);
    const newLayers = [...layers];
    newLayers.splice(idx + 1, 0, dup);
    updateFrameLayers(newLayers);
    setActiveLayerId(dup.id);
  };

  const handleToggleLayerVisibility = (layerId) => {
    const layers = getFrameLayers();
    updateFrameLayers(layers.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l));
  };

  const handleToggleLayerLock = (layerId) => {
    const layers = getFrameLayers();
    updateFrameLayers(layers.map(l => l.id === layerId ? { ...l, locked: !l.locked } : l));
  };

  const handleReorderLayer = (layerId, direction) => {
    const layers = [...getFrameLayers()];
    const idx = layers.findIndex(l => l.id === layerId);
    if (direction === 'up' && idx < layers.length - 1) {
      [layers[idx], layers[idx + 1]] = [layers[idx + 1], layers[idx]];
    } else if (direction === 'down' && idx > 0) {
      [layers[idx], layers[idx - 1]] = [layers[idx - 1], layers[idx]];
    }
    updateFrameLayers(layers);
  };

  const handleLayerOpacityChange = (layerId, opacity) => {
    const layers = getFrameLayers();
    updateFrameLayers(layers.map(l => l.id === layerId ? { ...l, opacity } : l));
  };

  const handleRenameLayer = (layerId, name) => {
    const layers = getFrameLayers();
    updateFrameLayers(layers.map(l => l.id === layerId ? { ...l, name } : l));
  };

  const handleCut = () => {
    const elements = getElements();
    setClipboard(selectedElements.map(idx => elements[idx]));
    updateElements(elements.filter((_, idx) => !selectedElements.includes(idx)));
    setSelectedElements([]);
  };

  const handleCopy = () => {
    const elements = getElements();
    setClipboard(selectedElements.map(idx => elements[idx]));
  };

  const handlePaste = () => {
    if (!clipboard) return;
    const elements = getElements();
    updateElements([...elements, ...clipboard]);
  };

  const handleDuplicate = () => {
    const elements = getElements();
    const duplicates = selectedElements.map(idx => ({ ...elements[idx] }));
    updateElements([...elements, ...duplicates]);
  };

  const handleDelete = () => {
    const elements = getElements();
    updateElements(elements.filter((_, idx) => !selectedElements.includes(idx)));
    setSelectedElements([]);
  };

  const handleSelectAll = () => {
    const elements = getElements();
    setSelectedElements(elements.map((_, idx) => idx));
  };

  const handleSelectAllInLayer = () => {
    // For now, same as select all (layers not implemented yet)
    handleSelectAll();
  };

  const handleDeselect = () => {
    setSelectedElements([]);
  };

  const handleGroup = () => {
    // TODO: Implement grouping
  };

  const handleUngroup = () => {
    // TODO: Implement ungrouping
  };

  const handleAlignLeft = () => {
    const elements = getElements();
    const minX = Math.min(...selectedElements.map(idx => {
      const el = elements[idx];
      return el.type === 'path' ? Math.min(...el.segments.map(s => s.start.x)) : el.x;
    }));
    updateElements(elements.map((el, idx) => {
      if (!selectedElements.includes(idx)) return el;
      if (el.type === 'path') {
        const currentMinX = Math.min(...el.segments.map(s => s.start.x));
        const dx = minX - currentMinX;
        return {
          ...el,
          segments: el.segments.map(seg => ({
            ...seg,
            start: { x: seg.start.x + dx, y: seg.start.y },
            end: { x: seg.end.x + dx, y: seg.end.y },
          }))
        };
      }
      return { ...el, x: minX };
    }));
  };

  const handleAlignCenterH = () => {
    const elements = getElements();
    const xs = selectedElements.map(idx => {
      const el = elements[idx];
      return el.type === 'path' ? (Math.min(...el.segments.map(s => s.start.x)) + Math.max(...el.segments.map(s => s.start.x))) / 2 : el.x + (el.width || el.radius || 0) / 2;
    });
    const centerX = xs.reduce((a, b) => a + b, 0) / xs.length;
    updateElements(elements.map((el, idx) => {
      if (!selectedElements.includes(idx)) return el;
      const currentCenter = xs[selectedElements.indexOf(idx)];
      const dx = centerX - currentCenter;
      if (el.type === 'path') {
        return {
          ...el,
          segments: el.segments.map(seg => ({
            ...seg,
            start: { x: seg.start.x + dx, y: seg.start.y },
            end: { x: seg.end.x + dx, y: seg.end.y },
          }))
        };
      }
      return { ...el, x: el.x + dx };
    }));
  };

  const handleAlignRight = () => {
    const elements = getElements();
    const maxX = Math.max(...selectedElements.map(idx => {
      const el = elements[idx];
      return el.type === 'path' ? Math.max(...el.segments.map(s => s.start.x)) : el.x + (el.width || el.radius * 2 || 0);
    }));
    updateElements(elements.map((el, idx) => {
      if (!selectedElements.includes(idx)) return el;
      if (el.type === 'path') {
        const currentMaxX = Math.max(...el.segments.map(s => s.start.x));
        const dx = maxX - currentMaxX;
        return {
          ...el,
          segments: el.segments.map(seg => ({
            ...seg,
            start: { x: seg.start.x + dx, y: seg.start.y },
            end: { x: seg.end.x + dx, y: seg.end.y },
          }))
        };
      }
      return { ...el, x: maxX - (el.width || el.radius * 2 || 0) };
    }));
  };

  const handleAlignTop = () => {
    const elements = getElements();
    const minY = Math.min(...selectedElements.map(idx => {
      const el = elements[idx];
      return el.type === 'path' ? Math.min(...el.segments.map(s => s.start.y)) : el.y;
    }));
    updateElements(elements.map((el, idx) => {
      if (!selectedElements.includes(idx)) return el;
      if (el.type === 'path') {
        const currentMinY = Math.min(...el.segments.map(s => s.start.y));
        const dy = minY - currentMinY;
        return {
          ...el,
          segments: el.segments.map(seg => ({
            ...seg,
            start: { x: seg.start.x, y: seg.start.y + dy },
            end: { x: seg.end.x, y: seg.end.y + dy },
          }))
        };
      }
      return { ...el, y: minY };
    }));
  };

  const handleAlignCenterV = () => {
    const elements = getElements();
    const ys = selectedElements.map(idx => {
      const el = elements[idx];
      return el.type === 'path' ? (Math.min(...el.segments.map(s => s.start.y)) + Math.max(...el.segments.map(s => s.start.y))) / 2 : el.y + (el.height || el.radius || 0) / 2;
    });
    const centerY = ys.reduce((a, b) => a + b, 0) / ys.length;
    updateElements(elements.map((el, idx) => {
      if (!selectedElements.includes(idx)) return el;
      const currentCenter = ys[selectedElements.indexOf(idx)];
      const dy = centerY - currentCenter;
      if (el.type === 'path') {
        return {
          ...el,
          segments: el.segments.map(seg => ({
            ...seg,
            start: { x: seg.start.x, y: seg.start.y + dy },
            end: { x: seg.end.x, y: seg.end.y + dy },
          }))
        };
      }
      return { ...el, y: el.y + dy };
    }));
  };

  const handleAlignBottom = () => {
    const elements = getElements();
    const maxY = Math.max(...selectedElements.map(idx => {
      const el = elements[idx];
      return el.type === 'path' ? Math.max(...el.segments.map(s => s.start.y)) : el.y + (el.height || el.radius * 2 || 0);
    }));
    updateElements(elements.map((el, idx) => {
      if (!selectedElements.includes(idx)) return el;
      if (el.type === 'path') {
        const currentMaxY = Math.max(...el.segments.map(s => s.start.y));
        const dy = maxY - currentMaxY;
        return {
          ...el,
          segments: el.segments.map(seg => ({
            ...seg,
            start: { x: seg.start.x, y: seg.start.y + dy },
            end: { x: seg.end.x, y: seg.end.y + dy },
          }))
        };
      }
      return { ...el, y: maxY - (el.height || el.radius * 2 || 0) };
    }));
  };

  const handleBringToFront = () => {
    const elements = getElements();
    const selected = selectedElements.map(idx => elements[idx]);
    const others = elements.filter((_, idx) => !selectedElements.includes(idx));
    updateElements([...others, ...selected]);
    setSelectedElements(selected.map((_, idx) => others.length + idx));
  };

  const handleBringForward = () => {
    const elements = getElements();
    const newElements = [...elements];
    selectedElements.forEach(idx => {
      if (idx < elements.length - 1) {
        [newElements[idx], newElements[idx + 1]] = [newElements[idx + 1], newElements[idx]];
      }
    });
    updateElements(newElements);
  };

  const handleSendBackward = () => {
    const elements = getElements();
    const newElements = [...elements];
    selectedElements.forEach(idx => {
      if (idx > 0) {
        [newElements[idx], newElements[idx - 1]] = [newElements[idx - 1], newElements[idx]];
      }
    });
    updateElements(newElements);
  };

  const handleSendToBack = () => {
    const elements = getElements();
    const selected = selectedElements.map(idx => elements[idx]);
    const others = elements.filter((_, idx) => !selectedElements.includes(idx));
    updateElements([...selected, ...others]);
    setSelectedElements(selected.map((_, idx) => idx));
  };

  const handleFlipHorizontal = () => {
    const elements = getElements();
    updateElements(elements.map((el, idx) => {
      if (!selectedElements.includes(idx)) return el;
      if (el.type === 'path') {
        const centerX = (Math.min(...el.segments.map(s => s.start.x)) + Math.max(...el.segments.map(s => s.start.x))) / 2;
        return {
          ...el,
          segments: el.segments.map(seg => ({
            ...seg,
            start: { x: 2 * centerX - seg.start.x, y: seg.start.y },
            end: { x: 2 * centerX - seg.end.x, y: seg.end.y },
          }))
        };
      }
      if (el.shape === 'rectangle' || el.shape === 'ellipse') {
        return { ...el, x: el.x + el.width, width: -el.width };
      }
      return el;
    }));
  };

  const handleFlipVertical = () => {
    const elements = getElements();
    updateElements(elements.map((el, idx) => {
      if (!selectedElements.includes(idx)) return el;
      if (el.type === 'path') {
        const centerY = (Math.min(...el.segments.map(s => s.start.y)) + Math.max(...el.segments.map(s => s.start.y))) / 2;
        return {
          ...el,
          segments: el.segments.map(seg => ({
            ...seg,
            start: { x: seg.start.x, y: 2 * centerY - seg.start.y },
            end: { x: seg.end.x, y: 2 * centerY - seg.end.y },
          }))
        };
      }
      if (el.shape === 'rectangle' || el.shape === 'ellipse') {
        return { ...el, y: el.y + el.height, height: -el.height };
      }
      return el;
    }));
  };

  if (!project) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <TopToolbar
         projectName={project.name}
         onBack={handleBack}
         onPlay={handlePlay}
         isPlaying={isPlaying}
         onResetZoom={() => setZoom(1)}
         zoom={zoom}
         onUndo={handleUndo}
         onRedo={handleRedo}
         canUndo={historyIndexRef.current > 0}
         canRedo={historyIndexRef.current < historyRef.current.length - 1}
         onSettingsClick={() => setShowSettingsPanel(!showSettingsPanel)}
         onLayersClick={() => setShowLayersPanel(!showLayersPanel)}
         fps={fps}
       />

      <div className="flex-1 flex relative">
        {/* Main Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          <Canvas
             project={project}
             currentFrame={currentFrame}
             selectedTool={selectedTool}
             selectedColor={selectedColor}
             toolProperties={toolProperties}
             fillProperties={fillProperties}
             strokeProperties={strokeProperties}
             onUpdate={(data) => {
               projectDataRef.current = data;
               pushHistory(data);
               updateProjectMutation.mutate({ id: project.id, data });
             }}
             selectedElements={selectedElements}
             onSelectedElementsChange={setSelectedElements}
             zoom={zoom}
             onZoomChange={setZoom}
             ghostFramesBefore={ghostFramesBefore}
             ghostFramesAfter={ghostFramesAfter}
             frameLayers={getFrameLayers()}
             activeLayerId={activeLayerId}
           />

          {/* Layers Panel */}
          {showLayersPanel && (
            <LayersPanel
              layers={getFrameLayers()}
              activeLayerId={activeLayerId}
              onActiveLayerChange={setActiveLayerId}
              onAddLayer={handleAddLayer}
              onDeleteLayer={handleDeleteLayer}
              onDuplicateLayer={handleDuplicateLayer}
              onToggleVisibility={handleToggleLayerVisibility}
              onToggleLock={handleToggleLayerLock}
              onReorderLayer={handleReorderLayer}
              onOpacityChange={handleLayerOpacityChange}
              onRenameLayer={handleRenameLayer}
              onClose={() => setShowLayersPanel(false)}
            />
          )}

          {/* Settings Panel */}
          {showSettingsPanel && (
            <SettingsPanel
              ghostFramesBefore={ghostFramesBefore}
              ghostFramesAfter={ghostFramesAfter}
              fps={fps}
              aspectRatio={aspectRatio}
              backgroundColor={previewBackgroundColor}
              onGhostFramesBeforeChange={setGhostFramesBefore}
              onGhostFramesAfterChange={setGhostFramesAfter}
              onFpsChange={setFps}
              onAspectRatioChange={setAspectRatio}
              onBackgroundColorChange={setPreviewBackgroundColor}
              onClose={() => setShowSettingsPanel(false)}
            />
          )}
          
          {['brush', 'eraser', 'polygon'].includes(selectedTool) && showToolPanel && !showColorPanel && !showSelectionPanel && (
            <ToolPropertiesPanel
              tool={selectedTool}
              properties={toolProperties}
              onPropertiesChange={(newProps) => setToolProperties({ ...toolProperties, ...newProps })}
              onClose={() => setShowToolPanel(false)}
            />
          )}

          {selectedTool === 'flower' && showToolPanel && !showColorPanel && !showSelectionPanel && (
            <FlowerToolPanel
              properties={toolProperties}
              onPropertiesChange={(newProps) => setToolProperties({ ...toolProperties, ...newProps })}
              onClose={() => setShowToolPanel(false)}
            />
          )}

          {selectedTool === 'pipette' && showToolPanel && !showColorPanel && !showSelectionPanel && (
            <StrokePropertiesPanel
              strokeProperties={strokeProperties}
              onStrokeChange={setStrokeProperties}
              onClose={() => setShowToolPanel(false)}
            />
          )}

          {showColorPanel && (
            <ColorPropertiesPanel
              color={selectedColor}
              fillProperties={fillProperties}
              onColorChange={setSelectedColor}
              onFillChange={setFillProperties}
              onClose={() => setShowColorPanel(false)}
            />
          )}

          {['select', 'multiselect'].includes(selectedTool) && showSelectionPanel && !showColorPanel && !showToolPanel && (
            <SelectionToolsPanel
              selectedElements={selectedElements}
              onCut={handleCut}
              onCopy={handleCopy}
              onPaste={handlePaste}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onSelectAll={handleSelectAll}
              onSelectAllInLayer={handleSelectAllInLayer}
              onDeselect={handleDeselect}
              onGroup={handleGroup}
              onUngroup={handleUngroup}
              onAlignLeft={handleAlignLeft}
              onAlignCenterH={handleAlignCenterH}
              onAlignRight={handleAlignRight}
              onAlignTop={handleAlignTop}
              onAlignCenterV={handleAlignCenterV}
              onAlignBottom={handleAlignBottom}
              onBringToFront={handleBringToFront}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
              onSendToBack={handleSendToBack}
              onFlipHorizontal={handleFlipHorizontal}
              onFlipVertical={handleFlipVertical}
              onClose={() => setShowSelectionPanel(false)}
            />
          )}
        </div>

        {/* Right Color Panel */}
        <ColorPanel
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
        />
      </div>

      {/* Bottom Tools */}
       <DrawingTools
         selectedTool={selectedTool}
         onToolSelect={(tool) => {
           setSelectedTool(tool);
           playClick();
           setShowColorPanel(false);
           if (['select', 'multiselect'].includes(tool)) {
             setShowSelectionPanel(true);
             setShowToolPanel(false);
           } else {
             setShowToolPanel(true);
             setShowSelectionPanel(false);
           }
         }}
         selectedColor={selectedColor}
         onColorClick={() => {
           setShowColorPanel(!showColorPanel);
           if (!showColorPanel) {
             setShowToolPanel(false);
             setShowSelectionPanel(false);
           }
         }}
       />

      {/* Timeline */}
      <Timeline
        project={project}
        currentFrame={currentFrame}
        onFrameChange={setCurrentFrame}
        onUpdate={(data) => updateProjectMutation.mutate({ id: project.id, data })}
      />
    </div>
  );
}