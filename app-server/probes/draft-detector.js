/**
 * Détecteur d'état DRAFT - VERSION PIXEL PARFAIT
 * @module draft-detector
 * @description Détermine si un projet est dans l'état DRAFT (créé, éditable)
 */

import { readPath, checkFileAccess } from '../cores/reader.js';
import { getProjectPath, getProjectFilePath } from '../cores/paths.js';
import { LOG_COLORS } from '../cores/constants.js';
import { basename } from 'path';

/**
 * Détecte si un projet est dans l'état DRAFT
 * @param {string} projectPath - Chemin vers le dossier du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat de détection
 */
export async function detectDraftState(projectPath) {
  // 1. DÉBUT
  console.log(`${LOG_COLORS.DRAFT}[DRAFT-DETECTOR] Detecting DRAFT state for ${basename(projectPath)}${LOG_COLORS.reset}`);
  
  // Validation des paramètres
  const validation = validateDraftDetectionInput(projectPath);
  if (!validation.valid) {
    console.log(`${LOG_COLORS.error}[DRAFT-DETECTOR] Invalid input: ${validation.error}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: validation.error
    };
  }

  try {
    const evidence = [];
    const conflicts = [];
    let projectData = null;
    let confidence = 0;
    
    // CRITÈRE 1: Vérification du fichier project.json
    const projectId = basename(projectPath);
    const projectFilePath = getProjectFilePath(projectId);
    
    const projectFileResult = await readPath(projectFilePath, { 
      parseJson: true
    });
    
    let hasProjectFile = false;
    let hasValidJson = false;
    let hasDraftState = false;
    
    if (projectFileResult.success && projectFileResult.data.exists) {
      hasProjectFile = true;
      evidence.push('Project file exists');
      confidence += 25;
      
      if (!projectFileResult.data.jsonError && projectFileResult.data.parsed) {
        hasValidJson = true;
        projectData = projectFileResult.data.parsed;
        evidence.push('Valid JSON parsed');
        confidence += 25;
        
        if (projectData.state === 'DRAFT') {
          hasDraftState = true;
          evidence.push('Project state is DRAFT');
          confidence += 30;
        } else {
          conflicts.push(`State is ${projectData.state}, expected DRAFT`);
        }
        
        // Validation de la structure minimale
        const structureValidation = validateDraftStructure(projectData);
        if (structureValidation.valid) {
          evidence.push('Project has valid DRAFT structure');
          confidence += 10;
        } else {
          conflicts.push(`Invalid structure: ${structureValidation.error}`);
        }
      } else {
        conflicts.push('Invalid JSON in project file');
      }
    } else {
      conflicts.push('Project file not found');
    }
    
    // CRITÈRE 2: Vérification absence d'artifacts de build
    const buildChecks = await checkBuildArtifacts(projectPath);
    if (!buildChecks.hasArtifacts) {
      evidence.push('No build artifacts found');
      confidence += 10;
    } else {
      conflicts.push(`Build artifacts found: ${buildChecks.foundArtifacts.join(', ')}`);
    }
    
    // Calcul de la décision finale
    const criticalConflicts = conflicts.filter(c => 
      c.includes('not found') || c.includes('Invalid JSON') || c.includes('Build artifacts')
    );
    
    confidence = Math.max(0, confidence - (criticalConflicts.length * 30));
    const isDraft = confidence >= 75 && hasProjectFile && hasValidJson && hasDraftState;
    
    // 2. RÉSULTAT (succès ou échec)
    if (isDraft) {
      console.log(`${LOG_COLORS.success}[DRAFT-DETECTOR] DRAFT confirmed (${confidence}% confidence)${LOG_COLORS.reset}`);
    } else if (conflicts.length > 0) {
      console.log(`${LOG_COLORS.error}[DRAFT-DETECTOR] Not DRAFT: ${conflicts[0]}${LOG_COLORS.reset}`);
    } else {
      console.log(`${LOG_COLORS.warning}[DRAFT-DETECTOR] Not DRAFT (${confidence}% confidence)${LOG_COLORS.reset}`);
    }
    
    const result = {
      isDraft,
      confidence,
      evidence,
      conflicts,
      projectData: projectData ? {
        id: projectData.id,
        name: projectData.name,
        state: projectData.state,
        created: projectData.created,
        pageCount: projectData.pages?.length || 0
      } : null,
      criteria: {
        hasProjectFile,
        validJson: hasValidJson,
        correctState: hasDraftState,
        validStructure: projectData ? validateDraftStructure(projectData).valid : false,
        noBuildArtifacts: !buildChecks.hasArtifacts
      },
      checkedPaths: {
        projectPath,
        projectFile: projectFilePath,
        buildArtifacts: buildChecks.checkedPaths
      },
      detectedAt: new Date().toISOString()
    };
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    console.log(`${LOG_COLORS.error}[DRAFT-DETECTOR] Detection failed: ${error.message}${LOG_COLORS.reset}`);
    return {
      success: false,
      error: `DRAFT state detection failed: ${error.message}`,
      errorCode: error.code
    };
  }
}

/**
 * Détecte l'état DRAFT par ID de projet (helper)
 * @param {string} projectId - ID du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat de détection
 */
export async function detectDraftStateById(projectId) {
  if (!projectId || typeof projectId !== 'string') {
    return {
      success: false,
      error: 'projectId must be non-empty string'
    };
  }
  
  const projectPath = getProjectPath(projectId);
  return await detectDraftState(projectPath);
}

/**
 * Vérification rapide DRAFT (version performance)
 * @param {string} projectPath - Chemin vers le projet
 * @returns {Promise<{success: boolean, data: {isDraft: boolean}}>} Résultat simplifié
 */
export async function quickDraftCheck(projectPath) {
  try {
    const projectId = basename(projectPath);
    const projectFilePath = getProjectFilePath(projectId);
    
    // Check minimal : existence + parsing + state
    const fileResult = await readPath(projectFilePath, { parseJson: true });
    
    if (!fileResult.success || !fileResult.data.exists) {
      return {
        success: true,
        data: {
          isDraft: false,
          reason: 'Project file does not exist'
        }
      };
    }
    
    if (fileResult.data.jsonError || !fileResult.data.parsed) {
      return {
        success: true,
        data: {
          isDraft: false,
          reason: 'Project file has invalid JSON'
        }
      };
    }
    
    const isDraft = fileResult.data.parsed.state === 'DRAFT';
    return {
      success: true,
      data: {
        isDraft,
        reason: isDraft ? 'Project state is DRAFT' : `Project state is ${fileResult.data.parsed.state}`
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Quick DRAFT check failed: ${error.message}`
    };
  }
}

