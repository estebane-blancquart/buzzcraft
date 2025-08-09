import { readPath } from "../../systems/reader.js";

/*
 * FAIT QUOI : Détecte si un projet est en état BUILT (services générés)
 * REÇOIT : projectPath: string
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si projectPath manquant
 */

export async function detectBuiltState(projectPath) {
  if (!projectPath || typeof projectPath !== "string") {
    throw new Error("ValidationError: projectPath must be non-empty string");
  }

  const services = ["app-visitor", "app-manager", "server", "database"];
  const evidence = [];
  let foundServices = 0;

  for (const service of services) {
    const servicePath = `${projectPath}/${service}`;
    const serviceResult = await readPath(servicePath);

    if (!serviceResult.success) {
      return {
        success: false,
        error: serviceResult.error,
      };
    }

    if (serviceResult.data.exists && serviceResult.data.type === "directory") {
      evidence.push(`${service} directory exists`);
      foundServices++;
    } else {
      evidence.push(`${service} directory missing`);
    }
  }

  const isBuilt = foundServices >= 1;

  return {
    success: true,
    data: {
      state: isBuilt ? "BUILT" : null,
      confidence: (foundServices / services.length) * 100,
      evidence,
      timestamp: new Date().toISOString(),
    },
  };
}
