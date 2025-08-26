/*
 * FAIT QUOI : Construction pure de structures projet (outil core)
 * REÇOIT : projectId, config, template
 * RETOURNE : Objet projet ou null
 * ERREURS : null si données invalides, pas de throw
 */

/*
 * FAIT QUOI : Construit un projet à partir de config et template
 * REÇOIT : projectId: string, config: object, templateContent: object|null
 * RETOURNE : object|null (projet construit ou null si échec)
 * ERREURS : null si paramètres invalides
 */
export function buildProject(projectId, config, templateContent = null) {
  console.log(`[PROJECTS] Building project: ${projectId}`);

  if (!projectId || typeof projectId !== 'string') {
    console.log(`[PROJECTS] Invalid projectId`);
    return null;
  }

  if (!config || typeof config !== 'object') {
    console.log(`[PROJECTS] Invalid config`);
    return null;
  }

  try {
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
    return projectData;

  } catch (error) {
    console.log(`[PROJECTS] Error building project: ${error.message}`);
    return null;
  }
}

/*
 * FAIT QUOI : Construit un projet à partir d'un template
 * REÇOIT : projectId: string, config: object, templateContent: object
 * RETOURNE : object (projet basé sur template)
 * ERREURS : throw si template invalide
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

/*
 * FAIT QUOI : Construit un projet fallback minimal
 * REÇOIT : projectId: string, config: object
 * RETOURNE : object (projet minimal fonctionnel)
 * ERREURS : Jamais (génère toujours un projet valide)
 */
function buildFallbackProject(projectId, config) {
  return {
    id: projectId,
    name: config.name || projectId,
    template: config.template || "basic",
    description: "Generated project with fallback template",
    version: "1.0.0",
    pages: [
      {
        id: "home",
        name: "Home Page",
        layout: {
          sections: [
            {
              id: "hero-section",
              name: "Hero Section",
              divs: [
                {
                  id: "hero-container",
                  name: "Hero Container",
                  classname: "text-center py-16 px-8",
                  components: [
                    {
                      id: "main-title",
                      type: "heading",
                      tag: "h1",
                      content: config.name || projectId,
                      classname: "text-4xl font-bold text-gray-900 mb-4"
                    },
                    {
                      id: "subtitle",
                      type: "paragraph",
                      content: "Welcome to your new project!",
                      classname: "text-xl text-gray-600 mb-8"
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    ]
  };
}

/*
 * FAIT QUOI : Valide qu'un projet construit est cohérent
 * REÇOIT : projectData: object
 * RETOURNE : boolean (true si projet valide)
 * ERREURS : false si validation échoue
 */
export function validateProject(projectData) {
  console.log(`[PROJECTS] Validating project`);

  if (!projectData || typeof projectData !== 'object') {
    return false;
  }

  // Validation des champs obligatoires
  const requiredFields = ['id', 'name', 'state'];
  for (const field of requiredFields) {
    if (!projectData[field]) {
      console.log(`[PROJECTS] Missing required field: ${field}`);
      return false;
    }
  }

  // Validation du format ID
  if (!/^[a-z0-9-]+$/.test(projectData.id)) {
    console.log(`[PROJECTS] Invalid project ID format: ${projectData.id}`);
    return false;
  }

  // Validation de la longueur du nom
  if (projectData.name.length < 2) {
    console.log(`[PROJECTS] Project name too short: ${projectData.name}`);
    return false;
  }

  // Validation de l'état
  const validStates = ['VOID', 'DRAFT', 'BUILT', 'OFFLINE', 'ONLINE'];
  if (!validStates.includes(projectData.state)) {
    console.log(`[PROJECTS] Invalid project state: ${projectData.state}`);
    return false;
  }

  console.log(`[PROJECTS] Project validation successful`);
  return true;
}

/*
 * FAIT QUOI : Enrichit un projet avec des métadonnées calculées
 * REÇOIT : projectData: object, options: object
 * RETOURNE : object (projet enrichi)
 * ERREURS : Retourne projet original si enrichissement échoue
 */
export function enrichProject(projectData, options = {}) {
  console.log(`[PROJECTS] Enriching project with metadata`);

  if (!projectData || typeof projectData !== 'object') {
    return projectData;
  }

  try {
    const enriched = { ...projectData };

    // Calcul des statistiques de structure
    enriched._metadata = {
      structure: calculateStructureStats(projectData),
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
    return enriched;

  } catch (error) {
    console.log(`[PROJECTS] Enrichment failed: ${error.message}`);
    return projectData; // Retour du projet original
  }
}

/*
 * FAIT QUOI : Calcule des statistiques sur la structure du projet
 * REÇOIT : projectData: object
 * RETOURNE : object (statistiques calculées)
 * ERREURS : Retourne stats vides si calcul échoue
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