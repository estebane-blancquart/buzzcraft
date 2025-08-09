/*
 * [MOCK] FAIT QUOI : Génère plan de mise à jour pour UPDATE
 * REÇOIT : inputData: object, config: object, options: object
 * RETOURNE : { generated: boolean, output: object, artifacts: string[], metadata: object }
 * ERREURS : GenerationError, CompilationError, ValidationError
 */

export async function generateUpdatePlan(inputData, config, options = {}) {
  console.log(`[MOCK] generateUpdatePlan called for: ${config?.projectId}`);
  
  if (!inputData || !config) {
    throw new Error('GenerationError: inputData and config required');
  }
  
  return {
    generated: true,
    output: {
      projectId: config.projectId,
      updateStrategy: 'blue-green',
      newVersion: '1.1.0'
    },
    artifacts: ['backup/', 'new-version/'],
    metadata: {}
  };
}