-- Migration : Jobs pg_cron pour l'envoi automatique des emails d'évaluation à froid
-- Description :
--   - Job 1 : Envoie l'email d'évaluation à froid 30 jours après la formation (9h UTC quotidien)
--   - Job 2 : Envoie un email de relance 7 jours après le premier email (10h UTC quotidien)

-- 1. Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Fonction helper pour logger les actions pg_cron
CREATE OR REPLACE FUNCTION log_cron_action(job_name text, action text, details text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE NOTICE '[%] % - %', job_name, action, details;
END;
$$;

-- 3. Job quotidien : Envoi emails d'évaluation à froid à J+30
-- Exécution : Tous les jours à 9h00 UTC (10h heure de Paris en hiver, 11h en été)
SELECT cron.schedule(
    'send-evaluation-froid-j30',
    '0 9 * * *',  -- Cron: tous les jours à 9h UTC
    $$
    DO $$
    DECLARE
        v_evaluation RECORD;
        v_request_id bigint;
        v_count integer := 0;
        v_supabase_url text := 'https://qhtpibkaiyfrqxdtytag.supabase.co';
        v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodHBpYmthaXlmcnF4ZHR5dGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjE3MDYsImV4cCI6MjA2NjY5NzcwNn0.HBL78_qkP71sDRnIA6bQLtGWrf2VogGV1E_60B3q5G8';
    BEGIN
        RAISE NOTICE '[CRON] 🚀 Début du job send-evaluation-froid-j30 à %', NOW();

        -- Sélectionner les évaluations éligibles pour l'email à froid
        FOR v_evaluation IN
            SELECT id, stagiaire_email, submitted_at
            FROM evaluation
            WHERE evaluation_type = 'chaude'
              AND statut = 'Traitée'
              AND submitted_at <= NOW() - INTERVAL '30 days'
              AND evaluation_froid_sent_at IS NULL
              AND stagiaire_email IS NOT NULL
              AND evaluation_froid_token IS NOT NULL
            ORDER BY submitted_at ASC
            LIMIT 50  -- Traiter max 50 évaluations par batch pour éviter surcharge
        LOOP
            -- Appeler l'edge function pour chaque évaluation
            BEGIN
                SELECT INTO v_request_id net.http_post(
                    url := v_supabase_url || '/functions/v1/send-evaluation-froid-email',
                    headers := jsonb_build_object(
                        'Content-Type', 'application/json',
                        'Authorization', 'Bearer ' || v_anon_key
                    ),
                    body := jsonb_build_object(
                        'evaluationId', v_evaluation.id::text,
                        'isRelance', false
                    ),
                    timeout_milliseconds := 30000
                );

                v_count := v_count + 1;
                RAISE NOTICE '[CRON] ✅ Email à froid envoyé pour évaluation % (stagiaire: %, soumise le: %, request_id: %)',
                    v_evaluation.id, v_evaluation.stagiaire_email, v_evaluation.submitted_at, v_request_id;

            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING '[CRON] ❌ Erreur lors de l''envoi pour évaluation %: %',
                    v_evaluation.id, SQLERRM;
            END;
        END LOOP;

        RAISE NOTICE '[CRON] 📊 Résumé J+30 : % email(s) à froid envoyé(s)', v_count;

        IF v_count = 0 THEN
            RAISE NOTICE '[CRON] ℹ️  Aucune évaluation éligible pour l''email à froid aujourd''hui';
        END IF;
    END $$;
    $$
);

-- 4. Job quotidien : Envoi emails de relance à J+37 (7 jours après premier email)
-- Exécution : Tous les jours à 10h00 UTC
SELECT cron.schedule(
    'send-evaluation-froid-relance-j37',
    '0 10 * * *',  -- Cron: tous les jours à 10h UTC
    $$
    DO $$
    DECLARE
        v_evaluation RECORD;
        v_request_id bigint;
        v_count integer := 0;
        v_supabase_url text := 'https://qhtpibkaiyfrqxdtytag.supabase.co';
        v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodHBpYmthaXlmcnF4ZHR5dGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjE3MDYsImV4cCI6MjA2NjY5NzcwNn0.HBL78_qkP71sDRnIA6bQLtGWrf2VogGV1E_60B3q5G8';
    BEGIN
        RAISE NOTICE '[CRON] 🚀 Début du job send-evaluation-froid-relance-j37 à %', NOW();

        -- Sélectionner les évaluations éligibles pour la relance
        FOR v_evaluation IN
            SELECT id, stagiaire_email, evaluation_froid_sent_at
            FROM evaluation
            WHERE evaluation_type = 'chaude'
              AND statut = 'Traitée'
              AND evaluation_froid_sent_at IS NOT NULL
              AND evaluation_froid_sent_at <= NOW() - INTERVAL '7 days'
              AND evaluation_froid_relance_sent_at IS NULL
              AND froid_satisfaction_globale IS NULL  -- N'a pas encore complété le formulaire
              AND stagiaire_email IS NOT NULL
            ORDER BY evaluation_froid_sent_at ASC
            LIMIT 50  -- Traiter max 50 relances par batch
        LOOP
            -- Appeler l'edge function pour chaque relance
            BEGIN
                SELECT INTO v_request_id net.http_post(
                    url := v_supabase_url || '/functions/v1/send-evaluation-froid-email',
                    headers := jsonb_build_object(
                        'Content-Type', 'application/json',
                        'Authorization', 'Bearer ' || v_anon_key
                    ),
                    body := jsonb_build_object(
                        'evaluationId', v_evaluation.id::text,
                        'isRelance', true
                    ),
                    timeout_milliseconds := 30000
                );

                v_count := v_count + 1;
                RAISE NOTICE '[CRON] ✅ Email de relance envoyé pour évaluation % (stagiaire: %, 1er email: %, request_id: %)',
                    v_evaluation.id, v_evaluation.stagiaire_email, v_evaluation.evaluation_froid_sent_at, v_request_id;

            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING '[CRON] ❌ Erreur lors de l''envoi de la relance pour évaluation %: %',
                    v_evaluation.id, SQLERRM;
            END;
        END LOOP;

        RAISE NOTICE '[CRON] 📊 Résumé J+37 : % email(s) de relance envoyé(s)', v_count;

        IF v_count = 0 THEN
            RAISE NOTICE '[CRON] ℹ️  Aucune évaluation éligible pour la relance aujourd''hui';
        END IF;
    END $$;
    $$
);

-- 5. Commentaires et documentation
COMMENT ON EXTENSION pg_cron IS 'Extension pour planifier des jobs PostgreSQL (envoi emails évaluation à froid)';

-- 6. Vérification et affichage des jobs créés
DO $$
DECLARE
    v_job RECORD;
BEGIN
    RAISE NOTICE '✅ Extension pg_cron activée';
    RAISE NOTICE '✅ Fonction log_cron_action() créée';
    RAISE NOTICE '';
    RAISE NOTICE '📅 Jobs pg_cron créés :';
    RAISE NOTICE '';

    FOR v_job IN
        SELECT jobid, jobname, schedule, command
        FROM cron.job
        WHERE jobname IN ('send-evaluation-froid-j30', 'send-evaluation-froid-relance-j37')
        ORDER BY jobname
    LOOP
        RAISE NOTICE '  📌 Job #% : %', v_job.jobid, v_job.jobname;
        RAISE NOTICE '     ⏰ Planification : % (UTC)', v_job.schedule;
        RAISE NOTICE '';
    END LOOP;

    RAISE NOTICE '💡 Instructions :';
    RAISE NOTICE '';
    RAISE NOTICE '  1️⃣  Job "send-evaluation-froid-j30" :';
    RAISE NOTICE '      - S''exécute tous les jours à 9h00 UTC (10h/11h heure de Paris)';
    RAISE NOTICE '      - Envoie l''email d''évaluation à froid 30 jours après la formation';
    RAISE NOTICE '      - Sélectionne les évaluations où :';
    RAISE NOTICE '        • evaluation_type = ''chaude''';
    RAISE NOTICE '        • statut = ''Traitée''';
    RAISE NOTICE '        • submitted_at >= 30 jours';
    RAISE NOTICE '        • evaluation_froid_sent_at IS NULL';
    RAISE NOTICE '';
    RAISE NOTICE '  2️⃣  Job "send-evaluation-froid-relance-j37" :';
    RAISE NOTICE '      - S''exécute tous les jours à 10h00 UTC';
    RAISE NOTICE '      - Envoie un email de relance 7 jours après le premier email';
    RAISE NOTICE '      - Sélectionne les évaluations où :';
    RAISE NOTICE '        • email à froid déjà envoyé il y a 7 jours';
    RAISE NOTICE '        • formulaire pas encore complété (froid_satisfaction_globale IS NULL)';
    RAISE NOTICE '        • pas de relance déjà envoyée';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Pour voir les logs des jobs :';
    RAISE NOTICE '    SELECT * FROM cron.job_run_details WHERE jobid IN (';
    RAISE NOTICE '        SELECT jobid FROM cron.job WHERE jobname LIKE ''send-evaluation-froid%''';
    RAISE NOTICE '    ) ORDER BY start_time DESC LIMIT 10;';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Pour désactiver temporairement un job :';
    RAISE NOTICE '    SELECT cron.unschedule(''send-evaluation-froid-j30'');';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Pour réactiver un job :';
    RAISE NOTICE '    -- Ré-exécuter la commande SELECT cron.schedule(...) ci-dessus';
    RAISE NOTICE '';
END $$;
