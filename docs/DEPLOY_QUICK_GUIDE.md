# 🚀 Guide de Déploiement Rapide - Webhook NetSuite

## ✅ DÉPLOIEMENT RÉALISÉ !

L'Edge Function a été déployée avec succès via MCP Supabase le 22/10/2025 !

**Statut** : ✅ ACTIVE
**URL** : `https://qhtpibkaiyfrqxdtytag.supabase.co/functions/v1/netsuite-project-webhook`

---

## 🔐 Configuration du secret (ACTION REQUISE)

Il ne reste plus qu'à configurer le secret d'authentification dans Supabase :

### Étape 1 : Accéder aux secrets

1. Ouvrir https://app.supabase.com
2. Sélectionner le projet **ARK_SERVICE**
3. Menu latéral → **Project Settings** (icône engrenage en bas)
4. Sous-menu → **Edge Functions**
5. Scroll jusqu'à la section **"Secrets"**

### Étape 2 : Ajouter le secret

1. Cliquer sur **"Add Secret"** ou **"New secret"**
2. **Nom** : `NETSUITE_WEBHOOK_SECRET`
3. **Valeur** : `5374d93d-37d4-43db-8647-ffcbd591540b`
4. Cliquer sur **"Save"** ou **"Add"**
5. Attendre quelques secondes que la fonction se redéploie automatiquement

⚠️ **IMPORTANT** : Sauvegardez ce secret quelque part de sécurisé !

```
Secret NetSuite : 5374d93d-37d4-43db-8647-ffcbd591540b
```

---

## ✅ C'est terminé !

Votre webhook est maintenant **100% opérationnel** !

## 📋 Informations à communiquer à l'admin NetSuite

```
URL du Webhook :
https://qhtpibkaiyfrqxdtytag.supabase.co/functions/v1/netsuite-project-webhook

Headers d'authentification requis :

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodHBpYmthaXlmcnF4ZHR5dGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjE3MDYsImV4cCI6MjA2NjY5NzcwNn0.HBL78_qkP71sDRnIA6bQLtGWrf2VogGV1E_60B3q5G8

x-netsuite-secret: 5374d93d-37d4-43db-8647-ffcbd591540b

Méthode : POST
Content-Type: application/json
```

## 🧪 Tester le webhook

### Méthode 1 : Postman

1. Créer une requête **POST**
2. URL : `https://qhtpibkaiyfrqxdtytag.supabase.co/functions/v1/netsuite-project-webhook`
3. Headers :
   - `Content-Type: application/json`
   - `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodHBpYmthaXlmcnF4ZHR5dGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjE3MDYsImV4cCI6MjA2NjY5NzcwNn0.HBL78_qkP71sDRnIA6bQLtGWrf2VogGV1E_60B3q5G8`
   - `x-netsuite-secret: 5374d93d-37d4-43db-8647-ffcbd591540b`
4. Body (raw JSON) : Copier le contenu de `supabase/functions/netsuite-project-webhook/test-payload.json`
5. Envoyer

**Résultat attendu** : HTTP 200 avec un JSON contenant `"success": true`

### Méthode 2 : PowerShell

⚠️ **Configurer le secret dans Supabase d'abord !**

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodHBpYmthaXlmcnF4ZHR5dGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjE3MDYsImV4cCI6MjA2NjY5NzcwNn0.HBL78_qkP71sDRnIA6bQLtGWrf2VogGV1E_60B3q5G8"
    "x-netsuite-secret" = "5374d93d-37d4-43db-8647-ffcbd591540b"
}

$body = Get-Content -Path "C:\Users\adkapper\Desktop\CC\ARK_SERVICE\supabase\functions\netsuite-project-webhook\test-payload.json" -Raw

$response = Invoke-RestMethod `
  -Uri "https://qhtpibkaiyfrqxdtytag.supabase.co/functions/v1/netsuite-project-webhook" `
  -Method Post `
  -Headers $headers `
  -Body $body

$response | ConvertTo-Json -Depth 10
```

## 📊 Consulter les logs

1. Menu **Edge Functions** → `netsuite-project-webhook`
2. Onglet **"Logs"**
3. Filtrer par niveau : INFO, WARN, ERROR

## 🐛 Dépannage

### Erreur 401 (Unauthorized)
- Vérifier que le secret dans le header correspond exactement au secret configuré

### Erreur 400 (Bad Request)
- Vérifier que le JSON envoyé contient les champs obligatoires : `id`, `entityid`, `companyname`

### Erreur 500 (Internal Server Error)
- Consulter les logs dans l'onglet "Logs"
- Vérifier que la migration BDD a été appliquée (`netsuite_id` existe dans `projects`)

## 📞 Support

En cas de problème :
1. Consulter les logs Supabase
2. Vérifier la structure du JSON envoyé
3. Contacter l'équipe technique

---

**Version** : 1.0.0
**Date** : 2025-01-22
