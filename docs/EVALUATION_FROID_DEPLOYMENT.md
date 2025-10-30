# Déploiement du système d'évaluation à froid J+30

## Vue d'ensemble

Ce système envoie automatiquement un email avec un lien d'évaluation à froid 30 jours après qu'un stagiaire ait complété une formation.

**Architecture:**
- ✅ Formulaire d'évaluation à froid déjà existant dans l'application
- ✅ Colonnes database `evaluation_froid_*` déjà présentes
- ✅ Token unique `evaluation_froid_token` déjà généré
- ✨ Nouveau: Edge Function `send-evaluation-froid-email`
- ✨ Nouveau: Job pg_cron quotidien à 9h UTC
- ✨ Nouveau: Job pg_cron relance à 10h UTC

---

## Fichiers créés

### 1. Edge Function
```
supabase/functions/send-evaluation-froid-email/index.ts
```

**Fonctionnalités:**
- Envoie l'email d'évaluation à froid avec lien unique
- Génère l'URL: `https://arkance-training.world/index.html#/evaluation-froid/{token}`
- Met à jour `evaluation_froid_sent_at` après envoi
- Support des relances avec `isRelance: true`

### 2. Migration - Colonnes tracking
```
supabase/migrations/20251030155501_add_froid_email_tracking.sql
```

**Colonnes ajoutées:**
- `evaluation_froid_relance_sent_at` - Date envoi relance
- `evaluation_froid_completed_at` - Date complétion formulaire
- Index optimisés pour pg_cron

### 3. Migration - Jobs pg_cron
```
supabase/migrations/20251030155502_create_pg_cron_froid_evaluation.sql
```

**Jobs créés:**
- `send-evaluation-froid-j30` - Quotidien 9h UTC (J+30)
- `send-evaluation-froid-relance-j37` - Quotidien 10h UTC (J+37)

---

## Déploiement

### Étape 1: Appliquer les migrations

**Option A - Via Supabase CLI (Recommandé):**
```bash
# Se connecter à Supabase
supabase login
supabase link --project-ref qhtpibkaiyfrqxdtytag

# Appliquer les migrations
supabase db push
```

**Option B - Via Dashboard Supabase:**
1. Aller sur https://app.supabase.com
2. Sélectionner le projet "ARK_SERVICE"
3. Aller dans "SQL Editor"
4. Copier/coller le contenu de chaque migration
5. Exécuter dans l'ordre:
   - `20251030155501_add_froid_email_tracking.sql`
   - `20251030155502_create_pg_cron_froid_evaluation.sql`

### Étape 2: Déployer l'Edge Function

```bash
# Via CLI
supabase functions deploy send-evaluation-froid-email
```

**OU via Dashboard:**
1. Aller dans "Edge Functions"
2. Créer une nouvelle fonction "send-evaluation-froid-email"
3. Copier/coller le contenu de `index.ts`
4. Déployer

### Étape 3: Vérifier les secrets

Les variables d'environnement suivantes doivent être configurées:
- ✅ `RESEND_API_KEY` (déjà configuré)
- ✅ `SUPABASE_URL` (automatique)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (automatique)

### Étape 4: Activer pg_cron

**Important:** Vérifier que pg_cron est activé sur Supabase.

Via Dashboard:
1. Database → Extensions
2. Rechercher "pg_cron"
3. Cliquer "Enable" si nécessaire

---

## Vérification du déploiement

### 1. Vérifier les jobs pg_cron

```sql
-- Lister les jobs créés
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname LIKE 'send-evaluation-froid%';
```

**Résultat attendu:**
```
 jobid |             jobname              | schedule  | active
-------+----------------------------------+-----------+--------
   1   | send-evaluation-froid-j30        | 0 9 * * * | t
   2   | send-evaluation-froid-relance-j37| 0 10 * * *| t
```

### 2. Vérifier les colonnes ajoutées

```sql
-- Vérifier les colonnes de tracking
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'evaluation'
  AND column_name LIKE 'evaluation_froid%'
ORDER BY column_name;
```

**Résultat attendu:**
```
           column_name           |       data_type        | is_nullable
---------------------------------+------------------------+-------------
 evaluation_froid_completed_at   | timestamp with time zone | YES
 evaluation_froid_relance_sent_at| timestamp with time zone | YES
 evaluation_froid_sent_at        | timestamp with time zone | YES
 evaluation_froid_token          | text                   | YES
```

### 3. Vérifier l'Edge Function

```bash
# Tester manuellement l'edge function
curl -X POST https://qhtpibkaiyfrqxdtytag.supabase.co/functions/v1/send-evaluation-froid-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ANON_KEY}" \
  -d '{"evaluationId": "ID_TEST", "isRelance": false}'
```

---

## Test du système

### Test 1: Simuler une évaluation à J+30

```sql
-- Créer une évaluation de test datée de J-30
INSERT INTO evaluation (
    id,
    formation_id,
    evaluation_type,
    statut,
    submitted_at,
    stagiaire_nom,
    stagiaire_prenom,
    stagiaire_email,
    evaluation_froid_token,
    evaluation_froid_sent_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM formation LIMIT 1),  -- Prendre une formation existante
    'chaude',
    'Traitée',
    NOW() - INTERVAL '30 days',  -- J-30
    'TEST',
    'Stagiaire',
    'test@example.com',  -- Remplacer par votre email de test
    'eval_froid_' || substr(md5(random()::text), 1, 32),
    NULL  -- Pas encore envoyé
);
```

