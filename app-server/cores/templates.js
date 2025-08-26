import { readPath } from "./reader.js";
import { readdir } from "fs/promises";
import { join } from "path";
import { PATHS } from "./constants.js";

/**
 * Lecture pure de templates avec découverte automatique - VERSION PIXEL PARFAIT
 * @module templates
 * @description Chargement sécurisé et optimisé de tous types de templates BuzzCraft
 */

// Cache des templates découverts (performance)
const discoveryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Lit un template de structure JSON par son ID
 * @param {string} templateId - Identifiant du template à charger
 * @param {object} [options={}] - Options de chargement
 * @param {boolean} [options.cache=false] - Utiliser le cache de découverte
 * @param {boolean} [options.includeMetadata=false] - Inclure métadonnées du fichier
 * @returns {{success: boolean, data?: object, error?: string}} Template chargé ou erreur
 * 
 * @example
 * const result = await readTemplate('basic');
 * if (result.success) {
 *   console.log(`Template: ${result.data.project.name}`);
 * }
 * 
 * // Avec métadonnées
 * const withMeta = await readTemplate('basic', { includeMetadata: true });
 * console.log(`Size: ${withMeta.data._metadata.size} bytes`);
 */
export async function readTemplate(templateId, options = {}) {
  console.log(`[TEMPLATES] Reading template: ${templateId}`);

  try {
    // Validation des paramètres
    const validation = validateTemplateId(templateId, options);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const config = prepareReadConfig(options);

    // Construction du chemin template
    const templatePath = join(PATHS.templatesProjects, `${templateId}.json`);
    console.log(`[TEMPLATES] Template path: ${templatePath}`);

    // Lecture du fichier template
    const templateFile = await readPath(templatePath);

    if (!templateFile.success) {
      console.log(`[TEMPLATES] Template read failed: ${templateFile.error}`);
      return {
        success: false,
        error: `Failed to read template: ${templateFile.error}`
      };
    }

    if (!templateFile.data.exists) {
      console.log(`[TEMPLATES] Template not found: ${templatePath}`);
      return {
        success: false,
        error: `Template '${templateId}' not found`
      };
    }

    // Parsing JSON avec validation
    let templateContent;
    try {
      templateContent = JSON.parse(templateFile.data.content);
    } catch (parseError) {
      console.log(`[TEMPLATES] Template JSON parsing failed: ${parseError.message}`);
      return {
        success: false,
        error: `Invalid JSON in template '${templateId}': ${parseError.message}`
      };
    }

    // Enrichissement avec métadonnées si demandé
    const result = {
      ...templateContent,
      ...(config.includeMetadata && {
        _metadata: {
          templateId,
          filePath: templatePath,
          size: templateFile.data.size,
          loadedAt: new Date().toISOString()
        }
      })
    };

    console.log(`[TEMPLATES] Template loaded successfully: ${templateId}`);

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.log(`[TEMPLATES] Error reading template ${templateId}: ${error.message}`);
    return {
      success: false,
      error: `Template loading failed: ${error.message}`
    };
  }
}

/**
 * Lit tous les templates Handlebars disponibles avec scan récursif
 * @param {string} [projectId='unknown'] - ID projet pour logs contextuels
 * @param {object} [options={}] - Options de scan
 * @param {string[]} [options.extensions=['.hbs']] - Extensions de fichiers à scanner
 * @param {string[]} [options.excludePaths=[]] - Chemins à exclure du scan
 * @param {boolean} [options.includeMetadata=false] - Inclure métadonnées des fichiers
 * @param {number} [options.maxDepth=10] - Profondeur maximum de scan
 * @returns {{success: boolean, data?: object, error?: string}} Templates par chemin relatif
 * 
 * @example
 * const result = await readCodeTemplates('mon-projet');
 * if (result.success) {
 *   console.log(`Found ${Object.keys(result.data).length} code templates`);
 *   Object.keys(result.data).forEach(path => console.log(`- ${path}`));
 * }
 * 
 * // Scan avec options avancées
 * const custom = await readCodeTemplates('test', {
 *   extensions: ['.hbs', '.mustache'],
 *   excludePaths: ['node_modules', '.git'],
 *   maxDepth: 5
 * });
 */
