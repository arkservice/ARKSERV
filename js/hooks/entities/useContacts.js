// Hook personnalisé pour les contacts - Optimized with cache
function useContacts() {
    const { useState, useEffect, useCallback, useRef } = React;
    const supabase = window.supabaseConfig.client;

    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cache pour éviter les requêtes redondantes
    const cacheRef = useRef({ data: null, timestamp: null, ttl: 120000 }); // Cache 2 minutes

    const fetchContacts = useCallback(async (forceRefresh = false) => {
        try {
            // Vérifier le cache avant de faire une requête
            const now = Date.now();
            const cache = cacheRef.current;

            if (!forceRefresh && cache.data && cache.timestamp && (now - cache.timestamp) < cache.ttl) {
                // Utiliser les données du cache
                setContacts(cache.data);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('user_profile')
                .select(`
                    id,
                    prenom,
                    nom,
                    email,
                    telephone,
                    entreprise_id,
                    created_at,
                    entreprise:entreprise_id(id, nom, type_entreprise)
                `)
                .eq('entreprise.type_entreprise', 'client')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            // Filtrer uniquement les contacts avec une entreprise de type 'client'
            const contactsClients = (data || []).filter(contact =>
                contact.entreprise && contact.entreprise.type_entreprise === 'client'
            );

            // Mettre à jour le cache
            cacheRef.current = {
                data: contactsClients,
                timestamp: now,
                ttl: 120000
            };

            setContacts(contactsClients);
        } catch (err) {
            console.error('Erreur lors du chargement des contacts:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const createContact = async (contact) => {
        try {
            setError(null);
            const { data, error: insertError } = await supabase
                .from('user_profile')
                .insert(contact)
                .select(`
                    id,
                    prenom,
                    nom,
                    email,
                    telephone,
                    entreprise_id,
                    created_at
                `)
                .single();

            if (insertError) throw insertError;

            // Invalider le cache et recharger
            cacheRef.current.timestamp = null;
            await fetchContacts(true);

            // Émettre l'événement pour notifier les autres composants
            if (window.EventBus && window.EventBusEvents) {
                window.EventBus.emit(window.EventBusEvents.CONTACT_CREATED, {
                    contactId: data.id,
                    contact: data,
                    timestamp: new Date().toISOString()
                });
            }

            return data;
        } catch (err) {
            console.error('Erreur lors de la création:', err);
            setError(err.message);
            throw err;
        }
    };

    const updateContact = async (id, updates) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('user_profile')
                .update(updates)
                .eq('id', id)
                .select(`
                    id,
                    prenom,
                    nom,
                    email,
                    telephone,
                    entreprise_id,
                    created_at
                `)
                .single();

            if (updateError) throw updateError;
            // Invalider le cache et recharger
            cacheRef.current.timestamp = null;
            await fetchContacts(true);
            return data;
        } catch (err) {
            console.error('Erreur lors de la mise à jour:', err);
            setError(err.message);
            throw err;
        }
    };

    const deleteContact = async (id) => {
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from('user_profile')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            await fetchContacts();
        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            setError(err.message);
            throw err;
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    // Écouter les événements de création/modification/suppression de contacts
    useEffect(() => {
        if (!window.EventBus || !window.EventBusEvents) return;

        const handleContactCreated = (data) => {
            console.log('📡 [useContacts] Contact créé reçu:', data);
            // Invalider le cache et recharger les données
            cacheRef.current.timestamp = null;
            fetchContacts(true);
        };

        const handleContactUpdated = (data) => {
            console.log('📡 [useContacts] Contact modifié reçu:', data);
            cacheRef.current.timestamp = null;
            fetchContacts(true);
        };

        const handleContactDeleted = (data) => {
            console.log('📡 [useContacts] Contact supprimé reçu:', data);
            cacheRef.current.timestamp = null;
            fetchContacts(true);
        };

        // S'abonner aux événements
        const unsubscribeCreated = window.EventBus.on(
            window.EventBusEvents.CONTACT_CREATED,
            handleContactCreated
        );

        const unsubscribeUpdated = window.EventBus.on(
            window.EventBusEvents.CONTACT_UPDATED,
            handleContactUpdated
        );

        const unsubscribeDeleted = window.EventBus.on(
            window.EventBusEvents.CONTACT_DELETED,
            handleContactDeleted
        );

        // Cleanup lors du démontage
        return () => {
            unsubscribeCreated();
            unsubscribeUpdated();
            unsubscribeDeleted();
        };
    }, [fetchContacts]);

    return { contacts, loading, error, createContact, updateContact, deleteContact, refetch: fetchContacts };
}

// Export global
window.useContacts = useContacts;
