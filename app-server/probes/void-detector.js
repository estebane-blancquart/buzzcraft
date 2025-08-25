import { readPath } from '../cores/reader.js';

/**
 * Detects if a project is in VOID state (non-existent)
 * @param {string} projectPath - The project path to check
 * @returns {{ success: boolean, data: object }} Response object with success status and data
 * @throws {ValidationError} When projectPath is missing
 */

export async function detectVoidState(projectPath) {
  console.log(`[STEP2] detectVoidState called with: ${projectPath}`);
  
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('ValidationError: projectPath must be non-empty string');
  }
  
  try {
    // Vérifier que project.json n'existe pas
    const projectFile = `${projectPath}/project.json`;
    const fileCheck = await readPath(projectFile);
    
    if (fileCheck.data.exists) {
      // Le projet existe déjà
      return {
        success: true,
        data: {
          state: null, // Pas VOID
          confidence: 0,
          evidence: ['project.json exists'],
          timestamp: new Date().toISOString()
        }
      };
    } else {
      // Le projet n'existe pas = VOID
      return {
        success: true,
        data: {
          state: 'VOID',
          confidence: 100,
          evidence: ['project.json does not exist'],
          timestamp: new Date().toISOString()
        }
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}