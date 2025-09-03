/**
 * Coordinateur CREATE - Workflow VOID → DRAFT - VERSION PIXEL PARFAIT
 * @module create-coordinator
 * @description Orchestre la création complète d'un projet avec validation et rollback
 */

import {
  detectVoidState,
  detectVoidStateById,
} from "../probes/void-detector.js";
import { detectDraftState } from "../probes/draft-detector.js";
import { getProjectPath, getProjectFilePath } from "../cores/paths.js";
import { PATHS, LOG_COLORS } from "../cores/constants.js";
import { writePath } from "../cores/writer.js";
import { readPath } from "../cores/reader.js";
import { join } from "path";

/**
 * Orchestre le workflow complet CREATE (VOID → DRAFT)
 * @param {string} projectId - ID unique du projet à créer
 * @param {object} [config={}] - Configuration de création
 * @param {string} [config.name] - Nom d'affichage du projet
 * @param {string} [config.template='basic'] - Template à utiliser
 * @param {string} [config.description] - Description du projet
 * @param {object} [config.metadata={}] - Métadonnées additionnelles
 * @returns {Promise<{success: boolean, data: object}>} Résultat du workflow
 * @throws {ValidationError} Si paramètres manquants ou invalides
 *
 * @example
 * const result = await createWorkflow('mon-site', {
 *   name: 'Mon Super Site',
 *   template: 'landing',
 *   description: 'Site vitrine pour mon business'
 * });
 *
 * if (result.success) {
 *   console.log(`Projet créé: ${result.data.project.name}`);
 * }
 */
export async function createWorkflow(projectId, config = {}) {
  // Validation des paramètres d'entrée
  const validation = validateCreateParameters(projectId, config);
  if (!validation.valid) {
    console.log(`${LOG_COLORS.error}[CREATE] Parameter validation failed: ${validation.error}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: `Parameter validation failed: ${validation.error}`,
    };
  }

  const projectPath = getProjectPath(projectId);
  const startTime = Date.now();

  try {
    // Détection état initial (doit être VOID)
    const initialState = await detectVoidStateById(projectId);
    if (!initialState.success) {
      console.log(`${LOG_COLORS.error}[CREATE] State detection failed: ${initialState.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `State detection failed: ${initialState.error}`,
      };
    }

    if (!initialState.data.isVoid) {
      console.log(`${LOG_COLORS.error}[CREATE] Project already exists or invalid state${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Project already exists. Current evidence: ${initialState.data.evidence.join(", ")}`,
      };
    }

    // Chargement du template
    const templateId = config.template;
    const templateResult = await loadProjectTemplate(templateId);

    if (!templateResult.success) {
      console.log(`${LOG_COLORS.error}[CREATE] Template loading failed: ${templateResult.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Template loading failed: ${templateResult.error}`,
      };
    }

    // Construction des données projet
    const projectData = buildProjectData(
      projectId,
      config,
      templateResult.data.template
    );

    if (!projectData.success) {
      console.log(`${LOG_COLORS.error}[CREATE] Project data building failed: ${projectData.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Project data building failed: ${projectData.error}`,
      };
    }

    // Validation du projet construit
    const projectValidation = validateBuiltProject(projectData.data);

    if (!projectValidation.valid) {
      console.log(`${LOG_COLORS.error}[CREATE] Project validation failed: ${projectValidation.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Project validation failed: ${projectValidation.error}`,
      };
    }

    // Écriture du fichier project.json
    const projectFilePath = getProjectFilePath(projectId);

    const writeResult = await writePath(projectFilePath, projectData.data, {
      jsonIndent: 2,
      createDirs: true,
    });

    if (!writeResult.success) {
      console.log(`${LOG_COLORS.error}[CREATE] Project file write failed: ${writeResult.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Project file write failed: ${writeResult.error}`,
      };
    }

    // Vérification état final (doit être DRAFT)
    const finalState = await detectDraftState(projectPath);

    if (!finalState.success || !finalState.data.isDraft) {
      console.log(`${LOG_COLORS.error}[CREATE] Final state verification failed, initiating rollback${LOG_COLORS.reset}`);

      // Rollback: suppression du fichier créé
      try {
        const rollbackResult = await rollbackCreate(projectFilePath);
        console.log(`${LOG_COLORS.warning}[CREATE] Rollback ${rollbackResult.success ? "completed" : "failed"}${LOG_COLORS.reset}`);
      } catch (rollbackError) {
        console.log(`${LOG_COLORS.error}[CREATE] Rollback error: ${rollbackError.message}${LOG_COLORS.reset}`);
      }

      return {
        success: false,
        error: `Final state verification failed. Project rolled back.`,
      };
    }

    const duration = Date.now() - startTime;
    console.log(`${LOG_COLORS.success}[CREATE] Workflow completed successfully in ${duration}ms${LOG_COLORS.reset}`);

    // Construction de la réponse
    return {
      success: true,
      data: {
        projectId,
        fromState: "VOID",
        toState: "DRAFT", 
        duration,
        project: projectData.data,
        templateUsed: templateResult.data.template.id,
        createdAt: new Date().toISOString(),
        files: {
          projectFile: writeResult.data,
        },
      },
    };
  } catch (error) {
    console.log(`${LOG_COLORS.error}[CREATE] Unexpected workflow error: ${error.message}${LOG_COLORS.reset}`);

    // Tentative de rollback en cas d'erreur inattendue
    try {
      const projectFilePath = getProjectFilePath(projectId);
      await rollbackCreate(projectFilePath);
      console.log(`${LOG_COLORS.warning}[CREATE] Emergency rollback completed${LOG_COLORS.reset}`);
    } catch (rollbackError) {
      console.log(`${LOG_COLORS.error}[CREATE] Emergency rollback failed: ${rollbackError.message}${LOG_COLORS.reset}`);
    }

    return {
      success: false,
      error: `Workflow failed: ${error.message}`,
      errorCode: error.code || "WORKFLOW_ERROR",
    };
  }
}

