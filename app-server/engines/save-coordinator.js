/**
 * Coordinateur SAVE - Workflow DRAFT → DRAFT (sauvegarde simple)
 * @module save-coordinator
 * @description Sauvegarde un projet en cours d'édition sans changement d'état
 */

import { getProjectPath, getProjectFilePath } from '../cores/paths.js';
import { readPath } from '../cores/reader.js';
import { writePath } from '../cores/writer.js';
import { detectDraftState } from '../probes/draft-detector.js';
import { LOG_COLORS } from '../cores/constants.js';

/**
 * Orchestre la sauvegarde simple d'un projet DRAFT → DRAFT
 * @param {string} projectId - ID du projet à sauvegarder  
 * @param {object} config - Configuration contenant les données du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat de la sauvegarde
 */
export async function saveWorkflow(projectId, config = {}) {
  const startTime = Date.now();
  
  // Validation des paramètres
  if (!projectId || typeof projectId !== 'string') {
    console.log(`${LOG_COLORS.error}[SAVE] Invalid project ID: ${projectId}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: 'projectId must be non-empty string'
    };
  }
  
  if (!config || typeof config !== 'object') {
    console.log(`${LOG_COLORS.error}[SAVE] Invalid config${LOG_COLORS.reset}`);
    return {
      success: false,
      error: 'config must be an object'
    };
  }

  // Les données du projet sont dans config (body de la requête PATCH)
  const projectData = config;
  
  const projectPath = getProjectPath(projectId);
  const projectFilePath = getProjectFilePath(projectId);
  
  try {
    // Vérification que le projet existe (on skip la vérification DRAFT pour le SAVE)
    const currentProject = await readPath(projectFilePath);
    if (!currentProject.success) {
      console.log(`${LOG_COLORS.error}[SAVE] Project file not found: ${projectId}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Project ${projectId} not found`
      };
    }
    
    // Préparation des données à sauvegarder (merge avec projet existant)
    const savedProject = {
      ...currentProject.data,  // Données existantes
      ...projectData,          // Nouvelles données du client
      state: 'DRAFT',          // Force DRAFT
      lastModified: new Date().toISOString(),
      savedAt: new Date().toISOString()
    };
    
    // Suppression des propriétés temporaires si elles existent
    delete savedProject.loading;
    delete savedProject.error;
    delete savedProject.isDirty;
    
    // Écriture du projet
    console.log(`${LOG_COLORS.info}[SAVE] Saving project ${projectId}...${LOG_COLORS.reset}`);
    
    const writeResult = await writePath(projectFilePath, savedProject, {
      jsonIndent: 2,
      createDirs: true
    });
    
    if (!writeResult.success) {
      console.log(`${LOG_COLORS.error}[SAVE] Write failed: ${writeResult.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Failed to write project: ${writeResult.error}`
      };
    }
    
    const duration = Date.now() - startTime;
    console.log(`${LOG_COLORS.success}[SAVE] ${projectId}: Saved successfully in ${duration}ms${LOG_COLORS.reset}`);
    
    return {
      success: true,
      data: {
        projectId,
        fromState: 'DRAFT',    // Format attendu par response parser
        toState: 'DRAFT',      // Format attendu par response parser
        duration,
        savedAt: savedProject.savedAt,
        lastModified: savedProject.lastModified,
        project: savedProject,
        workflow: {
          action: 'SAVE',
          projectId,
          duration,
          initialState: 'DRAFT',
          finalState: 'DRAFT',
          completedAt: new Date().toISOString()
        }
      }
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`${LOG_COLORS.error}[SAVE] Unexpected error: ${error.message}${LOG_COLORS.reset}`);
    
    return {
      success: false,
      error: `Save failed: ${error.message}`,
      duration
    };
  }
}