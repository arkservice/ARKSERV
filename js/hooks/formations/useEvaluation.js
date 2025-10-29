// Hook personnalisé pour les évaluations
function useEvaluation() {
    const { useState, useEffect, useCallback } = React;
    const supabase = window.supabaseConfig.client;

    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Récupérer toutes les évaluations
    const fetchEvaluations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('evaluation')
                .select(`
                    *,
                    formation:formation_id(
                        id,
                        evaluation_token,
                        prj,
                        lieu_projet,
                        duree,
                        pdc:pdc_id(
                            id,
                            ref,
                            pdc_number,
                            version_logiciel,
                            duree_en_jour,
                            logiciel:logiciel_id(nom, logo),
                            metier_pdc:metier_pdc_id(nom),
                            type_pdc:type_pdc_id(nom)
                        ),
                        logiciel:logiciel_id(nom, logo),
                        formateur:formateur_id(
                            id,
                            nom,
                            prenom,
                            email
                        ),
                        commercial:commercial_id(
                            nom,
                            prenom,
                            email
                        )
                    )
                `)
                .order('submitted_at', { ascending: false });

            if (fetchError) throw fetchError;
            setEvaluations(data || []);
        } catch (err) {
            console.error('Erreur lors du chargement des évaluations:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Récupérer les évaluations d'une session spécifique
    const getEvaluationsBySession = async (sessionId) => {
        try {
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('evaluation')
                .select(`
                    *,
                    formation:formation_id(
                        id,
                        evaluation_token,
                        prj,
                        lieu_projet,
                        duree,
                        pdc:pdc_id(
                            id,
                            ref,
                            pdc_number,
                            version_logiciel,
                            duree_en_jour,
                            logiciel:logiciel_id(nom, logo),
                            metier_pdc:metier_pdc_id(nom),
                            type_pdc:type_pdc_id(nom)
                        ),
                        logiciel:logiciel_id(nom, logo),
                        formateur:formateur_id(
                            nom,
                            prenom,
                            email
                        )
                    )
                `)
                .eq('formation_id', sessionId)
                .order('submitted_at', { ascending: false });

            if (fetchError) throw fetchError;
            return data || [];
        } catch (err) {
            console.error('Erreur lors du chargement des évaluations:', err);
            setError(err.message);
            throw err;
        }
    };

    // Récupérer une évaluation par ID
    const getEvaluationById = async (id) => {
        try {
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('evaluation')
                .select(`
                    *,
                    formation:formation_id(
                        id,
                        evaluation_token,
                        prj,
                        lieu_projet,
                        duree,
                        pdc:pdc_id(
                            id,
                            ref,
                            pdc_number,
                            version_logiciel,
                            duree_en_jour,
                            logiciel:logiciel_id(nom, logo),
                            metier_pdc:metier_pdc_id(nom),
                            type_pdc:type_pdc_id(nom)
                        ),
                        logiciel:logiciel_id(nom, logo),
                        formateur:formateur_id(
                            id,
                            nom,
                            prenom,
                            email
                        ),
                        commercial:commercial_id(
                            nom,
                            prenom,
                            email
                        )
                    )
                `)
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;
            return data;
        } catch (err) {
            console.error('Erreur lors du chargement de l\'évaluation:', err);
            setError(err.message);
            throw err;
        }
    };

    // Créer une nouvelle évaluation (soumission du formulaire)
    const createEvaluation = async (evaluationData) => {
        try {
            setError(null);

            // Générer un token unique pour l'évaluation à froid
            const generateFroidToken = () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                let token = 'eval_froid_';
                for (let i = 0; i < 32; i++) {
                    token += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return token;
            };

            // Ajouter le token d'évaluation à froid et le type
            const dataWithToken = {
                ...evaluationData,
                evaluation_type: 'chaude',
                evaluation_froid_token: generateFroidToken()
            };

            const { data, error: insertError } = await supabase
                .from('evaluation')
                .insert(dataWithToken)
                .select()
                .single();

            if (insertError) throw insertError;
            await fetchEvaluations();
            return data;
        } catch (err) {
            console.error('Erreur lors de la création de l\'évaluation:', err);
            setError(err.message);
            throw err;
        }
    };

    // Mettre à jour une évaluation
    const updateEvaluation = async (id, updates) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('evaluation')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;
            await fetchEvaluations();
            return data;
        } catch (err) {
            console.error('Erreur lors de la mise à jour de l\'évaluation:', err);
            setError(err.message);
            throw err;
        }
    };

    // Supprimer une évaluation
    const deleteEvaluation = async (id) => {
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from('evaluation')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            await fetchEvaluations();
        } catch (err) {
            console.error('Erreur lors de la suppression de l\'évaluation:', err);
            setError(err.message);
            throw err;
        }
    };

    // Mettre à jour l'évaluation Qualiopi du formateur
    const updateFormateurQualiopi = async (evaluationId, formateurThemes, currentUserId, formateurId) => {
        try {
            setError(null);

            // Vérifier que l'utilisateur connecté est bien le formateur de la formation
            if (currentUserId !== formateurId) {
                throw new Error('Seul le formateur de cette formation peut compléter cette évaluation');
            }

            // Mettre à jour l'évaluation avec les notes du formateur
            const { data, error: updateError } = await supabase
                .from('evaluation')
                .update({
                    qualiopi_formateur_themes: formateurThemes,
                    statut: 'Traitée',
                    formateur_completed_at: new Date().toISOString()
                })
                .eq('id', evaluationId)
                .select()
                .single();

            if (updateError) throw updateError;
            await fetchEvaluations();
            return data;
        } catch (err) {
            console.error('Erreur lors de la mise à jour de l\'évaluation formateur:', err);
            setError(err.message);
            throw err;
        }
    };

    // Récupérer une évaluation par son token à froid
    const getEvaluationByFroidToken = async (token) => {
        try {
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('evaluation')
                .select(`
                    *,
                    formation:formation_id(
                        id,
                        evaluation_token,
                        prj,
                        lieu_projet,
                        pdc:pdc_id(
                            id,
                            ref,
                            pdc_number,
                            version_logiciel,
                            logiciel:logiciel_id(nom, logo),
                            metier_pdc:metier_pdc_id(nom),
                            type_pdc:type_pdc_id(nom)
                        ),
                        formateur:formateur_id(
                            id,
                            nom,
                            prenom,
                            email
                        ),
                        commercial:commercial_id(
                            nom,
                            prenom,
                            email
                        )
                    )
                `)
                .eq('evaluation_froid_token', token)
                .eq('evaluation_type', 'chaude')
                .single();

            if (fetchError) throw fetchError;
            return data;
        } catch (err) {
            console.error('Erreur lors du chargement de l\'évaluation par token à froid:', err);
            setError(err.message);
            throw err;
        }
    };

    // Calculer des statistiques pour une session
    const calculateSessionStats = (evaluationsData) => {
        if (!evaluationsData || evaluationsData.length === 0) {
            return null;
        }

        const stats = {
            total: evaluationsData.length,
            moyennes: {
                organisation: 0,
                moyens: 0,
                pedagogie: 0,
                satisfaction: 0,
                global: 0
            }
        };

        // Calculer les moyennes
        evaluationsData.forEach(eval => {
            // Organisation (4 questions)
            const orgAvg = (
                (eval.org_communication_objectifs || 0) +
                (eval.org_duree_formation || 0) +
                (eval.org_composition_groupe || 0) +
                (eval.org_respect_engagements || 0)
            ) / 4;
            stats.moyennes.organisation += orgAvg;

            // Moyens (4 questions principales)
            const moyensAvg = (
                (eval.moyens_evaluation_locaux || 0) +
                (eval.moyens_materiel_informatique || 0) +
                (eval.moyens_formation_distance || 0) +
                (eval.moyens_support_cours || 0)
            ) / 4;
            stats.moyennes.moyens += moyensAvg;

            // Pédagogie (8 questions)
            const pedaAvg = (
                (eval.peda_niveau_difficulte || 0) +
                (eval.peda_rythme_progression || 0) +
                (eval.peda_qualite_contenu_theorique || 0) +
                (eval.peda_qualite_contenu_pratique || 0) +
                (eval.peda_connaissance_formateur || 0) +
                (eval.peda_approche_pedagogique || 0) +
                (eval.peda_ecoute_disponibilite || 0) +
                (eval.peda_animation_formateur || 0)
            ) / 8;
            stats.moyennes.pedagogie += pedaAvg;

            // Satisfaction (5 questions)
            const satisfAvg = (
                (eval.satisf_repondu_attentes || 0) +
                (eval.satisf_atteint_objectifs || 0) +
                (eval.satisf_adequation_metier || 0) +
                (eval.satisf_recommandation || 0) +
                (eval.satisf_niveau_global || 0)
            ) / 5;
            stats.moyennes.satisfaction += satisfAvg;
        });

        // Diviser par le nombre d'évaluations
        stats.moyennes.organisation /= evaluationsData.length;
        stats.moyennes.moyens /= evaluationsData.length;
        stats.moyennes.pedagogie /= evaluationsData.length;
        stats.moyennes.satisfaction /= evaluationsData.length;

        // Moyenne globale
        stats.moyennes.global = (
            stats.moyennes.organisation +
            stats.moyennes.moyens +
            stats.moyennes.pedagogie +
            stats.moyennes.satisfaction
        ) / 4;

        // Arrondir à 1 décimale
        Object.keys(stats.moyennes).forEach(key => {
            stats.moyennes[key] = Math.round(stats.moyennes[key] * 10) / 10;
        });

        return stats;
    };

    // Charger les évaluations au montage
    useEffect(() => {
        fetchEvaluations();
    }, [fetchEvaluations]);

    return {
        evaluations,
        loading,
        error,
        fetchEvaluations,
        getEvaluationsBySession,
        getEvaluationById,
        getEvaluationByFroidToken,
        createEvaluation,
        updateEvaluation,
        deleteEvaluation,
        updateFormateurQualiopi,
        calculateSessionStats
    };
}

// Export global
window.useEvaluation = useEvaluation;
