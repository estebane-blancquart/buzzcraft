#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const MultiPageGenerator = require('../src/json-to-react-multipage');
const AdminGenerator = require('../src/admin-generator');

async function main() {
  const jsonPath = process.argv[2] || '../../data/examples/dubois-multipage.json';
  
  // Lire le JSON pour extraire le projectId
  const jsonContent = await fs.readFile(jsonPath, 'utf8');
  const jsonProject = JSON.parse(jsonContent);
  const projectId = jsonProject.meta?.projectId || 'unknown-project';
  
  const outputPath = process.argv[3] || `./output/${projectId}-with-admin`;

  console.log('Ì∫Ä BuzzCraft Parser with Admin - Phase 3C');
  console.log('===========================================');

  try {
    console.log(`Ì≥Å Projet: ${jsonProject.meta?.projectId}`);
    console.log('Ì¥Ñ G√©n√©ration site + admin...');

    const multiPageGenerator = new MultiPageGenerator();
    await multiPageGenerator.generateProject(jsonProject, outputPath);

    const adminGenerator = new AdminGenerator();
    await adminGenerator.generateAdminSystem(jsonProject, outputPath);

    console.log('‚úÖ Site + Admin g√©n√©r√©s');
    console.log(`Ì≥Å Sortie: ${outputPath}`);
    console.log('1. cd ' + outputPath);
    console.log('2. npm install');
    console.log('3. npm run build');

  } catch (error) {
    console.error('‚ùå Erreur:', error.message);
    process.exit(1);
  }
}

main();
