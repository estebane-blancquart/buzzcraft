import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiUrl } from '@config/api.js';

export function useProjectEditor() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  const loadProject = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(apiUrl(`projects/${id}`));
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Projet ${id} introuvable`);
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProject(data.project);
      } else {
        throw new Error(data.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async () => {
    if (!project || !isDirty) return;
    
    try {
      const response = await fetch(apiUrl(`projects/${projectId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });

      if (!response.ok) {
        throw new Error(`Erreur sauvegarde: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setIsDirty(false);
        setProject(data.project);
        console.log('Projet sauvegardé:', data.message);
      } else {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      setError(`Sauvegarde échouée: ${error.message}`);
    }
  };

  // VRAIES FONCTIONS D'ÉDITION
  const updateProjectName = (newName) => {
    setProject(prev => ({ ...prev, name: newName }));
    setIsDirty(true);
  };

  const addPage = () => {
    const newPage = {
      id: `page-${Date.now()}`,
      name: 'Nouvelle Page',
      layout: { sections: [] }
    };
    
    setProject(prev => ({
      ...prev,
      pages: [...(prev.pages || []), newPage]
    }));
    setIsDirty(true);
  };

  const deletePage = (pageIndex) => {
    setProject(prev => ({
      ...prev,
      pages: prev.pages.filter((_, i) => i !== pageIndex)
    }));
    setIsDirty(true);
    setSelectedElement(null);
  };

  const updatePageName = (pageIndex, newName) => {
    setProject(prev => ({
      ...prev,
      pages: prev.pages.map((page, i) => 
        i === pageIndex ? { ...page, name: newName } : page
      )
    }));
    setIsDirty(true);
  };

  const selectElement = (element, path) => {
    setSelectedElement({ element, path });
  };

  const handleBackToDashboard = () => {
    if (isDirty) {
      const confirmLeave = window.confirm('Vous avez des modifications non sauvegardées. Quitter quand même ?');
      if (!confirmLeave) return;
    }
    navigate('/');
  };

  const clearError = () => {
    setError(null);
  };

  return {
    project,
    selectedElement,
    loading,
    error,
    isDirty,
    saveProject,
    updateProjectName,
    addPage,
    deletePage,
    updatePageName,
    selectElement,
    handleBackToDashboard,
    clearError
  };
}
