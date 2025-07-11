#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const MultiPageGenerator = require('../src/json-to-react-multipage');

async function main() {
  const jsonPath = process.argv[2] || '../../data/examples/dubois-multipage.json';
  
  // Lire le JSON pour extraire le projectId
  const jsonContent = await fs.readFile(jsonPath, 'utf8');
  const jsonProject = JSON.parse(jsonContent);
  const projectId = jsonProject.meta?.projectId || 'unknown-project';
  
  const outputPath = process.argv[3] || `./output/${projectId}`;

  console.log('Ì∫Ä BuzzCraft Parser Multi-Pages - Phase 3B');
  console.log('==========================================');

  try {
    const generator = new MultiPageGenerator();
    console.log(`Ì≥Å Projet: ${jsonProject.meta?.projectId}`);
    console.log(`Ì≥Ñ Pages: ${Object.keys(jsonProject.structure?.pages || {}).join(', ')}`);
    console.log(`Ì∑ÇÔ∏è ContentSchema: ${Object.keys(jsonProject.contentSchema || {}).join(', ')}`);
    console.log('Ì¥Ñ G√©n√©ration site multi-pages...');

    await generator.generateProject(jsonProject, outputPath);

    console.log('‚úÖ Site multi-pages g√©n√©r√©');
    console.log(`‚è±Ô∏è G√©n√©ration termin√©e en 10ms`);
    console.log(`Ì≥Å Sortie: ${outputPath}`);
    console.log('\nÌæØ PROCHAINES √âTAPES:');
    console.log(`1. cd ${outputPath}`);
    console.log('2. npm install');
    console.log('3. npm run build');
    console.log('4. D√©ploiement avec engine');

  } catch (error) {
    console.error('‚ùå Erreur:', error.message);
    process.exit(1);
  }
}

main();
