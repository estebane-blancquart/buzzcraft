/**
 * COMMIT 65 - Panel Config
 * 
 * FAIT QUOI : Configuration composants avec bibliothèque éditable et prévisualisation
 * REÇOIT : componentLibrary: object[], editMode?: boolean, preview?: boolean
 * RETOURNE : { components: object[], library: object, validation: object, preview: object }
 * ERREURS : ComponentError si composant invalide, LibraryError si bibliothèque corrompue, PreviewError si preview échoue
 */

export async function createComponentsConfig(componentLibrary = [], editMode = true, preview = false) {
  if (!Array.isArray(componentLibrary)) {
    throw new Error('ComponentError: ComponentLibrary doit être array');
  }

  if (typeof editMode !== 'boolean') {
    throw new Error('ComponentError: EditMode doit être boolean');
  }

  if (typeof preview !== 'boolean') {
    throw new Error('ComponentError: Preview doit être boolean');
  }

  try {
    const components = componentLibrary.length > 0 ? componentLibrary : getDefaultComponents();
    
    const library = {
      total: components.length,
      categories: groupComponentsByCategory(components),
      editable: editMode,
      previewEnabled: preview
    };

    const validation = await validateComponentLibrary(components);
    const previewConfig = preview ? await initializePreview(components) : null;

    return {
      components,
      library,
      validation,
      preview: previewConfig,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`ComponentError: Création config composants échouée: ${error.message}`);
  }
}

export async function validateComponentDefinitions(components, rules = {}) {
  if (!Array.isArray(components)) {
    throw new Error('ComponentError: Components doit être array');
  }

  if (typeof rules !== 'object') {
    throw new Error('ComponentError: Rules doit être object');
  }

  try {
    const issues = [];
    const warnings = [];

    for (const component of components) {
      // Validation structure component
      if (!component.id || typeof component.id !== 'string') {
        issues.push(`invalid_component_id: ${component.name || 'unknown'}`);
        continue;
      }

      if (!component.name || typeof component.name !== 'string') {
        issues.push(`missing_component_name: ${component.id}`);
      }

      if (!component.category) {
        warnings.push(`missing_category: ${component.id}`);
      }

      // Validation props si présents
      if (component.props && !Array.isArray(component.props)) {
        issues.push(`invalid_props_format: ${component.id}`);
      }

      // Validation selon règles
      if (rules.requireDescription && !component.description) {
        warnings.push(`missing_description: ${component.id}`);
      }

      if (rules.requireExamples && (!component.examples || component.examples.length === 0)) {
        warnings.push(`missing_examples: ${component.id}`);
      }
    }

    // Validation unicité IDs
    const ids = components.map(c => c.id).filter(Boolean);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    
    if (duplicateIds.length > 0) {
      issues.push(`duplicate_component_ids: ${duplicateIds.join(', ')}`);
    }

    return {
      valid: issues.length === 0,
      components: components.length,
      validComponents: components.length - issues.filter(i => i.includes('invalid_component_id')).length,
      issues,
      warnings,
      duplicates: duplicateIds.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`ComponentError: Validation définitions échouée: ${error.message}`);
  }
}

