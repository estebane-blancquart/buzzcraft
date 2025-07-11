const { JsonProjectValidator } = require('../src/json-validator')
const fs = require('fs').promises
const path = require('path')

async function testFile(filename) {
  try {
    const validator = new JsonProjectValidator()
    const testFile = path.join(__dirname, '../../../data/examples', filename)
    const content = await fs.readFile(testFile, 'utf8')
    const project = JSON.parse(content)
    
    const result = await validator.validateProject(project)
    console.log(`${filename}: ${result.success ? '✅ PASSED' : '❌ FAILED'}`)
    
    if (!result.success) {
      result.errors.forEach(err => console.log(`  • ${err}`))
    }
  } catch (error) {
    console.log(`${filename}: ��� ERROR - ${error.message}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args[0] === '--test') {
    console.log('��� Testing with minimal example...')
    await testFile('test-minimal.json')
    
  } else if (args[0] === '--dubois') {
    console.log('��� Testing with Dubois Plomberie example...')
    await testFile('artisan-dubois-complete.json')
    
  } else if (args[0] === '--all') {
    console.log('��� Testing all examples...')
    await testFile('test-minimal.json')
    await testFile('artisan-dubois-complete.json')
    
  } else {
    console.log('Usage:')
    console.log('  npm test           # Test minimal')
    console.log('  npm run test:dubois # Test Dubois')
    console.log('  npm run test:all    # Test all')
  }
}

main().catch(console.error)

// Ajouter test pour dubois-simple
if (process.argv[2] === '--simple') {
  console.log('��� Testing Dubois Simple...')
  testFile('dubois-simple.json')
}
