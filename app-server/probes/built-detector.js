/**
 * Détecteur d'état BUILT - VERSION PIXEL PARFAIT
 * @module built-detector
 * @description Détermine si un projet est dans l'état BUILT (compilé, prêt à déployer)
 */

import { readPath, checkFileAccess, readDirectory } from '../cores/reader.js';
import { getProjectPath, getProjectFilePath } from '../cores/paths.js';
import { LOG_COLORS } from '../cores/constants.js';
import { basename } from 'path';

/**
 * Détecte si un projet est dans l'état BUILT
 * @param {string} projectPath - Chemin vers le dossier du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat de détection
 */
export async function detectBuiltState(projectPath) {
  // Validation des paramètres
  const validation = validateBuiltDetectionInput(projectPath);
  if (!validation.valid) {
    console.log(`${LOG_COLORS.error}[BUILT-DETECTOR] Invalid input: ${validation.error}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: validation.error
    };
  }

  try {
    const evidence = [];
    const conflicts = [];
    let projectData = null;
    let buildArtifacts = [];
    let confidence = 0;
    
    // CRITÈRE 1: Vérification du fichier project.json
    const projectId = basename(projectPath);
    const projectFilePath = getProjectFilePath(projectId);
    
    const projectFileResult = await readPath(projectFilePath, { 
      parseJson: true, 
      required: false 
    });
    
    let hasProjectFile = false;
    let hasValidJson = false;
    let hasBuiltState = false;
    
    if (projectFileResult.success && projectFileResult.data.exists) {
      hasProjectFile = true;
      evidence.push('Project file exists');
      confidence += 25;
      
      if (!projectFileResult.data.jsonError) {
        hasValidJson = true;
        projectData = projectFileResult.data.parsed;
        evidence.push('Valid JSON parsed');
        confidence += 25;
        
        if (projectData.state === 'BUILT') {
          hasBuiltState = true;
          evidence.push('Project state is BUILT');
          confidence += 30;
        } else {
          conflicts.push(`State is ${projectData.state}, expected BUILT`);
        }
        
        if (projectData.build) {
          evidence.push('Build metadata present');
          confidence += 10;
        }
      } else {
        conflicts.push('Invalid JSON in project file');
      }
    } else {
      conflicts.push('Project file not found');
    }
    
    // CRITÈRE 2: Vérification des artifacts de build
    const artifactsResult = await scanForBuildArtifacts(projectPath);
    buildArtifacts = artifactsResult.foundArtifacts;
    
    let hasArtifacts = false;
    if (artifactsResult.hasArtifacts) {
      hasArtifacts = true;
      evidence.push(`Build artifacts found: ${buildArtifacts.length} files`);
      confidence += 20;
    } else {
      conflicts.push('No build artifacts found');
    }
    
    // CRITÈRE 3: Analyse de la structure de répertoire  
    const directoryAnalysis = await analyzeBuiltDirectoryStructure(projectPath);
    if (directoryAnalysis.isBuiltLike) {
      evidence.push('Directory structure indicates BUILT state');
      confidence += 8;
    }
    
    // Calcul de la décision finale
    const criticalConflicts = conflicts.filter(c => 
      c.includes('not found') || c.includes('Invalid JSON')
    );
    
    confidence = Math.max(0, confidence - (criticalConflicts.length * 30));
    const isBuilt = confidence >= 75 && hasProjectFile && hasValidJson && hasBuiltState;
    
    const result = {
      isBuilt,
      confidence,
      evidence,
      conflicts,
      score: {
        total: confidence,
        breakdown: {
          projectFile: hasProjectFile ? 25 : 0,
          validJson: hasValidJson ? 25 : 0,
          builtState: hasBuiltState ? 30 : 0,
          artifacts: hasArtifacts ? 20 : 0,
          criticalPenalties: criticalConflicts.length * 30
        }
      },
      projectData: projectData ? {
        id: projectData.id,
        name: projectData.name,
        state: projectData.state,
        builtAt: projectData.build?.builtAt,
        buildVersion: projectData.build?.version,
        targets: projectData.build?.targets || [],
        generatedFilesCount: projectData.build?.generatedFiles || 0
      } : null,
      buildArtifacts: {
        found: buildArtifacts.length,
        files: buildArtifacts.slice(0, 10),
        hasMore: buildArtifacts.length > 10
      },
      criteria: {
        hasProjectFile,
        validJson: hasValidJson,
        correctState: hasBuiltState,
        hasBuildMetadata: projectData?.build !== undefined,
        hasBuildArtifacts: hasArtifacts,
        consistentStructure: directoryAnalysis.isBuiltLike
      },
      directoryAnalysis,
      checkedPaths: {
        projectPath,
        projectFile: projectFilePath,
        buildDirectory: projectPath
      },
      detectedAt: new Date().toISOString()
    };
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    console.log(`${LOG_COLORS.error}[BUILT-DETECTOR] Detection failed: ${error.message}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: `BUILT state detection failed: ${error.message}`,
      errorCode: error.code
    };
  }
}

/**
 * Détecte l'état BUILT par ID de projet (helper)
 * @param {string} projectId - ID du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat de détection
 */
export async function detectBuiltStateById(projectId) {
  if (!projectId || typeof projectId !== 'string') {
    console.log(`${LOG_COLORS.error}[BUILT-DETECTOR] Invalid project ID: must be non-empty string${LOG_COLORS.reset}`);
    return {
      success: false,
      error: 'projectId must be non-empty string'
    };
  }
  
  const projectPath = getProjectPath(projectId);
  return await detectBuiltState(projectPath);
}