export async function updateComponentsLibrary(library, updates, options = {}) {
  if (!library || typeof library !== 'object') {
    throw new Error('ComponentError: Library requis object');
  }

  if (!Array.isArray(updates)) {
    throw new Error('ComponentError: Updates doit être array');
  }

  const validateUpdates = options.validateUpdates !== false;
  const backup = options.backup !== false;

  try {
    const originalComponents = backup ? [...library.components] : null;
    let updatedComponents = [...library.components];

    const applied = [];
    const failed = [];

    for (const update of updates) {
      try {
        if (!update.type || !update.componentId) {
          throw new Error('Update invalide: type et componentId requis');
        }

        switch (update.type) {
          case 'add':
            if (!update.component) {
              throw new Error('Component data requis pour add');
            }
            updatedComponents.push(update.component);
            applied.push(update);
            break;

          case 'remove':
            const removeIndex = updatedComponents.findIndex(c => c.id === update.componentId);
            if (removeIndex === -1) {
              throw new Error(`Component ${update.componentId} introuvable`);
            }
            updatedComponents.splice(removeIndex, 1);
            applied.push(update);
            break;

          case 'update':
            const updateIndex = updatedComponents.findIndex(c => c.id === update.componentId);
            if (updateIndex === -1) {
              throw new Error(`Component ${update.componentId} introuvable`);
            }
            updatedComponents[updateIndex] = { ...updatedComponents[updateIndex], ...update.changes };
            applied.push(update);
            break;

          default:
            throw new Error(`Type update inconnu: ${update.type}`);
        }
      } catch (error) {
        failed.push({ update, error: error.message });
      }
    }

    // Validation finale si demandée
    if (validateUpdates && applied.length > 0) {
      const validation = await validateComponentDefinitions(updatedComponents);
      if (!validation.valid) {
        throw new Error(`ComponentError: Library mise à jour invalide: ${validation.issues.join(', ')}`);
      }
    }

    const newLibrary = {
      ...library,
      components: updatedComponents,
      total: updatedComponents.length,
      categories: groupComponentsByCategory(updatedComponents)
    };

    return {
      updated: true,
      library: newLibrary,
      appliedUpdates: applied,
      failedUpdates: failed,
      backup: originalComponents,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`ComponentError: Mise à jour library échouée: ${error.message}`);
  }
}

export async function getComponentsConfigStatus(config, options = {}) {
  if (!config || typeof config !== 'object') {
    throw new Error('ComponentError: Config requis object');
  }

  try {
    const hasComponents = config.components && Array.isArray(config.components);
    const hasLibrary = config.library && typeof config.library === 'object';
    
    const status = hasComponents && hasLibrary ? 
      (config.components.length > 0 ? 'loaded' : 'empty') : 
      'invalid';

    const validation = hasComponents ? await validateComponentDefinitions(config.components) : { valid: false };

    return {
      status,
      loaded: hasComponents && config.components.length > 0,
      totalComponents: config.components?.length || 0,
      validComponents: validation.validComponents || 0,
      categories: Object.keys(config.library?.categories || {}).length,
      editable: config.library?.editable || false,
      previewEnabled: config.library?.previewEnabled || false,
      lastUpdate: config.timestamp || new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      loaded: false,
      issues: [`status_check_failed: ${error.message}`],
      lastUpdate: new Date().toISOString()
    };
  }
}

// Helper functions pour simulation
function getDefaultComponents() {
  return [
    { 
      id: 'button', 
      name: 'Button', 
      category: 'forms', 
      description: 'Bouton interactif',
      props: [
        { name: 'variant', type: 'string', default: 'primary' },
        { name: 'size', type: 'string', default: 'medium' }
      ]
    },
    { 
      id: 'input', 
      name: 'Input', 
      category: 'forms', 
      description: 'Champ de saisie',
      props: [
        { name: 'type', type: 'string', default: 'text' },
        { name: 'placeholder', type: 'string', default: '' }
      ]
    },
    { 
      id: 'card', 
      name: 'Card', 
      category: 'layout', 
      description: 'Conteneur avec bordure',
      props: [
        { name: 'shadow', type: 'boolean', default: true }
      ]
    }
  ];
}

function groupComponentsByCategory(components) {
  const categories = {};
  
  for (const component of components) {
    const category = component.category || 'uncategorized';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(component);
  }
  
  return categories;
}

async function validateComponentLibrary(components) {
  // Simulation validation library
  return {
    valid: components.length > 0,
    issues: components.length === 0 ? ['empty_library'] : [],
    componentsCount: components.length,
    timestamp: new Date().toISOString()
  };
}

async function initializePreview(components) {
  // Simulation initialisation preview
  return {
    enabled: true,
    mode: 'interactive',
    renderComponents: components.length,
    timestamp: new Date().toISOString()
  };
}

// panels/config/components : Panel Config (commit 65)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
