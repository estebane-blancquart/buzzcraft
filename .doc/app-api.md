## Express
### **app-api/server.js**
- **start** server
- **define** les routes

## Request
### **app-api/request/parser.js**
- **reçoit :** données utilisateur
- **nettoie + valide**
- **retourne :** données propres

### **app-api/request/processor.js**
- **reçoit :** données propres
- **enrichit + complète**
- **retourne :** données système

## Response
### **app-api/response/parser.js**
- **reçoit :** données système
- **allège + adapte**
- **retourne :** données propres

### **app-api/response/processor.js**
- **reçoit :** données propres
- **simplifie + finalise**
- **retourne :** données utilisateur

## Routes
```
VERBE("CHEMIN", FONCTION);

VERBE = GET, POST, PUT, DELETE  
CHEMIN = `/ressource/:variable/transition`  
FONCTION = request → workflow → response
```

## Flow 
```
HTTP → request/parser → request/processor → workflow → response/parser → response/processor → HTTP
```




