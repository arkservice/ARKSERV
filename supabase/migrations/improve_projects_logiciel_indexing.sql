-- Améliorer l'indexation et les contraintes pour logiciel_id dans la table projects
-- Cette migration optimise les requêtes sur les logiciels et assure l'intégrité référentielle

-- 1. Ajouter un index sur logiciel_id pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_projects_logiciel_id
ON projects(logiciel_id)
WHERE logiciel_id IS NOT NULL;

-- 2. Assurer que la contrainte de clé étrangère existe
-- Note: Si la contrainte existe déjà, cette commande sera ignorée
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_projects_logiciel'
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE projects
        ADD CONSTRAINT fk_projects_logiciel
        FOREIGN KEY (logiciel_id)
        REFERENCES logiciel(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Ajouter commentaires pour documenter les champs
COMMENT ON COLUMN projects.logiciel_id IS 'Référence au logiciel/produit principal utilisé pour cette formation (lien vers table logiciel)';
COMMENT ON COLUMN projects.heures_formation IS 'Durée de la formation en heures (format texte, ex: "14" ou "7h" ou "09h00 à 17h00")';

-- 4. Ajouter un index sur heures_formation pour faciliter les filtres et statistiques
CREATE INDEX IF NOT EXISTS idx_projects_heures_formation
ON projects(heures_formation)
WHERE heures_formation IS NOT NULL;