export async function readCodeTemplates(projectId = 'unknown', options = {}) {
  console.log(`[TEMPLATES] Reading code templates for: ${projectId}`);

  try {
    // Validation et configuration
    const validation = validateCodeTemplateOptions(options);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const config = {
      extensions: options.extensions || ['.hbs'],
      excludePaths: options.excludePaths || [],
      includeMetadata: options.includeMetadata === true,
      maxDepth: options.maxDepth || 10
    };

    const templatesBasePath = PATHS.templatesCode;
    const templates = {};

    // Scan récursif avec protection profondeur
    const scanResult = await scanDirectoryRecursive(
      templatesBasePath,
      '',
      templates,
      config,
      0
    );

    if (!scanResult.success) {
      return scanResult;
    }

    if (Object.keys(templates).length === 0) {
      console.log(`[TEMPLATES] No code templates found`);
      return {
        success: true,
        data: {},
        stats: {
          totalFound: 0,
          scannedDirectories: 0,
          skippedFiles: 0
        }
      };
    }

    console.log(`[TEMPLATES] Found ${Object.keys(templates).length} code templates`);

    return {
      success: true,
      data: templates,
      stats: scanResult.stats
    };

  } catch (error) {
    console.log(`[TEMPLATES] Error reading code templates: ${error.message}`);
    return {
      success: false,
      error: `Code templates loading failed: ${error.message}`
    };
  }
}

/**
 * Découvre tous les templates disponibles avec cache intelligent
 * @param {object} [options={}] - Options de découverte
 * @param {boolean} [options.cache=true] - Utiliser le cache de découverte
 * @param {boolean} [options.includeInvalid=false] - Inclure templates avec erreurs JSON
 * @param {boolean} [options.includeMetadata=true] - Inclure métadonnées des templates
 * @returns {{success: boolean, data?: {templates: object[], count: number}, error?: string}} Templates découverts
 * 
 * @example
 * const result = await discoverTemplates();
 * if (result.success) {
 *   result.data.templates.forEach(template => {
 *     console.log(`${template.id}: ${template.name} - ${template.description}`);
 *   });
 * }
 * 
 * // Découverte avec cache désactivé
 * const fresh = await discoverTemplates({ cache: false });
 */
