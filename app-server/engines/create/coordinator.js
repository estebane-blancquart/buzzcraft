import { detectVoidState } from '../../states/void/detector.js';
import { detectDraftState } from '../../states/draft/detector.js';
import { writePath } from '../../systems/writer.js';

/*
 * FAIT QUOI : Orchestre workflow CREATE (VOID → DRAFT)
 * REÇOIT : projectId: string, config: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres manquants
 */

export async function createWorkflow(projectId, config = {}) {
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }
  
  const startTime = Date.now();
  const projectPath = `./outputs/projects/${projectId}`;
  
  // CALL 4: Detect current state
  const currentState = await detectVoidState(projectPath);
  if (!currentState.success || currentState.data.state !== 'VOID') {
    return {
      success: false,
      error: 'Project must be in VOID state for creation'
    };
  }
  
  // CALL 7: Generate project data
  const projectData = {
    id: projectId,
    name: config.name || projectId,
    version: '1.0.0',
    created: new Date().toISOString(),
    template: config.template || 'basic'
  };
  
  // CALL 8: Write project file
  const writeResult = await writePath(`${projectPath}/project.json`, projectData);
  if (!writeResult.success) {
    return {
      success: false,
      error: writeResult.error
    };
  }
  
  // CALL 9: Detect new state
  const newState = await detectDraftState(projectPath);
  
  return {
    success: true,
    data: {
      projectId,
      fromState: 'VOID',
      toState: newState.data.state,
      duration: Date.now() - startTime
    }
  };
}