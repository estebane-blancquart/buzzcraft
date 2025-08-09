## Engines
### **app-server/engines/[ACTION]/coordinator.js**
- **orchestre** workflow complet
- **suit** pattern 12 CALLS
- **retourne** transition d'état

## Probes
### **app-server/probes/[STATE]/detector.js**
- **analyse** filesystem + containers
- **calcule** confidence + evidence
- **retourne** état détecté

## Transitions
### **app-server/transitions/[ACTION]/loader.js**
- **charge** ressources nécessaires
- **résout** dépendances
- **retourne** données prêtes

### **app-server/transitions/[ACTION]/generator.js**
- **compile** templates + données
- **génère** code TypeScript
- **retourne** services complets

## Actions
```
CREATE, BUILD, DEPLOY, START, STOP, UPDATE, DELETE
```

## States
```
VOID, DRAFT, BUILT, OFFLINE, ONLINE
```

## Flow 
```
Engine → Probe → Transition → Systems → Probe → Engine
```