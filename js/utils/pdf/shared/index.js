// Index des helpers PDF partagés
// Vérifie que tous les modules sont chargés
(function() {
    'use strict';

    // Les helpers sont déjà chargés via leurs propres fichiers
    // Ce fichier sert de point d'entrée documenté

    // Vérifier que tous les helpers sont chargés
    const helpers = {
        pdfCore: window.pdfCore,              // Fonctions de base (images, couleurs)
        pdfSectionMapper: window.pdfSectionMapper, // Mapping des sections
        pdfInit: window.pdfInit,              // Initialisation jsPDF
        pdfText: window.pdfText,              // Rendu de texte
        pdfLayout: window.pdfLayout           // Layout et sections communes
    };

    // Vérifier la disponibilité
    const missing = Object.keys(helpers).filter(key => !helpers[key]);

    if (missing.length > 0) {
        console.error('❌ [PDF Helpers] Modules manquants:', missing);
    } else {
        console.log('✅ [PDF Helpers] Tous les helpers PDF sont chargés:', Object.keys(helpers));
    }

    /**
     * Helper pour créer un PDF avec tous les utilitaires disponibles
     * @param {Object} options - Options de configuration jsPDF
     * @returns {Object} - Instance jsPDF avec helpers en contexte
     */
    window.createPDFWithHelpers = function(options = {}) {
        const { initializePDF } = window.pdfInit;
        const doc = initializePDF(options);

        // Ajouter une référence aux helpers dans le document
        doc._helpers = helpers;

        return doc;
    };

    console.log('✅ [PDF Shared Index] Module chargé');
})();
