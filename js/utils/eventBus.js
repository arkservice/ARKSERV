/**
 * Event Bus - Système de communication inter-composants
 * Permet de notifier les changements entre différentes pages de l'application
 */

class EventBus {
    constructor() {
        this.events = {};
    }

    /**
     * Écouter un événement
     * @param {string} eventName - Nom de l'événement
     * @param {Function} callback - Fonction à appeler quand l'événement est émis
     * @returns {Function} Fonction pour se désabonner
     */
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }

        this.events[eventName].push(callback);

        // Retourner une fonction de cleanup pour se désabonner
        return () => {
            this.off(eventName, callback);
        };
    }

    /**
     * Arrêter d'écouter un événement
     * @param {string} eventName - Nom de l'événement
     * @param {Function} callback - Fonction à retirer
     */
    off(eventName, callback) {
        if (!this.events[eventName]) return;

        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }

    /**
     * Émettre un événement
     * @param {string} eventName - Nom de l'événement
     * @param {*} data - Données à passer aux listeners
     */
    emit(eventName, data) {
        console.log(`📡 [EventBus] Émission événement "${eventName}"`, data);

        if (!this.events[eventName]) return;

        this.events[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`❌ [EventBus] Erreur dans callback pour "${eventName}":`, error);
            }
        });
    }

    /**
     * Émettre un événement une seule fois (pour le prochain listener seulement)
     * @param {string} eventName - Nom de l'événement
     * @param {Function} callback - Fonction à appeler une fois
     */
    once(eventName, callback) {
        const onceWrapper = (data) => {
            callback(data);
            this.off(eventName, onceWrapper);
        };

        this.on(eventName, onceWrapper);
    }

    /**
     * Supprimer tous les listeners d'un événement
     * @param {string} eventName - Nom de l'événement
     */
    clear(eventName) {
        if (eventName) {
            delete this.events[eventName];
        } else {
            this.events = {};
        }
    }

    /**
     * Obtenir le nombre de listeners pour un événement
     * @param {string} eventName - Nom de l'événement
     * @returns {number}
     */
    listenerCount(eventName) {
        return this.events[eventName] ? this.events[eventName].length : 0;
    }
}

// Créer une instance globale unique
const eventBus = new EventBus();

// Export global pour utilisation dans le projet
if (typeof window !== 'undefined') {
    window.EventBus = eventBus;

    // Définir les noms d'événements standard pour éviter les typos
    window.EventBusEvents = {
        FORMATION_CREATED: 'formation:created',
        FORMATION_UPDATED: 'formation:updated',
        FORMATION_DELETED: 'formation:deleted',
        PROJECT_UPDATED: 'project:updated',
        SESSION_UPDATED: 'session:updated',
        PDF_GENERATED: 'pdf:generated',
        CONTACT_CREATED: 'contact:created',
        CONTACT_UPDATED: 'contact:updated',
        CONTACT_DELETED: 'contact:deleted',
        ENTREPRISE_CREATED: 'entreprise:created',
        ENTREPRISE_UPDATED: 'entreprise:updated',
        ENTREPRISE_DELETED: 'entreprise:deleted',
        USER_CREATED: 'user:created',
        USER_UPDATED: 'user:updated',
        USER_DELETED: 'user:deleted',
        AGENCE_CREATED: 'agence:created',
        AGENCE_UPDATED: 'agence:updated',
        AGENCE_DELETED: 'agence:deleted'
    };
}

console.log('✅ [EventBus] Module chargé et exposé via window.EventBus');
