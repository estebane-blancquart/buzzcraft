import { detectDraftState } from '../../probes/draft/detector.js';
import { detectBuiltState } from '../../probes/built/detector.js';
import { loadCodeTemplates } from '../../transitions/build/loader.js';
import { generateServices } from '../../transitions/build/generator.js';
import { readPath } from '../../systems/reader.js';
import { writePath } from '../../systems/writer.js';

/*
 * FAIT QUOI : Orchestre workflow BUILD (DRAFT → BUILT)
 * REÇOIT : projectId: string, config: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres manquants
 */

export async function buildWorkflow(projectId, config = {}) {
  console.log(`[BUILD] buildWorkflow called for project: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }

  const projectPath = `../app-server/outputs/projects/${projectId}`;
  
  console.log(`[BUILD] Checking if project is DRAFT...`);
  const stateDetection = await detectDraftState(projectPath);
  console.log(`[BUILD] State detection:`, stateDetection.data.state);
  
  if (stateDetection.data.state !== 'DRAFT') {
    return {
      success: false,
      error: `Project ${projectId} must be in DRAFT state for build (current: ${stateDetection.data.state || 'unknown'})`
    };
  }
  
  console.log(`[BUILD] Loading project data...`);
  const projectFile = await readPath(`${projectPath}/project.json`);
  const projectData = JSON.parse(projectFile.data.content);
  
  console.log(`[BUILD] Loading code templates...`);
  const templatesLoad = await loadCodeTemplates(projectId);
  console.log(`[BUILD] Templates loaded:`, templatesLoad.loaded);
  
  if (!templatesLoad.loaded) {
    return {
      success: false,
      error: `Failed to load templates: ${templatesLoad.error}`
    };
  }
  
  console.log(`[BUILD] Generating services...`);
  const generation = await generateServices(projectData, templatesLoad.data);
  console.log(`[BUILD] Services generated:`, generation.generated);
  
  console.log(`[BUILD] Writing services to filesystem...`);
  for (const [servicePath, serviceContent] of Object.entries(generation.output.services)) {
    const fullPath = `${projectPath}/${servicePath}`;
    console.log(`[BUILD] Writing: ${fullPath}`);
    const writeResult = await writePath(fullPath, serviceContent);
    
    if (!writeResult.success) {
      return {
        success: false,
        error: `Failed to write ${servicePath}: ${writeResult.error}`
      };
    }
  }
  
  console.log(`[BUILD] Updating project state to BUILT...`);
  // Mettre à jour l'état du projet
  projectData.state = 'BUILT';
  projectData.lastBuild = new Date().toISOString();
  
  const updateResult = await writePath(`${projectPath}/project.json`, projectData);
  if (!updateResult.success) {
    return {
      success: false,
      error: `Failed to update project state: ${updateResult.error}`
    };
  }
  
  console.log(`[BUILD] Verifying BUILT state...`);
  const newStateDetection = await detectBuiltState(projectPath);
  console.log(`[BUILD] New state:`, newStateDetection.data.state);
  
  return {
    success: true,
    data: {
      projectId,
      fromState: 'DRAFT',
      toState: newStateDetection.data.state,
      servicesGenerated: generation.artifacts.length,
      duration: 15
    }
  };
}