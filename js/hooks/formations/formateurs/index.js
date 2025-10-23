// Index des utilitaires pour les formateurs
// Vérifie que tous les modules sont chargés
(function() {
    'use strict';

    // Les utilitaires sont déjà chargés via leurs propres fichiers
    // Ce fichier sert de point d'entrée documenté

    // Vérifier que tous les utilitaires sont chargés
    const utils = {
        timezoneUtils: window.formateurTimezoneUtils,
        timeSlotUtils: window.formateurTimeSlotUtils
    };

    // Vérifier la disponibilité
    const missing = Object.keys(utils).filter(key => !utils[key]);

    if (missing.length > 0) {
        console.error('❌ [Formateurs Utils] Modules manquants:', missing);
    } else {
        console.log('✅ [Formateurs Utils] Tous les utilitaires formateurs sont chargés:', Object.keys(utils));
    }

    console.log('✅ [Formateurs Index] Module chargé');
})();
