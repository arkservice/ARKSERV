/**
 * Utilitaires pour le formatage des sessions de formation
 * Fonctions réutilisables pour formater les sessions pour l'affichage dans les documents
 */

/**
 * Formate une session unique pour l'affichage dans un document
 *
 * @param {Object} session - Objet session
 * @param {Date} session.dateDebut - Date de début de la session
 * @param {Date} session.dateFin - Date de fin de la session
 * @param {string} session.lieu - Lieu de la session
 * @param {number} index - Index de la session (pour le numéro)
 * @param {boolean} includeLieu - Inclure le lieu dans le formatage (défaut: true)
 * @returns {string} Session formatée, ex: "Session 1 : le 15/03/2025 à Paris"
 *
 * @example
 * const session = {
 *   dateDebut: new Date('2025-03-15'),
 *   dateFin: new Date('2025-03-15'),
 *   lieu: 'Paris'
 * };
 * formatSession(session, 0); // "Session 1 : le 15/03/2025 à Paris"
 * formatSession(session, 0, false); // "Session 1 : le 15/03/2025"
 */
function formatSession(session, index, includeLieu = true) {
    console.log(`🔍 [formatSession] Session ${index}:`, session);
    console.log(`🔍 [formatSession] session.dateDebut:`, session?.dateDebut);
    console.log(`🔍 [formatSession] session.dateFin:`, session?.dateFin);

    if (!session) {
        return includeLieu ?
            `Session ${index + 1} : Dates et lieu à définir` :
            `Session ${index + 1} : Dates à définir`;
    }

    const dateDebut = session.dateDebut;
    const dateFin = session.dateFin;
    const lieu = session.lieu || 'Formation à distance';

    console.log(`🔍 [formatSession] dateDebut après extraction:`, dateDebut);
    console.log(`🔍 [formatSession] dateFin après extraction:`, dateFin);

    // Format date : si même jour = "le DD/MM/YYYY", sinon "du DD/MM/YYYY au DD/MM/YYYY"
    let dateText;
    if (dateDebut && dateFin) {
        if (dateDebut.toDateString() === dateFin.toDateString()) {
            dateText = `le ${dateDebut.toLocaleDateString('fr-FR')}`;
        } else {
            dateText = `du ${dateDebut.toLocaleDateString('fr-FR')} au ${dateFin.toLocaleDateString('fr-FR')}`;
        }
    } else {
        console.warn(`⚠️ [formatSession] Dates manquantes pour session ${index}`);
        dateText = 'Dates à définir';
    }

    console.log(`🔍 [formatSession] dateText final:`, dateText);

    // Inclure ou non le lieu selon le paramètre
    if (includeLieu) {
        return `Session ${index + 1} : ${dateText} à ${lieu}`;
    } else {
        return `Session ${index + 1} : ${dateText}`;
    }
}

/**
 * Formate une liste de sessions pour l'affichage
 *
 * @param {Array<Object>} sessions - Tableau de sessions
 * @param {boolean} includeLieu - Inclure le lieu dans le formatage (défaut: true)
 * @param {string} fallbackText - Texte de fallback si aucune session (optionnel)
 * @returns {Array<string>} Tableau de sessions formatées
 *
 * @example
 * const sessions = [
 *   { dateDebut: new Date('2025-03-15'), dateFin: new Date('2025-03-15'), lieu: 'Paris' },
 *   { dateDebut: new Date('2025-03-20'), dateFin: new Date('2025-03-22'), lieu: 'Lyon' }
 * ];
 * formatSessionsList(sessions);
 * // ["Session 1 : le 15/03/2025 à Paris", "Session 2 : du 20/03/2025 au 22/03/2025 à Lyon"]
 * formatSessionsList(sessions, false);
 * // ["Session 1 : le 15/03/2025", "Session 2 : du 20/03/2025 au 22/03/2025"]
 */
function formatSessionsList(sessions, includeLieu = true, fallbackText = 'Dates à définir à Formation à distance') {
    if (!sessions || sessions.length === 0) {
        return [`Session 1 : ${fallbackText}`];
    }

    return sessions.map((session, index) => formatSession(session, index, includeLieu));
}

/**
 * Formate les lieux des sessions pour la convention
 * Format: "Session 1: lieu1, Session 2: lieu2"
 *
 * @param {Array<Object>} sessions - Tableau de sessions
 * @param {string} defaultLieu - Lieu par défaut si non défini
 * @returns {string} String formatée des lieux
 *
 * @example
 * const sessions = [
 *   { lieu: 'Paris' },
 *   { lieu: 'Lyon' },
 *   { lieu: null }
 * ];
 * formatSessionsLocations(sessions);
 * // "Session 1: Paris, Session 2: Lyon, Session 3: à distance"
 */
function formatSessionsLocations(sessions, defaultLieu = 'à distance') {
    if (!sessions || sessions.length === 0) {
        return 'formation à distance ou en présentiel selon modalités';
    }

    const sessionsAvecLieux = sessions
        .map((session, index) => {
            const lieu = session.lieu || defaultLieu;
            return `Session ${index + 1}: ${lieu}`;
        })
        .filter(sessionText => sessionText !== ''); // Supprimer les sessions vides

    if (sessionsAvecLieux.length > 0) {
        return sessionsAvecLieux.join(', ');
    }

    // Fallback: lieux uniques
    const lieuxUniques = [...new Set(sessions.map(s => s.lieu).filter(lieu => lieu))];
    if (lieuxUniques.length > 0) {
        return lieuxUniques.join(' et ');
    }

    return 'formation à distance ou en présentiel selon modalités';
}

/**
 * Formate une session pour l'affichage avec le projet (si pas de sessions détaillées)
 *
 * @param {Object} project - Projet contenant periode_souhaitee et lieu_projet
 * @returns {Array<string>} Tableau avec une session par défaut
 *
 * @example
 * const project = {
 *   periode_souhaitee: 'Mars 2025',
 *   lieu_projet: 'Paris'
 * };
 * formatSessionFromProject(project);
 * // ["Session 1 : Mars 2025 à Paris"]
 */
function formatSessionFromProject(project) {
    if (!project) {
        return ['Session 1 : Dates à définir à Formation à distance'];
    }

    const periode = project.periode_souhaitee || 'Dates à définir';
    const lieu = project.lieu_projet || 'Formation à distance';

    return [`Session 1 : ${periode} à ${lieu}`];
}

/**
 * Obtient le formateur de la première session
 *
 * @param {Array<Object>} sessions - Tableau de sessions
 * @returns {string|null} Nom du formateur ou null
 *
 * @example
 * const sessions = [
 *   { formateur: { nom: 'Jean Dupont' } },
 *   { formateur: { nom: 'Marie Martin' } }
 * ];
 * getFormateurFromSessions(sessions); // "Jean Dupont"
 */
function getFormateurFromSessions(sessions) {
    if (!sessions || sessions.length === 0) {
        return null;
    }

    const premiereSession = sessions[0];
    if (premiereSession && premiereSession.formateur) {
        return premiereSession.formateur.nom || null;
    }

    return null;
}

// Export global pour utilisation dans le projet
if (typeof window !== 'undefined') {
    window.SessionFormatUtils = {
        formatSession,
        formatSessionsList,
        formatSessionsLocations,
        formatSessionFromProject,
        getFormateurFromSessions
    };
}
