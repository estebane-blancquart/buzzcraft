import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiUrl } from '@config/api.js';
import { DEVICES } from '@config/constants.js';

/*
 * FAIT QUOI : Logique métier éditeur (sélection, device, CRUD éléments)
 * REÇOIT : Rien (hook autonome avec params)
 * RETOURNE : États éditeur et handlers complets
 * ERREURS : Gérées avec states d'erreur + pattern BuzzCraft
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
  const [pendingSectionId, setPendingSectionId] = useState(null); // Pour retenir l'ID section lors sélection container

  // Cache des templates pour éviter les re-fetch
  const [templatesCache, setTemplatesCache] = useState({
    components: new Map(),
    containers: new Map(),
    loaded: false
  });

  // Chargement projet au montage
  useEffect(() => {
    if (id) {
      loadProject(id);
    } else {
      setError('Project ID is required');
      setLoading(false);
    }
  }, [id]);

  // Chargement des templates au montage
  useEffect(() => {
    loadTemplates();
  }, []);

  // Chargement projet
  const loadProject = async (projectId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(apiUrl(`projects/${projectId}`));
      const data = await response.json();
      
      if (data.success) {
        setProject(data.data.project);
        console.log('Project loaded:', data.data.project);
      } else {
        throw new Error(data.error || 'Failed to load project');
      }
    } catch (error) {
      console.error('Load project error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Chargement templates
  const loadTemplates = async () => {
    try {
      // Templates components
      const componentsResponse = await fetch(apiUrl('templates/components'));
      const componentsData = await componentsResponse.json();
      
      if (componentsData.success) {
        const componentsMap = new Map();
        componentsData.data.components.forEach(comp => {
          componentsMap.set(comp.type, comp);
        });
        
        setTemplatesCache(prev => ({
          ...prev,
          components: componentsMap
        }));
      }

      // Templates containers
      const containersResponse = await fetch(apiUrl('templates/containers'));
      const containersData = await containersResponse.json();
      
      if (containersData.success) {
        const containersMap = new Map();
        containersData.data.containers.forEach(container => {
          containersMap.set(container.type, container);
        });
        
        setTemplatesCache(prev => ({
          ...prev,
          containers: containersMap,
          loaded: true
        }));
      }
      
    } catch (error) {
      console.error('Load templates error:', error);
    }
  };

  // Sauvegarde projet
  const saveProject = async () => {
    try {
      const response = await fetch(apiUrl(`projects/${project.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsDirty(false);
        console.log('Project saved successfully');
      } else {
        throw new Error(data.error || 'Save failed');
      }
    } catch (error) {
      console.error('Save project error:', error);
      throw error;
    }
  };

  // Mise à jour projet
  const updateProject = (updates) => {
    setProject(prevProject => ({
      ...prevProject,
      ...updates
    }));
    setIsDirty(true);
  };

  // Fonction helper pour trouver un élément par ID dans la structure
  const findElementById = (structure, targetId) => {
    console.log('🔍 Searching for element:', targetId);
    
    if (!structure || !structure.pages) {
      console.log('❌ No structure or pages');
      return null;
    }
    
    // Vérifier si c'est le projet
    if (structure.id === targetId) {
      console.log('✅ Found project element');
      return structure;
    }
    
    for (const page of structure.pages) {
      // Vérifier si c'est une page
      if (page.id === targetId) {
        console.log('✅ Found page element');
        return page;
      }
      
      if (!page.layout?.sections) continue;
      
      for (const section of page.layout.sections) {
        // Vérifier si c'est une section
        if (section.id === targetId) {
          console.log('✅ Found section element');
          return section;
        }
        
        // Vérifier dans tous les types de containers (div, list, form)
        for (const containerType of ['divs', 'lists', 'forms']) {
          const containers = section[containerType];
          if (!Array.isArray(containers)) continue;
          
          for (const container of containers) {
            // Vérifier si c'est un container
            if (container.id === targetId) {
              console.log('✅ Found container element');
              return container;
            }
            
            // Vérifier dans les components
            if (Array.isArray(container.components)) {
              for (const component of container.components) {
                if (component.id === targetId) {
                  console.log('✅ Found component element');
                  return component;
                }
              }
            }
            
            // Vérifier dans les items de liste
            if (Array.isArray(container.items)) {
              for (const item of container.items) {
                if (item.id === targetId) {
                  console.log('✅ Found list item element');
                  return item;
                }
              }
            }
          }
        }
      }
    }
    
    console.log('❌ Element not found');
    return null;
  };

  // Handlers éditeur
  const handleElementSelect = (element) => {
    console.log('🎯 ELEMENT SELECTED:', element);
    setSelectedElement(element);
  };

  const handleElementUpdate = (elementId, updates) => {
    console.log('🚀 Element update requested:', { elementId, updates });
    
    if (!project || !elementId) {
      console.warn('Cannot update element: missing project or elementId');
      return;
    }
    
    setProject(prevProject => {
      const updatedProject = JSON.parse(JSON.stringify(prevProject)); // Deep clone
      
      // Navigation hiérarchique pour mise à jour
      const findAndUpdateElement = (structure) => {
        if (!structure.pages) return false;
        
        // Vérifier si c'est le projet
        if (structure.id === elementId) {
          Object.assign(structure, updates);
          console.log('✅ Updated project element');
          return true;
        }
        
        for (const page of structure.pages) {
          // Vérifier si c'est une page
          if (page.id === elementId) {
            Object.assign(page, updates);
            console.log('✅ Updated page element');
            return true;
          }
          
          if (!page.layout?.sections) continue;
          
          for (const section of page.layout.sections) {
            // Vérifier si c'est une section
            if (section.id === elementId) {
              Object.assign(section, updates);
              console.log('✅ Updated section element');
              return true;
            }
            
            // Vérifier dans tous les types de containers (div, list, form)
            for (const containerType of ['divs', 'lists', 'forms']) {
              const containers = section[containerType];
              if (!Array.isArray(containers)) continue;
              
              for (const container of containers) {
                // Vérifier si c'est un container
                if (container.id === elementId) {
                  Object.assign(container, updates);
                  console.log('✅ Updated container element');
                  return true;
                }
                
                // Vérifier dans les components
                if (Array.isArray(container.components)) {
                  for (const component of container.components) {
                    if (component.id === elementId) {
                      Object.assign(component, updates);
                      console.log('✅ Updated component element');
                      return true;
                    }
                  }
                }
                
                // Vérifier dans les items de liste
                if (Array.isArray(container.items)) {
                  for (const item of container.items) {
                    if (item.id === elementId) {
                      Object.assign(item, updates);
                      console.log('✅ Updated list item element');
                      return true;
                    }
                  }
                }
              }
            }
          }
        }
        return false;
      };
      
      const success = findAndUpdateElement(updatedProject);
      
      if (success) {
        console.log('🎉 Element updated in project state');
      } else {
        console.error('❌ Failed to find and update element:', elementId);
      }
      
      return updatedProject;
    });
    
    // 🔥 FIX CRITIQUE : Mettre à jour selectedElement aussi !
    setSelectedElement(prevSelected => {
      if (prevSelected && prevSelected.id === elementId) {
        const updatedElement = { ...prevSelected, ...updates };
        console.log('🎯 Updated selectedElement:', updatedElement);
        return updatedElement;
      }
      return prevSelected;
    });
    
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

  // === GESTION ÉLÉMENTS ===

  // Ajout page
  const handleAddPage = (pageData) => {
    if (!project) return;

    const newPage = {
      ...pageData,
      id: `page-${Date.now()}`,
      layout: {
        sections: []
      }
    };

    updateProject({
      pages: [...(project.pages || []), newPage]
    });

    console.log('Page added:', newPage.id);
  };

  // Ajout section
  const handleAddSection = (pageId, sectionData) => {
    if (!project || !pageId) return;

    const newSection = {
      ...sectionData,
      id: `section-${Date.now()}`,
      divs: [],
      lists: [],
      forms: []
    };

    setProject(prevProject => {
      const updatedProject = JSON.parse(JSON.stringify(prevProject));
      
      const page = updatedProject.pages?.find(p => p.id === pageId);
      if (page) {
        if (!page.layout) page.layout = {};
        if (!page.layout.sections) page.layout.sections = [];
        
        page.layout.sections.push(newSection);
      }
      
      return updatedProject;
    });

    setIsDirty(true);
    console.log('Section added:', newSection.id);
  };

  // Ajout div/container
  const handleAddDiv = (sectionId) => {
    console.log('Add div to section:', sectionId);
    setPendingSectionId(sectionId);
    setShowContainerSelector(true);
  };

  // Ajout composant
  const handleAddComponent = (containerId) => {
    console.log('Add component to container:', containerId);
    setPendingSectionId(containerId); // Réutilise la même logique
    setShowComponentSelector(true);
  };

  // Sélection container
  const handleContainerSelect = (containerType) => {
    if (!pendingSectionId || !templatesCache.containers.has(containerType)) {
      console.error('Cannot add container: missing sectionId or template');
      return;
    }

    const template = templatesCache.containers.get(containerType);
    const newContainer = {
      ...template,
      id: `${containerType}-${Date.now()}`,
      components: []
    };

    setProject(prevProject => {
      const updatedProject = JSON.parse(JSON.stringify(prevProject));
      
      // Trouver la section et ajouter le container
      const addContainerToSection = (structure) => {
        if (!structure.pages) return false;
        
        for (const page of structure.pages) {
          if (!page.layout?.sections) continue;
          
          for (const section of page.layout.sections) {
            if (section.id === pendingSectionId) {
              // Ajouter au bon array selon le type
              const arrayKey = containerType === 'div' ? 'divs' : 
                             containerType === 'list' ? 'lists' : 'forms';
              
              if (!section[arrayKey]) section[arrayKey] = [];
              section[arrayKey].push(newContainer);
              return true;
            }
          }
        }
        return false;
      };
      
      addContainerToSection(updatedProject);
      return updatedProject;
    });

    setIsDirty(true);
    setShowContainerSelector(false);
    setPendingSectionId(null);
    console.log('Container added:', newContainer.id);
  };

  // Sélection composant
  const handleComponentSelect = (componentType) => {
    if (!pendingSectionId || !templatesCache.components.has(componentType)) {
      console.error('Cannot add component: missing containerId or template');
      return;
    }

    const template = templatesCache.components.get(componentType);
    const newComponent = {
      ...template,
      id: `${componentType}-${Date.now()}`
    };

    setProject(prevProject => {
      const updatedProject = JSON.parse(JSON.stringify(prevProject));
      
      // Trouver le container et ajouter le composant
      const addComponentToContainer = (structure) => {
        if (!structure.pages) return false;
        
        for (const page of structure.pages) {
          if (!page.layout?.sections) continue;
          
          for (const section of page.layout.sections) {
            // Vérifier dans tous les types de containers
            for (const containerType of ['divs', 'lists', 'forms']) {
              const containers = section[containerType];
              if (!Array.isArray(containers)) continue;
              
              for (const container of containers) {
                if (container.id === pendingSectionId) {
                  if (!container.components) container.components = [];
                  container.components.push(newComponent);
                  return true;
                }
              }
            }
          }
        }
        return false;
      };
      
      addComponentToContainer(updatedProject);
      return updatedProject;
    });

    setIsDirty(true);
    setShowComponentSelector(false);
    setPendingSectionId(null);
    console.log('Component added:', newComponent.id);
  };

  // Suppression élément
  const handleDeleteElement = (elementId) => {
    if (!elementId || !window.confirm('Delete this element?')) return;

    setProject(prevProject => {
      const updatedProject = JSON.parse(JSON.stringify(prevProject));
      
      // Navigation hiérarchique pour suppression
      const deleteElementFromStructure = (structure) => {
        if (!structure.pages) return false;
        
        // Supprimer des pages
        structure.pages = structure.pages.filter(page => {
          if (page.id === elementId) return false;
          
          if (page.layout?.sections) {
            // Supprimer des sections
            page.layout.sections = page.layout.sections.filter(section => {
              if (section.id === elementId) return false;
              
              // Supprimer des containers
              for (const containerType of ['divs', 'lists', 'forms']) {
                if (Array.isArray(section[containerType])) {
                  section[containerType] = section[containerType].filter(container => {
                    if (container.id === elementId) return false;
                    
                    // Supprimer des composants
                    if (Array.isArray(container.components)) {
                      container.components = container.components.filter(comp => comp.id !== elementId);
                    }
                    
                    return true;
                  });
                }
              }
              
              return true;
            });
          }
          
          return true;
        });
        
        return true;
      };
      
      deleteElementFromStructure(updatedProject);
      return updatedProject;
    });

    // Désélectionner si l'élément supprimé était sélectionné
    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }

    setIsDirty(true);
    console.log('Element deleted:', elementId);
  };

  // Fermeture selectors
  const handleCloseComponentSelector = () => {
    setShowComponentSelector(false);
    setPendingSectionId(null);
  };

  const handleCloseContainerSelector = () => {
    setShowContainerSelector(false);
    setPendingSectionId(null);
  };

  // Retour hook complet
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
    templatesCache,

    // Handlers éléments
    handleElementSelect,
    handleElementUpdate,
    handleDeviceChange,
    handleBackToDashboard,
    clearError,

    // Opérations projet
    saveProject,
    updateProject,

    // Gestion éléments
    handleAddPage,
    handleAddSection,
    handleAddDiv,
    handleAddComponent,
    handleDeleteElement,

    // Sélecteurs
    handleComponentSelect,
    handleContainerSelect,
    handleCloseComponentSelector,
    handleCloseContainerSelector
  };
}