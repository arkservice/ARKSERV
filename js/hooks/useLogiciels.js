// Hook personnalisé pour les logiciels avec temps réel et cache
function useLogiciels() {
    const { useState, useEffect, useCallback, useRef } = React;
    const supabase = window.supabaseConfig.client;
    // TEMPORAIRE: Désactivation du temps réel pour résoudre l'erreur 529
    // const { createChannel, removeChannel } = window.useRealtime();
    
    const [logiciels, setLogiciels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Cache pour éviter les requêtes redondantes
    const cacheRef = useRef({ data: null, timestamp: null, ttl: 30000 });
    
    const fetchLogiciels = useCallback(async (forceRefresh = false) => {
        try {
            // Vérifier le cache d'abord
            const now = Date.now();
            const cache = cacheRef.current;
            
            if (!forceRefresh && cache.data && cache.timestamp && (now - cache.timestamp) < cache.ttl) {
                setLogiciels(cache.data);
                setLoading(false);
                return;
            }
            
            setLoading(true);
            setError(null);
            
            const { data, error: fetchError } = await supabase
                .from('logiciel')
                .select('*')
                .order('nom', { ascending: true });
            
            if (fetchError) throw fetchError;
            
            // Mettre à jour le cache
            cacheRef.current = {
                data: data || [],
                timestamp: now,
                ttl: 30000
            };
            
            setLogiciels(data || []);
        } catch (err) {
            console.error('Erreur lors du chargement des logiciels:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);
    
    // TEMPORAIRE: Fonction pour gérer les mises à jour temps réel (désactivée)
    /*
    const handleRealtimeChange = useCallback((payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        setLogiciels(current => {
            let updated;
            switch (eventType) {
                case 'INSERT':
                    // Ajouter le nouveau logiciel s'il n'existe pas déjà
                    if (!current.find(l => l.id === newRecord.id)) {
                        updated = [...current, newRecord];
                    } else {
                        updated = current;
                    }
                    break;
                    
                case 'UPDATE':
                    // Mettre à jour le logiciel existant
                    updated = current.map(l => 
                        l.id === newRecord.id ? newRecord : l
                    );
                    break;
                    
                case 'DELETE':
                    // Supprimer le logiciel
                    updated = current.filter(l => l.id !== oldRecord.id);
                    break;
                    
                default:
                    updated = current;
            }
            
            // Trier par ordre alphabétique après chaque modification
            return updated.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
        });
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
            await fetchLogiciels(true);
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
            await fetchLogiciels(true);
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
            await fetchLogiciels(true);
        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            setError(err.message);
            throw err;
        }
    };
    
    useEffect(() => {
        fetchLogiciels();
    }, [fetchLogiciels]);
    
    // TEMPORAIRE: Configuration du temps réel (désactivée)
    /*
    useEffect(() => {
        // Créer le channel de subscription pour la table logiciel
        const channel = createChannel(
            'logiciels-changes',
            'logiciel',
            ['INSERT', 'UPDATE', 'DELETE'],
            handleRealtimeChange
        );
        
        // Nettoyage à la destruction du component
        return () => {
            if (channel) {
                removeChannel('logiciels-changes');
            }
        };
    }, [createChannel, removeChannel, handleRealtimeChange]);
    */
    
    return { logiciels, loading, error, createLogiciel, updateLogiciel, deleteLogiciel, refetch: fetchLogiciels };
}

// Export global
window.useLogiciels = useLogiciels;