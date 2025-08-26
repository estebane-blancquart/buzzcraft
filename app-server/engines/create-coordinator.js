import { detectVoidState } from '../probes/void-detector.js';
import { detectDraftState } from '../probes/draft-detector.js';
import { readTemplate } from '../cores/templates.js';
import { buildProject, validateProject } from '../cores/projects.js';
import { getProjectPath, getProjectFilePath } from '../cores/paths.js';
import { writePath } from '../cores/writer.js';
import { readPath } from '../cores/reader.js';

/*
* FAIT QUOI : Orchestre workflow CREATE (VOID → DRAFT) - VERSION CORES PURS
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
   // CALL 5: Load template (utilise core pur)
   console.log(`[CREATE] CALL 5: Loading template...`);
   const templateId = config.template || 'basic';
   const templateContent = await readTemplate(templateId);
   
   if (templateContent) {
     console.log(`[CREATE] Template loaded successfully: ${templateId}`);
   } else {
     console.log(`[CREATE] Template not found, using fallback: ${templateId}`);
   }
   
   // CALL 6: (Implicite) Pas de resource reading nécessaire pour CREATE
   
   // CALL 7: Generate project (utilise core pur)
   console.log(`[CREATE] CALL 7: Building project data...`);
   const projectData = buildProject(projectId, config, templateContent);
   
   if (!projectData) {
     throw new Error(`Project building failed`);
   }
   
   console.log(`[CREATE] Project built successfully`);
   
   // CALL 8: Validate project
   console.log(`[CREATE] CALL 8: Validating project structure...`);
   if (!validateProject(projectData)) {
     throw new Error(`Project validation failed`);
   }
   
   // CALL 9: Write project files
   console.log(`[CREATE] CALL 9: Writing to filesystem...`);
   const projectFilePath = getProjectFilePath(projectId, 'project.json');
   const writeResult = await writePath(projectFilePath, projectData);
   
   if (!writeResult.success) {
     throw new Error(`Failed to write project: ${writeResult.error}`);
   }
   
   createdArtifacts.push(projectFilePath);
   console.log(`[CREATE] Project file written: ${projectFilePath}`);
   
   // CALL 10: Validation - Detect new state
   console.log(`[CREATE] CALL 10: Detecting DRAFT state...`);
   const newStateDetection = await detectDraftState(projectPath);
   const finalState = newStateDetection.data?.state || 'UNKNOWN';
   console.log(`[CREATE] New state detected: ${finalState}`);
   
   // CALL 11: Verification - Final validation
   console.log(`[CREATE] CALL 11: Final verification...`);
   const verification = await readPath(projectFilePath);
   
   if (!verification.success || !verification.data.exists) {
     throw new Error('Verification failed: project.json not properly created');
   }
   
   const duration = Date.now() - startTime;
   
   console.log(`[CREATE] CALL 12: Project ${projectId} created successfully in ${duration}ms`);
   console.log(`[CREATE] State transition: VOID → ${finalState}`);
   
   return {
     success: true,
     data: {
       projectId,
       fromState: 'VOID',
       toState: finalState,
       duration,
       templateUsed: templateId,
       templateLoaded: !!templateContent,
       fileWritten: projectFilePath,
       fallbackUsed: !templateContent,
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