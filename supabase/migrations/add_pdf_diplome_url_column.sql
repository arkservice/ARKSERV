-- Migration : Ajouter la colonne pdf_diplome_url à la table evaluation
-- Date : 2025-01-24
-- Description : Stocker l'URL du PDF du diplôme de formation pour chaque évaluation

-- Ajouter la colonne pdf_diplome_url si elle n'existe pas
ALTER TABLE evaluation
ADD COLUMN IF NOT EXISTS pdf_diplome_url TEXT;

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN evaluation.pdf_diplome_url IS 'URL du PDF du diplôme de formation stocké dans Supabase Storage';

-- Vérifier l'ajout
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'evaluation'
        AND column_name = 'pdf_diplome_url'
    ) THEN
        RAISE NOTICE '✅ Colonne pdf_diplome_url ajoutée avec succès à la table evaluation';
    ELSE
        RAISE WARNING '⚠️ La colonne pdf_diplome_url n''a pas pu être ajoutée';
    END IF;
END $$;
