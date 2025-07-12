import React, { useState, useEffect } from "react"
import useEditorStore from "../../store/editorStore"
import NewProjectModal from "../modals/NewProjectModal"

const ProjectLoader = () => {
  const { setJsonProject, setLoading } = useEditorStore()
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)

  // Charger automatiquement le projet depuis l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const projectParam = urlParams.get('project')
    
    if (projectParam) {
      console.log('Auto-loading project from URL:', projectParam)
      loadProject(projectParam)
    }
  }, [])

  const loadProject = async (projectName) => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:3004/api/projects/load/${projectName}`)
      const data = await response.json()
      
      if (data.success) {
        setJsonProject(data.project)
        console.log("Project loaded:", projectName)
        
        // Mettre à jour l'URL sans recharger la page
        const newUrl = new URL(window.location)
        newUrl.searchParams.set('project', projectName)
        window.history.replaceState({}, '', newUrl)
      } else {
        alert("Erreur: " + data.error)
      }
    } catch (error) {
      console.error("Load error:", error)
      alert("Erreur de chargement: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setShowNewProjectModal(true)}
        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
      >
        ✨ Nouveau Projet
      </button>
      
      <button
        onClick={() => loadProject("dubois-multipage")}
        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        📄 Charger Dubois
      </button>
      
      <button
        onClick={() => loadProject("artisan-dubois-complete")}
        className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
      >
        🔧 Charger Artisan
      </button>

      <NewProjectModal 
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />
    </div>
  )
}

export default ProjectLoader