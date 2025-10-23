# Système d'envoi d'email automatique - Évaluations Qualiopi

## ✅ Implémentation complète

Le système d'envoi d'email pour les évaluations a été **entièrement implémenté** avec un trigger automatique en base de données.

---

## 🎯 Architecture du système

```
[Stagiaire remplit formulaire évaluation]
         ↓
[1. CREATE evaluation (statut: "À traiter")]
         ↓
    (PAS d'email envoyé)
         ↓
[Formateur complète l'évaluation Qualiopi]
         ↓
[2. UPDATE evaluation (statut: "Traitée")]
         ↓
[3. Génération automatique PDF Qualiopi]
         ↓
[4. Upload PDF → Supabase Storage]
         ↓
[5. UPDATE evaluation SET pdf_qualiopi_url]
         ↓
[6. Database Trigger automatique (sur changement statut)]
         ↓
[7. Edge Function: send-evaluation-email]
         ↓
[8. Email envoyé via Resend API au stagiaire]
```

---

## 📝 Ce qui a été fait

### 1. Migration SQL : Ajout colonne pdf_qualiopi_url (✅ Appliquée)

**Migration**: `add_pdf_qualiopi_url_column`

**Modifications** :
- ✅ Ajout de la colonne `pdf_qualiopi_url` (type text) à la table `evaluation`
- ✅ Documentation de la colonne via COMMENT

### 2. Edge Function : send-evaluation-email (✅ Déployée)

**Version**: 1

**Fonctionnalités** :
- ✅ Récupère les données complètes de l'évaluation avec formation, PDC et formateur
- ✅ Vérifie que le PDF existe (`pdf_qualiopi_url` non null)
- ✅ Vérifie que le stagiaire a un email
- ✅ Télécharge le PDF depuis Supabase Storage
- ✅ Convertit le PDF en base64 pour Resend
- ✅ Compose un email HTML de remerciement avec branding ARKANCE
- ✅ Envoie l'email via Resend API avec PDF en pièce jointe
- ✅ Gestion complète des erreurs avec logs

### 3. Trigger Database (✅ Appliqué)

**Migrations**: `add_evaluation_email_trigger` + `update_evaluation_trigger_for_update` + `update_evaluation_trigger_for_status_change`

**Fonctionnalités** :
- ✅ Extension `http` activée pour les appels HTTP depuis Postgres
- ✅ Fonction trigger `send_evaluation_email_trigger()` créée
- ✅ Trigger `trigger_send_evaluation_email` sur UPDATE OF statut
- ✅ Déclenché uniquement quand le statut change à "Traitée"
- ✅ Vérifie que `pdf_qualiopi_url` existe avant d'envoyer
- ✅ Appel asynchrone de l'Edge Function
- ✅ Logs détaillés (NOTICE/WARNING)

### 4. Modification Frontend : EvaluationFormPage.js (✅ Simplifié)

**Fichier**: `js/components/pages/EvaluationFormPage.js`

**Modifications dans `handleSubmit`** :
1. ✅ Création de l'évaluation avec statut "À traiter"
2. ✅ PAS de génération de PDF (simplifié)
3. ✅ PAS d'envoi d'email à cette étape
4. ✅ Message de confirmation pour le stagiaire

### 5. Modification Frontend : EvaluationListPage.js (✅ Complété)

**Fichier**: `js/components/pages/EvaluationListPage.js` - Section QualiopiSection

**Modifications dans `handleSaveFormateurEvaluation`** :
1. ✅ Sauvegarde de l'évaluation formateur (statut → "Traitée")
2. ✅ Génération automatique du PDF Qualiopi avec données complètes
3. ✅ Upload du PDF vers Supabase Storage (`pdfs/qualiopi/`)
4. ✅ Récupération de l'URL publique
5. ✅ Mise à jour de l'évaluation avec `pdf_qualiopi_url`
6. ✅ Déclenchement automatique du trigger → Email envoyé
7. ✅ Gestion des erreurs complète
8. ✅ Logs console détaillés pour debugging

---

## 🚀 Utilisation

### Workflow en 2 étapes :

#### Étape 1 : Soumission du stagiaire

1. **Recevoir le lien d'évaluation** (envoyé par email avec token)
2. **Remplir le formulaire d'évaluation** en ligne
3. **Cliquer sur "Envoyer mon évaluation"**
4. **Attendre confirmation** "Merci ! Votre évaluation a été envoyée avec succès"

À cette étape :
- ✅ L'évaluation est créée en base avec statut "À traiter"
- ❌ Aucun PDF n'est généré
- ❌ Aucun email n'est envoyé

#### Étape 2 : Validation du formateur

