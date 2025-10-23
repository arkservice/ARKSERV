// Hook personnalisé pour les agences Arkance
function useAgences() {
    const { useState, useEffect, useCallback } = React;
    const supabase = window.supabaseConfig.client;

    const [agences, setAgences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Récupérer toutes les agences
    const fetchAgences = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('agence')
                .select('*')
                .order('nom', { ascending: true });

            if (fetchError) throw fetchError;
            setAgences(data || []);
        } catch (err) {
            console.error('Erreur lors du chargement des agences:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Créer une nouvelle agence
    const createAgence = async (agenceData) => {
        try {
            setError(null);
            const { data, error: insertError } = await supabase
                .from('agence')
                .insert(agenceData)
                .select()
                .single();

            if (insertError) throw insertError;

            // Émettre un événement pour rafraîchir les autres composants
            if (window.EventBus && window.EventBusEvents) {
                window.EventBus.emit(window.EventBusEvents.AGENCE_CREATED, {
                    agenceId: data.id,
                    agence: data,
                    timestamp: new Date().toISOString()
                });
            }

            await fetchAgences();
            return data;
        } catch (err) {
            console.error('Erreur lors de la création de l\'agence:', err);
            setError(err.message);
            throw err;
        }
    };

    // Mettre à jour une agence
    const updateAgence = async (id, updates) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('agence')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Émettre un événement pour rafraîchir les autres composants
            if (window.EventBus && window.EventBusEvents) {
                window.EventBus.emit(window.EventBusEvents.AGENCE_UPDATED, {
                    agenceId: id,
                    agence: data,
                    timestamp: new Date().toISOString()
                });
            }

            await fetchAgences();
            return data;
        } catch (err) {
            console.error('Erreur lors de la mise à jour de l\'agence:', err);
            setError(err.message);
            throw err;
        }
    };

    // Supprimer une agence
    const deleteAgence = async (id) => {
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from('agence')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            // Émettre un événement pour rafraîchir les autres composants
            if (window.EventBus && window.EventBusEvents) {
                window.EventBus.emit(window.EventBusEvents.AGENCE_DELETED, {
                    agenceId: id,
                    timestamp: new Date().toISOString()
                });
            }

            await fetchAgences();
        } catch (err) {
            console.error('Erreur lors de la suppression de l\'agence:', err);
            setError(err.message);
            throw err;
        }
    };

    // Écouter les événements EventBus pour rafraîchir automatiquement
    useEffect(() => {
        if (!window.EventBus || !window.EventBusEvents) return;

        const handleAgenceEvent = () => {
            fetchAgences();
        };

        window.EventBus.on(window.EventBusEvents.AGENCE_CREATED, handleAgenceEvent);
        window.EventBus.on(window.EventBusEvents.AGENCE_UPDATED, handleAgenceEvent);
        window.EventBus.on(window.EventBusEvents.AGENCE_DELETED, handleAgenceEvent);

        return () => {
            window.EventBus.off(window.EventBusEvents.AGENCE_CREATED, handleAgenceEvent);
            window.EventBus.off(window.EventBusEvents.AGENCE_UPDATED, handleAgenceEvent);
            window.EventBus.off(window.EventBusEvents.AGENCE_DELETED, handleAgenceEvent);
        };
    }, [fetchAgences]);

    // Charger les agences au montage
    useEffect(() => {
        fetchAgences();
    }, [fetchAgences]);

    return {
        agences,
        loading,
        error,
        fetchAgences,
        createAgence,
        updateAgence,
        deleteAgence
    };
}

// Export global
window.useAgences = useAgences;
