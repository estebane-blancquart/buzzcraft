/**
 * COMMIT 62 - Panel Projects
 * 
 * FAIT QUOI : Liste projets avec pagination, tri et sélection multiple
 * REÇOIT : listConfig: object, pagination?: object, sorting?: object, selection?: object
 * RETOURNE : { projects: array, pagination: object, sorting: object, selection: array }
 * ERREURS : ListError si config invalide, PaginationError si page incorrecte, SortingError si tri impossible, SelectionError si sélection échoue
 */

export async function loadProjectsList(listConfig = {}, pagination = {}) {
  if (!listConfig || typeof listConfig !== 'object') {
    throw new Error('ListError: Configuration liste requise');
  }

  // Simulation données projets
  const mockProjects = [
    {
      id: 'proj-001',
      name: 'Site E-commerce',
      description: 'Plateforme de vente en ligne avec panier et paiement',
      status: 'active',
      technology: 'React + Node.js',
      created: '2025-01-15T10:30:00Z',
      updated: '2025-07-22T14:20:00Z',
      author: 'Marie Dupont',
      progress: 85,
      deployments: 3,
      type: 'web'
    },
    {
      id: 'proj-002', 
      name: 'Portfolio Designer',
      description: 'Site vitrine pour un designer graphique',
      status: 'completed',
      technology: 'Vue.js + Tailwind',
      created: '2025-06-10T09:15:00Z',
      updated: '2025-07-18T16:45:00Z',
      author: 'Jean Martin',
      progress: 100,
      deployments: 1,
      type: 'portfolio'
    },
    {
      id: 'proj-003',
      name: 'Dashboard Analytics',
      description: 'Interface d\'administration avec métriques temps réel',
      status: 'development',
      technology: 'Angular + D3.js',
      created: '2025-07-01T11:00:00Z',
      updated: '2025-07-23T10:30:00Z',
      author: 'Sophie Moreau',
      progress: 45,
      deployments: 0,
      type: 'dashboard'
    },
    {
      id: 'proj-004',
      name: 'App Mobile Banking',
      description: 'Application mobile pour services bancaires',
      status: 'planning',
      technology: 'React Native',
      created: '2025-07-20T14:30:00Z',
      updated: '2025-07-23T09:00:00Z',
      author: 'Pierre Dubois',
      progress: 10,
      deployments: 0,
      type: 'mobile'
    }
  ];

  // Pagination
  const defaultPagination = {
    page: 1,
    limit: 10,
    total: mockProjects.length
  };

  const paginationConfig = { ...defaultPagination, ...pagination };
  
  if (paginationConfig.page < 1) {
    throw new Error('PaginationError: Numéro de page doit être positif');
  }

  const startIndex = (paginationConfig.page - 1) * paginationConfig.limit;
  const endIndex = startIndex + paginationConfig.limit;
  const paginatedProjects = mockProjects.slice(startIndex, endIndex);

  return {
    projects: paginatedProjects,
    pagination: {
      ...paginationConfig,
      pages: Math.ceil(mockProjects.length / paginationConfig.limit),
      hasNext: endIndex < mockProjects.length,
      hasPrev: paginationConfig.page > 1
    },
    sorting: { field: 'updated', order: 'desc' },
    selection: [],
    timestamp: new Date().toISOString()
  };
}

export async function validateProjectsList(listData) {
  const validation = {
    valid: true,
    projectsCount: 0,
    issues: [],
    timestamp: new Date().toISOString()
  };

  if (!listData?.projects) {
    validation.issues.push('Liste projets manquante');
    validation.valid = false;
  } else {
    validation.projectsCount = listData.projects.length;
    
    // Validation structure projets
    for (const project of listData.projects) {
      if (!project.id || !project.name) {
        validation.issues.push(`Projet invalide: ${project.id || 'sans ID'}`);
        validation.valid = false;
      }
    }
  }

  if (!listData?.pagination) {
    validation.issues.push('Configuration pagination manquante');
    validation.valid = false;
  }

  return validation;
}

export async function updateProjectsSort(listData, sortField, sortOrder = 'asc') {
  if (!listData?.projects) {
    throw new Error('SortingError: Liste projets manquante');
  }

  const validFields = ['name', 'created', 'updated', 'status', 'progress', 'author'];
  if (!validFields.includes(sortField)) {
    throw new Error('SortingError: Champ de tri non supporté');
  }

  const validOrders = ['asc', 'desc'];
  if (!validOrders.includes(sortOrder)) {
    throw new Error('SortingError: Ordre de tri invalide');
  }

  const sortedProjects = [...listData.projects].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];

    // Gestion des types
    if (typeof valueA === 'string') {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });

  return {
    sorted: true,
    projects: sortedProjects,
    sorting: { field: sortField, order: sortOrder },
    count: sortedProjects.length,
    timestamp: new Date().toISOString()
  };
}

export async function getProjectsListStatus(listData) {
  if (!listData?.projects) {
    return {
      status: 'empty',
      projects: 0,
      pages: 0,
      timestamp: new Date().toISOString()
    };
  }

  const { projects, pagination } = listData;
  const statusCounts = projects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {});

  return {
    status: projects.length > 0 ? 'loaded' : 'empty',
    projects: projects.length,
    pages: pagination?.pages || 0,
    breakdown: statusCounts,
    lastUpdate: listData.timestamp,
    timestamp: new Date().toISOString()
  };
}

// panels/projects/list : Panel Projects (commit 62)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
