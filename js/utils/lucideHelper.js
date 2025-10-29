// Helper utilitaire pour gérer le chargement asynchrone de Lucide Icons
// Corrige le problème "Cannot read properties of undefined (reading 'icons')"

/**
 * Fonction safe pour créer les icônes Lucide
 * Attend que lucide soit chargé avant d'appeler createIcons()
 * @param {number} maxRetries - Nombre maximum de tentatives (défaut: 20)
 * @param {number} retryDelay - Délai entre chaque tentative en ms (défaut: 50ms)
 * @returns {Promise<void>}
 */
window.safeCreateIcons = function(maxRetries = 20, retryDelay = 50) {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        const tryCreateIcons = () => {
            attempts++;

            // Vérifier si lucide est disponible
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                try {
                    window.lucide.createIcons();
                    console.log('✅ Lucide icons créées avec succès');
                    resolve();
                } catch (error) {
                    console.error('❌ Erreur lors de la création des icônes Lucide:', error);
                    reject(error);
                }
            } else {
                // Lucide n'est pas encore chargé
                if (attempts < maxRetries) {
                    console.warn(`⏳ Lucide non disponible, tentative ${attempts}/${maxRetries}...`);
                    setTimeout(tryCreateIcons, retryDelay);
                } else {
                    const error = new Error(`Lucide Icons n'a pas pu être chargé après ${maxRetries} tentatives`);
                    console.error('❌', error.message);
                    reject(error);
                }
            }
        };

        // Démarrer la première tentative
        tryCreateIcons();
    });
};

/**
 * Version synchrone (sans Promise) pour compatibilité avec l'ancien code
 * Appelle la version async en arrière-plan
 */
window.safeCreateIconsSync = function() {
    window.safeCreateIcons().catch(error => {
        console.error('Erreur safeCreateIconsSync:', error);
    });
};

// Vérifier immédiatement si lucide est chargé
if (window.lucide && typeof window.lucide.createIcons === 'function') {
    console.log('✅ Lucide Icons est déjà chargé et prêt');
} else {
    console.warn('⚠️ Lucide Icons n\'est pas encore chargé. Utilisez safeCreateIcons() pour l\'initialiser de manière sécurisée.');
}
