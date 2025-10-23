-- Migration: Normaliser le champ lieu et ajouter adresse dans evenement
-- Date: 2025-01-23
-- Description: Séparer le lieu (type) de l'adresse complète pour les événements de formation

-- 1. Ajouter la colonne adresse si elle n'existe pas
ALTER TABLE evenement
ADD COLUMN IF NOT EXISTS adresse TEXT;

-- 2. Mettre à jour les événements existants
-- Copier lieu actuel vers adresse, puis normaliser lieu
UPDATE evenement
SET
  adresse = lieu,
  lieu = CASE
    WHEN UPPER(lieu) LIKE 'ARKANCE%' THEN 'Dans nos locaux'
    WHEN UPPER(lieu) LIKE '%FOAD%'
      OR UPPER(lieu) LIKE '%A DISTANCE%'
      OR UPPER(lieu) LIKE '%À DISTANCE%' THEN 'À distance'
    ELSE 'Dans vos locaux'
  END
WHERE
  type_evenement = 'formation'
  AND lieu IS NOT NULL
  AND lieu NOT IN ('Dans nos locaux', 'Dans vos locaux', 'À distance');

-- 3. Ajouter un commentaire pour documenter les champs
COMMENT ON COLUMN evenement.adresse IS 'Adresse complète du lieu de formation (ex: "ARKANCE SYSTEMS TOULOUSE" ou "25 Rue de la Paix, Paris")';
COMMENT ON COLUMN evenement.lieu IS 'Type de lieu de formation parmi: "Dans nos locaux", "Dans vos locaux", "À distance". Utilisé pour conditionner les questions du formulaire d''évaluation.';