/**
 * Valide la structure minimale d'un projet DRAFT
 * @param {object} projectData - Données du projet à valider
 * @returns {{valid: boolean, error?: string}} Résultat de validation
 * @private
 */
function validateDraftStructure(projectData) {
  if (!projectData || typeof projectData !== 'object') {
    return { valid: false, error: 'projectData must be an object' };
  }
  
  // Champs obligatoires pour un projet DRAFT
  const requiredFields = ['id', 'name', 'state'];
  for (const field of requiredFields) {
    if (!projectData[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  // Le state doit être explicitement DRAFT
  if (projectData.state !== 'DRAFT') {
    return { valid: false, error: `State must be DRAFT, got: ${projectData.state}` };
  }
  
  // Validation optionnelle : pages array si présent
  if (projectData.pages && !Array.isArray(projectData.pages)) {
    return { valid: false, error: 'pages must be an array if present' };
  }
  
  return { valid: true };
}

/**
 * Vérifie la présence d'artifacts de build
 * @param {string} projectPath - Chemin du projet
 * @returns {Promise<{hasArtifacts: boolean, foundArtifacts: string[], checkedPaths: string[]}>}
 * @private
 */
async function checkBuildArtifacts(projectPath) {
  // Services possibles générés par le build
  const buildIndicators = ['front', 'api', 'back', 'database', 'admin'];
  
  const foundArtifacts = [];
  const checkedPaths = [];
  
  for (const indicator of buildIndicators) {
    const indicatorPath = `${projectPath}/${indicator}`;
    checkedPaths.push(indicatorPath);
    
    const exists = await checkFileAccess(indicatorPath);
    if (exists.accessible) {
      foundArtifacts.push(indicator);
    }
  }
  
  return {
    hasArtifacts: foundArtifacts.length > 0,
    foundArtifacts,
    checkedPaths
  };
}

/**
 * Valide les paramètres d'entrée
 * @param {string} projectPath - Chemin à valider
 * @returns {{valid: boolean, error?: string}}
 * @private
 */
function validateDraftDetectionInput(projectPath) {
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

console.log(`${LOG_COLORS.DRAFT}[DRAFT-DETECTOR] DRAFT detector loaded${LOG_COLORS.reset}`);