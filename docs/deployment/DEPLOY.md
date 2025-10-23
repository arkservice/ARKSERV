# Guide de déploiement ARK SERVICE

## Déploiement en une commande

Pour déployer le site complet sur le serveur de production :

```powershell
.\scripts\deploy-ftp.ps1
```

**C'est tout !** Le script s'occupe de :
1. ✅ Créer/nettoyer le dossier `deploy/`
2. ✅ Copier `index.html`, `css/`, et `js/` (avec tous les sous-dossiers)
3. ✅ Upload vers le serveur FTP
4. ✅ Afficher la progression et le résumé

---

## Vérification (optionnel)

Pour vérifier que le déploiement s'est bien passé :

```powershell
.\scripts\check-deploy.ps1
```

Ce script liste tous les fichiers présents sur le serveur FTP.

---

## Informations techniques

### Structure du projet

```
ARK_SERVICE/
├── index.html              ← Point d'entrée
├── css/                    ← Styles
│   └── styles.css
├── js/                     ← Code JavaScript
│   ├── config/
│   ├── utils/
│   ├── hooks/
│   ├── components/
│   ├── services/
│   └── ...
└── deploy/                 ← Créé automatiquement par le script
    ├── index.html
    ├── css/
    └── js/
```

### Serveur de production

- **URL** : https://arkance-training.world
- **Serveur FTP** : ftp.arkance-training.world
- **Port** : 21
- **Répertoire distant** : `/` (racine)

### Fichiers exclus du déploiement

Le dossier `deploy/` contient uniquement :
- `index.html`
- `css/` (tous les fichiers CSS)
- `js/` (tous les fichiers JavaScript avec sous-dossiers)

**Sont automatiquement exclus** :
- `.git/`, `.claude/`, `node_modules/`
- `docs/`, `scripts/`, `supabase/`
- `*.md`, `*.sql`, `.gitignore`, `.editorconfig`
- Fichiers de configuration

---

## Dépannage

### Le script échoue avec "fichiers uploadés: 0/0"

Le dossier `deploy/` est vide. Vérifiez que :
- Vous exécutez le script depuis la racine : `.\scripts\deploy-ftp.ps1`
- Le dossier `deploy/` existe et contient les fichiers

### Erreur de connexion FTP

Vérifiez votre connexion internet et les identifiants FTP.

### Le site ne s'affiche pas correctement

1. Vérifiez avec `.\scripts\check-deploy.ps1` que tous les fichiers sont bien uploadés
2. Videz le cache du navigateur (Ctrl+Shift+R)
3. Consultez la console JavaScript du navigateur (F12)

---

## Workflow recommandé

1. **Développement local** : Testez vos modifications
2. **Déploiement** : `.\scripts\deploy-ftp.ps1`
3. **Vérification** : `.\scripts\check-deploy.ps1` (optionnel)
4. **Test production** : Visitez https://arkance-training.world
5. **Commit Git** : Sauvegardez vos changements

---

## Notes

- Le déploiement prend ~1-2 minutes pour ~140 fichiers
- Le script affiche la progression fichier par fichier
- En cas d'échec partiel, relancer le script uploade uniquement les fichiers manquants
- Le dossier `deploy/` est ignoré par Git (`.gitignore`)
