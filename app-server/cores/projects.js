/**
 * Gestion des projets BuzzCraft avec patterns uniformisés
 * @module projects
 * @description Construction, validation et enrichissement de projets
 */

import { PROJECT_STATES } from './constants.js';

// === CONSTANTES MODULE ===
const STRUCTURE_ELEMENTS = {
  PAGES: 'pages',
  SECTIONS: 'sections', 
  DIVS: 'divs',
  COMPONENTS: 'components'
};

const VALIDATION_MESSAGES = {
  MISSING_ID: 'Missing required field: id',
  MISSING_NAME: 'Missing required field: name', 
  MISSING_STATE: 'Missing required field: state',
  INVALID_PAGES_TYPE: 'Field pages must be an array',
  EMPTY_PAGES: 'Project has no pages defined'
};

const LOG_PREFIX = '[PROJECTS]';

// === EXPORTS PUBLICS ===

/**
 * Construit un projet à partir de config et template
 * @param {string} projectId - Identifiant unique du projet
 * @param {object} config - Configuration du projet
 * @param {object|null} [templateContent=null] - Template source optionnel
 * @returns {{success: boolean, data?: object, error?: string}} Projet construit ou erreur
 * 
 * @example
 * const result = buildProject('mon-site', { name: 'Mon Site' }, templateData);
 * if (result.success) {
 *   console.log('Projet créé:', result.data.id);
 * }
 */
export function buildProject(projectId, config, templateContent = null) {
  console.log(`${LOG_PREFIX} Building project: ${projectId}`);

  // Validation des inputs
  const validation = _validateBuildInputs(projectId, config);
  if (!validation.success) return validation;

  try {
    // Construction du projet
    const projectData = _constructProjectCore(projectId, config, templateContent);
    
    // Ajout des métadonnées
    const finalProject = _addProjectMetadata(projectData);

    console.log(`${LOG_PREFIX} Project built successfully: ${projectId}`);
    return { success: true, data: finalProject };

  } catch (error) {
    console.log(`${LOG_PREFIX} Error building project: ${error.message}`);
    return { success: false, error: `Project build failed: ${error.message}` };
  }
}

/**
 * Valide la structure et les données d'un projet
 * @param {object} projectData - Données du projet à valider
 * @param {object} [options={}] - Options de validation
 * @param {boolean} [options.strict=false] - Mode strict (erreur sur warnings)
 * @returns {{success: boolean, data?: {valid: boolean, warnings?: string[]}, error?: string}} Résultat validation
 * 
 * @example
 * const validation = validateProject(projectData);
 * if (validation.success && validation.data.valid) {
 *   console.log('Projet valide');
 * }
 */
export function validateProject(projectData, options = {}) {
  console.log(`${LOG_PREFIX} Validating project structure`);

  // Validation des inputs
  const inputValidation = _validateProjectInputs(projectData, options);
  if (!inputValidation.success) return inputValidation;

  try {
    // Validation des champs requis
    const warnings = _validateRequiredFields(projectData);
    
    // Validation de la structure
    const structureWarnings = _validateProjectStructure(projectData);
    const allWarnings = [...warnings, ...structureWarnings];

    const strictMode = options.strict === true;
    const isValid = allWarnings.length === 0 || !strictMode;

    if (strictMode && !isValid) {
      return {
        success: false,
        error: `Validation failed: ${allWarnings.join(', ')}`
      };
    }

    if (allWarnings.length > 0) {
      console.log(`${LOG_PREFIX} Validation warnings detected: ${allWarnings.length}`);
      allWarnings.forEach(warning => console.log(`${LOG_PREFIX} - ${warning}`));
    }

    console.log(`${LOG_PREFIX} Project validation ${isValid ? 'successful' : 'completed with warnings'}`);
    
    return {
      success: true,
      data: {
        valid: isValid,
        ...(allWarnings.length > 0 && { warnings: allWarnings })
      }
    };

  } catch (error) {
    console.log(`${LOG_PREFIX} Validation error: ${error.message}`);
    return {
      success: false,
      error: `Validation failed: ${error.message}`
    };
  }
}

/**
 * Enrichit un projet avec des métadonnées calculées
 * @param {object} projectData - Données du projet à enrichir
 * @param {object} [options={}] - Options d'enrichissement
 * @param {object} [options.templateInfo] - Informations de template à ajouter
 * @returns {{success: boolean, data?: object, error?: string}} Projet enrichi ou erreur
 * 
 * @example
 * const result = enrichProject(projectData, { templateInfo: template });
 * if (result.success) {
 *   console.log('Stats:', result.data._metadata.structure);
 * }
 */
export function enrichProject(projectData, options = {}) {
  console.log(`${LOG_PREFIX} Enriching project with metadata`);

  try {
    if (!projectData || typeof projectData !== 'object') {
      return {
        success: false,
        error: 'ValidationError: projectData must be an object'
      };
    }

    const enriched = { ...projectData };

    // Calcul des statistiques de structure
    const structureStats = _calculateStructureStats(projectData);
    
    enriched._metadata = {
      structure: structureStats,
      enriched: {
        at: new Date().toISOString(),
        by: 'projects-core'
      }
    };

    // Ajout d'informations de template si disponibles
    if (options.templateInfo) {
      enriched._metadata.template = options.templateInfo;
    }

    console.log(`${LOG_PREFIX} Project enriched successfully`);
    
    return {
      success: true,
      data: enriched
    };

  } catch (error) {
    console.log(`${LOG_PREFIX} Enrichment failed: ${error.message}`);
    return {
      success: false,
      error: `Project enrichment failed: ${error.message}`
    };
  }
}

