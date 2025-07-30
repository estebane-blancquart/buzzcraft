import express from 'express';
import { createRequest } from './request/parser.js';
import { createResponse } from './response/parser.js';
import { createWorkflow } from '../app-server/engines/create/coordinator.js';

const app = express();
app.use(express.json());

/*
 * POST /projects - Créer un nouveau projet
 */
app.post('/projects', async (req, res) => {
  try {
    // Parse request
    const requestResult = await createRequest(req);
    if (!requestResult.success) {
      return res.status(400).json({ error: requestResult.error });
    }
    
    // Execute workflow
    const workflowResult = await createWorkflow(
      requestResult.data.projectId, 
      requestResult.data.config
    );
    
    // Parse response
    const responseResult = await createResponse(workflowResult);
    
    if (!responseResult.success) {
      return res.status(500).json({ error: responseResult.error });
    }
    
    res.json(responseResult.data);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`BuzzCraft API running on http://localhost:${PORT}`);
});