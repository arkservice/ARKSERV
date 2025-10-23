/**
 * Utilitaires pour la gestion des formations
 * Fonctions réutilisables pour construire les noms de formation et récupérer les stagiaires
 */

/**
 * Construit le nom complet d'une formation à partir des données PDC
 * Format: "Formation [Logiciel] [Version] - [X] jour(s)"
 *
 * @param {Object} pdc - Objet PDC contenant les informations de la formation
 * @param {Object} pdc.logiciel - Objet logiciel avec propriété nom
 * @param {string} pdc.logiciel.nom - Nom du logiciel
 * @param {string} pdc.version_logiciel - Version du logiciel (optionnel)
 * @param {number} pdc.duree_en_jour - Durée de la formation en jours
 * @returns {string} Le nom formaté de la formation
 *
 * @example
 * const pdc = {
 *   logiciel: { nom: 'Inventor' },
 *   version_logiciel: '2025',
 *   duree_en_jour: 5
 * };
 * buildFormationName(pdc); // "Formation Inventor 2025 - 5 jours"
 */
function buildFormationName(pdc) {
    if (!pdc) {
        return 'Formation';
    }

    const logicielNom = pdc.logiciel?.nom || 'Logiciel';
    const version = pdc.version_logiciel ? ` ${pdc.version_logiciel}` : '';
    const duree = pdc.duree_en_jour || 1;
    const jourText = duree > 1 ? 'jours' : 'jour';

    return `Formation ${logicielNom}${version} - ${duree} ${jourText}`;
}

/**
 * Récupère les informations des stagiaires depuis la base de données
 *
 * @param {Array<string>} stagiaire_ids - Tableau d'UUIDs des stagiaires
 * @param {Object} supabase - Client Supabase
 * @returns {Promise<Array<string>>} Tableau de noms formatés "Prénom Nom"
 *
 * @example
 * const stagiaireIds = ['uuid-1', 'uuid-2'];
 * const stagiaires = await fetchStagiaires(stagiaireIds, supabase);
 * // ['Jean Dupont', 'Marie Martin']
 */
async function fetchStagiaires(stagiaire_ids, supabase) {
    // Validation des paramètres
    if (!stagiaire_ids || !Array.isArray(stagiaire_ids) || stagiaire_ids.length === 0) {
        return [];
    }

    if (!supabase) {
        console.warn('⚠️ [formationUtils] Client Supabase non fourni');
        return [];
    }

    try {
        const { data: stagiairesData, error } = await supabase
            .from('user_profile')
            .select('id, prenom, nom')
            .in('id', stagiaire_ids);

        if (error) {
            console.error('❌ [formationUtils] Erreur lors de la récupération des stagiaires:', error);
            return [];
        }

        if (!stagiairesData || stagiairesData.length === 0) {
            console.warn('⚠️ [formationUtils] Aucun stagiaire trouvé pour les IDs fournis');
            return [];
        }

        // Formater les noms: "Prénom Nom"
        return stagiairesData.map(s => `${s.prenom} ${s.nom}`);

    } catch (err) {
        console.error('❌ [formationUtils] Exception lors de la récupération des stagiaires:', err);
        return [];
    }
}

/**
 * Récupère les stagiaires avec une logique de fallback intelligente
 * Essaie d'abord depuis les IDs du projet, puis depuis les sessions
 *
 * @param {Array<string>} projectStagiaireIds - IDs des stagiaires du projet
 * @param {Array<Object>} sessions - Sessions de la formation
 * @param {Object} supabase - Client Supabase
 * @returns {Promise<Array<string>>} Tableau de noms de stagiaires
 */
async function fetchStagiairesWithFallback(projectStagiaireIds, sessions, supabase) {
    // 1. Essayer de récupérer depuis le projet
    let stagiaires = await fetchStagiaires(projectStagiaireIds, supabase);

    // 2. Si aucun stagiaire trouvé, essayer depuis les sessions
    if (stagiaires.length === 0 && sessions && sessions.length > 0) {
        const stagiairesFromSessions = [...new Set(sessions.flatMap(s => s.stagiaires || []))];
        if (stagiairesFromSessions.length > 0) {
            stagiaires = stagiairesFromSessions;
        }
    }

    return stagiaires;
}

// Export global pour utilisation dans le projet
if (typeof window !== 'undefined') {
    window.FormationUtils = {
        buildFormationName,
        fetchStagiaires,
        fetchStagiairesWithFallback
    };
}
