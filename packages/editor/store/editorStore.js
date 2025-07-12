import { create } from "zustand";
import { devtools } from "zustand/middleware";

const useEditorStore = create(
  devtools((set, get) => ({
    jsonProject: null,
    selectedPage: "home",
    selectedElement: null,
    previewMode: "desktop",
    previewZoom: 100,
    loading: false,
    saving: false,
    lastSaved: null,
    isDirty: false,

    setJsonProject: (project) => set({ jsonProject: project, isDirty: false }),
    setLoading: (loading) => set({ loading }),
    setSelectedPage: (page) => set({ selectedPage: page }),
    setSelectedElement: (element) => set({ selectedElement: element }),
    setPreviewMode: (mode) => set({ previewMode: mode }),
    setPreviewZoom: (zoom) => set({ previewZoom: zoom }),

    createNewProject: (projectConfig) => {
      const timestamp = new Date().toISOString();
      const projectId = projectConfig.projectId || "projet-" + Date.now();

      const newProject = {
        meta: {
          projectId,
          version: "1.0.0",
          title: projectConfig.title || "Nouveau Projet",
          description:
            projectConfig.description || "Projet cree avec BuzzCraft Editor",
          created: timestamp,
          lastModified: timestamp,
          author: "BuzzCraft Editor",
          buzzcraft_version: "1.0.0",
          template: false,
        },
        config: {
          domain: projectConfig.domain || projectId + ".example.com",
          ssl: true,
          colors: {
            primary: "#3B82F6",
            secondary: "#64748B",
            accent: "#F59E0B",
          },
          fonts: {
            heading: "Inter",
            body: "Inter",
          },
        },
        structure: {
          pages: {
            home: {
              route: "/",
              meta: {
                title: "Accueil",
                description: "Page d'accueil",
              },
              modules: [],
            },
          },
        },
        contentSchema: {
          company: {
            name: {
              type: "text",
              label: "Nom de l'entreprise",
              required: true,
              default: projectConfig.companyName || "Mon Entreprise",
            },
            phone: {
              type: "tel",
              label: "Telephone",
              required: true,
              default: "01 XX XX XX XX",
            },
          },
        },
      };

      set({
        jsonProject: newProject,
        selectedPage: "home",
        isDirty: true,
      });

      console.log("Nouveau projet cree:", projectId);
      return newProject;
    },

    addPage: (pageId) => {
      const state = get();
      if (!state.jsonProject) return;

      const newPage = {
        route: "/" + pageId,
        meta: {
          title: pageId,
          description: "Description de la page",
        },
        modules: [],
      };

      const updatedProject = {
        ...state.jsonProject,
        structure: {
          ...state.jsonProject.structure,
          pages: {
            ...state.jsonProject.structure.pages,
            [pageId]: newPage,
          },
        },
      };

      set({
        jsonProject: updatedProject,
        selectedPage: pageId,
        isDirty: true,
      });
    },

    updateProject: (path, value) => {
      const state = get();
      if (!state.jsonProject) return;
      const updatedProject = { ...state.jsonProject };
      let current = updatedProject;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      set({ jsonProject: updatedProject, isDirty: true });
    },

    saveProject: async () => {
      const state = get();
      const projectName = state.jsonProject?.meta?.projectId || "test-save";
      if (!state.jsonProject) {
        alert("No project loaded");
        return;
      }
      set({ saving: true });
      try {
        const response = await fetch(
          "http://localhost:3004/api/projects/save",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectName, project: state.jsonProject }),
          }
        );
        const result = await response.json();
        if (result.success) {
          alert("SAVE OK: " + projectName);
          set({
            saving: false,
            isDirty: false,
            lastSaved: new Date().toISOString(),
          });
        } else {
          alert("SAVE ERROR: " + result.error);
          set({ saving: false });
        }
      } catch (error) {
        alert("SAVE FAILED: " + error.message);
        set({ saving: false });
      }
    },

    undo: () => {
      console.log("TODO: Undo functionality");
    },

    redo: () => {
      console.log("TODO: Redo functionality");
    },
  }))
);

export default useEditorStore;
