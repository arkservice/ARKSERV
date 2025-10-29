-- Migration: Ajouter les colonnes pour l'évaluation à froid
-- Date: 2025-10-29
-- Description: Ajoute les champs nécessaires pour le formulaire d'évaluation à froid (30 jours après la formation)

-- Ajouter le type d'évaluation et la référence vers l'évaluation chaude
ALTER TABLE evaluation
ADD COLUMN IF NOT EXISTS evaluation_type TEXT DEFAULT 'chaude',
ADD COLUMN IF NOT EXISTS evaluation_chaude_id UUID REFERENCES evaluation(id),
ADD COLUMN IF NOT EXISTS evaluation_froid_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS evaluation_froid_sent_at TIMESTAMP;

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_evaluation_type ON evaluation(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_evaluation_froid_token ON evaluation(evaluation_froid_token);
CREATE INDEX IF NOT EXISTS idx_evaluation_chaude_id ON evaluation(evaluation_chaude_id);

-- Ajouter les colonnes pour les questions de l'évaluation à froid
-- Section: Mise en pratique
ALTER TABLE evaluation
ADD COLUMN IF NOT EXISTS froid_appliquer_connaissances BOOLEAN,
ADD COLUMN IF NOT EXISTS froid_mieux_apprehender BOOLEAN,
ADD COLUMN IF NOT EXISTS froid_faciliter_quotidien BOOLEAN,
ADD COLUMN IF NOT EXISTS froid_ameliorer_efficacite BOOLEAN,
ADD COLUMN IF NOT EXISTS froid_developper_competences BOOLEAN,
ADD COLUMN IF NOT EXISTS froid_autres_precisions TEXT;

-- Section: Bilan de la formation
ALTER TABLE evaluation
ADD COLUMN IF NOT EXISTS froid_repondu_attentes BOOLEAN,
ADD COLUMN IF NOT EXISTS froid_atteint_objectifs BOOLEAN,
ADD COLUMN IF NOT EXISTS froid_adequation_metier BOOLEAN;

-- Section: Satisfaction globale
ALTER TABLE evaluation
ADD COLUMN IF NOT EXISTS froid_recommandation BOOLEAN,
ADD COLUMN IF NOT EXISTS froid_satisfaction_globale INTEGER CHECK (froid_satisfaction_globale >= 1 AND froid_satisfaction_globale <= 5),
ADD COLUMN IF NOT EXISTS froid_commentaires_satisfaction TEXT;

-- Commentaires sur les colonnes
COMMENT ON COLUMN evaluation.evaluation_type IS 'Type d''évaluation: "chaude" (immédiate après formation) ou "froid" (30 jours après)';
COMMENT ON COLUMN evaluation.evaluation_chaude_id IS 'Référence vers l''évaluation chaude (pour les évaluations à froid)';
COMMENT ON COLUMN evaluation.evaluation_froid_token IS 'Token unique pour accéder au formulaire d''évaluation à froid';
COMMENT ON COLUMN evaluation.evaluation_froid_sent_at IS 'Date d''envoi du lien d''évaluation à froid';

COMMENT ON COLUMN evaluation.froid_appliquer_connaissances IS 'Q1: Êtes-vous en mesure d''appliquer les connaissances acquises lors de la formation ?';
COMMENT ON COLUMN evaluation.froid_mieux_apprehender IS 'Q2: Êtes-vous en mesure de mieux appréhender le logiciel ou les thèmes abordés ?';
COMMENT ON COLUMN evaluation.froid_faciliter_quotidien IS 'Q3: La formation a-t-elle facilité votre quotidien ?';
COMMENT ON COLUMN evaluation.froid_ameliorer_efficacite IS 'Q4: A-t-elle amélioré la qualité ou l''efficacité de votre travail ?';
COMMENT ON COLUMN evaluation.froid_developper_competences IS 'Q5: Vous a-t-elle permis de développer de nouvelles compétences ?';
COMMENT ON COLUMN evaluation.froid_autres_precisions IS 'Q6: Autres bénéfices, précisez (texte libre)';

COMMENT ON COLUMN evaluation.froid_repondu_attentes IS 'Q7: La formation a-t-elle répondu à vos attentes initiales ?';
COMMENT ON COLUMN evaluation.froid_atteint_objectifs IS 'Q8: Pensez-vous avoir atteint les objectifs pédagogiques prévus lors de la formation ?';
COMMENT ON COLUMN evaluation.froid_adequation_metier IS 'Q9: Estimez-vous que la formation était en adéquation avec le métier ou les réalités du secteur ?';

COMMENT ON COLUMN evaluation.froid_recommandation IS 'Q10: Recommanderiez-vous notre service à un ami ou un collègue ?';
COMMENT ON COLUMN evaluation.froid_satisfaction_globale IS 'Q11: Quel est votre niveau de satisfaction globale ? (échelle 1-5)';
COMMENT ON COLUMN evaluation.froid_commentaires_satisfaction IS 'Q12: Vos commentaires concernant votre satisfaction (texte libre)';
