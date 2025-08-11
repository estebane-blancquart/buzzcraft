import Handlebars from 'handlebars';
import { extractAllComponents, extractAllContainers } from '../../systems/extractor.js';
import { validateProjectSchema } from '../../systems/validator.js';

/*
 * FAIT QUOI : Génère services TypeScript depuis templates Handlebars + données project.json (VERSION ROBUSTE)
 * REÇOIT : projectData: object, templatesData: object, options: object
 * RETOURNE : { generated: boolean, output: object, artifacts: string[], metadata: object }
 * ERREURS : GenerationError si compilation Handlebars échoue
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
    
    // Variables de base pour services (package.json, etc.)
    const baseVariables = {
      project: {
        id: projectData.id || projectData.project?.id,
        name: projectData.name || projectData.project?.name,
        template: projectData.template || projectData.project?.template
      }
    };
    
    // Extraction robuste de tous les components
    console.log(`[BUILD] Extracting components...`);
    const allComponents = extractAllComponents(projectData);
    console.log(`[BUILD] Found ${allComponents.length} components in project`);
    
    // Extraction des containers pour info
    const allContainers = extractAllContainers(projectData);
    console.log(`[BUILD] Found ${allContainers.length} containers in project`);
    
    // Déterminer les types de components utilisés
    const usedComponentTypes = [...new Set(allComponents.map(c => c.type))];
    console.log(`[BUILD] Used component types:`, usedComponentTypes);
    
    // Auto-découverte des templates disponibles
    const availableTemplates = Object.keys(templatesData.templates);
    console.log(`[BUILD] Available templates:`, availableTemplates.length);
    
    // Compiler chaque template
    for (const [templatePath, templateContent] of Object.entries(templatesData.templates)) {
      console.log(`[BUILD] Processing template: ${templatePath}`);
      
      try {
        // Compiler le template Handlebars
        const template = Handlebars.compile(templateContent);
        
        let compiledContent;
        let shouldGenerate = true;
        
        // Si c'est un template component, vérifier s'il est utilisé
        if (templatePath.includes('/components/')) {
          const componentType = getComponentTypeFromPath(templatePath);
          
          if (!usedComponentTypes.includes(componentType)) {
            console.log(`[BUILD] Skipping unused component: ${componentType}`);
            shouldGenerate = false;
          } else {
            // Utiliser les données du premier component de ce type
            const componentData = findComponentByType(allComponents, componentType);
            
            if (componentData) {
              console.log(`[BUILD] Using component data for ${componentType}:`, componentData.id);
              compiledContent = template({
                ...baseVariables,
                ...componentData,
                // Variables spéciales pour templates
                allComponents: allComponents.filter(c => c.type === componentType),
                componentCount: allComponents.filter(c => c.type === componentType).length
              });
            } else {
              console.log(`[BUILD] No component data found for ${componentType}, using base variables`);
              compiledContent = template(baseVariables);
            }
          }
        } else {
          // Pour les autres templates (package.json, etc.), toujours générer
          console.log(`[BUILD] Generating service template: ${templatePath}`);
          compiledContent = template({
            ...baseVariables,
            // Variables supplémentaires pour services
            metadata: {
              generatedAt: new Date().toISOString(),
              componentsCount: allComponents.length,
              containersCount: allContainers.length,
              usedTypes: usedComponentTypes
            }
          });
        }
        
        // Générer seulement si nécessaire
        if (shouldGenerate) {
          // Déterminer le chemin de sortie (enlever .hbs)
          const outputPath = templatePath.replace('.hbs', '');
          
          // Stocker le résultat
          services[outputPath] = compiledContent;
          artifacts.push(outputPath);
          
          console.log(`[BUILD] Generated: ${outputPath}`);
        }
        
      } catch (templateError) {
        console.error(`[BUILD] Failed to compile template ${templatePath}:`, templateError.message);
        throw new Error(`Template compilation failed for ${templatePath}: ${templateError.message}`);
      }
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
        componentsFound: allComponents.length,
        containersFound: allContainers.length,
        usedComponentTypes,
        schemaValid: validation.valid,
        schemaWarnings: validation.warnings
      }
    };
    
  } catch (error) {
    throw new Error(`GenerationError: Failed to compile templates - ${error.message}`);
  }
}

// Helper : Extraire le type de component du chemin template
function getComponentTypeFromPath(templatePath) {
  // "app-visitor/components/Button.tsx.hbs" -> "button"
  const filename = templatePath.split('/').pop();
  const componentName = filename.replace('.tsx.hbs', '');
  return componentName.toLowerCase();
}

// Helper : Trouver le premier component d'un type donné
function findComponentByType(components, type) {
  return components.find(component => component.type === type);
}

// Helper : Trouver tous les components d'un type donné
function findAllComponentsByType(components, type) {
  return components.filter(component => component.type === type);
}