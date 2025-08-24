# 03-api.md

Service Express hub de communication avec pattern request/response.

## 📋 Organisation

**Routes API :**
```
GET    /projects                # Lister tous les projets
GET    /projects/:id            # Charger projet pour édition
POST   /projects                # CREATE workflow
POST   /projects/:id/build      # BUILD workflow
PUT    /projects/:id/revert     # REVERT action
PATCH  /projects/:id            # Modification partielle
DELETE /projects/:id            # DELETE workflow
GET    /projects/meta/templates # Templates disponibles
POST   /projects/:id/validate   # Validation schema
```

**Pattern request/response :**
```
HTTP Request → parser → processor → workflow → parser → processor → HTTP Response
```

**Signatures :**

*Request processing (requests/) :*
```javascript
request(req)
process(requestData)
```

*Response processing (responses/) :*
```javascript
response(res)
process(responseData)
```

## 🔧 Fonctionnement

Architecture Hub-and-Spoke avec app-api comme coordinateur central. Toutes les communications passent par ce service qui parse, traite et formate les échanges. WebSocket prévu pour communication temps réel (à implémenter).