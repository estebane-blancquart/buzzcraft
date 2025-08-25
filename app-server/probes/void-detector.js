import { readPath } from '../cores/reader.js';
import { join } from 'path';

/**
 * Detects if a project is in VOID state (non-existent)
 * @param {string} projectPath - The project path to check
 * @returns {{ success: boolean, data: object }} Response object with success status and data
 * @throws {ValidationError} When projectPath is missing
 */

export async function detectVoidState(projectPath) {
  console.log(`[VOID-DETECTOR] detectVoidState called with: ${projectPath}`);
  
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be non-empty string');
  }
  
  try {
    // Vérifier que project.json n'existe pas
    const projectFile = join(projectPath, 'project.json'); // ✅ Cross-platform
    console.log(`[VOID-DETECTOR] Checking file: ${projectFile}`);
    
    const fileCheck = await readPath(projectFile);
    console.log(`[VOID-DETECTOR] File check result: exists=${fileCheck.data?.exists || false}`);
    
    if (!fileCheck.success) {
      console.log(`[VOID-DETECTOR] File check failed: ${fileCheck.error}`);
      return {
        success: false,
        error: fileCheck.error
      };
    }
    
    if (fileCheck.data.exists) {
      // Le projet existe déjà - PAS VOID
      console.log(`[VOID-DETECTOR] Project file exists = NOT VOID`);
      
      // BONUS : Détecter l'état réel du projet existant
      let actualState = 'UNKNOWN';
      try {
        const projectData = JSON.parse(fileCheck.data.content);
        actualState = projectData.state || 'DRAFT';
        console.log(`[VOID-DETECTOR] Project actual state: ${actualState}`);
      } catch (parseError) {
        console.log(`[VOID-DETECTOR] Cannot parse project.json: ${parseError.message}`);
        actualState = 'CORRUPT';
      }
      
      return {
        success: true,
        data: {
          state: null, // Pas VOID
          confidence: 0,
          evidence: ['project.json exists'],
          timestamp: new Date().toISOString(),
          actualState, // État réel du projet
          reason: `Project already exists in ${actualState} state`
        }
      };
    } else {
      // Le projet n'existe pas = VOID
      console.log(`[VOID-DETECTOR] Project file does not exist = VOID`);
      return {
        success: true,
        data: {
          state: 'VOID',
          confidence: 100,
          evidence: ['project.json does not exist'],
          timestamp: new Date().toISOString(),
          reason: 'Project does not exist, ready for creation'
        }
      };
    }
    
  } catch (error) {
    console.log(`[VOID-DETECTOR] Unexpected error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}