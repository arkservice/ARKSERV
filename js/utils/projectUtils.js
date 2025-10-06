// Utilitaires pour la gestion des projets de formation
console.log("🔥 [CHARGEMENT] projectUtils.js CHARGÉ!");

/**
 * Formate le lieu du projet basé sur les sessions de formation
 * @param {Array} sessions - Array des sessions avec leurs lieux
 * @returns {string} Lieu formaté pour le champ lieu_projet
 */
function formatLieuProjet(sessions) {
    console.log('🏢 [formatLieuProjet] Formatage du lieu pour', sessions.length, 'session(s)');
    
    if (!sessions || sessions.length === 0) {
        console.log('⚠️ [formatLieuProjet] Aucune session fournie');
        return '';
    }
    
    // Filtrer les sessions avec des lieux valides (accepter "À distance" mais pas "À définir")
    const sessionsAvecLieu = sessions.filter(session => 
        session.lieu && session.lieu.trim() !== '' && session.lieu !== 'À définir'
    );
    
    console.log('🔍 [formatLieuProjet] Sessions avec lieu valide:', sessionsAvecLieu.map(s => `${s.sessionNumber || 'N/A'}: ${s.lieu}`));
    
    if (sessionsAvecLieu.length === 0) {
        console.log('⚠️ [formatLieuProjet] Aucune session avec lieu défini');
        return 'À définir';
    }
    
    // Si une seule session ou toutes les sessions ont le même lieu
    if (sessionsAvecLieu.length === 1) {
        const lieu = sessionsAvecLieu[0].lieu;
        console.log('🏢 [formatLieuProjet] Une seule session:', lieu);
        return lieu;
    }
    
    // Vérifier si tous les lieux sont identiques
    const premierLieu = sessionsAvecLieu[0].lieu;
    const tousIdentiques = sessionsAvecLieu.every(session => session.lieu === premierLieu);
    
    if (tousIdentiques) {
        console.log('🏢 [formatLieuProjet] Tous les lieux identiques:', premierLieu);
        return premierLieu;
    }
    
    // Plusieurs sessions avec des lieux différents - formater "session X: lieu"
    const lieuxFormattés = sessionsAvecLieu.map((session, index) => {
        const sessionNumber = session.sessionNumber || (index + 1);
        return `session ${sessionNumber}: ${session.lieu}`;
    });
    
    const resultat = lieuxFormattés.join(' ');
    console.log('🏢 [formatLieuProjet] Lieux multiples formatés:', resultat);
    
    return resultat;
}

/**
 * Extrait et formate les lieux depuis les événements de formation
 * @param {Array} events - Array des événements de formation
 * @returns {string} Lieu formaté pour le champ lieu_projet
 */
function formatLieuProjetFromEvents(events) {
    console.log('📅 [formatLieuProjetFromEvents] Formatage depuis', events.length, 'événement(s)');
    
    if (!events || events.length === 0) {
        return '';
    }
    
    // Grouper les événements par session (basé sur le titre)
    const sessionGroups = {};
    
    events.forEach(event => {
        // Extraire le numéro de session du titre "Formation X - Session Y"
        const sessionMatch = event.titre?.match(/Session (\d+)/);
        const sessionNumber = sessionMatch ? parseInt(sessionMatch[1]) : 1;
        
        if (!sessionGroups[sessionNumber]) {
            sessionGroups[sessionNumber] = {
                sessionNumber,
                lieu: event.lieu || 'À définir',
                events: []
            };
        } else {
            // CORRECTION: Mettre à jour le lieu si l'événement actuel a un lieu plus récent/spécifique
            const currentLieu = sessionGroups[sessionNumber].lieu;
            const eventLieu = event.lieu || 'À définir';
            
            // Priorité : adresse spécifique > "À distance" > "À définir"
            if (currentLieu === 'À définir' || 
                (currentLieu === 'À distance' && eventLieu !== 'À distance' && eventLieu !== 'À définir')) {
                sessionGroups[sessionNumber].lieu = eventLieu;
                console.log(`🔄 [formatLieuProjetFromEvents] Session ${sessionNumber}: lieu mis à jour de "${currentLieu}" vers "${eventLieu}"`);
            }
        }
        
        sessionGroups[sessionNumber].events.push(event);
    });
    
    // Convertir en array de sessions
    const sessions = Object.values(sessionGroups);
    
    console.log('📅 [formatLieuProjetFromEvents] Sessions extraites:', sessions.map(s => `Session ${s.sessionNumber}: ${s.lieu}`));
    
    return formatLieuProjet(sessions);
}

