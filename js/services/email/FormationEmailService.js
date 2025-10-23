// Service pour l'envoi d'emails de formation via Supabase Edge Functions
(function() {
    'use strict';

    class FormationEmailService extends window.EmailService {
        constructor(supabaseClient) {
            super(supabaseClient);
        }

        /**
         * Envoie un email de formation via l'Edge Function send-formation-email
         * @param {string} formationId - ID de la formation
         * @returns {Promise<{success: boolean, data: any, error: any}>}
         */
        async sendFormationEmail(formationId) {
            if (!formationId) {
                const error = { message: 'ID de formation manquant', code: 'MISSING_ID' };
                this.logEmailError('Formation', 'N/A', error);
                return { success: false, data: null, error };
            }

            try {
                // 1. Récupérer les données de la formation
                const formation = await this.getFormation(formationId);
                if (!formation) {
                    const error = { message: 'Formation non trouvée', code: 'NOT_FOUND' };
                    this.logEmailError('Formation', 'N/A', error);
                    return { success: false, data: null, error };
                }

                // 2. Valider les données nécessaires
                const validationError = this.validateFormationData(formation);
                if (validationError) {
                    this.logEmailError('Formation', formation.id, validationError);
                    return { success: false, data: null, error: validationError };
                }

                // 3. Log de la tentative d'envoi
                this.logEmailAttempt('Formation', formation.id, {
                    formationId: formation.id,
                    hasConvocation: !!formation.pdf_convocation_url,
                    hasConvention: !!formation.pdf_convention_url,
                    hasProgramme: !!formation.pdf_programme_url
                });

                // 4. Appeler l'Edge Function
                const result = await this.callEdgeFunction('send-formation-email', {
                    formationId: formationId
                });

                // 5. Log du résultat
                if (result.success) {
                    this.logEmailSuccess('Formation', formation.id, result.data?.resendId);
                } else {
                    this.logEmailError('Formation', formation.id, result.error);
                }

                return result;

            } catch (err) {
                const error = { message: err.message, code: 'EXCEPTION' };
                this.logEmailError('Formation', formationId, error);
                return { success: false, data: null, error };
            }
        }

        /**
         * Récupère les données d'une formation
         * @param {string} formationId
         * @returns {Promise<Object|null>}
         */
        async getFormation(formationId) {
            try {
                const { data, error } = await this.supabase
                    .from('formation')
                    .select('*')
                    .eq('id', formationId)
                    .single();

                if (error) {
                    console.error('❌ Erreur récupération formation:', error);
                    return null;
                }

                return data;
            } catch (err) {
                console.error('❌ Exception récupération formation:', err);
                return null;
            }
        }

        /**
         * Valide les données d'une formation avant envoi d'email
         * @param {Object} formation
         * @returns {Object|null} - Retourne un objet d'erreur si invalide, null sinon
         */
        validateFormationData(formation) {
            // Vérifier qu'au moins un PDF est disponible
            const hasPdfs = formation.pdf_convocation_url ||
                           formation.pdf_convention_url ||
                           formation.pdf_programme_url;

            if (!hasPdfs) {
                return {
                    message: 'Aucun PDF disponible pour cette formation',
                    code: 'NO_PDF'
                };
            }

            // Vérifier que l'email du destinataire existe
            // Note: La validation réelle se fait dans l'Edge Function
            // Ici on fait juste une vérification basique
            if (!formation.email_destinataire && !formation.contact_email) {
                return {
                    message: 'Aucun email destinataire configuré',
                    code: 'NO_EMAIL'
                };
            }

            return null;
        }

        /**
         * Vérifie si une formation a tous les PDFs nécessaires
         * @param {string} formationId
         * @returns {Promise<{hasConvocation: boolean, hasConvention: boolean, hasProgramme: boolean}>}
         */
        async checkFormationPdfs(formationId) {
            const formation = await this.getFormation(formationId);

            if (!formation) {
                return {
                    hasConvocation: false,
                    hasConvention: false,
                    hasProgramme: false
                };
            }

            return {
                hasConvocation: !!formation.pdf_convocation_url,
                hasConvention: !!formation.pdf_convention_url,
                hasProgramme: !!formation.pdf_programme_url
            };
        }
    }

    // Export
    window.FormationEmailService = FormationEmailService;

    console.log('✅ [FormationEmailService] Module chargé');
})();
