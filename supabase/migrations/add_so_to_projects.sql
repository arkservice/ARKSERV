-- Migration: Ajouter le champ 'so' (Service Order) à la table projects
-- Date: 2025-10-21
-- Description: Ajoute un champ pour stocker le numéro de service order (SO)
--              utilisé dans les références SOASF[numéro] des convocations

-- Ajouter la colonne 'so' de type INTEGER
ALTER TABLE projects ADD COLUMN IF NOT EXISTS so INTEGER;

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN projects.so IS 'Numéro de service order (SO) pour les références SOASF dans les documents de convocation';