/**
 * Charge un template de projet par ID (logique intégrée CREATE)
 * @param {string} templateId - ID du template à charger
 * @returns {Promise<{success: boolean, data: object}>} Résultat avec template chargé
 * @private
 */
async function loadProjectTemplate(templateId) {
  try {
    // Validation et fallback SEULEMENT ici si nécessaire
    if (!templateId || templateId.trim() === '') {
      return {
        success: false,
        error: `CRITICAL: templateId is empty or null. Received: "${templateId}"`
      };
    }

    // Validation du templateId
    if (!templateId || typeof templateId !== "string") {
      return {
        success: false,
        error: "templateId must be non-empty string",
      };
    }

    // Construction du chemin vers le template
    const templatePath = join(PATHS.projectTemplates, `${templateId}.json`);

    // Lecture du fichier template
    const templateFile = await readPath(templatePath, {
      parseJson: true,
      includeStats: false,
    });

    if (!templateFile.success) {
      console.log(`${LOG_COLORS.error}[CREATE] Template file read failed: ${templateFile.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Template file read failed: ${templateFile.error}`,
      };
    }

    if (!templateFile.data.exists) {
      console.log(`${LOG_COLORS.error}[CREATE] Template file not found: ${templateId}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Template '${templateId}' not found`,
      };
    }

    if (templateFile.data.jsonError) {
      console.log(`${LOG_COLORS.error}[CREATE] Template JSON error: ${templateFile.data.jsonError}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Template JSON parsing failed: ${templateFile.data.jsonError}`,
      };
    }

    const templateData = templateFile.data.parsed;

    // Validation basique du template
    const validation = validateTemplateForCreate(templateData, templateId);
    if (!validation.valid) {
      console.log(`${LOG_COLORS.error}[CREATE] Template validation failed: ${validation.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Template validation failed: ${validation.error}`,
      };
    }

    return {
      success: true,
      data: {
        template: {
          id: templateId,
          ...templateData,
          originalId: templateData.id || templateId,
        },
        isFallback: false,
      },
    };
  } catch (error) {
    console.log(`${LOG_COLORS.error}[CREATE] Template loading error: ${error.message}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: `Template loading failed: ${error.message}`,
    };
  }
}

/**
 * Construit les données du projet à partir du template et config (logique intégrée CREATE)
 * @param {string} projectId - ID du projet
 * @param {object} config - Configuration utilisateur
 * @param {object} template - Template chargé
 * @returns {{success: boolean, data: object}} Données projet construites
 * @private
 */
function buildProjectData(projectId, config, template) {
  try {
    // Construction des données de base
    const now = new Date().toISOString();

    const projectData = {
      id: projectId,
      name:
        config.name ||
        projectId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      description:
        config.description || template.description || "Generated project",
      state: "DRAFT",
      created: now,
      lastModified: now,
      template: {
        id: template.id,
        name: template.name || "Unknown Template",
        version: template.version || "1.0.0",
      },
      metadata: {
        generator: "create-coordinator",
        version: "1.0.0",
        createdWith: template.id,
      },
      pages: [],
    };

    // Intégration des pages du template
    if (template.project && template.project.pages) {
      projectData.pages = template.project.pages.map((page) => ({
        ...page,
        id: page.id || `page-${Date.now()}`,
        name: page.name || "Untitled Page",
      }));
    } else {
      // Page par défaut si le template n'en contient pas
      projectData.pages = [
        {
          id: "home",
          name: "Home",
          path: "/",
          title: `Welcome to ${projectData.name}`,
          layout: {
            sections: [],
          },
        },
      ];
    }

    return {
      success: true,
      data: projectData,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Valide les paramètres d'entrée du workflow CREATE
 * @param {string} projectId - ID du projet
 * @param {object} config - Configuration
 * @returns {{valid: boolean, error?: string}} Résultat de validation
 * @private
 */
function validateCreateParameters(projectId, config) {
  if (!projectId || typeof projectId !== "string") {
    return { valid: false, error: "projectId must be non-empty string" };
  }

  if (projectId.trim().length === 0) {
    return {
      valid: false,
      error: "projectId cannot be empty or whitespace only",
    };
  }

  if (!/^[a-z0-9-]+$/.test(projectId)) {
    return {
      valid: false,
      error: "projectId must contain only lowercase letters, numbers, and hyphens",
    };
  }

  if (!config || typeof config !== "object") {
    return { valid: false, error: "config must be an object" };
  }

  return { valid: true };
}

/**
 * Valide un projet construit avant écriture sur disque
 * @param {object} projectData - Données du projet à valider
 * @returns {{valid: boolean, error?: string}} Résultat de validation
 * @private
 */
function validateBuiltProject(projectData) {
  if (!projectData || typeof projectData !== "object") {
    return { valid: false, error: "projectData must be an object" };
  }

  // Validation champs requis
  const requiredFields = ["id", "name", "state", "created"];
  for (const field of requiredFields) {
    if (!projectData[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  // Validation état
  if (projectData.state !== "DRAFT") {
    return { valid: false, error: "Built project must have state DRAFT" };
  }

  // Validation structure pages
  if (!projectData.pages || !Array.isArray(projectData.pages)) {
    return { valid: false, error: "Project must have pages array" };
  }

  if (projectData.pages.length === 0) {
    return { valid: false, error: "Project must have at least one page" };
  }

  return { valid: true };
}

/**
 * Crée un template de fallback si le template demandé n'existe pas
 * @param {string} templateId - ID du template demandé
 * @returns {object} Template de fallback
 * @private
 */
function createFallbackTemplate(templateId) {
  return {
    id: templateId,
    name: `${templateId.charAt(0).toUpperCase() + templateId.slice(1)} Template`,
    description: `Fallback template for ${templateId}`,
    version: "1.0.0",
    project: {
      name: "Basic Project",
      pages: [
        {
          id: "home",
          name: "Home",
          path: "/",
          title: "Welcome",
          layout: {
            sections: [
              {
                id: "main-section",
                name: "Main Section",
                divs: [
                  {
                    id: "main-content",
                    name: "Main Content",
                    components: [
                      {
                        id: "main-title",
                        type: "heading",
                        tag: "h1",
                        content: "Welcome to Your New Site",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  };
}

/**
 * Valide un template pour utilisation CREATE
 * @param {object} templateData - Données du template
 * @param {string} templateId - ID du template
 * @returns {{valid: boolean, error?: string}} Résultat validation
 * @private
 */
function validateTemplateForCreate(templateData, templateId) {
  if (!templateData || typeof templateData !== "object") {
    return { valid: false, error: "Template must be an object" };
  }

  // Le template peut avoir juste un nom et description minimaux
  if (!templateData.name && !templateData.project) {
    return {
      valid: false,
      error: "Template must have at least name or project data",
    };
  }

  // Si il y a des pages, valider la structure basique
  if (templateData.project && templateData.project.pages) {
    if (!Array.isArray(templateData.project.pages)) {
      return { valid: false, error: "Template pages must be an array" };
    }

    if (templateData.project.pages.length === 0) {
      return { valid: false, error: "Template must have at least one page" };
    }

    // Validation basique de la première page
    const firstPage = templateData.project.pages[0];
    if (!firstPage.id || !firstPage.name) {
      return { valid: false, error: "Template pages must have id and name" };
    }
  }

  return { valid: true };
}

/**
 * Rollback de la création (suppression des fichiers créés)
 * @param {string} projectFilePath - Chemin du fichier projet
 * @returns {Promise<{success: boolean}>} Résultat du rollback
 * @private
 */
async function rollbackCreate(projectFilePath) {
  try {
    // Vérifier si le fichier existe avant de le supprimer
    const fileCheck = await readPath(projectFilePath);

    if (fileCheck.success && fileCheck.data.exists) {
      // Import dynamique pour unlink (éviter de charger fs en haut)
      const { unlink } = await import("fs/promises");
      await unlink(projectFilePath);
    }

    return { success: true };
  } catch (error) {
    console.log(`${LOG_COLORS.error}[CREATE] Rollback failed: ${error.message}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: error.message,
    };
  }
}