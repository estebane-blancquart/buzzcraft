/*
 * [MOCK] FAIT QUOI : Génère configuration Docker pour DEPLOY
 * REÇOIT : inputData: object, config: object, options: object
 * RETOURNE : { generated: boolean, output: object, artifacts: string[], metadata: object }
 * ERREURS : GenerationError, CompilationError, ValidationError
 */

export async function generateContainers(inputData, config, options = {}) {
  console.log(`[MOCK] generateContainers called for: ${config?.projectId}`);
  
  if (!inputData || !config) {
    throw new Error('GenerationError: inputData and config required');
  }
  
  return {
    generated: true,
    output: {
      projectId: config.projectId,
      containers: ['app-visitor', 'app-manager', 'server', 'database'],
      dockerCompose: '[MOCK] docker-compose.yml content'
    },
    artifacts: ['docker-compose.yml', 'Dockerfile'],
    metadata: {}
  };
}