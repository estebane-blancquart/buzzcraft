import React, { useState } from "react"
import useEditorStore from "../../store/editorStore"

const AddModuleModal = ({ isOpen, onClose, pageId }) => {
  const { jsonProject, updateProject } = useEditorStore()
  const [moduleType, setModuleType] = useState("HeroSection")

  const moduleTypes = [
    { value: "HeroSection", label: "Hero Section", icon: "🎯" },
    { value: "ServicesGrid", label: "Grille Services", icon: "🔧" },
    { value: "ContactForm", label: "Formulaire Contact", icon: "📧" },
    { value: "AboutSection", label: "Section À Propos", icon: "ℹ️" },
    { value: "TestimonialsSection", label: "Témoignages", icon: "💬" },
    { value: "GallerySection", label: "Galerie Photos", icon: "🖼️" }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const moduleId = `${moduleType.toLowerCase()}_${Date.now()}`
    const newModule = {
      id: moduleId,
      type: "module",
      component: moduleType
    }

    // Ajouter le module à la page
    const currentModules = jsonProject.structure.pages[pageId]?.modules || []
    const updatedModules = [...currentModules, newModule]
    
    updateProject(['structure', 'pages', pageId, 'modules'], updatedModules)
    
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <h2 className="text-xl font-bold mb-4">Ajouter un Module</h2>
        <p className="text-sm text-gray-600 mb-4">Page: {pageId}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type de module</label>
            <div className="space-y-2">
              {moduleTypes.map(type => (
                <label key={type.value} className="flex items-center">
                  <input
                    type="radio"
                    name="moduleType"
                    value={type.value}
                    checked={moduleType === type.value}
                    onChange={(e) => setModuleType(e.target.value)}
                    className="mr-3"
                  />
                  <span className="mr-2">{type.icon}</span>
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Ajouter Module
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddModuleModal