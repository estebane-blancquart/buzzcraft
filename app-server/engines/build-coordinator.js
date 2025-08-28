/**
 * Coordinateur BUILD - Workflow DRAFT → BUILT - VERSION PIXEL PARFAIT
 * @module build-coordinator
 * @description Orchestre la compilation complète d'un projet avec génération de code
 */

import { detectDraftState } from '../../probes/draft-detector.js';
import { detectBuiltState } from '../../probes/built-detector.js';
import { getProjectPath, getProjectFilePath } from '../../cores/paths.js';
import { PATHS } from '../../cores/constants.js';
import { readPath } from '../../cores/reader.js';
import { writePath } from '../../cores/writer.js';
import { join } from 'path';

/**
 * Orchestre le workflow complet BUILD (DRAFT → BUILT)
 * @param {string} projectId - ID du projet à compiler
 * @param {object} [config={}] - Configuration de build
 * @param {boolean} [config.production=false] - Mode production
 * @param {boolean} [config.minify=true] - Minifier le code généré
 * @param {string[]} [config.targets=['app-visitor']] - Services à générer
 * @param {boolean} [config.skipValidation=false] - Ignorer la validation pre-build
 * @returns {Promise<{success: boolean, data: object}>} Résultat du workflow
 * 
 * @example
 * const result = await buildWorkflow('mon-site', {
 *   production: true,
 *   targets: ['app-visitor', 'app-server']
 * });
 * 
 * if (result.success) {
 *   console.log(`Build réussi: ${result.data.generatedFiles.length} fichiers`);
 * }
 */
