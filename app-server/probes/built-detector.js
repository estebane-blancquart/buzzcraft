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
 * Vérifie la présence d'artifacts de build avec nouvelle structure
 * @param {string} projectPath - Chemin du projet
 * @returns {Promise<{hasArtifacts: boolean, foundArtifacts: string[]}>}
 * @private
 */
async function checkBuildArtifacts(projectPath) {
  // NOUVELLE STRUCTURE - Services générés : front/, api/, back/, database/, admin/
  const serviceDirectories = ['front', 'api', 'back', 'database', 'admin'];
  const foundArtifacts = [];
  
  console.log(`[BUILT-DETECTOR] Scanning for service directories...`);
  
  // Scan des services générés
  for (const service of serviceDirectories) {
    const servicePath = `${projectPath}/${service}`;
    
    const serviceExists = await checkFileAccess(servicePath);
    if (serviceExists.accessible) {
      console.log(`[BUILT-DETECTOR] Found service: ${service}`);
      
      try {
        const serviceContent = await readDirectory(servicePath);
        if (serviceContent.success && serviceContent.data.items.length > 0) {
          
          // Scan des fichiers dans le service
          for (const item of serviceContent.data.items) {
            foundArtifacts.push({
              path: `${service}/${item.name}`,
              type: item.isFile ? 'file' : 'directory',
              fullPath: `${servicePath}/${item.name}`
            });
          }
          
          // Scan des sous-dossiers (components, containers, etc.)
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
              console.log(`[BUILT-DETECTOR] Error scanning ${service}/${subDir.name}: ${error.message}`);
            }
          }
        }
      } catch (error) {
        console.log(`[BUILT-DETECTOR] Error scanning service ${service}: ${error.message}`);
      }
    }
  }
  
  console.log(`[BUILT-DETECTOR] Found ${foundArtifacts.length} build artifacts`);
  
  return {
    hasArtifacts: foundArtifacts.length > 0,
    foundArtifacts
  };
}

/**
 * AUSSI, corrige analyzeBuiltDirectoryStructure() pour reconnaître les services
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
    
    console.log(`[BUILT-DETECTOR] Directory contains: ${files.length} files, ${dirs.length} directories`);
    
    // Doit avoir le project.json
    const hasProjectFile = files.some(file => file.name === 'project.json');
    
    // NOUVELLE LOGIQUE : Chercher les services générés
    const serviceDirectories = ['front', 'api', 'back', 'database', 'admin'];
    const foundServices = dirs.filter(dir => serviceDirectories.includes(dir.name));
    
    console.log(`[BUILT-DETECTOR] Structure analysis:`);
    console.log(`[BUILT-DETECTOR]    - Has project.json: ${hasProjectFile}`);
    console.log(`[BUILT-DETECTOR]    - Found services: ${foundServices.map(s => s.name).join(', ')}`);
    console.log(`[BUILT-DETECTOR]    - Service count: ${foundServices.length}/${serviceDirectories.length}`);
    
    if (!hasProjectFile) {
      return {
        isBuiltLike: false,
        reason: 'Missing project.json file'
      };
    }
    
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
      reason: `No generated services found (expected: ${serviceDirectories.join(', ')})`
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