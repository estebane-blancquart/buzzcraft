/**
 * COMMIT 65 - Panel Config
 * 
 * FAIT QUOI : Configuration projet avec métadonnées éditables et templates personnalisables
 * REÇOIT : projectData: object, templates?: object[], metadata?: object
 * RETOURNE : { config: object, templates: object[], validation: object, changes: object[] }
 * ERREURS : ProjectError si données invalides, TemplateError si template inexistant, MetadataError si metadata corrompue
 */

export async function createProjectConfig(projectData, templates = [], metadata = {}) {
  if (!projectData || typeof projectData !== 'object') {
    throw new Error('ProjectError: ProjectData requis object');
  }

  if (!Array.isArray(templates)) {
    throw new Error('ProjectError: Templates doit être array');
  }

  if (typeof metadata !== 'object') {
    throw new Error('ProjectError: Metadata doit être object');
  }

  try {
    const config = {
      project: {
        id: projectData.id || generateProjectId(),
        name: projectData.name || 'Nouveau Projet',
        description: projectData.description || '',
        type: projectData.type || 'website',
        version: projectData.version || '1.0.0'
      },
      settings: {
        autoSave: true,
        validation: 'strict',
        backup: true,
        collaboration: false
      },
      features: {
        responsive: true,
        seo: true,
        analytics: false,
        i18n: false
      }
    };

    const availableTemplates = templates.length > 0 ? templates : getDefaultTemplates();
    const validatedMetadata = await validateProjectMetadata(metadata);

    return {
      config,
      templates: availableTemplates,
      validation: validatedMetadata,
      changes: [],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`ProjectError: Création config projet échouée: ${error.message}`);
  }
}

export async function validateProjectSettings(config, settings, options = {}) {
  if (!config || typeof config !== 'object') {
    throw new Error('ProjectError: Config requis object');
  }

  if (!settings || typeof settings !== 'object') {
    throw new Error('ProjectError: Settings requis object');
  }

  const strict = options.strict !== false;
  const checkConstraints = options.checkConstraints !== false;

  try {
    const issues = [];
    const warnings = [];

    // Validation config projet
    if (!config.project || !config.project.name) {
      issues.push('missing_project_name');
    }

    if (!config.project || !config.project.id) {
      issues.push('missing_project_id');
    }

    // Validation settings - FIX: Vérifier que config.settings existe
    if (!config.settings || typeof config.settings !== 'object') {
      issues.push('missing_settings_object');
    } else {
      const requiredSettings = ['autoSave', 'validation', 'backup'];
      for (const setting of requiredSettings) {
        if (!(setting in config.settings)) {
          issues.push(`missing_setting_${setting}`);
        }
      }
    }

    // Validation contraintes business
    if (checkConstraints && config.features) {
      if (config.features.i18n && !config.features.seo) {
        warnings.push('i18n_without_seo_not_recommended');
      }

      if (config.project?.type === 'ecommerce' && !config.features.analytics) {
        warnings.push('ecommerce_should_enable_analytics');
      }
    }

    // Validation settings utilisateur
    const validationModes = ['strict', 'normal', 'disabled'];
    if (settings.validationMode && !validationModes.includes(settings.validationMode)) {
      issues.push('invalid_validation_mode');
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      settingsCount: Object.keys(settings).length,
      featuresEnabled: Object.values(config.features || {}).filter(Boolean).length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`ProjectError: Validation settings échouée: ${error.message}`);
  }
}

export async function updateProjectConfiguration(config, updates, options = {}) {
  if (!config || typeof config !== 'object') {
    throw new Error('ProjectError: Config requis object');
  }

  if (!updates || typeof updates !== 'object') {
    throw new Error('ProjectError: Updates requis object');
  }

  const validateChanges = options.validateChanges !== false;
  const backup = options.backup !== false;

  try {
    const originalConfig = backup ? JSON.parse(JSON.stringify(config)) : null;

    // Validation avant application
    if (validateChanges) {
      const validation = await validateProjectSettings(config, updates, options);
      if (!validation.valid) {
        throw new Error(`ProjectError: Updates invalides: ${validation.issues.join(', ')}`);
      }
    }

    // Application des updates
    const updatedConfig = { ...config };
    const appliedChanges = [];

    for (const [section, sectionUpdates] of Object.entries(updates)) {
      if (typeof sectionUpdates === 'object' && sectionUpdates !== null) {
        updatedConfig[section] = {
          ...updatedConfig[section],
          ...sectionUpdates
        };
        appliedChanges.push({ section, updates: Object.keys(sectionUpdates) });
      }
    }

    return {
      updated: true,
      config: updatedConfig,
      appliedChanges,
      backup: originalConfig,
      validation: validateChanges,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`ProjectError: Mise à jour config échouée: ${error.message}`);
  }
}

export async function getProjectConfigStatus(config, options = {}) {
  if (!config || typeof config !== 'object') {
    throw new Error('ProjectError: Config requis object');
  }

  try {
    const hasProject = config.config?.project && config.config.project.name && config.config.project.id;
    const hasSettings = config.config?.settings && typeof config.config.settings === 'object';
    const hasFeatures = config.config?.features && typeof config.config.features === 'object';

    const status = hasProject && hasSettings ? 'configured' : 
                  hasProject ? 'partial' : 'empty';

    const completeness = calculateConfigCompleteness(config.config || {});

    return {
      status,
      configured: hasProject && hasSettings, // FIX: Retourner boolean
      projectName: config.config?.project?.name || 'Sans nom',
      projectType: config.config?.project?.type || 'unknown',
      completeness,
      featuresEnabled: Object.values(config.config?.features || {}).filter(Boolean).length,
      settingsCount: Object.keys(config.config?.settings || {}).length,
      lastUpdate: config.timestamp || new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      configured: false,
      issues: [`status_check_failed: ${error.message}`],
      lastUpdate: new Date().toISOString()
    };
  }
}

// Helper functions pour simulation
function generateProjectId() {
  return 'proj_' + Math.random().toString(36).substr(2, 9);
}

function getDefaultTemplates() {
  return [
    { id: 'blank', name: 'Projet Vierge', description: 'Commencer from scratch' },
    { id: 'blog', name: 'Blog', description: 'Site blog avec articles' },
    { id: 'portfolio', name: 'Portfolio', description: 'Site portfolio créatif' },
    { id: 'ecommerce', name: 'E-commerce', description: 'Boutique en ligne' }
  ];
}

async function validateProjectMetadata(metadata) {
  // Simulation validation metadata
  const issues = [];
  
  if (metadata.author && typeof metadata.author !== 'string') {
    issues.push('invalid_author_format');
  }

  return {
    valid: issues.length === 0,
    issues,
    fieldsCount: Object.keys(metadata).length,
    timestamp: new Date().toISOString()
  };
}

function calculateConfigCompleteness(config) {
  // Simulation calcul complétude
  let score = 0;
  const maxScore = 10;

  if (config.project?.name) score += 2;
  if (config.project?.description) score += 1;
  if (config.project?.type) score += 2;
  if (config.settings && Object.keys(config.settings).length > 0) score += 3;
  if (config.features && Object.keys(config.features).length > 0) score += 2;

  return Math.round((score / maxScore) * 100);
}

// panels/config/project : Panel Config (commit 65)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
