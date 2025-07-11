import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useEditorStore = create(devtools((set, get) => ({
  jsonProject: {
    meta: {
      projectId: 'new-project',
      title: 'Nouveau Projet',
      description: 'Description du projet',
      version: '1.0.0'
    },
    config: {
      colors: {
        primary: '#3B82F6',
        secondary: '#1E40AF',
        accent: '#EF4444'
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    structure: {
      pages: {
        home: {
          route: '/',
          modules: []
        }
      }
    },
    contentSchema: {}
  },

  selectedElement: null,
  selectedPage: 'home',
  previewMode: 'desktop',
  previewZoom: 100,
  isDirty: false,
  lastSaved: null,

  setJsonProject: (jsonProject) => set({ jsonProject, isDirty: true }),
  setSelectedElement: (elementId) => set({ selectedElement: elementId }),
  setSelectedPage: (pageId) => set({ selectedPage: pageId, selectedElement: null }),

  updateProject: (path, value) => set((state) => {
    const newProject = { ...state.jsonProject };
    let current = newProject;
    
    for (let i = 0; i < path.length - 1; i++) {
      current[path[i]] = { ...current[path[i]] };
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    
    return {
      jsonProject: newProject,
      isDirty: true
    };
  })
})));

export default useEditorStore;
