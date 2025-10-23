// Utilitaires pour la gestion des sessions de formation

// Définition des horaires standard
const PERIODES_HORAIRES = {
    matin: { heureDebut: '09:00', heureFin: '12:00' },
    'apres-midi': { heureDebut: '13:00', heureFin: '17:00' },
    journee: { heureDebut: '09:00', heureFin: '17:00' }
};

// Libellés français pour les périodes
const PERIODE_LABELS = {
    matin: 'Matin',
    'apres-midi': 'Après-midi',
    journee: 'Journée',
    personnalise: 'Personnalisé'
};

// Libellés courts pour l'affichage
const PERIODE_SHORT_LABELS = {
    matin: 'AM',
    'apres-midi': 'PM',
    journee: 'Journée',
    personnalise: ''
};

/**
 * Obtient les heures de début et fin pour une période donnée
 * @param {string} periode - 'matin', 'apres-midi', 'journee', ou 'personnalise'
 * @returns {{heureDebut: string, heureFin: string}}
 */
function getPeriodeHours(periode) {
    if (periode === 'personnalise') {
        return { heureDebut: '09:00', heureFin: '17:00' };
    }
    return PERIODES_HORAIRES[periode] || PERIODES_HORAIRES.journee;
}

/**
 * Formate une date pour l'affichage court
 * @param {Date} date
 * @returns {string} Ex: "Lun 15/01"
 */
function formatDateShort(date) {
    const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const jour = jours[date.getDay()];
    const numJour = String(date.getDate()).padStart(2, '0');
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    return `${jour} ${numJour}/${mois}`;
}

/**
 * Formate une session pour l'affichage
 * @param {Object} session - Session avec dateDebut, dateFin, heureDebut, heureFin
 * @returns {string} Ex: "Lun 15/01 09h00 → Jeu 18/01 17h00"
 */
function formatSessionDisplay(session) {
    const debut = formatDateShort(session.dateDebut);
    const fin = formatDateShort(session.dateFin);

    // Nouveau format : utiliser heureDebut/heureFin
    if (session.heureDebut && session.heureFin) {
        const heureDebutStr = session.heureDebut.replace(':', 'h');
        const heureFinStr = session.heureFin.replace(':', 'h');

        // Si même jour
        if (session.dateDebut.toDateString() === session.dateFin.toDateString()) {
            return `${debut} ${heureDebutStr} → ${heureFinStr}`;
        }

        // Plusieurs jours
        return `${debut} ${heureDebutStr} → ${fin} ${heureFinStr}`;
    }

    // Ancien format : utiliser periodeDebut/periodeFin (compatibilité)
    const periodeDebutLabel = PERIODE_SHORT_LABELS[session.periodeDebut] || '';
    const periodeFinLabel = PERIODE_SHORT_LABELS[session.periodeFin] || '';

    // Si même jour
    if (session.dateDebut.toDateString() === session.dateFin.toDateString()) {
        if (session.periodeDebut === 'journee') {
            return `${debut} (Journée)`;
        }
        if (session.periodeDebut === session.periodeFin) {
            return `${debut} ${periodeDebutLabel}`;
        }
        return `${debut} ${periodeDebutLabel} → ${periodeFinLabel}`;
    }

    // Plusieurs jours
    return `${debut} ${periodeDebutLabel} → ${fin} ${periodeFinLabel}`;
}

/**
 * Formate une session pour l'affichage détaillé
 * @param {Object} session
 * @returns {string} Ex: "Du lundi 15 janvier de 09h00 à 17h00"
 */
function formatSessionDetailled(session) {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const debutStr = session.dateDebut.toLocaleDateString('fr-FR', options);
    const finStr = session.dateFin.toLocaleDateString('fr-FR', options);

    // Nouveau format : utiliser heureDebut/heureFin
    if (session.heureDebut && session.heureFin) {
        const heureDebutStr = session.heureDebut.replace(':', 'h');
        const heureFinStr = session.heureFin.replace(':', 'h');

        if (session.dateDebut.toDateString() === session.dateFin.toDateString()) {
            return `${debutStr} de ${heureDebutStr} à ${heureFinStr}`;
        }

        return `Du ${debutStr} ${heureDebutStr} au ${finStr} ${heureFinStr}`;
    }

    // Ancien format : utiliser periodeDebut/periodeFin (compatibilité)
    const periodeDebut = PERIODE_LABELS[session.periodeDebut] || '';
    const periodeFin = PERIODE_LABELS[session.periodeFin] || '';

    if (session.dateDebut.toDateString() === session.dateFin.toDateString()) {
        if (session.periodeDebut === 'journee') {
            return `${debutStr} (journée complète)`;
        }
        if (session.periodeDebut === session.periodeFin) {
            return `${debutStr} (${periodeDebut.toLowerCase()})`;
        }
        return `${debutStr} (${periodeDebut.toLowerCase()} et ${periodeFin.toLowerCase()})`;
    }

    return `Du ${debutStr} (${periodeDebut.toLowerCase()}) au ${finStr} (${periodeFin.toLowerCase()})`;
}

