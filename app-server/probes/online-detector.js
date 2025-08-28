/**
 * Détecteur d'état ONLINE - VERSION MOCK
 * @module online-detector
 * @description MOCK - Détection ONLINE non implémentée, retourne simulation
 */

/**
 * MOCK - Détecte si un projet est dans l'état ONLINE
 * @param {string} projectPath - Chemin vers le dossier du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat simulé
 */
export async function detectOnlineState(projectPath) {
  console.log(`[ONLINE-DETECTOR] MOCK: Detecting ONLINE state for: ${projectPath}`);
  
  // Validation basique
  if (!projectPath || typeof projectPath !== 'string') {
    return {
      success: false,
      error: 'projectPath must be non-empty string'
    };
  }
  
  // Simulation d'un délai de détection
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Simulation : assume ONLINE si le chemin contient certains patterns
  const isOnline = Math.random() > 0.7; // 30% de chance d'être online
  
  console.log(`[ONLINE-DETECTOR] MOCK: Detection result: ${isOnline ? 'ONLINE' : 'NOT_ONLINE'}`);
  
  return {
    success: true,
    data: {
      isOnline,
      confidence: 90,
      evidence: [
        'Project file exists',
        'Build artifacts found',
        'Containers created',
        ...(isOnline ? [
          'Containers running',
          'HTTP endpoints responding',
          'Health checks passing'
        ] : [])
      ],
      conflicts: isOnline ? [] : [
        'Containers not responding',
        'No active network connections'
      ],
      services: isOnline ? [
        {
          name: 'app-visitor',
          status: 'running',
          port: 3000,
          url: 'http://localhost:3000',
          healthCheck: 'passing'
        }
      ] : [],
      mock: true,
      detectedAt: new Date().toISOString()
    }
  };
}

/**
 * MOCK - Détecte l'état ONLINE par ID de projet
 * @param {string} projectId - ID du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat simulé
 */
export async function detectOnlineStateById(projectId) {
  console.log(`[ONLINE-DETECTOR] MOCK: Detecting ONLINE state by ID: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    return {
      success: false,
      error: 'projectId must be non-empty string'
    };
  }
  
  // Simulation du chemin
  const projectPath = `./app-server/data/outputs/${projectId}`;
  return await detectOnlineState(projectPath);
}

/**
 * MOCK - Vérification rapide ONLINE
 * @param {string} projectPath - Chemin vers le projet
 * @returns {Promise<{success: boolean, data: {isOnline: boolean}}>} Résultat simplifié
 */
export async function quickOnlineCheck(projectPath) {
  console.log(`[ONLINE-DETECTOR] MOCK: Quick ONLINE check for: ${projectPath}`);
  
  const isOnline = Math.random() > 0.8; // 20% de chance d'être online
  
  return {
    success: true,
    data: {
      isOnline,
      reason: isOnline ? 
        'Services running and responding' : 
        'No running services detected',
      mock: true
    }
  };
}

console.log(`[ONLINE-DETECTOR] ONLINE detector loaded successfully - MOCK VERSION`);