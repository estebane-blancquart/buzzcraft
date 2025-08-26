import { detectDraftState } from "../probes/draft-detector.js";
import { detectBuiltState } from "../probes/built-detector.js";
import { readPath } from "../cores/reader.js";
import { writePath } from "../cores/writer.js";
import { rm } from "fs/promises";
import { readCodeTemplates } from "../cores/templates.js";
import { generateTemplateVariables } from "../cores/variable-generator.js";
import { buildServices, validateServices } from "../cores/services.js";
import { getProjectPath, getProjectFilePath } from "../cores/paths.js";

/*
 * FAIT QUOI : Orchestre workflow BUILD (DRAFT → BUILT) - VERSION CORES PURS
 * REÇOIT : projectId: string, config: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres manquants, rollback automatique si échec partiel
 */

export async function buildWorkflow(projectId, config = {}) {
  console.log(`[BUILD] CALL 3: buildWorkflow called for project: ${projectId}`);

  // Validation des paramètres
  if (!projectId || typeof projectId !== "string") {
    throw new Error("ValidationError: projectId must be non-empty string");
  }

  const projectPath = getProjectPath(projectId);
  const startTime = Date.now();

  console.log(`[BUILD] Project path resolved: ${projectPath}`);

  // CALL 4: Detect current state
  console.log(`[BUILD] CALL 4: Checking if project is DRAFT...`);
  const stateDetection = await detectDraftState(projectPath);
  console.log(
    `[BUILD] State detection result: ${stateDetection.data?.state || "UNKNOWN"}`
  );

  if (!stateDetection.success) {
    return {
      success: false,
      error: `Failed to detect project state: ${stateDetection.error}`,
    };
  }

  if (stateDetection.data.state !== "DRAFT") {
    return {
      success: false,
      error: `Project ${projectId} must be in DRAFT state for build (current: ${stateDetection.data.state || "unknown"})`,
    };
  }

  // CALL 5: Load project data
  console.log(`[BUILD] CALL 5: Loading project data...`);
  const projectFilePath = getProjectFilePath(projectId, "project.json");
  const projectFile = await readPath(projectFilePath);

  if (!projectFile.success) {
    return {
      success: false,
      error: `Failed to read project file: ${projectFile.error}`,
    };
  }

  let projectData;
  try {
    projectData = JSON.parse(projectFile.data.content);
    console.log(`[BUILD] Project data loaded successfully`);
  } catch (parseError) {
    return {
      success: false,
      error: `Failed to parse project.json: ${parseError.message}`,
    };
  }

  // CALL 6: Load code templates (utilise core pur)
  console.log(`[BUILD] CALL 6: Loading code templates...`);
  const codeTemplatesResult = await readCodeTemplates(projectId);

  if (!codeTemplatesResult.success) {
    return {
      success: false,
      error: `Failed to load code templates: ${codeTemplatesResult.error}`,
    };
  }

  const codeTemplates = codeTemplatesResult.data;
  console.log(
    `[BUILD] Code templates loaded: ${Object.keys(codeTemplates).length} templates`
  );
  // CALL 7: Generate base variables (utilise core pur)
  console.log(`[BUILD] CALL 7: Generating template variables...`);
  const variablesResult = await generateTemplateVariables(projectData);
  const baseVariables = variablesResult.success ? variablesResult.data : {};

  // CALL 8: Skip compilation - buildServices will compile with specific variables
  console.log(`[BUILD] CALL 8: Templates ready for buildServices...`);
  console.log(`[BUILD] Templates available: ${Object.keys(codeTemplates).length} raw templates`);

  // CALL 9: Build services (utilise templates RAW + compile avec variables spécifiques)
  console.log(`[BUILD] CALL 9: Building services...`);

  let servicesResult;
  try {
    console.log("[BUILD] About to call buildServices with raw templates");
    // 🔧 FIX MAJEUR: Passer les templates RAW (non compilés) et laisser buildServices compiler chacun avec les variables spécifiques
    servicesResult = await buildServices(
      projectData,
      codeTemplates,  // Templates RAW, pas compilés
      baseVariables
    );
    console.log("[BUILD] buildServices returned:", typeof servicesResult);
  } catch (error) {
    console.error("[BUILD] FATAL ERROR in buildServices:", error.stack);
    return {
      success: false,
      error: `Build services failed: ${error.message}`,
    };
  }

  // 🔧 FIX: buildServices retourne maintenant directement les services, pas un wrapper {success, data}
  if (!servicesResult) {
    return {
      success: false,
      error: `Build services returned null - no services generated`,
    };
  }

  const services = servicesResult;

  // CALL 10: Validate services (utilise core pur)
  console.log(`[BUILD] CALL 10: Validating built services...`);
  if (!validateServices(services)) {
    return {
      success: false,
      error: `Service validation failed`,
    };
  }

  // Tracker fichiers écrits pour rollback
  const writtenFiles = [];

  try {
    // CALL 11: Write services to filesystem
    console.log(`[BUILD] CALL 11: Writing services to filesystem...`);

    for (const [servicePath, serviceContent] of Object.entries(services)) {
      const fullPath = getProjectFilePath(projectId, servicePath);
      console.log(`[BUILD] Writing service: ${fullPath}`);

      const writeResult = await writePath(fullPath, serviceContent);

      if (!writeResult.success) {
        throw new Error(`Failed to write ${servicePath}: ${writeResult.error}`);
      }

      writtenFiles.push(fullPath);
    }

    console.log(`[BUILD] Written ${writtenFiles.length} service files`);

    // CALL 12: Update project state to BUILT
    console.log(`[BUILD] CALL 12: Updating project state to BUILT...`);

    // Mise à jour des métadonnées projet
    projectData.state = "BUILT";
    projectData.lastBuild = new Date().toISOString();
    projectData.buildDuration = Date.now() - startTime;
    projectData.servicesGenerated = Object.keys(services).length;
    projectData.buildVersion = (projectData.buildVersion || 0) + 1;
    projectData.buildMetadata = {
      templatesUsed: Object.keys(codeTemplates).length,
      servicesBuilt: Object.keys(services).length,
      buildTimestamp: new Date().toISOString(),
      coresUsed: ["template-reader", "handlebars-engine", "service-builder"],
    };

    const updateResult = await writePath(projectFilePath, projectData);
    if (!updateResult.success) {
      throw new Error(`Failed to update project state: ${updateResult.error}`);
    }

    console.log(`[BUILD] Project metadata updated`);

    // CALL 13: Validation - Verify BUILT state
    console.log(`[BUILD] CALL 13: Verifying BUILT state...`);
    const newStateDetection = await detectBuiltState(projectPath);
    const detectedState = newStateDetection.data?.state;
    console.log(`[BUILD] New state detected: ${detectedState || "UNKNOWN"}`);

    // Final verification
    if (detectedState !== "BUILT") {
      throw new Error(
        `State verification failed: expected BUILT, got ${detectedState || "UNKNOWN"}`
      );
    }

    const duration = Date.now() - startTime;
    console.log(
      `[BUILD] Project ${projectId} built successfully in ${duration}ms`
    );

    return {
      success: true,
      data: {
        projectId,
        fromState: "DRAFT",
        toState: "BUILT",
        servicesGenerated: Object.keys(services).length,
        duration,
        buildVersion: projectData.buildVersion,
        filesWritten: writtenFiles.length,
        templatesUsed: Object.keys(codeTemplates).length,
        coresUsed: ["template-reader", "handlebars-engine", "service-builder"],
      },
    };
  } catch (error) {
    console.error(`[BUILD] Error during build: ${error.message}`);
    console.log(
      `[BUILD] Initiating rollback for ${writtenFiles.length} files...`
    );

    // ROLLBACK AUTOMATIQUE
    await cleanupPartialBuild(writtenFiles);

    return {
      success: false,
      error: `Build failed: ${error.message}. Rollback completed.`,
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
  console.log(
    `[ROLLBACK] Cleaning ${writtenFiles.length} partially written files...`
  );

  for (const filePath of writtenFiles) {
    try {
      await rm(filePath, { recursive: true, force: true });
      console.log(`[ROLLBACK] ✅ Cleaned: ${filePath}`);
    } catch (error) {
      console.log(
        `[ROLLBACK] ⚠️  Failed to clean ${filePath}: ${error.message}`
      );
      // Continue anyway - rollback best effort
    }
  }

  console.log(`[ROLLBACK] Rollback completed`);
}
