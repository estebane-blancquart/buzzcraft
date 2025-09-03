/**
 * Coordinateur BUILD - Workflow DRAFT → BUILT - VERSION HANDLEBARS
 * @module build-coordinator
 * @description Orchestre la compilation complète d'un projet avec génération de code via Handlebars
 */

import { detectDraftState } from '../probes/draft-detector.js';
import { detectBuiltState } from '../probes/built-detector.js';
import { getProjectPath, getProjectFilePath } from '../cores/paths.js';
import { PATHS, validateProjectId } from '../cores/constants.js';
import { readPath } from '../cores/reader.js';
import { writePath } from '../cores/writer.js';
import { join, dirname } from 'path';
import { readdir } from 'fs/promises';
import Handlebars from 'handlebars';

/**
 * Orchestre le workflow complet BUILD (DRAFT → BUILT)
 * @param {string} projectId - ID du projet à compiler
 * @param {object} [config={}] - Configuration de build
 * @param {boolean} [config.production=false] - Mode production
 * @param {boolean} [config.minify=true] - Minifier le code généré
 * @param {string[]} [config.targets=['app-visitor']] - Services à générer
 * @param {boolean} [config.skipValidation=false] - Ignorer la validation pre-build
 * @returns {Promise<{success: boolean, data: object}>} Résultat du workflow
 */
export async function buildWorkflow(projectId, config = {}) {
  console.log(`[BUILD] 🚀 CALL 3: buildWorkflow called for project: ${projectId}`);
  
  // CALL 1: Validation des paramètres d'entrée
  const validation = validateBuildParameters(projectId, config);
  if (!validation.valid) {
    console.log(`[BUILD] ❌ Parameter validation failed: ${validation.error}`);
    return {
      success: false,
      error: `Parameter validation failed: ${validation.error}`
    };
  }

  const projectPath = getProjectPath(projectId);
  const startTime = Date.now();
  
  console.log(`[BUILD] 📂 Project path resolved: ${projectPath}`);
  
  try {
    // CALL 4: Détection état initial (doit être DRAFT)
    console.log(`[BUILD] 🔍 CALL 4: Detecting initial state...`);
    const initialState = await detectDraftState(projectPath);
    
    if (!initialState.success) {
      console.log(`[BUILD] ❌ Initial state detection failed: ${initialState.error}`);
      return {
        success: false,
        error: `State detection failed: ${initialState.error}`
      };
    }
    
    if (!initialState.data.isDraft) {
      console.log(`[BUILD] ❌ Project is not in DRAFT state (current: ${initialState.data.state || 'unknown'})`);
      return {
        success: false,
        error: `Project must be in DRAFT state. Current state: ${initialState.data.state || 'unknown'}`
      };
    }
    
    console.log(`[BUILD] ✅ Initial state confirmed: DRAFT`);
    
    // CALL 5: Chargement des données projet
    console.log(`[BUILD] 📖 CALL 5: Loading project data...`);
    const projectData = await loadProjectForBuild(projectId);
    
    if (!projectData.success) {
      console.log(`[BUILD] ❌ Project loading failed: ${projectData.error}`);
      return {
        success: false,
        error: `Project loading failed: ${projectData.error}`
      };
    }
    
    console.log(`[BUILD] ✅ Project data loaded: ${projectData.data.name}`);
    
    // CALL 6: Préparation configuration de build
    console.log(`[BUILD] ⚙️ CALL 6: Preparing build configuration...`);
    const buildConfig = prepareBuildConfiguration(projectData.data, config);
    console.log(`[BUILD] ⚙️ Build config prepared for targets: ${buildConfig.targets.join(', ')}`);
    
    // CALL 7: Génération du code via Handlebars
    console.log(`[BUILD] 🔧 CALL 7: Generating code with Handlebars...`);
    const buildResult = await generateProjectCodeWithHandlebars(projectData.data, buildConfig);
    
    if (!buildResult.success) {
      console.log(`[BUILD] ❌ Code generation failed: ${buildResult.error}`);
      return {
        success: false,
        error: `Code generation failed: ${buildResult.error}`
      };
    }
    
    console.log(`[BUILD] ✅ Code generated successfully: ${buildResult.data.generatedFiles.length} files`);
    
    // CALL 8: Mise à jour des métadonnées projet
    console.log(`[BUILD] 📝 CALL 8: Updating project metadata...`);
    const updatedProject = await updateProjectWithBuildData(projectData.data, buildResult.data, buildConfig);
    
    if (!updatedProject.success) {
      console.log(`[BUILD] ❌ Project metadata update failed: ${updatedProject.error}`);
      return {
        success: false,
        error: `Project metadata update failed: ${updatedProject.error}`
      };
    }
    
    console.log(`[BUILD] ✅ Project metadata updated`);
    
    // CALL 9: Mise à jour de l'état vers BUILT
    console.log(`[BUILD] 🔄 CALL 9: Updating project state to BUILT...`);
    const stateUpdateResult = await updateProjectState(projectId, 'BUILT', updatedProject.data);
    
    if (!stateUpdateResult.success) {
      console.log(`[BUILD] ❌ State update failed: ${stateUpdateResult.error}`);
      return {
        success: false,
        error: `State update failed: ${stateUpdateResult.error}`
      };
    }
    
    console.log(`[BUILD] ✅ Project state updated to BUILT`);
    
    // CALL 10: Vérification finale (doit être BUILT)
    console.log(`[BUILD] 🔍 CALL 10: Final verification...`);
    const finalState = await detectBuiltState(projectPath);
    
    if (!finalState.success || !finalState.data.isBuilt) {
      console.log(`[BUILD] ❌ Final state verification failed`);
      return {
        success: false,
        error: 'Final state verification failed - project not in BUILT state'
      };
    }
    
    const duration = Date.now() - startTime;
    console.log(`[BUILD] ✅ Workflow completed successfully in ${duration}ms`);
    
    return {
      success: true,
      data: {
        projectId,
        fromState: 'DRAFT',
        toState: 'BUILT',
        duration,
        generatedFiles: buildResult.data.generatedFiles,
        totalFiles: buildResult.data.totalFiles,
        totalSize: buildResult.data.totalSize,
        buildConfig: {
          targets: buildConfig.targets,
          production: buildConfig.production,
          buildId: buildConfig.buildId
        }
      }
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`[BUILD] ❌ Workflow failed after ${duration}ms: ${error.message}`);
    
    return {
      success: false,
      error: `Build workflow failed: ${error.message}`,
      duration
    };
  }
}

