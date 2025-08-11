import Handlebars from 'handlebars';

/*
 * FAIT QUOI : Génère services TypeScript depuis templates Handlebars + données project.json
 * REÇOIT : projectData: object, templatesData: object, options: object
 * RETOURNE : { generated: boolean, output: object, artifacts: string[], metadata: object }
 * ERREURS : GenerationError si compilation Handlebars échoue
 */

export async function generateServices(projectData, templatesData, options = {}) {
  console.log(`[STEP] generateServices called for: ${projectData?.id}`);
  
  if (!projectData || !templatesData) {
    throw new Error('GenerationError: projectData and templatesData required');
  }
  
  try {
    const services = {};
    const artifacts = [];
    
    // Variables de base pour services (package.json, etc.)
    const baseVariables = {
      project: {
        id: projectData.id,
        name: projectData.name,
        template: projectData.template
      }
    };
    
    // Extraire tous les components du project.json
    const allComponents = extractAllComponents(projectData);
    console.log(`[STEP] Found ${allComponents.length} components in project`);
    
    // Déterminer les types de components utilisés
    const usedComponentTypes = [...new Set(allComponents.map(c => c.type))];
    console.log(`[STEP] Used component types:`, usedComponentTypes);
    
    // Compiler chaque template
    for (const [templatePath, templateContent] of Object.entries(templatesData.templates)) {
      console.log(`[STEP] Compiling template: ${templatePath}`);
      
      // Compiler le template Handlebars
      const template = Handlebars.compile(templateContent);
      
      let compiledContent;
      let shouldGenerate = true;
      
      // Si c'est un template component, vérifier s'il est utilisé
      if (templatePath.includes('/components/')) {
        const componentType = getComponentTypeFromPath(templatePath);
        
        if (!usedComponentTypes.includes(componentType)) {
          console.log(`[STEP] Skipping unused component: ${componentType}`);
          shouldGenerate = false;
        } else {
          const componentData = findComponentByType(allComponents, componentType);
          
          if (componentData) {
            console.log(`[STEP] Using component data for ${componentType}:`, componentData);
            compiledContent = template(componentData);
          } else {
            console.log(`[STEP] No component data found for ${componentType}, using base variables`);
            compiledContent = template(baseVariables);
          }
        }
      } else {
        // Pour les autres templates (package.json, etc.), toujours générer
        compiledContent = template(baseVariables);
      }
      
      // Générer seulement si nécessaire
      if (shouldGenerate) {
        // Déterminer le chemin de sortie (enlever .hbs)
        const outputPath = templatePath.replace('.hbs', '');
        
        // Stocker le résultat
        services[outputPath] = compiledContent;
        artifacts.push(outputPath);
      }
    }
    
    return {
      generated: true,
      output: {
        projectId: projectData.id,
        services
      },
      artifacts,
      metadata: {
        generatedAt: new Date().toISOString(),
        templatesCompiled: artifacts.length,
        componentsFound: allComponents.length
      }
    };
    
  } catch (error) {
    throw new Error(`GenerationError: Failed to compile templates - ${error.message}`);
  }
}

// Helper : Extraire tous les components du project.json
function extractAllComponents(projectData) {
  const components = [];
    
  // FIX: Aller chercher dans projectData.project.pages
  const project = projectData.project || projectData;  
  if (project.pages) {
    for (const page of project.pages) {
      if (page.layout && page.layout.sections) {
        for (const section of page.layout.sections) {
          if (section.divs) {
            for (const div of section.divs) {
              if (div.components) {
                components.push(...div.components);
              }
            }
          }
        }
      }
    }
  } else {
  }
  
  return components;
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