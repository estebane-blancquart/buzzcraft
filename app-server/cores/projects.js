/**
 * Gestion des projets BuzzCraft avec patterns uniformisés
 * @module projects
 * @description Construction, validation et enrichissement de projets
 */

// Constantes pour les éléments de structure
const STRUCTURE_ELEMENTS = {
  PAGES: 'pages',
  SECTIONS: 'sections', 
  DIVS: 'divs',
  COMPONENTS: 'components'
};

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
  console.log(`[PROJECTS] Building project: ${projectId}`);

  try {
    if (!projectId || typeof projectId !== 'string') {
      return {
        success: false,
        error: 'ValidationError: projectId must be non-empty string'
      };
    }

    if (!config || typeof config !== 'object') {
      return {
        success: false,
        error: 'ValidationError: config must be an object'
      };
    }

    let projectData;

    if (templateContent && templateContent.project) {
      // Construction à partir d'un template
      projectData = buildFromTemplate(projectId, config, templateContent);
      console.log(`[PROJECTS] Project built from template: ${templateContent.project.name}`);
    } else {
      // Construction fallback sans template
      projectData = buildFallbackProject(projectId, config);
      console.log(`[PROJECTS] Project built from fallback template`);
    }

    // Ajout des métadonnées système
    projectData.created = new Date().toISOString();
    projectData.state = "DRAFT";
    projectData.lastModified = projectData.created;

    console.log(`[PROJECTS] Project built successfully: ${projectId}`);
    
    return {
      success: true,
      data: projectData
    };

  } catch (error) {
    console.log(`[PROJECTS] Error building project: ${error.message}`);
    return {
      success: false,
      error: `Project build failed: ${error.message}`
    };
  }
}

/**
 * Valide la structure et les données d'un projet
 * @param {object} projectData - Données du projet à valider
 * @param {object} [options={}] - Options de validation
 * @param {boolean} [options.strict=true] - Mode strict (erreur sur warnings)
 * @returns {{success: boolean, data?: {valid: boolean, warnings?: string[]}, error?: string}} Résultat validation
 * 
 * @example
 * const validation = validateProject(projectData);
 * if (validation.success && validation.data.valid) {
 *   console.log('Projet valide');
 * }
 */
export function validateProject(projectData, options = {}) {
  console.log(`[PROJECTS] Validating project structure`);

  try {
    if (!projectData || typeof projectData !== 'object') {
      return {
        success: false,
        error: 'ValidationError: projectData must be an object'
      };
    }

    const warnings = [];

    // Validation des champs requis
    if (!projectData.id) {
      warnings.push('Missing required field: id');
    }

    if (!projectData.name) {
      warnings.push('Missing required field: name');
    }

    if (!projectData.state) {
      warnings.push('Missing required field: state');
    }

    // Validation de la structure des pages
    if (projectData.pages) {
      if (!Array.isArray(projectData.pages)) {
        warnings.push('Field pages must be an array');
      } else if (projectData.pages.length === 0) {
        warnings.push('Project has no pages defined');
      }
    }

    const isValid = warnings.length === 0 || !options.strict;

    if (!isValid && options.strict) {
      return {
        success: false,
        error: `Validation failed: ${warnings.join(', ')}`
      };
    }

    console.log(`[PROJECTS] Project validation ${isValid ? 'successful' : 'completed with warnings'}`);
    
    return {
      success: true,
      data: {
        valid: isValid,
        ...(warnings.length > 0 && { warnings })
      }
    };

  } catch (error) {
    console.log(`[PROJECTS] Validation error: ${error.message}`);
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
  console.log(`[PROJECTS] Enriching project with metadata`);

  try {
    if (!projectData || typeof projectData !== 'object') {
      return {
        success: false,
        error: 'ValidationError: projectData must be an object'
      };
    }

    const enriched = { ...projectData };

    // Calcul des statistiques de structure
    const structureStats = calculateStructureStats(projectData);
    
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

    console.log(`[PROJECTS] Project enriched successfully`);
    
    return {
      success: true,
      data: enriched
    };

  } catch (error) {
    console.log(`[PROJECTS] Enrichment failed: ${error.message}`);
    return {
      success: false,
      error: `Project enrichment failed: ${error.message}`
    };
  }
}

// === FONCTIONS INTERNES ===

/**
 * Construit un projet à partir d'un template
 * @private
 */
function buildFromTemplate(projectId, config, templateContent) {
  const templateProject = templateContent.project;

  return {
    ...templateProject, // Copie de la structure du template
    id: projectId, // Override avec l'ID fourni
    name: config.name || projectId,
    template: config.template || templateProject.id || "basic",
    templateName: templateProject.name || "Unknown Template",
    templateDescription: templateProject.description || "No description",
    originalTemplate: templateProject.id
  };
}

/**
 * Construit un projet fallback minimal
 * @private
 */
function buildFallbackProject(projectId, config) {
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
 * Calcule des statistiques sur la structure du projet
 * @private
 */
function calculateStructureStats(projectData) {
  try {
    let pagesCount = 0;
    let sectionsCount = 0;
    let divsCount = 0;
    let componentsCount = 0;

    if (projectData.pages && Array.isArray(projectData.pages)) {
      pagesCount = projectData.pages.length;
      
      projectData.pages.forEach(page => {
        if (page.layout && page.layout.sections && Array.isArray(page.layout.sections)) {
          sectionsCount += page.layout.sections.length;
          
          page.layout.sections.forEach(section => {
            if (section.divs && Array.isArray(section.divs)) {
              divsCount += section.divs.length;
              
              section.divs.forEach(div => {
                if (div.components && Array.isArray(div.components)) {
                  componentsCount += div.components.length;
                }
              });
            }
          });
        }
      });
    }

    return {
      pagesCount,
      sectionsCount,
      divsCount,
      componentsCount,
      totalElements: pagesCount + sectionsCount + divsCount + componentsCount
    };

  } catch (error) {
    console.log(`[PROJECTS] Stats calculation failed: ${error.message}`);
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

console.log(`[PROJECTS] Projects core loaded successfully`);