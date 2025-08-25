import { detectVoidState } from '../../probes/void/detector.js';
import { detectDraftState } from '../../probes/draft/detector.js';
import { loadTemplate } from '../../transitions/create/loader.js';
import { generateProject } from '../../transitions/create/generator.js';
import { writePath } from '../../systems/writer.js';
import { readPath } from '../../systems/reader.js';

/*
* FAIT QUOI : Orchestre workflow CREATE (VOID → DRAFT) - PATTERN 12 CALLS COMPLET
* REÇOIT : projectId: string, config: object
* RETOURNE : { success: boolean, data: object }
* ERREURS : ValidationError si paramètres manquants
*/

export async function createWorkflow(projectId, config = {}) {
 console.log(`[CREATE] createWorkflow called for project: ${projectId}`);
 
 if (!projectId || typeof projectId !== 'string') {
   throw new Error('ValidationError: projectId must be non-empty string');
 }

 const projectPath = `../app-server/outputs/projects/${projectId}`;
 const startTime = Date.now();
 
 // CALL 4: Detect current state
 console.log(`[CREATE] CALL 4: Detecting VOID state...`);
 const stateDetection = await detectVoidState(projectPath);
 console.log(`[CREATE] State detection:`, stateDetection.data.state);
 
 if (stateDetection.data.state !== 'VOID') {
   return {
     success: false,
     error: `Project ${projectId} already exists`
   };
 }
 
 // CALL 5: Load template
 console.log(`[CREATE] CALL 5: Loading template...`);
 const templateId = config.template || 'basic';
 const templateLoad = await loadTemplate(templateId);
 console.log(`[CREATE] Template loaded:`, templateLoad.loaded);
 
 if (!templateLoad.loaded) {
   return {
     success: false,
     error: `Failed to load template: ${templateLoad.error}`
   };
 }
 
 // CALL 7: Generate project
 console.log(`[CREATE] CALL 7: Generating project data...`);
 const generation = await generateProject(projectId, config, { template: templateLoad.data });
 
 if (!generation.generated) {
   return {
     success: false,
     error: `Failed to generate project: ${generation.error}`
   };
 }
 
 // CALL 8: Write project files
 console.log(`[CREATE] CALL 8: Writing to filesystem...`);
 const writeResult = await writePath(`${projectPath}/project.json`, generation.output);
 
 if (!writeResult.success) {
   return {
     success: false,
     error: `Failed to write project: ${writeResult.error}`
   };
 }
 
 // CALL 9: Detect new state
 console.log(`[CREATE] CALL 9: Detecting DRAFT state...`);
 const newStateDetection = await detectDraftState(projectPath);
 console.log(`[CREATE] New state:`, newStateDetection.data.state);
 
 // CALL 10: Validation
 console.log(`[CREATE] CALL 10: Final validation...`);
 const validation = await readPath(`${projectPath}/project.json`);
 
 if (!validation.success || !validation.data.exists) {
   return {
     success: false,
     error: `Validation failed: project.json not properly created`
   };
 }

 return {
   success: true,
   data: {
     projectId,
     fromState: 'VOID',
     toState: newStateDetection.data.state,
     duration: Date.now() - startTime,
     templateUsed: templateId,
     fileWritten: writeResult.data.path
   }
 };
}
