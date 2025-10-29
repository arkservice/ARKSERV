-- Migration: Ajouter la colonne 'duree' à la table projects
-- Description: Permet de stocker la durée de la formation (en heures) depuis l'import CSV

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS duree TEXT;

COMMENT ON COLUMN projects.duree IS 'Durée de la formation (format texte depuis CSV, ex: "3j", "21h", etc.)';