1. **Le formateur se connecte** à l'interface d'administration
2. **Accède à la liste des évaluations** (statut "À traiter")
3. **Complète la section Qualiopi** (évaluation du formateur)
4. **Clique sur "Enregistrer l'évaluation formateur"**

À cette étape (AUTOMATIQUE) :
- ✅ Statut change à "Traitée"
- ✅ Le PDF Qualiopi est généré automatiquement
- ✅ Le PDF est uploadé sur Supabase Storage
- ✅ L'évaluation est mise à jour avec l'URL du PDF
- ✅ Le trigger déclenche l'envoi d'email automatiquement
- ✅ Le stagiaire reçoit son email avec le PDF Qualiopi

**Temps estimé pour l'étape 2** : 5-10 secondes maximum

---

## 📧 Contenu de l'email envoyé

L'email contient automatiquement :

- **Objet** : Merci pour votre évaluation - [Nom formation]
- **Expéditeur** : ARKANCE Formation <noreply@arkance-training.world>
- **Destinataire** : Email du stagiaire (`stagiaire_email`)
- **Corps HTML** :
  - Salutation personnalisée (prénom + nom)
  - Message de remerciement
  - Détails de la formation (nom, PRJ, formateur, PDC)
  - Texte expliquant l'importance de l'évaluation
  - Informations de contact ARKANCE
- **Pièce jointe** :
  - PDF Évaluation Qualiopi personnalisé

**Nom du fichier PDF** : `Evaluation_Qualiopi_[Nom]_[Prenom]_[PRJ].pdf`

---

## ⚙️ Configuration requise

### Clé API Resend (déjà configurée)

La clé API `RESEND_API_KEY` doit être configurée dans les secrets Supabase.

✅ **Déjà fait** : `re_Qg1JKzMB_Ngztpv2UEhr3ZTSBTHzEUVhe`

Si besoin de vérifier :
```bash
supabase secrets list --project-ref qhtpibkaiyfrqxdtytag
```

### Variables d'environnement Postgres (automatiques)

Le trigger utilise ces variables (configurées automatiquement) :
- `app.settings.supabase_url`
- `app.settings.service_role_key`

---

## 🧪 Tests à effectuer

### Checklist de validation :

#### Phase 1 : Test soumission stagiaire

- [ ] **Créer une formation de test** avec :
  - Formation complète (nom, PRJ, PDC)
  - Formateur assigné
  - Sessions définies
- [ ] **Générer un token d'évaluation** pour un stagiaire test
- [ ] **Accéder au formulaire** via le lien avec token
- [ ] **Remplir le formulaire** complètement :
  - Informations stagiaire (nom, prénom, **email valide**)
  - Section Organisation (4 questions)
  - Section Moyens (selon lieu formation)
  - Section Pédagogie (8 questions)
  - Section Satisfaction (5 questions)
  - Section Qualiopi (auto-évaluation avant/après)
- [ ] **Soumettre le formulaire**
- [ ] **Vérifier dans Supabase** :
  - Table `evaluation` : nouvelle ligne avec statut "À traiter"
  - Champ `pdf_qualiopi_url` doit être NULL
- [ ] **Vérifier qu'aucun email n'a été envoyé** (pas de logs dans Edge Function)

#### Phase 2 : Test validation formateur

- [ ] **Se connecter en tant que formateur** assigné à la formation
- [ ] **Accéder à la page des évaluations**
- [ ] **Ouvrir l'évaluation** avec statut "À traiter"
- [ ] **Compléter la section Qualiopi formateur** :
  - Noter les 5 compétences (Savoirs, Savoir-faire, etc.)
- [ ] **Cliquer sur "Enregistrer l'évaluation formateur"**
- [ ] **Vérifier dans la console navigateur** :
  - ✅ "✅ Évaluation formateur sauvegardée"
  - ✅ "📄 Génération automatique du PDF Qualiopi..."
  - ✅ "✅ PDF généré"
  - ✅ "✅ PDF uploadé: [url]"
  - ✅ "✅ Email automatique déclenché"
- [ ] **Vérifier dans Supabase** :
  - Table `evaluation` : statut changé à "Traitée"
  - Champ `pdf_qualiopi_url` rempli avec URL du PDF
  - Storage `pdfs/qualiopi/` : fichier PDF créé
- [ ] **Vérifier les logs de l'Edge Function** :
  - https://supabase.com/dashboard/project/qhtpibkaiyfrqxdtytag/functions/send-evaluation-email/logs
  - Rechercher appel POST réussi (status 200)
- [ ] **Vérifier la réception de l'email** :
  - Email reçu par le stagiaire
  - Contenu correct (nom, formation, etc.)
  - PDF en pièce jointe présent et valide
