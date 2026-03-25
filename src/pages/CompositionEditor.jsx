import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectStorage } from '@/api/storage';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import CompositionToolbar from '../components/composition/CompositionToolbar';
import CompositionCanvas from '../components/composition/CompositionCanvas';
import ClipToolsPanel from '../components/composition/ClipToolsPanel';
import CompositionTimeline from '../components/composition/CompositionTimeline';

export default function CompositionEditor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  const [selectedLayer, setSelectedLayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectStorage.get(projectId),
    enabled: !!projectId,
  });

  const { data: galleryProjects = [] } = useQuery({
    queryKey: ['gallery-projects'],
    queryFn: () => projectStorage.list(),
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => projectStorage.update(id, { data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', projectId]);
    },
  });

  const handleBack = () => {
    navigate(createPageUrl('Gallery'));
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleAddLayer = (element) => {
    const layers = [...(project?.data?.layers || [])];
    layers.push({
      id: Date.now().toString(),
      name: `Layer ${layers.length + 1}`,
      element: element,
      keyframes: [
        {
          time: 0,
          x: 400,
          y: 300,
          scale: 1,
          rotation: 0,
          opacity: 1,
        }
      ],
    });
    updateProjectMutation.mutate({
      id: project.id,
      data: { ...project.data, layers }
    });
  };

  if (!project) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-400 flex flex-col">
      <CompositionToolbar
        onBack={handleBack}
        onPlay={handlePlay}
        isPlaying={isPlaying}
        onImport={() => setShowImportMenu(true)}
      />

      <div className="flex-1 flex relative overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-8">
          <CompositionCanvas
            project={project}
            currentTime={currentTime}
            selectedLayer={selectedLayer}
            onLayerSelect={setSelectedLayer}
            onUpdate={(data) => updateProjectMutation.mutate({ id: project.id, data })}
          />
        </div>

        {selectedLayer && (
          <ClipToolsPanel
            layer={selectedLayer}
            onClose={() => setSelectedLayer(null)}
            onUpdate={(updatedLayer) => {
              const layers = project.data.layers.map(l => 
                l.id === updatedLayer.id ? updatedLayer : l
              );
              updateProjectMutation.mutate({
                id: project.id,
                data: { ...project.data, layers }
              });
            }}
            onDelete={() => {
              const layers = project.data.layers.filter(l => l.id !== selectedLayer.id);
              updateProjectMutation.mutate({
                id: project.id,
                data: { ...project.data, layers }
              });
              setSelectedLayer(null);
            }}
          />
        )}
      </div>

      <CompositionTimeline
        project={project}
        currentTime={currentTime}
        onTimeChange={setCurrentTime}
        selectedLayer={selectedLayer}
        onLayerSelect={setSelectedLayer}
        onUpdate={(data) => updateProjectMutation.mutate({ id: project.id, data })}
      />

      {showImportMenu && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <h2 className="text-xl font-semibold mb-4">Import Element</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              {galleryProjects.filter(p => p.type !== 'composition').map((proj) => (
                <div
                  key={proj.id}
                  className="border rounded-lg p-2 cursor-pointer hover:border-blue-500"
                  onClick={() => {
                    handleAddLayer({
                      type: 'project',
                      projectId: proj.id,
                      name: proj.name,
                    });
                    setShowImportMenu(false);
                  }}
                >
                  <div className="aspect-video bg-gray-200 rounded mb-2" />
                  <p className="text-sm truncate">{proj.name}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowImportMenu(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}