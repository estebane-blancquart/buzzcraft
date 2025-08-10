import { readPath } from '../app-server/systems/reader.js';

describe('reader.js', () => {
  test('lit le package.json', async () => {
    const result = await readPath('./package.json');
    
    expect(result.success).toBe(true);
    expect(result.data.exists).toBe(true);
    expect(result.data.type).toBe('file');
    expect(result.data.content).toContain('"name": "buzzcraft"');
  });

  test('fichier inexistant retourne exists: false', async () => {
    const result = await readPath('./fichier-inexistant.txt');
    
    expect(result.success).toBe(true);
    expect(result.data.exists).toBe(false);
  });
});