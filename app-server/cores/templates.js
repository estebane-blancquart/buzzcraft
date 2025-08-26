import { readPath } from "./reader.js";
import { readdir } from "fs/promises";
import { join } from "path";
import { PATHS } from "./constants.js";

/*
 * FAIT QUOI : Lecture pure de templates sans orchestration
 * REÇOIT : templateId ou projectId
 * RETOURNE : Contenu template ou null
 * ERREURS : Retourne null si échec, pas de throw
 */

/*
 * FAIT QUOI : Lit un template structure JSON
 * REÇOIT : templateId: string
 * RETOURNE : object|null (contenu template ou null si échec)
 * ERREURS : null si template inexistant
 */
export async function readTemplate(templateId) {
  console.log(`[TEMPLATES] Reading template: ${templateId}`);

  if (!templateId || typeof templateId !== "string") {
    console.log(`[TEMPLATES] Invalid templateId`);
    return null;
  }

  try {
    const templatePath = join(PATHS.templatesProjects, `${templateId}.json`);
    const templateFile = await readPath(templatePath);

    if (!templateFile.success || !templateFile.data.exists) {
      console.log(`[TEMPLATES] Template not found: ${templatePath}`);
      return null;
    }

    const templateContent = JSON.parse(templateFile.data.content);
    console.log(`[TEMPLATES] Template loaded successfully: ${templateId}`);
    
    return templateContent;

  } catch (error) {
    console.log(`[TEMPLATES] Error reading template ${templateId}: ${error.message}`);
    return null;
  }
}

/*
 * FAIT QUOI : Lit tous les templates Handlebars disponibles
 * REÇOIT : projectId: string (pour logs)
 * RETOURNE : object|null (templates par path relatif)
 * ERREURS : null si échec de lecture
 */
export async function readCodeTemplates(projectId = 'unknown') {
  console.log(`[TEMPLATES] Reading code templates for: ${projectId}`);

  try {
    const templatesBasePath = PATHS.templatesCode;
    const templates = {};

    async function scanDirectory(currentPath, relativePath = "") {
      try {
        const items = await readdir(currentPath, { withFileTypes: true });

        for (const item of items) {
          const fullPath = join(currentPath, item.name);
          const relativeItemPath = relativePath
            ? join(relativePath, item.name)
            : item.name;

          if (item.isDirectory()) {
            await scanDirectory(fullPath, relativeItemPath);
          } else if (item.isFile() && item.name.endsWith(".hbs")) {
            const templateFile = await readPath(fullPath);

            if (templateFile.success && templateFile.data.exists) {
              templates[relativeItemPath] = templateFile.data.content;
              console.log(`[TEMPLATES] Code template found: ${relativeItemPath}`);
            }
          }
        }
      } catch (error) {
        console.log(`[TEMPLATES] Directory scan failed: ${currentPath} - ${error.message}`);
      }
    }

    await scanDirectory(templatesBasePath);

    if (Object.keys(templates).length === 0) {
      console.log(`[TEMPLATES] No code templates found`);
      return null;
    }

    console.log(`[TEMPLATES] Found ${Object.keys(templates).length} code templates`);
    return templates;

  } catch (error) {
    console.log(`[TEMPLATES] Error reading code templates: ${error.message}`);
    return null;
  }
}

/*
 * FAIT QUOI : Découvre tous les templates disponibles
 * REÇOIT : Rien
 * RETOURNE : array|null (liste des templates disponibles)
 * ERREURS : null si échec
 */
export async function discoverTemplates() {
  console.log(`[TEMPLATES] Discovering available templates`);

  try {
    const structureBasePath = PATHS.templatesProjects;
    const availableTemplates = [];
    
    const items = await readdir(structureBasePath, { withFileTypes: true });

    for (const item of items) {
      if (item.isFile() && item.name.endsWith(".json")) {
        const templateId = item.name.replace(".json", "");
        const templatePath = join(structureBasePath, item.name);

        try {
          const templateFile = await readPath(templatePath);
          if (templateFile.success && templateFile.data.exists) {
            const templateData = JSON.parse(templateFile.data.content);

            availableTemplates.push({
              id: templateId,
              name: templateData.project?.name || templateId,
              description: templateData.project?.description || "No description",
              path: templatePath,
            });
            
            console.log(`[TEMPLATES] Available template: ${templateId}`);
          }
        } catch (parseError) {
          console.log(`[TEMPLATES] Invalid template ${templateId}: ${parseError.message}`);
        }
      }
    }

    if (availableTemplates.length === 0) {
      console.log(`[TEMPLATES] No valid templates found`);
      return null;
    }

    console.log(`[TEMPLATES] Discovery complete: ${availableTemplates.length} templates`);
    return availableTemplates;

  } catch (error) {
    console.log(`[TEMPLATES] Discovery failed: ${error.message}`);
    return null;
  }
}

/*
 * FAIT QUOI : Lit un template spécifique par type et ID
 * REÇOIT : templateType: string, templateId: string
 * RETOURNE : object|null
 * ERREURS : null si échec
 */
export async function readTemplateByType(templateType, templateId) {
  console.log(`[TEMPLATES] Reading ${templateType} template: ${templateId}`);

  if (!templateType || !templateId) {
    return null;
  }

  try {
    let basePath;
    
    switch (templateType) {
      case 'project':
        basePath = PATHS.templatesProjects;
        break;
      case 'component':
        basePath = PATHS.templatesComponents;
        break;
      case 'container':
        basePath = PATHS.templatesContainers;
        break;
      default:
        console.log(`[TEMPLATES] Unknown template type: ${templateType}`);
        return null;
    }

    const templatePath = join(basePath, `${templateId}.json`);
    const templateFile = await readPath(templatePath);

    if (!templateFile.success || !templateFile.data.exists) {
      return null;
    }

    return JSON.parse(templateFile.data.content);

  } catch (error) {
    console.log(`[TEMPLATES] Error reading ${templateType} template ${templateId}: ${error.message}`);
    return null;
  }
}

console.log(`[TEMPLATES] Templates core loaded successfully`);