### Test 2: Déclencher manuellement le job

```sql
-- Exécuter manuellement le job J+30
DO $$
DECLARE
    v_evaluation RECORD;
    v_request_id bigint;
BEGIN
    FOR v_evaluation IN
        SELECT id, stagiaire_email
        FROM evaluation
        WHERE stagiaire_email = 'test@example.com'  -- Votre email de test
          AND evaluation_froid_sent_at IS NULL
    LOOP
        SELECT INTO v_request_id net.http_post(
            url := 'https://qhtpibkaiyfrqxdtytag.supabase.co/functions/v1/send-evaluation-froid-email',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodHBpYmthaXlmcnF4ZHR5dGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjE3MDYsImV4cCI6MjA2NjY5NzcwNn0.HBL78_qkP71sDRnIA6bQLtGWrf2VogGV1E_60B3q5G8'
            ),
            body := jsonb_build_object(
                'evaluationId', v_evaluation.id::text,
                'isRelance', false
            ),
            timeout_milliseconds := 30000
        );

        RAISE NOTICE 'Email envoyé pour % (request_id: %)', v_evaluation.stagiaire_email, v_request_id;
    END LOOP;
END $$;
```

### Test 3: Vérifier l'email reçu

1. Vérifier votre boîte email
2. Cliquer sur le lien dans l'email
3. Vérifier que le formulaire s'ouvre correctement
4. Compléter le formulaire
5. Vérifier que `evaluation_froid_completed_at` est mis à jour

### Test 4: Vérifier les logs des jobs

```sql
-- Voir les dernières exécutions des jobs
SELECT
    jobid,
    runid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details
WHERE jobid IN (
    SELECT jobid FROM cron.job WHERE jobname LIKE 'send-evaluation-froid%'
)
ORDER BY start_time DESC
LIMIT 10;
```

---

## Monitoring et maintenance

### Vérifier les évaluations en attente

```sql
-- Évaluations éligibles pour email J+30
SELECT
    id,
    stagiaire_email,
    submitted_at,
    DATE_PART('day', NOW() - submitted_at) as jours_depuis_soumission
FROM evaluation
WHERE evaluation_type = 'chaude'
  AND statut = 'Traitée'
  AND submitted_at <= NOW() - INTERVAL '30 days'
  AND evaluation_froid_sent_at IS NULL
  AND stagiaire_email IS NOT NULL
ORDER BY submitted_at ASC;
```

### Vérifier les évaluations en attente de relance

```sql
-- Évaluations éligibles pour relance J+37
SELECT
    id,
    stagiaire_email,
    evaluation_froid_sent_at,
    DATE_PART('day', NOW() - evaluation_froid_sent_at) as jours_depuis_email
FROM evaluation
WHERE evaluation_type = 'chaude'
  AND statut = 'Traitée'
  AND evaluation_froid_sent_at IS NOT NULL
  AND evaluation_froid_sent_at <= NOW() - INTERVAL '7 days'
  AND evaluation_froid_relance_sent_at IS NULL
  AND froid_satisfaction_globale IS NULL
ORDER BY evaluation_froid_sent_at ASC;
```

### Dashboard statistiques

```sql
-- Statistiques globales évaluation à froid
SELECT
    COUNT(*) FILTER (WHERE evaluation_froid_sent_at IS NOT NULL) as emails_envoyes,
    COUNT(*) FILTER (WHERE evaluation_froid_relance_sent_at IS NOT NULL) as relances_envoyees,
    COUNT(*) FILTER (WHERE froid_satisfaction_globale IS NOT NULL) as formulaires_completes,
    ROUND(
        COUNT(*) FILTER (WHERE froid_satisfaction_globale IS NOT NULL)::numeric /
        NULLIF(COUNT(*) FILTER (WHERE evaluation_froid_sent_at IS NOT NULL), 0) * 100,
        2
    ) as taux_completion_pct
FROM evaluation
WHERE evaluation_type = 'chaude'
  AND statut = 'Traitée';
```

---

## Dépannage

### Problème: Les emails ne sont pas envoyés

**Solutions:**
1. Vérifier que pg_cron est activé: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
2. Vérifier les logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;`
3. Vérifier que RESEND_API_KEY est configuré
4. Tester manuellement l'edge function

### Problème: Le lien d'évaluation ne fonctionne pas

**Solutions:**
1. Vérifier que `evaluation_froid_token` existe dans la base
2. Vérifier que le routing est configuré dans `js/components/Layout.js`
3. Vérifier que la page `EvaluationFroidFormPage.js` existe

### Problème: Les relances ne sont pas envoyées

**Solutions:**
1. Vérifier que `froid_satisfaction_globale IS NULL` (formulaire pas complété)
2. Vérifier que 7 jours se sont écoulés depuis le premier email
3. Vérifier les logs du job de relance

---

## Désactivation temporaire

Pour désactiver les jobs sans les supprimer:

```sql
-- Désactiver J+30
SELECT cron.unschedule('send-evaluation-froid-j30');

-- Désactiver relance J+37
SELECT cron.unschedule('send-evaluation-froid-relance-j37');
```

Pour réactiver, ré-exécuter la migration `20251030155502_create_pg_cron_froid_evaluation.sql`.

---

## Support

Pour toute question ou problème:
1. Vérifier les logs pg_cron
2. Vérifier les logs de l'Edge Function dans le Dashboard Supabase
3. Tester manuellement avec une évaluation de test

---

**Date de création:** 30/01/2025
**Auteur:** Claude Code
**Version:** 1.0
