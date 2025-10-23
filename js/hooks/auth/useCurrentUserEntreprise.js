// Hook personnalisé pour récupérer les informations d'entreprise de l'utilisateur connecté
function useCurrentUserEntreprise() {
    const { useState, useEffect, useCallback } = React;
    const supabase = window.supabaseConfig.client;
    const auth = window.useAuth();
    
    const [entreprise, setEntreprise] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const fetchCurrentUserEntreprise = useCallback(async (userId) => {
        if (!userId) {
            setLoading(false);
            setEntreprise(null);
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            
            const { data, error: fetchError } = await supabase
                .from('user_profile')
                .select(`
                    entreprise_id,
                    entreprise:entreprise_id(
                        id,
                        nom,
                        type_entreprise
                    )
                `)
                .eq('id', userId)
                .single();
            
            if (fetchError) {
                // Si l'utilisateur n'a pas de profil, ce n'est pas une erreur critique
                if (fetchError.code === 'PGRST116') {
                    console.log('Aucun profil trouvé pour cet utilisateur');
                    setEntreprise(null);
                } else {
                    throw fetchError;
                }
            } else {
                setEntreprise(data?.entreprise || null);
            }
        } catch (err) {
            console.error('Erreur lors du chargement de l\'entreprise utilisateur:', err);
            setError(err.message);
            setEntreprise(null);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchCurrentUserEntreprise(auth.user?.id);
    }, [auth.user?.id, fetchCurrentUserEntreprise]);
    
    // Helper functions pour faciliter l'usage
    const isArkanceUser = () => {
        return entreprise?.type_entreprise === 'interne';
    };
    
    const isClientUser = () => {
        return entreprise?.type_entreprise === 'client';
    };
    
    const getEntrepriseType = () => {
        return entreprise?.type_entreprise || null;
    };
    
    return {
        entreprise,
        loading,
        error,
        isArkanceUser: isArkanceUser(),
        isClientUser: isClientUser(),
        entrepriseType: getEntrepriseType(),
        refetch: () => fetchCurrentUserEntreprise(auth.user?.id)
    };
}

// Export global
window.useCurrentUserEntreprise = useCurrentUserEntreprise;