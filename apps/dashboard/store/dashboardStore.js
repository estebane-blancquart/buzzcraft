import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useDashboardStore = create(
  devtools(
    (set, get) => ({
      projects: [],
      loading: false,
      error: null,
      
      // États des projets
      projectStates: {}, // { projectId: { status: 'DRAFT|BUILT|DEPLOYED', building: false, deploying: false } }
      
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setProjects: (projects) => set({ projects }),
      
      // Charger tous les projets
      loadProjects: async () => {
        set({ loading: true, error: null })
        try {
          const response = await fetch('http://localhost:3004/api/projects/list')
          const data = await response.json()
          
          if (data.success) {
            set({ projects: data.projects })
            
            // Initialiser les états des projets
            const states = {}
            data.projects.forEach(project => {
              states[project.meta.projectId] = {
                status: 'DRAFT', // TODO: déterminer le vrai statut
                building: false,
                deploying: false
              }
            })
            set({ projectStates: states })
          } else {
            set({ error: data.error })
          }
        } catch (error) {
          set({ error: error.message })
        } finally {
          set({ loading: false })
        }
      },
      
      // Actions sur les projets
      deleteProject: async (projectId) => {
        try {
          const response = await fetch(`http://localhost:3004/api/projects/delete/${projectId}`, {
            method: 'DELETE'
          })
          const data = await response.json()
          
          if (data.success) {
            const state = get()
            const updatedProjects = state.projects.filter(p => p.meta.projectId !== projectId)
            const updatedStates = { ...state.projectStates }
            delete updatedStates[projectId]
            
            set({ 
              projects: updatedProjects,
              projectStates: updatedStates 
            })
          }
        } catch (error) {
          set({ error: error.message })
        }
      },
      
      // Générer le site (Parser)
      buildProject: async (projectId) => {
        const state = get()
        set({
          projectStates: {
            ...state.projectStates,
            [projectId]: { ...state.projectStates[projectId], building: true }
          }
        })
        
        try {
          const response = await fetch('http://localhost:3004/api/projects/build', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId })
          })
          const data = await response.json()
          
          if (data.success) {
            set({
              projectStates: {
                ...get().projectStates,
                [projectId]: { 
                  ...get().projectStates[projectId], 
                  building: false,
                  status: 'BUILT'
                }
              }
            })
          }
        } catch (error) {
          set({ error: error.message })
        }
      },
      
      // Déployer le site (Engine)
      deployProject: async (projectId) => {
        const state = get()
        set({
          projectStates: {
            ...state.projectStates,
            [projectId]: { ...state.projectStates[projectId], deploying: true }
          }
        })
        
        try {
          const response = await fetch('http://localhost:3004/api/projects/deploy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId })
          })
          const data = await response.json()
          
          if (data.success) {
            set({
              projectStates: {
                ...get().projectStates,
                [projectId]: { 
                  ...get().projectStates[projectId], 
                  deploying: false,
                  status: 'DEPLOYED'
                }
              }
            })
          }
        } catch (error) {
          set({ error: error.message })
        }
      }
    })
  )
)

export default useDashboardStore