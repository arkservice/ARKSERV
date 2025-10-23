# Guide de Déploiement : Webhook NetSuite

Ce guide explique comment déployer l'Edge Function `netsuite-project-webhook` sur Supabase.

## 📋 Prérequis

- Accès au projet Supabase ARK_SERVICE
- Compte Supabase avec les droits d'administrateur
- (Optionnel) Supabase CLI installé

## 🚀 Méthode 1 : Déploiement via Supabase CLI (Recommandé)

### Installation de Supabase CLI

#### Windows (via npm)

```bash
npm install -g supabase
```

#### Windows (via Scoop)

```bash
scoop install supabase
```

#### Vérifier l'installation

```bash
supabase --version
```

### Connexion à Supabase

```bash
# Se connecter à Supabase
supabase login

# Lier le projet local au projet Supabase
cd C:\Users\adkapper\Desktop\CC\ARK_SERVICE
supabase link --project-ref qhtpibkaiyfrqxdtytag
```

### Déploiement de la fonction

```bash
# Déployer l'Edge Function
supabase functions deploy netsuite-project-webhook

# Vérifier le déploiement
supabase functions list
```

### Configuration des secrets

```bash
# Générer un secret fort
$SECRET = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString()))

# Configurer le secret
supabase secrets set NETSUITE_WEBHOOK_SECRET="$SECRET"

# (Optionnel) Mode mock pour les tests
supabase secrets set USE_MOCK_PDF="true"

# Lister les secrets
supabase secrets list
```

### Visualiser les logs

```bash
# Logs en temps réel
supabase functions logs netsuite-project-webhook --tail

# Logs des dernières erreurs
supabase functions logs netsuite-project-webhook --level error
```

## 🌐 Méthode 2 : Déploiement via Dashboard Supabase

Si vous ne pouvez pas installer le CLI, utilisez le dashboard Supabase.

### Étape 1 : Accéder au Dashboard

1. Aller sur https://app.supabase.com
2. Sélectionner le projet `ARK_SERVICE`
3. Menu latéral → **Edge Functions**

### Étape 2 : Créer la fonction

1. Cliquer sur **"Create Function"**
2. Nom : `netsuite-project-webhook`
3. Cliquer sur **"Create"**

### Étape 3 : Uploader les fichiers

Vous devez zipper tous les fichiers de la fonction et les uploader :

#### Fichiers à inclure :

```
netsuite-project-webhook/
├── index.ts
├── types.ts
├── utils.ts
├── parser.ts
├── mapper.ts
├── database.ts
├── pdf-generator.ts
└── README.md
```

#### Créer une archive (Windows PowerShell)

```powershell
# Se placer dans le dossier des fonctions
cd C:\Users\adkapper\Desktop\CC\ARK_SERVICE\supabase\functions

# Créer une archive zip
Compress-Archive -Path netsuite-project-webhook\* -DestinationPath netsuite-project-webhook.zip
```

#### Uploader l'archive

1. Dans l'interface Edge Functions
2. Sélectionner `netsuite-project-webhook`
3. Cliquer sur **"Deploy"**
4. Uploader le fichier `netsuite-project-webhook.zip`
5. Attendre la fin du déploiement

### Étape 4 : Configurer les secrets

1. Menu latéral → **Project Settings** → **Edge Functions**
2. Section **"Secrets"**
3. Ajouter les secrets :

| Nom | Valeur |
|-----|--------|
| `NETSUITE_WEBHOOK_SECRET` | `[votre-secret-généré]` |
| `USE_MOCK_PDF` | `true` (ou `false` en prod) |

#### Générer un secret fort (PowerShell)

```powershell
# Méthode 1 : UUID
[System.Guid]::NewGuid().ToString()

# Méthode 2 : Base64 aléatoire
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Étape 5 : Vérifier le déploiement

1. Dans **Edge Functions**, vérifier que `netsuite-project-webhook` apparaît
2. Statut devrait être **"Active"**
3. Noter l'URL :
   ```
   https://qhtpibkaiyfrqxdtytag.supabase.co/functions/v1/netsuite-project-webhook
   ```

## 🧪 Tester le déploiement

### Méthode 1 : curl (Git Bash ou PowerShell)

#### Git Bash

```bash
curl -X POST https://qhtpibkaiyfrqxdtytag.supabase.co/functions/v1/netsuite-project-webhook \
  -H "Content-Type: application/json" \
  -H "x-netsuite-secret: VOTRE_SECRET" \
  --data @supabase/functions/netsuite-project-webhook/test-payload.json
