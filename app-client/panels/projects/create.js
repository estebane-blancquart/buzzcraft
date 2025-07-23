/**
 * COMMIT 62 - Panel Projects
 * 
 * FAIT QUOI : Création projets avec templates, validation et configuration initiale
 * REÇOIT : projectData: object, template?: object, validation?: object, options?: object
 * RETOURNE : { project: object, created: boolean, validation: object, next: object }
 * ERREURS : CreateError si création impossible, ValidationError si données invalides, TemplateError si template incorrect, ConfigError si configuration échoue
 */

export async function createNewProject(projectData, template = null) {
  if (!projectData || typeof projectData !== 'object') {
    throw new Error('CreateError: Données projet requises');
  }

  // Validation des champs requis
  const requiredFields = ['name', 'description', 'type'];
  for (const field of requiredFields) {
    if (!projectData[field]) {
      throw new Error(`ValidationError: Champ requis manquant: ${field}`);
    }
  }

  // Templates disponibles
  const availableTemplates = {
    'web-basic': {
      id: 'web-basic',
      name: 'Site Web Basique',
      technology: 'HTML + CSS + JS',
      structure: ['index.html', 'styles.css', 'script.js'],
      features: ['responsive', 'seo-ready']
    },
    'react-app': {
      id: 'react-app',
      name: 'Application React',
      technology: 'React + Vite',
      structure: ['src/', 'public/', 'package.json'],
      features: ['hot-reload', 'component-library', 'routing']
    },
    'ecommerce': {
      id: 'ecommerce',
      name: 'E-commerce Complet',
      technology: 'React + Node.js + DB',
      structure: ['frontend/', 'backend/', 'database/'],
      features: ['cart', 'payment', 'admin', 'inventory']
    },
    'portfolio': {
      id: 'portfolio',
      name: 'Portfolio Personnel',
      technology: 'Vue.js + Tailwind',
      structure: ['components/', 'assets/', 'pages/'],
      features: ['gallery', 'contact-form', 'animations']
    }
  };

  // Application du template
  let appliedTemplate = null;
  if (template && availableTemplates[template.id]) {
    appliedTemplate = availableTemplates[template.id];
  } else if (projectData.type === 'web' && !template) {
    appliedTemplate = availableTemplates['web-basic'];
  }

  // Génération de l'ID projet
  const projectId = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const newProject = {
    id: projectId,
    name: projectData.name.trim(),
    description: projectData.description.trim(),
    type: projectData.type,
    technology: appliedTemplate?.technology || 'Custom',
    template: appliedTemplate,
    status: 'planning',
    progress: 0,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    author: projectData.author || 'Current User',
    settings: {
      public: projectData.public || false,
      collaborative: projectData.collaborative || false,
      autoSave: projectData.autoSave !== false,
      backupEnabled: projectData.backupEnabled !== false
    },
    structure: appliedTemplate?.structure || [],
    features: appliedTemplate?.features || [],
    deployments: 0
  };

  return {
    project: newProject,
    created: true,
    validation: { valid: true, issues: [] },
    next: {
      redirect: `/projects/${projectId}/editor`,
      action: 'open_editor',
      message: 'Projet créé avec succès. Redirection vers l\'éditeur...'
    },
    timestamp: new Date().toISOString()
  };
}

export async function validateProjectData(projectData) {
  const validation = {
    valid: true,
    fields: {},
    issues: [],
    timestamp: new Date().toISOString()
  };

  // Validation nom
  if (!projectData.name || projectData.name.trim().length < 3) {
    validation.fields.name = 'Nom doit contenir au moins 3 caractères';
    validation.issues.push('Nom projet trop court');
    validation.valid = false;
  } else if (projectData.name.length > 100) {
    validation.fields.name = 'Nom ne peut pas dépasser 100 caractères';
    validation.issues.push('Nom projet trop long');
    validation.valid = false;
  }

  // Validation description
  if (!projectData.description || projectData.description.trim().length < 10) {
    validation.fields.description = 'Description doit contenir au moins 10 caractères';
    validation.issues.push('Description insuffisante');
    validation.valid = false;
  }

  // Validation type
  const validTypes = ['web', 'mobile', 'desktop', 'api', 'portfolio', 'ecommerce', 'dashboard'];
  if (!projectData.type || !validTypes.includes(projectData.type)) {
    validation.fields.type = 'Type de projet invalide';
    validation.issues.push('Type projet non supporté');
    validation.valid = false;
  }

  // Validation nom unicité (simulation)
  const existingNames = ['Site Existant', 'App Déjà Créée'];
  if (existingNames.includes(projectData.name)) {
    validation.fields.name = 'Un projet avec ce nom existe déjà';
    validation.issues.push('Nom déjà utilisé');
    validation.valid = false;
  }

  return validation;
}

export async function applyProjectTemplate(projectData, templateId) {
  if (!templateId || typeof templateId !== 'string') {
    throw new Error('TemplateError: ID template requis');
  }

  const templates = {
    'web-basic': {
      files: ['index.html', 'style.css', 'script.js'],
      folders: ['assets/', 'css/', 'js/'],
      config: { framework: 'vanilla', build: false }
    },
    'react-app': {
      files: ['package.json', 'vite.config.js', 'index.html'],
      folders: ['src/', 'public/', 'src/components/'],
      config: { framework: 'react', build: 'vite' }
    },
    'vue-spa': {
      files: ['package.json', 'vue.config.js', 'index.html'],
      folders: ['src/', 'public/', 'src/views/'],
      config: { framework: 'vue', build: 'webpack' }
    }
  };

  const template = templates[templateId];
  if (!template) {
    throw new Error('TemplateError: Template inexistant');
  }

  const appliedProject = {
    ...projectData,
    template: {
      id: templateId,
      applied: true,
      files: template.files,
      folders: template.folders,
      config: template.config
    },
    structure: [...template.files, ...template.folders],
    technology: template.config.framework
  };

  return {
    applied: true,
    templateId: templateId,
    project: appliedProject,
    changes: {
      files: template.files.length,
      folders: template.folders.length,
      config: Object.keys(template.config).length
    },
    timestamp: new Date().toISOString()
  };
}

export async function getProjectCreationStatus(creationData) {
  if (!creationData) {
    return {
      status: 'not_started',
      progress: 0,
      timestamp: new Date().toISOString()
    };
  }

  const steps = [
    { name: 'validation', completed: !!creationData.validation?.valid },
    { name: 'template', completed: !!creationData.project?.template },
    { name: 'structure', completed: !!creationData.project?.structure?.length },
    { name: 'configuration', completed: !!creationData.project?.settings },
    { name: 'finalization', completed: !!creationData.created }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const progress = Math.round((completedSteps / steps.length) * 100);

  return {
    status: creationData.created ? 'completed' : 'in_progress',
    progress: progress,
    steps: steps,
    currentStep: steps.find(step => !step.completed)?.name || 'completed',
    projectId: creationData.project?.id || null,
    timestamp: new Date().toISOString()
  };
}

// panels/projects/create : Panel Projects (commit 62)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
