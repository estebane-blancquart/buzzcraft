/**
 * TESTS COMMIT 62 - Panel Projects
 * Validation list + create + search + filters
 */

import { 
  loadProjectsList, 
  validateProjectsList, 
  updateProjectsSort, 
  getProjectsListStatus 
} from '../../app-client/panels/projects/list.js';

import { 
  createNewProject, 
  validateProjectData, 
  applyProjectTemplate, 
  getProjectCreationStatus 
} from '../../app-client/panels/projects/create.js';

import { 
  searchProjects, 
  validateSearchFilters, 
  updateSearchIndex, 
  getSearchPerformance 
} from '../../app-client/panels/projects/search.js';

import { 
  loadProjectFilters, 
  validateFilterPreset, 
  applyFilterPreset, 
  getFiltersStatus 
} from '../../app-client/panels/projects/filters.js';

describe('COMMIT 62 - Panel Projects', () => {
  
  describe('Projects List', () => {
    test('loadProjectsList - charge liste avec pagination', async () => {
      const result = await loadProjectsList({}, { page: 1, limit: 2 });
      
      expect(Array.isArray(result.projects)).toBe(true);
      expect(result.projects.length).toBeLessThanOrEqual(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
    });

    test('validateProjectsList - valide structure liste', async () => {
      const listData = {
        projects: [{ id: 'test', name: 'Test Project' }],
        pagination: { page: 1, limit: 10 }
      };
      const result = await validateProjectsList(listData);
      
      expect(result.valid).toBe(true);
      expect(result.projectsCount).toBe(1);
    });

    test('updateProjectsSort - trie projets par champ', async () => {
      const listData = {
        projects: [
          { name: 'Z Project', created: '2025-01-01' },
          { name: 'A Project', created: '2025-02-01' }
        ]
      };
      const result = await updateProjectsSort(listData, 'name', 'asc');
      
      expect(result.sorted).toBe(true);
      expect(result.projects[0].name).toBe('A Project');
    });

    test('erreurs list - gère erreurs appropriées', async () => {
      await expect(loadProjectsList(null)).rejects.toThrow('ListError');
      await expect(loadProjectsList({}, { page: 0 })).rejects.toThrow('PaginationError');
    });
  });

  describe('Project Creation', () => {
    test('createNewProject - crée projet avec données valides', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Description de test',
        type: 'web',
        author: 'Test User'
      };
      const result = await createNewProject(projectData);
      
      expect(result.created).toBe(true);
      expect(result.project.id).toBeDefined();
      expect(result.project.name).toBe('Test Project');
      expect(result.next.action).toBe('open_editor');
    });

    test('validateProjectData - valide données projet', async () => {
      const validData = {
        name: 'Valid Project Name',
        description: 'Une description suffisamment longue pour passer la validation',
        type: 'web'
      };
      const result = await validateProjectData(validData);
      
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('applyProjectTemplate - applique template', async () => {
      const projectData = { name: 'Test', description: 'Test desc', type: 'web' };
      const result = await applyProjectTemplate(projectData, 'react-app');
      
      expect(result.applied).toBe(true);
      expect(result.templateId).toBe('react-app');
      expect(result.project.template.id).toBe('react-app');
    });

    test('erreurs creation - gère erreurs appropriées', async () => {
      await expect(createNewProject(null)).rejects.toThrow('CreateError');
      await expect(createNewProject({})).rejects.toThrow('ValidationError');
      await expect(applyProjectTemplate({}, 'invalid')).rejects.toThrow('TemplateError');
    });
  });

  describe('Project Search', () => {
    test('searchProjects - recherche avec query et filtres', async () => {
      const result = await searchProjects('portfolio', { type: 'portfolio' });
      
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.stats.query).toBe('portfolio');
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    test('validateSearchFilters - valide filtres recherche', async () => {
      const filters = { status: 'active', type: 'web' };
      const result = await validateSearchFilters(filters);
      
      expect(result.valid).toBe(true);
      expect(result.validFilters.status).toBe('active');
    });

    test('updateSearchIndex - met à jour index', async () => {
      const projects = [
        { name: 'Test Project', description: 'Test desc', tags: ['test'], author: 'User' }
      ];
      const result = await updateSearchIndex(projects);
      
      expect(result.indexed).toBe(true);
      expect(result.projectsCount).toBe(1);
      expect(result.termsCount).toBeGreaterThan(0);
    });

    test('erreurs search - gère erreurs appropriées', async () => {
      await expect(updateSearchIndex('invalid')).rejects.toThrow('IndexError');
    });
  });

  describe('Project Filters', () => {
    test('loadProjectFilters - charge filtres et presets', async () => {
      const result = await loadProjectFilters();
      
      expect(result.filters).toBeDefined();
      expect(Array.isArray(result.presets)).toBe(true);
      expect(result.presets.length).toBeGreaterThan(0);
    });

    test('validateFilterPreset - valide preset', async () => {
      const preset = {
        id: 'test-preset',
        name: 'Test Preset',
        filters: { status: 'active' }
      };
      const result = await validateFilterPreset(preset);
      
      expect(result.valid).toBe(true);
      expect(result.preset).toBe('Test Preset');
    });

    test('applyFilterPreset - applique preset', async () => {
      const preset = {
        id: 'test',
        filters: { status: 'active', type: 'web' }
      };
      const result = await applyFilterPreset(preset, { author: 'me' });
      
      expect(result.applied).toBe(true);
      expect(result.filters.status).toBe('active');
      expect(result.filters.author).toBe('me');
    });

    test('erreurs filters - gère erreurs appropriées', async () => {
      await expect(applyFilterPreset({})).rejects.toThrow('PresetError');
    });
  });

  describe('Pattern BuzzCraft', () => {
    test('structure modules - 4 fonctions par module', () => {
      // List : 4 fonctions
      expect(typeof loadProjectsList).toBe('function');
      expect(typeof validateProjectsList).toBe('function');
      expect(typeof updateProjectsSort).toBe('function');
      expect(typeof getProjectsListStatus).toBe('function');

      // Create : 4 fonctions  
      expect(typeof createNewProject).toBe('function');
      expect(typeof validateProjectData).toBe('function');
      expect(typeof applyProjectTemplate).toBe('function');
      expect(typeof getProjectCreationStatus).toBe('function');

      // Search : 4 fonctions
      expect(typeof searchProjects).toBe('function');
      expect(typeof validateSearchFilters).toBe('function');
      expect(typeof updateSearchIndex).toBe('function');
      expect(typeof getSearchPerformance).toBe('function');

      // Filters : 4 fonctions
      expect(typeof loadProjectFilters).toBe('function');
      expect(typeof validateFilterPreset).toBe('function');
      expect(typeof applyFilterPreset).toBe('function');
      expect(typeof getFiltersStatus).toBe('function');
    });

    test('timestamps - présents dans tous les retours', async () => {
      const listResult = await loadProjectsList({});
      const createResult = await createNewProject({ name: 'Test', description: 'Test desc test', type: 'web' });
      const searchResult = await searchProjects();
      const filtersResult = await loadProjectFilters();
      
      expect(listResult.timestamp).toBeDefined();
      expect(createResult.timestamp).toBeDefined();
      expect(searchResult.timestamp).toBeDefined();
      expect(filtersResult.timestamp).toBeDefined();
    });

    test('erreurs typées - format correct', async () => {
      const errorTests = [
        { fn: () => loadProjectsList(null), type: 'ListError' },
        { fn: () => createNewProject(null), type: 'CreateError' },
        { fn: () => updateSearchIndex('invalid'), type: 'IndexError' },
        { fn: () => applyFilterPreset({}), type: 'PresetError' }
      ];

      for (const test of errorTests) {
        await expect(test.fn()).rejects.toThrow(test.type);
      }
    });
  });
});