// ===== FONCTIONS DE SUPPORT =====

/**
 * Valide les paramètres d'entrée du workflow BUILD
 * @param {string} projectId - ID du projet
 * @param {object} config - Configuration de build
 * @returns {{valid: boolean, error?: string}}
 */
function validateBuildParameters(projectId, config = {}) {
  // Validation projectId
  const projectValidation = validateProjectId(projectId);
  if (!projectValidation.valid) {
    return projectValidation;
  }
  
  // Validation config
  if (typeof config !== 'object' || config === null) {
    return { valid: false, error: 'Config must be an object' };
  }
  
  // Validation targets
  if (config.targets && !Array.isArray(config.targets)) {
    return { valid: false, error: 'Config.targets must be an array' };
  }
  
  if (config.targets && config.targets.length === 0) {
    return { valid: false, error: 'Config.targets cannot be empty' };
  }
  
  // Validation production flag
  if (config.production !== undefined && typeof config.production !== 'boolean') {
    return { valid: false, error: 'Config.production must be boolean' };
  }
  
  return { valid: true };
}

/**
 * Charge les données projet pour le build
 * @param {string} projectId - ID du projet
 * @returns {Promise<{success: boolean, data: object}>}
 */
async function loadProjectForBuild(projectId) {
  try {
    console.log(`[BUILD] Loading project data for: ${projectId}`);
    
    const projectFilePath = getProjectFilePath(projectId);
    const projectResult = await readPath(projectFilePath);
    
    if (!projectResult.success) {
      return {
        success: false,
        error: `Failed to read project file: ${projectResult.error}`
      };
    }
    
    const projectData = JSON.parse(projectResult.data.content);
    
    // Validation basique du projet
    if (!projectData.id || !projectData.name || !projectData.state) {
      return {
        success: false,
        error: 'Invalid project data: missing required fields'
      };
    }
    
    if (projectData.state !== 'DRAFT') {
      return {
        success: false,
        error: `Project must be in DRAFT state, current: ${projectData.state}`
      };
    }
    
    console.log(`[BUILD] Project data loaded: ${projectData.name} (${projectData.state})`);
    
    return {
      success: true,
      data: projectData
    };
    
  } catch (error) {
    console.log(`[BUILD] Load project error: ${error.message}`);
    return {
      success: false,
      error: `Project loading failed: ${error.message}`
    };
  }
}

