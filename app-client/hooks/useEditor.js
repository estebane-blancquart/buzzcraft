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
        setError(data.error || 'Failed to load project');
      }
    } catch (error) {
      console.error('Load project error:', error);
      setError(`Failed to load project: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Chargement des templates depuis l'API
  const loadTemplates = async () => {
    try {
      const response = await fetch(apiUrl('projects/meta/templates'));
      const data = await response.json();
      
      if (data.success) {
        // Organiser les templates par type
        const componentTemplates = new Map();
        const containerTemplates = new Map();
        
        data.data.templates.forEach(template => {
          // Les templates components sont identifiés par leur type dans le schema
          if (template.type && ['heading', 'paragraph', 'button', 'image', 'video', 'link'].includes(template.type)) {
            componentTemplates.set(template.type, template);
          }
          // Les templates containers
          if (template.type && ['div', 'list', 'form'].includes(template.type)) {
            containerTemplates.set(template.type, template);
          }
        });
        
        setTemplatesCache({
          components: componentTemplates,
          containers: containerTemplates,
          loaded: true
        });
        
        console.log(`Templates loaded: ${componentTemplates.size} components, ${containerTemplates.size} containers`);
      }
    } catch (error) {
      console.error('Template loading error:', error);
      // Pas d'erreur critique, on peut fonctionner avec des defaults
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
      
      // CORRECTION: Utiliser PATCH au lieu de PUT + project.id numérique
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

  // Handlers éditeur
  const handleElementSelect = (element) => {
      console.log('🎯 ELEMENT SELECTED:', element); // <- Ajoute cette ligne
    console.log('Element selected:', element);
    setSelectedElement(element);
  };

  const handleElementUpdate = (elementId, updates) => {
    console.log('Element updated:', elementId, updates);
    
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
          return true;
        }
        
        for (const page of structure.pages) {
          // Vérifier si c'est une page
          if (page.id === elementId) {
            Object.assign(page, updates);
            return true;
          }
          
          if (!page.layout?.sections) continue;
          
          for (const section of page.layout.sections) {
            // Vérifier si c'est une section
            if (section.id === elementId) {
              Object.assign(section, updates);
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
                  return true;
                }
                
                // Vérifier dans les components
                if (Array.isArray(container.components)) {
                  for (const component of container.components) {
                    if (component.id === elementId) {
                      Object.assign(component, updates);
                      return true;
                    }
                  }
                }
                
                // Vérifier dans les items de liste
                if (Array.isArray(container.items)) {
                  for (const item of container.items) {
                    if (item.id === elementId) {
                      Object.assign(item, updates);
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
      
      findAndUpdateElement(updatedProject);
      return updatedProject;
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

  // Ajout de nouvelle page avec template par défaut
  const handleAddPage = () => {
    console.log('Add page clicked');
    
    if (!project) {
      console.warn('Cannot add page: no project loaded');
      return;
    }
    
    const newPage = createElementFromTemplate('page', {
      name: 'New Page',
      title: 'New Page',
      description: 'A new page'
    });
    
    setProject(prevProject => ({
      ...prevProject,
      pages: [...(prevProject.pages || []), newPage]
    }));
    
    setIsDirty(true);
    setShowComponentSelector(false);
    setShowContainerSelector(false);
  };

  // Ajout de section à une page
  const handleAddSection = (pageId) => {
    console.log('Add section clicked for page:', pageId);
    
    if (!project || !pageId) {
      console.warn('Cannot add section: missing project or pageId');
      return;
    }
    
    const newSection = createElementFromTemplate('section', {
      name: 'New Section'
    });
    
    setProject(prevProject => {
      const updatedProject = JSON.parse(JSON.stringify(prevProject)); // Deep clone
      
      for (const page of updatedProject.pages || []) {
        if (page.id === pageId) {
          if (!page.layout) page.layout = {};
          if (!page.layout.sections) page.layout.sections = [];
          page.layout.sections.push(newSection);
          break;
        }
      }
      
      return updatedProject;
    });
    
    setIsDirty(true);
    setShowComponentSelector(false);
    setShowContainerSelector(false);
  };

  // CORRIGÉ : Ajout container avec possibilité de spécifier sectionId
  const handleAddDiv = (sectionId = null) => {
    console.log('Add div clicked', sectionId ? `for section: ${sectionId}` : '');
    
    if (sectionId) {
      // Si un sectionId est fourni directement, stocker et afficher sélecteur
      setPendingSectionId(sectionId);
    } else {
      // Sinon, utiliser selectedElement comme avant
      setPendingSectionId(null);
    }
    
    setShowContainerSelector(true);
    setShowComponentSelector(false);
  };

  const handleAddComponent = () => {
    console.log('Add component clicked');
    setShowComponentSelector(true);
    setShowContainerSelector(false);
  };

  // Suppression d'élément avec navigation hiérarchique
  const handleDeleteElement = (elementId) => {
    console.log('Delete element:', elementId);
    
    if (!project || !elementId) {
      console.warn('Cannot delete element: missing project or elementId');
      return;
    }
    
    if (!window.confirm('Delete this element?')) {
      return;
    }
    
    setProject(prevProject => {
      const updatedProject = JSON.parse(JSON.stringify(prevProject)); // Deep clone
      
      // Navigation hiérarchique pour suppression
      const deleteFromStructure = (structure) => {
        if (!structure.pages) return;
        
        // Filtrer les pages
        structure.pages = structure.pages.filter(page => {
          if (page.id === elementId) return false;
          
          if (page.layout?.sections) {
            // Filtrer les sections
            page.layout.sections = page.layout.sections.filter(section => {
              if (section.id === elementId) return false;
              
              // Filtrer tous les types de containers
              for (const containerType of ['divs', 'lists', 'forms']) {
                if (Array.isArray(section[containerType])) {
                  section[containerType] = section[containerType].filter(container => {
                    if (container.id === elementId) return false;
                    
                    // Filtrer les components
                    if (Array.isArray(container.components)) {
                      container.components = container.components.filter(
                        component => component.id !== elementId
                      );
                    }
                    
                    // Filtrer les items de liste
                    if (Array.isArray(container.items)) {
                      container.items = container.items.filter(
                        item => item.id !== elementId
                      );
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
      };
      
      deleteFromStructure(updatedProject);
      
      // Désélectionner l'élément si c'est celui qui était sélectionné
      if (selectedElement?.id === elementId) {
        setSelectedElement(null);
      }
      
      return updatedProject;
    });
    
    setIsDirty(true);
  };

  // Ajout de composant au container sélectionné
  const handleComponentSelect = (componentType) => {
    console.log('Component selected:', componentType);
    
    if (!selectedElement || !project) {
      console.warn('Cannot add component: no container selected');
      return;
    }
    
    const newComponent = createElementFromTemplate('component', { type: componentType });
    
    setProject(prevProject => {
      const updatedProject = JSON.parse(JSON.stringify(prevProject)); // Deep clone
      
      // Trouver le container et ajouter le composant
      const addComponentToContainer = (structure) => {
        if (!structure.pages) return;
        
        for (const page of structure.pages) {
          if (!page.layout?.sections) continue;
          
          for (const section of page.layout.sections) {
            for (const containerType of ['divs', 'lists', 'forms']) {
              const containers = section[containerType];
              if (!Array.isArray(containers)) continue;
              
              for (const container of containers) {
                if (container.id === selectedElement.id) {
                  if (!container.components) container.components = [];
                  container.components.push(newComponent);
                  return;
                }
              }
            }
          }
        }
      };
      
      addComponentToContainer(updatedProject);
      return updatedProject;
    });
    
    setShowComponentSelector(false);
    setIsDirty(true);
  };

  // CORRIGÉ : Ajout de container à la section sélectionnée ou spécifiée
  const handleContainerSelect = (containerType) => {
    console.log('Container selected:', containerType);
    
    if (!project) {
      console.warn('Cannot add container: no project');
      return;
    }

    // Utiliser pendingSectionId si disponible, sinon selectedElement.id
    const targetSectionId = pendingSectionId || selectedElement?.id;
    
    if (!targetSectionId) {
      console.warn('Cannot add container: no section specified');
      return;
    }
    
    const newContainer = createElementFromTemplate('container', { type: containerType });
    
    setProject(prevProject => {
      const updatedProject = JSON.parse(JSON.stringify(prevProject)); // Deep clone
      
      // Trouver la section et ajouter le container
      const addContainerToSection = (structure) => {
        if (!structure.pages) return false;
        
        for (const page of structure.pages) {
          if (!page.layout?.sections) continue;
          
          for (const section of page.layout.sections) {
            if (section.id === targetSectionId) {
              const containerKey = `${containerType}s`; // divs, lists, forms
              if (!section[containerKey]) section[containerKey] = [];
              section[containerKey].push(newContainer);
              console.log(`Container ${containerType} added to section:`, targetSectionId);
              return true;
            }
          }
        }
        return false;
      };
      
      const success = addContainerToSection(updatedProject);
      if (!success) {
        console.warn('Section not found:', targetSectionId);
      }
      
      return updatedProject;
    });
    
    // Reset pending section et fermer sélecteur
    setPendingSectionId(null);
    setShowContainerSelector(false);
    setIsDirty(true);
  };

  const handleCloseComponentSelector = () => {
    setShowComponentSelector(false);
  };

  const handleCloseContainerSelector = () => {
    setShowContainerSelector(false);
    setPendingSectionId(null); // Reset pending section
  };

  // === FONCTIONS UTILITAIRES AVEC TEMPLATES ===

  // Crée un élément à partir des templates ou fallback
  const createElementFromTemplate = (elementType, overrides = {}) => {
    const timestamp = Date.now();
    const baseId = `${overrides.type || elementType}-${timestamp}`;
    
    switch (elementType) {
      case 'page':
        return {
          id: baseId,
          name: overrides.name || 'New Page',
          title: overrides.title || 'New Page',
          description: overrides.description || 'A new page',
          layout: {
            sections: []
          },
          ...overrides
        };
        
      case 'section':
        return {
          id: baseId,
          name: overrides.name || 'New Section',
          classname: 'py-6',
          divs: [],
          lists: [],
          forms: [],
          ...overrides
        };
        
      case 'component':
        return createComponentFromTemplate(overrides.type, overrides);
        
      case 'container':
        return createContainerFromTemplate(overrides.type, overrides);
        
      default:
        return {
          id: baseId,
          name: `New ${elementType}`,
          ...overrides
        };
    }
  };

  // Crée un composant à partir du template ou fallback
  const createComponentFromTemplate = (componentType, overrides = {}) => {
    const template = templatesCache.components.get(componentType);
    const timestamp = Date.now();
    const baseId = `${componentType}-${timestamp}`;
    
    if (template?.schema) {
      // Utiliser le template avec ses defaults
      const component = { 
        id: baseId,
        type: componentType,
        ...overrides 
      };
      
      // Appliquer les defaults du schema
      Object.entries(template.schema.properties || {}).forEach(([key, prop]) => {
        if (prop.default !== undefined && component[key] === undefined) {
          component[key] = prop.default;
        }
      });
      
      return component;
    }
    
    // Fallback si pas de template
    return createComponentFallback(componentType, baseId, overrides);
  };

  // Crée un container à partir du template ou fallback
  const createContainerFromTemplate = (containerType, overrides = {}) => {
    const template = templatesCache.containers.get(containerType);
    const timestamp = Date.now();
    const baseId = `${containerType}-${timestamp}`;
    
    if (template?.schema) {
      // Utiliser le template avec ses defaults
      const container = { 
        id: baseId,
        type: containerType,
        ...overrides 
      };
      
      // Appliquer les defaults du schema
      Object.entries(template.schema.properties || {}).forEach(([key, prop]) => {
        if (prop.default !== undefined && container[key] === undefined) {
          container[key] = prop.default;
        }
      });
      
      return container;
    }
    
    // Fallback si pas de template
    return createContainerFallback(containerType, baseId, overrides);
  };

  // Fallbacks pour components si templates non disponibles
  const createComponentFallback = (type, baseId, overrides) => {
    const baseComponent = { 
      id: baseId, 
      type, 
      ...overrides 
    };
    
    switch (type) {
      case 'heading':
        return {
          ...baseComponent,
          content: 'New Heading',
          level: 2,
          classname: 'text-2xl font-bold'
        };
      case 'paragraph':
        return {
          ...baseComponent,
          content: 'New paragraph text',
          classname: 'text-base'
        };
      case 'button':
        return {
          ...baseComponent,
          content: 'Click me',
          type: 'button',
          classname: 'px-4 py-2 bg-blue-500 text-white rounded'
        };
      case 'image':
        return {
          ...baseComponent,
          src: 'https://via.placeholder.com/300x200',
          alt: 'New image',
          classname: 'w-full h-auto'
        };
      case 'video':
        return {
          ...baseComponent,
          src: '',
          controls: true,
          classname: 'w-full h-auto'
        };
      case 'link':
        return {
          ...baseComponent,
          href: '#',
          content: 'New Link',
          target: '_self',
          classname: 'text-blue-500 underline'
        };
      default:
        return {
          ...baseComponent,
          content: `New ${type}`,
          classname: 'text-base'
        };
    }
  };

  // Fallbacks pour containers si templates non disponibles
  const createContainerFallback = (type, baseId, overrides) => {
    const baseContainer = { 
      id: baseId, 
      type, 
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      ...overrides 
    };
    
    switch (type) {
      case 'div':
        return {
          ...baseContainer,
          classname: 'p-4',
          components: []
        };
      case 'list':
        return {
          ...baseContainer,
          tag: 'ul',
          classname: 'space-y-2',
          items: []
        };
      case 'form':
        return {
          ...baseContainer,
          method: 'POST',
          action: '#',
          classname: 'space-y-4 p-4 border rounded',
          components: []
        };
      default:
        return {
          ...baseContainer,
          components: []
        };
    }
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
    templatesCache,
    
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