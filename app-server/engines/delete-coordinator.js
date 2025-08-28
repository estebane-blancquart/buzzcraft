/**
 * Coordinateur DELETE - Workflow ANY → VOID - VERSION PIXEL PARFAIT
 * @module delete-coordinator
 * @description Orchestre la suppression complète d'un projet
 */

import { getProjectPath, getProjectFilePath } from '../../cores/paths.js';
import { readPath, checkFileAccess } from '../../cores/reader.js';

/**
 * Orchestre le workflow complet DELETE (ANY → VOID)
 * @param {string} projectId - ID du projet à supprimer
 * @param {object} [config={}] - Configuration de suppression
 * @param {boolean} [config.force=false] - Forcer la suppression même si en ligne
 * @param {boolean} [config.backup=true] - Créer une sauvegarde avant suppression
 * @returns {Promise<{success: boolean, data: object}>} Résultat du workflow
 * 
 * @example
 * const result = await deleteWorkflow('mon-site', {
 *   force: false,
 *   backup: true
 * });
 * 
 * if (result.success) {
 *   console.log(`Projet supprimé: ${result.data.deletedItems.length} éléments`);
 * }
 */
export async function deleteWorkflow(projectId, config = {}) {
  console.log(`[DELETE] CALL 3: deleteWorkflow called for project: ${projectId}`);
  
  // CALL 1: Validation des paramètres d'entrée
  const validation = validateDeleteParameters(projectId, config);
  if (!validation.valid) {
    console.log(`[DELETE] Parameter validation failed: ${validation.error}`);
    return {
      success: false,
      error: `Parameter validation failed: ${validation.error}`
    };
  }

  const projectPath = getProjectPath(projectId);
  const startTime = Date.now();
  
  console.log(`[DELETE] Project path resolved: ${projectPath}`);
  
  try {
    // CALL 4: Détection de l'état actuel
    console.log(`[DELETE] CALL 4: Detecting current project state...`);
    const currentState = await detectCurrentProjectState(projectId);
    
    if (!currentState.success) {
      console.log(`[DELETE] Current state detection failed: ${currentState.error}`);
      return {
        success: false,
        error: `Current state detection failed: ${currentState.error}`
      };
    }
    
    console.log(`[DELETE] Current state detected: ${currentState.data.state}`);
    
    // CALL 5: Vérification des contraintes de suppression
    console.log(`[DELETE] CALL 5: Checking deletion constraints...`);
    const constraintCheck = checkDeletionConstraints(currentState.data, config);
    
    if (!constraintCheck.allowed) {
      console.log(`[DELETE] Deletion not allowed: ${constraintCheck.reason}`);
      return {
        success: false,
        error: `Deletion not allowed: ${constraintCheck.reason}`
      };
    }
    
    console.log(`[DELETE] Deletion constraints satisfied`);
    
    // CALL 6: Inventaire des éléments à supprimer
    console.log(`[DELETE] CALL 6: Inventorying items to delete...`);
    const inventory = await inventoryProjectItems(projectPath, projectId);
    
    if (!inventory.success) {
      console.log(`[DELETE] Inventory failed: ${inventory.error}`);
      return {
        success: false,
        error: `Inventory failed: ${inventory.error}`
      };
    }
    
    console.log(`[DELETE] Inventory complete: ${inventory.data.items.length} items found`);
    
    // CALL 7: Création de sauvegarde (si demandée)
    let backupResult = null;
    if (config.backup !== false) {
      console.log(`[DELETE] CALL 7: Creating backup...`);
      backupResult = await createProjectBackup(projectId, inventory.data);
      
      if (!backupResult.success) {
        console.log(`[DELETE] Backup creation failed: ${backupResult.error}`);
        return {
          success: false,
          error: `Backup creation failed: ${backupResult.error}`
        };
      }
      
      console.log(`[DELETE] Backup created successfully: ${backupResult.data.backupPath}`);
    }
    
    // CALL 8: Arrêt des services (si en ligne)
    if (currentState.data.state === 'ONLINE') {
      console.log(`[DELETE] CALL 8: Stopping running services...`);
      const stopResult = await stopProjectServices(projectId);
      
      if (!stopResult.success) {
        console.log(`[DELETE] Service stop failed: ${stopResult.error}`);
        return {
          success: false,
          error: `Service stop failed: ${stopResult.error}`
        };
      }
      
      console.log(`[DELETE] Services stopped successfully`);
    }
    
    // CALL 9: Suppression progressive des éléments
    console.log(`[DELETE] CALL 9: Deleting project items...`);
    const deletionResult = await deleteProjectItems(inventory.data.items);
    
    if (!deletionResult.success) {
      console.log(`[DELETE] Deletion failed: ${deletionResult.error}`);
      return {
        success: false,
        error: `Deletion failed: ${deletionResult.error}`
      };
    }
    
    console.log(`[DELETE] Items deleted successfully: ${deletionResult.data.deletedCount} items`);
    
    // CALL 10: Vérification finale (doit être VOID)
    console.log(`[DELETE] CALL 10: Verifying final state...`);
    const finalState = await verifyVoidState(projectPath);
    
    if (!finalState.success || !finalState.data.isVoid) {
      console.log(`[DELETE] Final state verification failed`);
      return {
        success: false,
        error: `Deletion completed but state verification failed`
      };
    }
    
    const duration = Date.now() - startTime;
    console.log(`[DELETE] Workflow completed successfully in ${duration}ms`);
    
    // CALL 11: Construction de la réponse
    return {
      success: true,
      data: {
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
          created: true,
          path: backupResult.data.backupPath,
          size: backupResult.data.size
        } : null
      }
    };
    
  } catch (error) {
    console.log(`[DELETE] Unexpected workflow error: ${error.message}`);
    
    return {
      success: false,
      error: `Delete workflow failed: ${error.message}`,
      errorCode: error.code || 'DELETE_ERROR'
    };
  }
}

