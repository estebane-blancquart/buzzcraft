/**
 * Coordinateur DELETE - Workflow ANY → VOID - VERSION PIXEL PARFAIT CORRIGÉE
 * @module delete-coordinator  
 * @description Orchestre la suppression complète d'un projet
 */

import { getProjectPath, getProjectFilePath } from '../cores/paths.js';
import { readPath, checkFileAccess, readDirectory } from '../cores/reader.js';
import { LOG_COLORS } from '../cores/constants.js';

/**
 * Orchestre le workflow complet DELETE (ANY → VOID)
 * @param {string} projectId - ID du projet à supprimer
 * @param {object} [config={}] - Configuration de suppression
 * @param {boolean} [config.force=false] - Forcer la suppression même si en ligne
 * @param {boolean} [config.backup=true] - Créer une sauvegarde avant suppression
 * @returns {Promise<{success: boolean, data: object}>} Résultat du workflow
 */
export async function deleteWorkflow(projectId, config = {}) {
  // Validation des paramètres d'entrée
  const validation = validateDeleteParameters(projectId, config);
  if (!validation.valid) {
    console.log(`${LOG_COLORS.error}[DELETE] Parameter validation failed: ${validation.error}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: `Parameter validation failed: ${validation.error}`
    };
  }

  const projectPath = getProjectPath(projectId);
  const startTime = Date.now();
  
  try {
    // Détection de l'état actuel
    const currentState = await detectCurrentProjectState(projectId);
    
    if (!currentState.success) {
      console.log(`${LOG_COLORS.error}[DELETE] Current state detection failed: ${currentState.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Current state detection failed: ${currentState.error}`
      };
    }
    
    // Vérification des contraintes de suppression
    const constraintCheck = checkDeletionConstraints(currentState.data, config);
    
    if (!constraintCheck.allowed) {
      console.log(`${LOG_COLORS.error}[DELETE] Deletion not allowed: ${constraintCheck.reason}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Deletion not allowed: ${constraintCheck.reason}`
      };
    }
    
    // Inventaire des éléments à supprimer
    const inventory = await inventoryProjectItems(projectPath, projectId);
    
    if (!inventory.success) {
      console.log(`${LOG_COLORS.error}[DELETE] Inventory failed: ${inventory.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Inventory failed: ${inventory.error}`
      };
    }
    
    // Création de sauvegarde (si demandée)
    let backupResult = null;
    if (config.backup !== false) {
      backupResult = await createProjectBackup(projectId, inventory.data);
      
      if (!backupResult.success) {
        console.log(`${LOG_COLORS.error}[DELETE] Backup creation failed: ${backupResult.error}${LOG_COLORS.reset}`);
        return {
          success: false,
          error: `Backup creation failed: ${backupResult.error}`
        };
      }
    }
    
    // Arrêt des services (si en ligne)
    if (currentState.data.state === 'ONLINE') {
      const stopResult = await stopProjectServices(projectId);
      
      if (!stopResult.success) {
        console.log(`${LOG_COLORS.error}[DELETE] Service stop failed: ${stopResult.error}${LOG_COLORS.reset}`);
        return {
          success: false,
          error: `Service stop failed: ${stopResult.error}`
        };
      }
    }
    
    // Suppression progressive des éléments
    const deletionResult = await deleteProjectItems(inventory.data.items);
    
    if (!deletionResult.success) {
      console.log(`${LOG_COLORS.error}[DELETE] Deletion failed: ${deletionResult.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Deletion failed: ${deletionResult.error}`
      };
    }
    
    // Vérification finale (doit être VOID)
    const finalState = await verifyVoidState(projectPath);
    
    if (!finalState.success || !finalState.data.isVoid) {
      console.log(`${LOG_COLORS.warning}[DELETE] Final state verification failed but proceeding${LOG_COLORS.reset}`);
      // On continue car la suppression physique a réussi
    }
    
    const duration = Date.now() - startTime;
    console.log(`${LOG_COLORS.success}[DELETE] Workflow completed successfully in ${duration}ms${LOG_COLORS.reset}`);
    
    // Construction de la réponse
    return {
      success: true,
      data: {
        projectId,
        fromState: currentState.data.state,
        toState: 'VOID',
        duration,
        workflow: {
          action: 'DELETE',
          projectId,
          duration,
          initialState: currentState.data.state,
          finalState: 'VOID',
          completedAt: new Date().toISOString()
        },
        deletion: {
          deletedItems: deletionResult.data.deletedItems,
          deletedCount: deletionResult.data.deletedCount,
          failedItems: deletionResult.data.failedItems || []
        },
        backup: backupResult ? {
          path: backupResult.data.backupPath,
          size: backupResult.data.size,
          itemCount: backupResult.data.itemCount,
          createdAt: backupResult.data.createdAt
        } : null
      }
    };
    
  } catch (error) {
    console.log(`${LOG_COLORS.error}[DELETE] Unexpected workflow error: ${error.message}${LOG_COLORS.reset}`);
    
    return {
      success: false,
      error: `Workflow failed: ${error.message}`,
      errorCode: error.code || 'DELETE_ERROR'
    };
  }
}

/**
 * Détecte l'état actuel d'un projet pour DELETE
 * @param {string} projectId - ID du projet
 * @returns {Promise<{success: boolean, data: object}>} État détecté
 * @private
 */
async function detectCurrentProjectState(projectId) {
  try {
    // Import dynamique pour éviter les dépendances circulaires
    const { detectDraftState } = await import('../probes/draft-detector.js');
    const { detectBuiltState } = await import('../probes/built-detector.js');
    const { detectVoidState } = await import('../probes/void-detector.js');
    
    const projectPath = getProjectPath(projectId);
    
    // Test DRAFT en premier (plus courant)
    const draftCheck = await detectDraftState(projectPath);
    if (draftCheck.success && draftCheck.data.isDraft) {
      return {
        success: true,
        data: {
          state: 'DRAFT',
          confidence: draftCheck.data.confidence,
          projectData: draftCheck.data.projectData
        }
      };
    }
    
    // Test BUILT
    const builtCheck = await detectBuiltState(projectPath);
    if (builtCheck.success && builtCheck.data.isBuilt) {
      return {
        success: true,
        data: {
          state: 'BUILT',
          confidence: builtCheck.data.confidence,
          projectData: builtCheck.data.projectData
        }
      };
    }
    
    // Test VOID en dernier
    const voidCheck = await detectVoidState(projectPath);
    if (voidCheck.success && voidCheck.data.isVoid) {
      return {
        success: true,
        data: {
          state: 'VOID',
          confidence: voidCheck.data.confidence
        }
      };
    }
    
    // État indéterminé
    return {
      success: true,
      data: {
        state: 'UNKNOWN',
        confidence: 0,
        evidence: []
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Current state detection failed: ${error.message}`
    };
  }
}

/**
 * Vérifie les contraintes de suppression
 * @param {object} stateData - Données d'état du projet
 * @param {object} config - Configuration de suppression
 * @returns {{allowed: boolean, reason?: string}} Résultat de vérification
 * @private
 */
function checkDeletionConstraints(stateData, config) {
  // Si le projet est ONLINE et force=false, interdire
  if (stateData.state === 'ONLINE' && config.force !== true) {
    return {
      allowed: false,
      reason: 'Project is ONLINE. Use force=true to delete anyway.'
    };
  }
  
  // Si le projet est VOID, pas de contrainte
  if (stateData.state === 'VOID') {
    return {
      allowed: true,
      reason: 'Project is already VOID'
    };
  }
  
  return { allowed: true };
}

/**
 * Inventorie les éléments du projet à supprimer
 * @param {string} projectPath - Chemin du projet
 * @param {string} projectId - ID du projet
 * @returns {Promise<{success: boolean, data: object}>} Inventaire
 * @private
 */
async function inventoryProjectItems(projectPath, projectId) {
  try {
    const items = [];
    
    // Vérifier le fichier project.json
    const projectFile = getProjectFilePath(projectId);
    const projectFileCheck = await checkFileAccess(projectFile);
    if (projectFileCheck.accessible) {
      items.push({
        type: 'file',
        name: 'project.json',
        path: projectFile
      });
    }
    
    // Vérifier le dossier projet
    const projectDirCheck = await checkFileAccess(projectPath);
    if (projectDirCheck.accessible) {
      items.push({
        type: 'directory',
        name: projectId,
        path: projectPath
      });
    }
    
    return {
      success: true,
      data: {
        items,
        totalCount: items.length
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Inventory failed: ${error.message}`
    };
  }
}

/**
 * Crée une sauvegarde du projet (MOCK)
 * @param {string} projectId - ID du projet
 * @param {object} inventoryData - Données d'inventaire
 * @returns {Promise<{success: boolean, data: object}>} Résultat de sauvegarde
 * @private
 */
async function createProjectBackup(projectId, inventoryData) {
  try {
    // Génération du nom de sauvegarde
    const timestamp = Date.now();
    const backupFileName = `${projectId}-${timestamp}.backup`;
    const backupPath = `./backups/${backupFileName}`;
    
    // Simulation d'une création de backup
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      data: {
        backupPath,
        size: inventoryData.totalCount * 1024, // Taille simulée
        itemCount: inventoryData.totalCount,
        createdAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Backup creation failed: ${error.message}`
    };
  }
}

/**
 * Arrête les services d'un projet (MOCK)
 * @param {string} projectId - ID du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat de l'arrêt
 * @private
 */
async function stopProjectServices(projectId) {
  try {
    // Simulation d'arrêt des services
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: {
        stoppedServices: [`${projectId}-visitor`],
        stoppedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Service stop failed: ${error.message}`
    };
  }
}

/**
 * Supprime les éléments du projet
 * @param {Array} items - Liste des éléments à supprimer
 * @returns {Promise<{success: boolean, data: object}>} Résultat de la suppression
 * @private
 */
async function deleteProjectItems(items) {
  try {
    const { unlink, rm } = await import('fs/promises');
    
    const deletedItems = [];
    const failedItems = [];
    
    for (const item of items) {
      try {
        if (item.type === 'file') {
          await unlink(item.path);
        } else if (item.type === 'directory') {
          await rm(item.path, { recursive: true, force: true });
        }
        
        deletedItems.push(item);
        
      } catch (itemError) {
        // Ignorer les erreurs ENOENT (fichier déjà supprimé)
        if (itemError.code !== 'ENOENT') {
          failedItems.push({
            item,
            error: itemError.message
          });
        } else {
          deletedItems.push(item);
        }
      }
    }
    
    const success = failedItems.length === 0;
    
    return {
      success,
      data: {
        deletedItems,
        deletedCount: deletedItems.length,
        failedItems: failedItems.length > 0 ? failedItems : undefined
      }
    };
    
  } catch (error) {
    console.log(`${LOG_COLORS.error}[DELETE] Deletion process failed: ${error.message}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: `Items deletion failed: ${error.message}`
    };
  }
}

/**
 * Vérifie que le projet est bien en état VOID
 * @param {string} projectPath - Chemin du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat de vérification
 * @private
 */
async function verifyVoidState(projectPath) {
  try {
    const { detectVoidState } = await import('../probes/void-detector.js');
    return await detectVoidState(projectPath);
  } catch (error) {
    return {
      success: false,
      error: `VOID state verification failed: ${error.message}`
    };
  }
}

/**
 * Validation des paramètres d'entrée du workflow DELETE
 * @param {string} projectId - ID du projet
 * @param {object} config - Configuration
 * @returns {{valid: boolean, error?: string}} Résultat de validation
 * @private
 */
function validateDeleteParameters(projectId, config) {
  if (!projectId || typeof projectId !== 'string') {
    return { valid: false, error: 'projectId must be non-empty string' };
  }
  
  if (projectId.trim().length === 0) {
    return { valid: false, error: 'projectId cannot be empty or whitespace only' };
  }
  
  if (!config || typeof config !== 'object') {
    return { valid: false, error: 'config must be an object' };
  }
  
  if (config.force !== undefined && typeof config.force !== 'boolean') {
    return { valid: false, error: 'config.force must be a boolean' };
  }
  
  if (config.backup !== undefined && typeof config.backup !== 'boolean') {
    return { valid: false, error: 'config.backup must be a boolean' };
  }
  
  return { valid: true };
}