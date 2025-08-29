/**
 * Détecteur d'état BUILT - VERSION PIXEL PARFAIT CORRIGÉE
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
  console.log(`[BUILT-DETECTOR] 🔍 Detecting BUILT state for: ${projectPath}`);
  
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
    
    console.log(`[BUILT-DETECTOR] 📄 Checking project file: ${projectFilePath}`);
    const projectFileResult = await readPath(projectFilePath, { 
      parseJson: true, 
      includeStats: true 
    });
    
    if (!projectFileResult.success || !projectFileResult.data.exists) {
      conflicts.push('Project file does not exist');
      console.log(`[BUILT-DETECTOR] ❌ Project file not found`);
    } else {
      evidence.push('Project file exists');
      console.log(`[BUILT-DETECTOR] ✅ Project file found`);
      
      // Vérification du parsing JSON
      if (projectFileResult.data.jsonError) {
        conflicts.push(`Project file has invalid JSON: ${projectFileResult.data.jsonError}`);
        console.log(`[BUILT-DETECTOR] ❌ Invalid JSON: ${projectFileResult.data.jsonError}`);
      } else if (projectFileResult.data.parsed) {
        projectData = projectFileResult.data.parsed;
        evidence.push('Project file contains valid JSON');
        console.log(`[BUILT-DETECTOR] ✅ Valid JSON parsed`);
        
        // CRITÈRE 2: Le state doit être BUILT
        if (projectData.state === 'BUILT') {
          evidence.push('Project state is BUILT');
          console.log(`[BUILT-DETECTOR] ✅ Project state confirmed: BUILT`);
          
          // CRITÈRE 3: Métadonnées de build (NON-BLOQUANT)
          if (projectData.build) {
            evidence.push('Project has build metadata');
            console.log(`[BUILT-DETECTOR] ✅ Build metadata present`);
            
            if (projectData.build.builtAt) {
              evidence.push('Build timestamp present');
              console.log(`[BUILT-DETECTOR] ✅ Build timestamp: ${projectData.build.builtAt}`);
            } else {
              console.log(`[BUILT-DETECTOR] ⚠️ Missing build timestamp (non-critical)`);
            }
            
            if (projectData.build.version) {
              evidence.push('Build version present');
              console.log(`[BUILT-DETECTOR] ✅ Build version: ${projectData.build.version}`);
            } else {
              console.log(`[BUILT-DETECTOR] ⚠️ Missing build version (non-critical)`);
            }
            
          } else {
            console.log(`[BUILT-DETECTOR] ⚠️ Missing build metadata (non-critical)`);
          }
          
        } else {
          conflicts.push(`Project state is ${projectData.state || 'undefined'}, not BUILT`);
          console.log(`[BUILT-DETECTOR] ❌ State is ${projectData.state}, not BUILT`);
        }
        
      } else {
        conflicts.push('Project file exists but contains no parseable content');
        console.log(`[BUILT-DETECTOR] ❌ Project file not parseable`);
      }
    }
    
    // CRITÈRE 4: Doit avoir des artifacts de build (fichiers générés)
    console.log(`[BUILT-DETECTOR] 🔧 Checking build artifacts...`);
    const buildArtifactsCheck = await checkBuildArtifacts(projectPath);
    if (buildArtifactsCheck.hasArtifacts) {
      evidence.push(`Build artifacts found: ${buildArtifactsCheck.foundArtifacts.length} files`);
      buildArtifacts = buildArtifactsCheck.foundArtifacts;
      console.log(`[BUILT-DETECTOR] ✅ ${buildArtifacts.length} build artifacts found`);
    } else {
      conflicts.push('No build artifacts found');
      console.log(`[BUILT-DETECTOR] ❌ No build artifacts found`);
    }
    
    // CRITÈRE 5: Validation de la cohérence des artifacts (NON-BLOQUANT)
    if (buildArtifacts.length > 0 && projectData?.build) {
      const expectedFiles = projectData.build.generatedFiles || 0;
      if (expectedFiles === 0 || buildArtifacts.length >= expectedFiles) {
        evidence.push('Build artifacts count matches metadata');
        console.log(`[BUILT-DETECTOR] ✅ Artifacts count OK: ${buildArtifacts.length} >= ${expectedFiles}`);
      } else {
        console.log(`[BUILT-DETECTOR] ⚠️ Expected ${expectedFiles} files, found ${buildArtifacts.length} (non-critical)`);
      }
    }
    
    // CRITÈRE 6: Dossier de build doit exister et contenir des fichiers
    console.log(`[BUILT-DETECTOR] 📁 Analyzing directory structure...`);
    const directoryAnalysis = await analyzeBuiltDirectoryStructure(projectPath);
    console.log(`[BUILT-DETECTOR] 📊 Directory analysis:`, directoryAnalysis);
    
    if (directoryAnalysis.isBuiltLike) {
      evidence.push('Directory structure indicates BUILT state');
      console.log(`[BUILT-DETECTOR] ✅ Directory structure looks BUILT-like`);
    } else {
      // CHANGEMENT: Warning au lieu de conflit bloquant
      console.log(`[BUILT-DETECTOR] ⚠️ Directory structure concern: ${directoryAnalysis.reason}`);
    }
    
    // NOUVELLE LOGIQUE DE DÉTERMINATION FINALE
    console.log(`[BUILT-DETECTOR] 🎯 Computing final decision...`);
    console.log(`[BUILT-DETECTOR] 📈 Evidence collected: ${evidence.length} items`);
    evidence.forEach((item, i) => console.log(`[BUILT-DETECTOR]    ${i+1}. ${item}`));
    console.log(`[BUILT-DETECTOR] ⚠️ Conflicts found: ${conflicts.length} items`);
    conflicts.forEach((item, i) => console.log(`[BUILT-DETECTOR]    ${i+1}. ${item}`));
    
    // LOGIQUE PONDÉRÉE: Au lieu de tout-ou-rien
    let score = 0;
    
    // Critères OBLIGATOIRES (bloquants)
    const hasProjectFile = evidence.some(e => e.includes('Project file exists'));
    const hasValidJson = evidence.some(e => e.includes('valid JSON'));
    const hasBuiltState = evidence.some(e => e.includes('state is BUILT'));
    const hasArtifacts = evidence.some(e => e.includes('Build artifacts found'));
    
    if (hasProjectFile) score += 25;
    if (hasValidJson) score += 25; 
    if (hasBuiltState) score += 30; // Critère le plus important
    if (hasArtifacts) score += 20;
    
    // BONUS pour les critères secondaires
    if (evidence.some(e => e.includes('build metadata'))) score += 5;
    if (evidence.some(e => e.includes('Directory structure indicates'))) score += 10;
    if (evidence.some(e => e.includes('Build timestamp'))) score += 3;
    if (evidence.some(e => e.includes('Build version'))) score += 2;
    
    // MALUS pour les conflicts CRITIQUES seulement
    const criticalConflicts = conflicts.filter(c => 
      c.includes('does not exist') || 
      c.includes('invalid JSON') || 
      c.includes('not BUILT') ||
      c.includes('No build artifacts')
    );
    
    score -= criticalConflicts.length * 30;
    
    console.log(`[BUILT-DETECTOR] 🎲 Score calculation:`);
    console.log(`[BUILT-DETECTOR]    - Base criteria: ${hasProjectFile ? 25 : 0} + ${hasValidJson ? 25 : 0} + ${hasBuiltState ? 30 : 0} + ${hasArtifacts ? 20 : 0}`);
    console.log(`[BUILT-DETECTOR]    - Bonus points: ${score - (hasProjectFile ? 25 : 0) - (hasValidJson ? 25 : 0) - (hasBuiltState ? 30 : 0) - (hasArtifacts ? 20 : 0) + (criticalConflicts.length * 30)}`);
    console.log(`[BUILT-DETECTOR]    - Critical penalties: -${criticalConflicts.length * 30}`);
    console.log(`[BUILT-DETECTOR]    - Final score: ${score}/100`);
    
    // Seuil ajusté: 70/100 au lieu de "zéro conflit"
    const isBuilt = score >= 70;
    const confidence = Math.max(0, Math.min(100, score));
    
    console.log(`[BUILT-DETECTOR] 🎯 Final decision: ${isBuilt ? '✅ BUILT' : '❌ NOT_BUILT'} (${confidence}% confidence)`);
    
    const result = {
      isBuilt,
      confidence,
      evidence,
      conflicts,
      score: {
        total: score,
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
        files: buildArtifacts.slice(0, 10), // Limite à 10 pour éviter surcharge
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
    console.log(`[BUILT-DETECTOR] ❌ Detection failed: ${error.message}`);
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
  console.log(`[BUILT-DETECTOR] ⚡ Quick BUILT check for: ${projectPath}`);
  
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
    'components/',
    'containers/',
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
  
  // CORRECTION PROBLÈME 1: Scan du dossier components/ - COMPTAGE INDIVIDUEL
  const componentsPath = `${projectPath}/components`;
  const componentsExists = await checkFileAccess(componentsPath);
  if (componentsExists.accessible) {
    try {
      const componentsContent = await readDirectory(componentsPath);
      if (componentsContent.success && componentsContent.data.items.length > 0) {
        // NOUVEAU: Ajouter chaque fichier individuellement au lieu du dossier
        for (const item of componentsContent.data.items) {
          foundArtifacts.push({
            path: `components/${item.name}`,
            type: 'file',
            fullPath: `${componentsPath}/${item.name}`
          });
        }
      }
    } catch (componentsError) {
      console.log(`[BUILT-DETECTOR] Error scanning components directory: ${componentsError.message}`);
    }
  }
  
  // CORRECTION PROBLÈME 1: Scan du dossier containers/ - COMPTAGE INDIVIDUEL  
  const containersPath = `${projectPath}/containers`;
  const containersExists = await checkFileAccess(containersPath);
  if (containersExists.accessible) {
    try {
      const containersContent = await readDirectory(containersPath);
      if (containersContent.success && containersContent.data.items.length > 0) {
        // NOUVEAU: Ajouter chaque fichier individuellement au lieu du dossier
        for (const item of containersContent.data.items) {
          foundArtifacts.push({
            path: `containers/${item.name}`,
            type: 'file', 
            fullPath: `${containersPath}/${item.name}`
          });
        }
      }
    } catch (containersError) {
      console.log(`[BUILT-DETECTOR] Error scanning containers directory: ${containersError.message}`);
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
    
    console.log(`[BUILT-DETECTOR] 📁 Directory contains: ${files.length} files, ${dirs.length} directories`);
    
    // Un projet BUILT devrait avoir des fichiers générés
    const hasGeneratedFiles = files.some(file => 
      ['package.json', 'index.js', 'index.html'].includes(file.name)
    );
    
    // Peut avoir des dossiers de build
    const hasBuildDirs = dirs.some(dir => 
      ['src', 'public', 'dist', 'build', 'components', 'containers'].includes(dir.name)
    );
    
    // Doit avoir le project.json
    const hasProjectFile = files.some(file => file.name === 'project.json');
    
    console.log(`[BUILT-DETECTOR] 🔍 Structure analysis:`);
    console.log(`[BUILT-DETECTOR]    - Has project.json: ${hasProjectFile}`);
    console.log(`[BUILT-DETECTOR]    - Has generated files: ${hasGeneratedFiles}`);
    console.log(`[BUILT-DETECTOR]    - Has build directories: ${hasBuildDirs}`);
    
    if (!hasProjectFile) {
      return {
        isBuiltLike: false,
        reason: 'Missing project.json file'
      };
    }
    
    if (hasGeneratedFiles || hasBuildDirs) {
      return {
        isBuiltLike: true,
        reason: `Contains ${hasGeneratedFiles ? 'generated files' : ''}${hasGeneratedFiles && hasBuildDirs ? ' and ' : ''}${hasBuildDirs ? 'build directories' : ''}`
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
  const mainIndicators = ['package.json', 'index.js', 'src/', 'components/', 'containers/'];
  
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

console.log(`[BUILT-DETECTOR] ✨ BUILT detector loaded successfully - PIXEL PERFECT VERSION CORRIGÉE`);