/**
 * Détecteur d'état DRAFT - VERSION PIXEL PARFAIT
 * @module draft-detector
 * @description Détermine si un projet est dans l'état DRAFT (créé, éditable)
 */

import { readPath, checkFileAccess } from '../cores/reader.js';
import { getProjectPath, getProjectFilePath } from '../cores/paths.js';
import { basename } from 'path';

/**
 * Détecte si un projet est dans l'état DRAFT
 * @param {string} projectPath - Chemin vers le dossier du projet
 * @returns {Promise<{success: boolean, data: object}>} Résultat de détection
 * 
 * @example
 * const result = await detectDraftState('./outputs/mon-projet');
 * if (result.success && result.data.isDraft) {
 *   console.log('Projet en état DRAFT, édition possible');
 * }
 */
export async function detectDraftState(projectPath) {
  console.log(`[DRAFT-DETECTOR] Detecting DRAFT state for: ${projectPath}`);
  
  // Validation des paramètres
  const validation = validateDraftDetectionInput(projectPath);
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
    
    // CRITÈRE 1: Le fichier project.json doit exister et être valide
    const projectId = basename(projectPath);
    const projectFilePath = getProjectFilePath(projectId);
    
    console.log(`[DRAFT-DETECTOR] Checking project file: ${projectFilePath}`);
    const projectFileResult = await readPath(projectFilePath, { 
      parseJson: true, 
      includeStats: true 
    });
    
    if (!projectFileResult.success || !projectFileResult.data.exists) {
      conflicts.push('Project file does not exist');
      console.log(`[DRAFT-DETECTOR] Project file not found`);
    } else {
      evidence.push('Project file exists');
      
      // Vérification du parsing JSON
      if (projectFileResult.data.jsonError) {
        conflicts.push(`Project file has invalid JSON: ${projectFileResult.data.jsonError}`);
      } else if (projectFileResult.data.parsed) {
        projectData = projectFileResult.data.parsed;
        evidence.push('Project file contains valid JSON');
        
        // CRITÈRE 2: Le state doit être explicitement DRAFT
        if (projectData.state === 'DRAFT') {
          evidence.push('Project state is DRAFT');
          console.log(`[DRAFT-DETECTOR] Project state confirmed: DRAFT`);
        } else {
          conflicts.push(`Project state is ${projectData.state || 'undefined'}, not DRAFT`);
        }
        
        // CRITÈRE 3: Validation de la structure minimale
        const structureValidation = validateDraftStructure(projectData);
        if (structureValidation.valid) {
          evidence.push('Project has valid DRAFT structure');
        } else {
          conflicts.push(`Invalid DRAFT structure: ${structureValidation.error}`);
        }
        
      } else {
        conflicts.push('Project file exists but contains no parseable content');
      }
    }
    
    // CRITÈRE 4: Aucun fichier de build ne doit exister (sinon ce serait BUILT)
    const buildChecks = await checkBuildArtifacts(projectPath);
    if (buildChecks.hasArtifacts) {
      conflicts.push(`Build artifacts found: ${buildChecks.foundArtifacts.join(', ')}`);
    } else {
      evidence.push('No build artifacts found (appropriate for DRAFT)');
    }
    
    // CRITÈRE 5: Le dossier projet peut exister (contrairement à VOID) mais être vide/minimal
    const directoryAccess = await checkFileAccess(projectPath);
    if (directoryAccess.accessible) {
      evidence.push('Project directory exists');
      
      // Analyser le contenu du dossier
      const contentAnalysis = await analyzeDraftDirectoryContent(projectPath);
      if (contentAnalysis.isDraftLike) {
        evidence.push('Directory content is appropriate for DRAFT state');
      } else {
        conflicts.push(`Directory content suggests non-DRAFT state: ${contentAnalysis.reason}`);
      }
    } else {
      // Un projet DRAFT peut ne pas avoir de dossier si seulement le project.json existe
      evidence.push('Project directory does not exist (acceptable for minimal DRAFT)');
    }
    
    // DÉTERMINATION FINALE
    const isDraft = conflicts.length === 0 && evidence.length >= 3;
    const confidence = isDraft ? 
      Math.min(85 + evidence.length * 3, 100) : 
      Math.max(10, 100 - conflicts.length * 15);
    
    console.log(`[DRAFT-DETECTOR] Detection result: ${isDraft ? 'DRAFT' : 'NOT_DRAFT'} (confidence: ${confidence}%)`);
    
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
        hasProjectFile: projectFileResult.success && projectFileResult.data.exists,
        validJson: projectData !== null,
        correctState: projectData?.state === 'DRAFT',
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
    console.log(`[DRAFT-DETECTOR] Detection failed: ${error.message}`);
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
  console.log(`[DRAFT-DETECTOR] Detecting DRAFT state by ID: ${projectId}`);
  
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
  console.log(`[DRAFT-DETECTOR] Quick DRAFT check for: ${projectPath}`);
  
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
        reason: isDraft ? 
          'Project state is DRAFT' : 
          `Project state is ${fileResult.data.parsed.state}`
      }
    };
    
  } catch (error) {
    console.log(`[DRAFT-DETECTOR] Quick check failed: ${error.message}`);
    return {
      success: false,
      error: `Quick DRAFT check failed: ${error.message}`
    };
  }
}

