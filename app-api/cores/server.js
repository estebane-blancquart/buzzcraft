import express from "express";
import cors from "cors";
import projectsRouter from './routes.js';

/*
 * FAIT QUOI : Bootstrap du serveur Express BuzzCraft
 * REÇOIT : Rien (point d'entrée)
 * RETOURNE : Serveur HTTP démarré
 * ERREURS : Crash si port occupé
 */

const app = express();

// Middleware global
app.use(cors());
app.use(express.json());

// Routes - utilise le router sans préfixe car routes.js définit déjà /projects
app.use('/', projectsRouter);

// Démarrage serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`BuzzCraft API running on http://localhost:${PORT}`);
});