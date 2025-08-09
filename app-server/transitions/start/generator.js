/*
 * [MOCK] FAIT QUOI : Génère commandes de démarrage pour START
 * REÇOIT : inputData: object, config: object, options: object
 * RETOURNE : { generated: boolean, output: object, artifacts: string[], metadata: object }
 * ERREURS : GenerationError, CompilationError, ValidationError
 */

export async function generateStartCommands(inputData, config, options = {}) {
  console.log(`[MOCK] generateStartCommands called for: ${config?.projectId}`);
  
  if (!inputData || !config) {
    throw new Error('GenerationError: inputData and config required');
  }
  
  return {
    generated: true,
    output: {
      projectId: config.projectId,
      commands: ['docker-compose up -d'],
      ports: [3001, 3002, 3003, 5432]
    },
    artifacts: ['.running'],
    metadata: {}
  };
}