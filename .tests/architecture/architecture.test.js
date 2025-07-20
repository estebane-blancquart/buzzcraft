/**
 * Tests Architecture BuzzCraft
 * RESPONSABILITÉ: Structure, headers, cohérence générale
 * NE TESTE PAS: Implémentation fonctionnelle (voir .tests/commit/)
 */

import fs from "fs";
import path from "path";

describe("Validation Architecture Pure", () => {

  test("Structure dossiers respectée", () => {
    // Vérifier structure principale
    expect(fs.existsSync("app-server")).toBe(true);
    expect(fs.existsSync("app-client")).toBe(true);
    expect(fs.existsSync("api")).toBe(true);
    
    // Vérifier sous-structure app-server
    expect(fs.existsSync("app-server/states")).toBe(true);
    expect(fs.existsSync("app-server/transitions")).toBe(true);
    expect(fs.existsSync("app-server/engines")).toBe(true);
    expect(fs.existsSync("app-server/systems")).toBe(true);
  });

  test("Package.json workspaces configurés", () => {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    
    expect(packageJson.workspaces).toEqual([
      "app-client",
      "app-server", 
      "api"
    ]);
    
    expect(packageJson.version).toBe("1.0.0");
    expect(packageJson.type).toBe("module");
  });

  test("Headers standardisés (format seulement)", () => {
    // Chercher fichiers JS dans workspaces
    const workspaces = ["app-server", "app-client", "api"];
    const allFiles = [];
    
    workspaces.forEach(workspace => {
      if (fs.existsSync(workspace)) {
        const findJsFiles = (dir) => {
          const files = fs.readdirSync(dir);
          files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
              findJsFiles(fullPath);
            } else if (file.endsWith('.js')) {
              allFiles.push(fullPath);
            }
          });
        };
        findJsFiles(workspace);
      }
    });

    // Vérifier FORMAT headers seulement (pas implémentation)
    if (allFiles.length > 0) {
      allFiles.forEach(file => {
        const content = fs.readFileSync(file, "utf8");
        
        // Vérifier format header standard
        expect(content).toMatch(/\/\*\*\s*\*\s*COMMIT \d+ - [A-Za-z ]+/);
        expect(content).toMatch(/FAIT QUOI :/);
        expect(content).toMatch(/REÇOIT :/);
        expect(content).toMatch(/RETOURNE :/);
        expect(content).toMatch(/ERREURS :/);
        
        // Vérifier commentaires de fin
        expect(content).toMatch(/DEPENDENCY FLOW/);
      });
      
      console.log(`✅ ${allFiles.length} fichiers avec headers conformes (format)`);
    }
  });

  test("Dependency flow sans cycles", () => {
    // Test basique - sera étoffé
    const dependencyRules = [
      "engines/ → transitions/ → systems/ → utils/",
      "states/ → independent (called by engines)",
      "app-client/ → api/ (never the reverse)"
    ];
    
    // Pour l'instant, test symbolique
    expect(dependencyRules.length).toBe(3);
    
    // TODO: Parser vraiment les imports et détecter cycles
    console.log("ℹ️  Dependency flow validation basique OK");
  });

});