/**
 * Met à jour le champ lieu_projet d'un projet basé sur ses événements de formation
 * @param {string} projectId - ID du projet
 * @param {Object} supabase - Client Supabase
 * @returns {Promise<string|null>} Le lieu formaté ou null en cas d'erreur
 */
async function updateProjectLieuFromEvents(projectId, supabase) {
    try {
        console.log(`🔄 [updateProjectLieuFromEvents] Mise à jour lieu pour projet ${projectId}`);
        
        // Récupérer tous les événements de formation pour ce projet
        const { data: events, error: eventsError } = await supabase
            .from('evenement')
            .select('id, titre, lieu, date_debut')
            .eq('projet_id', projectId)
            .eq('type_evenement', 'formation')
            .order('date_debut', { ascending: true });
        
        if (eventsError) {
            console.error('❌ [updateProjectLieuFromEvents] Erreur récupération événements:', eventsError);
            return null;
        }
        
        if (!events || events.length === 0) {
            console.log('ℹ️ [updateProjectLieuFromEvents] Aucun événement de formation trouvé');
            return null;
        }
        
        console.log('📋 [updateProjectLieuFromEvents] Événements récupérés:', events.map(e => ({
            id: e.id,
            titre: e.titre,
            lieu: e.lieu,
            date: e.date_debut
        })));
        
        // Formater le lieu basé sur les événements
        const lieuFormatté = formatLieuProjetFromEvents(events);
        
        console.log(`🏢 [updateProjectLieuFromEvents] Lieu formaté généré: "${lieuFormatté}"`);
        
        if (!lieuFormatté || lieuFormatté === '') {
            console.log('⚠️ [updateProjectLieuFromEvents] Aucun lieu formaté généré');
            return null;
        }
        
        // Mettre à jour le projet
        const { error: updateError } = await supabase
            .from('projects')
            .update({ lieu_projet: lieuFormatté })
            .eq('id', projectId);
        
        if (updateError) {
            console.error('❌ [updateProjectLieuFromEvents] Erreur mise à jour projet:', updateError);
            return null;
        }
        
        console.log(`✅ [updateProjectLieuFromEvents] Projet ${projectId} mis à jour avec lieu: "${lieuFormatté}"`);
        return lieuFormatté;
        
    } catch (error) {
        console.error('❌ [updateProjectLieuFromEvents] Erreur:', error);
        return null;
    }
}

/**
 * Synchronise le lieu_projet avec les sessions de formation d'un projet
 * Fonction utilitaire qui peut être appelée depuis différents endroits
 * @param {string} projectId - ID du projet
 * @param {Array} sessions - Array des sessions (optionnel, sinon récupéré depuis la DB)
 * @param {Object} supabase - Client Supabase
 * @returns {Promise<boolean>} Succès de la synchronisation
 */
