// Hook personnalisé pour les formations
function useFormation() {
    const { useState, useEffect, useCallback } = React;
    const supabase = window.supabaseConfig.client;

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Générer un token unique
    const generateToken = () => {
        return 'eval_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    // Récupérer toutes les sessions
    const fetchSessions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('formation')
                .select(`
                    *,
                    pdc:pdc_id(
                        id,
                        ref,
                        pdc_number,
                        duree_en_jour,
                        programme_point_1,
                        programme_point_2,
                        programme_point_3,
                        programme_point_4,
                        programme_point_5,
                        programme_point_6,
                        programme_point_7,
                        programme_point_8,
                        programme_point_9,
                        programme_point_10,
                        programme_point_11,
                        programme_point_12,
                        logiciel:logiciel_id(nom, logo)
                    ),
                    formateur:formateur_id(
                        id,
                        nom,
                        prenom,
                        email
                    ),
                    commercial:commercial_id(
                        id,
                        nom,
                        prenom,
                        email
                    )
                `)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setSessions(data || []);
        } catch (err) {
            console.error('Erreur lors du chargement des sessions:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Récupérer une session par token
    const getSessionByToken = async (token) => {
        try {
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('formation')
                .select(`
                    *,
                    pdc:pdc_id(
                        id,
                        ref,
                        pdc_number,
                        duree_en_jour,
                        programme_point_1,
                        programme_point_2,
                        programme_point_3,
                        programme_point_4,
                        programme_point_5,
                        programme_point_6,
                        programme_point_7,
                        programme_point_8,
                        programme_point_9,
                        programme_point_10,
                        programme_point_11,
                        programme_point_12,
                        logiciel:logiciel_id(nom, logo)
                    ),
                    formateur:formateur_id(
                        id,
                        nom,
                        prenom,
                        email
                    ),
                    commercial:commercial_id(
                        id,
                        nom,
                        prenom,
                        email
                    )
                `)
                .eq('token', token)
                .single();

            if (fetchError) throw fetchError;
            return data;
        } catch (err) {
            console.error('Erreur lors du chargement de la session:', err);
            setError(err.message);
            throw err;
        }
    };

    // Récupérer une session par ID
    const getSessionById = async (id) => {
        try {
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('formation')
                .select(`
                    *,
                    pdc:pdc_id(
                        id,
                        ref,
                        pdc_number,
                        duree_en_jour,
                        programme_point_1,
                        programme_point_2,
                        programme_point_3,
                        programme_point_4,
                        programme_point_5,
                        programme_point_6,
                        programme_point_7,
                        programme_point_8,
                        programme_point_9,
                        programme_point_10,
                        programme_point_11,
                        programme_point_12,
                        logiciel:logiciel_id(nom, logo)
                    ),
                    formateur:formateur_id(
                        id,
                        nom,
                        prenom,
                        email
                    ),
                    commercial:commercial_id(
                        id,
                        nom,
                        prenom,
                        email
                    )
                `)
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;
            return data;
        } catch (err) {
            console.error('Erreur lors du chargement de la session:', err);
            setError(err.message);
            throw err;
        }
    };

    // Créer une nouvelle session
    const createSession = async (sessionData) => {
        try {
            setError(null);

            // Générer un token unique
            const token = generateToken();

            const { data, error: insertError } = await supabase
                .from('formation')
                .insert({
                    ...sessionData,
                    token
                })
                .select()
                .single();

            if (insertError) throw insertError;
            await fetchSessions();
            return data;
        } catch (err) {
            console.error('Erreur lors de la création de la session:', err);
            setError(err.message);
            throw err;
        }
    };

    // Mettre à jour une session
    const updateSession = async (id, updates) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('formation')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;
            await fetchSessions();
            return data;
        } catch (err) {
            console.error('Erreur lors de la mise à jour de la session:', err);
            setError(err.message);
            throw err;
        }
    };

    // Supprimer une session
    const deleteSession = async (id) => {
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from('formation')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            await fetchSessions();
        } catch (err) {
            console.error('Erreur lors de la suppression de la session:', err);
            setError(err.message);
            throw err;
        }
    };

    // Générer l'URL complète avec le token
    const generateEvaluationUrl = (token) => {
        // Obtenir le chemin complet de l'URL actuelle (file:// ou http://)
        const currentUrl = window.location.href;
        // Retirer le hash s'il existe
        const baseUrl = currentUrl.split('#')[0];
        // Ajouter le hash avec le token
        return `${baseUrl}#/evaluation/${token}`;
    };

    // Charger les sessions au montage
    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    return {
        sessions,
        loading,
        error,
        fetchSessions,
        getSessionByToken,
        getSessionById,
        createSession,
        updateSession,
        deleteSession,
        generateEvaluationUrl
    };
}

// Export global
window.useFormation = useFormation;
