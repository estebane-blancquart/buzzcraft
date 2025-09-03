import { createWorkflow } from './app-server/engines/create-coordinator.js';
import { buildWorkflow } from './app-server/engines/build-coordinator.js';
import { rm } from 'fs/promises';

async function testBuild() {
  const projectId = 'test-simple-build';
  
  console.log('Testing BUILD workflow...');
  
  try {
    // Cleanup
    try {
      await rm(`app-server/data/outputs/${projectId}`, { recursive: true, force: true });
    } catch (e) {}
    
    // CREATE
    console.log('1. Creating project...');
    const createResult = await createWorkflow(projectId, {
      name: 'Test Build',
      template: 'contact'
    });
    
    if (!createResult.success) {
      console.error('CREATE failed:', createResult.error);
      return;
    }
    
    console.log('CREATE success');
    
    // BUILD
    console.log('2. Building project...');
    const buildResult = await buildWorkflow(projectId, {
      targets: ['app-visitor']
    });
    
    if (!buildResult.success) {
      console.error('BUILD failed:', buildResult.error);
      return;
    }
    
    console.log('BUILD SUCCESS!');
    console.log('Files generated:', buildResult.data.totalFiles);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    // Cleanup
    try {
      await rm(`app-server/data/outputs/${projectId}`, { recursive: true, force: true });
    } catch (e) {}
  }
}

testBuild();