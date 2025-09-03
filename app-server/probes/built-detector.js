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
  // 1. DÉBUT
  console.log(`${LOG_COLORS.BUILT}[BUILT-DETECTOR] Detecting BUILT state for ${basename(projectPath)}${LOG_COLORS.reset}`);
  
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
    
    // 2. RÉSULTAT (succès ou échec)
    if (isBuilt) {
      console.log(`${LOG_COLORS.success}[BUILT-DETECTOR] BUILT confirmed (${confidence}% confidence)${LOG_COLORS.reset}`);
    } else if (conflicts.length > 0) {
      console.log(`${LOG_COLORS.error}[BUILT-DETECTOR] Not BUILT: ${conflicts[0]}${LOG_COLORS.reset}`);
    } else {
      console.log(`${LOG_COLORS.warning}[BUILT-DETECTOR] Not BUILT (${confidence}% confidence)${LOG_COLORS.reset}`);
    }
    
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
    return {
      success: false,
      error: 'projectId must be non-empty string'
    };
  }
  
  const projectPath = getProjectPath(projectId);
  return await detectBuiltState(projectPath);
}

/**
 * Vérification rapide BUILT (version performance)
 * @param {string} projectPath - Chemin vers le projet
 * @returns {Promise<{success: boolean, data: {isBuilt: boolean}}>} Résultat simplifié
 */
export async function quickBuiltCheck(projectPath) {
  try {
    const projectId = basename(projectPath);
    const projectFilePath = getProjectFilePath(projectId);
    
    const projectFile = await readPath(projectFilePath, { 
      parseJson: true, 
      required: false 
    });
    
    if (!projectFile.success || !projectFile.data.exists || projectFile.data.jsonError) {
      return { success: true, data: { isBuilt: false } };
    }
    
    const projectData = projectFile.data.parsed;
    const stateIsBuilt = projectData.state === 'BUILT';
    const hasArtifacts = await quickArtifactsCheck(projectPath);
    
    return {
      success: true,
      data: {
        isBuilt: stateIsBuilt && hasArtifacts
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Quick BUILT check failed: ${error.message}`
    };
  }
}

/**
 * Recherche les artifacts de build dans le projet
 * @param {string} projectPath - Chemin du projet
 * @returns {Promise<{hasArtifacts: boolean, foundArtifacts: Array}>} Résultat de scan
 * @private
 */
async function scanForBuildArtifacts(projectPath) {
  const foundArtifacts = [];
  
  try {
    // Services possibles générés par le build
    const possibleServices = ['front', 'api', 'back', 'database', 'admin'];
    
    for (const service of possibleServices) {
      const servicePath = `${projectPath}/${service}`;
      
      try {
        const serviceExists = await checkFileAccess(servicePath);
        if (!serviceExists.accessible) continue;
        
        // Scanner le service
        const serviceContent = await readDirectory(servicePath);
        if (serviceContent.success) {
          // Ajouter tous les fichiers du service
          for (const item of serviceContent.data.items) {
            foundArtifacts.push({
              path: `${service}/${item.name}`,
              type: item.isDirectory ? 'directory' : 'file',
              fullPath: `${servicePath}/${item.name}`
            });
          }
          
          // Scanner les sous-dossiers
          const subDirs = serviceContent.data.items.filter(item => item.isDirectory);
          for (const subDir of subDirs) {
            const subDirPath = `${servicePath}/${subDir.name}`;
            try {
              const subDirContent = await readDirectory(subDirPath);
              if (subDirContent.success) {
                for (const subItem of subDirContent.data.items) {
                  foundArtifacts.push({
                    path: `${service}/${subDir.name}/${subItem.name}`,
                    type: 'file',
                    fullPath: `${subDirPath}/${subItem.name}`
                  });
                }
              }
            } catch (error) {
              // Ignorer les erreurs de sous-dossiers
            }
          }
        }
      } catch (error) {
        // Ignorer les erreurs de services
      }
    }
  } catch (error) {
    // Ignorer les erreurs générales
  }
  
  return {
    hasArtifacts: foundArtifacts.length > 0,
    foundArtifacts
  };
}

/**
 * Analyse la structure de répertoire pour détecter un état BUILT
 * @param {string} projectPath - Chemin du projet
 * @returns {Promise<{isBuiltLike: boolean, reason: string}>} Analyse
 * @private
 */
async function analyzeBuiltDirectoryStructure(projectPath) {
  try {
    const dirContent = await readDirectory(projectPath);
    
    if (!dirContent.success) {
      return {
        isBuiltLike: false,
        reason: 'Directory not readable'
      };
    }
    
    const files = dirContent.data.items.filter(item => item.isFile);
    const dirs = dirContent.data.items.filter(item => item.isDirectory);
    
    // Doit avoir project.json
    const hasProjectFile = files.some(file => file.name === 'project.json');
    
    if (!hasProjectFile) {
      return {
        isBuiltLike: false,
        reason: 'Missing project.json file'
      };
    }
    
    // Chercher les services générés
    const serviceDirectories = ['front', 'api', 'back', 'database', 'admin'];
    const foundServices = dirs.filter(dir => serviceDirectories.includes(dir.name));
    
    if (foundServices.length > 0) {
      return {
        isBuiltLike: true,
        reason: `Contains ${foundServices.length} generated service(s): ${foundServices.map(s => s.name).join(', ')}`
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

console.log(`${LOG_COLORS.BUILT}[BUILT-DETECTOR] BUILT detector loaded${LOG_COLORS.reset}`);