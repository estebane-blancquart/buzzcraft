#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const DeploymentEngine = require('../src/deployment-engine')

async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.length === 0) {
    console.log(`
Ì∫Ä BuzzCraft Deployment Engine

Usage:
  buzzcraft-deploy <project-path> [options]
  
Options:
  --local          Deploy locally (default)
  --port <port>    Custom port (default: auto)
  --domain <domain> Custom domain (default: project-id.localhost)
  --verbose        Verbose output
  
Examples:
  buzzcraft-deploy ../parser/output/dubois-simple --local --verbose
  buzzcraft-deploy ./my-project --port 3001 --domain mysite.local
    `)
    return
  }
  
  const projectPath = path.resolve(args[0])
  
  if (!await fs.pathExists(projectPath)) {
    console.error(`‚ùå Project path not found: ${projectPath}`)
    process.exit(1)
  }
  
  const options = {
    mode: 'local',
    verbose: args.includes('--verbose'),
    port: args.includes('--port') ? parseInt(args[args.indexOf('--port') + 1]) : undefined,
    domain: args.includes('--domain') ? args[args.indexOf('--domain') + 1] : undefined
  }
  
  console.log('Ì∫Ä BuzzCraft Deployment Engine')
  console.log(`Ì≥Å Project: ${projectPath}`)
  console.log(`ÌæØ Mode: ${options.mode}`)
  
  const engine = new DeploymentEngine(options)
  
  try {
    const result = await engine.deployProject(projectPath, options)
    
    if (result.success) {
      console.log('\nÌæâ Deployment successful!')
      console.log(`Ì≥Å Project ID: ${result.projectId}`)
      console.log(`ÔøΩÔøΩ URL: ${result.url}`)
      console.log(`Ì∞≥ Container: ${result.containerName}`)
      console.log(`‚è±Ô∏è Duration: ${result.duration}ms`)
      console.log('\nÌ≥ã Next steps:')
      console.log(`1. Visit: ${result.url}`)
      console.log(`2. View logs: docker logs ${result.containerName}`)
      console.log(`3. Stop: docker stop ${result.containerName}`)
    } else {
      console.error('\n‚ùå Deployment failed!')
      console.error(`Error: ${result.error}`)
      process.exit(1)
    }
  } catch (error) {
    console.error('\nÌ≤• Deployment error!')
    console.error(error.message)
    if (options.verbose) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main().catch(console.error)