/**
 * Valide la structure d'un projet DRAFT
 * @param {object} projectData - Données du projet
 * @returns {{valid: boolean, error?: string}} Résultat de validation
 * @private
 */
function validateDraftStructure(projectData) {
  if (!projectData || typeof projectData !== 'object') {
    return { valid: false, error: 'Project data must be an object' };
  }
  
  // Champs obligatoires pour DRAFT
  const requiredFields = ['id', 'name', 'state', 'created'];
  for (const field of requiredFields) {
    if (!projectData[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  // Validation du state
  if (projectData.state !== 'DRAFT') {
    return { valid: false, error: `State must be DRAFT, got: ${projectData.state}` };
  }
  
  // Validation des pages (optionnel mais si présent, doit être valide)
  if (projectData.pages !== undefined) {
    if (!Array.isArray(projectData.pages)) {
      return { valid: false, error: 'Pages must be an array if present' };
    }
    
    // Une page minimum si le tableau pages existe
    if (projectData.pages.length === 0) {
      return { valid: false, error: 'Pages array cannot be empty if present' };
    }
    
    // Validation basique de chaque page
    for (let i = 0; i < projectData.pages.length; i++) {
      const page = projectData.pages[i];
      if (!page.id || !page.name) {
        return { valid: false, error: `Page ${i} missing required id or name` };
      }
    }
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
  const buildIndicators = [
    'package.json',
    'index.js',
    'index.html',
    'src/index.js',
    'dist/',
    'build/',
    'node_modules/'
  ];
  
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
 * Analyse le contenu du dossier pour vérifier s'il est cohérent avec l'état DRAFT
 * @param {string} projectPath - Chemin du projet
 * @returns {Promise<{isDraftLike: boolean, reason: string}>}
 * @private
 */
async function analyzeDraftDirectoryContent(projectPath) {
  try {
    const { readDirectory } = await import('../cores/reader.js');
    const dirContent = await readDirectory(projectPath);
    
    if (!dirContent.success) {
      return {
        isDraftLike: true,
        reason: 'Directory not readable (acceptable for DRAFT)'
      };
    }
    
    const files = dirContent.data.items.filter(item => item.isFile);
    const dirs = dirContent.data.items.filter(item => item.isDirectory);
    
    // Un projet DRAFT devrait avoir principalement project.json
    const hasOnlyProjectFile = files.length === 1 && files[0].name === 'project.json';
    const hasMinimalFiles = files.length <= 3;
    
    // Pas de dossiers de build
    const buildDirs = ['dist', 'build', 'node_modules', 'src'];
    const hasBuildDirs = dirs.some(dir => buildDirs.includes(dir.name));
    
    if (hasBuildDirs) {
      return {
        isDraftLike: false,
        reason: 'Contains build directories'
      };
    }
    
    if (hasOnlyProjectFile) {
      return {
        isDraftLike: true,
        reason: 'Contains only project.json (ideal DRAFT)'
      };
    }
    
    if (hasMinimalFiles) {
      return {
        isDraftLike: true,
        reason: 'Contains minimal files (acceptable DRAFT)'
      };
    }
    
    return {
      isDraftLike: false,
      reason: `Contains too many files (${files.length}) for DRAFT state`
    };
    
  } catch (error) {
    return {
      isDraftLike: true,
      reason: `Directory analysis failed (assuming DRAFT): ${error.message}`
    };
  }
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

console.log(`[DRAFT-DETECTOR] DRAFT detector loaded successfully - PIXEL PERFECT VERSION`);