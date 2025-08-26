/**
 * Validation stricte du schema JSON des projets - VERSION PIXEL PARFAIT
 * @module schema-validator
 */

/**
 * Valide la structure complète d'un projet BuzzCraft
 * @param {object} projectData - Données projet à valider
 * @param {object} [options={}] - Options de validation
 * @param {number} [options.maxDepth=10] - Profondeur maximum récursion
 * @param {boolean} [options.strict=false] - Mode strict (erreurs pour warnings)
 * @returns {{success: boolean, data: {valid: boolean, errors: string[], warnings: string[]}}} Résultat validation
 * 
 * @example
 * const result = await validateProjectSchema(projectData);
 * if (result.success && result.data.valid) {
 *   console.log('Project schema is valid');
 * }
 */
export async function validateProjectSchema(projectData, options = {}) {
  console.log(`[SCHEMA-VALIDATOR] Validating project schema`);
  
  try {
    validateSchemaInput(projectData, options);
    
    const errors = [];
    const warnings = [];
    const maxDepth = options.maxDepth || 10;
    
    const project = projectData.project || projectData;
    
    // Validation structure principale
    validateProjectCore(project, errors, warnings);
    
    // Validation pages si présentes
    if (project.pages) {
      validateProjectPages(project.pages, errors, warnings, maxDepth);
    }
    
    // Validation état projet
    validateProjectState(project, errors, warnings);
    
    const isValid = errors.length === 0 && (!options.strict || warnings.length === 0);
    
    console.log(`[SCHEMA-VALIDATOR] Validation complete: ${isValid ? 'VALID' : 'INVALID'} (${errors.length} errors, ${warnings.length} warnings)`);
    
    return {
      success: true,
      data: {
        valid: isValid,
        errors,
        warnings,
        stats: {
          errorsCount: errors.length,
          warningsCount: warnings.length,
          validatedAt: new Date().toISOString()
        }
      }
    };
    
  } catch (error) {
    console.log(`[SCHEMA-VALIDATOR] Validation failed: ${error.message}`);
    return {
      success: false,
      error: `Schema validation failed: ${error.message}`
    };
  }
}

/**
 * Valide les paramètres d'entrée
 * @private
 */
function validateSchemaInput(projectData, options) {
  if (!projectData || typeof projectData !== 'object') {
    throw new Error('ValidationError: projectData must be an object');
  }
  
  if (options && typeof options !== 'object') {
    throw new Error('ValidationError: options must be an object');
  }
  
  if (options.maxDepth && (typeof options.maxDepth !== 'number' || options.maxDepth < 1)) {
    throw new Error('ValidationError: options.maxDepth must be a positive number');
  }
}

/**
 * Valide la structure principale du projet
 * @private
 */
function validateProjectCore(project, errors, warnings) {
  // Champs requis
  const requiredFields = ['id', 'name'];
  requiredFields.forEach(field => {
    if (!project[field] || typeof project[field] !== 'string') {
      errors.push(`Project.${field} is required and must be a string`);
    }
  });
  
  // Validation format ID
  if (project.id && !/^[a-z0-9-]+$/.test(project.id)) {
    errors.push(`Project.id "${project.id}" must contain only lowercase letters, numbers and hyphens`);
  }
  
  // Validation longueur nom
  if (project.name && project.name.length < 2) {
    errors.push(`Project.name must be at least 2 characters long`);
  }
  
  // Validation version si présente
  if (project.version && !/^\d+\.\d+\.\d+/.test(project.version)) {
    warnings.push(`Project.version "${project.version}" should follow semver format (x.y.z)`);
  }
}

/**
 * Valide toutes les pages du projet
 * @private
 */
function validateProjectPages(pages, errors, warnings, maxDepth) {
  if (!Array.isArray(pages)) {
    errors.push('Project.pages must be an array');
    return;
  }
  
  pages.forEach((page, pageIndex) => {
    validatePage(page, `pages[${pageIndex}]`, errors, warnings, maxDepth);
  });
}

/**
 * Valide une page individuelle
 * @private
 */
