import { detectVoidState } from '../../probes/void/detector.js';
import { loadTemplate } from '../../transitions/create/loader.js';
import { generateProject } from '../../transitions/create/generator.js';
import { writePath } from '../../systems/writer.js';

/**
 * Orchestrates CREATE workflow (VOID → DRAFT) - CLEAN VERSION
 * @param {string} projectId - The project identifier
 * @param {object} config - Configuration object
 * @returns {{ success: boolean, data: object }} Response object with success status and data
 * @throws {ValidationError} When required parameters are missing
 */

export async function createWorkflow(projectId, config = {}) {
  console.log(`[CLEAN] createWorkflow called for project: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }

  // TEST DETECTOR + LOADER + WRITER
  const projectPath = `../app-server/outputs/projects/${projectId}`;
  
  console.log(`[CLEAN] Checking if project exists...`);
  const stateDetection = await detectVoidState(projectPath);
  console.log(`[CLEAN] State detection:`, stateDetection.data.state);
  
  if (stateDetection.data.state !== 'VOID') {
    return {
      success: false,
      error: `Project ${projectId} already exists`
    };
  }
  
  console.log(`[CLEAN] Loading template...`);
  const templateId = config.template || 'basic';
  const templateLoad = await loadTemplate(templateId);
  console.log(`[CLEAN] Template loaded:`, templateLoad.loaded, templateLoad.data?.content?.name);
  
  console.log(`[CLEAN] Generating project data...`);
  const generation = await generateProject(projectId, config, { template: templateLoad.data });
  // console.log(`[CLEAN] Generation result:`, generation.generated);
  
  console.log(`[CLEAN] About to write to: ${projectPath}/project.json`);
  const writeResult = await writePath(`${projectPath}/project.json`, generation.output);
  console.log(`[CLEAN] Write result:`, writeResult.success);
  
  return {
    success: writeResult.success,
    data: {
      projectId,
      fromState: 'VOID',
      toState: 'DRAFT',
      duration: 5,
      fileWritten: writeResult.success
    }
  };
}