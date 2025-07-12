import React, { useState } from "react"
import useEditorStore from "../../store/editorStore"

const NewProjectModal = ({ isOpen, onClose }) => {
  const { createNewProject } = useEditorStore()
  const [formData, setFormData] = useState({
    title: "",
    companyName: "",
    projectId: "",
    description: ""
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createNewProject(formData)
    onClose()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <h2 className="text-xl font-bold mb-4">Nouveau Projet</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Titre du projet</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Mon Super Site"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nom entreprise</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Mon Entreprise"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ID projet (optionnel)</label>
            <input
              type="text"
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="mon-entreprise-site"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md h-20"
              placeholder="Description du projet..."
            />
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
              Créer le projet
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewProjectModal