import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiUrl } from '@config/api.js';
import { DEVICES } from '@config/constants.js';

/*
 * FAIT QUOI : Logique métier éditeur (sélection, device, CRUD éléments)
 * REÇOIT : Rien (hook autonome avec params)
 * RETOURNE : États éditeur et handlers
 * ERREURS : Gérées avec states d'erreur
 */

export function useEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // États éditeur
  const [project, setProject] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(DEVICES.DESKTOP);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showComponentSelector, setShowComponentSelector] = useState(false);
  const [showContainerSelector, setShowContainerSelector] = useState(false);

  // Chargement projet au montage
  useEffect(() => {
    if (id) {
      loadProject(id);
    } else {
      setError('Project ID is required');
      setLoading(false);
    }
  }, [id]);

  // Chargement projet
  const loadProject = async (projectId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(apiUrl(`projects/${projectId}`));
      const data = await response.json();
      
      if (data.success) {
        setProject(data.project);
        console.log('Project loaded:', data.project);
      } else {
        setError(data.error || 'Failed to load project');
      }
    } catch (error) {
      console.error('Load project error:', error);
      setError(`Failed to load project: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarde projet
  const saveProject = async () => {
    if (!isDirty || !project) {
      console.log('Nothing to save');
      return;
    }
    
    try {
      console.log('Saving project...');
      
      const response = await fetch(apiUrl(`projects/${project.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsDirty(false);
        console.log('Project saved successfully');
      } else {
        setError(data.error || 'Failed to save project');
      }
    } catch (error) {
      console.error('Save error:', error);
      setError(`Save failed: ${error.message}`);
    }
  };

  // Mise à jour projet
  const updateProject = (updates) => {
    setProject(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  // Handlers éditeur
  const handleElementSelect = (element) => {
    console.log('Element selected:', element);
    setSelectedElement(element);
  };

  const handleElementUpdate = (elementId, updates) => {
    console.log('Element update:', elementId, updates);
    // TODO: Implement deep element update logic
    setIsDirty(true);
  };

  const handleDeviceChange = (device) => {
    console.log('Device changed:', device);
    setSelectedDevice(device);
  };

  const handleBackToDashboard = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Leave anyway?')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const clearError = () => {
    setError(null);
  };

  // CRUD Operations (implementations basiques)
  const handleAddPage = () => {
    console.log('Add page clicked');
    setShowComponentSelector(false);
    setShowContainerSelector(false);
    // TODO: Implement page addition
  };

  const handleAddSection = (pageId) => {
    console.log('Add section clicked for page:', pageId);
    setShowComponentSelector(false);
    setShowContainerSelector(false);
    // TODO: Implement section addition
  };

  const handleAddDiv = () => {
    console.log('Add div clicked');
    setShowContainerSelector(true);
    setShowComponentSelector(false);
  };

  const handleAddComponent = () => {
    console.log('Add component clicked');
    setShowComponentSelector(true);
    setShowContainerSelector(false);
  };

  const handleDeleteElement = (elementId) => {
    console.log('Delete element:', elementId);
    if (window.confirm('Delete this element?')) {
      // TODO: Implement element deletion
      setIsDirty(true);
    }
  };

  const handleComponentSelect = (componentType) => {
    console.log('Component selected:', componentType);
    // TODO: Add component to selected container
    setShowComponentSelector(false);
    setIsDirty(true);
  };

  const handleContainerSelect = (containerType) => {
    console.log('Container selected:', containerType);
    // TODO: Add container to selected section
    setShowContainerSelector(false);
    setIsDirty(true);
  };

  const handleCloseComponentSelector = () => {
    setShowComponentSelector(false);
  };

  const handleCloseContainerSelector = () => {
    setShowContainerSelector(false);
  };

  return {
    // États
    project,
    selectedElement,
    selectedDevice,
    loading,
    error,
    isDirty,
    showComponentSelector,
    showContainerSelector,
    
    // Fonctions projet
    saveProject,
    updateProject,
    clearError,
    
    // Handlers éditeur
    handleElementSelect,
    handleElementUpdate,
    handleDeviceChange,
    handleBackToDashboard,
    
    // CRUD Operations
    handleAddPage,
    handleAddSection,
    handleAddDiv,
    handleAddComponent,
    handleDeleteElement,
    
    // Component/Container Selector
    handleComponentSelect,
    handleContainerSelect,
    handleCloseComponentSelector,
    handleCloseContainerSelector
  };
}