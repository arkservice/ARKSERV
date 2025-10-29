-- Migration : Ajouter le type de document 'diplome' dans template_configurations
-- Date : 2025-01-24
-- Description : Initialiser la configuration pour le nouveau template diplome (format A4 paysage)

-- Insérer la configuration pour le type 'diplome' si elle n'existe pas déjà
INSERT INTO template_configurations (
    document_type,
    header_image_url,
    footer_image_url,
    sections,
    created_at,
    updated_at
)
SELECT
    'diplome',
    NULL, -- Pas d'image header par défaut
    NULL, -- Pas d'image footer par défaut
    '[
        {"id": "header", "name": "En-tête", "height": 15, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 0, "paddingRight": 0, "paddingBottom": 0, "paddingLeft": 0, "backgroundColor": "#FFFFFF", "alignment": "center"},
        {"id": "titre", "name": "Titre", "height": 30, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 10, "paddingRight": 30, "paddingBottom": 10, "paddingLeft": 30, "backgroundColor": "#FFFFFF", "alignment": "center"},
        {"id": "certification", "name": "Certification", "height": 15, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 5, "paddingRight": 30, "paddingBottom": 5, "paddingLeft": 30, "backgroundColor": "#FFFFFF", "alignment": "center"},
        {"id": "stagiaire", "name": "Nom stagiaire", "height": 15, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 5, "paddingRight": 30, "paddingBottom": 5, "paddingLeft": 30, "backgroundColor": "#FFFFFF", "alignment": "center"},
        {"id": "texte_intro", "name": "Texte intro", "height": 10, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 3, "paddingRight": 30, "paddingBottom": 3, "paddingLeft": 30, "backgroundColor": "#FFFFFF", "alignment": "center"},
        {"id": "formation", "name": "Nom formation", "height": 25, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 5, "paddingRight": 30, "paddingBottom": 5, "paddingLeft": 30, "backgroundColor": "#FFFFFF", "alignment": "center"},
        {"id": "dates", "name": "Dates et durée", "height": 15, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 5, "paddingRight": 30, "paddingBottom": 5, "paddingLeft": 30, "backgroundColor": "#FFFFFF", "alignment": "center"},
        {"id": "bas_page", "name": "Bas de page (Fait à + signatures)", "height": 30, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 5, "paddingRight": 30, "paddingBottom": 5, "paddingLeft": 30, "backgroundColor": "#FFFFFF", "alignment": "left"},
        {"id": "footer", "name": "Pied de page", "height": 55, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 0, "paddingRight": 0, "paddingBottom": 0, "paddingLeft": 0, "backgroundColor": "#FFFFFF", "alignment": "center"}
    ]'::jsonb,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM template_configurations WHERE document_type = 'diplome'
);

-- Vérifier l'insertion
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM template_configurations WHERE document_type = 'diplome') THEN
        RAISE NOTICE '✅ Configuration pour le template diplome initialisée avec succès';
    ELSE
        RAISE NOTICE '⚠️ La configuration existait déjà ou l''insertion a échoué';
    END IF;
END $$;