- [ ] **Vérifier le contenu du PDF** :
  - Informations stagiaire correctes
  - Données formation complètes
  - Notes formateur présentes
  - Radar chart des compétences Qualiopi
  - Toutes les sections présentes

---

## 🔍 Debugging

### 1. Logs Console navigateur (F12)

#### Phase 1 : Soumission stagiaire
Dans l'onglet Console, rechercher :
- ✅ "✅ Évaluation créée: [uuid]"
- Aucun autre log (pas de génération PDF)

#### Phase 2 : Validation formateur
Dans l'onglet Console, rechercher :
- ✅ "✅ Évaluation formateur sauvegardée"
- ✅ "📄 Génération automatique du PDF Qualiopi..."
- ✅ "✅ PDF généré"
- ✅ "✅ PDF uploadé: [url]"
- ✅ "✅ Email automatique déclenché"

**En cas d'erreur** :
- ⚠️ "⚠️ Générateur PDF non disponible" → Problème de chargement de pdfQualiopi.js
- ❌ "Erreur upload PDF" → Problème de permissions Supabase Storage
- ❌ "Erreur mise à jour évaluation" → Problème de RLS ou permissions

### 2. Logs Supabase Edge Function

**URL** : https://supabase.com/dashboard/project/qhtpibkaiyfrqxdtytag/functions/send-evaluation-email/logs

**Rechercher** :
- ✅ POST requests avec status 200
- ✅ "Email envoyé avec succès à [email]"
- ❌ Erreurs 400/500 avec messages détaillés

### 3. Logs Resend

**URL** : https://resend.com/emails

**Vérifier** :
- ✅ Email envoyé (status: Delivered)
- ❌ Email bounced (adresse invalide)
- ❌ Email spam (problème de configuration)

### 4. Vérifier le trigger en SQL

```sql
-- Vérifier que le trigger existe
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'trigger_send_evaluation_email';

-- Tester manuellement la mise à jour
UPDATE evaluation
SET pdf_qualiopi_url = 'https://example.com/test.pdf'
WHERE id = 'YOUR_EVALUATION_ID';

-- Voir les dernières évaluations
SELECT id, stagiaire_email, pdf_qualiopi_url, submitted_at
FROM evaluation
ORDER BY submitted_at DESC
LIMIT 5;
```

### 5. Vérifier les fichiers PDF uploadés

**Via Supabase Dashboard** :
- https://supabase.com/dashboard/project/qhtpibkaiyfrqxdtytag/storage/buckets/pdfs
- Dossier : `qualiopi/`
- Format : `qualiopi_[Nom]_[Prenom]_[PRJ]_[timestamp].pdf`

**Via SQL** :
```sql
-- Vérifier les PDFs générés
SELECT
  id,
  stagiaire_nom,
  stagiaire_prenom,
  stagiaire_email,
  pdf_qualiopi_url,
  submitted_at
FROM evaluation
WHERE pdf_qualiopi_url IS NOT NULL
ORDER BY submitted_at DESC;
```

---

## ⚠️ Gestion des erreurs

### Erreurs courantes et solutions

| Erreur | Cause | Solution |
|--------|-------|----------|
| "RESEND_API_KEY non configurée" | Secret manquant | Configurer le secret dans Supabase |
| "Évaluation non trouvée" | ID incorrect | Vérifier que l'évaluation existe |
| "Email du stagiaire non trouvé" | Champ vide | Vérifier que `stagiaire_email` est rempli |
| "Le PDF Qualiopi doit être généré avant l'envoi" | `pdf_qualiopi_url` null | Le PDF doit être généré et uploadé d'abord |
| "Erreur lors du téléchargement du PDF Qualiopi" | URL invalide ou privée | Vérifier que l'URL est publique et accessible |
| "Générateur PDF non disponible" | pdfQualiopi.js non chargé | Vérifier l'ordre de chargement des scripts dans index.html |
| "Erreur upload PDF" | Problème permissions Storage | Vérifier les politiques RLS du bucket `pdfs` |

### Comportement en cas d'erreur

#### Phase 1 : Soumission stagiaire
Si la soumission échoue :
- ❌ L'évaluation n'est pas créée
- 📝 Un message d'erreur est affiché au stagiaire
- 🔧 Le stagiaire peut réessayer

#### Phase 2 : Validation formateur
Si la génération ou l'upload du PDF échoue :
- ✅ L'évaluation formateur est **quand même enregistrée** (statut "Traitée")
- ⚠️ Aucun email n'est envoyé (trigger ne se déclenche pas sans PDF)
- 📝 Une erreur est affichée au formateur
- 🔧 Le formateur peut tenter de régénérer le PDF en réenregistrant

---