```

#### PowerShell

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "x-netsuite-secret" = "VOTRE_SECRET"
}

$body = Get-Content -Path "supabase\functions\netsuite-project-webhook\test-payload.json" -Raw

Invoke-RestMethod `
  -Uri "https://qhtpibkaiyfrqxdtytag.supabase.co/functions/v1/netsuite-project-webhook" `
  -Method Post `
  -Headers $headers `
  -Body $body
```

### Méthode 2 : Postman

1. **Créer une nouvelle requête POST**
   - URL : `https://qhtpibkaiyfrqxdtytag.supabase.co/functions/v1/netsuite-project-webhook`

2. **Configurer les Headers**
   ```
   Content-Type: application/json
   x-netsuite-secret: VOTRE_SECRET
   ```

3. **Ajouter le Body (raw JSON)**
   - Copier le contenu de `test-payload.json`

4. **Envoyer**
   - Cliquer sur "Send"
   - Vérifier la réponse (HTTP 200 = succès)

### Méthode 3 : Script de test automatique

Utiliser le script `test.sh` fourni :

```bash
# Rendre le script exécutable (Git Bash)
chmod +x supabase/functions/netsuite-project-webhook/test.sh

# Exécuter le test
cd supabase/functions/netsuite-project-webhook
./test.sh VOTRE_SECRET
```

## 📊 Monitoring

### Consulter les logs

#### Via Dashboard

1. Menu **Edge Functions**
2. Cliquer sur `netsuite-project-webhook`
3. Onglet **"Logs"**
4. Filtrer par niveau : INFO, WARN, ERROR

#### Via CLI

```bash
# Logs en temps réel
supabase functions logs netsuite-project-webhook --tail

# Logs avec filtre
supabase functions logs netsuite-project-webhook --level error

# Logs des dernières 24h
supabase functions logs netsuite-project-webhook --since 24h
```

### Métriques à surveiller

- ✅ Taux de succès (HTTP 200)
- ❌ Taux d'erreurs (HTTP 4xx, 5xx)
- ⏱️ Temps de réponse moyen
- 📊 Nombre de requêtes par jour

## 🔄 Mise à jour de la fonction

### Via CLI

```bash
# Modifier les fichiers localement, puis redéployer
supabase functions deploy netsuite-project-webhook
```

### Via Dashboard

1. Créer une nouvelle archive zip avec les fichiers modifiés
2. Edge Functions → `netsuite-project-webhook` → **"Deploy"**
3. Uploader la nouvelle archive

## 🐛 Résolution de problèmes

### La fonction ne se déploie pas

- ✅ Vérifier que tous les fichiers sont présents
- ✅ Vérifier la syntaxe TypeScript
- ✅ Consulter les logs de déploiement

### Erreur 401 lors des tests

- ✅ Vérifier que le secret est correctement configuré
- ✅ Vérifier que le header `x-netsuite-secret` est bien envoyé

### Erreur 500 lors de l'exécution

- ✅ Consulter les logs Edge Functions
- ✅ Vérifier que les tables Supabase existent
- ✅ Vérifier que la migration a été appliquée

### PDF non généré

- ✅ Vérifier que `generate-pdf-jspdf` existe
- ✅ Passer en mode mock : `USE_MOCK_PDF=true`
- ✅ Consulter les logs pour l'erreur exacte

## ✅ Checklist de déploiement

- [ ] Fonction déployée sur Supabase
- [ ] Secret `NETSUITE_WEBHOOK_SECRET` configuré
- [ ] Migration BDD appliquée (`netsuite_id` dans `projects`)
- [ ] Test avec `test-payload.json` réussi
- [ ] Logs consultables et compréhensibles
- [ ] URL webhook communiquée à l'admin NetSuite
- [ ] Secret communiqué de manière sécurisée à l'admin NetSuite
- [ ] Test end-to-end réalisé avec NetSuite

## 📞 Support

En cas de problème :

1. Consulter les logs Supabase
2. Vérifier la documentation NetSuite
3. Contacter l'équipe technique ARK Service

---

**Dernière mise à jour** : 2025-01-22
