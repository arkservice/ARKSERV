// Utilitaires pour la gestion des dates sans problème de fuseau horaire
console.log("🔥 [CHARGEMENT] dateUtils.js CHARGÉ!");

/**
 * Formate une date au format français sans problème de timezone
 * Évite les conversions UTC automatiques de JavaScript
 * @param {string|Date} date - Date à formater (format ISO ou objet Date)
 * @returns {string} Date formatée en DD/MM/YYYY
 */
function formatDateLocaleSafe(date) {
    if (!date) return '';
    
    try {
        let dateObj;
        
        if (typeof date === 'string') {
            // Si c'est une chaîne, on extrait manuellement les composants pour éviter UTC
            // Format attendu: "2024-08-17" ou "2024-08-17T10:30:00"
            const dateOnly = date.split('T')[0]; // Prendre seulement la partie date
            const [year, month, day] = dateOnly.split('-').map(num => parseInt(num, 10));
            
            if (!year || !month || !day) {
                console.warn('⚠️ [formatDateLocaleSafe] Format de date invalide:', date);
                return '';
            }
            
            // Créer la date en heure locale (pas UTC)
            dateObj = new Date(year, month - 1, day); // month - 1 car janvier = 0
        } else if (date instanceof Date) {
            dateObj = date;
        } else {
            console.warn('⚠️ [formatDateLocaleSafe] Type de date non supporté:', typeof date);
            return '';
        }
        
        if (isNaN(dateObj.getTime())) {
            console.warn('⚠️ [formatDateLocaleSafe] Date invalide après conversion:', date);
            return '';
        }
        
        // Formater en français avec les composants locaux (pas UTC)
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        
        const formatted = `${day}/${month}/${year}`;
        console.log(`📅 [formatDateLocaleSafe] ${date} → ${formatted}`);
        
        return formatted;
        
    } catch (error) {
        console.error('❌ [formatDateLocaleSafe] Erreur lors du formatage:', error, 'pour date:', date);
        return '';
    }
}

/**
 * Formate une plage de dates au format "du X au Y" sans problème de timezone
 * @param {string|Date} dateDebut - Date de début
 * @param {string|Date} dateFin - Date de fin
 * @returns {string} Plage formatée
 */
function formatDateRangeSafe(dateDebut, dateFin) {
    const debut = formatDateLocaleSafe(dateDebut);
    const fin = formatDateLocaleSafe(dateFin);
    
    if (!debut && !fin) return '';
    if (!fin || debut === fin) return debut;
    
    const result = `du ${debut} au ${fin}`;
    console.log(`📅 [formatDateRangeSafe] ${dateDebut} - ${dateFin} → "${result}"`);
    
    return result;
}

/**
 * Convertit une date ISO en date locale sans décalage UTC
 * @param {string} isoDate - Date au format ISO (2024-08-17T10:30:00Z)
 * @returns {Date} Date en heure locale
 */
function parseISOToLocal(isoDate) {
    if (!isoDate) return null;
    
    try {
        // Extraire les composants sans passer par Date.parse qui utilise UTC
        const dateOnly = isoDate.split('T')[0];
        const [year, month, day] = dateOnly.split('-').map(num => parseInt(num, 10));
        
        // Créer en heure locale
        return new Date(year, month - 1, day);
    } catch (error) {
        console.error('❌ [parseISOToLocal] Erreur:', error);
        return null;
    }
}

/**
 * Formatte une date pour l'affichage dans les templates React
 * Version optimisée pour éviter les problèmes de timezone
 * @param {string|Date} date - Date à formater
 * @param {object} options - Options de formatage (optionnel)
 * @returns {string} Date formatée
 */
function formatDateForDisplay(date, options = {}) {
    const {
        showYear = true,
        separator = '/',
        locale = 'fr-FR'
    } = options;
    
    if (!date) return '';
    
    try {
        let dateObj;
        
        if (typeof date === 'string') {
            const dateOnly = date.split('T')[0];
            const [year, month, day] = dateOnly.split('-').map(num => parseInt(num, 10));
            dateObj = new Date(year, month - 1, day);
        } else {
            dateObj = date;
        }
        
        if (isNaN(dateObj.getTime())) return '';
        
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        
        if (showYear) {
            return `${day}${separator}${month}${separator}${year}`;
        } else {
            return `${day}${separator}${month}`;
        }
        
    } catch (error) {
        console.error('❌ [formatDateForDisplay] Erreur:', error);
        return '';
    }
}

