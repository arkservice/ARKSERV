-- Migration: Ajouter champ netsuite_id à la table projects
-- Date: 2025-01-22
-- Description: Ajouter un champ pour stocker l'ID NetSuite et éviter les doublons

-- Ajouter la colonne netsuite_id
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS netsuite_id TEXT;

-- Ajouter une contrainte unique pour éviter les doublons NetSuite
ALTER TABLE projects
ADD CONSTRAINT unique_netsuite_id UNIQUE (netsuite_id);

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_projects_netsuite_id ON projects(netsuite_id);

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN projects.netsuite_id IS 'ID du projet dans NetSuite (ex: 489080). Utilisé pour éviter les doublons et gérer les mises à jour depuis le webhook NetSuite.';
