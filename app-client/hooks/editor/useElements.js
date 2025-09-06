import { useCallback } from 'react';

/**
 * Hook gestion CRUD éléments
 * @param {Object} project - Projet actuel
 * @param {Function} updateProject - Fonction mise à jour projet
 * @returns {Object} Handlers CRUD éléments
 */
export function useElements(project, updateProject) {
  // === VALIDATION STRICTE ===
  if (!updateProject || typeof updateProject !== 'function') {
    throw new Error('[useElements] updateProject function is required');
  }

  // === HANDLERS ÉLÉMENTS ===

  /**
   * Ajoute une page au projet
   */
  const addPage = useCallback(() => {
    if (!project) {
      console.warn('[useElements] addPage: No project loaded');
      return;
    }
    
    const newPage = {
      id: `page-${Date.now()}`,
      name: 'New Page',
      route: `/page-${Date.now()}`,
      layout: {
        sections: []
      }
    };
    
    const updatedProject = {
      ...project,
      pages: [...project.pages, newPage]
    };
    
    updateProject(updatedProject);
    console.log('[useElements] ✅ Page added:', newPage.id);
  }, [project, updateProject]);

  /**
   * Ajoute une section à une page
   * @param {string} pageId - ID de la page
   */
  const addSection = useCallback((pageId) => {
    if (!project || !pageId) {
      console.warn('[useElements] addSection: Missing project or pageId');
      return;
    }
    
    const newSection = {
      id: `section-${Date.now()}`,
      name: 'New Section',
      divs: [],
      lists: [],
      forms: []
    };
    
    const updatedProject = JSON.parse(JSON.stringify(project));
    
    for (const page of updatedProject.pages) {
      if (page.id === pageId) {
        if (!page.layout) page.layout = { sections: [] };
        if (!page.layout.sections) page.layout.sections = [];
        page.layout.sections.push(newSection);
        break;
      }
    }
    
    updateProject(updatedProject);
    console.log('[useElements] ✅ Section added:', newSection.id);
  }, [project, updateProject]);

  /**
   * Ajoute un container à une section
   * @param {string} sectionId - ID de la section
   * @param {string} containerType - Type de container ('div', 'list', 'form')
   */
  const addContainer = useCallback((sectionId, containerType = 'div') => {
    if (!project || !sectionId) {
      console.warn('[useElements] addContainer: Missing project or sectionId');
      return;
    }
    
    const newContainer = {
      id: `${containerType}-${Date.now()}`,
      name: `New ${containerType.charAt(0).toUpperCase() + containerType.slice(1)}`,
      components: []
    };
    
    const updatedProject = JSON.parse(JSON.stringify(project));
    
    for (const page of updatedProject.pages) {
      if (!page.layout?.sections) continue;
      
      for (const section of page.layout.sections) {
        if (section.id === sectionId) {
          const arrayKey = containerType === 'div' ? 'divs' : 
                          containerType === 'list' ? 'lists' : 'forms';
          
          if (!section[arrayKey]) section[arrayKey] = [];
          section[arrayKey].push(newContainer);
          break;
        }
      }
    }
    
    updateProject(updatedProject);
    console.log('[useElements] ✅ Container added:', newContainer.id);
  }, [project, updateProject]);

  /**
   * Ajoute un composant à un container
   * @param {string} containerId - ID du container
   * @param {string} componentType - Type de composant
   */
  const addComponent = useCallback((containerId, componentType) => {
    if (!project || !containerId || !componentType) {
      console.error('[useElements] addComponent: Missing required params', {
        hasProject: !!project,
        containerId,
        componentType
      });
      return;
    }
    
    const newComponent = {
      id: `${componentType}-${Date.now()}`,
      type: componentType,
      name: `${componentType.charAt(0).toUpperCase() + componentType.slice(1)} Component`,
      content: componentType === 'heading' ? 'New Heading' :
               componentType === 'paragraph' ? 'New paragraph text...' :
               componentType === 'button' ? 'Click me' :
               componentType === 'link' ? 'Link text' : '',
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

    const updatedProject = JSON.parse(JSON.stringify(project));
    let componentAdded = false;
    
    for (const page of updatedProject.pages) {
      if (!page.layout?.sections) continue;
      
      for (const section of page.layout.sections) {
        for (const containerType of ['divs', 'lists', 'forms']) {
          const containers = section[containerType];
          if (!Array.isArray(containers)) continue;
          
          for (const container of containers) {
            if (container.id === containerId) {
              if (!container.components) container.components = [];
              container.components.push(newComponent);
              componentAdded = true;
              break;
            }
          }
          if (componentAdded) break;
        }
        if (componentAdded) break;
      }
      if (componentAdded) break;
    }
    
    if (!componentAdded) {
      console.error('[useElements] ❌ Container not found:', containerId);
      return;
    }
    
    updateProject(updatedProject);
    console.log('[useElements] ✅ Component added:', newComponent.id);
  }, [project, updateProject]);

  /**
   * Met à jour un élément du projet
   * @param {string} elementId - ID de l'élément
   * @param {Object} updates - Mises à jour à appliquer
   */
  const updateElement = useCallback((elementId, updates) => {
    if (!project || !elementId || !updates) {
      console.warn('[useElements] updateElement: Missing required params');
      return;
    }
    
    const updatedProject = JSON.parse(JSON.stringify(project));
    
    const findAndUpdateElement = (structure) => {
      if (!structure.pages) return false;
      
      // Vérifier si c'est le projet
      if (structure.id === elementId) {
        Object.assign(structure, updates);
        console.log('[useElements] ✅ Updated project element');
        return true;
      }
      
      for (const page of structure.pages) {
        // Vérifier si c'est une page
        if (page.id === elementId) {
          Object.assign(page, updates);
          console.log('[useElements] ✅ Updated page element');
          return true;
        }
        
        if (!page.layout?.sections) continue;
        
        for (const section of page.layout.sections) {
          // Vérifier si c'est une section
          if (section.id === elementId) {
            Object.assign(section, updates);
            console.log('[useElements] ✅ Updated section element');
            return true;
          }
          
          // Vérifier dans les containers
          for (const containerType of ['divs', 'lists', 'forms']) {
            const containers = section[containerType];
            if (!Array.isArray(containers)) continue;
            
            for (const container of containers) {
              if (container.id === elementId) {
                Object.assign(container, updates);
                console.log('[useElements] ✅ Updated container element');
                return true;
              }
              
              // Vérifier dans les composants
              if (Array.isArray(container.components)) {
                for (const component of container.components) {
                  if (component.id === elementId) {
                    Object.assign(component, updates);
                    console.log('[useElements] ✅ Updated component element');
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
    updateProject(updatedProject);
  }, [project, updateProject]);

  /**
   * Supprime un élément du projet
   * @param {string} elementId - ID de l'élément à supprimer
   */
  const deleteElement = useCallback((elementId) => {
    if (!elementId || !window.confirm('Delete this element?')) return;

    const updatedProject = JSON.parse(JSON.stringify(project));
    
    const deleteElementFromStructure = (structure) => {
      if (!structure.pages) return false;
      
      structure.pages = structure.pages.filter(page => {
        if (page.id === elementId) return false;
        
        if (page.layout?.sections) {
          page.layout.sections = page.layout.sections.filter(section => {
            if (section.id === elementId) return false;
            
            for (const containerType of ['divs', 'lists', 'forms']) {
              if (Array.isArray(section[containerType])) {
                section[containerType] = section[containerType].filter(container => {
                  if (container.id === elementId) return false;
                  
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
    updateProject(updatedProject);
    console.log('[useElements] ✅ Element deleted:', elementId);
  }, [project, updateProject]);

  // === INTERFACE PUBLIQUE ===
  return {
    // Actions CRUD
    addPage,
    addSection, 
    addContainer,
    addComponent,
    updateElement,
    deleteElement
  };
}