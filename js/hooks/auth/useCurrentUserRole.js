// Hook personnalisé pour récupérer le rôle de l'utilisateur connecté
function useCurrentUserRole() {
    const { useState, useEffect, useCallback } = React;
    const supabase = window.supabaseConfig.client;
    const auth = window.useAuth();
    
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const fetchCurrentUserRole = useCallback(async (userId) => {
        if (!userId) {
            setLoading(false);
            setRole(null);
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            
            const { data, error: fetchError } = await supabase
                .from('user_profile')
                .select('role')
                .eq('id', userId)
                .single();
            
            if (fetchError) {
                // Si l'utilisateur n'a pas de profil, ce n'est pas une erreur critique
                if (fetchError.code === 'PGRST116') {
                    console.log('Aucun profil trouvé pour cet utilisateur');
                    setRole('Utilisateur'); // Rôle par défaut
                } else {
                    throw fetchError;
                }
            } else {
                setRole(data?.role || 'Utilisateur');
            }
        } catch (err) {
            console.error('Erreur lors du chargement du rôle utilisateur:', err);
            setError(err.message);
            setRole('Utilisateur'); // Rôle par défaut en cas d'erreur
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchCurrentUserRole(auth.user?.id);
    }, [auth.user?.id, fetchCurrentUserRole]);
    
    // Helper functions pour faciliter l'usage
    const isUserRole = () => {
        return role === 'Utilisateur';
    };
    
    const isManagerRole = () => {
        return role === 'Manager';
    };
    
    const isAdminRole = () => {
        return role === 'Admin';
    };
    
    const isManagerOrAdmin = () => {
        return role === 'Manager' || role === 'Admin';
    };
    
    return {
        role,
        loading,
        error,
        isUserRole: isUserRole(),
        isManagerRole: isManagerRole(),
        isAdminRole: isAdminRole(),
        isManagerOrAdmin: isManagerOrAdmin(),
        refetch: () => fetchCurrentUserRole(auth.user?.id)
    };
}

// Export global
window.useCurrentUserRole = useCurrentUserRole;