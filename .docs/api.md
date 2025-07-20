# API Documentation BuzzCraft

## Vue d'ensemble

L'API BuzzCraft fournit des endpoints RESTful et WebSocket pour gérer les projets, workflows et déploiements.

## Architecture API

### RESTful Endpoints

#### Projects
- `GET /api/projects` - Liste tous les projets
- `POST /api/projects` - Crée un nouveau projet  
- `GET /api/projects/:id` - Détails d'un projet
- `PUT /api/projects/:id` - Met à jour un projet
- `DELETE /api/projects/:id` - Supprime un projet

#### Workflows
- `POST /api/projects/:id/create` - Lance workflow création
- `POST /api/projects/:id/build` - Lance workflow build
- `POST /api/projects/:id/deploy` - Lance workflow déploiement
- `POST /api/projects/:id/start` - Démarre les services
- `POST /api/projects/:id/stop` - Arrête les services

#### States
- `GET /api/projects/:id/state` - État actuel du projet
- `GET /api/projects/:id/transitions` - Transitions disponibles

### WebSocket Events

#### Temps réel
- `project:state-changed` - Changement d'état projet
- `project:progress` - Progression workflow
- `system:alert` - Alertes système
- `deployment:status` - Statut déploiement

## Authentification

```javascript
// Headers requis
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

## Rate Limiting

- 100 requêtes/minute par IP
- 1000 requêtes/heure par utilisateur authentifié

## Codes d'erreur

- `400` - Requête malformée
- `401` - Non authentifié  
- `403` - Non autorisé
- `404` - Ressource introuvable
- `422` - Validation échouée
- `429` - Rate limit dépassé
- `500` - Erreur serveur

## Exemples

### Créer un projet

```javascript
POST /api/projects
{
  "name": "Mon Site Web",
  "template": "react-template",
  "description": "Site vitrine React"
}
```

### Lancer un build

```javascript  
POST /api/projects/abc123/build
{
  "options": {
    "optimize": true,
    "cache": true
  }
}
```
