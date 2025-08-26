/*
 * FAIT QUOI : Parse toutes les requêtes HTTP (CREATE, BUILD, DEPLOY, etc.) - VERSION SIMPLE
 * REÇOIT : req: Request (Express)
 * RETOURNE : { success: boolean, data: object }
 * ERREURS : ValidationError si données manquantes
 */

export async function request(req) {
  console.log(`[DEBUG] request parser called for ${req.method} ${req.path}`);

  try {
    // Extract route info
    const method = req.method;
    const path = req.path;
    const params = req.params || {};
    const body = req.body || {};

    // ✅ AJOUT: Debug complet de ce qui est reçu
    console.log(`[DEBUG] Method: ${method}, Path: ${path}`);
    console.log(`[DEBUG] Body received:`, JSON.stringify(body, null, 2));
    console.log(`[DEBUG] Params received:`, JSON.stringify(params, null, 2));

    // Determine action type
    let action = "UNKNOWN";
    let projectId = null;

    if (method === "POST" && (path === "/projects" || path === "/")) {
      action = "CREATE";
      projectId = body.projectId;
      console.log(`[DEBUG] CREATE action detected, projectId: ${projectId}`);
    } else if (method === "POST" && path.includes("/build")) {
      action = "BUILD";
      projectId = params.id;
    } else if (method === "POST" && path.includes("/deploy")) {
      action = "DEPLOY";
      projectId = params.id;
    } else if (method === "POST" && path.includes("/start")) {
      action = "START";
      projectId = params.id;
    } else if (method === "POST" && path.includes("/stop")) {
      action = "STOP";
      projectId = params.id;
    } else if (method === "DELETE") {
      action = "DELETE";
      projectId = params.id;
    } else if (method === "PUT") {
      action = "UPDATE";
      projectId = params.id;
    }

    // ✅ AJOUT: Debug validation projectId
    console.log(
      `[DEBUG] Project ID validation - projectId: ${projectId}, type: ${typeof projectId}`
    );

    // Validate projectId (simple et direct)
    if (!projectId || typeof projectId !== "string") {
      console.log(`[DEBUG] VALIDATION FAILED: Project ID is required`);
      return {
        success: false,
        error: "Project ID is required",
      };
    }

    if (!/^[a-z0-9-]+$/.test(projectId)) {
      console.log(
        `[DEBUG] VALIDATION FAILED: Project ID format invalid: ${projectId}`
      );
      return {
        success: false,
        error:
          "Project ID must contain only lowercase letters, numbers and hyphens",
      };
    }

    if (projectId.length < 3) {
      console.log(
        `[DEBUG] VALIDATION FAILED: Project ID too short: ${projectId.length}`
      );
      return {
        success: false,
        error: "Project ID must be at least 3 characters",
      };
    }

    // Validation spécifique CREATE
    if (action === "CREATE") {
      console.log(
        `[DEBUG] CREATE validation - config:`,
        JSON.stringify(body.config, null, 2)
      );

      if (!body.config || typeof body.config !== "object") {
        console.log(`[DEBUG] VALIDATION FAILED: Config object is required`);
        return {
          success: false,
          error: "Config object is required",
        };
      }

      if (!body.config.name || typeof body.config.name !== "string") {
        console.log(
          `[DEBUG] VALIDATION FAILED: Project name is required in config`
        );
        return {
          success: false,
          error: "Project name is required in config",
        };
      }

      if (body.config.name.length < 2) {
        console.log(`[DEBUG] VALIDATION FAILED: Project name too short`);
        return {
          success: false,
          error: "Project name must be at least 2 characters",
        };
      }
    }

    console.log(
      `[DEBUG] VALIDATION SUCCESS - Action: ${action}, ProjectID: ${projectId}`
    );

    return {
      success: true,
      data: {
        action,
        projectId,
        config: body.config || body,
        method,
        path,
      },
    };
  } catch (error) {
    console.log(`[DEBUG] PARSER ERROR:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}
