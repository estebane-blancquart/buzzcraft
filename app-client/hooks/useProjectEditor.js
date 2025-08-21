import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiUrl } from '@config/api.js';
import { DEVICES, ELEMENT_TYPES, UI_MESSAGES } from '@config/constants.js';

export function useProjectEditor() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  // √âtats principaux
  const [project, setProject] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(DEVICES.DESKTOP);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // √âtats pour les selectors
  const [showComponentSelector, setShowComponentSelector] = useState(false);
  const [pendingComponentPath, setPendingComponentPath] = useState(null);
  const [showContainerSelector, setShowContainerSelector] = useState(false);
  const [pendingContainerPath, setPendingContainerPath] = useState(null);

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
      console.log(`Ì≥Ç EDITOR: Loading project ${id}...`);
      const response = await fetch(apiUrl(`projects/${id}`));
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Projet ${id} introuvable`);
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`Ì≥Ç EDITOR: Project ${id} loaded successfully`);
        setProject(data.project);
        
        if (data.validation && data.validation.warnings?.length > 0) {
          console.warn('‚ö†Ô∏è Project schema warnings:', data.validation.warnings);
        }
      } else {
        throw new Error(data.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('‚ùå EDITOR: Load project error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async () => {
    if (!project || !isDirty) return;
    
    try {
      console.log('Ì≤æ EDITOR: Saving project...');
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
        console.log('‚úÖ EDITOR: Project saved successfully');
        setIsDirty(false);
        setProject(data.project);
      } else {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('‚ùå EDITOR: Save error:', error);
      setError(`Sauvegarde √©chou√©e: ${error.message}`);
    }
  };

  const updateProject = (newProject) => {
    console.log('Ì¥Ñ EDITOR: Updating project state');
    setProject(newProject);
    setIsDirty(true);
  };

  const handleElementSelect = (element, path) => {
    console.log('ÌæØ EDITOR: Selected element:', element?.id || element?.type, path);
    setSelectedElement({ element, path });
  };

  const handleElementUpdate = (path, updatedElement) => {
    console.log('‚úèÔ∏è EDITOR: Updating element at path:', path);
    
    if (!project || !path) return;
    
    const updateNestedObject = (obj, pathString, newElement) => {
      const pathParts = pathString.split('.');
      let current = obj;
      
      for (let i = 1; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        
        if (part.includes('[')) {
          const [key, indexStr] = part.split('[');
          const index = parseInt(indexStr.replace(']', ''));
          current = current[key][index];
        } else {
          current = current[part];
        }
      }
      
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
    
    const updatedProject = { ...project };
    updateNestedObject(updatedProject, path, updatedElement);
    
    console.log('‚úÖ EDITOR: Element updated, setting dirty state');
    setProject(updatedProject);
    setIsDirty(true);
    
    setSelectedElement({ element: updatedElement, path });
  };

  const handleDeviceChange = (device) => {
    console.log('Ì≥± EDITOR: Device changed to:', device);
    setSelectedDevice(device);
  };

  const handleBackToDashboard = () => {
    if (isDirty) {
      const confirmLeave = window.confirm(UI_MESSAGES.UNSAVED_CHANGES);
      if (!confirmLeave) return;
    }
    
    console.log('Ìø† EDITOR: Returning to dashboard');
    navigate('/');
  };

  const clearError = () => {
    setError(null);
  };

  // Helper pour mise √† jour nested
  const updateNestedElement = (obj, pathString, updateFn) => {
    const pathParts = pathString.split('.');
    const updatedObj = { ...obj };
    let current = updatedObj;
    
    for (let i = 1; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      
      if (part.includes('[')) {
        const [key, indexStr] = part.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        current = current[key][index];
      } else {
        current = current[part];
      }
    }
    
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart.includes('[')) {
      const [key, indexStr] = lastPart.split('[');
      const index = parseInt(indexStr.replace(']', ''));
      current[key][index] = updateFn(current[key][index]);
    } else {
      current[lastPart] = updateFn(current[lastPart]);
    }
    
    return updatedObj;
  };

  // === CRUD OPERATIONS ===
  
  const handleAddPage = () => {
    console.log('Ì≥Ñ EDITOR: Adding new page');
    
    const newPage = {
      id: `page-${Date.now()}`,
      name: 'Nouvelle Page',
      layout: {
        sections: []
      }
    };
    
    const updatedProject = {
      ...project,
      pages: [...(project.pages || []), newPage]
    };
    
    setProject(updatedProject);
    setIsDirty(true);
  };

  const handleAddSection = (pagePath) => {
    console.log('Ì≥ê EDITOR: Adding section to:', pagePath);
    
    const newSection = {
      id: `section-${Date.now()}`,
      name: 'Nouvelle Section',
      desktop: 3,
      tablet: 2,
      mobile: 1,
      divs: []
    };
    
    const updatedProject = { ...project };
    
    const pathParts = pagePath.split('.');
    console.log('Path parts:', pathParts);
    
    if (pathParts.length >= 2 && pathParts[1].includes('[')) {
      const pageIndexStr = pathParts[1].match(/\[(\d+)\]/);
      if (pageIndexStr) {
        const pageIndex = parseInt(pageIndexStr[1]);
        
        if (!updatedProject.pages[pageIndex].layout) {
          updatedProject.pages[pageIndex].layout = { sections: [] };
        }
        
        updatedProject.pages[pageIndex].layout.sections.push(newSection);
        
        setProject(updatedProject);
        setIsDirty(true);
      } else {
        console.error('Cannot parse page index from path:', pagePath);
      }
    } else {
      console.error('Invalid page path format:', pagePath);
    }
  };

  const handleAddDiv = (sectionPath) => {
    console.log('Ì≥¶ EDITOR: Opening container selector for:', sectionPath);
    setPendingContainerPath(sectionPath);
    setShowContainerSelector(true);
  };

  const handleContainerSelect = (selectedContainer) => {
    console.log('‚úÖ EDITOR: Container selected:', selectedContainer.type);
    
    if (!pendingContainerPath) return;
    
    const updatedProject = updateNestedElement(project, pendingContainerPath, (section) => {
      if (selectedContainer.type === 'div') {
        return {
          ...section,
          divs: [...(section.divs || []), selectedContainer]
        };
      } else if (selectedContainer.type === 'form') {
        return {
          ...section,
          forms: [...(section.forms || []), selectedContainer]
        };
      } else if (selectedContainer.type === 'list') {
        return {
          ...section,
          lists: [...(section.lists || []), selectedContainer]
        };
      }
      return section;
    });
    
    setProject(updatedProject);
    setIsDirty(true);
    
    setPendingContainerPath(null);
    setShowContainerSelector(false);
  };

  const handleCloseContainerSelector = () => {
    setPendingContainerPath(null);
    setShowContainerSelector(false);
  };

  const handleAddComponent = (divPath) => {
    console.log('Ì∑© EDITOR: Opening component selector for:', divPath);
    setPendingComponentPath(divPath);
    setShowComponentSelector(true);
  };

  const handleComponentSelect = (selectedComponent) => {
    console.log('‚úÖ EDITOR: Component selected:', selectedComponent.type);
    
    if (!pendingComponentPath) return;
    
    const updatedProject = updateNestedElement(project, pendingComponentPath, (div) => ({
      ...div,
      components: [...(div.components || []), selectedComponent]
    }));
    
    setProject(updatedProject);
    setIsDirty(true);
    
    setPendingComponentPath(null);
    setShowComponentSelector(false);
  };

  const handleCloseComponentSelector = () => {
    setPendingComponentPath(null);
    setShowComponentSelector(false);
  };

  const handleDeleteElement = (path) => {
    console.log('Ì∑ëÔ∏è EDITOR: Deleting element at:', path);
    
    const pathParts = path.split('.');
    console.log('Path parts:', pathParts);
    const updatedProject = { ...project };
    
    try {
      if (pathParts.length === 2 && pathParts[0] === 'project' && pathParts[1].startsWith('pages[')) {
        const pageIndexMatch = pathParts[1].match(/pages\[(\d+)\]/);
        if (pageIndexMatch) {
          const pageIndex = parseInt(pageIndexMatch[1]);
          console.log('Deleting page at index:', pageIndex);
          updatedProject.pages.splice(pageIndex, 1);
        }
      } 
      else if (pathParts.length === 4 && pathParts[2] === 'layout' && pathParts[3].startsWith('sections[')) {
        const pageIndexMatch = pathParts[1].match(/pages\[(\d+)\]/);
        const sectionIndexMatch = pathParts[3].match(/sections\[(\d+)\]/);
        if (pageIndexMatch && sectionIndexMatch) {
          const pageIndex = parseInt(pageIndexMatch[1]);
          const sectionIndex = parseInt(sectionIndexMatch[1]);
          console.log('Deleting section at:', pageIndex, sectionIndex);
          updatedProject.pages[pageIndex].layout.sections.splice(sectionIndex, 1);
        }
      }
      else if (pathParts.length === 5 && pathParts[4].startsWith('divs[')) {
        const pageIndexMatch = pathParts[1].match(/pages\[(\d+)\]/);
        const sectionIndexMatch = pathParts[3].match(/sections\[(\d+)\]/);
        const divIndexMatch = pathParts[4].match(/divs\[(\d+)\]/);
        if (pageIndexMatch && sectionIndexMatch && divIndexMatch) {
          const pageIndex = parseInt(pageIndexMatch[1]);
          const sectionIndex = parseInt(sectionIndexMatch[1]);
          const divIndex = parseInt(divIndexMatch[1]);
          console.log('Deleting div at:', pageIndex, sectionIndex, divIndex);
          updatedProject.pages[pageIndex].layout.sections[sectionIndex].divs.splice(divIndex, 1);
        }
      }
      else if (pathParts.length === 6 && pathParts[5].startsWith('components[')) {
        const pageIndexMatch = pathParts[1].match(/pages\[(\d+)\]/);
        const sectionIndexMatch = pathParts[3].match(/sections\[(\d+)\]/);
        const divIndexMatch = pathParts[4].match(/divs\[(\d+)\]/);
        const componentIndexMatch = pathParts[5].match(/components\[(\d+)\]/);
        if (pageIndexMatch && sectionIndexMatch && divIndexMatch && componentIndexMatch) {
          const pageIndex = parseInt(pageIndexMatch[1]);
          const sectionIndex = parseInt(sectionIndexMatch[1]);
          const divIndex = parseInt(divIndexMatch[1]);
          const componentIndex = parseInt(componentIndexMatch[1]);
          console.log('Deleting component at:', pageIndex, sectionIndex, divIndex, componentIndex);
          updatedProject.pages[pageIndex].layout.sections[sectionIndex].divs[divIndex].components.splice(componentIndex, 1);
        }
      } else {
        console.error('Unknown path format for deletion:', path, 'Length:', pathParts.length, 'Parts:', pathParts);
        return;
      }
      
      console.log('‚úÖ Element deleted, updating project state');
      setProject(updatedProject);
      setIsDirty(true);
      
    } catch (error) {
      console.error('‚ùå Delete error:', error);
    }
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
    clearError,
    // CRUD Operations
    handleAddPage,
    handleAddSection,
    handleAddDiv,
    handleAddComponent,
    handleDeleteElement,
    // Component Selector
    showComponentSelector,
    handleComponentSelect,
    handleCloseComponentSelector,
    // Container Selector
    showContainerSelector,
    handleContainerSelect,
    handleCloseContainerSelector
  };
}
