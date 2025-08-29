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
import { PATHS } from "../cores/constants.js";
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
  console.log("🟢 [SERVER] === DEBUG createWorkflow START ===");
  console.log("🟢 [SERVER] projectId =", `"${projectId}"`);
  console.log("🟢 [SERVER] config complet:", JSON.stringify(config, null, 2));
  console.log("🟢 [SERVER] config.template =", `"${config.template}"`);
  console.log("🟢 [SERVER] typeof config.template =", typeof config.template);
  console.log("🟢 [SERVER] config.template length =", config.template?.length);
  console.log("🟢 [SERVER] config.template === 'empty' ?", config.template === 'empty');
  console.log("🟢 [SERVER] Boolean(config.template) =", Boolean(config.template));

  console.log(
    `[CREATE] CALL 3: createWorkflow called for project: ${projectId}`
  );

  // CALL 1: Validation des paramètres d'entrée
  const validation = validateCreateParameters(projectId, config);
  if (!validation.valid) {
    console.log(`[CREATE] Parameter validation failed: ${validation.error}`);
    return {
      success: false,
      error: `Parameter validation failed: ${validation.error}`,
    };
  }

  const projectPath = getProjectPath(projectId);
  const startTime = Date.now();

  console.log(`[CREATE] Project path resolved: ${projectPath}`);

  try {
    // CALL 4: Détection état initial (doit être VOID)
    console.log(`[CREATE] CALL 4: Detecting initial state...`);
    const initialState = await detectVoidStateById(projectId);
    if (!initialState.success) {
      console.log(
        `[CREATE] Initial state detection failed: ${initialState.error}`
      );
      return {
        success: false,
        error: `State detection failed: ${initialState.error}`,
      };
    }

    if (!initialState.data.isVoid) {
      console.log(`[CREATE] Project already exists or invalid state`);
      return {
        success: false,
        error: `Project already exists. Current evidence: ${initialState.data.evidence.join(", ")}`,
      };
    }

    console.log(`[CREATE] Initial state confirmed: VOID`);

    // CALL 5: Chargement du template - VERSION DEBUG
    console.log("🟢 [SERVER] CALL 5: About to determine templateId...");
    console.log("🟢 [SERVER] config.template before decision =", `"${config.template}"`);
    
    // ✅ PAS DE FALLBACK ICI - on passe directement la valeur
    const templateId = config.template;
    
    console.log("🟢 [SERVER] templateId determined =", `"${templateId}"`);
    console.log("🟢 [SERVER] Calling loadProjectTemplate with:", `"${templateId}"`);
    
    const templateResult = await loadProjectTemplate(templateId);

    if (!templateResult.success) {
      console.log(`[CREATE] Template loading failed: ${templateResult.error}`);
      return {
        success: false,
        error: `Template loading failed: ${templateResult.error}`,
      };
    }

    console.log(
      `[CREATE] Template loaded successfully: ${templateResult.data.template.name}`
    );

    // CALL 6: Construction des données projet
    console.log(`[CREATE] CALL 6: Building project data...`);
    const projectData = buildProjectData(
      projectId,
      config,
      templateResult.data.template
    );

    if (!projectData.success) {
      console.log(
        `[CREATE] Project data building failed: ${projectData.error}`
      );
      return {
        success: false,
        error: `Project data building failed: ${projectData.error}`,
      };
    }

    console.log(`[CREATE] Project data built successfully`);

    // CALL 7: Validation du projet construit
    console.log(`[CREATE] CALL 7: Validating built project...`);
    const projectValidation = validateBuiltProject(projectData.data);

    if (!projectValidation.valid) {
      console.log(
        `[CREATE] Project validation failed: ${projectValidation.error}`
      );
      return {
        success: false,
        error: `Project validation failed: ${projectValidation.error}`,
      };
    }

    console.log(`[CREATE] Project validation passed`);

    // CALL 8: Écriture du fichier project.json
    const projectFilePath = getProjectFilePath(projectId);
    console.log(`[CREATE] CALL 8: Writing project.json to: ${projectFilePath}`);

    const writeResult = await writePath(projectFilePath, projectData.data, {
      jsonIndent: 2,
      createDirs: true,
    });

    if (!writeResult.success) {
      console.log(`[CREATE] Project file write failed: ${writeResult.error}`);
      return {
        success: false,
        error: `Project file write failed: ${writeResult.error}`,
      };
    }

    console.log(`[CREATE] Project file written successfully`);

    // CALL 9: Vérification état final (doit être DRAFT)
    console.log(`[CREATE] CALL 9: Verifying final state...`);
    const finalState = await detectDraftState(projectPath);

    if (!finalState.success || !finalState.data.isDraft) {
      console.log(
        `[CREATE] Final state verification failed, initiating rollback`
      );

      // Rollback: suppression du fichier créé
      try {
        const rollbackResult = await rollbackCreate(projectFilePath);
        console.log(
          `[CREATE] Rollback ${rollbackResult.success ? "completed" : "failed"}`
        );
      } catch (rollbackError) {
        console.log(`[CREATE] Rollback error: ${rollbackError.message}`);
      }

      return {
        success: false,
        error: `Final state verification failed. Project rolled back.`,
      };
    }

    const duration = Date.now() - startTime;
    console.log(`[CREATE] Workflow completed successfully in ${duration}ms`);

    // CALL 10: Construction de la réponse
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
    console.log(`[CREATE] Unexpected workflow error: ${error.message}`);

    // Tentative de rollback en cas d'erreur inattendue
    try {
      const projectFilePath = getProjectFilePath(projectId);
      await rollbackCreate(projectFilePath);
      console.log(`[CREATE] Emergency rollback completed`);
    } catch (rollbackError) {
      console.log(
        `[CREATE] Emergency rollback failed: ${rollbackError.message}`
      );
    }

    return {
      success: false,
      error: `Workflow failed: ${error.message}`,
      errorCode: error.code || "WORKFLOW_ERROR",
    };
  }
}

