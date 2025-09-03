/**
 * Détecteur d'état VOID - VERSION PIXEL PARFAIT
 * @module void-detector
 * @description Détermine si un projet est dans l'état VOID (inexistant)
 */

import { readPath, checkFileAccess } from '../cores/reader.js';
import { getProjectPath, getProjectFilePath } from '../cores/paths.js';
import { LOG_COLORS } from '../cores/constants.js';
import { basename } from 'path';

/**
 * Détecte si un projet est dans l'état VOID
 * @param {string} projectPath - Chemin vers le dossier du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat de détection
 * 
 * @example
 * const result = await detectVoidState('./outputs/mon-projet');
 * if (result.success && result.data.isVoid) {
 *   console.log('Projet inexistant, création possible');
 * }
 */
export async function detectVoidState(projectPath) {
  // Validation des paramètres
  const validation = validateVoidDetectionInput(projectPath);
  if (!validation.valid) {
    console.log(`${LOG_COLORS.error}[VOID-DETECTOR] Invalid input: ${validation.error}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: validation.error
    };
  }

  try {
    const evidence = [];
    const conflicts = [];
    
    // CRITÈRE 1: Le dossier projet ne doit pas exister
    const directoryAccess = await checkFileAccess(projectPath);
    
    if (directoryAccess.accessible) {
      conflicts.push('Project directory exists');
    } else {
      evidence.push('Project directory does not exist');
    }
    
    // CRITÈRE 2: Le fichier project.json ne doit pas exister
    const projectFilePath = getProjectFilePath(basename(projectPath));
    const projectFileAccess = await checkFileAccess(projectFilePath);
    
    if (projectFileAccess.accessible) {
      conflicts.push('Project file exists');
      
      // Analyse du contenu si accessible
      const fileContent = await readPath(projectFilePath, { parseJson: true });
      if (fileContent.success && fileContent.data.parsed) {
        conflicts.push(`Project has state: ${fileContent.data.parsed.state || 'unknown'}`);
      }
    } else {
      evidence.push('Project file does not exist');
    }
    
    // CRITÈRE 3: Aucun fichier de build ne doit exister
    const buildIndicators = [
      'package.json',
      'index.js',
      'src/',
      'dist/',
      'build/'
    ];
    
    for (const indicator of buildIndicators) {
      const indicatorPath = `${projectPath}/${indicator}`;
      const indicatorAccess = await checkFileAccess(indicatorPath);
      
      if (indicatorAccess.accessible) {
        conflicts.push(`Build indicator exists: ${indicator}`);
      } else {
        evidence.push(`No build indicator: ${indicator}`);
      }
    }
    
    // DÉTERMINATION FINALE
    const isVoid = conflicts.length === 0;
    const confidence = isVoid ? 
      Math.min(95 + evidence.length * 2, 100) : 
      Math.max(5, 100 - conflicts.length * 20);
    
    const result = {
      isVoid,
      confidence,
      evidence,
      conflicts,
      criteria: {
        noDirectory: !directoryAccess.accessible,
        noProjectFile: !projectFileAccess.accessible,
        noBuildFiles: buildIndicators.every(async indicator => {
          const access = await checkFileAccess(`${projectPath}/${indicator}`);
          return !access.accessible;
        })
      },
      checkedPaths: {
        projectPath,
        projectFile: projectFilePath,
        buildIndicators: buildIndicators.map(i => `${projectPath}/${i}`)
      },
      detectedAt: new Date().toISOString()
    };
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    console.log(`${LOG_COLORS.error}[VOID-DETECTOR] Detection failed: ${error.message}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: `VOID state detection failed: ${error.message}`,
      errorCode: error.code
    };
  }
}

/**
 * Détecte l'état VOID par ID de projet (helper)
 * @param {string} projectId - ID du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat de détection
 * 
 * @example
 * const result = await detectVoidStateById('mon-projet');
 */
export async function detectVoidStateById(projectId) {
  // Validation projectId
  if (!projectId || typeof projectId !== 'string') {
    console.log(`${LOG_COLORS.error}[VOID-DETECTOR] Invalid project ID: must be non-empty string${LOG_COLORS.reset}`);
    return {
      success: false,
      error: 'projectId must be non-empty string'
    };
  }
  
  const projectPath = getProjectPath(projectId);
  return await detectVoidState(projectPath);
}

/**
 * Analyse rapide VOID (version allégée pour performance)
 * @param {string} projectPath - Chemin vers le projet
 * @returns {Promise<{success: boolean, data: {isVoid: boolean}}>} Résultat simplifié
 * 
 * @example
 * const result = await quickVoidCheck('./outputs/test-project');
 * if (result.data.isVoid) console.log('Projet inexistant');
 */
export async function quickVoidCheck(projectPath) {
  try {
    // Check minimal : dossier + project.json
    const directoryExists = await checkFileAccess(projectPath);
    
    if (!directoryExists.accessible) {
      // Si le dossier n'existe pas, c'est VOID
      return {
        success: true,
        data: {
          isVoid: true,
          reason: 'Directory does not exist'
        }
      };
    }
    
    // Si le dossier existe, vérifier project.json
    const projectId = basename(projectPath);
    const projectFilePath = getProjectFilePath(projectId);
    const projectFileExists = await checkFileAccess(projectFilePath);
    
    return {
      success: true,
      data: {
        isVoid: !projectFileExists.accessible,
        reason: projectFileExists.accessible ? 'Project file exists' : 'Project file does not exist'
      }
    };
    
  } catch (error) {
    console.log(`${LOG_COLORS.error}[VOID-DETECTOR] Quick check failed: ${error.message}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: `Quick VOID check failed: ${error.message}`
    };
  }
}

/**
 * Valide les paramètres d'entrée de la détection VOID
 * @param {string} projectPath - Chemin à valider
 * @returns {{valid: boolean, error?: string}} Résultat de validation
 * @private
 */
function validateVoidDetectionInput(projectPath) {
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
  
  // Vérification de sécurité basique
  if (projectPath.includes('..') || projectPath.includes('~')) {
    return { 
      valid: false, 
      error: 'projectPath contains potentially unsafe characters' 
    };
  }
  
  return { valid: true };
}