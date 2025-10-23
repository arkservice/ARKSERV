console.log("🔥 [CHARGEMENT] ToasterProvider.js CHARGÉ!");

// Provider pour gérer les toasts globalement
function ToasterProvider() {
    console.log("🍞 [ToasterProvider] COMPOSANT CRÉÉ!");
    
    const { useState, useEffect } = React;
    const [toasts, setToasts] = useState([]);
    
    // Ajouter un nouveau toast
    const addToast = (options) => {
        const id = Date.now() + Math.random(); // ID unique
        const newToast = {
            id,
            type: options.type || 'info',
            title: options.title || '',
            message: options.message || '',
            duration: options.duration || 5000,
            actions: options.actions || [],
            onClose: options.onClose
        };
        
        console.log("➕ [ToasterProvider] Ajout toast:", newToast);
        setToasts(current => [...current, newToast]);
        
        return id;
    };
    
    // Supprimer un toast
    const removeToast = (id) => {
        console.log("➖ [ToasterProvider] Suppression toast:", id);
        setToasts(current => current.filter(toast => toast.id !== id));
    };
    
    // Exposer l'instance globalement
    useEffect(() => {
        window.toasterInstance = { addToast, removeToast };
        console.log("🌍 [ToasterProvider] Instance globale exposée");
        
        return () => {
            window.toasterInstance = null;
        };
    }, []);
    
    // Ne rien afficher s'il n'y a pas de toasts
    if (toasts.length === 0) {
        return null;
    }
    
    return React.createElement('div', {
        className: 'fixed inset-0 z-50',
        'aria-live': 'polite',
        'aria-atomic': 'true'
    }, [
        // Overlay flou en arrière-plan
        React.createElement('div', {
            key: 'overlay',
            className: 'fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm pointer-events-none'
        }),
        // Conteneur des toasts centré
        React.createElement('div', {
            key: 'toasts-container',
            className: 'fixed top-4 left-1/2 transform -translate-x-1/2 flex flex-col space-y-2 pointer-events-none w-full max-w-5xl px-4'
        }, toasts.map(toast => 
            React.createElement(window.Toast, {
                key: toast.id,
                id: toast.id,
                type: toast.type,
                title: toast.title,
                message: toast.message,
                duration: toast.duration,
                actions: toast.actions,
                onClose: (id) => {
                    removeToast(id);
                    // Appeler le callback onClose si fourni
                    if (toast.onClose) {
                        toast.onClose();
                    }
                }
            })
        ))
    ]);
}

// Export global
window.ToasterProvider = ToasterProvider;