/**
 * Prépare la configuration de build
 * @param {object} projectData - Données du projet
 * @param {object} userConfig - Configuration utilisateur
 * @returns {object} Configuration de build complète
 */
function prepareBuildConfiguration(projectData, userConfig = {}) {
  console.log(`[BUILD] Preparing build configuration...`);
  
  const buildConfig = {
    // Configuration par défaut
    production: userConfig.production || false,
    minify: userConfig.minify !== undefined ? userConfig.minify : true,
    targets: userConfig.targets || ['app-visitor'],
    skipValidation: userConfig.skipValidation || false,
    
    // Métadonnées du build
    buildVersion: `build_${Date.now()}`,
    buildId: `${projectData.id}_${Date.now()}`,
    projectId: projectData.id,
    projectName: projectData.name,
    
    // Timestamp
    buildStarted: new Date().toISOString()
  };
  
  console.log(`[BUILD] Build config prepared for ${buildConfig.targets.length} target(s)`);
  
  return buildConfig;
}

/**
 * Génère le code du projet en utilisant les templates Handlebars
 * @param {object} projectData - Données du projet
 * @param {object} buildConfig - Configuration de build
 * @returns {Promise<{success: boolean, data: object}>}
 */
async function generateProjectCodeWithHandlebars(projectData, buildConfig) {
  try {
    console.log(`[BUILD] Starting Handlebars code generation for: ${projectData.name}`);
    
    // Préparer le dossier de génération (directement dans le projet)
    const projectPath = getProjectPath(projectData.id);
    const generatedPath = projectPath; // Génération directe dans le projet
    
    const generatedFiles = [];
    
    // Analyser les éléments utilisés dans le projet
    const usedElements = analyzeUsedElements(projectData);
    console.log(`[BUILD] Found ${usedElements.components.length} components, ${usedElements.containers.length} containers`);
    
    // Préparer le contexte Handlebars complet
    const handlebarsContext = {
      project: projectData,
      build: buildConfig,
      usedElements,
      timestamp: new Date().toISOString(),
      // Helpers pour templates
      helpers: {
        capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1),
        lowercase: (str) => str.toLowerCase(),
        kebabCase: (str) => str.replace(/\s+/g, '-').toLowerCase()
      }
    };
    
    // Générer les services selon les targets
    for (const target of buildConfig.targets) {
      console.log(`[BUILD] Generating ${target} service...`);
      
      const targetResult = await generateServiceFiles(target, handlebarsContext, generatedPath);
      
      if (targetResult.success) {
        generatedFiles.push(...targetResult.data.files);
        console.log(`[BUILD] Generated ${target}: ${targetResult.data.files.length} files`);
      } else {
        console.log(`[BUILD] Warning: ${target} generation failed: ${targetResult.error}`);
      }
    }
    
    const totalSize = generatedFiles.reduce((sum, file) => sum + file.size, 0);
    
    console.log(`[BUILD] Handlebars generation complete: ${generatedFiles.length} files (${totalSize} bytes)`);
    
    return {
      success: true,
      data: {
        generatedFiles,
        totalFiles: generatedFiles.length,
        totalSize,
        usedElements,
        generatedPath,
        targets: buildConfig.targets,
        templatesUsed: generatedFiles.map(f => f.template).filter(Boolean)
      }
    };
    
  } catch (error) {
    console.log(`[BUILD] Handlebars generation failed: ${error.message}`);
    return {
      success: false,
      error: `Handlebars generation failed: ${error.message}`
    };
  }
}

/**
 * Génère les fichiers d'un service spécifique
 * @param {string} serviceName - Nom du service (app-visitor, app-server, etc.)
 * @param {object} context - Contexte Handlebars
 * @param {string} buildPath - Chemin de build
 * @returns {Promise<{success: boolean, data: object}>}
 */
