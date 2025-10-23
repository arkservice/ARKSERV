-- Migration : Simplifier la table images_template pour permettre le partage d'images entre templates
-- Date : 2025-01-XX
-- Description : Retirer la contrainte document_type pour permettre à tous les templates d'utiliser les mêmes images

-- 1. Supprimer la contrainte CHECK sur document_type
ALTER TABLE images_template DROP CONSTRAINT IF EXISTS images_template_document_type_check;

-- 2. Supprimer la colonne document_type (plus besoin de lier les images à un type de document)
ALTER TABLE images_template DROP COLUMN IF EXISTS document_type;

-- 3. Ajouter une colonne file_path si elle n'existe pas (pour stocker le chemin complet)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='images_template' AND column_name='file_path') THEN
        ALTER TABLE images_template ADD COLUMN file_path TEXT;
    END IF;
END $$;

-- 4. Mettre à jour file_path pour les images existantes (si vide)
-- Exemple : header devient headers/nom-fichier.ext
UPDATE images_template
SET file_path = type || 's/' || split_part(file_url, '/', -1)
WHERE file_path IS NULL OR file_path = '';

-- 5. Créer un index sur type pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_images_template_type ON images_template(type);

-- 6. Créer un index unique sur file_path pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS idx_images_template_file_path ON images_template(file_path);

-- RÉSULTAT :
-- ✅ Plus de contrainte sur document_type
-- ✅ Les images sont partagées entre tous les templates
-- ✅ Structure simplifiée : id, name, type (header/footer), file_url, file_path, file_size, mime_type, timestamps
