/**
 * Détecteur d'état BUILT - VERSION PIXEL PARFAIT
 * @module built-detector
 * @description Détermine si un projet est dans l'état BUILT (compilé, prêt à déployer)
 */

import { readPath, checkFileAccess, readDirectory } from '../cores/reader.js';
import { getProjectPath, getProjectFilePath } from '../cores/paths.js';
import { basename } from 'path';

/**
 * Détecte si un projet est dans l'état BUILT
 * @param {string} projectPath - Chemin vers le dossier du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat de détection
 * 
 * @example
 * const result = await detectBuiltState('./outputs/mon-projet');
 * if (result.success && result.data.isBuilt) {
 *   console.log('Projet compilé, déploiement possible');
 * }
 */
export async function detectBuiltState(projectPath) {
  console.log(`[BUILT-DETECTOR] Detecting BUILT state for: ${projectPath}`);
  
  // Validation des paramètres
  const validation = validateBuiltDetectionInput(projectPath);
  if (!validation.valid) {
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
    
    // CRITÈRE 1: Le fichier project.json doit exister avec state BUILT
    const projectId = basename(projectPath);
    const projectFilePath = getProjectFilePath(projectId);
    
    console.log(`[BUILT-DETECTOR] Checking project file: ${projectFilePath}`);
    const projectFileResult = await readPath(projectFilePath, { 
      parseJson: true, 
      includeStats: true 
    });
    
    if (!projectFileResult.success || !projectFileResult.data.exists) {
      conflicts.push('Project file does not exist');
      console.log(`[BUILT-DETECTOR] Project file not found`);
    } else {
      evidence.push('Project file exists');
      
      // Vérification du parsing JSON
      if (projectFileResult.data.jsonError) {
        conflicts.push(`Project file has invalid JSON: ${projectFileResult.data.jsonError}`);
      } else if (projectFileResult.data.parsed) {
        projectData = projectFileResult.data.parsed;
        evidence.push('Project file contains valid JSON');
        
        // CRITÈRE 2: Le state doit être BUILT
        if (projectData.state === 'BUILT') {
          evidence.push('Project state is BUILT');
          console.log(`[BUILT-DETECTOR] Project state confirmed: BUILT`);
          
          // CRITÈRE 3: Doit avoir des métadonnées de build
          if (projectData.build) {
            evidence.push('Project has build metadata');
            
            if (projectData.build.builtAt) {
              evidence.push('Build timestamp present');
            } else {
              conflicts.push('Missing build timestamp');
            }
            
            if (projectData.build.version) {
              evidence.push('Build version present');
            } else {
              conflicts.push('Missing build version');
            }
            
          } else {
            conflicts.push('Missing build metadata');
          }
          
        } else {
          conflicts.push(`Project state is ${projectData.state || 'undefined'}, not BUILT`);
        }
        
      } else {
        conflicts.push('Project file exists but contains no parseable content');
      }
    }
    
    // CRITÈRE 4: Doit avoir des artifacts de build (fichiers générés)
    const buildArtifactsCheck = await checkBuildArtifacts(projectPath);
    if (buildArtifactsCheck.hasArtifacts) {
      evidence.push(`Build artifacts found: ${buildArtifactsCheck.foundArtifacts.length} files`);
      buildArtifacts = buildArtifactsCheck.foundArtifacts;
    } else {
      conflicts.push('No build artifacts found');
    }
    
    // CRITÈRE 5: Validation de la cohérence des artifacts
    if (buildArtifacts.length > 0 && projectData?.build) {
      const expectedFiles = projectData.build.generatedFiles || 0;
      if (buildArtifacts.length >= expectedFiles) {
        evidence.push('Build artifacts count matches metadata');
      } else {
        conflicts.push(`Expected ${expectedFiles} files, found ${buildArtifacts.length}`);
      }
    }
    
    // CRITÈRE 6: Dossier de build doit exister et contenir des fichiers
    const directoryAnalysis = await analyzeBuiltDirectoryStructure(projectPath);
    if (directoryAnalysis.isBuiltLike) {
      evidence.push('Directory structure indicates BUILT state');
    } else {
      conflicts.push(`Directory structure not consistent with BUILT: ${directoryAnalysis.reason}`);
    }
    
    // DÉTERMINATION FINALE
    const isBuilt = conflicts.length === 0 && evidence.length >= 4;
    const confidence = isBuilt ? 
      Math.min(90 + evidence.length * 2, 100) : 
      Math.max(5, 100 - conflicts.length * 20);
    
    console.log(`[BUILT-DETECTOR] Detection result: ${isBuilt ? 'BUILT' : 'NOT_BUILT'} (confidence: ${confidence}%)`);
    
    const result = {
      isBuilt,
      confidence,
      evidence,
      conflicts,
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
        files: buildArtifacts.slice(0, 10), // Limite à 10 pour éviter surcharge
        hasMore: buildArtifacts.length > 10
      },
      criteria: {
        hasProjectFile: projectFileResult.success && projectFileResult.data.exists,
        validJson: projectData !== null,
        correctState: projectData?.state === 'BUILT',
        hasBuildMetadata: projectData?.build !== undefined,
        hasBuildArtifacts: buildArtifacts.length > 0,
        consistentStructure: directoryAnalysis.isBuiltLike
      },
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
    console.log(`[BUILT-DETECTOR] Detection failed: ${error.message}`);
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
  console.log(`[BUILT-DETECTOR] Detecting BUILT state by ID: ${projectId}`);
  
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
  console.log(`[BUILT-DETECTOR] Quick BUILT check for: ${projectPath}`);
  
  try {
    const projectId = basename(projectPath);
    const projectFilePath = getProjectFilePath(projectId);
    
    // Check minimal : existence + parsing + state + artifacts
    const fileResult = await readPath(projectFilePath, { parseJson: true });
    
    if (!fileResult.success || !fileResult.data.exists) {
      return {
        success: true,
        data: {
          isBuilt: false,
          reason: 'Project file does not exist'
        }
      };
    }
    
    if (fileResult.data.jsonError || !fileResult.data.parsed) {
      return {
        success: true,
        data: {
          isBuilt: false,
          reason: 'Project file has invalid JSON'
        }
      };
    }
    
    const projectData = fileResult.data.parsed;
    if (projectData.state !== 'BUILT') {
      return {
        success: true,
        data: {
          isBuilt: false,
          reason: `Project state is ${projectData.state}, not BUILT`
        }
      };
    }
    
    // Vérification rapide des artifacts
    const hasArtifacts = await quickArtifactsCheck(projectPath);
    
    return {
      success: true,
      data: {
        isBuilt: hasArtifacts,
        reason: hasArtifacts ? 
          'Project state is BUILT with artifacts' : 
          'Project state is BUILT but no artifacts found'
      }
    };
    
  } catch (error) {
    console.log(`[BUILT-DETECTOR] Quick check failed: ${error.message}`);
    return {
      success: false,
      error: `Quick BUILT check failed: ${error.message}`
    };
  }
}

/**
 * Vérifie la présence d'artifacts de build
 * @param {string} projectPath - Chemin du projet
 * @returns {Promise<{hasArtifacts: boolean, foundArtifacts: string[]}>}
 * @private
 */
async function checkBuildArtifacts(projectPath) {
  const buildIndicators = [
    'package.json',
    'index.js',
    'index.html',
    'src/index.js',
    'src/App.jsx',
    'public/index.html',
    'dist/',
    'build/'
  ];
  
  const foundArtifacts = [];
  
  for (const indicator of buildIndicators) {
    const indicatorPath = `${projectPath}/${indicator}`;
    
    const exists = await checkFileAccess(indicatorPath);
    if (exists.accessible) {
      foundArtifacts.push({
        path: indicator,
        type: indicator.endsWith('/') ? 'directory' : 'file',
        fullPath: indicatorPath
      });
    }
  }
  
  // Scan du dossier src/ si il existe
  const srcPath = `${projectPath}/src`;
  const srcExists = await checkFileAccess(srcPath);
  if (srcExists.accessible) {
    try {
      const srcContent = await readDirectory(srcPath);
      if (srcContent.success && srcContent.data.items.length > 0) {
        foundArtifacts.push({
          path: `src/ (${srcContent.data.items.length} items)`,
          type: 'directory_content',
          fullPath: srcPath
        });
      }
    } catch (srcError) {
      console.log(`[BUILT-DETECTOR] Error scanning src directory: ${srcError.message}`);
    }
  }
  
  return {
    hasArtifacts: foundArtifacts.length > 0,
    foundArtifacts
  };
}

/**
 * Analyse la structure du dossier pour vérifier cohérence BUILT
 * @param {string} projectPath - Chemin du projet
 * @returns {Promise<{isBuiltLike: boolean, reason: string}>}
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
    
    // Un projet BUILT devrait avoir des fichiers générés
    const hasGeneratedFiles = files.some(file => 
      ['package.json', 'index.js', 'index.html'].includes(file.name)
    );
    
    // Peut avoir des dossiers de build
    const hasBuildDirs = dirs.some(dir => 
      ['src', 'public', 'dist', 'build'].includes(dir.name)
    );
    
    // Doit avoir le project.json
    const hasProjectFile = files.some(file => file.name === 'project.json');
    
    if (!hasProjectFile) {
      return {
        isBuiltLike: false,
        reason: 'Missing project.json file'
      };
    }
    
    if (hasGeneratedFiles || hasBuildDirs) {
      return {
        isBuiltLike: true,
        reason: 'Contains generated files and/or build directories'
      };
    }
    
    if (files.length === 1 && hasProjectFile) {
      return {
        isBuiltLike: false,
        reason: 'Only contains project.json (looks like DRAFT)'
      };
    }
    
    return {
      isBuiltLike: true,
      reason: `Contains ${files.length} files and ${dirs.length} directories`
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
  // Check juste les indicateurs principaux
  const mainIndicators = ['package.json', 'index.js', 'src/'];
  
  for (const indicator of mainIndicators) {
    const indicatorPath = `${projectPath}/${indicator}`;
    const exists = await checkFileAccess(indicatorPath);
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

console.log(`[BUILT-DETECTOR] BUILT detector loaded successfully - PIXEL PERFECT VERSION`);