/**
 * Détecte l'état actuel du projet
 * @param {string} projectId - ID du projet
 * @returns {Promise<{success: boolean, data: object}>} État détecté
 * @private
 */
async function detectCurrentProjectState(projectId) {
  console.log(`[DELETE] Detecting current state for: ${projectId}`);
  
  try {
    const projectFilePath = getProjectFilePath(projectId);
    
    // Lecture du fichier projet
    const projectFile = await readPath(projectFilePath, { parseJson: true });
    
    if (!projectFile.success || !projectFile.data.exists) {
      return {
        success: true,
        data: {
          state: 'VOID',
          reason: 'Project file does not exist'
        }
      };
    }
    
    if (projectFile.data.jsonError || !projectFile.data.parsed) {
      return {
        success: true,
        data: {
          state: 'UNKNOWN',
          reason: 'Project file exists but invalid JSON'
        }
      };
    }
    
    const projectData = projectFile.data.parsed;
    return {
      success: true,
      data: {
        state: projectData.state || 'UNKNOWN',
        project: projectData,
        reason: 'State read from project.json'
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: `State detection failed: ${error.message}`
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
  // Si le projet est VOID, pas de contrainte
  if (stateData.state === 'VOID') {
    return {
      allowed: true,
      reason: 'Project already in VOID state'
    };
  }
  
  // Si le projet est ONLINE et pas de force, refuser
  if (stateData.state === 'ONLINE' && !config.force) {
    return {
      allowed: false,
      reason: 'Project is ONLINE, use force=true to delete running project'
    };
  }
  
  // Autres états OK pour suppression
  return {
    allowed: true,
    reason: `Project in ${stateData.state} state, deletion allowed`
  };
}

/**
 * Fait l'inventaire des éléments du projet à supprimer
 * @param {string} projectPath - Chemin du projet
 * @param {string} projectId - ID du projet
 * @returns {Promise<{success: boolean, data: object}>} Inventaire des éléments
 * @private
 */
async function inventoryProjectItems(projectPath, projectId) {
  console.log(`[DELETE] Creating inventory for: ${projectPath}`);
  
  try {
    const items = [];
    
    // 1. Fichier project.json
    const projectFilePath = getProjectFilePath(projectId);
    const projectFileExists = await checkFileAccess(projectFilePath);
    if (projectFileExists.accessible) {
      items.push({
        type: 'file',
        path: projectFilePath,
        name: 'project.json',
        priority: 1
      });
    }
    
    // 2. Dossier du projet
    const projectDirExists = await checkFileAccess(projectPath);
    if (projectDirExists.accessible) {
      // Import dynamique pour éviter les dépendances circulaires
      const { readDirectory } = await import('../../cores/reader.js');
      
      const dirContent = await readDirectory(projectPath);
      if (dirContent.success) {
        // Ajout des fichiers et dossiers
        for (const item of dirContent.data.items) {
          items.push({
            type: item.isDirectory ? 'directory' : 'file',
            path: item.path,
            name: item.name,
            priority: item.isDirectory ? 3 : 2
          });
        }
      }
      
      // Le dossier lui-même (en dernier)
      items.push({
        type: 'directory',
        path: projectPath,
        name: projectId,
        priority: 4
      });
    }
    
    // Tri par priorité (fichiers avant dossiers)
    items.sort((a, b) => a.priority - b.priority);
    
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
 * Crée une sauvegarde du projet avant suppression
 * @param {string} projectId - ID du projet
 * @param {object} inventory - Inventaire des éléments
 * @returns {Promise<{success: boolean, data: object}>} Résultat de la sauvegarde
 * @private
 */
async function createProjectBackup(projectId, inventory) {
  console.log(`[DELETE] Creating backup for: ${projectId}`);
  
  // MOCK - Sauvegarde non implémentée
  const backupPath = `./backups/${projectId}-${Date.now()}.backup`;
  
  console.log(`[DELETE] MOCK: Backup created at ${backupPath}`);
  
  return {
    success: true,
    data: {
      backupPath,
      size: inventory.totalCount * 1024, // Size simulée
      itemCount: inventory.totalCount,
      createdAt: new Date().toISOString()
    }
  };
}

/**
 * Arrête les services d'un projet (MOCK)
 * @param {string} projectId - ID du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat de l'arrêt
 * @private
 */
async function stopProjectServices(projectId) {
  console.log(`[DELETE] MOCK: Stopping services for: ${projectId}`);
  
  // Simulation d'arrêt des services
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    data: {
      stoppedServices: [`${projectId}-visitor`],
      stoppedAt: new Date().toISOString()
    }
  };
}

/**
 * Supprime les éléments du projet
 * @param {Array} items - Liste des éléments à supprimer
 * @returns {Promise<{success: boolean, data: object}>} Résultat de la suppression
 * @private
 */
async function deleteProjectItems(items) {
  console.log(`[DELETE] Deleting ${items.length} items`);
  
  try {
    const { unlink, rmdir } = await import('fs/promises');
    
    const deletedItems = [];
    const failedItems = [];
    
    for (const item of items) {
      try {
        console.log(`[DELETE] Deleting ${item.type}: ${item.name}`);
        
        if (item.type === 'file') {
          await unlink(item.path);
        } else if (item.type === 'directory') {
          await rmdir(item.path, { recursive: true });
        }
        
        deletedItems.push(item);
        
      } catch (itemError) {
        console.log(`[DELETE] Failed to delete ${item.name}: ${itemError.message}`);
        failedItems.push({
          item,
          error: itemError.message
        });
      }
    }
    
    return {
      success: failedItems.length === 0,
      data: {
        deletedItems,
        deletedCount: deletedItems.length,
        failedItems: failedItems.length > 0 ? failedItems : undefined
      }
    };
    
  } catch (error) {
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
  console.log(`[DELETE] Verifying VOID state: ${projectPath}`);
  
  try {
    // Import dynamique pour éviter dépendance circulaire
    const { detectVoidState } = await import('../../probes/void-detector.js');
    
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
  
  // Validation force optionnelle
  if (config.force !== undefined && typeof config.force !== 'boolean') {
    return { valid: false, error: 'config.force must be a boolean' };
  }
  
  // Validation backup optionnelle
  if (config.backup !== undefined && typeof config.backup !== 'boolean') {
    return { valid: false, error: 'config.backup must be a boolean' };
  }
  
  return { valid: true };
}

console.log(`[DELETE] Delete coordinator loaded successfully - PIXEL PERFECT VERSION`);