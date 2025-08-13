import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function useProjectEditor() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // États principaux
  const [project, setProject] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState('desktop');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Charger le projet au montage
  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  const loadProject = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📂 EDITOR: Loading project ${id}...`);
      const response = await fetch(`http://localhost:3000/projects/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Projet ${id} introuvable`);
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`📂 EDITOR: Project ${id} loaded successfully`);
        setProject(data.project);
        
        // Log validation warnings si présentes
        if (data.validation && data.validation.warnings?.length > 0) {
          console.warn('⚠️ Project schema warnings:', data.validation.warnings);
        }
      } else {
        throw new Error(data.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('❌ EDITOR: Load project error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async () => {
    if (!project || !isDirty) return;
    
    try {
      console.log('💾 EDITOR: Saving project...');
      const response = await fetch(`http://localhost:3000/projects/${projectId}`, {
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
        console.log('✅ EDITOR: Project saved successfully');
        setIsDirty(false);
        
        // Mettre à jour le projet avec les données retournées (lastModified, etc.)
        setProject(data.project);
      } else {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('❌ EDITOR: Save error:', error);
      setError(`Sauvegarde échouée: ${error.message}`);
    }
  };

  const updateProject = (newProject) => {
    console.log('🔄 EDITOR: Updating project state');
    setProject(newProject);
    setIsDirty(true);
  };

  const handleElementSelect = (element, path) => {
    console.log('🎯 EDITOR: Selected element:', element?.id || element?.type, path);
    setSelectedElement({ element, path });
  };

  const handleElementUpdate = (path, updatedElement) => {
    console.log('✏️ EDITOR: Updating element at path:', path);
    
    if (!project || !path) return;
    
    // Helper pour naviguer et mettre à jour l'objet nested
    const updateNestedObject = (obj, pathString, newElement) => {
      // Parse le path: "project.pages[0].layout.sections[0].divs[0].components[0]"
      const pathParts = pathString.split('.');
      let current = obj;
      
      // Naviguer jusqu'au parent de l'élément à modifier
      for (let i = 1; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        
        if (part.includes('[')) {
          // Handle array access: "pages[0]" → key="pages", index=0
          const [key, indexStr] = part.split('[');
          const index = parseInt(indexStr.replace(']', ''));
          current = current[key][index];
        } else {
          current = current[part];
        }
      }
      
      // Mettre à jour l'élément final
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart.includes('[')) {
        const [key, indexStr] = lastPart.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        current[key][index] = { ...current[key][index], ...updatedElement };
      } else {
        current[lastPart] = { ...current[lastPart], ...updatedElement };
      }
      
      return obj;
    };
    
    // Cloner le projet et appliquer la mise à jour
    const updatedProject = { ...project };
    updateNestedObject(updatedProject, path, updatedElement);
    
    console.log('✅ EDITOR: Element updated, setting dirty state');
    setProject(updatedProject);
    setIsDirty(true);
    
    // Mettre à jour l'élément sélectionné pour sync Properties
    setSelectedElement({ element: updatedElement, path });
  };

  const handleDeviceChange = (device) => {
    console.log('📱 EDITOR: Device changed to:', device);
    setSelectedDevice(device);
  };

  const handleBackToDashboard = () => {
    if (isDirty) {
      const confirmLeave = window.confirm('Vous avez des modifications non sauvegardées. Quitter quand même ?');
      if (!confirmLeave) return;
    }
    
    console.log('🏠 EDITOR: Returning to dashboard');
    navigate('/');
  };

  const clearError = () => {
    setError(null);
  };

  return {
    project,
    selectedElement,
    selectedDevice,
    loading,
    error,
    isDirty,
    saveProject,
    updateProject,
    handleElementSelect,
    handleElementUpdate,
    handleDeviceChange,
    handleBackToDashboard,
    clearError
  };
}