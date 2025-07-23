# BuzzCraft - Ordre des Commits

## Vue d'ensemble

L'ordre des commits suit **strictement** l'architecture de dépendances pour garantir un développement logique et sans conflits.

## Principe fondamental

```
engines/ → transitions/ → systems/ → utils/
states/ → independent (appelé par engines)
app-client/ → api/ (jamais l'inverse)
```

### **COMMITS 1-5 : STATES** (Indépendants)
```
COMMIT 1  - State Void     (detector + validator + rules)
COMMIT 2  - State Draft    (detector + validator + rules)  
COMMIT 3  - State Built    (detector + validator + rules)
COMMIT 4  - State Offline  (detector + validator + rules)
COMMIT 5  - State Online   (detector + validator + rules)
```

### **COMMITS 6-20 : SYSTEMS** (Services bas niveau)
```
COMMIT 6  - System Filesystem    (watchers + templates + generator + project)
COMMIT 7  - System Docker        (containers + networks + volumes + images + database)
COMMIT 8  - System Validation    (schemas + rules + sanitizer)
COMMIT 9  - System Cache         (redis + memory + invalidation)
COMMIT 10 - System Ports         (healthcheck + monitoring + allocation)
COMMIT 11 - System Network       (proxy + load-balancer + ssl)
COMMIT 12 - System Backup        (snapshots + recovery + compression)
COMMIT 13 - System Security      (auth + encryption + permissions)
COMMIT 14 - System Analytics     (tracking + metrics + reporting)
COMMIT 15 - System Git           (repository + versioning + hooks)
COMMIT 16 - System CI/CD         (pipelines + automation + testing)
COMMIT 17 - System Tenancy       (isolation + quotas + multi-tenant)
COMMIT 18 - System Monitoring    (health-checks + business-metrics + alerts)
COMMIT 19 - System Compliance    (audit + retention + governance)
COMMIT 20 - System Notification (multi-channel + templating + scheduling)
```

### **COMMITS 21-30 : TRANSITIONS** (Actions atomiques)
```
COMMIT 21 - Transition Create   (validation + action + cleanup)
COMMIT 22 - Transition Save     (validation + action + cleanup)
COMMIT 23 - Transition Build    (validation + action + cleanup)
COMMIT 24 - Transition Edit     (validation + action + cleanup)
COMMIT 25 - Transition Deploy   (validation + action + cleanup)
COMMIT 26 - Transition Start    (validation + action + cleanup)
COMMIT 27 - Transition Stop     (validation + action + cleanup)
COMMIT 28 - Transition Update   (validation + action + cleanup)
COMMIT 29 - Transition Delete   (validation + action + cleanup)
COMMIT 30 - Transition Migrate  (validation + action + cleanup)
```

### **COMMITS 31-40 : ENGINES** (Orchestration)
```
COMMIT 31 - Engine Create   (workflow + logging + recovery)
COMMIT 32 - Engine Save     (workflow + logging + recovery)
COMMIT 33 - Engine Build    (workflow + logging + recovery)
COMMIT 34 - Engine Edit     (workflow + logging + recovery)
COMMIT 35 - Engine Deploy   (workflow + logging + recovery)
COMMIT 36 - Engine Start    (workflow + logging + recovery)
COMMIT 37 - Engine Stop     (workflow + logging + recovery)
COMMIT 38 - Engine Update   (workflow + logging + recovery)
COMMIT 39 - Engine Delete   (workflow + logging + recovery)
COMMIT 40 - Engine Migrate  (workflow + logging + recovery)
```

### **COMMITS 41-50 : API** (Communication)
```
COMMIT 41 - API Schemas         (request-schemas + response-schemas + validation + data-schemas)
COMMIT 42 - API Requests        (projects + transitions + states + queries + uploads)
COMMIT 43 - API Responses       (formatting + serialization + compression + caching)
COMMIT 44 - API Events          (state-changes + deployment-status + progress + system-alerts)
COMMIT 45 - API WebSockets      (real-time + broadcasting + subscriptions)
COMMIT 46 - API Authentication  (tokens + sessions + permissions + oauth)
COMMIT 47 - API Rate Limiting   (throttling + quotas + abuse-prevention)
COMMIT 48 - API Documentation   (openapi + swagger + examples + testing)
COMMIT 49 - API Monitoring      (build-progress + performance + errors + analytics)
COMMIT 50 - API Metrics         (exporter + formats + filters + dashboards)
```

### **COMMITS 51-59 : APP-CLIENT STRUCTURE** (Fondations)
```
COMMIT 51 - App Client Structure    (foundations + routing + providers + layouts)
COMMIT 52 - App Client Components   (buttons + inputs + forms + containers)
COMMIT 53 - App Client Hooks        (state + effects + context + performance)
COMMIT 54 - App Client Utils        (formatters + validators + helpers + constants)
COMMIT 55 - App Client Services     (api-client + storage + cache + sync)
COMMIT 56 - App Client Themes       (colors + typography + spacing + components)
COMMIT 57 - App Client i18n         (translations + locales + formatters + plurals)
COMMIT 58 - App Client Navigation   (router + guards + breadcrumbs + history)
COMMIT 59 - App Client Error        (boundaries + handlers + recovery + logging)
```

### **COMMITS 60-70 : APP-CLIENT PANELS** (Interface)
```
COMMIT 60 - App Client Main         (main.js + index.html + router + providers)
COMMIT 61 - Panel Dashboard         (overview + metrics + notifications + shortcuts)
COMMIT 62 - Panel Projects          (list + create + search + filters)
COMMIT 63 - Panel Editor            (code + visual + preview + collaboration)
COMMIT 64 - Panel Structure         (navigator + editor + search + tree + breadcrumb)
COMMIT 65 - Panel Config            (project + components + deployment + themes)
COMMIT 66 - Panel Deployment        (status + logs + rollback + monitoring)
COMMIT 67 - Panel Settings          (preferences + integrations + team + billing)
COMMIT 68 - Panel Components        (library + preview + documentation + search)
COMMIT 69 - Panel Analytics         (usage + performance + errors + insights)
COMMIT 70 - Panel Help              (documentation + tutorials + support + feedback)
```

## Architecture Respectée

### **Flux de Dépendances Strict**
```
engines/ → transitions/ → systems/ → utils/
states/ → independent (appelé par engines)
app-client/ → api/ (jamais l'inverse)
```

### **Règles de Cohérence**
- Chaque commit respecte sa plage architecturale
- Headers standardisés (`COMMIT X - Module Name`)
- Commentaires cohérents avec headers
- Dependency flow sans cycles
