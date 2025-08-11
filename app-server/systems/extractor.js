/*
 * FAIT QUOI : Extraction récursive de tous les components d'un projet
 * REÇOIT : projectData: object
 * RETOURNE : component[] (tous les components trouvés)
 * ERREURS : Aucune (extraction défensive)
 */

export function extractAllComponents(projectData) {
  console.log(`[EXTRACT] Starting component extraction`);
  
  const components = [];
  const project = projectData.project || projectData;
  
  if (!project || typeof project !== 'object') {
    console.log(`[EXTRACT] No project data found`);
    return components;
  }

  // Fonction récursive pour extraire components de n'importe quelle structure
  function extractFromNode(node, path = '') {
    if (!node || typeof node !== 'object') return;
    
    // Si le node est un component (a un type et un id)
    if (node.type && node.id && typeof node.type === 'string') {
      console.log(`[EXTRACT] Found component: ${node.type} (${node.id}) at ${path}`);
      components.push({
        ...node,
        _path: path // Pour debug si besoin
      });
      return; // Un component ne contient pas d'autres components
    }
    
    // Sinon, chercher récursivement dans toutes les propriétés
    Object.keys(node).forEach(key => {
      const value = node[key];
      const currentPath = path ? `${path}.${key}` : key;
      
      if (Array.isArray(value)) {
        // Traiter chaque élément du tableau
        value.forEach((item, index) => {
          extractFromNode(item, `${currentPath}[${index}]`);
        });
      } else if (value && typeof value === 'object') {
        // Traiter l'objet récursivement
        extractFromNode(value, currentPath);
      }
    });
  }
  
  // Démarrer l'extraction récursive
  extractFromNode(project, 'project');
  
  console.log(`[EXTRACT] Found ${components.length} total components`);
  return components;
}

/*
 * FAIT QUOI : Extraction de tous les types de containers (div, list, form)
 * REÇOIT : projectData: object
 * RETOURNE : container[] (tous les containers trouvés)
 * ERREURS : Aucune (extraction défensive)
 */

export function extractAllContainers(projectData) {
  console.log(`[EXTRACT] Starting container extraction`);
  
  const containers = [];
  const project = projectData.project || projectData;
  
  if (!project || typeof project !== 'object') {
    return containers;
  }

  function extractContainersFromNode(node, path = '') {
    if (!node || typeof node !== 'object') return;
    
    // Si le node est un container (a un type container connu)
    const containerTypes = ['div', 'list', 'form', 'section'];
    if (node.type && containerTypes.includes(node.type) && node.id) {
      console.log(`[EXTRACT] Found container: ${node.type} (${node.id}) at ${path}`);
      containers.push({
        ...node,
        _path: path
      });
      // Continuer l'extraction dans ce container
    }
    
    // Chercher récursivement
    Object.keys(node).forEach(key => {
      const value = node[key];
      const currentPath = path ? `${path}.${key}` : key;
      
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          extractContainersFromNode(item, `${currentPath}[${index}]`);
        });
      } else if (value && typeof value === 'object') {
        extractContainersFromNode(value, currentPath);
      }
    });
  }
  
  extractContainersFromNode(project, 'project');
  
  console.log(`[EXTRACT] Found ${containers.length} total containers`);
  return containers;
}