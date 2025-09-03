/**
 * Coordinateur DEPLOY - MOCK HONNÊTE - En attente d'implémentation
 */
export async function deployWorkflow(projectId, config = {}) {
  console.log(`[DEPLOY] Mock coordinator called for project: ${projectId}`);
  
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
    message: 'Deploy workflow is mocked - implementation planned for v2.0',
    details: {
      projectId,
      plannedFeatures: [
        'Docker container generation',
        'Nginx configuration', 
        'Health checks',
        'Rollback capability'
      ],
      availableActions: ['CREATE', 'BUILD', 'DELETE', 'REVERT'],
      implementationStatus: 'PLANNED',
      version: 'v2.0'
    }
  };
}