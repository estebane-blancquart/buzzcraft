import { detectDraftState } from '../probes/draft-detector.js';
import { detectBuiltState } from '../probes/built-detector.js';
import { loadCodeTemplates } from '../cores/compiler.js';
import { generateServices } from '../cores/compiler.js';
import { readPath } from '../cores/reader.js';
import { writePath } from '../cores/writer.js';
import { getProjectPath, getProjectFilePath } from '../cores/path-resolver.js';
import { rm } from 'fs/promises';

/*
 * FAIT QUOI : Orchestre workflow BUILD (DRAFT → BUILT) - VERSION MIGRÉE
 * REÇOIT : projectId: string, config: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres manquants, rollback automatique si échec partiel
 */

export async function buildWorkflow(projectId, config = {}) {
  console.log(`[BUILD] CALL 3: buildWorkflow called for project: ${projectId}`);
  
  // Validation des paramètres
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('ValidationError: projectId must be non-empty string');
  }

  const projectPath = getProjectPath(projectId);
  const startTime = Date.now();
  
  console.log(`[BUILD] Project path resolved: ${projectPath}`);
  
  // CALL 4: Detect current state
  console.log(`[BUILD] CALL 4: Checking if project is DRAFT...`);
  const stateDetection = await detectDraftState(projectPath);
  console.log(`[BUILD] State detection result: ${stateDetection.data?.state || 'UNKNOWN'}`);
  
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
  
  // CALL 5: Load project data
  console.log(`[BUILD] CALL 5: Loading project data...`);
  const projectFilePath = getProjectFilePath(projectId, 'project.json');
  const projectFile = await readPath(projectFilePath);
  
  if (!projectFile.success) {
    return {
      success: false,
      error: `Failed to read project file: ${projectFile.error}`
    };
  }
  
  let projectData;
  try {
    projectData = JSON.parse(projectFile.data.content);
    console.log(`[BUILD] Project data loaded successfully`);
  } catch (parseError) {
    return {
      success: false,
      error: `Failed to parse project.json: ${parseError.message}`
    };
  }
  
  // CALL 6: Load code templates
  console.log(`[BUILD] CALL 6: Loading code templates...`);
  const templatesLoad = await loadCodeTemplates(projectId, { 
    maxDepth: 10 // Protection récursion infinie
  });
  
  console.log(`[BUILD] Templates loaded: ${templatesLoad.loaded}`);
  console.log(`[BUILD] Templates count: ${templatesLoad.data?.templatesCount || 0}`);
  
  if (!templatesLoad.loaded) {
    return {
      success: false,
      error: `Failed to load templates: ${templatesLoad.error}`
    };
  }

  if (!templatesLoad.data.templates || Object.keys(templatesLoad.data.templates).length === 0) {
    console.log(`[BUILD] WARNING: No templates found - generation will be minimal`);
  }
  
  // CALL 7: Generate services
  console.log(`[BUILD] CALL 7: Generating services...`);
  let generation;
  try {
    generation = await generateServices(projectData, templatesLoad.data);
    console.log(`[BUILD] Services generated: ${generation.artifacts?.length || 0}`);
  } catch (generationError) {
    console.log(`[BUILD] Services generation failed: ${generationError.message}`);
    return {
      success: false,
      error: `Failed to generate services: ${generationError.message}`
    };
  }
  
  // Tracker fichiers écrits pour rollback
  const writtenFiles = [];
  
  try {
    // CALL 8: Write services to filesystem
    console.log(`[BUILD] CALL 8: Writing services to filesystem...`);
    
    if (!generation.output?.services || Object.keys(generation.output.services).length === 0) {
      console.log(`[BUILD] WARNING: No services to write - this may indicate a template loading problem`);
    }
    
    for (const [servicePath, serviceContent] of Object.entries(generation.output.services || {})) {
      const fullPath = getProjectFilePath(projectId, servicePath);
      console.log(`[BUILD] Writing service: ${fullPath}`);
      
      const writeResult = await writePath(fullPath, serviceContent);
      
      if (!writeResult.success) {
        throw new Error(`Failed to write ${servicePath}: ${writeResult.error}`);
      }
      
      writtenFiles.push(fullPath);
    }
    
    console.log(`[BUILD] Written ${writtenFiles.length} service files`);
    
    // CALL 9: Update project state to BUILT
    console.log(`[BUILD] CALL 9: Updating project state to BUILT...`);
    
    // Mise à jour des métadonnées projet
    projectData.state = 'BUILT';
    projectData.lastBuild = new Date().toISOString();
    projectData.buildDuration = Date.now() - startTime;
    projectData.servicesGenerated = generation.artifacts?.length || 0;
    projectData.buildVersion = (projectData.buildVersion || 0) + 1;
    projectData.buildMetadata = {
      templatesUsed: Object.keys(generation.output?.services || {}).length,
      componentsFound: generation.metadata?.componentsFound || 0,
      containersFound: generation.metadata?.containersFound || 0,
      usedComponentTypes: generation.metadata?.usedElementTypes || [],
      hasGenerationErrors: generation.metadata?.hasGenerationErrors || false,
      generationErrors: generation.metadata?.generationErrors || []
    };
    
    const updateResult = await writePath(projectFilePath, projectData);
    if (!updateResult.success) {
      throw new Error(`Failed to update project state: ${updateResult.error}`);
    }
    
    console.log(`[BUILD] Project metadata updated`);
    
    // CALL 10: Validation - Verify BUILT state
    console.log(`[BUILD] CALL 10: Verifying BUILT state...`);
    const newStateDetection = await detectBuiltState(projectPath);
    const detectedState = newStateDetection.data?.state;
    console.log(`[BUILD] New state detected: ${detectedState || 'UNKNOWN'}`);
    
    // CALL 11: Final verification
    console.log(`[BUILD] CALL 11: Final verification...`);
    if (detectedState !== 'BUILT') {
      throw new Error(`State verification failed: expected BUILT, got ${detectedState || 'UNKNOWN'}`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[BUILD] Project ${projectId} built successfully in ${duration}ms`);
    
    return {
      success: true,
      data: {
        projectId,
        fromState: 'DRAFT',
        toState: 'BUILT',
        servicesGenerated: generation.artifacts?.length || 0,
        duration,
        buildVersion: projectData.buildVersion,
        filesWritten: writtenFiles.length,
        templatesUsed: Object.keys(generation.output?.services || {}).length,
        hasWarnings: (generation.metadata?.generationErrors || []).length > 0
      }
    };
    
  } catch (error) {
    console.error(`[BUILD] Error during build: ${error.message}`);
    console.log(`[BUILD] Initiating rollback for ${writtenFiles.length} files...`);
    
    // ROLLBACK AUTOMATIQUE
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