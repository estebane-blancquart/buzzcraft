import Handlebars from 'handlebars';
import { extractAllComponents, extractAllContainers } from '../../systems/extractor.js';
import { validateProjectSchema } from '../../systems/schema-validator.js';
import { validateTemplateVariables, generateDefaultVariables } from '../../systems/template-validator.js';

/*
 * FAIT QUOI : Génère services TypeScript depuis templates Handlebars + données project.json (VERSION PERFECTIONNISTE)
 * REÇOIT : projectData: object, templatesData: object, options: object
 * RETOURNE : { generated: boolean, output: object, artifacts: string[], metadata: object }
 * ERREURS : GenerationError si compilation Handlebars échoue, validation template variables incluse
 */

export async function generateServices(projectData, templatesData, options = {}) {
  console.log(`[BUILD] generateServices called for: ${projectData?.id}`);
  
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
    
    // Extraction robuste de tous les components
    console.log(`[BUILD] Extracting components...`);
    const allComponents = extractAllComponents(projectData);
    console.log(`[BUILD] Found ${allComponents.length} components in project`);
    
    // Extraction des containers pour info
    const allContainers = extractAllContainers(projectData);
    console.log(`[BUILD] Found ${allContainers.length} containers in project`);
    
    // Déterminer les types de components utilisés (CASE INSENSITIVE)
    const usedComponentTypes = [...new Set(allComponents.map(c => c.type?.toLowerCase()).filter(Boolean))];
    console.log(`[BUILD] Used component types:`, usedComponentTypes);
    
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
        
        // Si c'est un template component, vérifier s'il est utilisé ET préparer les variables
        if (templatePath.includes('/components/')) {
          const componentType = getComponentTypeFromPath(templatePath);
          console.log(`[BUILD] Component template detected: ${componentType}`);
          
          if (!usedComponentTypes.includes(componentType.toLowerCase())) {
            console.log(`[BUILD] ✂️  Skipping unused component: ${componentType}`);
            shouldGenerate = false;
          } else {
            // Utiliser les données du premier component de ce type
            const componentData = findComponentByType(allComponents, componentType);
            
            if (componentData) {
              console.log(`[BUILD] 📦 Using component data for ${componentType}:`, componentData.id);
              
              // Générer variables complètes avec defaults
              templateVariables = generateDefaultVariables(projectData, componentData);
              
              // Ajouter variables spéciales pour templates
              templateVariables.allComponents = allComponents.filter(c => c.type?.toLowerCase() === componentType.toLowerCase());
              templateVariables.componentCount = templateVariables.allComponents.length;
              
            } else {
              console.log(`[BUILD] ⚠️  No component data found for ${componentType}, using defaults only`);
              templateVariables = generateDefaultVariables(projectData, { type: componentType });
            }
          }
        } else {
          // Pour les autres templates (package.json, etc.), variables de base + metadata
          console.log(`[BUILD] 🛠️  Generating service template: ${templatePath}`);
          templateVariables = {
            ...baseVariables,
            // Variables supplémentaires pour services
            metadata: {
              generatedAt: new Date().toISOString(),
              componentsCount: allComponents.length,
              containersCount: allContainers.length,
              usedTypes: usedComponentTypes,
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
    console.log(`[BUILD]   - ${allComponents.length} components found`);
    console.log(`[BUILD]   - ${usedComponentTypes.length} component types used`);
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
        componentsFound: allComponents.length,
        containersFound: allContainers.length,
        usedComponentTypes,
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
 * FAIT QUOI : Extraire le type de component du chemin template (CASE INSENSITIVE)
 * REÇOIT : templatePath: string
 * RETOURNE : string (type component en lowercase)
 * ERREURS : Aucune (retourne 'unknown' si parsing échoue)
 */

function getComponentTypeFromPath(templatePath) {
  try {
    // "app-visitor/components/Button.tsx.hbs" -> "button"
    const filename = templatePath.split('/').pop();
    const componentName = filename.replace('.tsx.hbs', '').replace('.hbs', '');
    return componentName.toLowerCase();
  } catch (error) {
    console.warn(`[BUILD] Failed to parse component type from path: ${templatePath}`);
    return 'unknown';
  }
}

/*
 * FAIT QUOI : Trouver le premier component d'un type donné (CASE INSENSITIVE)
 * REÇOIT : components: array, type: string
 * RETOURNE : object|undefined (premier component trouvé)
 * ERREURS : Aucune (retourne undefined si pas trouvé)
 */

function findComponentByType(components, type) {
  return components.find(component => 
    component.type?.toLowerCase() === type.toLowerCase()
  );
}

/*
 * FAIT QUOI : Trouver tous les components d'un type donné (CASE INSENSITIVE)
 * REÇOIT : components: array, type: string
 * RETOURNE : array (tous les components du type)
 * ERREURS : Aucune (retourne array vide si aucun trouvé)
 */

function findAllComponentsByType(components, type) {
  return components.filter(component => 
    component.type?.toLowerCase() === type.toLowerCase()
  );
}