/**
 * Analyse rapide BUILT (version allégée pour performance)
 * @param {string} projectPath - Chemin vers le projet
 * @returns {Promise<{success: boolean, data: {isBuilt: boolean}}>} Résultat simplifié
 */
export async function quickBuiltCheck(projectPath) {
  try {
    // Check minimal : project.json + état BUILT
    const projectId = basename(projectPath);
    const projectFilePath = getProjectFilePath(projectId);
    
    const projectFile = await readPath(projectFilePath, { parseJson: true });
    
    if (!projectFile.success || !projectFile.data.exists) {
      return {
        success: true,
        data: {
          isBuilt: false,
          reason: 'Project file does not exist'
        }
      };
    }
    
    if (projectFile.data.jsonError) {
      return {
        success: true,
        data: {
          isBuilt: false,
          reason: 'Invalid project JSON'
        }
      };
    }
    
    const projectData = projectFile.data.parsed;
    const isBuilt = projectData.state === 'BUILT';
    
    return {
      success: true,
      data: {
        isBuilt,
        reason: isBuilt ? 'Project state is BUILT' : `Project state is ${projectData.state}`
      }
    };
    
  } catch (error) {
    console.log(`${LOG_COLORS.error}[BUILT-DETECTOR] Quick check failed: ${error.message}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: `Quick BUILT check failed: ${error.message}`
    };
  }
}

/**
 * Recherche des artifacts de build dans le projet
 * @param {string} projectPath - Chemin du projet
 * @returns {Promise<{hasArtifacts: boolean, foundArtifacts: Array}>} Résultat de scan
 * @private
 */
async function scanForBuildArtifacts(projectPath) {
  try {
    const buildIndicators = [
      'index.html',
      'package.json',
      'dist/',
      'build/',
      'app-visitor/',
      'app-server/',
      'front/',
      'api/',
      'back/'
    ];
    
    const foundArtifacts = [];
    
    for (const indicator of buildIndicators) {
      const indicatorPath = `${projectPath}/${indicator}`;
      const exists = await checkFileAccess(indicatorPath);
      
      if (exists.accessible) {
        foundArtifacts.push({
          name: indicator,
          path: indicatorPath,
          type: indicator.endsWith('/') ? 'directory' : 'file'
        });
      }
    }
    
    return {
      hasArtifacts: foundArtifacts.length > 0,
      foundArtifacts
    };
    
  } catch (error) {
    return {
      hasArtifacts: false,
      foundArtifacts: [],
      error: error.message
    };
  }
}

/**
 * Analyse la structure du répertoire pour déterminer si elle ressemble à un projet BUILT
 * @param {string} projectPath - Chemin du projet
 * @returns {Promise<{isBuiltLike: boolean, reason?: string}>} Résultat d'analyse
 * @private
 */
async function analyzeBuiltDirectoryStructure(projectPath) {
  try {
    const directoryContent = await readDirectory(projectPath, {
      includeStats: false,
      recursive: false
    });
    
    if (!directoryContent.success) {
      return {
        isBuiltLike: false,
        reason: 'Directory not accessible'
      };
    }
    
    const files = directoryContent.data.files || [];
    
    // Rechercher des services générés typiques
    const servicePatterns = ['app-visitor', 'app-server', 'front', 'api', 'back'];
    const foundServices = [];
    
    for (const file of files) {
      for (const pattern of servicePatterns) {
        if (file.name === pattern && file.type === 'directory') {
          foundServices.push({
            name: pattern,
            type: 'service'
          });
        }
      }
    }
    
    const hasProjectFile = files.some(f => f.name === 'project.json');
    
    if (foundServices.length > 0) {
      return {
        isBuiltLike: true,
        reason: `Found ${foundServices.length} generated service(s): ${foundServices.map(s => s.name).join(', ')}`
      };
    }
    
    if (files.length === 1 && hasProjectFile) {
      return {
        isBuiltLike: false,
        reason: 'Only contains project.json (looks like DRAFT)'
      };
    }
    
    return {
      isBuiltLike: false,
      reason: `No generated services found`
    };
    
  } catch (error) {
    return {
      isBuiltLike: false,
      reason: `Directory analysis failed: ${error.message}`
    };
  }
}

/**
 * Vérification rapide de la présence d'artifacts
 * @param {string} projectPath - Chemin du projet
 * @returns {Promise<boolean>} True si des artifacts sont trouvés
 * @private
 */
async function quickArtifactsCheck(projectPath) {
  const serviceDirectories = ['front', 'api', 'back', 'database', 'admin'];
  
  for (const service of serviceDirectories) {
    const servicePath = `${projectPath}/${service}`;
    const exists = await checkFileAccess(servicePath);
    if (exists.accessible) {
      return true;
    }
  }
  
  return false;
}

/**
 * Valide les paramètres d'entrée
 * @param {string} projectPath - Chemin à valider
 * @returns {{valid: boolean, error?: string}}
 * @private
 */
function validateBuiltDetectionInput(projectPath) {
  if (!projectPath || typeof projectPath !== 'string') {
    return { 
      valid: false, 
      error: 'projectPath must be non-empty string' 
    };
  }
  
  if (projectPath.trim().length === 0) {
    return { 
      valid: false, 
      error: 'projectPath cannot be empty or whitespace only' 
    };
  }
  
  return { valid: true };
}