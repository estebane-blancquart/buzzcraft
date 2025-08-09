import { detectDraftState } from '../../probes/draft/detector.js';
import { detectBuiltState } from '../../probes/built/detector.js';
import { readPath } from '../../systems/reader.js';
import { writePath } from '../../systems/writer.js';
import { generateServices } from '../../transitions/build/generator.js';

/*
 * FAIT QUOI : Orchestre workflow BUILD (DRAFT → BUILT)
 * REÇOIT : projectId: string, config: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres manquants
 */

export async function buildWorkflow(projectId, config = {}) {
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }
  
  const startTime = Date.now();
  const projectPath = `./app-server/outputs/projects/${projectId}`;
  
  // Detect current state
  const currentState = await detectDraftState(projectPath);
  if (!currentState.success || currentState.data.state !== 'DRAFT') {
    return {
      success: false,
      error: 'Project must be in DRAFT state for build'
    };
  }
  
  // Load project data
  const projectFile = await readPath(`${projectPath}/project.json`);
  if (!projectFile.success) {
    return {
      success: false,
      error: 'Could not read project.json'
    };
  }
  
  const projectData = JSON.parse(projectFile.data.content);
  
  // Generate services
  const generationResult = await generateServices(projectData, {});
  if (!generationResult.success) {
    return {
      success: false,
      error: generationResult.error
    };
  }
  
  // Write all services
  for (const [serviceName, files] of Object.entries(generationResult.data.services)) {
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = `${projectPath}/${serviceName}/${filePath}`;
      const writeResult = await writePath(fullPath, content);
      
      if (!writeResult.success) {
        return {
          success: false,
          error: `Failed to write ${fullPath}: ${writeResult.error}`
        };
      }
    }
  }
  
  // Detect new state
  const newState = await detectBuiltState(projectPath);
  
  return {
    success: true,
    data: {
      projectId,
      fromState: 'DRAFT',
      toState: newState.data.state,
      servicesGenerated: Object.keys(generationResult.data.services).length,
      duration: Date.now() - startTime
    }
  };
}