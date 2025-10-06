// Hook personnalisé pour les plans de cours
function usePdc() {
    const { useState, useEffect, useCallback } = React;
    const supabase = window.supabaseConfig.client;
    
    const [pdcs, setPdcs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [metiersPdc, setMetiersPdc] = useState([]);
    const [typesPdc, setTypesPdc] = useState([]);
    const [logiciels, setLogiciels] = useState([]);
    
    const fetchPdcs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const { data, error: fetchError } = await supabase
                .from('pdc')
                .select(`
                    *,
                    logiciel:logiciel_id(
                        nom,
                        logo
                    ),
                    metier_pdc:metier_pdc_id(
                        nom
                    ),
                    type_pdc:type_pdc_id(
                        nom
                    )
                `)
                .order('created_at', { ascending: false });
            
            if (fetchError) throw fetchError;
            setPdcs(data || []);
        } catch (err) {
            console.error('Erreur lors du chargement des plans de cours:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);
    
    const createPdc = async (pdc) => {
        try {
            setError(null);
            const { data, error: insertError } = await supabase
                .from('pdc')
                .insert(pdc)
                .select()
                .single();
            
            if (insertError) throw insertError;
            await fetchPdcs();
            return data;
        } catch (err) {
            console.error('Erreur lors de la création:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const updatePdc = async (id, updates) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('pdc')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (updateError) throw updateError;
            await fetchPdcs();
            return data;
        } catch (err) {
            console.error('Erreur lors de la mise à jour:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const deletePdc = async (id) => {
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from('pdc')
                .delete()
                .eq('id', id);
            
            if (deleteError) throw deleteError;
            await fetchPdcs();
        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const getPdcById = useCallback(async (id) => {
        try {
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('pdc')
                .select(`
                    *,
                    logiciel:logiciel_id(
                        id,
                        nom,
                        logo,
                        editeur,
                        description
                    ),
                    metier_pdc:metier_pdc_id(
                        id,
                        nom,
                        description
                    ),
                    type_pdc:type_pdc_id(
                        id,
                        nom,
                        description
                    )
                `)
                .eq('id', id)
                .single();
            
            if (fetchError) throw fetchError;
            return data;
        } catch (err) {
            console.error('Erreur lors du chargement du plan de cours:', err);
            setError(err.message);
            throw err;
        }
    }, []);
    
    const duplicatePdc = async (originalPdc) => {
        try {
            setError(null);
            
            // Extraire seulement les champs de la table pdc (pas les objets de relation)
            const { 
                id, 
                created_at, 
                updated_at, 
                logiciel, 
                type_pdc, 
                metier_pdc, 
                ...pdcData 
            } = originalPdc;
            
            // Générer un nouveau numéro PDC
            const newPdcNumber = (originalPdc.pdc_number || 0) + 1;
            const newRef = originalPdc.ref ? `${originalPdc.ref}-COPIE` : `PDC-COPIE-${Date.now()}`;
            
            const newPdcData = {
                ...pdcData,
                pdc_number: newPdcNumber,
                ref: newRef
            };
            
            const { data, error: insertError } = await supabase
                .from('pdc')
                .insert(newPdcData)
                .select()
                .single();
            
            if (insertError) throw insertError;
            await fetchPdcs();
            return data;
        } catch (err) {
            console.error('Erreur lors de la duplication:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const fetchMetiersPdc = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('metier_pdc')
                .select('id, nom')
                .order('nom', { ascending: true });
            
            if (fetchError) throw fetchError;
            setMetiersPdc(data || []);
        } catch (err) {
            console.error('Erreur lors du chargement des métiers PDC:', err);
        }
    }, []);
    
    const fetchTypesPdc = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('type_pdc')
                .select('id, nom, description')
                .order('nom', { ascending: true });
            
            if (fetchError) throw fetchError;
            setTypesPdc(data || []);
        } catch (err) {
            console.error('Erreur lors du chargement des types PDC:', err);
        }
    }, []);
    
    const fetchLogiciels = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('logiciel')
                .select('id, nom, editeur')
                .order('nom', { ascending: true });
            
            if (fetchError) throw fetchError;
            setLogiciels(data || []);
        } catch (err) {
            console.error('Erreur lors du chargement des logiciels:', err);
        }
    }, []);
    
    useEffect(() => {
        fetchPdcs();
        fetchMetiersPdc();
        fetchTypesPdc();
        fetchLogiciels();
    }, [fetchPdcs, fetchMetiersPdc, fetchTypesPdc, fetchLogiciels]);
    
    return {
        pdcs,
        loading,
        error,
        metiersPdc,
        typesPdc,
        logiciels,
        fetchPdcs,
        createPdc,
        updatePdc,
        deletePdc,
        getPdcById,
        duplicatePdc,
        fetchMetiersPdc,
        fetchTypesPdc,
        fetchLogiciels
    };
}

// Export global
window.usePdc = usePdc;