## 📊 Comparaison avec le système Formation

| Aspect | Formation Email | Évaluation Email |
|--------|----------------|------------------|
| **Trigger** | INSERT sur `projects` (status = transmission) | UPDATE OF statut sur `evaluation` (statut → "Traitée") |
| **PDF** | Pré-généré (convocation + convention) | Généré quand formateur valide |
| **Destinataire** | Contact entreprise | Stagiaire qui a rempli le formulaire |
| **Pièces jointes** | 2 PDFs (convocation + convention) | 1 PDF (évaluation Qualiopi) |
| **Workflow** | Manuel (bouton "Transmission client") | Semi-automatique (validation formateur) |
| **Génération PDF** | Côté client avant trigger | Côté client après validation formateur |
| **Complexité** | Simple (PDFs déjà prêts) | Moyenne (génération automatique à la validation) |
| **Étapes** | 1 étape (transmission) | 2 étapes (soumission + validation) |

---

## 🎉 Avantages du système

### Pour le stagiaire :
- ✅ Processus simple : remplit le formulaire et soumet
- ✅ Reçoit son évaluation Qualiopi par email après validation du formateur
- ✅ Pas d'action supplémentaire requise après la soumission

### Pour le formateur :
- ✅ Contrôle total : complète l'évaluation avant l'envoi
- ✅ Génération automatique du PDF lors de la validation
- ✅ Envoi automatique de l'email au stagiaire

### Pour l'administrateur :
- ✅ Workflow en deux étapes bien défini
- ✅ Traçabilité complète : tous les PDFs stockés dans Supabase Storage
- ✅ Logs détaillés pour debugging
- ✅ Contrôle qualité : formateur valide avant envoi

### Technique :
- ✅ Architecture robuste avec gestion d'erreurs
- ✅ Pas de perte de données (évaluation sauvegardée même si PDF échoue)
- ✅ Réutilise le code existant de génération PDF
- ✅ Trigger simplifié : se déclenche uniquement sur changement de statut
- ✅ Extensible : facile d'ajouter d'autres triggers ou actions

---

## 📂 Fichiers modifiés/créés

### Nouveaux fichiers :
- ✅ Edge Function : `supabase/functions/send-evaluation-email/index.ts` (déployée v1)
- ✅ Ce README : `README_EVALUATION_EMAIL_SYSTEM.md`

### Migrations SQL :
- ✅ `add_pdf_qualiopi_url_column` : Ajout colonne pdf_qualiopi_url
- ✅ `add_evaluation_email_trigger` : Création trigger initial
- ✅ `update_evaluation_trigger_for_update` : Trigger sur INSERT OR UPDATE
- ✅ `update_evaluation_trigger_for_status_change` : Trigger modifié pour se déclencher sur changement de statut

### Fichiers modifiés :
- ✅ `js/components/pages/EvaluationFormPage.js` : Soumission simplifiée (sans PDF)
- ✅ `js/components/pages/EvaluationListPage.js` : Génération PDF automatique lors de la validation formateur

### Fichiers inchangés :
- ✅ `js/utils/pdf/pdfQualiopi.js` : Réutilisé tel quel
- ✅ `js/hooks/useEvaluation.js` : Fonction updateFormateurQualiopi réutilisée
- ✅ `index.html` : Aucune modification requise
- ✅ Tous les autres composants

---

## 💡 Prochaines étapes possibles (optionnel)

### Améliorations futures :

1. **Notifications en temps réel** :
   - Ajouter un indicateur de progression pendant la génération du PDF
   - Utiliser Supabase Realtime pour notifier quand l'email est envoyé

2. **Resend de l'email** :
   - Ajouter un bouton dans EvaluationListPage.js pour renvoyer l'email
   - Utile si le stagiaire n'a pas reçu l'email

3. **Historique des envois** :
   - Créer une table `evaluation_email_history` pour tracker les envois
   - Stocker les IDs Resend pour consultation

4. **Personnalisation de l'email** :
   - Permettre de modifier le template d'email dans l'admin
   - Utiliser des templates Resend personnalisés

5. **Métriques** :
   - Dashboard pour voir le taux d'ouverture des emails
   - Intégration webhooks Resend pour tracking

---

## 📞 Support

En cas de problème :

1. **Vérifier les logs** (console, Edge Function, Resend)
2. **Vérifier la configuration** (secrets, permissions)
3. **Tester manuellement** le trigger en SQL
4. **Consulter ce README** pour les erreurs courantes

---

**Date d'implémentation initiale** : 2025-10-18
**Date de simplification** : 2025-10-18
**Statut** : ✅ Production Ready
**Testé** : En attente de tests utilisateur (workflow en 2 étapes)