/**
 * Charge un template de projet par ID (logique intégrée CREATE) - VERSION DEBUG
 * @param {string} templateId - ID du template à charger
 * @returns {Promise<{success: boolean, data: object}>} Résultat avec template chargé
 * @private
 */
async function loadProjectTemplate(templateId) {
  console.log("🔴 [TEMPLATE] === DEBUG loadProjectTemplate START ===");
  console.log("🔴 [TEMPLATE] templateId received =", `"${templateId}"`);
  console.log("🔴 [TEMPLATE] typeof templateId =", typeof templateId);
  console.log("🔴 [TEMPLATE] templateId length =", templateId?.length);
  console.log("🔴 [TEMPLATE] Boolean(templateId) =", Boolean(templateId));

  console.log(`[CREATE] Loading template: ${templateId}`);

  try {
    // Validation et fallback SEULEMENT ici si nécessaire
    if (!templateId || templateId.trim() === '') {
      console.log("🔴 [TEMPLATE] templateId is empty/null, using basic fallback");
      templateId = "basic";
    }
    
    console.log("🔴 [TEMPLATE] Final templateId to use =", `"${templateId}"`);

    // Validation du templateId
    if (!templateId || typeof templateId !== "string") {
      return {
        success: false,
        error: "templateId must be non-empty string",
      };
    }

    // Construction du chemin vers le template
    const templatePath = join(PATHS.projectTemplates, `${templateId}.json`);
    console.log("🔴 [TEMPLATE] Template path =", templatePath);

    // Lecture du fichier template
    const templateFile = await readPath(templatePath, {
      parseJson: true,
      includeStats: false,
    });

    if (!templateFile.success) {
      console.log("🔴 [TEMPLATE] Template file read FAILED:", templateFile.error);
      return {
        success: false,
        error: `Template file read failed: ${templateFile.error}`,
      };
    }

    if (!templateFile.data.exists) {
      console.log("🔴 [TEMPLATE] Template file NOT FOUND:", templateId);
      return {
        success: false,
        error: `Template '${templateId}' not found`,
      };
    }

    if (templateFile.data.jsonError) {
      console.log(
        `[CREATE] Template JSON error: ${templateFile.data.jsonError}`
      );
      return {
        success: false,
        error: `Template JSON parsing failed: ${templateFile.data.jsonError}`,
      };
    }

    const templateData = templateFile.data.parsed;
    console.log("🔴 [TEMPLATE] Template file loaded successfully for:", templateId);
    console.log("🔴 [TEMPLATE] Template data:", templateFile.data.parsed?.project?.id || 'unknown');

    // Validation basique du template
    const validation = validateTemplateForCreate(templateData, templateId);
    if (!validation.valid) {
      console.log(`[CREATE] Template validation failed: ${validation.error}`);
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
    console.log("🔴 [TEMPLATE] ERROR:", error.message);
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
  console.log(`[CREATE] Building project data for: ${projectId}`);

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

      console.log(
        `[CREATE] Integrated ${projectData.pages.length} pages from template`
      );
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

      console.log(`[CREATE] Created default home page`);
    }

    return {
      success: true,
      data: projectData,
    };
  } catch (error) {
    console.log(`[CREATE] Project data building error: ${error.message}`);
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
  console.log(`[CREATE] Initiating rollback for: ${projectFilePath}`);

  try {
    // Vérifier si le fichier existe avant de le supprimer
    const fileCheck = await readPath(projectFilePath);

    if (fileCheck.success && fileCheck.data.exists) {
      // Import dynamique pour unlink (éviter de charger fs en haut)
      const { unlink } = await import("fs/promises");
      await unlink(projectFilePath);
      console.log(`[CREATE] Project file removed successfully`);
    } else {
      console.log(`[CREATE] No project file to remove`);
    }

    return { success: true };
  } catch (error) {
    console.log(`[CREATE] Rollback failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

console.log(
  `[CREATE] Create coordinator loaded successfully - PIXEL PERFECT VERSION`
);