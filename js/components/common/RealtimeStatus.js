// Composant pour afficher le statut de la connexion temps réel
function RealtimeStatus() {
    const { useState, useEffect } = React;
    const { isConnected, error } = window.useRealtime();
    const [shouldShow, setShouldShow] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    
    // Ne montrer l'indicateur que si au moins un channel est actif
    useEffect(() => {
        const checkChannels = () => {
            const hasActiveChannels = window.realtimeGlobalState && window.realtimeGlobalState.activeChannels > 0;
            const shouldShowNow = hasActiveChannels || error;
            
            // Debug logs
            console.log('RealtimeStatus check:', {
                hasActiveChannels,
                activeChannels: window.realtimeGlobalState?.activeChannels || 0,
                error,
                shouldShowNow,
                isConnected
            });
            
            setShouldShow(shouldShowNow);
        };
        
        // Vérifier immédiatement
        checkChannels();
        
        // Vérifier périodiquement (pour détecter les nouveaux channels)
        const interval = setInterval(checkChannels, 1000);
        
        return () => clearInterval(interval);
    }, [error, isConnected]);
    
    // Ne pas afficher si aucun channel n'est actif ou si l'utilisateur l'a masqué
    if (!shouldShow || isHidden) {
        return null;
    }
    
    // Fonction pour créer l'indicateur avec bouton de fermeture
    const createIndicator = (bgColor, icon, text) => {
        return React.createElement('div', {
            className: `fixed top-4 right-4 ${bgColor} text-white px-3 py-2 rounded-lg shadow-lg flex items-center z-50`
        }, [
            React.createElement('i', {
                key: 'icon',
                'data-lucide': icon,
                className: `w-4 h-4 mr-2 ${icon === 'loader-2' ? 'animate-spin' : ''}`
            }),
            React.createElement('span', {
                key: 'text',
                className: "text-sm mr-2"
            }, text),
            React.createElement('button', {
                key: 'close',
                onClick: () => setIsHidden(true),
                className: "ml-1 text-white hover:text-gray-200 focus:outline-none",
                title: "Masquer l'indicateur"
            }, React.createElement('i', {
                'data-lucide': 'x',
                className: "w-3 h-3"
            }))
        ]);
    };
    
    if (error) {
        return createIndicator('bg-red-500', 'wifi-off', 'Temps réel : Erreur');
    }
    
    if (!isConnected) {
        return createIndicator('bg-yellow-500', 'loader-2', 'Connexion...');
    }
    
    return createIndicator('bg-green-500', 'wifi', 'Temps réel actif');
}

// Export global
window.RealtimeStatus = RealtimeStatus;