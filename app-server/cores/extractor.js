/*
 * FAIT QUOI : Extraction récursive de tous les components ET containers d'un projet
 * REÇOIT : projectData: object
 * RETOURNE : item[] (tous les components ET containers trouvés)
 * ERREURS : Aucune (extraction défensive)
 */

export function extractAllComponents(projectData) {
  console.log(`[EXTRACT] Starting component extraction`);
  
  const items = [];
  const project = projectData.project || projectData;
  
  if (!project || typeof project !== 'object') {
    console.log(`[EXTRACT] No project data found`);
    return items;
  }

  // Fonction récursive pour extraire components ET containers de n'importe quelle structure
  function extractFromNode(node, path = '') {
    if (!node || typeof node !== 'object') return;
    
    // Si le node est un component (a un type et un id)
    if (node.type && node.id && typeof node.type === 'string') {
      console.log(`[EXTRACT] Found component: ${node.type} (${node.id}) at ${path}`);
      items.push({
        ...node,
        _path: path,
        _category: 'component'
      });
      return; // Un component ne contient pas d'autres items
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
  
  console.log(`[EXTRACT] Found ${items.length} total items (components + containers)`);
  return items;
}

/*
 * FAIT QUOI : Extraction spécifique des containers (div, list, form)
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
        _path: path,
        _category: 'container'
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

/*
 * FAIT QUOI : Extraction unifiée de tous les éléments (components + containers)
 * REÇOIT : projectData: object
 * RETOURNE : element[] (tous les éléments avec type utilisable pour templates)
 * ERREURS : Aucune (extraction défensive)
 */

export function extractAllElements(projectData) {
  console.log(`[EXTRACT] Starting unified element extraction`);
  
  const elements = [];
  const project = projectData.project || projectData;
  
  if (!project || typeof project !== 'object') {
    console.log(`[EXTRACT] No project data found`);
    return elements;
  }

  // Fonction récursive unifiée pour extraire tout ce qui a un type
  function extractFromNode(node, path = '') {
    if (!node || typeof node !== 'object') return;
    
    // Si le node a un type et un id → c'est un élément générable
    if (node.type && node.id && typeof node.type === 'string') {
      // Déterminer la catégorie
      const containerTypes = ['div', 'list', 'form', 'section'];
      const category = containerTypes.includes(node.type) ? 'container' : 'component';
      
      console.log(`[EXTRACT] Found ${category}: ${node.type} (${node.id}) at ${path}`);
      elements.push({
        ...node,
        _path: path,
        _category: category
      });
      
      // Continuer l'extraction même dans les containers (pour trouver leurs enfants)
    }
    
    // Chercher récursivement dans toutes les propriétés
    Object.keys(node).forEach(key => {
      const value = node[key];
      const currentPath = path ? `${path}.${key}` : key;
      
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          extractFromNode(item, `${currentPath}[${index}]`);
        });
      } else if (value && typeof value === 'object') {
        extractFromNode(value, currentPath);
      }
    });
  }
  
  extractFromNode(project, 'project');
  
  // Séparer les résultats par catégorie pour les logs
  const components = elements.filter(e => e._category === 'component');
  const containers = elements.filter(e => e._category === 'container');
  
  console.log(`[EXTRACT] Found ${elements.length} total elements:`);
  console.log(`[EXTRACT]   - ${components.length} components`);
  console.log(`[EXTRACT]   - ${containers.length} containers`);
  
  return elements;
}