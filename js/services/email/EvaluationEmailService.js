// Service pour l'envoi d'emails d'évaluation via Supabase Edge Functions
(function() {
    'use strict';

    class EvaluationEmailService extends window.EmailService {
        constructor(supabaseClient) {
            super(supabaseClient);
        }

        /**
         * Envoie un email d'évaluation via l'Edge Function send-evaluation-email
         * @param {string} evaluationId - ID de l'évaluation
         * @returns {Promise<{success: boolean, data: any, error: any}>}
         */
        async sendEvaluationEmail(evaluationId) {
            if (!evaluationId) {
                const error = { message: 'ID d\'évaluation manquant', code: 'MISSING_ID' };
                this.logEmailError('Evaluation', 'N/A', error);
                return { success: false, data: null, error };
            }

            try {
                // 1. Récupérer les données de l'évaluation
                const evaluation = await this.getEvaluation(evaluationId);
                if (!evaluation) {
                    const error = { message: 'Évaluation non trouvée', code: 'NOT_FOUND' };
                    this.logEmailError('Evaluation', 'N/A', error);
                    return { success: false, data: null, error };
                }

                // 2. Valider les données nécessaires
                const validationError = this.validateEvaluationData(evaluation);
                if (validationError) {
                    this.logEmailError('Evaluation', evaluation.id, validationError);
                    return { success: false, data: null, error: validationError };
                }

                // 3. Log de la tentative d'envoi
                this.logEmailAttempt('Evaluation', evaluation.id, {
                    evaluationId: evaluation.id,
                    statut: evaluation.statut,
                    hasPdf: !!evaluation.pdf_qualiopi_url
                });

                // 4. Appeler l'Edge Function
                const result = await this.callEdgeFunction('send-evaluation-email', {
                    evaluationId: evaluationId
                });

                // 5. Log du résultat
                if (result.success) {
                    this.logEmailSuccess('Evaluation', evaluation.id, result.data?.resendId);
                } else {
                    this.logEmailError('Evaluation', evaluation.id, result.error);
                }

                return result;

            } catch (err) {
                const error = { message: err.message, code: 'EXCEPTION' };
                this.logEmailError('Evaluation', evaluationId, error);
                return { success: false, data: null, error };
            }
        }

        /**
         * Récupère les données d'une évaluation
         * @param {string} evaluationId
         * @returns {Promise<Object|null>}
         */
        async getEvaluation(evaluationId) {
            try {
                const { data, error } = await this.supabase
                    .from('evaluation')
                    .select('*')
                    .eq('id', evaluationId)
                    .single();

                if (error) {
                    console.error('❌ Erreur récupération évaluation:', error);
                    return null;
                }

                return data;
            } catch (err) {
                console.error('❌ Exception récupération évaluation:', err);
                return null;
            }
        }

        /**
         * Valide les données d'une évaluation avant envoi d'email
         * @param {Object} evaluation
         * @returns {Object|null} - Retourne un objet d'erreur si invalide, null sinon
         */
        validateEvaluationData(evaluation) {
            // Vérifier que le statut est "Traitée"
            if (evaluation.statut !== 'Traitée') {
                return {
                    message: `Statut invalide pour envoi email: ${evaluation.statut}. Requis: "Traitée"`,
                    code: 'INVALID_STATUS'
                };
            }

            // Vérifier que le PDF Qualiopi est disponible
            if (!evaluation.pdf_qualiopi_url) {
                return {
                    message: 'PDF Qualiopi non disponible',
                    code: 'NO_PDF'
                };
            }

            // Vérifier que l'email du formateur existe
            if (!evaluation.email_formateur) {
                return {
                    message: 'Email du formateur manquant',
                    code: 'NO_EMAIL'
                };
            }

            // Valider le format de l'email
            if (!this.isValidEmail(evaluation.email_formateur)) {
                return {
                    message: `Format d'email invalide: ${evaluation.email_formateur}`,
                    code: 'INVALID_EMAIL'
                };
            }

            return null;
        }

        /**
         * Vérifie si une évaluation est prête pour l'envoi d'email
         * @param {string} evaluationId
         * @returns {Promise<{ready: boolean, reason: string|null}>}
         */
        async isReadyForEmail(evaluationId) {
            const evaluation = await this.getEvaluation(evaluationId);

            if (!evaluation) {
                return { ready: false, reason: 'Évaluation non trouvée' };
            }

            const validationError = this.validateEvaluationData(evaluation);

            if (validationError) {
                return { ready: false, reason: validationError.message };
            }

            return { ready: true, reason: null };
        }

        /**
         * Récupère l'historique des évaluations d'un formateur
         * Utile pour ne pas envoyer plusieurs fois le même email
         * @param {string} emailFormateur
         * @returns {Promise<Array>}
         */
        async getFormateurEvaluationHistory(emailFormateur) {
            try {
                const { data, error } = await this.supabase
                    .from('evaluation')
                    .select('*')
                    .eq('email_formateur', emailFormateur)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('❌ Erreur récupération historique:', error);
                    return [];
                }

                return data || [];
            } catch (err) {
                console.error('❌ Exception récupération historique:', err);
                return [];
            }
        }
    }

    // Export
    window.EvaluationEmailService = EvaluationEmailService;

    console.log('✅ [EvaluationEmailService] Module chargé');
})();
