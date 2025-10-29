-- Migration : Mettre à jour les hauteurs des sections du template diplome
-- Date : 2025-01-24
-- Description : Optimiser les hauteurs pour éviter que le footer sorte de la page A4 paysage (210mm)

-- Mettre à jour la configuration des sections pour le type 'diplome'
UPDATE template_configurations
SET
    sections = '[
        {"id": "header", "name": "En-tête", "height": 12, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 0, "paddingRight": 0, "paddingBottom": 0, "paddingLeft": 0, "backgroundColor": "#FFFFFF", "alignment": "center"},
        {"id": "titre", "name": "Titre", "height": 20, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 5, "paddingRight": 30, "paddingBottom": 5, "paddingLeft": 30, "backgroundColor": "#FFFFFF", "alignment": "center"},
        {"id": "certification", "name": "Certification", "height": 12, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 3, "paddingRight": 30, "paddingBottom": 3, "paddingLeft": 30, "backgroundColor": "#FFFFFF", "alignment": "center"},
        {"id": "stagiaire", "name": "Nom stagiaire", "height": 12, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 3, "paddingRight": 30, "paddingBottom": 3, "paddingLeft": 30, "backgroundColor": "#FFFFFF", "alignment": "center"},
        {"id": "texte_intro", "name": "Texte intro", "height": 10, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 2, "paddingRight": 30, "paddingBottom": 2, "paddingLeft": 30, "backgroundColor": "#FFFFFF", "alignment": "center"},
        {"id": "formation", "name": "Nom formation", "height": 22, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 5, "paddingRight": 30, "paddingBottom": 5, "paddingLeft": 30, "backgroundColor": "#FFFFFF", "alignment": "center"},
        {"id": "dates", "name": "Dates et durée", "height": 15, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 5, "paddingRight": 30, "paddingBottom": 5, "paddingLeft": 30, "backgroundColor": "#FFFFFF", "alignment": "center"},
        {"id": "bas_page", "name": "Bas de page (Fait à + signatures)", "height": 25, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 5, "paddingRight": 30, "paddingBottom": 5, "paddingLeft": 30, "backgroundColor": "#FFFFFF", "alignment": "left"},
        {"id": "footer", "name": "Pied de page", "height": 50, "width": 297, "gapTop": 0, "gapBottom": 0, "paddingTop": 0, "paddingRight": 0, "paddingBottom": 0, "paddingLeft": 0, "backgroundColor": "#FFFFFF", "alignment": "center"}
    ]'::jsonb,
    updated_at = NOW()
WHERE document_type = 'diplome';

-- Vérifier la mise à jour
DO $$
DECLARE
    total_height INTEGER;
BEGIN
    -- Calculer la hauteur totale des sections
    SELECT SUM((value->>'height')::INTEGER)
    INTO total_height
    FROM template_configurations, jsonb_array_elements(sections)
    WHERE document_type = 'diplome';

    RAISE NOTICE '✅ Hauteurs des sections mises à jour pour le template diplome';
    RAISE NOTICE 'ℹ️ Hauteur totale: % mm (A4 paysage = 210mm)', total_height;

    IF total_height > 210 THEN
        RAISE WARNING '⚠️ Attention: La hauteur totale (% mm) dépasse 210mm!', total_height;
    ELSE
        RAISE NOTICE '✅ La hauteur totale rentre bien dans la page A4 paysage';
    END IF;
END $$;
