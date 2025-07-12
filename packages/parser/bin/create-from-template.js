#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const [,, templateName, projectId, companyName, city] = process.argv;

if (!templateName || !projectId || !companyName || !city) {
  console.log('Usage: node create-from-template.js <template> <projectId> <companyName> <city>');
  process.exit(1);
}

const templatePath = path.join(__dirname, '..', '..', '..', 'data', 'templates', `${templateName}.json`);
const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

const newProject = {
  ...template,
  meta: {
    ...template.meta,
    projectId,
    title: companyName,
    template: false,
    created: new Date().toISOString(),
    lastModified: new Date().toISOString()
  }
};

if (newProject.contentSchema?.company?.name) {
  newProject.contentSchema.company.name.default = companyName;
}
if (newProject.contentSchema?.company?.city) {
  newProject.contentSchema.company.city.default = city;
}

const projectPath = path.join(__dirname, '..', '..', '..', 'data', 'projects', `${projectId}.json`);
fs.writeFileSync(projectPath, JSON.stringify(newProject, null, 2));

console.log(`✅ Projet ${projectId} créé`);
