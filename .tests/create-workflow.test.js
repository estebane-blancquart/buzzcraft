import { createWorkflow } from '../app-server/engines/create/coordinator.js';
import { readPath } from '../app-server/systems/reader.js';
import { unlink, rmdir } from 'fs/promises';
import { join } from 'path';

describe('CREATE workflow integration', () => {
  const testProjectId = 'test-integration-project';
  const testProjectPath = `../app-server/outputs/projects/${testProjectId}`;
  const testProjectFile = join(testProjectPath, 'project.json');

  afterEach(async () => {
    // Cleanup complet du projet test
    try {
      await unlink(testProjectFile);
      await rmdir(testProjectPath);
    } catch (error) {
      // Dossier/fichier n'existe pas = OK
    }
  });

  test('crée un projet complet avec template', async () => {
    const config = {
      name: 'Test Integration',
      template: 'basic'
    };

    const result = await createWorkflow(testProjectId, config);

    // Vérifier le résultat du workflow
    expect(result.success).toBe(true);
    expect(result.data.projectId).toBe(testProjectId);
    expect(result.data.fromState).toBe('VOID');
    expect(result.data.toState).toBe('DRAFT');

    // Vérifier que le fichier a été créé
    const fileCheck = await readPath(testProjectFile);
    expect(fileCheck.success).toBe(true);
    expect(fileCheck.data.exists).toBe(true);

    // Vérifier le contenu du fichier
    const projectData = JSON.parse(fileCheck.data.content);
    expect(projectData.id).toBe(testProjectId);
    expect(projectData.name).toBe('Test Integration');
    expect(projectData.template).toBe('basic');
    expect(projectData.templateName).toBe('Basic Project Template');
    expect(projectData.state).toBe('DRAFT');
  });

  test('refuse de créer un projet existant', async () => {
    // Créer le projet une première fois
    await createWorkflow(testProjectId, { name: 'Premier' });

    // Tenter de le recréer
    const result = await createWorkflow(testProjectId, { name: 'Doublon' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });
});