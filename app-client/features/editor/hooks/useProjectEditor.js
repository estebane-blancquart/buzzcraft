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

  // === CRUD OPERATIONS ===
  
  const handleAddPage = () => {
    console.log('📄 EDITOR: Adding new page');
    
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
    console.log('📐 EDITOR: Adding section to:', pagePath);
    
    const newSection = {
      id: `section-${Date.now()}`,
      name: 'Nouvelle Section',
      desktop: 3,
      tablet: 2,
      mobile: 1,
      divs: []
    };
    
    const updatedProject = { ...project };
    
    // Parse le path: "project.pages[0]"
    const pathParts = pagePath.split('.');
    console.log('Path parts:', pathParts); // Debug
    
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
    console.log('📦 EDITOR: Adding div to:', sectionPath);
    
    const newDiv = {
      id: `div-${Date.now()}`,
      name: 'Nouveau Div',
      classname: '',
      components: []
    };
    
    const updatedProject = updateNestedElement(project, sectionPath, (section) => ({
      ...section,
      divs: [...(section.divs || []), newDiv]
    }));
    
    setProject(updatedProject);
    setIsDirty(true);
  };

  const handleAddComponent = (divPath) => {
    console.log('🧩 EDITOR: Adding component to:', divPath);
    
    const newComponent = {
      id: `component-${Date.now()}`,
      type: 'paragraph',
      content: 'Nouveau contenu',
      classname: ''
    };
    
    const updatedProject = updateNestedElement(project, divPath, (div) => ({
      ...div,
      components: [...(div.components || []), newComponent]
    }));
    
    setProject(updatedProject);
    setIsDirty(true);
  };

  const handleDeleteElement = (path) => {
    console.log('🗑️ EDITOR: Deleting element at:', path);
    
    const pathParts = path.split('.');
    console.log('Path parts:', pathParts);
    const updatedProject = { ...project };
    
    try {
      // project.pages[0] = 2 parties
      if (pathParts.length === 2 && pathParts[0] === 'project' && pathParts[1].startsWith('pages[')) {
        // Delete page: project.pages[0]
        const pageIndexMatch = pathParts[1].match(/pages\[(\d+)\]/);
        if (pageIndexMatch) {
          const pageIndex = parseInt(pageIndexMatch[1]);
          console.log('Deleting page at index:', pageIndex);
          updatedProject.pages.splice(pageIndex, 1);
        }
      } 
      // project.pages[0].layout.sections[0] = 4 parties
      else if (pathParts.length === 4 && pathParts[2] === 'layout' && pathParts[3].startsWith('sections[')) {
        // Delete section
        const pageIndexMatch = pathParts[1].match(/pages\[(\d+)\]/);
        const sectionIndexMatch = pathParts[3].match(/sections\[(\d+)\]/);
        if (pageIndexMatch && sectionIndexMatch) {
          const pageIndex = parseInt(pageIndexMatch[1]);
          const sectionIndex = parseInt(sectionIndexMatch[1]);
          console.log('Deleting section at:', pageIndex, sectionIndex);
          updatedProject.pages[pageIndex].layout.sections.splice(sectionIndex, 1);
        }
      }
      // project.pages[0].layout.sections[0].divs[0] = 5 parties  
      else if (pathParts.length === 5 && pathParts[4].startsWith('divs[')) {
        // Delete div
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
      // project.pages[0].layout.sections[0].divs[0].components[0] = 6 parties
      else if (pathParts.length === 6 && pathParts[5].startsWith('components[')) {
        // Delete component
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
      
      console.log('✅ Element deleted, updating project state');
      setProject(updatedProject);
      setIsDirty(true);
      
    } catch (error) {
      console.error('❌ Delete error:', error);
    }
  };

  // Helper pour mise à jour nested
  const updateNestedElement = (obj, pathString, updateFn) => {
    const pathParts = pathString.split('.');
    const updatedObj = { ...obj };
    let current = updatedObj;
    
    // Naviguer jusqu'au parent
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
    
    // Appliquer la mise à jour
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
    handleDeleteElement
  };
}