// === FONCTIONS INTERNES ===

/**
 * Validation pure des inputs buildProject - fonction privée
 * @private
 */
function _validateBuildInputs(projectId, config) {
  if (!projectId || typeof projectId !== 'string') {
    return { success: false, error: 'ValidationError: projectId must be non-empty string' };
  }
  if (!config || typeof config !== 'object') {
    return { success: false, error: 'ValidationError: config must be an object' };
  }
  return { success: true };
}

/**
 * Construction du projet sans métadonnées - fonction privée
 * @private
 */
function _constructProjectCore(projectId, config, templateContent) {
  if (templateContent && templateContent.project) {
    const projectData = _buildFromTemplate(projectId, config, templateContent);
    console.log(`${LOG_PREFIX} Project built from template: ${templateContent.project.name}`);
    return projectData;
  } else {
    const projectData = _buildFallbackProject(projectId, config);
    console.log(`${LOG_PREFIX} Project built from fallback template`);
    return projectData;
  }
}

/**
 * Ajout des métadonnées système - fonction privée
 * @private
 */
function _addProjectMetadata(projectData) {
  const now = new Date().toISOString();
  return {
    ...projectData,
    created: now,
    state: PROJECT_STATES.DRAFT,
    lastModified: now
  };
}

/**
 * Validation des inputs validateProject - fonction privée
 * @private
 */
function _validateProjectInputs(projectData, options) {
  if (!projectData || typeof projectData !== 'object') {
    return {
      success: false,
      error: 'ValidationError: projectData must be an object'
    };
  }

  if (options && typeof options !== 'object') {
    return {
      success: false,
      error: 'ValidationError: options must be an object'
    };
  }

  if (options.strict !== undefined && typeof options.strict !== 'boolean') {
    return {
      success: false,
      error: 'ValidationError: options.strict must be a boolean'
    };
  }

  return { success: true };
}

/**
 * Validation des champs requis - fonction privée
 * @private
 */
function _validateRequiredFields(projectData) {
  const warnings = [];

  if (!projectData.id) {
    warnings.push(VALIDATION_MESSAGES.MISSING_ID);
  }

  if (!projectData.name) {
    warnings.push(VALIDATION_MESSAGES.MISSING_NAME);
  }

  if (!projectData.state) {
    warnings.push(VALIDATION_MESSAGES.MISSING_STATE);
  }

  return warnings;
}

/**
 * Validation de la structure du projet - fonction privée
 * @private
 */
function _validateProjectStructure(projectData) {
  const warnings = [];

  if (projectData.pages) {
    if (!Array.isArray(projectData.pages)) {
      warnings.push(VALIDATION_MESSAGES.INVALID_PAGES_TYPE);
    } else if (projectData.pages.length === 0) {
      warnings.push(VALIDATION_MESSAGES.EMPTY_PAGES);
    }
  }

  return warnings;
}

/**
 * Construit un projet à partir d'un template - fonction privée
 * @private
 */
function _buildFromTemplate(projectId, config, templateContent) {
  const templateProject = templateContent.project;

  return {
    ...templateProject,
    id: projectId,
    name: config.name || projectId,
    template: config.template || templateProject.id || "basic",
    templateName: templateProject.name || "Unknown Template",
    templateDescription: templateProject.description || "No description",
    originalTemplate: templateProject.id
  };
}

/**
 * Construit un projet fallback minimal - fonction privée
 * @private
 */
function _buildFallbackProject(projectId, config) {
  return {
    id: projectId,
    name: config.name || projectId,
    template: config.template || "basic",
    templateName: "Basic Template",
    templateDescription: "Fallback template with minimal structure",
    pages: [{
      id: "home",
      name: "Home",
      path: "/",
      layout: {
        sections: [{
          id: "hero",
          name: "Hero Section",
          divs: [{
            id: "hero-content",
            name: "Hero Content",
            components: [{
              id: "main-heading",
              type: "heading",
              level: 1,
              content: config.name || projectId,
              style: {}
            }]
          }]
        }]
      }
    }]
  };
}

/**
 * Calcule des statistiques sur la structure du projet - fonction privée
 * @private
 */
function _calculateStructureStats(projectData) {
  try {
    const stats = {
      pagesCount: 0,
      sectionsCount: 0,
      divsCount: 0,
      componentsCount: 0,
      totalElements: 0
    };

    if (!projectData.pages || !Array.isArray(projectData.pages)) {
      return stats;
    }

    stats.pagesCount = projectData.pages.length;
    
    projectData.pages.forEach(page => {
      if (page.layout && page.layout.sections && Array.isArray(page.layout.sections)) {
        stats.sectionsCount += page.layout.sections.length;
        
        page.layout.sections.forEach(section => {
          if (section.divs && Array.isArray(section.divs)) {
            stats.divsCount += section.divs.length;
            
            section.divs.forEach(div => {
              if (div.components && Array.isArray(div.components)) {
                stats.componentsCount += div.components.length;
              }
            });
          }
        });
      }
    });

    stats.totalElements = stats.pagesCount + stats.sectionsCount + stats.divsCount + stats.componentsCount;

    return stats;

  } catch (error) {
    console.log(`${LOG_PREFIX} Stats calculation failed: ${error.message}`);
    return {
      pagesCount: 0,
      sectionsCount: 0,
      divsCount: 0,
      componentsCount: 0,
      totalElements: 0,
      error: 'calculation_failed'
    };
  }
}

console.log(`[PROJECTS] Projects core loaded successfully - PIXEL PERFECT VERSION`);