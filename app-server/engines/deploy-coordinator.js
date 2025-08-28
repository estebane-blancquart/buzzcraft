/**
 * Coordinateur DEPLOY - Workflow BUILT → OFFLINE - VERSION MOCK
 * @module deploy-coordinator
 * @description MOCK - Déploiement non implémenté, retourne succès simulé
 */

/**
 * MOCK - Orchestre le workflow DEPLOY (BUILT → OFFLINE)
 * @param {string} projectId - ID du projet à déployer
 * @param {object} [config={}] - Configuration de déploiement
 * @returns {Promise<{success: boolean, data: object}>} Résultat simulé
 */
export async function deployWorkflow(projectId, config = {}) {
  console.log(`[DEPLOY] MOCK: deployWorkflow called for project: ${projectId}`);
  
  // Validation basique
  if (!projectId || typeof projectId !== 'string') {
    return {
      success: false,
      error: 'projectId must be non-empty string'
    };
  }
  
  // Simulation d'un délai de déploiement
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`[DEPLOY] MOCK: Deployment simulated successfully for ${projectId}`);
  
  return {
    success: true,
    data: {
      project: {
        id: projectId,
        state: 'OFFLINE'
      },
      workflow: {
        action: 'DEPLOY',
        projectId,
        initialState: 'BUILT',
        finalState: 'OFFLINE',
        mock: true,
        completedAt: new Date().toISOString()
      },
      containers: [
        {
          id: `${projectId}-visitor`,
          service: 'app-visitor',
          status: 'created',
          port: 3000
        }
      ]
    }
  };
}

console.log(`[DEPLOY] Deploy coordinator loaded successfully - MOCK VERSION`);