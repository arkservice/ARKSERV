// Hook personnalisé pour la gestion des compétences utilisateur
function useUserCompetences(userId = null) {
    const { useState, useEffect, useCallback } = React;
    const supabase = window.supabaseConfig.client;
    
    const [competences, setCompetences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const fetchCompetences = useCallback(async () => {
        if (!userId) {
            setCompetences([]);
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            
            const { data, error: fetchError } = await supabase
                .from('user_competence')
                .select(`
                    *,
                    logiciel:logiciel_id(
                        id,
                        nom,
                        editeur,
                        logo
                    ),
                    evaluateur:evaluateur_id(
                        id,
                        prenom,
                        nom
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (fetchError) throw fetchError;
            setCompetences(data || []);
        } catch (err) {
            console.error('Erreur lors du chargement des compétences:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);
    
    const createCompetence = async (competenceData) => {
        try {
            setError(null);
            
            // Récupérer l'utilisateur connecté pour l'évaluateur
            const { data: { user } } = await supabase.auth.getUser();
            const currentUserId = user?.id;
            
            const { data, error: insertError } = await supabase
                .from('user_competence')
                .insert({
                    ...competenceData,
                    user_id: userId,
                    evaluateur_id: currentUserId // Automatiquement l'utilisateur connecté
                })
                .select(`
                    *,
                    logiciel:logiciel_id(
                        id,
                        nom,
                        editeur,
                        logo
                    ),
                    evaluateur:evaluateur_id(
                        id,
                        prenom,
                        nom
                    )
                `)
                .single();
            
            if (insertError) throw insertError;
            await fetchCompetences();
            return data;
        } catch (err) {
            console.error('Erreur lors de la création de la compétence:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const updateCompetence = async (id, updates) => {
        try {
            setError(null);
            
            // Récupérer l'utilisateur connecté pour l'évaluateur
            const { data: { user } } = await supabase.auth.getUser();
            const currentUserId = user?.id;
            
            const { data, error: updateError } = await supabase
                .from('user_competence')
                .update({
                    ...updates,
                    evaluateur_id: currentUserId // Automatiquement l'utilisateur connecté
                })
                .eq('id', id)
                .select(`
                    *,
                    logiciel:logiciel_id(
                        id,
                        nom,
                        editeur,
                        logo
                    ),
                    evaluateur:evaluateur_id(
                        id,
                        prenom,
                        nom
                    )
                `)
                .single();
            
            if (updateError) throw updateError;
            await fetchCompetences();
            return data;
        } catch (err) {
            console.error('Erreur lors de la mise à jour de la compétence:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const deleteCompetence = async (id) => {
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from('user_competence')
                .delete()
                .eq('id', id);
            
            if (deleteError) throw deleteError;
            await fetchCompetences();
        } catch (err) {
            console.error('Erreur lors de la suppression de la compétence:', err);
            setError(err.message);
            throw err;
        }
    };
    
    const getCompetenceById = async (id) => {
        try {
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('user_competence')
                .select(`
                    *,
                    logiciel:logiciel_id(
                        id,
                        nom,
                        editeur,
                        logo
                    ),
                    evaluateur:evaluateur_id(
                        id,
                        prenom,
                        nom
                    )
                `)
                .eq('id', id)
                .single();
            
            if (fetchError) throw fetchError;
            return data;
        } catch (err) {
            console.error('Erreur lors du chargement de la compétence:', err);
            setError(err.message);
            throw err;
        }
    };
    
    // Fonction utilitaire pour obtenir le label du niveau
    const getNiveauLabel = (niveau) => {
        const labels = {
            1: 'Débutant',
            2: 'Initié', 
            3: 'Intermédiaire',
            4: 'Avancé',
            5: 'Expert'
        };
        return labels[niveau] || 'Non défini';
    };
    
    // Fonction utilitaire pour obtenir la couleur du niveau
    const getNiveauColor = (niveau) => {
        const colors = {
            1: 'bg-red-100 text-red-800',
            2: 'bg-orange-100 text-orange-800',
            3: 'bg-yellow-100 text-yellow-800', 
            4: 'bg-blue-100 text-blue-800',
            5: 'bg-green-100 text-green-800'
        };
        return colors[niveau] || 'bg-gray-100 text-gray-800';
    };
    
    useEffect(() => {
        fetchCompetences();
    }, [fetchCompetences]);
    
    return { 
        competences, 
        loading, 
        error, 
        createCompetence, 
        updateCompetence, 
        deleteCompetence,
        getCompetenceById,
        getNiveauLabel,
        getNiveauColor,
        refetch: fetchCompetences 
    };
}

// Export global
window.useUserCompetences = useUserCompetences;