/*
 * [MOCK] FAIT QUOI : Génère les 4 services TypeScript depuis templates
 * REÇOIT : inputData: object, config: object, options: object
 * RETOURNE : { generated: boolean, output: object, artifacts: string[], metadata: object }
 * ERREURS : GenerationError, CompilationError, ValidationError
 */

export async function generateServices(inputData, config, options = {}) {
  console.log(`[MOCK] generateServices called for: ${config?.projectId}`);
  
  if (!inputData || !config) {
    throw new Error('GenerationError: inputData and config required');
  }
  
  return {
    generated: true,
    output: {
      services: {
        'app-visitor': { 'package.json': '{}' },
        'app-manager': { 'package.json': '{}' },
        'server': { 'package.json': '{}' },
        'database': { 'init.sql': '-- mock' }
      }
    },
    artifacts: ['app-visitor/', 'app-manager/', 'server/', 'database/'],
    metadata: {}
  };
}