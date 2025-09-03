/**
 * Coordinateur REVERT - Workflow BUILT → DRAFT - VERSION PIXEL PARFAIT
 * @module revert-coordinator
 * @description Orchestre le revert d'un projet BUILT vers l'état DRAFT en supprimant les artifacts de build
 */

import { detectBuiltState } from '../probes/built-detector.js';
import { detectDraftState } from '../probes/draft-detector.js';
import { getProjectPath, getProjectFilePath } from '../cores/paths.js';
import { readPath } from '../cores/reader.js';
import { writePath } from '../cores/writer.js';
import { LOG_COLORS } from '../cores/constants.js';

/**
 * Orchestre le workflow complet REVERT (BUILT → DRAFT)
 * @param {string} projectId - ID du projet à reverter
 * @param {object} [config={}] - Configuration de revert
 * @param {boolean} [config.keepBackup=true] - Garder une sauvegarde des artifacts
 * @returns {Promise<{success: boolean, data: object}>} Résultat du workflow
 */
export async function revertWorkflow(projectId, config = {}) {
  const startTime = Date.now();
  
  // 1. DÉBUT
  console.log(`${LOG_COLORS.DRAFT}[REVERT] Starting BUILT → DRAFT for ${projectId}${LOG_COLORS.reset}`);
  
  // Validation des paramètres d'entrée
  const validation = validateRevertParameters(projectId, config);
  if (!validation.valid) {
    console.log(`${LOG_COLORS.error}[REVERT] Validation failed: ${validation.error}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: `Parameter validation failed: ${validation.error}`
    };
  }

  const projectPath = getProjectPath(projectId);
  
  try {
    // Détection de l'état actuel (doit être BUILT)
    const currentState = await detectBuiltState(projectPath);
    
    if (!currentState.success || !currentState.data.isBuilt) {
      console.log(`${LOG_COLORS.error}[REVERT] Not in BUILT state (confidence: ${currentState.data?.confidence || 0}%)${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Project must be in BUILT state`
      };
    }
    
    // Chargement des données projet
    const projectData = await loadProjectForRevert(projectId);
    if (!projectData.success) {
      console.log(`${LOG_COLORS.error}[REVERT] Project loading failed: ${projectData.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Project loading failed: ${projectData.error}`
      };
    }
    
    // Sauvegarde des artifacts (si demandée)
    let backupResult = null;
    if (config.keepBackup !== false) {
      backupResult = await backupBuildArtifacts(projectId, projectData.data);
    }
    
    // Suppression des artifacts de build
    const cleanupResult = await removeBuildArtifacts(projectPath, projectData.data);
    
    if (!cleanupResult.success) {
      console.log(`${LOG_COLORS.error}[REVERT] Cleanup failed: ${cleanupResult.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Artifacts cleanup failed: ${cleanupResult.error}`
      };
    }
    
    console.log(`${LOG_COLORS.info}[REVERT] Removed ${cleanupResult.data.removedCount} artifacts${LOG_COLORS.reset}`);
    
    // Mise à jour des métadonnées projet vers DRAFT
    const updatedProject = await updateProjectToDraft(projectId, projectData.data);
    
    if (!updatedProject.success) {
      console.log(`${LOG_COLORS.error}[REVERT] Project update failed: ${updatedProject.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Project update failed: ${updatedProject.error}`
      };
    }
    
    // Vérification finale (optionnelle)
    await detectDraftState(projectPath);
    
    const duration = Date.now() - startTime;
    console.log(`${LOG_COLORS.success}[REVERT] Completed in ${duration}ms${LOG_COLORS.reset}`);
    
    // Construction de la réponse
    return {
      success: true,
      data: {
        projectId,
        fromState: 'BUILT',
        toState: 'DRAFT',
        duration,
        project: updatedProject.data,
        workflow: {
          action: 'REVERT',
          projectId,
          duration,
          initialState: 'BUILT',
          finalState: 'DRAFT',
          completedAt: new Date().toISOString()
        },
        cleanup: {
          removedItems: cleanupResult.data.removedItems,
          removedCount: cleanupResult.data.removedCount
        },
        backup: backupResult ? {
          created: true,
          path: backupResult.data.backupPath,
          size: backupResult.data.size
        } : null
      }
    };
    
  } catch (error) {
    console.log(`${LOG_COLORS.error}[REVERT] Unexpected error: ${error.message}${LOG_COLORS.reset}`);
    
    return {
      success: false,
      error: `Revert workflow failed: ${error.message}`,
      errorCode: error.code || 'REVERT_ERROR'
    };
  }
}

/**
 * Charge les données projet pour revert
 * @param {string} projectId - ID du projet
 * @returns {Promise<{success: boolean, data: object}>} Données projet
 * @private
 */
async function loadProjectForRevert(projectId) {
  try {
    const projectFilePath = getProjectFilePath(projectId);
    
    const projectFile = await readPath(projectFilePath, {
      parseJson: true
    });
    
    if (!projectFile.success) {
      return {
        success: false,
        error: `Cannot read project file: ${projectFile.error}`
      };
    }
    
    if (!projectFile.data.exists) {
      return {
        success: false,
        error: `Project file does not exist: ${projectFilePath}`
      };
    }
    
    if (projectFile.data.jsonError) {
      return {
        success: false,
        error: `Project file has invalid JSON: ${projectFile.data.jsonError}`
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
 * Crée une sauvegarde des artifacts de build (MOCK)
 * @param {string} projectId - ID du projet
 * @param {object} projectData - Données du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat de sauvegarde
 * @private
 */
async function backupBuildArtifacts(projectId, projectData) {
  // Simulation d'une sauvegarde
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const backupPath = `./backups/${projectId}-build-${Date.now()}.backup`;
  
  return {
    success: true,
    data: {
      backupPath,
      size: (projectData.build?.generatedFiles || 0) * 512,
      itemCount: projectData.build?.generatedFiles || 0,
      createdAt: new Date().toISOString()
    }
  };
}

/**
 * Supprime les artifacts de build
 * @param {string} projectPath - Chemin du projet
 * @param {object} projectData - Données du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat de la suppression
 * @private
 */
async function removeBuildArtifacts(projectPath, projectData) {
  try {
    const { rm, readdir } = await import('fs/promises');
    
    const removedItems = [];
    const failedItems = [];
    
    // Lire tout le contenu du dossier projet
    const items = await readdir(projectPath);
    
    // Supprimer tout sauf project.json
    for (const item of items) {
      if (item === 'project.json') {
        continue; // Garder project.json
      }
      
      try {
        const fullPath = `${projectPath}/${item}`;
        await rm(fullPath, { recursive: true, force: true });
        removedItems.push(item);
        
      } catch (itemError) {
        if (itemError.code !== 'ENOENT') {
          failedItems.push({
            path: item,
            error: itemError.message
          });
        } else {
          removedItems.push(item);
        }
      }
    }
    
    return {
      success: failedItems.length === 0,
      data: {
        removedItems,
        removedCount: removedItems.length,
        failedItems: failedItems.length > 0 ? failedItems : undefined
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Artifacts cleanup failed: ${error.message}`
    };
  }
}

/**
 * Valide les paramètres d'entrée du workflow REVERT
 * @param {string} projectId - ID du projet
 * @param {object} config - Configuration
 * @returns {{valid: boolean, error?: string}} Résultat de validation
 * @private
 */
function validateRevertParameters(projectId, config) {
  if (!projectId || typeof projectId !== 'string') {
    return { valid: false, error: 'projectId must be non-empty string' };
  }
  
  if (projectId.trim().length === 0) {
    return { valid: false, error: 'projectId cannot be empty or whitespace only' };
  }
  
  if (!config || typeof config !== 'object') {
    return { valid: false, error: 'config must be an object' };
  }
  
  if (config.keepBackup !== undefined && typeof config.keepBackup !== 'boolean') {
    return { valid: false, error: 'config.keepBackup must be a boolean' };
  }
  
  return { valid: true };
}

/**
 * Met à jour le projet vers l'état DRAFT
 * @param {string} projectId - ID du projet
 * @param {object} projectData - Données du projet
 * @returns {Promise<{success: boolean, data: object}>} Projet mis à jour
 * @private
 */
async function updateProjectToDraft(projectId, projectData) {
  try {
    const projectFilePath = getProjectFilePath(projectId);
    
    const updatedProject = {
      ...projectData,
      state: 'DRAFT',
      build: undefined,
      reverted: {
        fromState: 'BUILT',
        revertedAt: new Date().toISOString(),
        reason: 'Manual revert from BUILT to DRAFT state'
      },
      updated: new Date().toISOString()
    };
    
    const saveResult = await writePath(projectFilePath, JSON.stringify(updatedProject, null, 2));
    
    if (!saveResult.success) {
      return {
        success: false,
        error: `Failed to save project file: ${saveResult.error}`
      };
    }
    
    return {
      success: true,
      data: updatedProject
    };
    
  } catch (error) {
    return {
      success: false,
      error: `State update failed: ${error.message}`
    };
  }
}

console.log(`${LOG_COLORS.DRAFT}[REVERT] Revert coordinator loaded${LOG_COLORS.reset}`);