import express from "express";
import { request } from "./request/parser.js";
import { response } from "./r²esponse/parser.js";
import { createWorkflow } from "../app-server/engines/create/coordinator.js";
import { buildWorkflow } from "../app-server/engines/build/coordinator.js";
import { deployWorkflow } from "../app-server/engines/deploy/coordinator.js";
import { startWorkflow } from "../app-server/engines/start/coordinator.js";
import { stopWorkflow } from "../app-server/engines/stop/coordinator.js";

const app = express();
app.use(express.json());

/*
 * POST /projects - Créer un nouveau projet
 */
app.post("/projects", async (req, res) => {
  try {
    // Parse request
    const requestResult = await request(req);
    if (!requestResult.success) {
      return res.status(400).json({ error: requestResult.error });
    }

    // Execute workflow
    const workflowResult = await createWorkflow(
      requestResult.data.projectId,
      requestResult.data.config
    );

    // Parse response
    const responseResult = await response(workflowResult);

    if (!responseResult.success) {
      return res.status(500).json({ error: responseResult.error });
    }

    res.json(responseResult.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/*
 * POST /projects/:id/build - Construire un projet
 */
app.post("/projects/:id/build", async (req, res) => {
  try {
    const { id } = req.params;

    // Execute build workflow
    const workflowResult = await buildWorkflow(id, {});

    if (!workflowResult.success) {
      return res.status(500).json({ error: workflowResult.error });
    }

    res.json({
      message: `Project ${id} built successfully`,
      build: {
        fromState: workflowResult.data.fromState,
        toState: workflowResult.data.toState,
        servicesGenerated: workflowResult.data.servicesGenerated,
        duration: workflowResult.data.duration,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/*
 * POST /projects/:id/deploy - Déployer un projet BUILT → OFFLINE
 */
app.post("/projects/:id/deploy", async (req, res) => {
  try {
    const { id } = req.params;

    const workflowResult = await deployWorkflow(id, {});

    if (!workflowResult.success) {
      return res.status(500).json({ error: workflowResult.error });
    }

    res.json({
      message: `Project ${id} deployed successfully`,
      deploy: {
        fromState: workflowResult.data.fromState,
        toState: workflowResult.data.toState,
        duration: workflowResult.data.duration,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/*
 * POST /projects/:id/start - Démarrer un projet OFFLINE → ONLINE
 */
app.post("/projects/:id/start", async (req, res) => {
  try {
    const { id } = req.params;

    const workflowResult = await startWorkflow(id, {});

    if (!workflowResult.success) {
      return res.status(500).json({ error: workflowResult.error });
    }

    res.json({
      message: `Project ${id} started successfully`,
      start: {
        fromState: workflowResult.data.fromState,
        toState: workflowResult.data.toState,
        duration: workflowResult.data.duration,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/*
 * POST /projects/:id/stop - Arrêter un projet ONLINE → OFFLINE
 */
app.post("/projects/:id/stop", async (req, res) => {
  try {
    const { id } = req.params;

    const workflowResult = await stopWorkflow(id, {});

    if (!workflowResult.success) {
      return res.status(500).json({ error: workflowResult.error });
    }

    res.json({
      message: `Project ${id} stopped successfully`,
      stop: {
        fromState: workflowResult.data.fromState,
        toState: workflowResult.data.toState,
        duration: workflowResult.data.duration,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`BuzzCraft API running on http://localhost:${PORT}`);
});