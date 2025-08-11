import Handlebars from 'handlebars';
import { extractAllElements, extractAllContainers } from '../../systems/extractor.js';
import { validateProjectSchema } from '../../systems/schema-validator.js';
import { validateTemplateVariables, generateDefaultVariables } from '../../systems/template-validator.js';

// Enregistrer les helpers Handlebars nécessaires
Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

Handlebars.registerHelper('ne', function(a, b) {
  return a !== b;
});

/*
 * FAIT QUOI : Génère services TypeScript depuis templates Handlebars + données project.json (VERSION CONTAINERS SUPPORT)
 * REÇOIT : projectData: object, templatesData: object, options: object
 * RETOURNE : { generated: boolean, output: object, artifacts: string[], metadata: object }
 * ERREURS : GenerationError si compilation Handlebars échoue, validation template variables incluse
 */

export async function generateServices(projectData, templatesData, options = {}) {
  console.log(`[BUILD] generateServices called for: ${projectData?.id || projectData?.project?.id}`);
  
  if (!projectData || !templatesData) {
    throw new Error('GenerationError: projectData and templatesData required');
  }
  
  try {
    // Validation du schema avant génération
    console.log(`[BUILD] Validating project schema...`);
    const validation = validateProjectSchema(projectData);
    if (!validation.valid) {
      throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      console.log(`[BUILD] Schema warnings: ${validation.warnings.join(', ')}`);
    }
    
    const services = {};
    const artifacts = [];
    const generationErrors = [];
    
    // Variables de base pour services (package.json, etc.)
    const baseVariables = {
      project: {
        id: projectData.id || projectData.project?.id,
        name: projectData.name || projectData.project?.name,
        template: projectData.template || projectData.project?.template,
        version: projectData.version || projectData.project?.version || '1.0.0'
      }
    };
    
    // Extraction robuste de tous les éléments
    console.log(`[BUILD] Extracting elements...`);
    const allElements = extractAllElements(projectData);
    console.log(`[BUILD] Found ${allElements.length} elements in project`);
    
    // Séparer components et containers pour traitement spécialisé
    const components = allElements.filter(e => e._category === 'component');
    const containers = allElements.filter(e => e._category === 'container');
    
    console.log(`[BUILD] Split: ${components.length} components, ${containers.length} containers`);
    
    // Déterminer les types utilisés (CASE INSENSITIVE)
    const usedElementTypes = [...new Set(allElements.map(e => e.type?.toLowerCase()).filter(Boolean))];
    console.log(`[BUILD] Used element types:`, usedElementTypes);
    
    // Auto-découverte des templates disponibles
    const availableTemplates = Object.keys(templatesData.templates);
    console.log(`[BUILD] Available templates: ${availableTemplates.length}`);
    
    // Compiler chaque template
    for (const [templatePath, templateContent] of Object.entries(templatesData.templates)) {
      console.log(`[BUILD] Processing template: ${templatePath}`);
      
      try {
        let compiledContent;
        let shouldGenerate = true;
        let templateVariables = { ...baseVariables };
        
        // Normaliser le chemin pour cross-platform
        const normalizedPath = templatePath.replace(/\\/g, '/');
        
        // TRAITEMENT COMPONENTS
        if (normalizedPath.includes('/components/')) {
          const componentType = getElementTypeFromPath(templatePath);
          console.log(`[BUILD] Component template detected: ${componentType}`);
          
          if (!usedElementTypes.includes(componentType.toLowerCase())) {
            console.log(`[BUILD] ✂️  Skipping unused component: ${componentType}`);
            shouldGenerate = false;
          } else {
            // Utiliser les données du premier component de ce type
            const componentData = findElementByType(components, componentType);
            
            if (componentData) {
              console.log(`[BUILD] 📦 Using component data for ${componentType}:`, componentData.id);
              
              // Générer variables complètes avec defaults
              templateVariables = generateDefaultVariables(projectData, componentData);
              
              // Ajouter variables spéciales pour templates
              templateVariables.allComponents = components.filter(c => c.type?.toLowerCase() === componentType.toLowerCase());
              templateVariables.componentCount = templateVariables.allComponents.length;
              
            } else {
              console.log(`[BUILD] ⚠️  No component data found for ${componentType}, using defaults only`);
              templateVariables = generateDefaultVariables(projectData, { type: componentType });
            }
          }
        }
        // TRAITEMENT CONTAINERS
        else if (normalizedPath.includes('/containers/')) {
          const containerType = getElementTypeFromPath(templatePath);
          console.log(`[BUILD] Container template detected: ${containerType}`);
          
          if (!usedElementTypes.includes(containerType.toLowerCase())) {
            console.log(`[BUILD] ✂️  Skipping unused container: ${containerType}`);
            shouldGenerate = false;
          } else {
            // Utiliser les données du premier container de ce type
            const containerData = findElementByType(containers, containerType);
            
            if (containerData) {
              console.log(`[BUILD] 📦 Using container data for ${containerType}:`, containerData.id);
              
              // Générer variables complètes avec données container
              templateVariables = generateDefaultVariables(projectData, containerData);
              
              // Variables spéciales pour containers
              templateVariables.allContainers = containers.filter(c => c.type?.toLowerCase() === containerType.toLowerCase());
              templateVariables.containerCount = templateVariables.allContainers.length;
              
              // IMPORTANT: Passer directement les propriétés du container
              Object.keys(containerData).forEach(key => {
                if (key !== '_path' && key !== '_category') {
                  templateVariables[key] = containerData[key];
                }
              });
              
            } else {
              console.log(`[BUILD] ⚠️  No container data found for ${containerType}, using defaults only`);
              templateVariables = generateDefaultVariables(projectData, { type: containerType });
            }
          }
        }
        // TRAITEMENT SERVICES (package.json, etc.)
        else {
          console.log(`[BUILD] 🛠️  Generating service template: ${templatePath}`);
          templateVariables = {
            ...baseVariables,
            // Variables supplémentaires pour services
            metadata: {
              generatedAt: new Date().toISOString(),
              elementsCount: allElements.length,
              componentsCount: components.length,
              containersCount: containers.length,
              usedTypes: usedElementTypes,
              templateEngine: 'handlebars',
              buzzcraft: true
            }
          };
        }
        
        // Validation des variables avant compilation
        if (shouldGenerate) {
          console.log(`[BUILD] 🔍 Validating template variables for: ${templatePath}`);
          const variableValidation = validateTemplateVariables(templateContent, templateVariables);
          
          if (!variableValidation.valid) {
            console.warn(`[BUILD] ⚠️  Template variable warnings for ${templatePath}:`, variableValidation.errors);
            // Continue quand même, mais log pour debug
            generationErrors.push(`${templatePath}: ${variableValidation.errors.join(', ')}`);
          }
          
          // Compiler le template Handlebars avec variables validées
          const template = Handlebars.compile(templateContent);
          compiledContent = template(templateVariables);
          
          // Déterminer le chemin de sortie (enlever .hbs)
          const outputPath = templatePath.replace('.hbs', '');
          
          // Stocker le résultat
          services[outputPath] = compiledContent;
          artifacts.push(outputPath);
          
          console.log(`[BUILD] ✅ Generated: ${outputPath}`);
        }
        
      } catch (templateError) {
        console.error(`[BUILD] ❌ Failed to compile template ${templatePath}:`, templateError.message);
        throw new Error(`Template compilation failed for ${templatePath}: ${templateError.message}`);
      }
    }
    
    // Résumé génération
    console.log(`[BUILD] 🎉 Generation complete:`);
    console.log(`[BUILD]   - ${artifacts.length} files generated`);
    console.log(`[BUILD]   - ${availableTemplates.length - artifacts.length} templates skipped (optimization)`);
    console.log(`[BUILD]   - ${allElements.length} elements found`);
    console.log(`[BUILD]   - ${usedElementTypes.length} element types used`);
    if (generationErrors.length > 0) {
      console.log(`[BUILD]   - ${generationErrors.length} variable warnings (check logs)`);
    }
    
    return {
      generated: true,
      output: {
        projectId: projectData.id || projectData.project?.id,
        services
      },
      artifacts,
      metadata: {
        generatedAt: new Date().toISOString(),
        templatesCompiled: artifacts.length,
        templatesSkipped: availableTemplates.length - artifacts.length,
        elementsFound: allElements.length,
        componentsFound: components.length,
        containersFound: containers.length,
        usedElementTypes,
        schemaValid: validation.valid,
        schemaWarnings: validation.warnings,
        templateWarnings: generationErrors
      }
    };
    
  } catch (error) {
    throw new Error(`GenerationError: Failed to compile templates - ${error.message}`);
  }
}

