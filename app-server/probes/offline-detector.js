/**
 * Détecteur d'état OFFLINE - VERSION MOCK
 * @module offline-detector
 * @description MOCK - Détection OFFLINE non implémentée, retourne simulation
 */

/**
 * MOCK - Détecte si un projet est dans l'état OFFLINE
 * @param {string} projectPath - Chemin vers le dossier du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat simulé
 */
export async function detectOfflineState(projectPath) {
  console.log(`[OFFLINE-DETECTOR] MOCK: Detecting OFFLINE state for: ${projectPath}`);
  
  // Validation basique
  if (!projectPath || typeof projectPath !== 'string') {
    return {
      success: false,
      error: 'projectPath must be non-empty string'
    };
  }
  
  // Simulation d'un délai de détection
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Simulation : assume OFFLINE si le chemin contient certains patterns
  const isOffline = Math.random() > 0.5; // 50% de chance d'être offline
  
  console.log(`[OFFLINE-DETECTOR] MOCK: Detection result: ${isOffline ? 'OFFLINE' : 'NOT_OFFLINE'}`);
  
  return {
    success: true,
    data: {
      isOffline,
      confidence: 95,
      evidence: [
        'Project file exists',
        'Build artifacts found',
        'Containers created but stopped'
      ],
      conflicts: isOffline ? [] : ['Containers appear to be running'],
      mock: true,
      detectedAt: new Date().toISOString()
    }
  };
}

/**
 * MOCK - Détecte l'état OFFLINE par ID de projet
 * @param {string} projectId - ID du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat simulé
 */
export async function detectOfflineStateById(projectId) {
  console.log(`[OFFLINE-DETECTOR] MOCK: Detecting OFFLINE state by ID: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    return {
      success: false,
      error: 'projectId must be non-empty string'
    };
  }
  
  // Simulation du chemin
  const projectPath = `./app-server/data/outputs/${projectId}`;
  return await detectOfflineState(projectPath);
}

/**
 * MOCK - Vérification rapide OFFLINE
 * @param {string} projectPath - Chemin vers le projet
 * @returns {Promise<{success: boolean, data: {isOffline: boolean}}>} Résultat simplifié
 */
export async function quickOfflineCheck(projectPath) {
  console.log(`[OFFLINE-DETECTOR] MOCK: Quick OFFLINE check for: ${projectPath}`);
  
  const isOffline = Math.random() > 0.3; // 70% de chance d'être offline
  
  return {
    success: true,
    data: {
      isOffline,
      reason: isOffline ? 
        'Containers exist but not running' : 
        'No containers or different state detected',
      mock: true
    }
  };
}

console.log(`[OFFLINE-DETECTOR] OFFLINE detector loaded successfully - MOCK VERSION`);