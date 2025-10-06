function useUserPlanning(userId) {
    const [evenements, setEvenements] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    
    const fetchEvenements = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const { data, error } = await supabase
                .from('evenement')
                .select('*')
                .eq('user_id', userId)
                .order('date_debut', { ascending: true });
                
            if (error) throw error;
            
            setEvenements(data || []);
        } catch (err) {
            console.error('Erreur lors du chargement des événements:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const addEvenement = async (evenementData) => {
        try {
            const { data, error } = await supabase
                .from('evenement')
                .insert([{
                    ...evenementData,
                    user_id: userId
                }])
                .select()
                .single();
                
            if (error) throw error;
            
            setEvenements(prev => [...prev, data]);
            return data;
        } catch (err) {
            console.error('Erreur lors de l\'ajout de l\'événement:', err);
            throw err;
        }
    };
    
    const updateEvenement = async (id, evenementData) => {
        try {
            const { data, error } = await supabase
                .from('evenement')
                .update(evenementData)
                .eq('id', id)
                .select()
                .single();
                
            if (error) throw error;
            
            setEvenements(prev => prev.map(e => e.id === id ? data : e));
            return data;
        } catch (err) {
            console.error('Erreur lors de la mise à jour de l\'événement:', err);
            throw err;
        }
    };
    
    const deleteEvenement = async (id) => {
        try {
            const { error } = await supabase
                .from('evenement')
                .delete()
                .eq('id', id);
                
            if (error) throw error;
            
            setEvenements(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error('Erreur lors de la suppression de l\'événement:', err);
            throw err;
        }
    };
    
    const getEventsForDateRange = (startDate, endDate) => {
        return evenements.filter(event => {
            if (!event.date_debut || !event.date_fin) return false;
            
            // Utiliser les fonctions utilitaires centralisées pour éviter les problèmes de timezone
            if (window.DateUtils) {
                // Extraire les parties date seulement pour comparaison
                const eventStartDate = event.date_debut.split('T')[0];
                const eventEndDate = event.date_fin.split('T')[0];
                const startDateStr = startDate.toISOString().split('T')[0];
                const endDateStr = endDate.toISOString().split('T')[0];
                
                // Vérifier si les plages se chevauchent
                return eventStartDate <= endDateStr && eventEndDate >= startDateStr;
            } else {
                // Fallback si DateUtils n'est pas disponible
                const eventStart = new Date(event.date_debut);
                const eventEnd = new Date(event.date_fin);
                return eventStart <= endDate && eventEnd >= startDate;
            }
        });
    };
    
    const getEventsForDate = (date) => {
        // Utiliser les fonctions utilitaires centralisées pour éviter les problèmes de timezone
        if (window.DateUtils) {
            return window.DateUtils.getEventsForDate(evenements, date);
        } else {
            // Fallback si DateUtils n'est pas disponible
            const dateStr = date.toISOString().split('T')[0];
            return evenements.filter(event => {
                if (!event.date_debut || !event.date_fin) return false;
                
                // Extraire seulement les parties date (sans heure) pour éviter les conversions UTC
                const eventStart = event.date_debut.split('T')[0];
                const eventEnd = event.date_fin.split('T')[0];
                return dateStr >= eventStart && dateStr <= eventEnd;
            });
        }
    };
    
    React.useEffect(() => {
        if (userId) {
            fetchEvenements();
        }
    }, [userId]);
    
    return {
        evenements,
        loading,
        error,
        addEvenement,
        updateEvenement,
        deleteEvenement,
        refreshEvenements: fetchEvenements,
        getEventsForDateRange,
        getEventsForDate
    };
}

window.useUserPlanning = useUserPlanning;