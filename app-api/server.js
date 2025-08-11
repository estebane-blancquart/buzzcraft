import express from "express";
import { request } from "./request/parser.js";
import { process as processRequest } from "./request/processor.js";
import { response } from "./response/parser.js";
import { process as processResponse } from "./response/processor.js";
import { createWorkflow } from "../app-server/engines/create/coordinator.js";
import { buildWorkflow } from "../app-server/engines/build/coordinator.js";
import { deployWorkflow } from "../app-server/engines/deploy/coordinator.js";
import { startWorkflow } from "../app-server/engines/start/coordinator.js";
import { stopWorkflow } from "../app-server/engines/stop/coordinator.js";
import { deleteWorkflow } from "../app-server/engines/delete/coordinator.js";
import { updateWorkflow } from "../app-server/engines/update/coordinator.js";

const app = express();
app.use(express.json());

// Workflow mapping
const workflows = {
  CREATE: createWorkflow,
  BUILD: buildWorkflow,
  DEPLOY: deployWorkflow,
  START: startWorkflow,
  STOP: stopWorkflow,
  DELETE: deleteWorkflow,
  UPDATE: updateWorkflow,
};

// Generic request handler
async function handleRequest(req, res) {
  try {
    // Parse request
    const requestResult = await request(req);
    if (!requestResult.success) {
      return res.status(400).json({ error: requestResult.error });
    }

    // Process request
    const processedRequest = await processRequest(requestResult.data);
    if (!processedRequest.success) {
      return res.status(400).json({ error: processedRequest.error });
    }

    // Execute workflow
    const workflowFn = workflows[processedRequest.data.action];
    if (!workflowFn) {
      return res
        .status(400)
        .json({ error: `Unknown action: ${processedRequest.data.action}` });
    }

    const workflowResult = await workflowFn(
      processedRequest.data.projectId,
      processedRequest.data.config
    );

    // Parse response
    const responseResult = await response(workflowResult);
    if (!responseResult.success) {
      return res.status(500).json({ error: responseResult.error });
    }

    // Process response
    const processedResponse = await processResponse(responseResult);
    if (!processedResponse.success) {
      return res.status(500).json({ error: processedResponse.error });
    }

    res.json(processedResponse.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Routes
app.post("/projects", handleRequest);
app.post("/projects/:id/build", handleRequest);
app.post("/projects/:id/deploy", handleRequest);
app.post("/projects/:id/start", handleRequest);
app.post("/projects/:id/stop", handleRequest);
app.delete("/projects/:id", handleRequest);
app.put("/projects/:id", handleRequest);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`BuzzCraft API running on http://localhost:${PORT}`);
});