/**
 * Compare deux dates sans tenir compte du fuseau horaire
 * @param {string|Date} date1 - Première date
 * @param {string|Date} date2 - Deuxième date
 * @returns {number} -1, 0, ou 1 selon la comparaison
 */
function compareDatesSafe(date1, date2) {
    const d1 = parseISOToLocal(date1);
    const d2 = parseISOToLocal(date2);
    
    if (!d1 || !d2) return 0;
    
    const t1 = d1.getTime();
    const t2 = d2.getTime();
    
    if (t1 < t2) return -1;
    if (t1 > t2) return 1;
    return 0;
}

/**
 * Filtre les événements actifs pour une date donnée
 * @param {Array} events - Liste des événements
 * @param {Date|string} date - Date à vérifier
 * @returns {Array} Événements actifs pour cette date
 */
function getEventsForDate(events, date) {
    if (!events || !date) return [];
    
    try {
        // Convertir la date cible en format comparable
        let targetDate;
        if (typeof date === 'string') {
            const dateOnly = date.split('T')[0];
            const [year, month, day] = dateOnly.split('-').map(num => parseInt(num, 10));
            targetDate = new Date(year, month - 1, day);
        } else {
            targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        }
        
        // Formatage manuel pour éviter les problèmes de conversion UTC avec toISOString()
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const targetDateString = `${year}-${month}-${day}`;
        
        console.log(`📅 [getEventsForDate] Recherche événements pour ${targetDateString}`);
        
        const filteredEvents = events.filter(event => {
            if (!event.date_debut || !event.date_fin) return false;
            
            // Extraire les parties date uniquement (sans l'heure)
            const startDate = event.date_debut.split('T')[0];
            const endDate = event.date_fin.split('T')[0];
            
            // Vérifier si la date cible est dans la plage [startDate, endDate]
            const isActive = targetDateString >= startDate && targetDateString <= endDate;
            
            if (isActive) {
                console.log(`📌 [getEventsForDate] Événement actif: ${event.titre} (${startDate} - ${endDate})`);
            }
            
            return isActive;
        });
        
        console.log(`📋 [getEventsForDate] ${filteredEvents.length} événement(s) trouvé(s) pour ${targetDateString}`);
        return filteredEvents;
        
    } catch (error) {
        console.error('❌ [getEventsForDate] Erreur:', error);
        return [];
    }
}

/**
 * Vérifie si une date est aujourd'hui
 * @param {Date|string} date - Date à vérifier
 * @returns {boolean} True si c'est aujourd'hui
 */
function isToday(date) {
    if (!date) return false;
    
    try {
        const today = new Date();
        // Formatage manuel pour éviter les problèmes de conversion UTC avec toISOString()
        const todayYear = today.getFullYear();
        const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
        const todayDay = String(today.getDate()).padStart(2, '0');
        const todayString = `${todayYear}-${todayMonth}-${todayDay}`;
        
        let dateString;
        if (typeof date === 'string') {
            dateString = date.split('T')[0];
        } else {
            // Formatage manuel pour éviter les problèmes de conversion UTC
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dateString = `${year}-${month}-${day}`;
        }
        
        return dateString === todayString;
    } catch (error) {
        console.error('❌ [isToday] Erreur:', error);
        return false;
    }
}

/**
 * Vérifie si deux dates représentent le même jour
 * @param {Date|string} date1 - Première date
 * @param {Date|string} date2 - Deuxième date
 * @returns {boolean} True si c'est le même jour
 */
