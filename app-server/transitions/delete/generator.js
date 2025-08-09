/*
 * [MOCK] FAIT QUOI : Génère plan de suppression pour DELETE
 * REÇOIT : inputData: object, config: object, options: object
 * RETOURNE : { generated: boolean, output: object, artifacts: string[], metadata: object }
 * ERREURS : GenerationError, CompilationError, ValidationError
 */

export async function generateDeletionPlan(inputData, config, options = {}) {
  console.log(`[MOCK] generateDeletionPlan called for: ${config?.projectId}`);
  
  if (!inputData || !config) {
    throw new Error('GenerationError: inputData and config required');
  }
  
  return {
    generated: true,
    output: {
      projectId: config.projectId,
      filesToDelete: ['project.json', 'app-visitor/', 'containers/'],
      backupCreated: true
    },
    artifacts: ['backup.tar.gz'],
    metadata: {}
  };
}