/**
 * Coordinateur START - MOCK HONNÊTE - En attente d'implémentation
 */
export async function startWorkflow(projectId, config = {}) {
  console.log(`[START] ${projectId}: Mock coordinator called for project: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'projectId must be non-empty string'
    };
  }
  
  return {
    success: false,
    error: 'NOT_IMPLEMENTED', 
    message: 'Start workflow is mocked - implementation planned for v2.0',
    details: {
      projectId,
      plannedFeatures: [
        'Docker container start',
        'Port mapping',
        'Health monitoring',
        'Load balancer registration'
      ],
      availableActions: ['CREATE', 'BUILD', 'DELETE', 'REVERT'],
      implementationStatus: 'PLANNED',
      version: 'v2.0'
    }
  };
}