function isSameDay(date1, date2) {
    if (!date1 || !date2) return false;
    
    try {
        let dateString1, dateString2;
        
        if (typeof date1 === 'string') {
            dateString1 = date1.split('T')[0];
        } else {
            // Formatage manuel pour éviter les problèmes de conversion UTC
            const year1 = date1.getFullYear();
            const month1 = String(date1.getMonth() + 1).padStart(2, '0');
            const day1 = String(date1.getDate()).padStart(2, '0');
            dateString1 = `${year1}-${month1}-${day1}`;
        }
        
        if (typeof date2 === 'string') {
            dateString2 = date2.split('T')[0];
        } else {
            // Formatage manuel pour éviter les problèmes de conversion UTC
            const year2 = date2.getFullYear();
            const month2 = String(date2.getMonth() + 1).padStart(2, '0');
            const day2 = String(date2.getDate()).padStart(2, '0');
            dateString2 = `${year2}-${month2}-${day2}`;
        }
        
        return dateString1 === dateString2;
    } catch (error) {
        console.error('❌ [isSameDay] Erreur:', error);
        return false;
    }
}

/**
 * Vérifie si un événement est actif à une date donnée
 * @param {Object} event - Événement à vérifier
 * @param {Date|string} date - Date à vérifier
 * @returns {boolean} True si l'événement est actif
 */
function isEventActiveOnDate(event, date) {
    if (!event || !event.date_debut || !event.date_fin || !date) return false;
    
    try {
        let targetDateString;
        if (typeof date === 'string') {
            targetDateString = date.split('T')[0];
        } else {
            // Formatage manuel pour éviter les problèmes de conversion UTC
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            targetDateString = `${year}-${month}-${day}`;
        }
        
        const startDate = event.date_debut.split('T')[0];
        const endDate = event.date_fin.split('T')[0];
        
        return targetDateString >= startDate && targetDateString <= endDate;
    } catch (error) {
        console.error('❌ [isEventActiveOnDate] Erreur:', error);
        return false;
    }
}

/**
 * Filtre les événements qui COMMENCENT exactement à une date donnée pour un utilisateur
 * Utilisé par TimelineView pour éviter les doublons d'événements multi-jours
 * @param {Array} events - Liste des événements
 * @param {Date|string} date - Date de début recherchée
 * @param {string} userId - ID de l'utilisateur (optionnel)
 * @returns {Array} Événements commençant à cette date
 */
function getEventsStartingOnDate(events, date, userId = null) {
    if (!events || !date) return [];
    
    try {
        // Convertir la date cible en format comparable
        let targetDateString;
        if (typeof date === 'string') {
            targetDateString = date.split('T')[0];
        } else {
            // Formatage manuel pour éviter les problèmes de conversion UTC
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            targetDateString = `${year}-${month}-${day}`;
        }
        
        console.log(`📅 [getEventsStartingOnDate] Recherche événements commençant le ${targetDateString} pour user ${userId || 'tous'}`);
        
        const filteredEvents = events.filter(event => {
            if (!event.date_debut) return false;
            
            // Vérifier que l'événement commence exactement à cette date
            const eventStartDate = event.date_debut.split('T')[0];
            const startsOnDate = eventStartDate === targetDateString;
            
            if (!startsOnDate) return false;
            
            // Si un userId est spécifié, filtrer par utilisateur
            if (userId) {
                const belongsToUser = event.user_id === userId || 
                                   (event.client_user_id && event.client_user_id.includes(userId));
                if (!belongsToUser) return false;
            }
            
            console.log(`📌 [getEventsStartingOnDate] Événement commençant: ${event.titre} (${eventStartDate})`);
            return true;
        });
        
        console.log(`📋 [getEventsStartingOnDate] ${filteredEvents.length} événement(s) commençant le ${targetDateString}`);
        return filteredEvents;
        
    } catch (error) {
        console.error('❌ [getEventsStartingOnDate] Erreur:', error);
        return [];
    }
}

// Export des fonctions
window.DateUtils = {
    formatDateLocaleSafe,
    formatDateRangeSafe,
    parseISOToLocal,
    formatDateForDisplay,
    compareDatesSafe,
    getEventsForDate,
    getEventsStartingOnDate,
    isToday,
    isSameDay,
    isEventActiveOnDate
};

console.log('📦 [dateUtils] Fonctions exportées:', Object.keys(window.DateUtils));