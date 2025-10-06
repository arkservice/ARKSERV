console.log("🔥 [CHARGEMENT] useToaster.js CHARGÉ!");

// Hook pour gérer les notifications toast
function useToaster() {
    console.log("🎯 [useToaster] HOOK APPELÉ!");
    
    const showToast = (options) => {
        console.log("🍞 [useToaster] Affichage toast:", options);
        
        // Vérifier si le ToasterProvider est disponible
        if (!window.toasterInstance) {
            console.error("❌ [useToaster] ToasterProvider non trouvé!");
            // Fallback vers alert() si le toaster n'est pas disponible
            alert(`${options.title || 'Notification'}: ${options.message || ''}`);
            return;
        }
        
        // Déléguer au ToasterProvider
        window.toasterInstance.addToast(options);
    };
    
    const showSuccessToast = (title, message, options = {}) => {
        showToast({
            type: 'success',
            title,
            message,
            duration: 3000,
            ...options
        });
    };
    
    const showErrorToast = (title, message, options = {}) => {
        showToast({
            type: 'error',
            title,
            message,
            duration: 5000,
            ...options
        });
    };
    
    const showWarningToast = (title, message, options = {}) => {
        showToast({
            type: 'warning',
            title,
            message,
            duration: 4000,
            ...options
        });
    };
    
    const showInfoToast = (title, message, options = {}) => {
        showToast({
            type: 'info',
            title,
            message,
            duration: 3000,
            ...options
        });
    };
    
    return {
        showToast,
        showSuccessToast,
        showErrorToast,
        showWarningToast,
        showInfoToast
    };
}

// Export global
window.useToaster = useToaster;