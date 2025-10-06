function useAllPlanning() {
    const [events, setEvents] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    
    const fetchAllEvents = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const { data, error } = await supabase
                .from('evenement')
                .select(`
                    *,
                    user_profile:user_id(id, prenom, nom, role)
                `)
                .order('date_debut', { ascending: true });
                
            if (error) throw error;
            
            setEvents(data || []);
        } catch (err) {
            console.error('Erreur lors du chargement de tous les événements:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const addEvent = async (eventData) => {
        try {
            const { data, error } = await supabase
                .from('evenement')
                .insert([eventData])
                .select(`
                    *,
                    user_profile:user_id(id, prenom, nom, role)
                `)
                .single();
                
            if (error) throw error;
            
            setEvents(prev => [...prev, data]);
            return data;
        } catch (err) {
            console.error('Erreur lors de l\'ajout de l\'événement:', err);
            throw err;
        }
    };
    
    const updateEvent = async (id, eventData) => {
        try {
            const { data, error } = await supabase
                .from('evenement')
                .update(eventData)
                .eq('id', id)
                .select(`
                    *,
                    user_profile:user_id(id, prenom, nom, role)
                `)
                .single();
                
            if (error) throw error;
            
            setEvents(prev => prev.map(e => e.id === id ? data : e));
            return data;
        } catch (err) {
            console.error('Erreur lors de la mise à jour de l\'événement:', err);
            throw err;
        }
    };
    
    const deleteEvent = async (id) => {
        try {
            const { error } = await supabase
                .from('evenement')
                .delete()
                .eq('id', id);
                
            if (error) throw error;
            
            setEvents(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error('Erreur lors de la suppression de l\'événement:', err);
            throw err;
        }
    };
    
    const getEventsForDateRange = (startDate, endDate) => {
        return events.filter(event => {
            const eventStart = new Date(event.date_debut);
            const eventEnd = new Date(event.date_fin);
            return eventStart <= endDate && eventEnd >= startDate;
        });
    };
    
    const getEventsForDate = (date) => {
        // Utiliser les fonctions utilitaires centralisées pour éviter les problèmes de fuseaux horaires
        return window.DateUtils ? window.DateUtils.getEventsForDate(events, date) : [];
    };
    
    React.useEffect(() => {
        fetchAllEvents();
    }, []);
    
    return {
        events,
        loading,
        error,
        addEvent,
        updateEvent,
        deleteEvent,
        refreshEvents: fetchAllEvents,
        getEventsForDateRange,
        getEventsForDate
    };
}

window.useAllPlanning = useAllPlanning;