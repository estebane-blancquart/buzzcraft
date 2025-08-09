/*
 * FAIT QUOI : Orchestration workflow STOP - transition ONLINE → OFFLINE
 * REÇOIT : projectId (string), config (object)
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : WorkflowError, StateError, TransitionError
 */

import { detectOnlineState } from '../../probes/online/detector.js';
import { detectOfflineState } from '../../probes/offline/detector.js';
import { manageContainers } from '../../systems/docker/containers.js';

export async function stopWorkflow(projectId, config = {}) {
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }
  
  const startTime = Date.now();
  const projectPath = `./app-server/outputs/projects/${projectId}`;
  
  try {
    const currentState = await detectOnlineState(projectPath);
    if (currentState.data.state !== 'ONLINE') {
      throw new Error('StateError: Project must be in ONLINE state to stop');
    }
    
    const containerResult = await manageContainers(projectPath, 'stop', config);
    if (!containerResult.success) {
      throw new Error(`TransitionError: Container stop failed - ${containerResult.error}`);
    }
    
    const newState = await detectOfflineState(projectPath);
    
    return {
      success: true,
      data: {
        projectId,
        fromState: 'ONLINE',
        toState: newState.data.state,
        duration: Date.now() - startTime
      }
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}