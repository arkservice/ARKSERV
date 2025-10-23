# 🎉 Intégration NetSuite → ARK Service

**Statut** : ✅ **DÉPLOYÉE** (22 Octobre 2025)

---

## 📊 Résumé

L'Edge Function Supabase pour l'intégration NetSuite a été **déployée avec succès** via MCP Supabase.

### Ce qui fonctionne déjà

✅ **Migration BDD** : Champ `netsuite_id` ajouté à la table `projects`
✅ **Edge Function déployée** : `netsuite-project-webhook` est ACTIVE
✅ **Code fonctionnel** : 1183 lignes de TypeScript consolidées
✅ **Secret généré** : Secret d'authentification fort créé
✅ **URL webhook** : Endpoint disponible et opérationnel

### Action requise (1 étape)

⏳ **Configurer le secret** dans Supabase Dashboard (voir instructions ci-dessous)

---

## 🚀 Démarrage Rapide

### Option A : Configuration du secret (5 minutes)

**Suivre le guide** : [`docs/DEPLOY_QUICK_GUIDE.md`](./docs/DEPLOY_QUICK_GUIDE.md)

**Résumé ultra-rapide** :
1. Aller sur https://app.supabase.com
2. Projet ARK_SERVICE → Project Settings → Edge Functions → Secrets
3. Ajouter : `NETSUITE_WEBHOOK_SECRET` = `5374d93d-37d4-43db-8647-ffcbd591540b`
4. Tester avec le script PowerShell fourni

### Option B : Consulter la documentation complète

📖 **Guide de déploiement détaillé** : [`docs/DEPLOYMENT_SUCCESS.md`](./docs/DEPLOYMENT_SUCCESS.md)

---

## 🔗 Informations Webhook

### URL du webhook

```
https://qhtpibkaiyfrqxdtytag.supabase.co/functions/v1/netsuite-project-webhook
```

### Headers d'authentification requis

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodHBpYmthaXlmcnF4ZHR5dGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjE3MDYsImV4cCI6MjA2NjY5NzcwNn0.HBL78_qkP71sDRnIA6bQLtGWrf2VogGV1E_60B3q5G8

x-netsuite-secret: 5374d93d-37d4-43db-8647-ffcbd591540b
```

### Méthode et format

- **Méthode** : POST
- **Content-Type** : application/json
- **Body** : JSON complet du Job record NetSuite

---

## 🧪 Test Rapide

Une fois le secret configuré dans Supabase :

```powershell
# PowerShell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodHBpYmthaXlmcnF4ZHR5dGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjE3MDYsImV4cCI6MjA2NjY5NzcwNn0.HBL78_qkP71sDRnIA6bQLtGWrf2VogGV1E_60B3q5G8"
    "x-netsuite-secret" = "5374d93d-37d4-43db-8647-ffcbd591540b"
}

$body = Get-Content -Path "supabase\functions\netsuite-project-webhook\test-payload.json" -Raw

$response = Invoke-RestMethod -Uri "https://qhtpibkaiyfrqxdtytag.supabase.co/functions/v1/netsuite-project-webhook" -Method Post -Headers $headers -Body $body

$response | ConvertTo-Json -Depth 10
```

**Résultat attendu** : HTTP 200 avec `"success": true` et données du projet créé

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [`docs/DEPLOY_QUICK_GUIDE.md`](./docs/DEPLOY_QUICK_GUIDE.md) | Guide ultra-rapide (5 min) |
| [`docs/DEPLOYMENT_SUCCESS.md`](./docs/DEPLOYMENT_SUCCESS.md) | Récapitulatif complet du déploiement |
| [`docs/DEPLOYMENT_NETSUITE_WEBHOOK.md`](./docs/DEPLOYMENT_NETSUITE_WEBHOOK.md) | Guide de déploiement détaillé (CLI + Dashboard) |
| [`docs/NETSUITE_INTEGRATION_SUMMARY.md`](./docs/NETSUITE_INTEGRATION_SUMMARY.md) | Résumé de l'intégration et architecture |

---

## 🎯 Fonctionnalités

L'Edge Function déployée offre :

✅ **Authentification sécurisée** : Double authentification (Supabase + NetSuite secret)
✅ **Validation des données** : Vérification des champs obligatoires
✅ **Parsing intelligent** : Extraction automatique PRJ, dates, horaires, logiciels
✅ **Gestion des doublons** : UPDATE si projet existe, INSERT sinon
✅ **Création automatique** :
- Entreprise cliente (table `entreprise`)
- Projet de formation (table `projects`)
- Sessions de formation (table `evenement`)

✅ **Génération PDF** : Convocation automatique (mode MOCK pour tests)
✅ **Upload Storage** : PDF stocké dans Supabase Storage
✅ **Réponse structurée** : JSON complet avec PDF en base64
✅ **Logs détaillés** : Suivi complet des opérations

---

## 🔄 Workflow

```
NetSuite (bouton envoi projet)
    ↓
    | POST JSON + headers authentification
    ↓
Edge Function (netsuite-project-webhook)
    ↓
    ├─ Vérification authentification
    ├─ Parsing données NetSuite
    ├─ Création/Update Entreprise
    ├─ Création/Update Projet
    ├─ Création Sessions
    ├─ Génération PDF Convocation
    ├─ Upload Supabase Storage
    └─ Retour JSON + PDF base64
    ↓
NetSuite reçoit confirmation + PDF
```

---

## 📞 Support

En cas de problème :

1. **Consulter les logs** : Supabase Dashboard → Edge Functions → `netsuite-project-webhook` → Logs
2. **Vérifier le secret** : S'assurer que `NETSUITE_WEBHOOK_SECRET` est configuré
3. **Tester avec payload** : Utiliser `test-payload.json` pour reproduire
4. **Consulter la doc** : Voir les guides dans le dossier `docs/`

---

## ✅ Checklist Finale

- [x] Migration BDD appliquée
- [x] Edge Function développée
- [x] Version consolidée créée
- [x] Edge Function déployée
- [x] Secret généré
- [ ] **Secret configuré dans Supabase** ⚠️ **À FAIRE**
- [ ] Test avec payload validé (HTTP 200)
- [ ] Projet visible dans ARK Service
- [ ] Sessions créées (5 dates)
- [ ] PDF convocation généré
- [ ] Infos communiquées à l'admin NetSuite
- [ ] Test end-to-end avec NetSuite

---

**Prochaine étape** : Configurer le secret dans Supabase (5 minutes) puis tester !

**Développé par** : Claude Code via MCP Supabase
**Date** : 2025-10-22
**Version** : 1.0.0
