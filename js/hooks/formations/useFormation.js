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

    // Nettoyer les champs UUID : convertir les chaînes vides en null
    const cleanUuidFields = (data) => {
        const uuidFields = [
            'commercial_id',
            'formateur_id',
            'contact_id',
            'entreprise_id',
            'pdc_id',
            'logiciel_id',
            'created_by'
        ];

        const cleaned = { ...data };
        uuidFields.forEach(field => {
            // Ne nettoyer que les champs présents dans l'objet d'origine
            if (field in cleaned && (cleaned[field] === '' || cleaned[field] === undefined)) {
                cleaned[field] = null;
            }
        });

        return cleaned;
    };

    // Récupérer toutes les sessions (formations sont maintenant dans projects)
    const fetchSessions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('projects')
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
                        email,
                        avatar
                    ),
                    commercial:commercial_id(
                        id,
                        nom,
                        prenom,
                        email,
                        avatar
                    ),
                    entreprise:entreprise_id(
                        id,
                        nom,
                        adresse,
                        telephone,
                        email
                    ),
                    contact:contact_id(
                        id,
                        nom,
                        prenom,
                        email,
                        telephone
                    ),
                    logiciel:logiciel_id(
                        id,
                        nom,
                        logo,
                        editeur
                    )
                `)
                .eq('type', 'formation')
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

    // Récupérer une session par token (evaluation_token dans projects)
    const getSessionByToken = async (token) => {
        try {
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('projects')
                .select(`
                    *,
                    pdc:pdc_id(
                        id,
                        ref,
                        pdc_number,
                        duree_en_jour,
                        version_logiciel,
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
                        email,
                        avatar
                    ),
                    commercial:commercial_id(
                        id,
                        nom,
                        prenom,
                        email,
                        avatar
                    ),
                    entreprise:entreprise_id(
                        id,
                        nom,
                        adresse,
                        telephone,
                        email
                    ),
                    contact:contact_id(
                        id,
                        nom,
                        prenom,
                        email,
                        telephone
                    ),
                    logiciel:logiciel_id(
                        id,
                        nom,
                        logo,
                        editeur
                    )
                `)
                .eq('evaluation_token', token)
                .eq('type', 'formation')
                .single();

            if (fetchError) throw fetchError;

            // Récupérer TOUS les événements de formation (pas seulement le premier)
            if (data) {
                const { data: eventsData, error: eventsError } = await supabase
                    .from('evenement')
                    .select('lieu, adresse, date_debut, date_fin')
                    .eq('projet_id', data.id)
                    .eq('type_evenement', 'formation')
                    .order('date_debut', { ascending: true });

                // Ajouter le tableau des sessions à l'objet
                if (!eventsError && eventsData && eventsData.length > 0) {
                    data.sessions_evenements = eventsData;
                    // Garder aussi le premier pour compatibilité avec ancien code
                    data.lieu = eventsData[0].lieu;
                    data.adresse = eventsData[0].adresse;
                }
            }

            return data;
        } catch (err) {
            console.error('Erreur lors du chargement de la session:', err);
            setError(err.message);
            throw err;
        }
    };

    // Récupérer une session par ID (dans projects)
    const getSessionById = async (id) => {
        try {
            setError(null);
            const { data, error: fetchError} = await supabase
                .from('projects')
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
                        email,
                        avatar
                    ),
                    commercial:commercial_id(
                        id,
                        nom,
                        prenom,
                        email,
                        avatar
                    ),
                    entreprise:entreprise_id(
                        id,
                        nom,
                        adresse,
                        telephone,
                        email
                    ),
                    contact:contact_id(
                        id,
                        nom,
                        prenom,
                        email,
                        telephone
                    ),
                    logiciel:logiciel_id(
                        id,
                        nom,
                        logo,
                        editeur
                    )
                `)
                .eq('id', id)
                .eq('type', 'formation')
                .single();

            if (fetchError) throw fetchError;
            return data;
        } catch (err) {
            console.error('Erreur lors du chargement de la session:', err);
            setError(err.message);
            throw err;
        }
    };

    // Créer une nouvelle session (projet de type formation)
    const createSession = async (sessionData) => {
        try {
            setError(null);

            // Générer un token unique pour l'évaluation
            const evaluation_token = generateToken();

            // Nettoyer les champs UUID (convertir '' en null)
            const cleanedData = cleanUuidFields(sessionData);

            const { data, error: insertError } = await supabase
                .from('projects')
                .insert({
                    ...cleanedData,
                    type: 'formation',
                    evaluation_token
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

    // Mettre à jour une session (projet de formation)
    const updateSession = async (id, updates) => {
        try {
            setError(null);

            // Nettoyer les champs UUID (convertir '' en null)
            const cleanedUpdates = cleanUuidFields(updates);

            const { data, error: updateError } = await supabase
                .from('projects')
                .update(cleanedUpdates)
                .eq('id', id)
                .eq('type', 'formation')
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

    // Supprimer une session (projet de formation)
    const deleteSession = async (id) => {
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from('projects')
                .delete()
                .eq('id', id)
                .eq('type', 'formation');

            if (deleteError) throw deleteError;
            await fetchSessions();
        } catch (err) {
            console.error('Erreur lors de la suppression de la session:', err);
            setError(err.message);
            throw err;
        }
    };

    // Créer une formation avec ses sessions (événements)
    const createFormationWithSessions = async (formationData, sessionsList, createdBy) => {
        try {
            setError(null);

            // Générer un résumé textuel des sessions pour periode_souhaitee
            const periodeSummary = window.SessionUtils.generateSessionsSummary(sessionsList);

            // Générer un token unique pour l'évaluation
            const evaluation_token = generateToken();

            // Préparer les données du projet
            const projectData = {
                name: formationData.nom_formation,
                description: `Formation ${formationData.prj}`,
                entreprise_id: formationData.entreprise_id,
                contact_id: formationData.contact_id,
                commercial_id: formationData.commercial_id,
                status: 'active',
                type: 'formation',
                created_by: createdBy,
                // Champs spécifiques aux formations
                pdc_id: formationData.pdc_id,
                formateur_id: formationData.formateur_id,
                stagiaire_ids: formationData.stagiaire_ids || [],
                heures_formation: formationData.heures_formation,
                periode_souhaitee: periodeSummary,
                prj: formationData.prj,
                evaluation_token: evaluation_token
            };

            // Nettoyer les champs UUID (convertir '' en null)
            const cleanedProjectData = cleanUuidFields(projectData);

            // 1. Créer le projet de type formation avec toutes les données
            const { data: projet, error: projetError } = await supabase
                .from('projects')
                .insert(cleanedProjectData)
                .select()
                .single();

            if (projetError) throw projetError;

            // 2. Créer les événements pour chaque session
            const eventsToCreate = sessionsList.map((session, index) => {
                const { dateDebut, dateFin } = window.SessionUtils.sessionToEventDates(session);

                return {
                    titre: `${formationData.nom_formation} - Session ${index + 1}`,
                    description: formationData.prj,
                    date_debut: dateDebut,
                    date_fin: dateFin,
                    type_evenement: 'formation',
                    user_id: formationData.formateur_id,
                    client_user_id: formationData.stagiaire_ids || [],
                    projet_id: projet.id,
                    lieu: session.lieu || '',
                    adresse: session.adresse || '',
                    statut: 'planifie'
                };
            });

            const { error: eventsError } = await supabase
                .from('evenement')
                .insert(eventsToCreate);

            if (eventsError) throw eventsError;

            // 3. Rafraîchir la liste des sessions
            await fetchSessions();

            // 4. Retourner le projet créé (qui contient toutes les infos de formation)
            return projet;

        } catch (err) {
            console.error('Erreur lors de la création de la formation avec sessions:', err);
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
        createFormationWithSessions,
        updateSession,
        deleteSession,
        generateEvaluationUrl
    };
}

// Export global
window.useFormation = useFormation;
