console.log("🔥 [CHARGEMENT] useProjectSessions.js CHARGÉ!");

// Hook pour gérer les sessions de formation d'un projet
function useProjectSessions() {
    console.log("🎯 [useProjectSessions] HOOK APPELÉ!");
    const { useState, useEffect, useCallback } = React;
    const supabase = window.supabaseConfig.client;
    
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Fonction pour extraire le numéro de session depuis le titre
    const extractSessionNumber = useCallback((titre) => {
        const match = titre.match(/Session (\d+)/);
        return match ? parseInt(match[1]) : null;
    }, []);
    
    // Fonction pour grouper les sessions logiques basées sur le titre
    const groupSessionsByLogicalSession = useCallback((sessions) => {
        if (!sessions || sessions.length === 0) return [];
        
        // Trier les sessions par date de début
        const sortedSessions = [...sessions].sort((a, b) => a.dateDebut - b.dateDebut);
        
        // Grouper par numéro de session extrait du titre
        const sessionGroups = {};
        
        for (const session of sortedSessions) {
            const sessionNumber = extractSessionNumber(session.titre);
            
            if (sessionNumber === null) {
                // Si on ne peut pas extraire le numéro, traiter comme session indépendante
                sessionGroups[`unknown-${session.id}`] = [session];
                continue;
            }
            
            if (!sessionGroups[sessionNumber]) {
                sessionGroups[sessionNumber] = [];
            }
            sessionGroups[sessionNumber].push(session);
        }
        
        // Créer les sessions groupées
        const groupedSessions = [];
        
        for (const [sessionNumber, events] of Object.entries(sessionGroups)) {
            // Trier les événements de cette session par date
            events.sort((a, b) => a.dateDebut - b.dateDebut);
            
            const firstEvent = events[0];
            const lastEvent = events[events.length - 1];
            
            // Créer une session groupée
            const groupedSession = {
                id: firstEvent.id,
                sessionNumber: sessionNumber.startsWith('unknown-') ? null : parseInt(sessionNumber),
                titre: firstEvent.titre.replace(/ - Jour \d+\/\d+/, ''), // Retirer le suffixe jour
                description: firstEvent.description,
                dateDebut: new Date(firstEvent.dateDebut),
                dateFin: new Date(lastEvent.dateFin),
                lieu: firstEvent.lieu,
                formateur: firstEvent.formateur,
                stagiaires: firstEvent.stagiaires,
                events: events,
                isMultiDay: events.length > 1
            };
            
            groupedSessions.push(groupedSession);
        }
        
        // Trier par numéro de session
        return groupedSessions.sort((a, b) => {
            if (a.sessionNumber === null) return 1;
            if (b.sessionNumber === null) return -1;
            return a.sessionNumber - b.sessionNumber;
        });
    }, [extractSessionNumber]);
    
    
    // Fonction pour récupérer les sessions d'un projet
    const getSessionsForProject = useCallback(async (projectId) => {
        if (!projectId) {
            console.log('❌ [getSessionsForProject] Pas de projectId fourni');
            return [];
        }
        
        try {
            setLoading(true);
            setError(null);
            console.log(`🔍 [getSessionsForProject] Recherche des sessions pour projet ${projectId}`);
            
            // Récupérer les événements de formation liés à ce projet
            const { data: events, error } = await supabase
                .from('evenement')
                .select(`
                    id,
                    titre,
                    description,
                    date_debut,
                    date_fin,
                    lieu,
                    client_user_id,
                    user_id,
                    type_evenement,
                    user_profile:user_id(id, prenom, nom)
                `)
                .eq('projet_id', projectId)
                .eq('type_evenement', 'formation')
                .order('date_debut', { ascending: true });
            
            if (error) {
                console.error('❌ [getSessionsForProject] Erreur lors du chargement des sessions:', error);
                setError(error.message);
                return [];
            }
            
            if (!events || events.length === 0) {
                console.log('ℹ️ [getSessionsForProject] Aucune session trouvée');
                return [];
            }
            
            console.log('✅ [getSessionsForProject] Sessions trouvées:', events);
            
            // Récupérer les données des stagiaires pour tous les événements
            const allStagiaireIds = [...new Set(events.flatMap(event => event.client_user_id || []))];
            let stagiaireMap = {};
            
            if (allStagiaireIds.length > 0) {
                const { data: stagiaireData } = await supabase
                    .from('user_profile')
                    .select('id, prenom, nom')
                    .in('id', allStagiaireIds);
                
                if (stagiaireData) {
                    stagiaireMap = stagiaireData.reduce((acc, stagiaire) => {
                        acc[stagiaire.id] = `${stagiaire.prenom} ${stagiaire.nom}`;
                        return acc;
                    }, {});
                }
            }
            
            // Formater les sessions pour l'affichage
            const formattedSessions = events.map(event => ({
                id: event.id,
                titre: event.titre,
                description: event.description,
                dateDebut: new Date(event.date_debut),
                dateFin: new Date(event.date_fin),
                lieu: event.lieu,
                formateur: event.user_profile ? {
                    id: event.user_profile.id,
                    nom: `${event.user_profile.prenom} ${event.user_profile.nom}`
                } : null,
                // Récupérer les noms des stagiaires depuis client_user_id
                stagiaires: (event.client_user_id || []).map(id => stagiaireMap[id]).filter(Boolean)
            }));
            
            // Grouper les sessions logiques (en évitant de compter les jours multiples comme des sessions séparées)
            const groupedSessions = groupSessionsByLogicalSession(formattedSessions);
            
            setSessions(groupedSessions);
            return groupedSessions;
            
        } catch (err) {
            console.error('❌ [getSessionsForProject] Erreur:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [supabase]);
    
    
    // Fonction pour formater les dates d'affichage
    const formatDateRange = useCallback((dateDebut, dateFin) => {
        const options = { 
            day: 'numeric', 
            month: 'long',
            year: 'numeric'
        };
        
        // Utiliser DateUtils pour éviter les problèmes de timezone
        const debut = window.DateUtils && window.DateUtils.formatDateLocaleSafe 
            ? window.DateUtils.formatDateLocaleSafe(dateDebut)
            : dateDebut.toLocaleDateString('fr-FR', options);
        const fin = window.DateUtils && window.DateUtils.formatDateLocaleSafe 
            ? window.DateUtils.formatDateLocaleSafe(dateFin)
            : dateFin.toLocaleDateString('fr-FR', options);
        
        // Si même jour
        if (dateDebut.toDateString() === dateFin.toDateString()) {
            return debut;
        }
        
        // Si même mois
        if (dateDebut.getMonth() === dateFin.getMonth() && dateDebut.getFullYear() === dateFin.getFullYear()) {
            return `${dateDebut.getDate()} au ${fin}`;
        }
        
        // Dates différentes
        return `${debut} au ${fin}`;
    }, []);
    
    // Fonction pour obtenir un résumé des sessions
    const getSessionsSummary = useCallback((sessions) => {
        if (!sessions || sessions.length === 0) {
            return {
                totalSessions: 0,
                dateRange: null,
                lieux: [],
                stagiaires: [],
                formateurs: []
            };
        }
        
        const allStagiaires = [...new Set(sessions.flatMap(s => s.stagiaires))];
        const allLieux = [...new Set(sessions.map(s => s.lieu).filter(Boolean))];
        const allFormateurs = [...new Set(sessions.map(s => s.formateur?.nom).filter(Boolean))];
        
        const dates = sessions.map(s => s.dateDebut).sort((a, b) => a - b);
        const premierDate = dates[0];
        const derniereDate = dates[dates.length - 1];
        
        // NOUVEAU: Formater le lieu du projet basé sur les sessions
        const lieuProjetFormatté = window.projectUtils ? 
            window.projectUtils.formatLieuProjet(sessions) : 
            (sessions.length === 1 ? sessions[0].lieu : allLieux.join(', '));
        
        return {
            totalSessions: sessions.length,
            dateRange: formatDateRange(premierDate, derniereDate),
            lieux: allLieux,
            stagiaires: allStagiaires,
            formateurs: allFormateurs,
            // NOUVEAU: Lieu formaté pour le projet
            lieuProjetFormatté
        };
    }, [formatDateRange]);
    
    // NOUVELLE FONCTION: Obtenir le lieu formaté pour un projet depuis ses sessions
    const getProjectLieuFromSessions = useCallback(async (projectId) => {
        try {
            console.log(`🏢 [getProjectLieuFromSessions] Récupération lieu formaté pour projet ${projectId}`);
            
            const sessions = await getSessionsForProject(projectId);
            
            if (!sessions || sessions.length === 0) {
                console.log('ℹ️ [getProjectLieuFromSessions] Aucune session trouvée');
                return 'À définir';
            }
            
            const lieuFormatté = window.projectUtils ? 
                window.projectUtils.formatLieuProjet(sessions) : 
                (sessions.length === 1 ? sessions[0].lieu : 'Plusieurs lieux');
            
            console.log(`🏢 [getProjectLieuFromSessions] Lieu formaté: "${lieuFormatté}"`);
            return lieuFormatté;
            
        } catch (error) {
            console.error('❌ [getProjectLieuFromSessions] Erreur:', error);
            return 'Erreur';
        }
    }, [getSessionsForProject]);
    
    return {
        sessions,
        loading,
        error,
        getSessionsForProject,
        getSessionsSummary,
        formatDateRange,
        // NOUVELLE FONCTION
        getProjectLieuFromSessions
    };
}

// Export global
window.useProjectSessions = useProjectSessions;