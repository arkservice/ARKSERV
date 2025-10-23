// Utilitaires pour la gestion des timezones
(function() {
    'use strict';

    /**
     * Créer une date/heure en UTC à partir d'une date locale et d'une heure
     * @param {Date} localDate - Date locale
     * @param {String} timeString - Heure au format 'HH:MM'
     * @returns {String} - ISO string en UTC
     */
    function createUTCDateTimeFromLocal(localDate, timeString) {
        // Créer une date dans la timezone locale
        const [hours, minutes] = timeString.split(':').map(Number);
        const dateInLocal = new Date(localDate);
        dateInLocal.setHours(hours, minutes, 0, 0);

        // Retourner l'ISO string (qui est en UTC)
        return dateInLocal.toISOString();
    }

    /**
     * Créer une date/heure locale à partir d'une date et heure (pour affichage)
     * @param {Date} date - Date
     * @param {String} timeString - Heure au format 'HH:MM'
     * @returns {Date} - Date locale
     */
    function createLocalDateTime(date, timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const localDate = new Date(date);
        localDate.setHours(hours, minutes, 0, 0);
        return localDate;
    }

    /**
     * Vérifier si on est en heure d'été (CEST) ou hiver (CET) pour la France
     * @param {Date} date - Date à vérifier
     * @returns {Number} - Offset en heures (UTC+1 ou UTC+2)
     */
    function getTimezoneOffset(date) {
        // En France: UTC+1 (hiver) ou UTC+2 (été)
        const offset = -date.getTimezoneOffset() / 60; // Offset en heures
        return offset;
    }

    /**
     * Formater une date en string ISO (YYYY-MM-DD)
     * @param {Date} date - Date à formater
     * @returns {String} - Date au format ISO
     */
    function formatDateISO(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Parser une date ISO string
     * @param {String} isoString - String ISO (YYYY-MM-DD)
     * @returns {Date} - Date
     */
    function parseDateISO(isoString) {
        return new Date(isoString);
    }

    // Exposer les utilitaires
    window.formateurTimezoneUtils = {
        createUTCDateTimeFromLocal,
        createLocalDateTime,
        getTimezoneOffset,
        formatDateISO,
        parseDateISO
    };

    console.log('✅ [formateurTimezoneUtils] Module chargé');
})();
