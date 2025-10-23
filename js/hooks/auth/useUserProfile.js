// Hook personnalisé pour récupérer le profil utilisateur
function useUserProfile(userId) {
    const { useState, useEffect, useCallback } = React;
    const supabase = window.supabaseConfig.client;
    
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const fetchUserProfile = useCallback(async (id) => {
        if (!id) {
            setLoading(false);
            setProfile(null);
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            
            const { data, error: fetchError } = await supabase
                .from('user_profile')
                .select('*')
                .eq('id', id)
                .single();
            
            if (fetchError) {
                // Si l'utilisateur n'a pas de profil, ce n'est pas une erreur critique
                if (fetchError.code === 'PGRST116') {
                    console.log('Aucun profil trouvé pour cet utilisateur');
                    setProfile(null);
                } else {
                    throw fetchError;
                }
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error('Erreur lors du chargement du profil:', err);
            setError(err.message);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, []);
    
    // Fonction pour mettre à jour le profil utilisateur
    const updateProfile = useCallback(async (updatedData) => {
        if (!userId) return { success: false, error: 'ID utilisateur manquant' };
        
        try {
            setLoading(true);
            setError(null);
            
            const { data, error: updateError } = await supabase
                .from('user_profile')
                .upsert({ 
                    id: userId, 
                    ...updatedData,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (updateError) throw updateError;
            
            setProfile(data);
            return { success: true, data };
        } catch (err) {
            console.error('Erreur lors de la mise à jour du profil:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [userId]);
    
    // Fonction pour mettre à jour l'avatar
    const updateAvatar = useCallback(async (avatarUrl) => {
        if (!userId) return { success: false, error: 'ID utilisateur manquant' };
        
        try {
            setLoading(true);
            setError(null);
            
            // Vérifier d'abord si le profil existe
            const { data: existingProfile, error: checkError } = await supabase
                .from('user_profile')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }
            
            if (!existingProfile) {
                return { success: false, error: 'Profil utilisateur introuvable. Veuillez d\'abord renseigner vos informations personnelles.' };
            }
            
            // Mettre à jour uniquement l'avatar
            const { data, error: updateError } = await supabase
                .from('user_profile')
                .update({ 
                    avatar: avatarUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();
            
            if (updateError) throw updateError;
            
            setProfile(data);
            return { success: true, data };
        } catch (err) {
            console.error('Erreur lors de la mise à jour de l\'avatar:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchUserProfile(userId);
    }, [userId, fetchUserProfile]);
    
    return {
        profile,
        loading,
        error,
        refetch: () => fetchUserProfile(userId),
        updateProfile,
        updateAvatar,
        hasProfile: !!profile
    };
}

// Export global
window.useUserProfile = useUserProfile;