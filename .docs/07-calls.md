# 07-calls.md

Pattern 13 CALLS standardisé pour toutes les actions.

## 📋 Organisation

**Séquence obligatoire :**
```
[0]  UI Trigger          (app-client)
[1]  Request Parser      (app-api)
[2]  Request Processor   (app-api)
[3]  Coordinator         (app-server)
[4]  State Detection     (app-server)
[5]  Resource Loading    (app-server)
[6]  Resource Reading    (app-server)
[7]  Generation          (app-server)
[8]  Writing             (app-server)
[9]  Validation          (app-server)
[10] Verification        (app-server)
[11] Output              (app-server)
[12] Response Parser     (app-api)
[13] Response Processor  (app-api)
```

**Répartition par service :**
- **CLIENT** : CALL 0 (déclenchement UI)
- **API** : CALLS 1-2, 12-13 (entrée/sortie HTTP)
- **SERVER** : CALLS 3-11 (traitement métier)

## 🔧 Fonctionnement

Toutes les actions (CREATE, BUILD, DEPLOY, START, STOP, REVERT, UPDATE, DELETE) suivent exactement la même séquence de 13 calls. Seul le contenu de chaque call change selon l'action.

Rollback automatique en cas d'échec après CALL 8. Validation continue à chaque étape. Les notifications WebSocket permettent un suivi temps réel depuis l'interface utilisateur.