async function generateServiceFiles(serviceName, context, buildPath) {
  try {
    // Mapper les targets vers les vrais noms de services
    const serviceMapping = {
      'app-visitor': 'front',
      'app-server': 'api', 
      'app-database': 'database',
      'app-admin': 'admin',
      'app-api': 'api'
    };
    
    const actualServiceName = serviceMapping[serviceName] || serviceName;
    const servicePath = join(buildPath.replace('/build', ''), actualServiceName);
    const templatesPath = join(PATHS.codeTemplates, serviceName);
    
    // Vérifier que le dossier de templates existe
    try {
      await readdir(templatesPath);
    } catch (error) {
      // Service non supporté pour l'instant
      console.log(`[BUILD] Templates not found for ${serviceName}, skipping`);
      return {
        success: true,
        data: { files: [] }
      };
    }
    
    const serviceFiles = [];
    const templateFiles = await scanTemplateFiles(templatesPath);
    
    console.log(`[BUILD] Found ${templateFiles.length} templates for ${serviceName}`);
    
    for (const templateFile of templateFiles) {
      const compiledResult = await compileTemplate(templateFile, context, servicePath);
      
      if (compiledResult.success) {
        serviceFiles.push({
          ...compiledResult.data,
          service: serviceName,
          template: templateFile.relativePath
        });
      } else {
        console.log(`[BUILD] Template compilation failed: ${templateFile.name} - ${compiledResult.error}`);
      }
    }
    
    return {
      success: true,
      data: {
        files: serviceFiles,
        service: serviceName
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Service generation failed: ${error.message}`
    };
  }
}

/**
 * Scanne récursivement les fichiers templates d'un service
 * @param {string} templatesPath - Chemin vers les templates
 * @param {string} relativePath - Chemin relatif (pour récursion)
 * @returns {Promise<Array>} Liste des templates trouvés
 */
async function scanTemplateFiles(templatesPath, relativePath = '') {
  const templateFiles = [];
  
  try {
    const entries = await readdir(templatesPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(templatesPath, entry.name);
      const currentRelativePath = join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        // Récursion dans les sous-dossiers
        const subTemplates = await scanTemplateFiles(fullPath, currentRelativePath);
        templateFiles.push(...subTemplates);
      } else if (entry.name.endsWith('.hbs')) {
        // Fichier template trouvé
        templateFiles.push({
          name: entry.name,
          fullPath,
          relativePath: currentRelativePath,
          outputPath: currentRelativePath.replace('.hbs', '')
        });
      }
    }
  } catch (error) {
    console.log(`[BUILD] Template scan error: ${error.message}`);
  }
  
  return templateFiles;
}

/**
 * Compile un template Handlebars et écrit le résultat
 * @param {object} templateFile - Informations du template
 * @param {object} context - Contexte Handlebars
 * @param {string} outputBasePath - Chemin de base pour l'output
 * @returns {Promise<{success: boolean, data: object}>}
 */
async function compileTemplate(templateFile, context, outputBasePath) {
  try {
    // Lire le template
    const templateResult = await readPath(templateFile.fullPath);
    if (!templateResult.success) {
      return {
        success: false,
        error: `Failed to read template: ${templateResult.error}`
      };
    }
    
    // Compiler avec Handlebars
    const template = Handlebars.compile(templateResult.data.content);
    const compiledContent = template(context);
    
    // Déterminer le chemin de sortie
    const outputPath = join(outputBasePath, templateFile.outputPath);
    
    // Écrire le fichier compilé
    const writeResult = await writePath(outputPath, compiledContent);
    
    if (!writeResult.success) {
      return {
        success: false,
        error: `Failed to write compiled file: ${writeResult.error}`
      };
    }
    
    return {
      success: true,
      data: {
        path: templateFile.outputPath,
        size: writeResult.data.size,
        type: getFileType(templateFile.outputPath),
        compiledAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Template compilation error: ${error.message}`
    };
  }
}

/**
 * Détermine le type de fichier basé sur l'extension
 * @param {string} filePath - Chemin du fichier
 * @returns {string} Type du fichier
 */
function getFileType(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  
  const typeMap = {
    'json': 'config',
    'js': 'javascript',
    'ts': 'typescript', 
    'tsx': 'react',
    'jsx': 'react',
    'html': 'html',
    'css': 'css',
    'scss': 'sass',
    'sql': 'database',
    'md': 'documentation'
  };
  
  return typeMap[ext] || 'unknown';
}

/**
 * Met à jour les métadonnées du projet avec les données de build
 * @param {object} projectData - Données du projet originales
 * @param {object} buildData - Données du build
 * @param {object} buildConfig - Configuration de build
 * @returns {Promise<{success: boolean, data: object}>}
 */
async function updateProjectWithBuildData(projectData, buildData, buildConfig) {
  try {
    console.log(`[BUILD] Updating project metadata...`);
    
    const updatedProject = {
      ...projectData,
      lastModified: new Date().toISOString(),
      build: {
        buildId: buildConfig.buildId,
        buildVersion: buildConfig.buildVersion,
        builtAt: new Date().toISOString(),
        targets: buildConfig.targets,
        generatedFiles: buildData.generatedFiles,
        totalSize: buildData.totalSize,
        templatesUsed: buildData.templatesUsed || [],
        usedElements: buildData.usedElements
      }
    };
    
    console.log(`[BUILD] Project metadata updated`);
    
    return {
      success: true,
      data: updatedProject
    };
    
  } catch (error) {
    console.log(`[BUILD] Update project metadata failed: ${error.message}`);
    return {
      success: false,
      error: `Metadata update failed: ${error.message}`
    };
  }
}

/**
 * Met à jour l'état du projet vers BUILT
 * @param {string} projectId - ID du projet
 * @param {string} newState - Nouvel état (BUILT)
 * @param {object} updatedProjectData - Données mises à jour
 * @returns {Promise<{success: boolean, data: object}>}
 */
async function updateProjectState(projectId, newState, updatedProjectData) {
  try {
    console.log(`[BUILD] Updating project state to: ${newState}`);
    
    // Mise à jour de l'état
    const finalProjectData = {
      ...updatedProjectData,
      state: newState,
      lastModified: new Date().toISOString()
    };
    
    // Sauvegarde du fichier projet
    const projectFilePath = getProjectFilePath(projectId);
    const saveResult = await writePath(projectFilePath, JSON.stringify(finalProjectData, null, 2));
    
    if (!saveResult.success) {
      return {
        success: false,
        error: `Failed to save project: ${saveResult.error}`
      };
    }
    
    console.log(`[BUILD] Project state updated to: ${newState}`);
    
    return {
      success: true,
      data: {
        projectId,
        fromState: 'DRAFT',
        toState: newState,
        updatedAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.log(`[BUILD] State update failed: ${error.message}`);
    return {
      success: false,
      error: `State update failed: ${error.message}`
    };
  }
}

// ===== FONCTIONS UTILITAIRES =====

/**
 * Analyse les éléments utilisés dans le projet
 * @param {object} projectData - Données du projet
 * @returns {object} Éléments utilisés
 */
function analyzeUsedElements(projectData) {
  const usedComponents = new Set();
  const usedContainers = new Set();
  
  if (projectData.pages && Array.isArray(projectData.pages)) {
    projectData.pages.forEach(page => {
      if (page.layout && page.layout.sections) {
        page.layout.sections.forEach(section => {
          // Analyser les divs
          if (section.divs && Array.isArray(section.divs)) {
            section.divs.forEach(div => {
              usedContainers.add('div');
              if (div.components && Array.isArray(div.components)) {
                div.components.forEach(component => {
                  if (component.type) {
                    usedComponents.add(component.type);
                  }
                });
              }
            });
          }
          
          // Analyser les forms
          if (section.forms && Array.isArray(section.forms)) {
            section.forms.forEach(form => {
              usedContainers.add('form');
              if (form.inputs && Array.isArray(form.inputs)) {
                form.inputs.forEach(input => {
                  usedComponents.add(input.type || 'input');
                });
              }
            });
          }
        });
      }
    });
  }
  
  return {
    components: Array.from(usedComponents),
    containers: Array.from(usedContainers)
  };
}

console.log(`[BUILD] Build coordinator loaded successfully - HANDLEBARS VERSION`);