import { create } from "zustand"
import { devtools } from "zustand/middleware"

const useEditorStore = create(
  devtools(
    (set, get) => ({
      jsonProject: null,
      selectedPage: "home",
      selectedElement: null,
      previewMode: "desktop",
      previewZoom: 100,
      loading: false,
      saving: false,
      lastSaved: null,

      setJsonProject: (project) => set({ jsonProject: project }),
      setLoading: (loading) => set({ loading }),
      setSelectedPage: (page) => set({ selectedPage: page }),
      setSelectedElement: (element) => set({ selectedElement: element }),
      setPreviewMode: (mode) => set({ previewMode: mode }),
      setPreviewZoom: (zoom) => set({ previewZoom: zoom }),

      updateProject: (path, value) => {
        const state = get()
        if (!state.jsonProject) return
        const updatedProject = { ...state.jsonProject }
        let current = updatedProject
        for (let i = 0; i < path.length - 1; i++) {
          if (!current[path[i]]) current[path[i]] = {}
          current = current[path[i]]
        }
        current[path[path.length - 1]] = value
        set({ jsonProject: updatedProject })
      },

      saveProject: async () => {
        const state = get()
        const projectName = state.jsonProject?.meta?.projectId || "test-save"
        console.log("SAVE:", projectName)
        if (!state.jsonProject) {
          alert("No project loaded")
          return
        }
        set({ saving: true })
        try {
          const response = await fetch("http://localhost:3002/api/projects/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectName, project: state.jsonProject })
          })
          const result = await response.json()
          if (result.success) {
            alert("SAVE OK: " + projectName)
            set({ saving: false })
          } else {
            alert("SAVE ERROR: " + result.error)
            set({ saving: false })
          }
        } catch (error) {
          alert("SAVE FAILED: " + error.message)
          set({ saving: false })
        }
      }
    })
  )
)

export default useEditorStore