export async function buildWorkflow(projectId, config = {}) {
  console.log(`[BUILD] CALL 3: buildWorkflow called for project: ${projectId}`);
  
  // CALL 1: Validation des paramètres d'entrée
  const validation = validateBuildParameters(projectId, config);
  if (!validation.valid) {
    console.log(`[BUILD] Parameter validation failed: ${validation.error}`);
    return {
      success: false,
      error: `Parameter validation failed: ${validation.error}`
    };
  }

  const projectPath = getProjectPath(projectId);
  const startTime = Date.now();
  
  console.log(`[BUILD] Project path resolved: ${projectPath}`);
  
  try {
    // CALL 4: Détection état initial (doit être DRAFT)
    console.log(`[BUILD] CALL 4: Detecting initial state...`);
    const initialState = await detectDraftState(projectPath);
    
    if (!initialState.success) {
      console.log(`[BUILD] Initial state detection failed: ${initialState.error}`);
      return {
        success: false,
        error: `State detection failed: ${initialState.error}`
      };
    }
    
    if (!initialState.data.isDraft) {
      console.log(`[BUILD] Project is not in DRAFT state`);
      return {
        success: false,
        error: `Project must be in DRAFT state. Current evidence: ${initialState.data.conflicts.join(', ')}`
      };
    }
    
    console.log(`[BUILD] Initial state confirmed: DRAFT`);
    
    // CALL 5: Lecture des données projet
    console.log(`[BUILD] CALL 5: Reading project data...`);
    const projectData = await loadProjectForBuild(projectId);
    
    if (!projectData.success) {
      console.log(`[BUILD] Project data loading failed: ${projectData.error}`);
      return {
        success: false,
        error: `Project data loading failed: ${projectData.error}`
      };
    }
    
    console.log(`[BUILD] Project data loaded successfully`);
    
    // CALL 6: Validation pre-build
    if (!config.skipValidation) {
      console.log(`[BUILD] CALL 6: Pre-build validation...`);
      const prebuildValidation = validateProjectForBuild(projectData.data);
      
      if (!prebuildValidation.valid) {
        console.log(`[BUILD] Pre-build validation failed: ${prebuildValidation.error}`);
        return {
          success: false,
          error: `Pre-build validation failed: ${prebuildValidation.error}`
        };
      }
      
      console.log(`[BUILD] Pre-build validation passed`);
    }
    
    // CALL 7: Chargement des templates de code
    console.log(`[BUILD] CALL 7: Loading code templates...`);
    const codeTemplates = await loadCodeTemplates(config.targets || ['app-visitor']);
    
    if (!codeTemplates.success) {
      console.log(`[BUILD] Code templates loading failed: ${codeTemplates.error}`);
      return {
        success: false,
        error: `Code templates loading failed: ${codeTemplates.error}`
      };
    }
    
    console.log(`[BUILD] Code templates loaded: ${Object.keys(codeTemplates.data.templates).length} files`);
    
    // CALL 8: Génération des variables pour templates
    console.log(`[BUILD] CALL 8: Generating template variables...`);
    const templateVariables = generateBuildVariables(projectData.data, config);
    
    console.log(`[BUILD] Template variables generated`);
    
    // CALL 9: Compilation et génération de code
    console.log(`[BUILD] CALL 9: Compiling and generating code...`);
    const buildResult = await compileProjectCode(
      projectData.data,
      codeTemplates.data.templates,
      templateVariables,
      config
    );
    
    if (!buildResult.success) {
      console.log(`[BUILD] Code compilation failed: ${buildResult.error}`);
      return {
        success: false,
        error: `Code compilation failed: ${buildResult.error}`
      };
    }
    
    console.log(`[BUILD] Code generated successfully: ${buildResult.data.generatedFiles.length} files`);
    
    // CALL 10: Mise à jour du state du projet
    console.log(`[BUILD] CALL 10: Updating project state...`);
    const updatedProject = {
      ...projectData.data,
      state: 'BUILT',
      lastModified: new Date().toISOString(),
      build: {
        builtAt: new Date().toISOString(),
        version: generateBuildVersion(),
        targets: config.targets || ['app-visitor'],
        production: config.production || false,
        generatedFiles: buildResult.data.generatedFiles.length
      }
    };
    
    const projectFilePath = getProjectFilePath(projectId);
    const updateResult = await writePath(projectFilePath, updatedProject, {
      jsonIndent: 2
    });
    
    if (!updateResult.success) {
      console.log(`[BUILD] Project state update failed: ${updateResult.error}`);
      return {
        success: false,
        error: `Project state update failed: ${updateResult.error}`
      };
    }
    
    console.log(`[BUILD] Project state updated to BUILT`);
    
    // CALL 11: Vérification état final
    console.log(`[BUILD] CALL 11: Verifying final state...`);
    const finalState = await detectBuiltState(projectPath);
    
    if (!finalState.success || !finalState.data.isBuilt) {
      console.log(`[BUILD] Final state verification failed`);
      return {
        success: false,
        error: `Build completed but state verification failed`
      };
    }
    
    const duration = Date.now() - startTime;
    console.log(`[BUILD] Workflow completed successfully in ${duration}ms`);
    
    // CALL 12: Construction de la réponse
    return {
      success: true,
      data: {
        project: updatedProject,
        build: buildResult.data,
        workflow: {
          action: 'BUILD',
          projectId,
          duration,
          initialState: 'DRAFT',
          finalState: 'BUILT',
          targetsBuilt: config.targets || ['app-visitor'],
          buildVersion: updatedProject.build.version,
          completedAt: new Date().toISOString()
        }
      }
    };
    
  } catch (error) {
    console.log(`[BUILD] Unexpected workflow error: ${error.message}`);
    
    return {
      success: false,
      error: `Build workflow failed: ${error.message}`,
      errorCode: error.code || 'BUILD_ERROR'
    };
  }
}

/**
 * Charge les données projet pour build (logique intégrée BUILD)
 * @param {string} projectId - ID du projet
 * @returns {Promise<{success: boolean, data: object}>} Données projet
 * @private
 */
