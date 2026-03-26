import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectStorage } from '@/api/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HelpCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/gallery/ProjectCard';
import ExportDialog from '../components/gallery/ExportDialog';

export default function Gallery() {
  const [searchTags, setSearchTags] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [exportingProject, setExportingProject] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectStorage.list(),
  });

  const createProjectMutation = useMutation({
    mutationFn: (projectData) => projectStorage.create(projectData),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries(['projects']);
      const editorPath = newProject.type === 'composition' ? 'CompositionEditor' : 'Editor';
      navigate(`/${editorPath}?id=${newProject.id}`);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId) => projectStorage.delete(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
    },
  });

  const duplicateProjectMutation = useMutation({
    mutationFn: (project) => projectStorage.create({
      name: `${project.name} (Copy)`,
      type: project.type,
      tags: project.tags || [],
      frame_count: project.frame_count,
      fps: project.fps,
      data: JSON.parse(JSON.stringify(project.data)),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
    },
  });

  const filteredProjects = projects.filter((project) => {
    const typeMatch = filterType === 'all' || project.type === filterType;
    const tagMatch = !searchTags || 
      project.tags?.some(tag => tag.toLowerCase().includes(searchTags.toLowerCase()));
    return typeMatch && tagMatch;
  });

  const [showNewMenu, setShowNewMenu] = useState(false);

  const handleNewProject = (type = 'drawing') => {
    createProjectMutation.mutate({
      name: `${type === 'composition' ? 'Composition' : 'Project'} ${projects.length + 1}`,
      type: type,
      tags: [],
      frame_count: 1,
      fps: 12,
      data: {
        frames: type === 'drawing' ? [{ elements: [] }] : undefined,
        layers: type === 'composition' ? [] : undefined,
        duration: type === 'composition' ? 30 : undefined,
        settings: { width: 800, height: 600 }
      }
    });
    setShowNewMenu(false);
  };

  return (
    <div className="min-h-screen bg-gray-300">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="text-blue-600">
          <HelpCircle className="w-6 h-6" />
        </Button>

        <div className="flex items-center gap-4 flex-1 max-w-2xl mx-8">
          <div className="relative flex-1">
            <Input
              placeholder="filter with space-separated tags"
              value={searchTags}
              onChange={(e) => setSearchTags(e.target.value)}
              className="pl-10 border-gray-300"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2"/>
                <path d="M11 11L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
              className="rounded-full font-display font-semibold"
            >
              All Clips
            </Button>
            <Button
              variant={filterType === 'drawing' ? 'default' : 'outline'}
              onClick={() => setFilterType('drawing')}
              className="rounded-full font-display font-semibold"
            >
              Drawings
            </Button>
            <Button
              variant={filterType === 'composition' ? 'default' : 'outline'}
              onClick={() => setFilterType('composition')}
              className="rounded-full font-display font-semibold"
            >
              Comps
            </Button>
          </div>
        </div>

        <div className="relative">
          <Button
            onClick={() => setShowNewMenu(!showNewMenu)}
            size="icon"
            className="text-blue-600 bg-transparent hover:bg-blue-50"
          >
            <Plus className="w-6 h-6" />
          </Button>
          
          {showNewMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[180px]">
              <button
                onClick={() => handleNewProject('drawing')}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700"
              >
                New Drawing
              </button>
              <button
                onClick={() => handleNewProject('composition')}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700"
              >
                New Composition
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={(proj) => {
                if (confirm('Are you sure you want to delete this project?')) {
                  deleteProjectMutation.mutate(proj.id);
                }
              }}
              onDuplicate={(proj) => duplicateProjectMutation.mutate(proj)}
              onExport={(proj) => setExportingProject(proj)}
            />
          ))}
        </div>
      </div>

      {/* Export Dialog */}
      {exportingProject && (
        <ExportDialog
          project={exportingProject}
          onClose={() => setExportingProject(null)}
        />
      )}
    </div>
  );
}