/*
 * [MOCK] FAIT QUOI : Gère les containers Docker pour les projets BuzzCraft
 * REÇOIT : projectPath: string, action: string, config: object
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si paramètres invalides
 */

export async function manageContainers(projectPath, action, config = {}) {
  console.log(`[MOCK] manageContainers called with: ${projectPath}, ${action}`);
  
  if (!projectPath || typeof projectPath !== "string") {
    throw new Error("ValidationError: projectPath must be non-empty string");
  }

  if (!action || !["create", "start", "stop"].includes(action)) {
    throw new Error("ValidationError: action must be create, start, or stop");
  }

  const projectId = projectPath.split("/").pop();

  return {
    success: true,
    data: {
      projectId,
      action,
      containersPath: `${projectPath}/containers`,
    },
  };
}