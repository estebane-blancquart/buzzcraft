/*
 * [MOCK] FAIT QUOI : Génère commandes d'arrêt pour STOP
 * REÇOIT : inputData: object, config: object, options: object
 * RETOURNE : { generated: boolean, output: object, artifacts: string[], metadata: object }
 * ERREURS : GenerationError, CompilationError, ValidationError
 */

export async function generateStopCommands(inputData, config, options = {}) {
  console.log(`[MOCK] generateStopCommands called for: ${config?.projectId}`);
  
  if (!inputData || !config) {
    throw new Error('GenerationError: inputData and config required');
  }
  
  return {
    generated: true,
    output: {
      projectId: config.projectId,
      commands: ['docker-compose down'],
      stoppedContainers: ['app-visitor', 'app-manager', 'server', 'database']
    },
    artifacts: [],
    metadata: {}
  };
}