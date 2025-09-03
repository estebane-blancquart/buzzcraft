import { buildWorkflow } from '../app-server/engines/build-coordinator.js';
import { createWorkflow } from '../app-server/engines/create-coordinator.js';
import { unlink, rmdir } from 'fs/promises';
import { join } from 'path';

describe('BUILD workflow integration - DIAGNOSTIC', () => {
  const testProjectId = 'test-build-diagnostic';

  afterEach(async () => {
    // Cleanup complet - on supprime tout
    try {
      const projectPath = `../app-server/data/outputs/${testProjectId}`;
      await rmdir(projectPath, { recursive: true, force: true });
      console.log(`✅ Cleanup: ${testProjectId} supprimé`);
    } catch (error) {
      console.log(`⚠️ Cleanup warning: ${error.message}`);
    }
  });

  test('DIAGNOSTIC: peut créer un projet DRAFT', async () => {
    console.log('\n🧪 TEST DIAGNOSTIC - Étape 1: CREATE workflow');
    
    const createResult = await createWorkflow(testProjectId, {
      name: 'Test Build Diagnostic',
      template: 'contact',
      description: 'Projet de test pour diagnostiquer BUILD'
    });

    console.log('📋 Résultat CREATE:', JSON.stringify(createResult, null, 2));
    
    // Validation basique
    expect(createResult.success).toBe(true);
    expect(createResult.data.fromState).toBe('VOID');
    expect(createResult.data.toState).toBe('DRAFT');
    
    console.log('✅ CREATE workflow fonctionne parfaitement\n');
  });

  test('DIAGNOSTIC: peut builder un projet DRAFT → BUILT', async () => {
    console.log('\n🧪 TEST DIAGNOSTIC - Étape 2: BUILD workflow');
    
    // PHASE 1: Créer le projet DRAFT
    console.log('📝 Phase 1: Création du projet...');
    const createResult = await createWorkflow(testProjectId, {
      name: 'Test Build Complete',
      template: 'contact'
    });
    
    expect(createResult.success).toBe(true);
    console.log('✅ Projet créé avec succès');

    // Pause pour stabilité filesystem
    await new Promise(resolve => setTimeout(resolve, 500));

    // PHASE 2: Tenter le BUILD
    console.log('🔧 Phase 2: Tentative BUILD...');
    const buildResult = await buildWorkflow(testProjectId, {
      production: false,
      targets: ['app-visitor'],
      minify: false
    });

    console.log('📋 Résultat BUILD:', JSON.stringify(buildResult, null, 2));

    if (!buildResult.success) {
      console.error('❌ BUILD échoué:', buildResult.error);
      
      // Diagnostic automatique de l'erreur
      if (buildResult.error.includes('not found') || buildResult.error.includes('Cannot find')) {
        console.log('🔍 DIAGNOSTIC: Fonction ou module manquant');
      } else if (buildResult.error.includes('is not a function')) {
        console.log('🔍 DIAGNOSTIC: Fonction non exportée');
      } else if (buildResult.error.includes('state')) {
        console.log('🔍 DIAGNOSTIC: Problème de détection d\'état');
      } else {
        console.log('🔍 DIAGNOSTIC: Erreur autre:', buildResult.error);
      }
      
      // On fait échouer le test pour voir l'erreur exacte
      throw new Error(`BUILD workflow échoué: ${buildResult.error}`);
    }

    // Si on arrive ici, c'est que ça a marché !
    console.log('🎉 BUILD réussi !');
    expect(buildResult.success).toBe(true);
    expect(buildResult.data.fromState).toBe('DRAFT');
    expect(buildResult.data.toState).toBe('BUILT');
    
    console.log('✅ BUILD workflow fonctionne parfaitement\n');
  });

  test('DIAGNOSTIC: refuse de builder un projet inexistant', async () => {
    console.log('\n🧪 TEST DIAGNOSTIC - Étape 3: Validation erreurs');
    
    const buildResult = await buildWorkflow('projet-qui-nexiste-pas', {});
    
    console.log('📋 Résultat BUILD projet inexistant:', JSON.stringify(buildResult, null, 2));
    
    expect(buildResult.success).toBe(false);
    expect(buildResult.error).toContain('state');
    
    console.log('✅ Gestion d\'erreur fonctionne correctement\n');
  });
});