export async function discoverTemplates(options = {}) {
  console.log(`[TEMPLATES] Discovering available templates`);

  try {
    const config = {
      cache: options.cache !== false,
      includeInvalid: options.includeInvalid === true,
      includeMetadata: options.includeMetadata !== false
    };

    const cacheKey = 'template-discovery';
    
    // Vérification cache si activé
    if (config.cache) {
      const cached = getCachedDiscovery(cacheKey);
      if (cached) {
        console.log(`[TEMPLATES] Using cached discovery: ${cached.templates.length} templates`);
        return {
          success: true,
          data: cached,
          fromCache: true
        };
      }
    }

    const structureBasePath = PATHS.templatesProjects;
    const discoveredTemplates = [];
    const errors = [];

    try {
      const items = await readdir(structureBasePath, { withFileTypes: true });

      // Traitement parallèle des fichiers templates
      const templatePromises = items
        .filter(item => item.isFile() && item.name.endsWith('.json'))
        .map(async (item) => {
          const templateId = item.name.replace('.json', '');
          const templatePath = join(structureBasePath, item.name);

          try {
            const templateFile = await readPath(templatePath);
            
            if (!templateFile.success || !templateFile.data.exists) {
              if (config.includeInvalid) {
                return {
                  id: templateId,
                  name: templateId,
                  description: 'Template file not accessible',
                  path: templatePath,
                  valid: false,
                  error: templateFile.error || 'File not found'
                };
              }
              return null;
            }

            // Tentative de parsing JSON
            let templateData;
            try {
              templateData = JSON.parse(templateFile.data.content);
            } catch (parseError) {
              if (config.includeInvalid) {
                return {
                  id: templateId,
                  name: templateId,
                  description: 'Invalid JSON template',
                  path: templatePath,
                  valid: false,
                  error: `JSON parse error: ${parseError.message}`
                };
              }
              errors.push(`${templateId}: Invalid JSON - ${parseError.message}`);
              return null;
            }

            // Template valide
            const template = {
              id: templateId,
              name: templateData.project?.name || templateId,
              description: templateData.project?.description || 'No description available',
              version: templateData.project?.version || '1.0.0',
              path: templatePath,
              valid: true
            };

            // Métadonnées si demandées
            if (config.includeMetadata) {
              template._metadata = {
                fileSize: templateFile.data.size,
                discoveredAt: new Date().toISOString(),
                hasPages: !!(templateData.project?.pages?.length),
                pagesCount: templateData.project?.pages?.length || 0
              };
            }

            console.log(`[TEMPLATES] Discovered template: ${templateId} - ${template.name}`);
            return template;

          } catch (error) {
            console.log(`[TEMPLATES] Error processing template ${templateId}: ${error.message}`);
            errors.push(`${templateId}: ${error.message}`);
            return null;
          }
        });

      // Attendre tous les templates
      const templateResults = await Promise.all(templatePromises);
      
      // Filtrer les résultats null
      templateResults
        .filter(template => template !== null)
        .forEach(template => discoveredTemplates.push(template));

    } catch (error) {
      console.log(`[TEMPLATES] Directory scan failed: ${error.message}`);
      return {
        success: false,
        error: `Template discovery failed: ${error.message}`
      };
    }

    if (discoveredTemplates.length === 0 && !config.includeInvalid) {
      console.log(`[TEMPLATES] No valid templates found`);
      return {
        success: true,
        data: {
          templates: [],
          count: 0
        },
        warnings: errors
      };
    }

    const discoveryResult = {
      templates: discoveredTemplates,
      count: discoveredTemplates.length,
      validCount: discoveredTemplates.filter(t => t.valid).length,
      discoveredAt: new Date().toISOString()
    };

    // Mise en cache si activé
    if (config.cache) {
      setCachedDiscovery(cacheKey, discoveryResult);
      console.log(`[TEMPLATES] Discovery cached: ${discoveryResult.count} templates`);
    }

    console.log(`[TEMPLATES] Discovery complete: ${discoveryResult.count} templates (${discoveryResult.validCount} valid)`);

    return {
      success: true,
      data: discoveryResult,
      ...(errors.length > 0 && { warnings: errors })
    };

  } catch (error) {
    console.log(`[TEMPLATES] Template discovery failed: ${error.message}`);
    return {
      success: false,
      error: `Template discovery failed: ${error.message}`
    };
  }
}

/**
 * Lit un template spécifique par type et ID avec validation
 * @param {string} templateType - Type de template ('project', 'component', 'container')
 * @param {string} templateId - Identifiant du template
 * @param {object} [options={}] - Options de lecture
 * @param {boolean} [options.validate=true] - Valider le schema du template
 * @param {boolean} [options.includeMetadata=false] - Inclure métadonnées
 * @returns {{success: boolean, data?: object, error?: string}} Template typé chargé
 * 
 * @example
 * const result = await readTemplateByType('component', 'button');
 * if (result.success) {
 *   console.log(`Button schema: ${JSON.stringify(result.data.schema)}`);
 * }
 * 
 * // Template avec validation désactivée
 * const unsafe = await readTemplateByType('container', 'form', { validate: false });
 */
