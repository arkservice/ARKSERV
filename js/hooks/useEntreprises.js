// Hook personnalisé pour les entreprises - Optimized with cache
function useEntreprises() {
    const { useState, useEffect, useCallback, useRef } = React;
    const supabase = window.supabaseConfig.client;
    
    const [entreprises, setEntreprises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Cache pour éviter les requêtes redondantes
    const cacheRef = useRef({ data: null, timestamp: null, ttl: 120000 }); // Cache 2 minutes
    
    const fetchEntreprises = useCallback(async (forceRefresh = false) => {
        try {
            // Vérifier le cache avant de faire une requête
            const now = Date.now();
            const cache = cacheRef.current;
            
            if (!forceRefresh && cache.data && cache.timestamp && (now - cache.timestamp) < cache.ttl) {
                // Utiliser les données du cache
                setEntreprises(cache.data);
                setLoading(false);
                return;
            }
            
            setLoading(true);
            setError(null);
            
            const { data, error: fetchError } = await supabase
                .from('entreprise')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (fetchError) throw fetchError;
            
            // Mettre à jour le cache
            cacheRef.current = {
                data: data || [],
                timestamp: now,
                ttl: 120000
            };
            
            setEntreprises(data || []);
        } catch (err) {
            console.error('Erreur lors du chargement des entreprises:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);
    
    const createEntreprise = async (entreprise) => {
        try {
            setError(null);
            const { data, error: insertError } = await supabase
                .from('entreprise')
                .insert(entreprise)
                .select()
                .single();
            
            if (insertError) throw insertError;
            // Invalider le cache et recharger
            cacheRef.current.timestamp = null;
            await fetchEntreprises(true);
            return data;
        } catch (err) {
            console.error('Erreur lors de la création:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const updateEntreprise = async (id, updates) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('entreprise')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (updateError) throw updateError;
            // Invalider le cache et recharger
            cacheRef.current.timestamp = null;
            await fetchEntreprises(true);
            return data;
        } catch (err) {
            console.error('Erreur lors de la mise à jour:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const deleteEntreprise = async (id) => {
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from('entreprise')
                .delete()
                .eq('id', id);
            
            if (deleteError) throw deleteError;
            await fetchEntreprises();
        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            setError(err.message);
            throw err;
        }
    };
    
    useEffect(() => {
        fetchEntreprises();
    }, [fetchEntreprises]);
    
    return { entreprises, loading, error, createEntreprise, updateEntreprise, deleteEntreprise, refetch: fetchEntreprises };
}

// Export global
window.useEntreprises = useEntreprises;