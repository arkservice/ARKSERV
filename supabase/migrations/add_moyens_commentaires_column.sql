-- Ajouter la colonne moyens_commentaires à la table evaluation
-- Cette colonne stocke les commentaires du stagiaire concernant les moyens mis à disposition
-- (locaux, matériel, supports, formation à distance, restauration)

ALTER TABLE evaluation
ADD COLUMN IF NOT EXISTS moyens_commentaires TEXT;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN evaluation.moyens_commentaires IS 'Commentaires du stagiaire concernant les moyens mis à disposition (locaux, matériel, supports, formation à distance, restauration)';
