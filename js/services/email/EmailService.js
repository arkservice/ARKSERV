// Service de base pour l'envoi d'emails via Supabase Edge Functions
(function() {
    'use strict';

    class EmailService {
        constructor(supabaseClient) {
            this.supabase = supabaseClient;
        }

        /**
         * Appelle une Edge Function Supabase
         * @param {string} functionName - Nom de l'Edge Function
         * @param {Object} payload - Données à envoyer
         * @returns {Promise<{success: boolean, data: any, error: any}>}
         */
        async callEdgeFunction(functionName, payload) {
            try {
                console.log(`📧 Appel Edge Function: ${functionName}`, payload);

                const { data, error } = await this.supabase.functions.invoke(
                    functionName,
                    { body: payload }
                );

                if (error) {
                    console.error(`❌ Erreur Edge Function ${functionName}:`, error);
                    return {
                        success: false,
                        data: null,
                        error: error
                    };
                }

                console.log(`✅ Edge Function ${functionName} - Succès:`, data);
                return {
                    success: true,
                    data: data,
                    error: null
                };
            } catch (err) {
                console.error(`❌ Exception lors de l'appel ${functionName}:`, err);
                return {
                    success: false,
                    data: null,
                    error: {
                        message: err.message,
                        code: 'EXCEPTION'
                    }
                };
            }
        }

        /**
         * Vérifie si un email est valide
         * @param {string} email
         * @returns {boolean}
         */
        isValidEmail(email) {
            if (!email) return false;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        /**
         * Log une tentative d'envoi d'email
         * @param {string} type - Type d'email
         * @param {string} recipient - Destinataire
         * @param {Object} metadata - Métadonnées additionnelles
         */
        logEmailAttempt(type, recipient, metadata = {}) {
            console.log(`📧 [Email ${type}] Tentative d'envoi vers ${recipient}`, metadata);
        }

        /**
         * Log un succès d'envoi d'email
         * @param {string} type - Type d'email
         * @param {string} recipient - Destinataire
         * @param {string} resendId - ID Resend
         */
        logEmailSuccess(type, recipient, resendId) {
            console.log(`✅ [Email ${type}] Envoyé avec succès vers ${recipient}`, { resendId });
        }

        /**
         * Log une erreur d'envoi d'email
         * @param {string} type - Type d'email
         * @param {string} recipient - Destinataire
         * @param {any} error - Erreur
         */
        logEmailError(type, recipient, error) {
            console.error(`❌ [Email ${type}] Erreur lors de l'envoi vers ${recipient}:`, error);
        }
    }

    // Export
    window.EmailService = EmailService;

    console.log('✅ [EmailService] Module chargé');
})();
