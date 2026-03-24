import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
  const [zoom, setZoom] = useState(1);
  const projectDataRef = useRef(null);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId,
  });

  // Update ref when project changes
  useEffect(() => {
    if (project?.data) {
      projectDataRef.current = project.data;
    }
  }, [project]);

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', projectId]);
    },
  });

  // Create stable autosave function
  const saveProject = useCallback(async () => {
    if (project?.id && projectDataRef.current) {
      try {
        await base44.entities.Project.update(project.id, projectDataRef.current);
      } catch (error) {
        console.error('Autosave failed:', error);
      }
    }
  }, [project?.id]);

  // Autosave on page close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (projectDataRef.current) {
        // Save synchronously using navigator.sendBeacon or try to save
        saveProject();
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveProject]);

  const handleBack = async () => {
    // Auto-save before exiting with latest data
    await saveProject();
    navigate(createPageUrl('Gallery'));
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const getElements = () => {
    return project?.data?.frames?.[currentFrame]?.elements || [];
  };

  const updateElements = (newElements) => {
    const frames = [...(project.data?.frames || [])];
    frames[currentFrame] = { elements: newElements };
    const newData = { ...project.data, frames };
    projectDataRef.current = newData;
    updateProjectMutation.mutate({ id: project.id, data: newData });
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
               updateProjectMutation.mutate({ id: project.id, data });
             }}
             selectedElements={selectedElements}
             onSelectedElementsChange={setSelectedElements}
             zoom={zoom}
             onZoomChange={setZoom}
           />
          
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