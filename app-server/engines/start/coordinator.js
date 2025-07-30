/*
 * FAIT QUOI : Orchestration workflow START - transition OFFLINE → ONLINE
 * REÇOIT : projectId (string), config (object)
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : WorkflowError, StateError, TransitionError
 */

import { detectOfflineState } from '../../states/offline/detector.js';
import { detectOnlineState } from '../../states/online/detector.js';
import { manageContainers } from '../../systems/docker/containers.js';

export async function startWorkflow(projectId, config = {}) {
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }
  
  const startTime = Date.now();
  const projectPath = `./app-server/outputs/projects/${projectId}`;
  
  try {
    const currentState = await detectOfflineState(projectPath);
    if (currentState.data.state !== 'OFFLINE') {
      throw new Error('StateError: Project must be in OFFLINE state to start');
    }
    
    const containerResult = await manageContainers(projectPath, 'start', config);
    if (!containerResult.success) {
      throw new Error(`TransitionError: Container start failed - ${containerResult.error}`);
    }
    
    const newState = await detectOnlineState(projectPath);
    
    return {
      success: true,
      data: {
        projectId,
        fromState: 'OFFLINE',
        toState: newState.data.state,
        duration: Date.now() - startTime
      }
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}