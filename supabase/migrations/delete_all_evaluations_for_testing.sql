-- ATTENTION: Cette migration supprime TOUTES les évaluations de la table evaluation
-- À utiliser UNIQUEMENT pour les tests de développement
-- NE PAS exécuter en production avec des données réelles

-- Supprimer toutes les évaluations
DELETE FROM evaluation;

-- Réinitialiser la séquence si elle existe (optionnel)
-- Cela permet de repartir avec des IDs propres
-- Note: Supabase utilise des UUIDs donc ceci n'est probablement pas nécessaire

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Toutes les évaluations ont été supprimées de la table evaluation';
END $$;