function validatePage(page, path, errors, warnings, maxDepth, currentDepth = 0) {
  if (currentDepth >= maxDepth) {
    warnings.push(`${path}: Maximum validation depth reached`);
    return;
  }
  
  if (!page || typeof page !== 'object') {
    errors.push(`${path} must be an object`);
    return;
  }
  
  // Champs requis page
  const requiredPageFields = ['id', 'name'];
  requiredPageFields.forEach(field => {
    if (!page[field] || typeof page[field] !== 'string') {
      errors.push(`${path}.${field} is required and must be a string`);
    }
  });
  
  // Validation layout
  if (page.layout) {
    validateLayout(page.layout, `${path}.layout`, errors, warnings, maxDepth, currentDepth + 1);
  } else {
    warnings.push(`${path} has no layout defined`);
  }
}

/**
 * Valide un layout de page
 * @private
 */
function validateLayout(layout, path, errors, warnings, maxDepth, currentDepth) {
  if (!layout || typeof layout !== 'object') {
    errors.push(`${path} must be an object`);
    return;
  }
  
  // Validation sections
  if (layout.sections) {
    if (!Array.isArray(layout.sections)) {
      errors.push(`${path}.sections must be an array`);
    } else {
      layout.sections.forEach((section, sectionIndex) => {
        validateSection(section, `${path}.sections[${sectionIndex}]`, errors, warnings, maxDepth, currentDepth);
      });
    }
  }
}

/**
 * Valide une section
 * @private
 */
function validateSection(section, path, errors, warnings, maxDepth, currentDepth) {
  if (!section || typeof section !== 'object') {
    errors.push(`${path} must be an object`);
    return;
  }
  
  if (!section.id || typeof section.id !== 'string') {
    errors.push(`${path}.id is required and must be a string`);
  }
  
  // Validation containers
  const containerTypes = ['divs', 'lists', 'forms'];
  containerTypes.forEach(containerType => {
    if (section[containerType]) {
      if (!Array.isArray(section[containerType])) {
        errors.push(`${path}.${containerType} must be an array`);
      } else {
        section[containerType].forEach((container, containerIndex) => {
          validateContainer(container, `${path}.${containerType}[${containerIndex}]`, errors, warnings, maxDepth, currentDepth);
        });
      }
    }
  });
}

/**
 * Valide un container
 * @private
 */
function validateContainer(container, path, errors, warnings, maxDepth, currentDepth) {
  if (!container || typeof container !== 'object') {
    errors.push(`${path} must be an object`);
    return;
  }
  
  if (!container.id || typeof container.id !== 'string') {
    errors.push(`${path}.id is required and must be a string`);
  }
  
  // Validation components
  if (container.components) {
    if (!Array.isArray(container.components)) {
      errors.push(`${path}.components must be an array`);
    } else {
      container.components.forEach((component, componentIndex) => {
        validateComponent(component, `${path}.components[${componentIndex}]`, errors, warnings);
      });
    }
  }
  
  // Validation spécifique par type
  validateContainerType(container, path, errors, warnings);
}

/**
 * Valide un component
 * @private
 */
function validateComponent(component, path, errors, warnings) {
  if (!component || typeof component !== 'object') {
    errors.push(`${path} must be an object`);
    return;
  }
  
  // Champs requis
  const requiredComponentFields = ['id', 'type'];
  requiredComponentFields.forEach(field => {
    if (!component[field] || typeof component[field] !== 'string') {
      errors.push(`${path}.${field} is required and must be a string`);
    }
  });
  
  // Validation types connus
  const knownComponentTypes = ['button', 'a', 'p', 'h', 'image', 'video'];
  if (component.type && !knownComponentTypes.includes(component.type)) {
    warnings.push(`${path}.type "${component.type}" is not a known component type. Known: ${knownComponentTypes.join(', ')}`);
  }
  
  // Validation spécifique par type
  validateComponentType(component, path, errors, warnings);
}

/**
 * Valide l'état du projet
 * @private
 */
function validateProjectState(project, errors, warnings) {
  const validStates = ['VOID', 'DRAFT', 'BUILT', 'OFFLINE', 'ONLINE'];
  if (project.state && !validStates.includes(project.state)) {
    warnings.push(`Project.state "${project.state}" is not a standard state. Valid: ${validStates.join(', ')}`);
  }
}

/**
 * Valide types spécifiques de containers
 * @private
 */
function validateContainerType(container, path, errors, warnings) {
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

/**
 * Valide types spécifiques de components
 * @private
 */
function validateComponentType(component, path, errors, warnings) {
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

console.log(`[SCHEMA-VALIDATOR] Schema validator loaded successfully - PIXEL PERFECT VERSION`);