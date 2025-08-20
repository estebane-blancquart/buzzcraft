import { detectDraftState } from '../../probes/draft/detector.js';
import { detectBuiltState } from '../../probes/built/detector.js';
import { loadCodeTemplates } from '../../transitions/build/loader.js';
import { generateServices } from '../../transitions/build/generator.js';
import { readPath } from '../../systems/reader.js';
import { writePath } from '../../systems/writer.js';
import { validateProjectSchema } from '../../systems/schema-validator.js';
import { rm } from 'fs/promises';

/*
 * FAIT QUOI : Orchestre workflow BUILD (DRAFT → BUILT) - VERSION PERFECTIONNISTE
 * REÇOIT : projectId: string, config: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres manquants, rollback automatique si échec partiel
 */

export async function buildWorkflow(projectId, config = {}) {
  console.log(`[BUILD] buildWorkflow called for project: ${projectId}`);
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }

  const projectPath = `../app-server/outputs/projects/${projectId}`;
  const startTime = Date.now();
  
  console.log(`[BUILD] Checking if project is DRAFT...`);
  const stateDetection = await detectDraftState(projectPath);
  console.log(`[BUILD] State detection:`, stateDetection.data.state);
  
  if (!stateDetection.success) {
    return {
      success: false,
      error: `Failed to detect project state: ${stateDetection.error}`
    };
  }
  
  if (stateDetection.data.state !== 'DRAFT') {
    return {
      success: false,
      error: `Project ${projectId} must be in DRAFT state for build (current: ${stateDetection.data.state || 'unknown'})`
    };
  }
  
  console.log(`[BUILD] Loading project data...`);
  const projectFile = await readPath(`${projectPath}/project.json`);
  
  if (!projectFile.success) {
    return {
      success: false,
      error: `Failed to read project file: ${projectFile.error}`
    };
  }
  
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
  // console.log(`[BUILD] Services generated:`, generation.generated);
  
  // ROLLBACK SYSTEM - tracker fichiers écrits pour nettoyage si erreur
  const writtenFiles = [];
  
  try {
    console.log(`[BUILD] Writing services to filesystem...`);
    for (const [servicePath, serviceContent] of Object.entries(generation.output.services)) {
      const fullPath = `${projectPath}/${servicePath}`;
      console.log(`[BUILD] Writing: ${fullPath}`);
      
      const writeResult = await writePath(fullPath, serviceContent);
      
      if (!writeResult.success) {
        throw new Error(`Failed to write ${servicePath}: ${writeResult.error}`);
      }
      
      writtenFiles.push(fullPath);
    }
    
    console.log(`[BUILD] Updating project state to BUILT...`);
    
    // STATE SYNC PARFAIT - cohérence totale avec doc
    projectData.state = 'BUILT';
    projectData.lastBuild = new Date().toISOString();
    projectData.buildDuration = Date.now() - startTime;
    projectData.servicesGenerated = generation.artifacts.length;
    projectData.buildVersion = projectData.buildVersion ? projectData.buildVersion + 1 : 1;
    projectData.buildMetadata = {
      templatesUsed: Object.keys(generation.output.services).length,
      componentsFound: generation.metadata?.componentsFound || 0,
      containersFound: generation.metadata?.containersFound || 0,
      usedComponentTypes: generation.metadata?.usedComponentTypes || []
    };
    
    const updateResult = await writePath(`${projectPath}/project.json`, projectData);
    if (!updateResult.success) {
      throw new Error(`Failed to update project state: ${updateResult.error}`);
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
        duration: Date.now() - startTime,
        buildVersion: projectData.buildVersion,
        filesWritten: writtenFiles.length
      }
    };
    
  } catch (error) {
    console.error(`[BUILD] Error during build: ${error.message}`);
    console.log(`[BUILD] Initiating rollback for ${writtenFiles.length} files...`);
    
    // ROLLBACK AUTOMATIQUE - garantit cohérence état
    await cleanupPartialBuild(writtenFiles);
    
    return {
      success: false,
      error: `Build failed: ${error.message}. Rollback completed.`
    };
  }
}

/*
 * FAIT QUOI : Nettoie fichiers partiellement écrits en cas d'erreur build
 * REÇOIT : writtenFiles: string[]
 * RETOURNE : void (log seulement, ne throw jamais)
 * ERREURS : Logged, jamais propagées (rollback doit toujours réussir)
 */

async function cleanupPartialBuild(writtenFiles) {
  console.log(`[ROLLBACK] Cleaning ${writtenFiles.length} partially written files...`);
  
  for (const filePath of writtenFiles) {
    try {
      await rm(filePath, { recursive: true, force: true });
      console.log(`[ROLLBACK] ✅ Cleaned: ${filePath}`);
    } catch (error) {
      console.log(`[ROLLBACK] ⚠️  Failed to clean ${filePath}: ${error.message}`);
      // Continue anyway - rollback best effort
    }
  }
  
  console.log(`[ROLLBACK] Rollback completed`);
}