export async function readTemplateByType(templateType, templateId, options = {}) {
  console.log(`[TEMPLATES] Reading ${templateType} template: ${templateId}`);

  try {
    // Validation des paramètres
    const validation = validateTemplateTypeParams(templateType, templateId, options);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const config = {
      validate: options.validate !== false,
      includeMetadata: options.includeMetadata === true
    };

    // Mapping des types vers leurs chemins
    const typeMap = {
      'project': PATHS.templatesProjects,
      'component': PATHS.templatesComponents,
      'container': PATHS.templatesContainers
    };

    const basePath = typeMap[templateType];
    if (!basePath) {
      return {
        success: false,
        error: `Unknown template type '${templateType}'. Valid types: ${Object.keys(typeMap).join(', ')}`
      };
    }

    // Lecture du template
    const templatePath = join(basePath, `${templateId}.json`);
    const templateFile = await readPath(templatePath);

    if (!templateFile.success || !templateFile.data.exists) {
      console.log(`[TEMPLATES] Template not found: ${templatePath}`);
      return {
        success: false,
        error: `Template '${templateType}/${templateId}' not found`
      };
    }

    // Parsing JSON
    let templateData;
    try {
      templateData = JSON.parse(templateFile.data.content);
    } catch (parseError) {
      console.log(`[TEMPLATES] JSON parsing failed: ${parseError.message}`);
      return {
        success: false,
        error: `Invalid JSON in template '${templateType}/${templateId}': ${parseError.message}`
      };
    }

    // Validation basique du schema si demandée
    if (config.validate) {
      const schemaValidation = validateTemplateSchema(templateData, templateType);
      if (!schemaValidation.valid) {
        return {
          success: false,
          error: `Schema validation failed: ${schemaValidation.error}`
        };
      }
    }

    // Enrichissement avec métadonnées
    const result = {
      ...templateData,
      ...(config.includeMetadata && {
        _metadata: {
          templateType,
          templateId,
          filePath: templatePath,
          size: templateFile.data.size,
          loadedAt: new Date().toISOString()
        }
      })
    };

    console.log(`[TEMPLATES] Template loaded successfully: ${templateType}/${templateId}`);

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.log(`[TEMPLATES] Error reading ${templateType} template ${templateId}: ${error.message}`);
    return {
      success: false,
      error: `Template loading failed: ${error.message}`
    };
  }
}

// === FONCTIONS INTERNES ===

/**
 * Valide un ID de template
 * @private
 */
function validateTemplateId(templateId, options) {
  if (!templateId || typeof templateId !== 'string') {
    return { valid: false, error: 'ValidationError: templateId must be non-empty string' };
  }

  if (templateId.trim().length === 0) {
    return { valid: false, error: 'ValidationError: templateId cannot be empty or whitespace only' };
  }

  if (options && typeof options !== 'object') {
    return { valid: false, error: 'ValidationError: options must be an object' };
  }

  return { valid: true };
}

/**
 * Valide les options de lecture de templates code
 * @private
 */
function validateCodeTemplateOptions(options) {
  if (options && typeof options !== 'object') {
    return { valid: false, error: 'ValidationError: options must be an object' };
  }

  if (options.extensions && !Array.isArray(options.extensions)) {
    return { valid: false, error: 'ValidationError: options.extensions must be an array' };
  }

  if (options.excludePaths && !Array.isArray(options.excludePaths)) {
    return { valid: false, error: 'ValidationError: options.excludePaths must be an array' };
  }

  if (options.maxDepth && (typeof options.maxDepth !== 'number' || options.maxDepth < 1)) {
    return { valid: false, error: 'ValidationError: options.maxDepth must be a positive number' };
  }

  return { valid: true };
}

/**
 * Valide les paramètres de template par type
 * @private
 */
function validateTemplateTypeParams(templateType, templateId, options) {
  if (!templateType || typeof templateType !== 'string') {
    return { valid: false, error: 'ValidationError: templateType must be non-empty string' };
  }

  if (!templateId || typeof templateId !== 'string') {
    return { valid: false, error: 'ValidationError: templateId must be non-empty string' };
  }

  if (options && typeof options !== 'object') {
    return { valid: false, error: 'ValidationError: options must be an object' };
  }

  return { valid: true };
}

/**
 * Prépare la configuration de lecture
 * @private
 */
