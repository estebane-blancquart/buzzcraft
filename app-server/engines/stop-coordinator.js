/**
 * Coordinateur STOP - Workflow ONLINE → OFFLINE - VERSION MOCK
 * @module stop-coordinator
 * @description MOCK - Arrêt non implémenté, retourne succès simulé
 */

/**
 * MOCK - Orchestre le workflow STOP (ONLINE → OFFLINE)
 * @param {string} projectId - ID du projet à arrêter
 * @param {object} [config={}] - Configuration d'arrêt
 * @returns {Promise<{success: boolean, data: object}>} Résultat simulé
 */
export async function stopWorkflow(projectId, config = {}) {
  console.log(`[STOP] MOCK: stopWorkflow called for project: ${projectId}`);
  
  // Validation basique
  if (!projectId || typeof projectId !== 'string') {
    return {
      success: false,
      error: 'projectId must be non-empty string'
    };
  }
  
  // Simulation d'un délai d'arrêt
  await new Promise(resolve => setTimeout(resolve, 300));
  
  console.log(`[STOP] MOCK: Stop simulated successfully for ${projectId}`);
  
  return {
    success: true,
    data: {
      project: {
        id: projectId,
        state: 'OFFLINE'
      },
      workflow: {
        action: 'STOP',
        projectId,
        initialState: 'ONLINE',
        finalState: 'OFFLINE',
        mock: true,
        completedAt: new Date().toISOString()
      },
      services: [
        {
          name: `${projectId}-visitor`,
          status: 'stopped',
          previousPort: 3000
        }
      ]
    }
  };
}

console.log(`[STOP] Stop coordinator loaded successfully - MOCK VERSION`);