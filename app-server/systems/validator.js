/*
 * FAIT QUOI : Validation stricte du schema JSON des projets
 * REÇOIT : projectData: object, options: object
 * RETOURNE : { valid: boolean, errors: string[], warnings: string[] }
 * ERREURS : Aucune (validation defensive)
 */

export function validateProjectSchema(projectData, options = {}) {
  console.log(`[SCHEMA] Validating project schema`);
  
  const errors = [];
  const warnings = [];
  
  if (!projectData || typeof projectData !== 'object') {
    errors.push('Project data must be an object');
    return { valid: false, errors, warnings };
  }
  
  const project = projectData.project || projectData;
  
  // Validation des champs requis du projet
  const requiredProjectFields = ['id', 'name'];
  for (const field of requiredProjectFields) {
    if (!project[field] || typeof project[field] !== 'string') {
      errors.push(`Project.${field} is required and must be a string`);
    }
  }
  
  // Validation des pages
  if (project.pages) {
    if (!Array.isArray(project.pages)) {
      errors.push('Project.pages must be an array');
    } else {
      project.pages.forEach((page, pageIndex) => {
        validatePage(page, `pages[${pageIndex}]`, errors, warnings);
      });
    }
  }
  
  // Validation de l'état
  const validStates = ['VOID', 'DRAFT', 'BUILT', 'OFFLINE', 'ONLINE'];
  if (project.state && !validStates.includes(project.state)) {
    warnings.push(`Project.state "${project.state}" is not a standard state. Valid: ${validStates.join(', ')}`);
  }
  
  const isValid = errors.length === 0;
  
  console.log(`[SCHEMA] Validation complete: ${isValid ? 'VALID' : 'INVALID'} (${errors.length} errors, ${warnings.length} warnings)`);
  
  return {
    valid: isValid,
    errors,
    warnings
  };
}

/*
 * FAIT QUOI : Validation d'une page
 * REÇOIT : page: object, path: string, errors: array, warnings: array
 * RETOURNE : void (modifie errors/warnings par référence)
 */

function validatePage(page, path, errors, warnings) {
  if (!page || typeof page !== 'object') {
    errors.push(`${path} must be an object`);
    return;
  }
  
  // Champs requis pour une page
  const requiredPageFields = ['id', 'name'];
  for (const field of requiredPageFields) {
    if (!page[field] || typeof page[field] !== 'string') {
      errors.push(`${path}.${field} is required and must be a string`);
    }
  }
  
  // Validation du layout
  if (page.layout) {
    validateLayout(page.layout, `${path}.layout`, errors, warnings);
  } else {
    warnings.push(`${path} has no layout defined`);
  }
}

/*
 * FAIT QUOI : Validation d'un layout
 * REÇOIT : layout: object, path: string, errors: array, warnings: array
 * RETOURNE : void (modifie errors/warnings par référence)
 */

function validateLayout(layout, path, errors, warnings) {
  if (!layout || typeof layout !== 'object') {
    errors.push(`${path} must be an object`);
    return;
  }
  
  // Validation des sections
  if (layout.sections) {
    if (!Array.isArray(layout.sections)) {
      errors.push(`${path}.sections must be an array`);
    } else {
      layout.sections.forEach((section, sectionIndex) => {
        validateSection(section, `${path}.sections[${sectionIndex}]`, errors, warnings);
      });
    }
  }
}

/*
 * FAIT QUOI : Validation d'une section
 * REÇOIT : section: object, path: string, errors: array, warnings: array
 * RETOURNE : void (modifie errors/warnings par référence)
 */

function validateSection(section, path, errors, warnings) {
  if (!section || typeof section !== 'object') {
    errors.push(`${path} must be an object`);
    return;
  }
  
  if (!section.id || typeof section.id !== 'string') {
    errors.push(`${path}.id is required and must be a string`);
  }
  
  // Validation des containers (divs, lists, forms)
  const containerTypes = ['divs', 'lists', 'forms'];
  containerTypes.forEach(containerType => {
    if (section[containerType]) {
      if (!Array.isArray(section[containerType])) {
        errors.push(`${path}.${containerType} must be an array`);
      } else {
        section[containerType].forEach((container, containerIndex) => {
          validateContainer(container, `${path}.${containerType}[${containerIndex}]`, errors, warnings);
        });
      }
    }
  });
}

/*
 * FAIT QUOI : Validation d'un container (div, list, form)
 * REÇOIT : container: object, path: string, errors: array, warnings: array
 * RETOURNE : void (modifie errors/warnings par référence)
 */

function validateContainer(container, path, errors, warnings) {
  if (!container || typeof container !== 'object') {
    errors.push(`${path} must be an object`);
    return;
  }
  
  if (!container.id || typeof container.id !== 'string') {
    errors.push(`${path}.id is required and must be a string`);
  }
  
  // Validation des components
  if (container.components) {
    if (!Array.isArray(container.components)) {
      errors.push(`${path}.components must be an array`);
    } else {
      container.components.forEach((component, componentIndex) => {
        validateComponent(component, `${path}.components[${componentIndex}]`, errors, warnings);
      });
    }
  }
  
  // Validation spécifique selon le type de container
  if (container.type === 'list' && container.items) {
    if (!Array.isArray(container.items)) {
      errors.push(`${path}.items must be an array for list containers`);
    }
  }
  
  if (container.type === 'form') {
    if (container.inputs && !Array.isArray(container.inputs)) {
      errors.push(`${path}.inputs must be an array for form containers`);
    }
    if (container.buttons && !Array.isArray(container.buttons)) {
      errors.push(`${path}.buttons must be an array for form containers`);
    }
  }
}

/*
 * FAIT QUOI : Validation d'un component
 * REÇOIT : component: object, path: string, errors: array, warnings: array
 * RETOURNE : void (modifie errors/warnings par référence)
 */

function validateComponent(component, path, errors, warnings) {
  if (!component || typeof component !== 'object') {
    errors.push(`${path} must be an object`);
    return;
  }
  
  // Champs requis pour tous les components
  const requiredComponentFields = ['id', 'type'];
  for (const field of requiredComponentFields) {
    if (!component[field] || typeof component[field] !== 'string') {
      errors.push(`${path}.${field} is required and must be a string`);
    }
  }
  
  // Validation des types de components connus
  const knownComponentTypes = ['button', 'a', 'p', 'h', 'image', 'video'];
  if (component.type && !knownComponentTypes.includes(component.type)) {
    warnings.push(`${path}.type "${component.type}" is not a known component type. Known: ${knownComponentTypes.join(', ')}`);
  }
  
  // Validation spécifique selon le type
  if (component.type === 'h' && component.tag) {
    const validTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    if (!validTags.includes(component.tag)) {
      errors.push(`${path}.tag must be one of: ${validTags.join(', ')}`);
    }
  }
  
  if (component.type === 'a' && component.target) {
    const validTargets = ['_self', '_blank', '_parent', '_top'];
    if (!validTargets.includes(component.target)) {
      warnings.push(`${path}.target "${component.target}" is not standard. Valid: ${validTargets.join(', ')}`);
    }
  }
}