async function synchronizeProjectLieu(projectId, sessions = null, supabase) {
    try {
        console.log(`🔄 [synchronizeProjectLieu] Synchronisation lieu pour projet ${projectId}`);
        
        let lieuFormatté;
        
        if (sessions && sessions.length > 0) {
            // Utiliser les sessions fournies
            lieuFormatté = formatLieuProjet(sessions);
            console.log('📋 [synchronizeProjectLieu] Utilisation des sessions fournies');
        } else {
            // Récupérer et formater depuis les événements
            lieuFormatté = await updateProjectLieuFromEvents(projectId, supabase);
            if (lieuFormatté === null) {
                return false;
            }
            console.log('📅 [synchronizeProjectLieu] Récupération depuis les événements');
        }
        
        if (sessions && sessions.length > 0) {
            // Mettre à jour le projet avec le lieu formaté
            const { error: updateError } = await supabase
                .from('projects')
                .update({ lieu_projet: lieuFormatté })
                .eq('id', projectId);
            
            if (updateError) {
                console.error('❌ [synchronizeProjectLieu] Erreur mise à jour projet:', updateError);
                return false;
            }
            
            console.log(`✅ [synchronizeProjectLieu] Projet ${projectId} synchronisé avec lieu: "${lieuFormatté}"`);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ [synchronizeProjectLieu] Erreur:', error);
        return false;
    }
}

/**
 * Formate une date au format français (DD/MM/YYYY) sans problème de timezone
 * @param {Date|string} date - Date à formater
 * @returns {string} Date formatée
 */
function formatDateFR(date) {
    if (!date) return '';
    
    // Utiliser le nouvel utilitaire DateUtils pour éviter les problèmes de timezone
    if (window.DateUtils && window.DateUtils.formatDateLocaleSafe) {
        return window.DateUtils.formatDateLocaleSafe(date);
    }
    
    // Fallback si DateUtils n'est pas encore chargé
    console.warn('⚠️ [formatDateFR] DateUtils non disponible, utilisation du fallback');
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR');
}

/**
 * Formate une plage de dates au format "du X au Y" sans problème de timezone
 * @param {Date|string} dateDebut - Date de début
 * @param {Date|string} dateFin - Date de fin
 * @returns {string} Plage formatée
 */
function formatDateRange(dateDebut, dateFin) {
    // Utiliser le nouvel utilitaire DateUtils pour éviter les problèmes de timezone
    if (window.DateUtils && window.DateUtils.formatDateRangeSafe) {
        return window.DateUtils.formatDateRangeSafe(dateDebut, dateFin);
    }
    
    // Fallback avec l'ancienne méthode
    console.warn('⚠️ [formatDateRange] DateUtils non disponible, utilisation du fallback');
    const debut = formatDateFR(dateDebut);
    const fin = formatDateFR(dateFin);
    
    if (!debut && !fin) return '';
    if (!fin || debut === fin) return debut;
    return `du ${debut} au ${fin}`;
}

/**
 * Formate la période du projet basée sur les sessions de formation
 * @param {Array} sessions - Array des sessions avec leurs dates
 * @returns {string} Période formatée pour le champ periode_souhaitee
 */
function formatPeriodeProjet(sessions) {
    console.log('📅 [formatPeriodeProjet] Formatage de la période pour', sessions.length, 'session(s)');
    
    if (!sessions || sessions.length === 0) {
        console.log('⚠️ [formatPeriodeProjet] Aucune session fournie');
        return '';
    }
    
    // Filtrer les sessions avec des dates valides
    const sessionsAvecDates = sessions.filter(session => 
        session.dateDebut && session.dateFin
    );
    
    if (sessionsAvecDates.length === 0) {
        console.log('⚠️ [formatPeriodeProjet] Aucune session avec dates définies');
        return 'À définir';
    }
    
    // Si une seule session
    if (sessionsAvecDates.length === 1) {
        const periode = formatDateRange(sessionsAvecDates[0].dateDebut, sessionsAvecDates[0].dateFin);
        console.log('📅 [formatPeriodeProjet] Une seule session:', periode);
        return periode;
    }
    
    // Plusieurs sessions - formater "session X: du Y au Z"
    const periodesFormatées = sessionsAvecDates.map((session, index) => {
        const sessionNumber = session.sessionNumber || (index + 1);
        const periode = formatDateRange(session.dateDebut, session.dateFin);
        return `session ${sessionNumber}: ${periode}`;
    });
    
    const resultat = periodesFormatées.join(', ');
    console.log('📅 [formatPeriodeProjet] Périodes multiples formatées:', resultat);
    
    return resultat;
}

/**
 * Extrait et formate les périodes depuis les événements de formation
 * @param {Array} events - Array des événements de formation
 * @returns {string} Période formatée pour le champ periode_souhaitee
 */
function formatPeriodeProjetFromEvents(events) {
    console.log('📅 [formatPeriodeProjetFromEvents] Formatage depuis', events.length, 'événement(s)');
    
    if (!events || events.length === 0) {
        return '';
    }
    
    // Grouper les événements par session (basé sur le titre)
    const sessionGroups = {};
    
    events.forEach(event => {
        // Extraire le numéro de session du titre "Formation X - Session Y"
        const sessionMatch = event.titre?.match(/Session (\d+)/);
        const sessionNumber = sessionMatch ? parseInt(sessionMatch[1]) : 1;
        
        if (!sessionGroups[sessionNumber]) {
            sessionGroups[sessionNumber] = {
                sessionNumber,
                dateDebut: event.date_debut,
                dateFin: event.date_fin,
                events: []
            };
        }
        
        // Mettre à jour les dates min/max pour la session
        const currentDebut = new Date(sessionGroups[sessionNumber].dateDebut);
        const currentFin = new Date(sessionGroups[sessionNumber].dateFin);
        const eventDebut = new Date(event.date_debut);
        const eventFin = new Date(event.date_fin);
        
        if (eventDebut < currentDebut) {
            sessionGroups[sessionNumber].dateDebut = event.date_debut;
        }
        if (eventFin > currentFin) {
            sessionGroups[sessionNumber].dateFin = event.date_fin;
        }
        
        sessionGroups[sessionNumber].events.push(event);
    });
    
    // Convertir en array de sessions
    const sessions = Object.values(sessionGroups);
    
    console.log('📅 [formatPeriodeProjetFromEvents] Sessions extraites:', 
        sessions.map(s => `Session ${s.sessionNumber}: ${formatDateRange(s.dateDebut, s.dateFin)}`));
    
    return formatPeriodeProjet(sessions);
}

/**
 * Met à jour le champ periode_souhaitee d'un projet basé sur ses événements de formation
 * @param {string} projectId - ID du projet
 * @param {Object} supabase - Client Supabase
 * @returns {Promise<string|null>} La période formatée ou null en cas d'erreur
 */
async function updateProjectPeriodeFromEvents(projectId, supabase) {
    try {
        console.log(`🔄 [updateProjectPeriodeFromEvents] Mise à jour période pour projet ${projectId}`);
        
        // Récupérer tous les événements de formation pour ce projet
        const { data: events, error: eventsError } = await supabase
            .from('evenement')
            .select('id, titre, date_debut, date_fin')
            .eq('projet_id', projectId)
            .eq('type_evenement', 'formation')
            .order('date_debut', { ascending: true });
        
        if (eventsError) {
            console.error('❌ [updateProjectPeriodeFromEvents] Erreur récupération événements:', eventsError);
            return null;
        }
        
        if (!events || events.length === 0) {
            console.log('ℹ️ [updateProjectPeriodeFromEvents] Aucun événement de formation trouvé');
            return null;
        }
        
        // Formater la période basée sur les événements
        const periodeFormatée = formatPeriodeProjetFromEvents(events);
        
        if (!periodeFormatée) {
            console.log('⚠️ [updateProjectPeriodeFromEvents] Aucune période formatée générée');
            return null;
        }
        
        // Mettre à jour le projet
        const { error: updateError } = await supabase
            .from('projects')
            .update({ periode_souhaitee: periodeFormatée })
            .eq('id', projectId);
        
        if (updateError) {
            console.error('❌ [updateProjectPeriodeFromEvents] Erreur mise à jour projet:', updateError);
            return null;
        }
        
        console.log(`✅ [updateProjectPeriodeFromEvents] Projet ${projectId} mis à jour avec période: "${periodeFormatée}"`);
        return periodeFormatée;
        
    } catch (error) {
        console.error('❌ [updateProjectPeriodeFromEvents] Erreur:', error);
        return null;
    }
}

/**
 * Synchronise le periode_souhaitee avec les sessions de formation d'un projet
 * @param {string} projectId - ID du projet
 * @param {Array} sessions - Array des sessions (optionnel, sinon récupéré depuis la DB)
 * @param {Object} supabase - Client Supabase
 * @returns {Promise<boolean>} Succès de la synchronisation
 */
async function synchronizeProjectPeriode(projectId, sessions = null, supabase) {
    try {
        console.log(`🔄 [synchronizeProjectPeriode] Synchronisation période pour projet ${projectId}`);
        
        let periodeFormatée;
        
        if (sessions && sessions.length > 0) {
            // Utiliser les sessions fournies
            periodeFormatée = formatPeriodeProjet(sessions);
            console.log('📋 [synchronizeProjectPeriode] Utilisation des sessions fournies');
        } else {
            // Récupérer et formater depuis les événements
            periodeFormatée = await updateProjectPeriodeFromEvents(projectId, supabase);
            if (periodeFormatée === null) {
                return false;
            }
            console.log('📅 [synchronizeProjectPeriode] Récupération depuis les événements');
        }
        
        if (sessions && sessions.length > 0) {
            // Mettre à jour le projet avec la période formatée
            const { error: updateError } = await supabase
                .from('projects')
                .update({ periode_souhaitee: periodeFormatée })
                .eq('id', projectId);
            
            if (updateError) {
                console.error('❌ [synchronizeProjectPeriode] Erreur mise à jour projet:', updateError);
                return false;
            }
            
            console.log(`✅ [synchronizeProjectPeriode] Projet ${projectId} synchronisé avec période: "${periodeFormatée}"`);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ [synchronizeProjectPeriode] Erreur:', error);
        return false;
    }
}

// Export des fonctions
window.projectUtils = {
    formatLieuProjet,
    formatLieuProjetFromEvents,
    updateProjectLieuFromEvents,
    synchronizeProjectLieu,
    // Nouvelles fonctions pour les périodes
    formatDateFR,
    formatDateRange,
    formatPeriodeProjet,
    formatPeriodeProjetFromEvents,
    updateProjectPeriodeFromEvents,
    synchronizeProjectPeriode
};

console.log('📦 [projectUtils] Fonctions exportées:', Object.keys(window.projectUtils));