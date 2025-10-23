// Index des services email
// Charge tous les services email dans l'ordre correct
(function() {
    'use strict';

    // Les services sont déjà chargés via leurs propres fichiers
    // Ce fichier sert de point d'entrée documenté

    // Vérifier que tous les services sont chargés
    const services = {
        EmailService: window.EmailService,
        FormationEmailService: window.FormationEmailService,
        EvaluationEmailService: window.EvaluationEmailService
    };

    // Vérifier la disponibilité
    const missing = Object.keys(services).filter(key => !services[key]);

    if (missing.length > 0) {
        console.error('❌ [Email Services] Services manquants:', missing);
    } else {
        console.log('✅ [Email Services] Tous les services email sont chargés:', Object.keys(services));
    }

    // Helper pour créer des instances
    window.createEmailServices = function(supabaseClient) {
        if (!supabaseClient) {
            console.error('❌ Client Supabase requis pour créer les services email');
            return null;
        }

        return {
            formation: new window.FormationEmailService(supabaseClient),
            evaluation: new window.EvaluationEmailService(supabaseClient)
        };
    };

    console.log('✅ [Email Services Index] Module chargé');
})();
