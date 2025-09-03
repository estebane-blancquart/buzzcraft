/**
 * Coordinateur STOP - MOCK HONNÊTE - En attente d'implémentation
 */
export async function stopWorkflow(projectId, config = {}) {
  console.log(`[STOP] ${projectId}: Mock coordinator called for project: ${projectId}`);
  
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
    message: 'Stop workflow is mocked - implementation planned for v2.0', 
    details: {
      projectId,
      plannedFeatures: [
        'Graceful container shutdown',
        'Connection draining',
        'State persistence', 
        'Resource cleanup'
      ],
      availableActions: ['CREATE', 'BUILD', 'DELETE', 'REVERT'],
      implementationStatus: 'PLANNED',
      version: 'v2.0'
    }
  };
}

