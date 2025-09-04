import { buildWorkflow } from '../app-server/engines/build-coordinator.js';
import { createWorkflow } from '../app-server/engines/create-coordinator.js';
import { rm } from 'fs/promises';
import { join } from 'path';

describe('BUILD workflow integration - DIAGNOSTIC', () => {
  // Utiliser des IDs uniques pour chaque test
  const baseTestId = 'test-build-' + Date.now();
  
  afterEach(async () => {
    // Cleanup avec le bon chemin et la mÃ©thode moderne
    try {
      const projectPath = `app-server/data/outputs/${baseTestId}-${Date.now()}`;
      await rm(projectPath, { recursive: true, force: true });
      console.log(`âœ… Cleanup: Dossier supprimÃ©`);
    } catch (error) {
      console.log(`âš ï¸ Cleanup: ${error.message}`);
    }
  });

  test('DIAGNOSTIC: peut crÃ©er un projet DRAFT', async () => {
    console.log('\ní·ª TEST DIAGNOSTIC - Ã‰tape 1: CREATE workflow');
    
    const testProjectId = `${baseTestId}-create`;
    
    const createResult = await createWorkflow(testProjectId, {
      name: 'Test Build Diagnostic Create',
      template: 'contact',
      description: 'Projet de test pour diagnostiquer BUILD - CREATE'
    });

    console.log('í³‹ RÃ©sultat CREATE:', JSON.stringify(createResult, null, 2));
    
    // Validation basique
    expect(createResult.success).toBe(true);
    expect(createResult.data.fromState).toBe('VOID');
    expect(createResult.data.toState).toBe('DRAFT');
    
    console.log('âœ… CREATE workflow fonctionne parfaitement\n');
    
    // Cleanup immÃ©diat pour ce test
    try {
      const projectPath = `app-server/data/outputs/${testProjectId}`;
      await rm(projectPath, { recursive: true, force: true });
    } catch (error) {
      console.log(`âš ï¸ Cleanup immÃ©diat: ${error.message}`);
    }
  });

  test('DIAGNOSTIC: peut builder un projet DRAFT â†’ BUILT', async () => {
    console.log('\ní·ª TEST DIAGNOSTIC - Ã‰tape 2: BUILD workflow');
    
    const testProjectId = `${baseTestId}-build`;
    
    // PHASE 1: CrÃ©er le projet DRAFT
    console.log('í³ Phase 1: CrÃ©ation du projet...');
    const createResult = await createWorkflow(testProjectId, {
      name: 'Test Build Complete',
      template: 'contact'
    });
    
    expect(createResult.success).toBe(true);
    console.log('âœ… Projet crÃ©Ã© avec succÃ¨s');

    // Pause pour stabilitÃ© filesystem
    await new Promise(resolve => setTimeout(resolve, 500));

    // PHASE 2: Tenter le BUILD
    console.log('í´§ Phase 2: Tentative BUILD...');
    const buildResult = await buildWorkflow(testProjectId, {
      production: false,
      targets: ['app-visitor'],
      minify: false
    });

    console.log('í³‹ RÃ©sultat BUILD:', JSON.stringify(buildResult, null, 2));

    if (!buildResult.success) {
      console.error('âŒ BUILD Ã©chouÃ©:', buildResult.error);
      
      // Diagnostic automatique de l'erreur
      if (buildResult.error.includes('not found') || buildResult.error.includes('Cannot find')) {
        console.log('í´ DIAGNOSTIC: Fonction ou module manquant');
      } else if (buildResult.error.includes('is not a function')) {
        console.log('í´ DIAGNOSTIC: Fonction non exportÃ©e');
      } else if (buildResult.error.includes('state')) {
        console.log('í´ DIAGNOSTIC: ProblÃ¨me de dÃ©tection d\'Ã©tat');
      } else {
        console.log('í´ DIAGNOSTIC: Erreur autre:', buildResult.error);
      }
      
      // On fait Ã©chouer le test pour voir l'erreur exacte
      throw new Error(`BUILD workflow Ã©chouÃ©: ${buildResult.error}`);
    }

    // Si on arrive ici, c'est que Ã§a a marchÃ© !
    console.log('í¾‰ BUILD rÃ©ussi !');
    expect(buildResult.success).toBe(true);
    expect(buildResult.data.fromState).toBe('DRAFT');
    expect(buildResult.data.toState).toBe('BUILT');
    
    console.log('âœ… BUILD workflow fonctionne parfaitement\n');
    
    // Cleanup immÃ©diat pour ce test
    try {
      const projectPath = `app-server/data/outputs/${testProjectId}`;
      await rm(projectPath, { recursive: true, force: true });
    } catch (error) {
      console.log(`âš ï¸ Cleanup immÃ©diat: ${error.message}`);
    }
  });

  test('DIAGNOSTIC: refuse de builder un projet inexistant', async () => {
    console.log('\ní·ª TEST DIAGNOSTIC - Ã‰tape 3: Validation erreurs');
    
    const testProjectId = `${baseTestId}-nonexistent`;
    
    const buildResult = await buildWorkflow(testProjectId, {});
    
    console.log('í³‹ RÃ©sultat BUILD projet inexistant:', JSON.stringify(buildResult, null, 2));
    
    expect(buildResult.success).toBe(false);
    expect(buildResult.error).toContain('state');
    
    console.log('âœ… Gestion d\'erreur fonctionne correctement\n');
  });
});
