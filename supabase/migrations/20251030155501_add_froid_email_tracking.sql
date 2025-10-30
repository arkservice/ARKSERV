-- Migration: Ajout des colonnes de tracking pour les emails d'évaluation à froid
-- Description: Permet de suivre l'envoi des emails à froid, les relances, et la complétion du formulaire

-- Ajouter les colonnes de tracking
ALTER TABLE evaluation
ADD COLUMN IF NOT EXISTS evaluation_froid_relance_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS evaluation_froid_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Ajouter des commentaires pour la documentation
COMMENT ON COLUMN evaluation.evaluation_froid_sent_at IS 'Date d''envoi du premier email d''évaluation à froid (J+30)';
COMMENT ON COLUMN evaluation.evaluation_froid_relance_sent_at IS 'Date d''envoi de l''email de relance d''évaluation à froid (J+37)';
COMMENT ON COLUMN evaluation.evaluation_froid_completed_at IS 'Date de complétion du formulaire d''évaluation à froid par le stagiaire';

-- Créer des index pour améliorer les performances des requêtes pg_cron
CREATE INDEX IF NOT EXISTS idx_evaluation_froid_relance_sent
    ON evaluation(evaluation_froid_relance_sent_at)
    WHERE evaluation_type = 'chaude' AND statut = 'Traitée';

CREATE INDEX IF NOT EXISTS idx_evaluation_froid_completed
    ON evaluation(evaluation_froid_completed_at)
    WHERE evaluation_type = 'chaude';

-- Index composite pour les requêtes pg_cron (optimisation)
CREATE INDEX IF NOT EXISTS idx_evaluation_froid_pending
    ON evaluation(submitted_at, evaluation_froid_sent_at)
    WHERE evaluation_type = 'chaude'
      AND statut = 'Traitée'
      AND evaluation_froid_sent_at IS NULL;

-- Commentaires sur les index
COMMENT ON INDEX idx_evaluation_froid_relance_sent IS 'Index pour pg_cron: recherche des évaluations nécessitant une relance';
COMMENT ON INDEX idx_evaluation_froid_completed IS 'Index pour tracking des évaluations à froid complétées';
COMMENT ON INDEX idx_evaluation_froid_pending IS 'Index composite pour pg_cron: recherche des évaluations à J+30 sans email envoyé';
