function useArkanceUsers() {
    const [users, setUsers] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const { createChannel, removeChannel } = window.useRealtime();
    
    const fetchArkanceUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const { data, error } = await supabase
                .from('user_profile')
                .select(`
                    id,
                    prenom,
                    nom,
                    email,
                    telephone,
                    role,
                    avatar,
                    created_at,
                    updated_at,
                    entreprise:entreprise_id(id, nom, type_entreprise),
                    service:service_id(id, nom),
                    fonction:fonction_id(id, nom)
                `)
                .eq('entreprise.type_entreprise', 'interne')
                .order('prenom', { ascending: true });
                
            if (error) throw error;
            
            // Filtrer les utilisateurs qui ont une entreprise de type 'interne'
            const arkanceUsers = (data || []).filter(user => 
                user.entreprise && user.entreprise.type_entreprise === 'interne'
            );
            
            setUsers(arkanceUsers);
        } catch (err) {
            console.error('Erreur lors du chargement des utilisateurs ARKANCE:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const getUserById = (userId) => {
        return users.find(user => user.id === userId);
    };
    
    const getUserDisplayName = (user) => {
        if (!user) return 'Utilisateur inconnu';
        const fullName = `${user.prenom || ''} ${user.nom || ''}`.trim();
        return fullName || 'Sans nom';
    };
    
    const getUserInitials = (user) => {
        if (!user) return '??';
        if (user.prenom && user.nom) {
            return `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
        } else if (user.prenom) {
            return user.prenom.substring(0, 2).toUpperCase();
        } else if (user.nom) {
            return user.nom.substring(0, 2).toUpperCase();
        }
        return 'U';
    };
    
    // Handler pour les événements realtime
    const handleRealtimeEvent = React.useCallback(async (payload) => {
        console.log('Realtime event in useArkanceUsers:', payload);
        
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        try {
            if (eventType === 'INSERT' && newRecord) {
                // Récupérer les données complètes avec les relations
                const { data, error } = await supabase
                    .from('user_profile')
                    .select(`
                        id,
                        prenom,
                        nom,
                        email,
                        telephone,
                        role,
                        avatar,
                        created_at,
                        updated_at,
                        entreprise:entreprise_id(id, nom, type_entreprise),
                        service:service_id(id, nom),
                        fonction:fonction_id(id, nom)
                    `)
                    .eq('id', newRecord.id)
                    .single();
                
                if (!error && data && data.entreprise && data.entreprise.type_entreprise === 'interne') {
                    setUsers(prevUsers => [...prevUsers, data].sort((a, b) => a.prenom.localeCompare(b.prenom)));
                }
            } else if (eventType === 'UPDATE' && newRecord) {
                // Récupérer les données complètes avec les relations
                const { data, error } = await supabase
                    .from('user_profile')
                    .select(`
                        id,
                        prenom,
                        nom,
                        email,
                        telephone,
                        role,
                        avatar,
                        created_at,
                        updated_at,
                        entreprise:entreprise_id(id, nom, type_entreprise),
                        service:service_id(id, nom),
                        fonction:fonction_id(id, nom)
                    `)
                    .eq('id', newRecord.id)
                    .single();
                
                if (!error && data) {
                    if (data.entreprise && data.entreprise.type_entreprise === 'interne') {
                        // Mettre à jour l'utilisateur s'il est toujours Arkance
                        setUsers(prevUsers => 
                            prevUsers.map(user => user.id === data.id ? data : user)
                                .sort((a, b) => a.prenom.localeCompare(b.prenom))
                        );
                    } else {
                        // Supprimer l'utilisateur s'il n'est plus Arkance
                        setUsers(prevUsers => prevUsers.filter(user => user.id !== data.id));
                    }
                }
            } else if (eventType === 'DELETE' && oldRecord) {
                setUsers(prevUsers => prevUsers.filter(user => user.id !== oldRecord.id));
            }
        } catch (err) {
            console.error('Erreur lors du traitement de l\'événement realtime:', err);
        }
    }, []);
    
    React.useEffect(() => {
        // Chargement initial
        fetchArkanceUsers();
        
        // Configuration du realtime
        createChannel('arkance-users', 'user_profile', ['INSERT', 'UPDATE', 'DELETE'], handleRealtimeEvent);
        
        // Nettoyage
        return () => {
            removeChannel('arkance-users');
        };
    }, [createChannel, removeChannel, handleRealtimeEvent]);
    
    return {
        users,
        loading,
        error,
        getUserById,
        getUserDisplayName,
        getUserInitials,
        refreshUsers: fetchArkanceUsers
    };
}

window.useArkanceUsers = useArkanceUsers;