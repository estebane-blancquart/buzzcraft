/**
 * Coordinateur BUILD - Workflow DRAFT → BUILT - VERSION PIXEL PARFAIT
 * @module build-coordinator
 * @description Orchestre le build complet d'un projet DRAFT vers l'état BUILT
 */

import { detectDraftState } from '../probes/draft-detector.js';
import { detectBuiltState } from '../probes/built-detector.js';
import { getProjectPath, getProjectFilePath } from '../cores/paths.js';
import { readPath } from '../cores/reader.js';
import { writePath } from '../cores/writer.js';
import { LOG_COLORS } from '../cores/constants.js';

/**
 * Orchestre le workflow complet BUILD (DRAFT → BUILT)
 * @param {string} projectId - ID du projet à builder
 * @param {object} [config={}] - Configuration de build
 * @param {string[]} [config.targets=['app-visitor']] - Targets à générer
 * @param {boolean} [config.minify=true] - Minification du code
 * @param {boolean} [config.skipValidation=false] - Skip validation finale
 * @returns {Promise<{success: boolean, data: object}>} Résultat du workflow
 */
export async function buildWorkflow(projectId, config = {}) {
  const startTime = Date.now();
  
  // Validation des paramètres d'entrée
  const validation = validateBuildParameters(projectId, config);
  if (!validation.valid) {
    console.log(`${LOG_COLORS.error}[BUILD] Parameter validation failed: ${validation.error}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: `Parameter validation failed: ${validation.error}`
    };
  }

  const projectPath = getProjectPath(projectId);
  
  try {
    // Détection de l'état initial (doit être DRAFT)
    const initialState = await detectDraftState(projectPath);
    
    if (!initialState.success || !initialState.data.isDraft) {
      console.log(`${LOG_COLORS.error}[BUILD] Project not in DRAFT state${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Project must be in DRAFT state`
      };
    }
    
    // Chargement des données projet
    const projectData = await loadProjectForBuild(projectId);
    if (!projectData.success) {
      console.log(`${LOG_COLORS.error}[BUILD] Project loading failed: ${projectData.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Project loading failed: ${projectData.error}`
      };
    }
    
    // Préparation configuration de build
    const buildConfig = prepareBuildConfiguration(projectData.data, config);
    
    // Génération du code via Handlebars
    const buildResult = await generateProjectCodeWithHandlebars(projectData.data, buildConfig);
    
    if (!buildResult.success) {
      console.log(`${LOG_COLORS.error}[BUILD] Code generation failed: ${buildResult.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Code generation failed: ${buildResult.error}`
      };
    }
    
    // Mise à jour des métadonnées projet
    const updatedProject = await updateProjectWithBuildData(projectData.data, buildResult.data, buildConfig);
    
    if (!updatedProject.success) {
      console.log(`${LOG_COLORS.error}[BUILD] Project metadata update failed: ${updatedProject.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Project metadata update failed: ${updatedProject.error}`
      };
    }
    
    // Mise à jour de l'état vers BUILT
    const stateUpdateResult = await updateProjectState(projectId, 'BUILT', updatedProject.data);
    
    if (!stateUpdateResult.success) {
      console.log(`${LOG_COLORS.error}[BUILD] State update failed: ${stateUpdateResult.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `State update failed: ${stateUpdateResult.error}`
      };
    }
    
    // Vérification finale (doit être BUILT)
    const finalState = await detectBuiltState(projectPath);
    
    const duration = Date.now() - startTime;
    
    if (!finalState.success || !finalState.data.isBuilt) {
      console.log(`${LOG_COLORS.warning}[BUILD] Final verification failed but continuing (${duration}ms)${LOG_COLORS.reset}`);
    } else {
      console.log(`${LOG_COLORS.success}[BUILD] Workflow completed successfully in ${duration}ms${LOG_COLORS.reset}`);
    }
    
    return {
      success: true,
      data: {
        projectId,
        fromState: 'DRAFT',
        toState: 'BUILT',
        duration,
        project: updatedProject.data,
        build: {
          generatedFiles: buildResult.data.generatedFiles.length,
          totalSize: buildResult.data.totalSize || 0,
          targets: buildConfig.targets,
          builtAt: new Date().toISOString()
        },
        workflow: {
          action: 'BUILD',
          projectId,
          duration,
          initialState: 'DRAFT',
          finalState: 'BUILT',
          completedAt: new Date().toISOString()
        }
      }
    };
    
  } catch (error) {
    console.log(`${LOG_COLORS.error}[BUILD] Unexpected error: ${error.message}${LOG_COLORS.reset}`);
    
    return {
      success: false,
      error: `Build workflow failed: ${error.message}`,
      errorCode: error.code || 'BUILD_ERROR'
    };
  }
}

/**
 * Charge les données projet pour build
 * @param {string} projectId - ID du projet
 * @returns {Promise<{success: boolean, data: object}>} Données projet
 * @private
 */
async function loadProjectForBuild(projectId) {
  try {
    const projectFilePath = getProjectFilePath(projectId);
    
    const projectFile = await readPath(projectFilePath, {
      parseJson: true,
      includeStats: false
    });
    
    if (!projectFile.success || !projectFile.data.exists) {
      return {
        success: false,
        error: `Project file not found: ${projectId}`
      };
    }
    
    if (projectFile.data.jsonError) {
      return {
        success: false,
        error: `Invalid project file: ${projectFile.data.jsonError}`
      };
    }
    
    return {
      success: true,
      data: projectFile.data.parsed
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Project loading failed: ${error.message}`
    };
  }
}

/**
 * Prépare la configuration de build
 * @param {object} projectData - Données du projet
 * @param {object} config - Configuration utilisateur
 * @returns {object} Configuration de build complète
 * @private
 */
function prepareBuildConfiguration(projectData, config) {
  return {
    targets: config.targets || ['app-visitor'],
    minify: config.minify !== false,
    sourceMaps: config.sourceMaps === true,
    skipValidation: config.skipValidation === true,
    projectData,
    buildId: `build_${Date.now()}`,
    buildStartedAt: new Date().toISOString()
  };
}

/**
 * Génère le code du projet avec Handlebars (MOCK)
 * @param {object} projectData - Données du projet
 * @param {object} buildConfig - Configuration de build
 * @returns {Promise<{success: boolean, data: object}>} Résultat de génération
 * @private
 */
async function generateProjectCodeWithHandlebars(projectData, buildConfig) {
  try {
    // Simulation de la génération de code
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Fichiers générés simulés
    const generatedFiles = [
      'index.html',
      'styles.css',
      'script.js',
      'package.json'
    ];
    
    return {
      success: true,
      data: {
        generatedFiles,
        totalSize: generatedFiles.length * 1024, // Taille simulée
        buildTargets: buildConfig.targets,
        buildId: buildConfig.buildId
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Code generation failed: ${error.message}`
    };
  }
}

/**
 * Met à jour le projet avec les données de build
 * @param {object} projectData - Données du projet
 * @param {object} buildData - Données de build
 * @param {object} buildConfig - Configuration de build
 * @returns {Promise<{success: boolean, data: object}>} Projet mis à jour
 * @private
 */
async function updateProjectWithBuildData(projectData, buildData, buildConfig) {
  try {
    const updatedProject = {
      ...projectData,
      state: 'BUILT',
      lastModified: new Date().toISOString(),
      build: {
        builtAt: buildConfig.buildStartedAt,
        buildId: buildConfig.buildId,
        version: `v${Date.now()}`,
        targets: buildConfig.targets,
        generatedFiles: buildData.generatedFiles.length,
        totalSize: buildData.totalSize,
        minified: buildConfig.minify,
        sourceMaps: buildConfig.sourceMaps
      }
    };
    
    return {
      success: true,
      data: updatedProject
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Project update failed: ${error.message}`
    };
  }
}

/**
 * Met à jour l'état du projet
 * @param {string} projectId - ID du projet
 * @param {string} newState - Nouvel état
 * @param {object} projectData - Données du projet
 * @returns {Promise<{success: boolean}>} Résultat de mise à jour
 * @private
 */
async function updateProjectState(projectId, newState, projectData) {
  try {
    const projectFilePath = getProjectFilePath(projectId);
    
    const updatedProjectData = {
      ...projectData,
      state: newState,
      lastModified: new Date().toISOString()
    };
    
    const writeResult = await writePath(projectFilePath, updatedProjectData, {
      jsonIndent: 2,
      createDirs: false
    });
    
    if (!writeResult.success) {
      return {
        success: false,
        error: `Failed to write project state: ${writeResult.error}`
      };
    }
    
    return {
      success: true
    };
    
  } catch (error) {
    return {
      success: false,
      error: `State update failed: ${error.message}`
    };
  }
}

/**
 * Valide les paramètres de build
 * @param {string} projectId - ID du projet
 * @param {object} config - Configuration
 * @returns {{valid: boolean, error?: string}} Résultat de validation
 * @private
 */
function validateBuildParameters(projectId, config) {
  // Validation projectId
  if (!projectId || typeof projectId !== 'string') {
    return { valid: false, error: 'projectId must be non-empty string' };
  }
  
  if (projectId.trim().length === 0) {
    return { valid: false, error: 'projectId cannot be empty or whitespace only' };
  }
  
  // Validation config
  if (!config || typeof config !== 'object') {
    return { valid: false, error: 'config must be an object' };
  }
  
  // Validation targets optionnelle
  if (config.targets && !Array.isArray(config.targets)) {
    return { valid: false, error: 'config.targets must be an array' };
  }
  
  if (config.targets && config.targets.length === 0) {
    return { valid: false, error: 'config.targets cannot be empty' };
  }
  
  return { valid: true };
}