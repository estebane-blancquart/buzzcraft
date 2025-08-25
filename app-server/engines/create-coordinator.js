import { detectVoidState } from '../probes/void-detector.js';
import { detectDraftState } from '../probes/draft-detector.js';
import { loadTemplate } from '../cores/compiler.js';
import { generateProject } from '../cores/compiler.js';
import { writePath } from '../cores/writer.js';
import { readPath } from '../cores/reader.js';

/*
* FAIT QUOI : Orchestre workflow CREATE (VOID → DRAFT) - PATTERN 12 CALLS COMPLET
* REÇOIT : projectId: string, config: object
* RETOURNE : { success: boolean, data: object }
* ERREURS : ValidationError si paramètres manquants, refuse si projet existe
*/

export async function createWorkflow(projectId, config = {}) {
 console.log(`[CREATE] createWorkflow called for project: ${projectId}`);
 
 if (!projectId || typeof projectId !== 'string') {
   throw new Error('ValidationError: projectId must be non-empty string');
 }

 const projectPath = `../app-server/data/outputs/${projectId}`;
 const startTime = Date.now();
 
 // CALL 4: Detect current state
 console.log(`[CREATE] CALL 4: Detecting VOID state...`);
 const stateDetection = await detectVoidState(projectPath);
 
 if (!stateDetection.success) {
   console.log(`[CREATE] State detection failed: ${stateDetection.error}`);
   return {
     success: false,
     error: `State detection failed: ${stateDetection.error}`
   };
 }
 
 console.log(`[CREATE] State detection: ${stateDetection.data.state}`);
 
 // Vérifier que le projet n'existe pas déjà
 if (stateDetection.data.state !== 'VOID') {
   const actualState = stateDetection.data.actualState || 'UNKNOWN';
   const reason = stateDetection.data.reason || `Project ${projectId} already exists`;
   
   console.log(`[CREATE] Project creation refused: ${reason}`);
   return {
     success: false,
     error: `Cannot create project ${projectId}: ${reason}`,
     details: {
       currentState: actualState,
       projectId,
       action: 'CREATE_REFUSED'
     }
   };
 }
 
 // CALL 5: Load template
 console.log(`[CREATE] CALL 5: Loading template...`);
 const templateId = config.template || 'basic';
 const templateLoad = await loadTemplate(templateId);
 console.log(`[CREATE] Template loaded: ${templateLoad.loaded}`);
 
 if (!templateLoad.loaded) {
   console.log(`[CREATE] Template load failed, will use fallback: ${templateLoad.error}`);
 }
 
 // CALL 7: Generate project (avec ou sans template)
 console.log(`[CREATE] CALL 7: Generating project data...`);
 const generation = await generateProject(projectId, config, { 
   template: templateLoad.loaded ? templateLoad.data : null 
 });
 
 if (!generation.generated) {
   console.log(`[CREATE] Project generation failed: ${generation.error}`);
   return {
     success: false,
     error: `Failed to generate project: ${generation.error}`
   };
 }
 
 // CALL 8: Write project files
 console.log(`[CREATE] CALL 8: Writing to filesystem...`);
 const writeResult = await writePath(`${projectPath}/project.json`, generation.output);
 
 if (!writeResult.success) {
   console.log(`[CREATE] Write failed: ${writeResult.error}`);
   return {
     success: false,
     error: `Failed to write project: ${writeResult.error}`
   };
 }
 
 // CALL 9: Detect new state
 console.log(`[CREATE] CALL 9: Detecting DRAFT state...`);
 const newStateDetection = await detectDraftState(projectPath);
 console.log(`[CREATE] New state: ${newStateDetection.data?.state || 'UNKNOWN'}`);
 
 // CALL 10: Validation
 console.log(`[CREATE] CALL 10: Final validation...`);
 const validation = await readPath(`${projectPath}/project.json`);
 
 if (!validation.success || !validation.data.exists) {
   console.log(`[CREATE] Final validation failed`);
   return {
     success: false,
     error: `Validation failed: project.json not properly created`
   };
 }

 const finalState = newStateDetection.data?.state || 'DRAFT';
 const duration = Date.now() - startTime;
 
 console.log(`[CREATE] Project ${projectId} created successfully in ${duration}ms`);
 console.log(`[CREATE] State transition: VOID → ${finalState}`);
 
 return {
   success: true,
   data: {
     projectId,
     fromState: 'VOID',
     toState: finalState,
     duration,
     templateUsed: templateId,
     templateLoaded: templateLoad.loaded,
     fileWritten: writeResult.data.path,
     fallbackUsed: generation.metadata?.fallbackUsed || false
   }
 };
}