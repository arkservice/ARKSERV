// Helper pour mapper les sections configurées vers les positions Y dans les générateurs PDF
(function() {
    'use strict';

    /**
     * Calcule les positions Y de chaque section à partir de la configuration
     * @param {Array} sections - Tableau de sections depuis Supabase
     * @returns {Object} - Objet avec ID de section comme clé et { y, height } comme valeur
     */
    function getSectionPositions(sections) {
        if (!sections || sections.length === 0) {
            console.warn('⚠️ Aucune section fournie, positions par défaut utilisées');
            return {};
        }

        const positions = {};
        let currentY = 0;

        sections.forEach(section => {
            // Ajouter le gap du haut
            currentY += section.gapTop || 0;

            // Enregistrer la position de la section
            positions[section.id] = {
                y: currentY,
                height: section.height || 0,
                width: section.width || 210,
                paddingTop: section.paddingTop || 0,
                paddingRight: section.paddingRight || 0,
                paddingBottom: section.paddingBottom || 0,
                paddingLeft: section.paddingLeft || 0,
                backgroundColor: section.backgroundColor || '#FFFFFF',
                alignment: section.alignment || 'left',
                name: section.name || section.id
            };

            // Avancer pour la prochaine section
            currentY += section.height || 0;
            currentY += section.gapBottom || 0;
        });

        console.log('📏 Positions calculées:', positions);
        return positions;
    }

    /**
     * Récupère une section par son ID
     * @param {Array} sections - Tableau de sections
     * @param {String} id - ID de la section recherchée
     * @returns {Object|null} - La section trouvée ou null
     */
    function getSectionById(sections, id) {
        if (!sections || sections.length === 0) return null;
        return sections.find(s => s.id === id) || null;
    }

    /**
     * Vérifie si le contenu peut tenir dans une section
     * @param {Number} contentHeight - Hauteur du contenu en mm
     * @param {Object} section - Section depuis getSectionPositions
     * @returns {Boolean} - true si le contenu rentre
     */
    function canFitInSection(contentHeight, section) {
        if (!section) return false;
        const availableHeight = section.height - section.paddingTop - section.paddingBottom;
        return contentHeight <= availableHeight;
    }

    /**
     * Calcule la hauteur disponible dans une section (sans padding)
     * @param {Object} section - Section depuis getSectionPositions
     * @returns {Number} - Hauteur disponible en mm
     */
    function getAvailableHeight(section) {
        if (!section) return 0;
        return section.height - section.paddingTop - section.paddingBottom;
    }

    /**
     * Calcule la largeur disponible dans une section (sans padding)
     * @param {Object} section - Section depuis getSectionPositions
     * @returns {Number} - Largeur disponible en mm
     */
    function getAvailableWidth(section) {
        if (!section) return 210;
        return section.width - section.paddingLeft - section.paddingRight;
    }

    /**
     * Obtient les coordonnées du contenu (avec padding appliqué)
     * @param {Object} section - Section depuis getSectionPositions
     * @returns {Object} - { x, y, width, height }
     */
    function getContentBounds(section) {
        if (!section) return { x: 0, y: 0, width: 210, height: 297 };

        return {
            x: section.paddingLeft,
            y: section.y + section.paddingTop,
            width: getAvailableWidth(section),
            height: getAvailableHeight(section)
        };
    }

    // Exposer les fonctions via window
    window.pdfSectionMapper = {
        getSectionPositions,
        getSectionById,
        canFitInSection,
        getAvailableHeight,
        getAvailableWidth,
        getContentBounds
    };

    console.log('✅ [pdfSectionMapper] Module chargé et exposé via window.pdfSectionMapper');

})();
