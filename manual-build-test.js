import { createWorkflow } from './app-server/engines/create-coordinator.js';
import { buildWorkflow } from './app-server/engines/build-coordinator.js';
import { rm } from 'fs/promises';

/**
 * Test manuel du BUILD workflow sans Jest
 * Lance avec: node manual-build-test.js
 */

async function testBuildWorkflow() {
  const testProjectId = 'manual-build-test';
  
  console.log('🚀 === TEST MANUEL BUILD WORKFLOW ===\n');

  try {
    // Cleanup initial
    console.log('🧹 Nettoyage initial...');
    try {
      await rm(`app-server/data/outputs/${testProjectId}`, { recursive: true, force: true });
    } catch (e) { /* ignore */ }

    // ÉTAPE 1: Créer un projet DRAFT
    console.log('📝 ÉTAPE 1: Création projet DRAFT...');
    const createResult = await createWorkflow(testProjectId, {
      name: 'Test Build Manual',
      template: 'contact',
      description: 'Test manuel BUILD'
    });
    
    if (!createResult.success) {
      console.error('❌ CREATE échoué:', createResult.error);
      return;
    }
    
    console.log('✅ Projet créé:', createResult.data.projectId);
    console.log('   État:', createResult.data.fromState, '→', createResult.data.toState);

    // Pause
    console.log('⏱️ Pause filesystem...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // ÉTAPE 2: BUILD
    console.log('\n🔧 ÉTAPE 2: BUILD workflow...');
    const buildResult = await buildWorkflow(testProjectId, {
      production: false,
      targets: ['app-visitor'],
      minify: false
    });
    
    if (!buildResult.success) {
      console.error('❌ BUILD échoué:', buildResult.error);
      console.log('\n🔍 DIAGNOSTIC de l\'erreur:');
      
      if (buildResult.error.includes('template') || buildResult.error.includes('Handlebars')) {
        console.log('   → Problème templates Handlebars');
      } else if (buildResult.error.includes('not found')) {
        console.log('   → Fichier/module manquant');
      } else if (buildResult.error.includes('state')) {
        console.log('   → Problème détection état');
      } else {
        console.log('   → Erreur système:', buildResult.error);
      }
      return;
    }

    // SUCCESS !
    console.log('🎉 BUILD RÉUSSI !');
    console.log('   Transition:', buildResult.data.fromState, '→', buildResult.data.toState);
    console.log('   Fichiers:', buildResult.data.totalFiles);
    console.log('   Taille:', buildResult.data.totalSize, 'bytes');
    console.log('   Targets:', buildResult.data.buildConfig.targets.join(', '));

    console.log('\n✅ Le workflow BUILD fonctionne parfaitement !');
    
  } catch (error) {
    console.error('💥 ERREUR SYSTÈME:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Cleanup final
    try {
      await rm(`app-server/data/outputs/${testProjectId}`, { recursive: true, force: true });
      console.log('\n🧹 Nettoyage final terminé');
    } catch (e) { /* ignore */ }
  }
}

// Lance le test
testBuildWorkflow();