/*
 * FAIT QUOI : Extraire le type d'élément du chemin template (CROSS-PLATFORM)
 * REÇOIT : templatePath: string
 * RETOURNE : string (type élément en lowercase)
 * ERREURS : Aucune (retourne 'unknown' si parsing échoue)
 */

function getElementTypeFromPath(templatePath) {
  try {
    // Normaliser le chemin pour cross-platform (Windows \ → Unix /)
    const normalizedPath = templatePath.replace(/\\/g, '/');
    
    // "app-visitor/components/Button.tsx.hbs" → "button"
    // "app-visitor/containers/Form.tsx.hbs" → "form"
    const filename = normalizedPath.split('/').pop();
    const elementName = filename.replace('.tsx.hbs', '').replace('.hbs', '');
    return elementName.toLowerCase();
  } catch (error) {
    console.warn(`[BUILD] Failed to parse element type from path: ${templatePath}`);
    return 'unknown';
  }
}

/*
 * FAIT QUOI : Trouver le premier élément d'un type donné (CASE INSENSITIVE)
 * REÇOIT : elements: array, type: string
 * RETOURNE : object|undefined (premier élément trouvé)
 * ERREURS : Aucune (retourne undefined si pas trouvé)
 */

function findElementByType(elements, type) {
  return elements.find(element => 
    element.type?.toLowerCase() === type.toLowerCase()
  );
}

/*
 * FAIT QUOI : Trouver tous les éléments d'un type donné (CASE INSENSITIVE)
 * REÇOIT : elements: array, type: string
 * RETOURNE : array (tous les éléments du type)
 * ERREURS : Aucune (retourne array vide si aucun trouvé)
 */

function findAllElementsByType(elements, type) {
  return elements.filter(element => 
    element.type?.toLowerCase() === type.toLowerCase()
  );
}