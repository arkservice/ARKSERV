// Hook personnalisé pour l'authentification Supabase
function useAuth() {
    const { useState, useEffect, useCallback } = React;
    const supabase = window.supabaseConfig.client;
    
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Fonction de connexion
    const signIn = async (email, password) => {
        try {
            setLoading(true);
            setError(null);
            
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (signInError) throw signInError;
            
            return { success: true, data };
        } catch (err) {
            console.error('Erreur de connexion:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };
    
    // Fonction de déconnexion
    const signOut = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const { error: signOutError } = await supabase.auth.signOut();
            
            if (signOutError) throw signOutError;
            
            return { success: true };
        } catch (err) {
            console.error('Erreur de déconnexion:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };
    
    // Fonction de changement de mot de passe
    const updatePassword = async (newPassword) => {
        try {
            setLoading(true);
            setError(null);
            
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });
            
            if (updateError) throw updateError;
            
            return { success: true };
        } catch (err) {
            console.error('Erreur lors du changement de mot de passe:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };
    
    // Vérifier la session actuelle
    const checkSession = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);
        } catch (err) {
            console.error('Erreur lors de la vérification de la session:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);
    
    // Écouter les changements d'état d'authentification
    useEffect(() => {
        // Vérifier la session initiale
        checkSession();
        
        // Écouter les changements d'état
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                // Log seulement les événements importants (exclure INITIAL_SESSION)
                if (event !== 'INITIAL_SESSION') {
                    console.log('Auth event:', event, session);
                }
                
                setSession(session);
                setUser(session?.user ?? null);
                
                if (event === 'SIGNED_IN') {
                    setError(null);
                } else if (event === 'SIGNED_OUT') {
                    setError(null);
                } else if (event === 'TOKEN_REFRESHED') {
                    console.log('Token refreshed');
                }
                
                setLoading(false);
            }
        );
        
        // Cleanup subscription
        return () => {
            subscription.unsubscribe();
        };
    }, [checkSession]);
    
    return {
        user,
        session,
        loading,
        error,
        signIn,
        signOut,
        updatePassword,
        isAuthenticated: !!session,
        checkSession
    };
}

// Export global
window.useAuth = useAuth;