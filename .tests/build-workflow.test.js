import { buildWorkflow } from '../app-server/engines/build/coordinator.js';
import { createWorkflow } from '../app-server/engines/create/coordinator.js';
import { readPath } from '../app-server/systems/reader.js';
import { unlink, rmdir } from 'fs/promises';
import { join } from 'path';

describe('BUILD workflow integration', () => {
  const testProjectId = 'test-build-simple';
  const testProjectPath = `../app-server/outputs/projects/${testProjectId}`;
  const testProjectFile = join(testProjectPath, 'project.json');

  afterEach(async () => {
    // Cleanup simple - on supprime tout le dossier projet
    try {
      await unlink(testProjectFile);
      await rmdir(testProjectPath, { recursive: true });
    } catch (error) {
      // Dossier n'existe pas = OK
    }
  });

  test('build un projet DRAFT en BUILT', async () => {
    // ÉTAPE 1: Créer un projet DRAFT
    const createResult = await createWorkflow(testProjectId, {
      name: 'Test Build',
      template: 'basic'
    });
    expect(createResult.success).toBe(true);

    // ÉTAPE 2: Builder le projet
    const buildResult = await buildWorkflow(testProjectId, {});

    // Vérifier le résultat
    expect(buildResult.success).toBe(true);
    expect(buildResult.data.fromState).toBe('DRAFT');
    expect(buildResult.data.toState).toBe('BUILT');
  });

  test('refuse de build un projet inexistant', async () => {
    const result = await buildWorkflow('projet-inexistant', {});

    expect(result.success).toBe(false);
    expect(result.error).toContain('must be in DRAFT state');
  });
});