/**
 * Convertit une session en dates ISO pour les événements
 * @param {Object} session
 * @returns {{dateDebut: string, dateFin: string}} Dates au format ISO
 */
function sessionToEventDates(session) {
    const { dateDebut, dateFin, periodeDebut, periodeFin, heureDebut, heureFin } = session;

    let horaireDebut, horaireFin;

    // Nouveau format : utiliser directement heureDebut/heureFin si présents
    if (heureDebut && heureFin) {
        horaireDebut = heureDebut;
        horaireFin = heureFin;
    }
    // Ancien format : utiliser periodeDebut/periodeFin
    else if (periodeDebut && periodeFin) {
        if (periodeDebut === 'personnalise' && heureDebut) {
            horaireDebut = heureDebut;
        } else {
            horaireDebut = getPeriodeHours(periodeDebut).heureDebut;
        }

        if (periodeFin === 'personnalise' && heureFin) {
            horaireFin = heureFin;
        } else {
            horaireFin = getPeriodeHours(periodeFin).heureFin;
        }
    }
    // Par défaut : journée complète
    else {
        horaireDebut = '09:00';
        horaireFin = '17:00';
    }

    // Créer les dates avec les heures
    const [heureD, minuteD] = horaireDebut.split(':');
    const [heureF, minuteF] = horaireFin.split(':');

    const dateDebutComplete = new Date(dateDebut);
    dateDebutComplete.setHours(parseInt(heureD), parseInt(minuteD), 0, 0);

    const dateFinComplete = new Date(dateFin);
    dateFinComplete.setHours(parseInt(heureF), parseInt(minuteF), 0, 0);

    return {
        dateDebut: dateDebutComplete.toISOString(),
        dateFin: dateFinComplete.toISOString()
    };
}

/**
 * Calcule le nombre total de jours d'une session
 * @param {Object} session
 * @returns {number} Nombre de jours (avec demi-journées: 0.5, 1, 1.5, etc.)
 */
function calculateSessionDuration(session) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const { dateDebut, dateFin } = sessionToEventDates(session);

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    // Calculer la différence en heures
    const heures = (fin - debut) / (1000 * 60 * 60);

    // Convertir en jours (7h = 1 jour)
    return Math.round((heures / 7) * 10) / 10;
}

/**
 * Valide qu'une session est correcte
 * @param {Object} session
 * @returns {{valid: boolean, error: string|null}}
 */
function validateSession(session) {
    if (!session.dateDebut || !session.dateFin) {
        return { valid: false, error: 'Les dates de début et fin sont requises' };
    }

    // Compatibilité: accepter soit l'ancien format (periodeDebut/periodeFin) soit le nouveau (heureDebut/heureFin)
    const hasOldFormat = session.periodeDebut && session.periodeFin;
    const hasNewFormat = session.heureDebut && session.heureFin;

    if (!hasOldFormat && !hasNewFormat) {
        return { valid: false, error: 'Les heures de début et fin sont requises' };
    }

    const { dateDebut, dateFin } = sessionToEventDates(session);
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    if (debut >= fin) {
        return { valid: false, error: 'La date de fin doit être postérieure à la date de début' };
    }

    return { valid: true, error: null };
}

/**
 * Génère un résumé textuel de toutes les sessions (pour le champ periode_souhaitee)
 * @param {Array} sessions
 * @returns {string}
 */
function generateSessionsSummary(sessions) {
    if (!sessions || sessions.length === 0) {
        return '';
    }

    if (sessions.length === 1) {
        return formatSessionDetailled(sessions[0]);
    }

    return sessions.map((session, index) =>
        `Session ${index + 1}: ${formatSessionDetailled(session)}`
    ).join(' | ');
}

// Export global
window.SessionUtils = {
    PERIODES_HORAIRES,
    PERIODE_LABELS,
    PERIODE_SHORT_LABELS,
    getPeriodeHours,
    formatDateShort,
    formatSessionDisplay,
    formatSessionDetailled,
    sessionToEventDates,
    calculateSessionDuration,
    validateSession,
    generateSessionsSummary
};
