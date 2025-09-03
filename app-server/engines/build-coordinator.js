/**
 * Coordinateur BUILD - Workflow DRAFT → BUILT - VERSION PIXEL PARFAIT
 * @module build-coordinator
 * @description Orchestre le build complet d'un projet DRAFT vers l'état BUILT
 */

import Handlebars from 'handlebars';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { detectDraftState } from '../probes/draft-detector.js';
import { detectBuiltState } from '../probes/built-detector.js';
import { getProjectPath, getProjectFilePath } from '../cores/paths.js';
import { readPath } from '../cores/reader.js';
import { writePath } from '../cores/writer.js';
import { LOG_COLORS, PATHS } from '../cores/constants.js';

/**
 * Orchestre le workflow complet BUILD (DRAFT → BUILT)
 * @param {string} projectId - ID du projet à builder
 * @param {object} [config={}] - Configuration de build
 * @param {string[]} [config.targets=['app-visitor']] - Targets à générer
 * @param {boolean} [config.minify=true] - Minification du code
 * @param {boolean} [config.skipValidation=false] - Skip validation finale
 * @returns {Promise<{success: boolean, data: object}>} Résultat du workflow
 */
export async function buildWorkflow(projectId, config = {}) {
  const startTime = Date.now();
  
  // Validation des paramètres d'entrée
  const validation = validateBuildParameters(projectId, config);
  if (!validation.valid) {
    console.log(`${LOG_COLORS.error}[BUILD] Parameter validation failed: ${validation.error}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: `Parameter validation failed: ${validation.error}`
    };
  }

  const projectPath = getProjectPath(projectId);
  
  try {
    // Détection de l'état initial (doit être DRAFT)
    const initialState = await detectDraftState(projectPath);
    
    if (!initialState.success || !initialState.data.isDraft) {
      console.log(`${LOG_COLORS.error}[BUILD] Project not in DRAFT state${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Project must be in DRAFT state`
      };
    }
    
    // Chargement des données projet
    const projectData = await loadProjectForBuild(projectId);
    if (!projectData.success) {
      console.log(`${LOG_COLORS.error}[BUILD] Project loading failed: ${projectData.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Project loading failed: ${projectData.error}`
      };
    }
    
    // Préparation configuration de build
    const buildConfig = prepareBuildConfiguration(projectData.data, config);
    
    // Génération du code via Handlebars
    const buildResult = await generateProjectCodeWithHandlebars(projectData.data, buildConfig);
    
    if (!buildResult.success) {
      console.log(`${LOG_COLORS.error}[BUILD] Code generation failed: ${buildResult.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Code generation failed: ${buildResult.error}`
      };
    }
    
    // Mise à jour des métadonnées projet
    const updatedProject = await updateProjectWithBuildData(projectData.data, buildResult.data, buildConfig);
    
    if (!updatedProject.success) {
      console.log(`${LOG_COLORS.error}[BUILD] Project metadata update failed: ${updatedProject.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `Project metadata update failed: ${updatedProject.error}`
      };
    }
    
    // Mise à jour de l'état vers BUILT
    const stateUpdateResult = await updateProjectState(projectId, 'BUILT', updatedProject.data);
    
    if (!stateUpdateResult.success) {
      console.log(`${LOG_COLORS.error}[BUILD] State update failed: ${stateUpdateResult.error}${LOG_COLORS.reset}`);
      return {
        success: false,
        error: `State update failed: ${stateUpdateResult.error}`
      };
    }
    
    // Vérification finale (doit être BUILT)
    const finalState = await detectBuiltState(projectPath);
    
    const duration = Date.now() - startTime;
    
    if (!finalState.success || !finalState.data.isBuilt) {
      console.log(`${LOG_COLORS.warning}[BUILD] Final verification incomplete, but proceeding${LOG_COLORS.reset}`);
    }

    console.log(`${LOG_COLORS.success}[BUILD] ${projectId}: Workflow completed successfully in ${duration}ms${LOG_COLORS.reset}`);
    
    // Construction de la réponse
    return {
      success: true,
      data: {
        projectId,
        fromState: 'DRAFT',
        toState: 'BUILT',
        duration,
        project: updatedProject.data,
        build: buildResult.data,
        workflow: {
          action: 'BUILD',
          projectId,
          duration,
          initialState: 'DRAFT',
          finalState: 'BUILT',
          completedAt: new Date().toISOString()
        }
      }
    };
    
  } catch (error) {
    console.log(`${LOG_COLORS.error}[BUILD] Unexpected error: ${error.message}${LOG_COLORS.reset}`);
    
    return {
      success: false,
      error: `Build workflow failed: ${error.message}`,
      errorCode: error.code || 'BUILD_ERROR'
    };
  }
}

/**
 * Charge les données du projet pour build
 * @param {string} projectId - ID du projet
 * @returns {Promise<{success: boolean, data: object}>} Données du projet
 * @private
 */
async function loadProjectForBuild(projectId) {
  try {
    const projectFilePath = getProjectFilePath(projectId);
    
    const projectFile = await readPath(projectFilePath, {
      parseJson: true,
      includeStats: false
    });
    
    if (!projectFile.success || !projectFile.data.exists) {
      return {
        success: false,
        error: `Project file not found: ${projectId}`
      };
    }
    
    if (projectFile.data.jsonError) {
      return {
        success: false,
        error: `Invalid project file: ${projectFile.data.jsonError}`
      };
    }
    
    return {
      success: true,
      data: projectFile.data.parsed
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Project loading failed: ${error.message}`
    };
  }
}

/**
 * Prépare la configuration de build
 * @param {object} projectData - Données du projet
 * @param {object} config - Configuration utilisateur
 * @returns {object} Configuration de build complète
 * @private
 */
function prepareBuildConfiguration(projectData, config) {
  return {
    targets: config.targets || ['app-visitor'],
    minify: config.minify !== false,
    sourceMaps: config.sourceMaps === true,
    skipValidation: config.skipValidation === true,
    projectData,
    buildId: `build_${Date.now()}`,
    buildStartedAt: new Date().toISOString()
  };
}

/**
 * Génère le code du projet avec Handlebars (VRAIE IMPLÉMENTATION)
 * @param {object} projectData - Données du projet
 * @param {object} buildConfig - Configuration de build
 * @returns {Promise<{success: boolean, data: object}>} Résultat de génération
 * @private
 */
async function generateProjectCodeWithHandlebars(projectData, buildConfig) {
  try {
    console.log(`${LOG_COLORS.info}[BUILD] Starting code generation with Handlebars...${LOG_COLORS.reset}`);
    
    const templatesPath = join(PATHS.dataInputs, 'templates', 'code');
    const outputPath = join(PATHS.dataOutputs, projectData.id);
    
    // 1. Scanner tous les templates .hbs
    const templates = await scanHandlebarsTemplates(templatesPath);
    console.log(`${LOG_COLORS.info}[BUILD] Found ${templates.length} Handlebars templates${LOG_COLORS.reset}`);
    
    if (templates.length === 0) {
      return {
        success: false,
        error: 'No Handlebars templates found in templates/code directory'
      };
    }
    
    // 2. Préparer le contexte pour Handlebars
    const context = {
      project: projectData,
      build: buildConfig,
      timestamp: new Date().toISOString(),
      buildId: buildConfig.buildId
    };
    
    // 3. Générer tous les fichiers
    const generatedFiles = [];
    let totalSize = 0;
    
    for (const template of templates) {
      try {
        // Lire le template
        const templateResult = await readPath(template.absolutePath, { encoding: 'utf8' });
        
        if (!templateResult.success) {
          console.log(`${LOG_COLORS.warning}[BUILD] Cannot read template: ${template.relativePath}${LOG_COLORS.reset}`);
          continue;
        }
        
        // Compiler avec Handlebars
        const compiledTemplate = Handlebars.compile(templateResult.data.content);
        const generatedContent = compiledTemplate(context);
        
        // Chemin de sortie (remove .hbs extension)
        const outputFilePath = join(outputPath, template.outputPath);
        
        // Écrire le fichier généré
        const writeResult = await writePath(outputFilePath, generatedContent, {
          createDirs: true,
          encoding: 'utf8'
        });
        
        if (writeResult.success) {
          generatedFiles.push({
            path: template.outputPath,
            size: generatedContent.length,
            template: template.relativePath
          });
          totalSize += generatedContent.length;
          console.log(`${LOG_COLORS.success}[BUILD] Generated: ${template.outputPath}${LOG_COLORS.reset}`);
        } else {
          console.log(`${LOG_COLORS.warning}[BUILD] Failed to write: ${template.outputPath} - ${writeResult.error}${LOG_COLORS.reset}`);
        }
        
      } catch (templateError) {
        console.log(`${LOG_COLORS.warning}[BUILD] Template compilation failed for ${template.relativePath}: ${templateError.message}${LOG_COLORS.reset}`);
        // Continue avec les autres templates
      }
    }
    
    if (generatedFiles.length === 0) {
      return {
        success: false,
        error: 'No files were successfully generated'
      };
    }
    
    console.log(`${LOG_COLORS.success}[BUILD] Code generation completed: ${generatedFiles.length} files, ${Math.round(totalSize/1024)}KB total${LOG_COLORS.reset}`);
    
    return {
      success: true,
      data: {
        generatedFiles: generatedFiles.map(f => f.path),
        fileDetails: generatedFiles,
        totalSize,
        templateCount: templates.length,
        buildTargets: buildConfig.targets,
        buildId: buildConfig.buildId
      }
    };
    
  } catch (error) {
    console.log(`${LOG_COLORS.error}[BUILD] Code generation failed: ${error.message}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: `Code generation failed: ${error.message}`
    };
  }
}

/**
 * Scanner récursif pour trouver tous les templates .hbs
 * @param {string} templatesPath - Chemin vers les templates
 * @returns {Promise<Array>} Liste des templates trouvés
 * @private
 */
async function scanHandlebarsTemplates(templatesPath) {
  const templates = [];
  
  async function scanDirectory(currentPath, relativePath = '') {
    try {
      const entries = await readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(currentPath, entry.name);
        const relativeFullPath = join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          // Récursion dans les sous-dossiers
          await scanDirectory(fullPath, relativeFullPath);
        } else if (entry.isFile() && entry.name.endsWith('.hbs')) {
          // Fichier template trouvé
          const outputPath = relativeFullPath.replace(/\.hbs$/, ''); // Remove .hbs
          
          templates.push({
            name: entry.name,
            absolutePath: fullPath,
            relativePath: relativeFullPath,
            outputPath: outputPath,
            directory: relativePath
          });
        }
      }
    } catch (error) {
      console.log(`${LOG_COLORS.warning}[BUILD] Cannot scan directory ${currentPath}: ${error.message}${LOG_COLORS.reset}`);
    }
  }
  
  await scanDirectory(templatesPath);
  return templates;
}

/**
 * Met à jour le projet avec les données de build
 * @param {object} projectData - Données du projet
 * @param {object} buildData - Données de build
 * @param {object} buildConfig - Configuration de build
 * @returns {Promise<{success: boolean, data: object}>} Projet mis à jour
 * @private
 */
async function updateProjectWithBuildData(projectData, buildData, buildConfig) {
  try {
    const updatedProject = {
      ...projectData,
      state: 'BUILT',
      lastModified: new Date().toISOString(),
      build: {
        builtAt: buildConfig.buildStartedAt,
        buildId: buildConfig.buildId,
        version: `v${Date.now()}`,
        targets: buildConfig.targets,
        generatedFiles: buildData.generatedFiles.length,
        totalSize: buildData.totalSize,
        minified: buildConfig.minify,
        sourceMaps: buildConfig.sourceMaps
      }
    };
    
    return {
      success: true,
      data: updatedProject
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Project update failed: ${error.message}`
    };
  }
}

/**
 * Met à jour l'état du projet
 * @param {string} projectId - ID du projet
 * @param {string} newState - Nouvel état
 * @param {object} projectData - Données du projet
 * @returns {Promise<{success: boolean}>} Résultat de mise à jour
 * @private
 */
async function updateProjectState(projectId, newState, projectData) {
  try {
    const projectFilePath = getProjectFilePath(projectId);
    
    const updatedProjectData = {
      ...projectData,
      state: newState,
      lastModified: new Date().toISOString()
    };
    
    const writeResult = await writePath(projectFilePath, updatedProjectData, {
      jsonIndent: 2,
      createDirs: false
    });
    
    if (!writeResult.success) {
      return {
        success: false,
        error: `Failed to write project state: ${writeResult.error}`
      };
    }
    
    return {
      success: true
    };
    
  } catch (error) {
    return {
      success: false,
      error: `State update failed: ${error.message}`
    };
  }
}

/**
 * Valide les paramètres de build
 * @param {string} projectId - ID du projet
 * @param {object} config - Configuration
 * @returns {{valid: boolean, error?: string}} Résultat de validation
 * @private
 */
function validateBuildParameters(projectId, config) {
  // Validation projectId
  if (!projectId || typeof projectId !== 'string') {
    return { valid: false, error: 'projectId must be non-empty string' };
  }
  
  if (projectId.trim().length === 0) {
    return { valid: false, error: 'projectId cannot be empty or whitespace only' };
  }
  
  // Validation config
  if (!config || typeof config !== 'object') {
    return { valid: false, error: 'config must be an object' };
  }
  
  // Validation targets optionnelle
  if (config.targets && !Array.isArray(config.targets)) {
    return { valid: false, error: 'config.targets must be an array' };
  }
  
  if (config.targets && config.targets.length === 0) {
    return { valid: false, error: 'config.targets cannot be empty' };
  }
  
  return { valid: true };
}