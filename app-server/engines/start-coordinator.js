/**
 * Coordinateur START - Workflow OFFLINE → ONLINE - VERSION MOCK
 * @module start-coordinator
 * @description MOCK - Démarrage non implémenté, retourne succès simulé
 */

/**
 * MOCK - Orchestre le workflow START (OFFLINE → ONLINE)
 * @param {string} projectId - ID du projet à démarrer
 * @param {object} [config={}] - Configuration de démarrage
 * @returns {Promise<{success: boolean, data: object}>} Résultat simulé
 */
export async function startWorkflow(projectId, config = {}) {
  console.log(`[START] MOCK: startWorkflow called for project: ${projectId}`);
  
  // Validation basique
  if (!projectId || typeof projectId !== 'string') {
    return {
      success: false,
      error: 'projectId must be non-empty string'
    };
  }
  
  // Simulation d'un délai de démarrage
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log(`[START] MOCK: Start simulated successfully for ${projectId}`);
  
  return {
    success: true,
    data: {
      project: {
        id: projectId,
        state: 'ONLINE'
      },
      workflow: {
        action: 'START',
        projectId,
        initialState: 'OFFLINE',
        finalState: 'ONLINE',
        mock: true,
        completedAt: new Date().toISOString()
      },
      services: [
        {
          name: `${projectId}-visitor`,
          status: 'running',
          port: 3000,
          url: `http://localhost:3000`
        }
      ]
    }
  };
}

console.log(`[START] Start coordinator loaded successfully - MOCK VERSION`);