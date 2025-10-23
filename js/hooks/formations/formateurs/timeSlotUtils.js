// Utilitaires pour la génération de créneaux horaires
(function() {
    'use strict';

    /**
     * Génère tous les créneaux possibles pour une journée (9h-17h)
     * @returns {Array} - Tableau de créneaux { start, end, display }
     */
    function generateTimeSlots() {
        const slots = [];
        const startHour = 9;
        const endHour = 17;

        for (let hour = startHour; hour < endHour; hour++) {
            slots.push({
                start: `${hour.toString().padStart(2, '0')}:00`,
                end: `${(hour + 1).toString().padStart(2, '0')}:00`,
                display: `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`
            });
        }

        return slots;
    }

    /**
     * Génère les créneaux pour une formation de plusieurs jours
     * @param {Number} sessionDurationInDays - Durée de la session en jours
     * @returns {Array} - Tableau de créneaux adaptés
     */
    function generateSessionTimeSlots(sessionDurationInDays) {
        // Pour les formations courtes (1-2 jours), on propose des créneaux d'une demi-journée
        if (sessionDurationInDays <= 2) {
            return [
                { start: '09:00', end: '12:30', display: '09:00 - 12:30 (Matin)' },
                { start: '13:30', end: '17:00', display: '13:30 - 17:00 (Après-midi)' }
            ];
        }

        // Pour les formations longues (3+ jours), on propose des journées complètes
        return [
            { start: '09:00', end: '17:00', display: '09:00 - 17:00 (Journée complète)' }
        ];
    }

    /**
     * Vérifie si un créneau chevauche un autre
     * @param {String} start1 - Heure de début du créneau 1 (HH:MM)
     * @param {String} end1 - Heure de fin du créneau 1 (HH:MM)
     * @param {String} start2 - Heure de début du créneau 2 (HH:MM)
     * @param {String} end2 - Heure de fin du créneau 2 (HH:MM)
     * @returns {Boolean} - true si chevauchement
     */
    function slotsOverlap(start1, end1, start2, end2) {
        const start1Minutes = timeToMinutes(start1);
        const end1Minutes = timeToMinutes(end1);
        const start2Minutes = timeToMinutes(start2);
        const end2Minutes = timeToMinutes(end2);

        return (start1Minutes < end2Minutes && end1Minutes > start2Minutes);
    }

    /**
     * Convertit une heure en minutes depuis minuit
     * @param {String} timeString - Heure au format 'HH:MM'
     * @returns {Number} - Minutes depuis minuit
     */
    function timeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Convertit des minutes en heure
     * @param {Number} minutes - Minutes depuis minuit
     * @returns {String} - Heure au format 'HH:MM'
     */
    function minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    /**
     * Calcule la durée entre deux heures en heures décimales
     * @param {String} start - Heure de début (HH:MM)
     * @param {String} end - Heure de fin (HH:MM)
     * @returns {Number} - Durée en heures décimales
     */
    function calculateDuration(start, end) {
        const startMinutes = timeToMinutes(start);
        const endMinutes = timeToMinutes(end);
        return (endMinutes - startMinutes) / 60;
    }

    // Exposer les utilitaires
    window.formateurTimeSlotUtils = {
        generateTimeSlots,
        generateSessionTimeSlots,
        slotsOverlap,
        timeToMinutes,
        minutesToTime,
        calculateDuration
    };

    console.log('✅ [formateurTimeSlotUtils] Module chargé');
})();
