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
  
  // Debug des params
  console.log('🔗 useEditor params:', { id, allParams: useParams() });
  
  // États éditeur
  const [project, setProject] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(DEVICES.DESKTOP);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showComponentSelector, setShowComponentSelector] = useState(false);
  const [showContainerSelector, setShowContainerSelector] = useState(false);
  const [pendingSectionId, setPendingSectionId] = useState(null);

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

  // === OPÉRATIONS PROJET ===

  // Chargement projet
  const loadProject = async (projectId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading project:', projectId);
      const response = await fetch(apiUrl(`projects/${projectId}`));
      const data = await response.json();
      
      console.log('📡 API Response:', data);
      
      if (data.success) {
        let project = data.data.project;
        
        console.log('🗂️ Raw project data:', project);
        
        // Parser récursif pour gérer le JSON triple-nested
        while (typeof project === 'object' && typeof project.content === 'string') {
          try {
            console.log('🔄 Parsing nested JSON content...');
            project = JSON.parse(project.content);
          } catch (parseError) {
            console.error('❌ Failed to parse nested content:', parseError);
            console.error('📄 Content was:', project.content);
            throw new Error('Invalid nested JSON format');
          }
        }
        
        console.log('📋 Final parsed project:', project);
        
        // Vérifier que c'est un vrai projet avec pages
        if (!project.id || !project.pages) {
          console.error('❌ Invalid project structure:', project);
          throw new Error('Project structure is invalid');
        }
        
        // Vérifier la structure des pages
        console.log('📄 Project pages:', project.pages);
        if (project.pages && project.pages.length > 0) {
          console.log('🔍 First page sections:', project.pages[0].layout?.sections);
        }
        
        setProject(project);
        console.log('✅ Project loaded successfully:', project);
      } else {
        throw new Error(data.error || 'Failed to load project');
      }
    } catch (error) {
      console.error('❌ Error loading project:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Chargement templates
  const loadTemplates = async () => {
    if (templatesCache.loaded) return;

    try {
      console.log('Loading templates...');
      
      // Templates composants - avec fallback si API pas disponible
      const componentTypes = ['heading', 'paragraph', 'button', 'image', 'video', 'link', 'input'];
      for (const type of componentTypes) {
        try {
          const response = await fetch(apiUrl(`templates/components/${type}`));
          const data = await response.json();
          if (data.success) {
            templatesCache.components.set(type, data.data.template);
          }
        } catch (error) {
          console.warn(`Template ${type} not available, using defaults`);
          // Pas grave, on utilise les defaults dans handleComponentSelect
        }
      }

      // Templates containers - avec fallback si API pas disponible
      const containerTypes = ['div', 'form', 'list'];
      for (const type of containerTypes) {
        try {
          const response = await fetch(apiUrl(`templates/containers/${type}`));
          const data = await response.json();
          if (data.success) {
            templatesCache.containers.set(type, data.data.template);
          }
        } catch (error) {
          console.warn(`Template ${type} not available, using defaults`);
          // Pas grave, on utilise les defaults dans handleContainerSelect
        }
      }

      setTemplatesCache(prev => ({ ...prev, loaded: true }));
      console.log('Templates loaded (with fallbacks):', templatesCache);
    } catch (error) {
      console.error('Error loading templates:', error);
      // Marquer comme loaded quand même pour éviter les re-tentatives
      setTemplatesCache(prev => ({ ...prev, loaded: true }));
    }
  };

  // Sauvegarde projet
  const saveProject = async () => {
    if (!project || !isDirty) return;

    try {
      console.log('💾 Saving project:', project);
      
      const response = await fetch(apiUrl(`projects/${project.id}`), {
        method: 'PATCH', // L'API utilise PATCH pour save, pas PUT
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project })
      });

      const data = await response.json();
      if (data.success) {
        setIsDirty(false);
        console.log('✅ Project saved successfully');
      } else {
        throw new Error(data.error || 'Failed to save project');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  };

  // Mise à jour projet
  const updateProject = (updates) => {
    if (!project) return;

    setProject(prevProject => ({
      ...prevProject,
      ...updates,
      updated: new Date().toISOString()
    }));
    
    setIsDirty(true);
  };

  // === HANDLERS ÉDITEUR ===

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
      const updatedProject = JSON.parse(JSON.stringify(prevProject));
      
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
            
            // Vérifier dans les containers
            for (const containerType of ['divs', 'lists', 'forms']) {
              const containers = section[containerType];
              if (!Array.isArray(containers)) continue;
              
              for (const container of containers) {
                if (container.id === elementId) {
                  Object.assign(container, updates);
                  console.log('✅ Updated container element');
                  return true;
                }
                
                // Vérifier dans les composants
                if (Array.isArray(container.components)) {
                  for (const component of container.components) {
                    if (component.id === elementId) {
                      Object.assign(component, updates);
                      console.log('✅ Updated component element');
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

    // Mettre à jour selectedElement si c'est lui qui est modifié
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
  const handleAddPage = () => {
    if (!project) return;

    const newPage = {
      id: `page-${Date.now()}`,
      name: `Page ${(project.pages?.length || 0) + 1}`,
      slug: `page-${(project.pages?.length || 0) + 1}`,
      title: `Page ${(project.pages?.length || 0) + 1}`,
      metaDescription: '',
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
  const handleAddSection = (pageId) => {
    if (!project || !pageId) return;

    const newSection = {
      id: `section-${Date.now()}`,
      name: `Section ${Date.now()}`,
      tag: 'section',
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
    console.log('🎯 handleAddDiv called with sectionId:', sectionId);
    
    if (!sectionId) {
      console.error('handleAddDiv: No sectionId provided!');
      return;
    }
    
    setPendingSectionId(sectionId);
    setShowContainerSelector(true);
    console.log('✅ Modal should open now, pendingSectionId set to:', sectionId);
  };

  // Ajout composant
  const handleAddComponent = (containerId) => {
    console.log('Add component to container:', containerId);
    setPendingSectionId(containerId);
    setShowComponentSelector(true);
  };

  // Sélection container - VERSION SIMPLE SANS DÉPENDANCE TEMPLATES
  const handleContainerSelect = (containerType) => {
    console.log('🔧 handleContainerSelect called:', { containerType, pendingSectionId });
    
    if (!pendingSectionId) {
      console.error('❌ Cannot add container: missing sectionId');
      alert('Erreur: Aucune section sélectionnée');
      return;
    }

    // Créer le container avec propriétés par défaut (sans dépendre de templates)
    const newContainer = {
      type: containerType,
      id: `${containerType}-${Date.now()}`,
      name: `${containerType.charAt(0).toUpperCase() + containerType.slice(1)}`,
      components: [],
      // Propriétés par défaut selon le type
      ...(containerType === 'form' && {
        action: '',
        method: 'post'
      }),
      ...(containerType === 'list' && {
        listType: 'ul'
      })
    };

    console.log('🆕 Creating container:', newContainer);

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
              console.log(`✅ Container added to section.${arrayKey}`);
              return true;
            }
          }
        }
        return false;
      };
      
      const success = addContainerToSection(updatedProject);
      if (!success) {
        console.error('❌ Failed to find section:', pendingSectionId);
      }
      
      return updatedProject;
    });

    setIsDirty(true);
    setShowContainerSelector(false);
    setPendingSectionId(null);
    console.log('✅ Container added successfully:', newContainer.id);
  };

  // Sélection composant
  const handleComponentSelect = (componentType) => {
    if (!pendingSectionId) {
      console.error('Cannot add component: missing containerId');
      return;
    }

    // Créer le component avec propriétés par défaut
    const newComponent = {
      type: componentType,
      id: `${componentType}-${Date.now()}`,
      // Contenu par défaut selon le type
      content: componentType === 'heading' ? 'New Heading' :
               componentType === 'paragraph' ? 'New paragraph text...' :
               componentType === 'button' ? 'Click me' :
               componentType === 'link' ? 'Link text' : '',
      // Propriétés par défaut selon le type
      ...(componentType === 'heading' && { tag: 'h2' }),
      ...(componentType === 'image' && { 
        src: 'https://via.placeholder.com/300x200?text=Image',
        alt: 'Image' 
      }),
      ...(componentType === 'input' && {
        inputType: 'text',
        placeholder: 'Enter text...'
      }),
      ...(componentType === 'link' && {
        href: '#'
      })
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