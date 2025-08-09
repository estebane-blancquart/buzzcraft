/*
 * FAIT QUOI : Orchestration workflow DEPLOY - transition BUILT → OFFLINE
 * REÇOIT : projectId (string), config (object)
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : WorkflowError, StateError, TransitionError
 */

import { detectBuiltState } from '../../probes/built/detector.js';
import { detectOfflineState } from '../../probes/offline/detector.js';
import { manageContainers } from '../../systems/docker/containers.js';

export async function deployWorkflow(projectId, config = {}) {
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }
  
  const startTime = Date.now();
  const projectPath = `./app-server/outputs/projects/${projectId}`;
  
  try {
    const currentState = await detectBuiltState(projectPath);
    if (currentState.data.state !== 'BUILT') {
      throw new Error('StateError: Project must be in BUILT state for deployment');
    }
    
    const containerResult = await manageContainers(projectPath, 'create', config);
    if (!containerResult.success) {
      throw new Error(`TransitionError: Container creation failed - ${containerResult.error}`);
    }
    
    const newState = await detectOfflineState(projectPath);
    
    return {
      success: true,
      data: {
        projectId,
        fromState: 'BUILT',
        toState: newState.data.state,
        duration: Date.now() - startTime
      }
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}