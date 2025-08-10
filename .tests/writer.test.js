import { writePath } from '../app-server/systems/writer.js';
import { readPath } from '../app-server/systems/reader.js';
import { unlink, rmdir } from 'fs/promises';

describe('writer.js', () => {
  const testFile = './test-temp-file.json';
  const testData = { test: 'data', created: new Date().toISOString() };

  afterEach(async () => {
    // Cleanup automatique après chaque test
    try {
      await unlink(testFile);
    } catch (error) {
      // Fichier n'existe pas = OK
    }
  });

  test('écrit un fichier JSON', async () => {
    const result = await writePath(testFile, testData);
    
    expect(result.success).toBe(true);
    expect(result.data.written).toBe(true);
    expect(result.data.path).toBe(testFile);
    
    // Vérifier que le fichier est vraiment créé
    const verification = await readPath(testFile);
    expect(verification.data.exists).toBe(true);
    expect(verification.data.content).toContain('"test": "data"');
  });
});