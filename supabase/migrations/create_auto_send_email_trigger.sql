-- Migration : Trigger automatique pour envoyer l'email d'évaluation
-- Date : 2025-01-24
-- Description : Appelle automatiquement l'edge function send-evaluation-email
--               quand les 2 PDFs (Qualiopi + Diplôme) sont uploadés

-- 1. Activer l'extension pg_net pour faire des requêtes HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Créer une fonction trigger pour l'envoi automatique de l'email
CREATE OR REPLACE FUNCTION send_evaluation_email_on_pdfs_ready()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request_id bigint;
    v_supabase_url text;
    v_service_role_key text;
BEGIN
    -- Vérifier que les 2 PDFs viennent d'être uploadés
    -- (OLD n'avait pas les 2 PDFs ET NEW a les 2 PDFs)
    IF (OLD.pdf_qualiopi_url IS NULL OR OLD.pdf_diplome_url IS NULL)
       AND NEW.pdf_qualiopi_url IS NOT NULL
       AND NEW.pdf_diplome_url IS NOT NULL THEN

        -- Configuration de l'URL Supabase et de la clé anon (publique)
        v_supabase_url := 'https://qhtpibkaiyfrqxdtytag.supabase.co';
        v_service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodHBpYmthaXlmcnF4ZHR5dGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjE3MDYsImV4cCI6MjA2NjY5NzcwNn0.HBL78_qkP71sDRnIA6bQLtGWrf2VogGV1E_60B3q5G8';

        RAISE NOTICE '📧 Déclenchement de l''envoi automatique de l''email pour l''évaluation %', NEW.id;

        -- Appeler l'edge function de manière asynchrone via pg_net
        -- Note: pg_net.http_post retourne immédiatement et exécute la requête en arrière-plan
        SELECT INTO v_request_id net.http_post(
            url := v_supabase_url || '/functions/v1/send-evaluation-email',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || COALESCE(v_service_role_key, '')
            ),
            body := jsonb_build_object(
                'evaluationId', NEW.id::text
            ),
            timeout_milliseconds := 30000  -- 30 secondes de timeout
        );

        RAISE NOTICE '✅ Requête HTTP envoyée (request_id: %)', v_request_id;
    END IF;

    RETURN NEW;
END;
$$;

-- 3. Créer le trigger AFTER UPDATE sur la table evaluation
DROP TRIGGER IF EXISTS after_pdfs_uploaded ON evaluation;

CREATE TRIGGER after_pdfs_uploaded
    AFTER UPDATE ON evaluation
    FOR EACH ROW
    WHEN (
        (OLD.pdf_qualiopi_url IS NULL OR OLD.pdf_diplome_url IS NULL)
        AND NEW.pdf_qualiopi_url IS NOT NULL
        AND NEW.pdf_diplome_url IS NOT NULL
    )
    EXECUTE FUNCTION send_evaluation_email_on_pdfs_ready();

-- 4. Vérification
DO $$
BEGIN
    RAISE NOTICE '✅ Extension pg_net activée';
    RAISE NOTICE '✅ Fonction send_evaluation_email_on_pdfs_ready() créée';
    RAISE NOTICE '✅ Trigger after_pdfs_uploaded créé sur la table evaluation';
    RAISE NOTICE 'ℹ️  L''email sera envoyé automatiquement quand pdf_qualiopi_url ET pdf_diplome_url sont remplis';
    RAISE NOTICE '📧 L''edge function send-evaluation-email sera appelée en arrière-plan via pg_net';
END $$;