function prepareReadConfig(options) {
  return {
    cache: options.cache === true,
    includeMetadata: options.includeMetadata === true
  };
}

/**
 * Scan récursif de répertoire avec protection
 * @private
 */
async function scanDirectoryRecursive(currentPath, relativePath, templates, config, currentDepth) {
  if (currentDepth >= config.maxDepth) {
    console.log(`[TEMPLATES] Max depth reached: ${currentPath}`);
    return {
      success: true,
      stats: { maxDepthReached: true }
    };
  }

  try {
    const items = await readdir(currentPath, { withFileTypes: true });
    let scannedDirectories = 0;
    let skippedFiles = 0;

    for (const item of items) {
      const fullPath = join(currentPath, item.name);
      const relativeItemPath = relativePath ? join(relativePath, item.name) : item.name;

      // Vérifier exclusions
      if (config.excludePaths.some(exclude => relativeItemPath.includes(exclude))) {
        skippedFiles++;
        continue;
      }

      if (item.isDirectory()) {
        scannedDirectories++;
        const subResult = await scanDirectoryRecursive(
          fullPath,
          relativeItemPath,
          templates,
          config,
          currentDepth + 1
        );
        
        if (!subResult.success) {
          console.log(`[TEMPLATES] Subdirectory scan failed: ${fullPath}`);
        }
      } else if (item.isFile()) {
        // Vérifier extension
        const hasValidExtension = config.extensions.some(ext => item.name.endsWith(ext));
        
        if (hasValidExtension) {
          try {
            const templateFile = await readPath(fullPath);

            if (templateFile.success && templateFile.data.exists) {
              const templateData = {
                content: templateFile.data.content,
                ...(config.includeMetadata && {
                  _metadata: {
                    filePath: fullPath,
                    relativePath: relativeItemPath,
                    size: templateFile.data.size,
                    scannedAt: new Date().toISOString()
                  }
                })
              };

              templates[relativeItemPath] = templateData.content;
              console.log(`[TEMPLATES] Code template found: ${relativeItemPath}`);
            } else {
              skippedFiles++;
              console.log(`[TEMPLATES] Skipped unreadable file: ${relativeItemPath}`);
            }
          } catch (error) {
            skippedFiles++;
            console.log(`[TEMPLATES] Error reading ${relativeItemPath}: ${error.message}`);
          }
        } else {
          skippedFiles++;
        }
      }
    }

    return {
      success: true,
      stats: {
        scannedDirectories,
        skippedFiles,
        totalFound: Object.keys(templates).length
      }
    };

  } catch (error) {
    console.log(`[TEMPLATES] Directory scan failed: ${currentPath} - ${error.message}`);
    return {
      success: false,
      error: `Directory scan failed: ${error.message}`
    };
  }
}

/**
 * Validation basique de schema de template
 * @private
 */
function validateTemplateSchema(templateData, templateType) {
  if (!templateData || typeof templateData !== 'object') {
    return { valid: false, error: 'Template data must be an object' };
  }

  switch (templateType) {
    case 'project':
      if (!templateData.project) {
        return { valid: false, error: 'Project template must have a "project" property' };
      }
      if (!templateData.project.id || !templateData.project.name) {
        return { valid: false, error: 'Project template must have id and name' };
      }
      break;

    case 'component':
    case 'container':
      if (!templateData.id || !templateData.type) {
        return { valid: false, error: `${templateType} template must have id and type` };
      }
      if (!templateData.schema) {
        return { valid: false, error: `${templateType} template must have schema` };
      }
      break;
  }

  return { valid: true };
}

/**
 * Gestion du cache de découverte
 * @private
 */
function getCachedDiscovery(cacheKey) {
  const cached = discoveryCache.get(cacheKey);
  if (!cached) return null;

  // Vérifier TTL
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    discoveryCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

/**
 * Mise en cache de la découverte
 * @private
 */
function setCachedDiscovery(cacheKey, data) {
  discoveryCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

console.log(`[TEMPLATES] Template loader loaded successfully - PIXEL PERFECT VERSION`);