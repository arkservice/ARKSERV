// Hook optimisé pour les logiciels avec leurs utilisateurs compétents
function useLogicielsWithCompetences() {
    const { useState, useEffect, useCallback } = React;
    const supabase = window.supabaseConfig.client;
    // TEMPORAIRE: Désactivation du temps réel pour résoudre l'erreur 529
    // const { createChannel, removeChannel } = window.useRealtime();
    
    const [logiciels, setLogiciels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const fetchLogicielsWithCompetences = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Récupération des logiciels avec leurs utilisateurs compétents en une seule requête
            const { data: logicielsData, error: logicielsError } = await supabase
                .from('logiciel')
                .select('*')
                .order('nom', { ascending: true });
            
            if (logicielsError) throw logicielsError;
            
            // Récupération de toutes les compétences avec les profils utilisateurs
            const { data: competencesData, error: competencesError } = await supabase
                .from('user_competence')
                .select(`
                    id,
                    logiciel_id,
                    niveau,
                    user_profile:user_id (
                        id,
                        prenom,
                        nom,
                        avatar
                    )
                `)
                .order('niveau', { ascending: false });
            
            if (competencesError) throw competencesError;
            
            // Association des compétences aux logiciels
            const logicielsWithCompetences = logicielsData.map(logiciel => {
                const competences = competencesData.filter(comp => comp.logiciel_id === logiciel.id);
                return {
                    ...logiciel,
                    utilisateurs_competents: competences || []
                };
            });
            
            setLogiciels(logicielsWithCompetences);
        } catch (err) {
            console.error('Erreur lors du chargement des logiciels avec compétences:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [supabase]);
    
    // TEMPORAIRE: Fonction pour gérer les mises à jour temps réel des logiciels (désactivée)
    /*
    const handleLogicielsRealtimeChange = useCallback((payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        setLogiciels(current => {
            let updated;
            switch (eventType) {
                case 'INSERT':
                    if (!current.find(l => l.id === newRecord.id)) {
                        updated = [...current, { ...newRecord, utilisateurs_competents: [] }];
                    } else {
                        updated = current;
                    }
                    break;
                    
                case 'UPDATE':
                    updated = current.map(l => 
                        l.id === newRecord.id ? { ...newRecord, utilisateurs_competents: l.utilisateurs_competents } : l
                    );
                    break;
                    
                case 'DELETE':
                    updated = current.filter(l => l.id !== oldRecord.id);
                    break;
                    
                default:
                    updated = current;
            }
            
            return updated.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
        });
    }, []);
    */
    
    // TEMPORAIRE: Fonction pour gérer les mises à jour temps réel des compétences (désactivée)
    /*
    const handleCompetencesRealtimeChange = useCallback((payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        setLogiciels(current => {
            return current.map(logiciel => {
                let updatedCompetences = [...logiciel.utilisateurs_competents];
                
                switch (eventType) {
                    case 'INSERT':
                        if (newRecord.logiciel_id === logiciel.id) {
                            // Récupérer les infos utilisateur pour la nouvelle compétence
                            // Note: Le user_profile sera mis à jour par une requête séparée si nécessaire
                            updatedCompetences.push(newRecord);
                        }
                        break;
                        
                    case 'UPDATE':
                        if (newRecord.logiciel_id === logiciel.id) {
                            updatedCompetences = updatedCompetences.map(comp =>
                                comp.id === newRecord.id ? newRecord : comp
                            );
                        } else if (oldRecord.logiciel_id === logiciel.id) {
                            // La compétence a été déplacée vers un autre logiciel
                            updatedCompetences = updatedCompetences.filter(comp => comp.id !== oldRecord.id);
                        }
                        break;
                        
                    case 'DELETE':
                        if (oldRecord.logiciel_id === logiciel.id) {
                            updatedCompetences = updatedCompetences.filter(comp => comp.id !== oldRecord.id);
                        }
                        break;
                }
                
                // Trier les compétences par niveau décroissant
                updatedCompetences.sort((a, b) => (b.niveau || 0) - (a.niveau || 0));
                
                return {
                    ...logiciel,
                    utilisateurs_competents: updatedCompetences
                };
            });
        });
    }, []);
    */
    
    // TEMPORAIRE: Fonction pour gérer les mises à jour temps réel des profils utilisateurs (désactivée)
    /*
    const handleUserProfileRealtimeChange = useCallback((payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        if (eventType === 'UPDATE') {
            setLogiciels(current => {
                return current.map(logiciel => ({
                    ...logiciel,
                    utilisateurs_competents: logiciel.utilisateurs_competents.map(comp =>
                        comp.user_profile?.id === newRecord.id
                            ? { ...comp, user_profile: newRecord }
                            : comp
                    )
                }));
            });
        }
    }, []);
    */
    
    const createLogiciel = async (logiciel) => {
        try {
            setError(null);
            const { data, error: insertError } = await supabase
                .from('logiciel')
                .insert(logiciel)
                .select()
                .single();
            
            if (insertError) throw insertError;
            // TEMPORAIRE: Rafraîchir manuellement (temps réel désactivé)
            await fetchLogicielsWithCompetences();
            return data;
        } catch (err) {
            console.error('Erreur lors de la création:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const updateLogiciel = async (id, updates) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('logiciel')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (updateError) throw updateError;
            // TEMPORAIRE: Rafraîchir manuellement (temps réel désactivé)
            await fetchLogicielsWithCompetences();
            return data;
        } catch (err) {
            console.error('Erreur lors de la mise à jour:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const deleteLogiciel = async (id) => {
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from('logiciel')
                .delete()
                .eq('id', id);
            
            if (deleteError) throw deleteError;
            // TEMPORAIRE: Rafraîchir manuellement (temps réel désactivé)
            await fetchLogicielsWithCompetences();
        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            setError(err.message);
            throw err;
        }
    };
    
    // Chargement initial
    useEffect(() => {
        fetchLogicielsWithCompetences();
    }, [fetchLogicielsWithCompetences]);
    
    // TEMPORAIRE: Configuration du temps réel (désactivée)
    /*
    // Configuration du temps réel pour les logiciels
    useEffect(() => {
        const logicielsChannel = createChannel(
            'logiciels-changes',
            'logiciel',
            ['INSERT', 'UPDATE', 'DELETE'],
            handleLogicielsRealtimeChange
        );
        
        return () => {
            if (logicielsChannel) {
                removeChannel('logiciels-changes');
            }
        };
    }, [createChannel, removeChannel, handleLogicielsRealtimeChange]);
    
    // Configuration du temps réel pour les compétences
    useEffect(() => {
        const competencesChannel = createChannel(
            'competences-changes',
            'user_competence',
            ['INSERT', 'UPDATE', 'DELETE'],
            handleCompetencesRealtimeChange
        );
        
        return () => {
            if (competencesChannel) {
                removeChannel('competences-changes');
            }
        };
    }, [createChannel, removeChannel, handleCompetencesRealtimeChange]);
    
    // Configuration du temps réel pour les profils utilisateurs
    useEffect(() => {
        const userProfileChannel = createChannel(
            'user-profiles-changes',
            'user_profile',
            ['UPDATE'],
            handleUserProfileRealtimeChange
        );
        
        return () => {
            if (userProfileChannel) {
                removeChannel('user-profiles-changes');
            }
        };
    }, [createChannel, removeChannel, handleUserProfileRealtimeChange]);
    */
    
    return { 
        logiciels, 
        loading, 
        error, 
        createLogiciel, 
        updateLogiciel, 
        deleteLogiciel, 
        refetch: fetchLogicielsWithCompetences 
    };
}

// Export global
window.useLogicielsWithCompetences = useLogicielsWithCompetences;