async function loadProjectForBuild(projectId) {
  console.log(`[BUILD] Loading project for build: ${projectId}`);
  
  try {
    const projectFilePath = getProjectFilePath(projectId);
    
    const projectFile = await readPath(projectFilePath, {
      parseJson: true
    });
    
    if (!projectFile.success) {
      return {
        success: false,
        error: `Project file read failed: ${projectFile.error}`
      };
    }
    
    if (!projectFile.data.exists) {
      return {
        success: false,
        error: 'Project file does not exist'
      };
    }
    
    if (projectFile.data.jsonError) {
      return {
        success: false,
        error: `Project JSON parsing failed: ${projectFile.data.jsonError}`
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
 * Charge les templates de code nécessaires au build
 * @param {string[]} targets - Services cibles à générer
 * @returns {Promise<{success: boolean, data: object}>} Templates chargés
 * @private
 */
async function loadCodeTemplates(targets) {
  console.log(`[BUILD] Loading code templates for targets: ${targets.join(', ')}`);
  
  try {
    const templates = {};
    const loadErrors = [];
    
    // Import dynamique pour éviter les dépendances circulaires
    const { readDirectory } = await import('../../cores/reader.js');
    
    for (const target of targets) {
      const targetPath = join(PATHS.codeTemplates, target);
      
      console.log(`[BUILD] Scanning templates for ${target}: ${targetPath}`);
      
      const targetTemplates = await scanTemplatesRecursive(targetPath, '');
      
      if (targetTemplates.success) {
        Object.assign(templates, targetTemplates.data);
        console.log(`[BUILD] Loaded ${Object.keys(targetTemplates.data).length} templates for ${target}`);
      } else {
        loadErrors.push(`${target}: ${targetTemplates.error}`);
      }
    }
    
    if (Object.keys(templates).length === 0) {
      return {
        success: false,
        error: `No templates found. Errors: ${loadErrors.join(', ')}`
      };
    }
    
    if (loadErrors.length > 0) {
      console.log(`[BUILD] Some template loading errors: ${loadErrors.join(', ')}`);
    }
    
    return {
      success: true,
      data: {
        templates,
        loadErrors: loadErrors.length > 0 ? loadErrors : undefined
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Code templates loading failed: ${error.message}`
    };
  }
}

/**
 * Scan récursif des templates dans un dossier
 * @param {string} basePath - Chemin de base
 * @param {string} relativePath - Chemin relatif courant
 * @returns {Promise<{success: boolean, data: object}>} Templates trouvés
 * @private
 */
async function scanTemplatesRecursive(basePath, relativePath) {
  try {
    const { readDirectory } = await import('../../cores/reader.js');
    const fullPath = relativePath ? join(basePath, relativePath) : basePath;
    
    const dirResult = await readDirectory(fullPath);
    
    if (!dirResult.success) {
      return {
        success: false,
        error: `Directory scan failed: ${dirResult.error}`
      };
    }
    
    const templates = {};
    
    for (const item of dirResult.data.items) {
      const itemRelativePath = relativePath ? 
        join(relativePath, item.name).replace(/\\/g, '/') : 
        item.name;
      
      if (item.isDirectory) {
        // Scan récursif des sous-dossiers
        const subResult = await scanTemplatesRecursive(basePath, itemRelativePath);
        
        if (subResult.success) {
          Object.assign(templates, subResult.data);
        }
        
      } else if (item.isFile && item.name.endsWith('.hbs')) {
        // Lecture du template
        const templatePath = join(fullPath, item.name);
        const templateFile = await readPath(templatePath);
        
        if (templateFile.success && templateFile.data.exists) {
          // Clé sans extension .hbs
          const templateKey = itemRelativePath.replace(/\.hbs$/, '');
          templates[templateKey] = templateFile.data.content;
          
          console.log(`[BUILD] Template loaded: ${templateKey}`);
        }
      }
    }
    
    return {
      success: true,
      data: templates
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Template scan failed: ${error.message}`
    };
  }
}

/**
 * Génère les variables pour les templates de build
 * @param {object} projectData - Données du projet
 * @param {object} config - Configuration de build
 * @returns {object} Variables pour templates
 * @private
 */
function generateBuildVariables(projectData, config) {
  console.log(`[BUILD] Generating template variables`);
  
  const now = new Date();
  
  return {
    project: {
      id: projectData.id,
      name: projectData.name,
      description: projectData.description,
      pages: projectData.pages || [],
      metadata: projectData.metadata || {}
    },
    build: {
      timestamp: now.toISOString(),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      production: config.production || false,
      minify: config.minify !== false,
      version: generateBuildVersion()
    },
    config: {
      targets: config.targets || ['app-visitor'],
      ...config
    }
  };
}

/**
 * Compile et génère le code du projet
 * @param {object} projectData - Données du projet
 * @param {object} templates - Templates chargés
 * @param {object} variables - Variables pour compilation
 * @param {object} config - Configuration de build
 * @returns {Promise<{success: boolean, data: object}>} Résultat de compilation
 * @private
 */
async function compileProjectCode(projectData, templates, variables, config) {
  console.log(`[BUILD] Starting code compilation`);
  
  try {
    const generatedFiles = [];
    const compilationErrors = [];
    const outputPath = getProjectPath(projectData.id);
    
    // Compilation de chaque template
    for (const [templatePath, templateContent] of Object.entries(templates)) {
      console.log(`[BUILD] Compiling template: ${templatePath}`);
      
      try {
        // Compilation simple (sans Handlebars pour l'instant)
        const compiledContent = compileTemplateContent(templateContent, variables);
        
        // Détermination du chemin de sortie
        const outputFilePath = join(outputPath, templatePath);
        
        // Écriture du fichier généré
        const writeResult = await writePath(outputFilePath, compiledContent, {
          createDirs: true
        });
        
        if (writeResult.success) {
          generatedFiles.push({
            template: templatePath,
            outputPath: outputFilePath,
            size: writeResult.data.size
          });
          console.log(`[BUILD] File generated: ${templatePath}`);
        } else {
          compilationErrors.push(`${templatePath}: ${writeResult.error}`);
        }
        
      } catch (templateError) {
        compilationErrors.push(`${templatePath}: ${templateError.message}`);
        console.log(`[BUILD] Template compilation error: ${templatePath} - ${templateError.message}`);
      }
    }
    
    if (generatedFiles.length === 0) {
      return {
        success: false,
        error: `No files generated. Errors: ${compilationErrors.join(', ')}`
      };
    }
    
    console.log(`[BUILD] Compilation completed: ${generatedFiles.length} files generated`);
    
    return {
      success: true,
      data: {
        generatedFiles,
        compilationErrors: compilationErrors.length > 0 ? compilationErrors : undefined,
        outputPath
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Code compilation failed: ${error.message}`
    };
  }
}

/**
 * Compile le contenu d'un template avec les variables
 * @param {string} templateContent - Contenu du template
 * @param {object} variables - Variables de remplacement
 * @returns {string} Contenu compilé
 * @private
 */
function compileTemplateContent(templateContent, variables) {
  // Remplacement simple des variables {{variable}}
  let compiled = templateContent;
  
  // Remplacement des variables de projet
  compiled = compiled.replace(/\{\{project\.id\}\}/g, variables.project.id || '');
  compiled = compiled.replace(/\{\{project\.name\}\}/g, variables.project.name || '');
  compiled = compiled.replace(/\{\{project\.description\}\}/g, variables.project.description || '');
  
  // Remplacement des variables de build
  compiled = compiled.replace(/\{\{build\.timestamp\}\}/g, variables.build.timestamp || '');
  compiled = compiled.replace(/\{\{build\.version\}\}/g, variables.build.version || '');
  compiled = compiled.replace(/\{\{build\.date\}\}/g, variables.build.date || '');
  
  return compiled;
}

/**
 * Génère une version de build unique
 * @returns {string} Version de build
 * @private
 */
function generateBuildVersion() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:\-T]/g, '').slice(0, 14);
  const random = Math.random().toString(36).substring(2, 5);
  return `${timestamp}-${random}`;
}

/**
 * Validation des paramètres d'entrée du workflow BUILD
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
  if (config.targets !== undefined) {
    if (!Array.isArray(config.targets)) {
      return { valid: false, error: 'config.targets must be an array' };
    }
    
    if (config.targets.length === 0) {
      return { valid: false, error: 'config.targets cannot be empty' };
    }
    
    const validTargets = ['app-visitor', 'app-server'];
    for (const target of config.targets) {
      if (!validTargets.includes(target)) {
        return { 
          valid: false, 
          error: `Invalid target: ${target}. Valid targets: ${validTargets.join(', ')}` 
        };
      }
    }
  }
  
  return { valid: true };
}

/**
 * Validation du projet pour le build
 * @param {object} projectData - Données du projet
 * @returns {{valid: boolean, error?: string}} Résultat de validation
 * @private
 */
function validateProjectForBuild(projectData) {
  if (!projectData || typeof projectData !== 'object') {
    return { valid: false, error: 'projectData must be an object' };
  }
  
  // Validation champs requis
  const requiredFields = ['id', 'name', 'state', 'pages'];
  for (const field of requiredFields) {
    if (!projectData[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  // Validation état
  if (projectData.state !== 'DRAFT') {
    return { valid: false, error: 'Project must be in DRAFT state for build' };
  }
  
  // Validation pages
  if (!Array.isArray(projectData.pages)) {
    return { valid: false, error: 'Project pages must be an array' };
  }
  
  if (projectData.pages.length === 0) {
    return { valid: false, error: 'Project must have at least one page' };
  }
  
  // Validation basique de chaque page
  for (let i = 0; i < projectData.pages.length; i++) {
    const page = projectData.pages[i];
    if (!page.id || !page.name) {
      return { valid: false, error: `Page ${i} missing required id or name` };
    }
  }
  
  return { valid: true };
}

console.log(`[BUILD] Build coordinator loaded successfully - PIXEL PERFECT VERSION`);