// État global pour le statut temps réel
window.realtimeGlobalState = {
    isConnected: false,
    error: null,
    activeChannels: 0,
    listeners: new Set()
};

// Hook personnalisé pour la gestion du temps réel Supabase
function useRealtime() {
    const { useState, useEffect, useCallback, useRef } = React;
    const supabase = window.supabaseConfig.client;
    
    const [isConnected, setIsConnected] = useState(window.realtimeGlobalState.isConnected);
    const [error, setError] = useState(window.realtimeGlobalState.error);
    const channelsRef = useRef(new Map());
    
    // Fonction pour mettre à jour l'état global
    const updateGlobalState = useCallback((connected, err = null) => {
        window.realtimeGlobalState.isConnected = connected;
        window.realtimeGlobalState.error = err;
        
        // Notifier tous les listeners
        window.realtimeGlobalState.listeners.forEach(listener => {
            listener(connected, err);
        });
    }, []);
    
    // S'abonner aux changements globaux
    useEffect(() => {
        const listener = (connected, err) => {
            setIsConnected(connected);
            setError(err);
        };
        
        window.realtimeGlobalState.listeners.add(listener);
        
        return () => {
            window.realtimeGlobalState.listeners.delete(listener);
        };
    }, []);
    
    // Fonction pour créer un channel de subscription
    const createChannel = useCallback((channelName, table, eventTypes = ['INSERT', 'UPDATE', 'DELETE'], callback) => {
        try {
            setError(null);
            
            // Vérifier si le channel existe déjà
            if (channelsRef.current.has(channelName)) {
                console.warn(`Channel ${channelName} déjà créé`);
                return channelsRef.current.get(channelName);
            }
            
            // Créer le channel
            const channel = supabase
                .channel(channelName)
                .on('postgres_changes', {
                    event: '*', // Écouter tous les événements
                    schema: 'public',
                    table: table
                }, (payload) => {
                    console.log(`Realtime event on ${table}:`, payload);
                    
                    // Filtrer les événements selon les types demandés
                    if (eventTypes.includes(payload.eventType)) {
                        callback(payload);
                    }
                })
                .subscribe((status) => {
                    console.log(`Channel ${channelName} status:`, status);
                    
                    if (status === 'SUBSCRIBED') {
                        window.realtimeGlobalState.activeChannels++;
                        updateGlobalState(true, null);
                    } else if (status === 'CLOSED') {
                        window.realtimeGlobalState.activeChannels--;
                        if (window.realtimeGlobalState.activeChannels <= 0) {
                            updateGlobalState(false, null);
                        }
                    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        updateGlobalState(false, `Erreur de connexion: ${status}`);
                    }
                });
            
            // Stocker le channel
            channelsRef.current.set(channelName, channel);
            
            return channel;
        } catch (err) {
            console.error('Erreur lors de la création du channel:', err);
            updateGlobalState(false, err.message);
            return null;
        }
    }, [supabase, updateGlobalState]);
    
    // Fonction pour supprimer un channel
    const removeChannel = useCallback((channelName) => {
        if (channelsRef.current.has(channelName)) {
            const channel = channelsRef.current.get(channelName);
            supabase.removeChannel(channel);
            channelsRef.current.delete(channelName);
            window.realtimeGlobalState.activeChannels--;
            
            if (window.realtimeGlobalState.activeChannels <= 0) {
                updateGlobalState(false, null);
            }
            
            console.log(`Channel ${channelName} supprimé`);
        }
    }, [supabase, updateGlobalState]);
    
    // Fonction pour supprimer tous les channels
    const removeAllChannels = useCallback(() => {
        channelsRef.current.forEach((channel, channelName) => {
            supabase.removeChannel(channel);
            console.log(`Channel ${channelName} supprimé`);
        });
        channelsRef.current.clear();
        window.realtimeGlobalState.activeChannels = 0;
        updateGlobalState(false, null);
    }, [supabase, updateGlobalState]);
    
    // Nettoyage à la destruction du component
    useEffect(() => {
        return () => {
            removeAllChannels();
        };
    }, [removeAllChannels]);
    
    return {
        isConnected,
        error,
        createChannel,
        removeChannel,
        removeAllChannels
    };
}

// Export global
window.useRealtime = useRealtime;