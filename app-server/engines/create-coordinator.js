import { detectVoidState } from '../probes/void-detector.js';
import { detectDraftState } from '../probes/draft-detector.js';
import { loadTemplate } from '../cores/compiler.js';
import { generateProject } from '../cores/compiler.js';
import { writePath } from '../cores/writer.js';
import { readPath } from '../cores/reader.js';
import { getProjectPath, getProjectFilePath } from '../cores/path-resolver.js';

/*
* FAIT QUOI : Orchestre workflow CREATE (VOID → DRAFT) - VERSION MIGRÉE
* REÇOIT : projectId: string, config: object
* RETOURNE : { success: boolean, data: object }
* ERREURS : ValidationError si paramètres manquants, refuse si projet existe, rollback automatique
*/

export async function createWorkflow(projectId, config = {}) {
 console.log(`[CREATE] CALL 3: createWorkflow called for project: ${projectId}`);
 
 // Validation des paramètres
 const validation = validateCreateParameters(projectId, config);
 if (!validation.valid) {
   throw new Error(validation.error);
 }

 const projectPath = getProjectPath(projectId);
 const startTime = Date.now();
 
 console.log(`[CREATE] Project path resolved: ${projectPath}`);
 
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
 
 console.log(`[CREATE] State detection result: ${stateDetection.data.state}`);
 
 // Fail-fast si le projet existe déjà
 if (stateDetection.data.state !== 'VOID') {
   const actualState = stateDetection.data.actualState || 'UNKNOWN';
   const reason = stateDetection.data.reason || `Project ${projectId} already exists`;
   
   console.log(`[CREATE] Project creation refused: ${reason}`);
   return {
     success: false,
     error: `Cannot create project ${projectId}: already exists in ${actualState} state`,
     details: {
       currentState: actualState,
       projectId,
       action: 'CREATE_REFUSED',
       reason
     }
   };
 }
 
 // Variables pour rollback system
 const createdArtifacts = [];
 
 try {
   // CALL 5: Load template
   console.log(`[CREATE] CALL 5: Loading template...`);
   const templateId = config.template || 'basic';
   const templateLoad = await loadTemplate(templateId);
   console.log(`[CREATE] Template loaded: ${templateLoad.loaded}`);
   
   if (!templateLoad.loaded) {
     console.log(`[CREATE] Template load failed, using fallback: ${templateLoad.error}`);
   }
   
   // CALL 6: (Implicite) Pas de resource reading nécessaire pour CREATE
   
   // CALL 7: Generate project
   console.log(`[CREATE] CALL 7: Generating project data...`);
   const generation = await generateProject(projectId, config, { 
     template: templateLoad.loaded ? templateLoad.data : null 
   });
   
   if (!generation.generated) {
     throw new Error(`Project generation failed: ${generation.error}`);
   }
   
   console.log(`[CREATE] Project generated successfully`);
   
   // CALL 8: Write project files
   console.log(`[CREATE] CALL 8: Writing to filesystem...`);
   const projectFilePath = getProjectFilePath(projectId, 'project.json');
   const writeResult = await writePath(projectFilePath, generation.output);
   
   if (!writeResult.success) {
     throw new Error(`Failed to write project: ${writeResult.error}`);
   }
   
   createdArtifacts.push(projectFilePath);
   console.log(`[CREATE] Project file written: ${projectFilePath}`);
   
   // CALL 9: Validation - Detect new state
   console.log(`[CREATE] CALL 9: Detecting DRAFT state...`);
   const newStateDetection = await detectDraftState(projectPath);
   const finalState = newStateDetection.data?.state || 'UNKNOWN';
   console.log(`[CREATE] New state detected: ${finalState}`);
   
   // CALL 10: Verification - Final validation
   console.log(`[CREATE] CALL 10: Final verification...`);
   const verification = await readPath(projectFilePath);
   
   if (!verification.success || !verification.data.exists) {
     throw new Error('Verification failed: project.json not properly created');
   }
   
   const duration = Date.now() - startTime;
   
   console.log(`[CREATE] CALL 11: Project ${projectId} created successfully in ${duration}ms`);
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
       fileWritten: projectFilePath,
       fallbackUsed: generation.metadata?.fallbackUsed || false,
       artifacts: createdArtifacts
     }
   };
   
 } catch (error) {
   console.error(`[CREATE] Error during workflow: ${error.message}`);
   console.log(`[CREATE] Initiating rollback for ${createdArtifacts.length} artifacts...`);
   
   // ROLLBACK AUTOMATIQUE
   await rollbackCreateArtifacts(createdArtifacts);
   
   return {
     success: false,
     error: `Create workflow failed: ${error.message}. Rollback completed.`
   };
 }
}

/*
 * FAIT QUOI : Validation des paramètres CREATE
 * REÇOIT : projectId: string, config: object
 * RETOURNE : { valid: boolean, error?: string }
 * ERREURS : Aucune (validation défensive)
 */
function validateCreateParameters(projectId, config) {
  // Validation projectId
  if (!projectId || typeof projectId !== 'string') {
    return { valid: false, error: 'ValidationError: projectId must be non-empty string' };
  }
  
  if (projectId.length < 3) {
    return { valid: false, error: 'ValidationError: projectId must be at least 3 characters long' };
  }
  
  if (!/^[a-z0-9-]+$/.test(projectId)) {
    return { valid: false, error: 'ValidationError: projectId must contain only lowercase letters, numbers and hyphens' };
  }
  
  // Validation config
  if (!config || typeof config !== 'object') {
    return { valid: false, error: 'ValidationError: config must be an object' };
  }
  
  return { valid: true };
}

/*
 * FAIT QUOI : Rollback des artifacts créés en cas d'échec
 * REÇOIT : artifacts: string[]
 * RETOURNE : void (log seulement, ne throw jamais)
 * ERREURS : Logged, jamais propagées (rollback doit toujours réussir)
 */
async function rollbackCreateArtifacts(artifacts) {
  console.log(`[ROLLBACK] Starting rollback for ${artifacts.length} artifacts`);
  
  const { rm } = await import('fs/promises');
  
  for (const artifactPath of artifacts) {
    try {
      await rm(artifactPath, { recursive: true, force: true });
      console.log(`[ROLLBACK] ✅ Cleaned artifact: ${artifactPath}`);
    } catch (error) {
      console.log(`[ROLLBACK] ⚠️  Failed to clean ${artifactPath}: ${error.message}`);
      // Continue anyway - rollback best effort
    }
  }
  
  console.log(`[ROLLBACK] Rollback completed`);
}