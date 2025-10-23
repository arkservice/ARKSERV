// Helper pour initialiser jsPDF de manière cohérente
(function() {
    'use strict';

    /**
     * Initialise et retourne une instance jsPDF
     * Vérifie que jsPDF est chargé et gère les différentes façons dont il peut être exposé
     * @param {Object} options - Options de configuration du document
     * @returns {Object} - Instance jsPDF
     * @throws {Error} - Si jsPDF n'est pas disponible
     */
    function initializePDF(options = {}) {
        // Vérifier que jsPDF est disponible
        let jsPDF;
        if (window.jsPDF) {
            jsPDF = window.jsPDF;
        } else if (window.jspdf && window.jspdf.jsPDF) {
            jsPDF = window.jspdf.jsPDF;
        } else {
            console.log('window.jsPDF:', window.jsPDF);
            console.log('window.jspdf:', window.jspdf);
            console.log('Objets window disponibles:', Object.keys(window).filter(k => k.toLowerCase().includes('pdf')));
            throw new Error('jsPDF n\'est pas chargé. Vérifiez que le CDN est inclus dans index.html');
        }

        // Options par défaut
        const defaultOptions = {
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            putOnlyUsedFonts: true,
            floatPrecision: 16
        };

        // Fusionner les options
        const finalOptions = { ...defaultOptions, ...options };

        // Créer et retourner l'instance
        const doc = new jsPDF(finalOptions);

        console.log('✅ jsPDF initialisé avec succès', finalOptions);

        return doc;
    }

    /**
     * Obtient les dimensions standard d'une page A4
     * @returns {Object} - { width: 210, height: 297 } (en mm)
     */
    function getA4Dimensions() {
        return {
            width: 210,
            height: 297
        };
    }

    /**
     * Obtient les dimensions d'un document jsPDF
     * @param {Object} doc - Instance jsPDF
     * @returns {Object} - { width, height } (en mm)
     */
    function getPageDimensions(doc) {
        return {
            width: doc.internal.pageSize.getWidth(),
            height: doc.internal.pageSize.getHeight()
        };
    }

    // Exposer les utilitaires
    window.pdfInit = {
        initializePDF,
        getA4Dimensions,
        getPageDimensions
    };

    console.log('✅ [pdfInit] Module chargé et exposé via window.pdfInit');
})();
