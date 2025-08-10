import { detectVoidState } from '../app-server/probes/void/detector.js';
import { writePath } from '../app-server/systems/writer.js';
import { unlink, rmdir } from 'fs/promises';
import { join } from 'path';

describe('void/detector.js', () => {
  const testProjectPath = './test-project-temp';
  const testProjectFile = join(testProjectPath, 'project.json');

  afterEach(async () => {
    // Cleanup du projet test
    try {
      await unlink(testProjectFile);
      await rmdir(testProjectPath);
    } catch (error) {
      // Dossier/fichier n'existe pas = OK
    }
  });

  test('détecte VOID quand projet n\'existe pas', async () => {
    const result = await detectVoidState(testProjectPath);
    
    expect(result.success).toBe(true);
    expect(result.data.state).toBe('VOID');
    expect(result.data.confidence).toBe(100);
    expect(result.data.evidence).toContain('project.json does not exist');
  });

  test('détecte NON-VOID quand projet existe', async () => {
    // Créer un projet pour le test
    const projectData = { id: 'test', state: 'DRAFT' };
    await writePath(testProjectFile, projectData);
    
    const result = await detectVoidState(testProjectPath);
    
    expect(result.success).toBe(true);
    expect(result.data.state).toBe(null); // Pas VOID
    expect(result.data.confidence).toBe(0);
    expect(result.data.evidence).toContain('project.json exists');
  });
});