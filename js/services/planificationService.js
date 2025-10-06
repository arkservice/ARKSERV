// Service pour la gestion de la logique de planification des sessions
function usePlanificationService() {
    const { useState, useEffect, useCallback } = React;
    const supabase = window.supabaseConfig.client;
    const { autoCompletePlanificationTask, resetDocumentGenerationTask } = window.useTasks();
    const { getUsersByEntreprise } = window.useUsers();
    const { getSessionsForProject } = window.useProjectSessions();

    // États spécifiques à la planification
    const [numberOfSessions, setNumberOfSessions] = useState(1);
    const [sessions, setSessions] = useState([]);
    const [savingSessions, setSavingSessions] = useState(false);
    const [formateurs, setFormateurs] = useState([]);
    const [entrepriseUsers, setEntrepriseUsers] = useState([]);
    const [durationWarning, setDurationWarning] = useState(null);
    const [editingSession, setEditingSession] = useState(null);
    const [projectSessions, setProjectSessions] = useState([]);
    const [globalStagiaires, setGlobalStagiaires] = useState([]);
    const [globalStagiaireIds, setGlobalStagiaireIds] = useState([]);

    // Fonction pour récupérer la liste des formateurs
    const fetchFormateurs = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('user_profile')
                .select('id, prenom, nom, fonction:fonction_id(nom)')
                .not('fonction_id', 'is', null);
            
            if (error) throw error;
            
            // Filtrer les formateurs
            const formateursList = data.filter(user => 
                user.fonction && user.fonction.nom && 
                user.fonction.nom.toLowerCase().includes('formateur')
            );
            
            setFormateurs(formateursList);
            return formateursList;
        } catch (err) {
            console.error('Erreur lors du chargement des formateurs:', err);
            return [];
        }
    }, []);

    // Fonction pour récupérer les utilisateurs de l'entreprise
    const fetchEntrepriseUsers = useCallback(async (entrepriseId) => {
        try {
            if (!entrepriseId) return [];
            
            const users = await getUsersByEntreprise(entrepriseId);
            setEntrepriseUsers(users);
            return users;
        } catch (err) {
            console.error('Erreur lors du chargement des utilisateurs d\'entreprise:', err);
            return [];
        }
    }, [getUsersByEntreprise]);

    // Fonction pour charger les sessions du projet
    const loadProjectSessions = useCallback(async (projectId) => {
        try {
            if (projectId) {
                const sessionsData = await getSessionsForProject(projectId);
                setProjectSessions(sessionsData || []);
                return sessionsData || [];
            } else {
                setProjectSessions([]);
                return [];
            }
        } catch (error) {
            console.error('Erreur lors du chargement des sessions:', error);
            setProjectSessions([]);
            return [];
        }
    }, [getSessionsForProject]);

    // Fonction pour charger les sessions existantes depuis la base de données
    const loadExistingSessions = useCallback(async (tacheData) => {
        try {
            if (!tacheData?.project?.id) return;
            
            console.log('🔍 Chargement des sessions existantes pour projet:', tacheData.project.id);
            
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
                .eq('projet_id', tacheData.project.id)
                .eq('type_evenement', 'formation')
                .order('date_debut', { ascending: true });
            
            if (error) {
                console.error('Erreur lors du chargement des sessions:', error);
                return;
            }
            
            if (!events || events.length === 0) {
                console.log('Aucune session existante trouvée');
                return;
            }
            
            console.log('✅ Sessions trouvées:', events);
            
            // Fonction pour extraire les informations du titre de session multi-jours
            const parseSessionTitle = (title) => {
                const multiDayPattern = /^(.+?)\s*-\s*Jour\s+(\d+)\/(\d+)$/;
                const match = title.match(multiDayPattern);
                
                if (match) {
                    return {
                        baseTitle: match[1].trim(),
                        dayIndex: parseInt(match[2]),
                        totalDays: parseInt(match[3]),
                        isMultiDay: true
                    };
                }
                
                return {
                    baseTitle: title,
                    dayIndex: 1,
                    totalDays: 1,
                    isMultiDay: false
                };
            };
            
            // Grouper les événements par session multi-jours
            const sessionGroups = new Map();
            
            for (const event of events) {
                const titleInfo = parseSessionTitle(event.titre);
                const groupKey = `${event.user_id}-${titleInfo.baseTitle}`;
                
                if (!sessionGroups.has(groupKey)) {
                    sessionGroups.set(groupKey, {
                        events: [],
                        formateurId: event.user_id,
                        formateurNom: event.user_profile ? `${event.user_profile.prenom} ${event.user_profile.nom}` : 'Formateur inconnu',
                        baseTitle: titleInfo.baseTitle,
                        totalDays: titleInfo.totalDays,
                        isMultiDay: titleInfo.isMultiDay
                    });
                }
                
                sessionGroups.get(groupKey).events.push({
                    ...event,
                    dayIndex: titleInfo.dayIndex
                });
            }
            
            // Transformer les groupes en sessions
            const loadedSessions = [];
            let sessionNumber = 1;
            
            for (const [groupKey, group] of sessionGroups) {
                // Utiliser les fonctions utilitaires centralisées pour le tri des dates
                group.events.sort((a, b) => {
                    if (window.DateUtils && window.DateUtils.compareDatesSafe) {
                        return window.DateUtils.compareDatesSafe(a.date_debut, b.date_debut);
                    } else {
                        // Fallback si DateUtils n'est pas disponible
                        return new Date(a.date_debut) - new Date(b.date_debut);
                    }
                });
                
                const firstEvent = group.events[0];
                const lastEvent = group.events[group.events.length - 1];
                
                let typeLieu = 'distance';
                let adresse = '';
                if (firstEvent.lieu && firstEvent.lieu !== 'À distance') {
                    typeLieu = 'site';
                    adresse = firstEvent.lieu;
                }
                
                // Récupérer les noms des stagiaires
                let stagiaireNoms = [];
                if (firstEvent.client_user_id && firstEvent.client_user_id.length > 0) {
                    const { data: stagiaires } = await supabase
                        .from('user_profile')
                        .select('id, prenom, nom')
                        .in('id', firstEvent.client_user_id);
                    
                    if (stagiaires) {
                        stagiaireNoms = stagiaires.map(s => `${s.prenom} ${s.nom}`);
                    }
                }
                
                const session = {
                    sessionNumber: sessionNumber++,
                    eventId: firstEvent.id,
                    eventIds: group.events.map(e => e.id),
                    dateDebut: firstEvent.date_debut,
                    dateFin: lastEvent.date_fin,
                    formateurId: group.formateurId,
                    formateurNom: group.formateurNom,
                    duration: group.totalDays,
                    typeLieu: typeLieu,
                    adresse: adresse,
                    stagiaireIds: firstEvent.client_user_id || [],
                    stagiaireNoms: stagiaireNoms,
                    lieu: firstEvent.lieu || 'À définir',
                    isMultiDay: group.isMultiDay
                };
                
                loadedSessions.push(session);
            }
            
            // Mettre à jour les states
            setSessions(loadedSessions);
            setNumberOfSessions(loadedSessions.length);
            
        } catch (err) {
            console.error('Erreur lors du chargement des sessions existantes:', err);
        }
    }, []);

    // Fonction pour mettre à jour les données d'une session
    const updateSessionData = useCallback(async (sessionNumber, field, value) => {
        if (field === 'duration') {
            const currentSession = sessions.find(s => s.sessionNumber === sessionNumber);
            const previousDuration = currentSession?.duration;
            
            // Si la durée change et qu'il y a des données de planification existantes
            if (previousDuration !== undefined && previousDuration !== value && 
                currentSession && (currentSession.eventId || currentSession.eventIds || 
                currentSession.dateDebut || currentSession.formateurNom)) {
                
                const resetSuccess = await resetSessionOnDurationChange(sessionNumber, previousDuration, value);
                if (!resetSuccess) {
                    // L'utilisateur a annulé, ne pas mettre à jour la durée
                    console.log(`❌ Changement de durée annulé pour session ${sessionNumber}`);
                    return false;
                }
                // Le reset a réussi, la durée a déjà été mise à jour dans resetSessionOnDurationChange
                return true;
            }
        }
        
        setSessions(prev => {
            const existingIndex = prev.findIndex(s => s.sessionNumber === sessionNumber);
            let sessionData = { sessionNumber, [field]: value };
            
            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], ...sessionData };
                return updated;
            } else {
                sessionData = {
                    ...sessionData,
                    stagiaireIds: globalStagiaireIds,
                    stagiaireNoms: globalStagiaires
                };
                return [...prev, sessionData];
            }
        });
        
        if (field === 'duration') {
            setTimeout(() => validateSessionDurations(), 0);
        }
    }, [sessions, globalStagiaireIds, globalStagiaires]);

    // Fonction pour réinitialiser toutes les sessions lors du changement de nombre
    const resetAllSessionsOnCountChange = useCallback(async (newCount, currentSessions, projectId) => {
        console.log(`🔄 [resetAllSessionsOnCountChange] Changement ${currentSessions.length} → ${newCount} sessions`);
        
        try {
            // Vérifier s'il y a des sessions programmées
            const programmedSessions = currentSessions.filter(session => 
                session.dateDebut && session.formateurNom
            );
            
            if (programmedSessions.length > 0) {
                const confirmation = window.confirm(
                    `⚠️ Attention !\n\n` +
                    `${programmedSessions.length} session(s) sont déjà programmée(s) avec des dates et formateurs.\n\n` +
                    `Changer le nombre de sessions va SUPPRIMER toute la planification existante.\n\n` +
                    `Voulez-vous vraiment continuer ?`
                );
                
                if (!confirmation) {
                    console.log('❌ Reset annulé par l\'utilisateur');
                    return false; // Annulation
                }
            }
            
            console.log('🗑️ Suppression de tous les événements existants...');
            
            // Supprimer tous les événements de formation du projet
            const { error: deleteError } = await supabase
                .from('evenement')
                .delete()
                .eq('projet_id', projectId)
                .eq('type_evenement', 'formation');
            
            if (deleteError) {
                console.error('❌ Erreur lors de la suppression des événements:', deleteError);
                throw deleteError;
            }
            
            console.log('✅ Tous les événements supprimés');
            
            // Réinitialiser complètement les sessions
            const newSessions = Array.from({ length: newCount }, (_, index) => ({
                sessionNumber: index + 1,
                stagiaireIds: globalStagiaireIds,
                stagiaireNoms: globalStagiaires,
                // Tous les autres champs sont undefined par défaut
            }));
            
            setSessions(newSessions);
            setEditingSession(null);
            
            console.log(`✅ ${newCount} session(s) réinitialisée(s)`);
            return true; // Succès
            
        } catch (error) {
            console.error('❌ Erreur lors du reset des sessions:', error);
            alert('Erreur lors de la réinitialisation des sessions: ' + error.message);
            return false;
        }
    }, [globalStagiaireIds, globalStagiaires]);

    // Fonction pour réinitialiser une session lors du changement de durée
    const resetSessionOnDurationChange = useCallback(async (sessionNumber, previousDuration, newDuration) => {
        console.log(`🔄 [resetSessionOnDurationChange] Session ${sessionNumber}: ${previousDuration} → ${newDuration} jours`);
        
        try {
            const currentSession = sessions.find(s => s.sessionNumber === sessionNumber);
            if (!currentSession) {
                console.log(`⚠️ Session ${sessionNumber} non trouvée`);
                return false;
            }
            
            // Vérifier si la session est déjà programmée
            const isSessionProgrammed = currentSession.dateDebut && currentSession.formateurNom;
            
            if (isSessionProgrammed) {
                const confirmation = window.confirm(
                    `⚠️ Attention !\n\n` +
                    `La session ${sessionNumber} est déjà programmée avec :\n` +
                    `• Dates : ${window.DateUtils && window.DateUtils.formatDateRangeSafe 
                        ? window.DateUtils.formatDateRangeSafe(currentSession.dateDebut, currentSession.dateFin)
                        : `${new Date(currentSession.dateDebut).toLocaleDateString('fr-FR')} - ${new Date(currentSession.dateFin).toLocaleDateString('fr-FR')}`}\n` +
                    `• Formateur : ${currentSession.formateurNom}\n\n` +
                    `Changer la durée va SUPPRIMER cette planification.\n\n` +
                    `Voulez-vous vraiment continuer ?`
                );
                
                if (!confirmation) {
                    console.log(`❌ Reset de la session ${sessionNumber} annulé par l'utilisateur`);
                    return false; // Annulation - la durée ne change pas
                }
            }
            
            console.log(`🗑️ Suppression des événements de la session ${sessionNumber}...`);
            
            // Supprimer les événements existants (batch delete optimisé)
            const eventIdsToDelete = [];
            if (currentSession.eventIds && currentSession.eventIds.length > 0) {
                eventIdsToDelete.push(...currentSession.eventIds);
            } else if (currentSession.eventId) {
                eventIdsToDelete.push(currentSession.eventId);
            }
            
            if (eventIdsToDelete.length > 0) {
                const { error: deleteError } = await supabase
                    .from('evenement')
                    .delete()
                    .in('id', eventIdsToDelete);
                    
                if (deleteError) {
                    console.error('❌ Erreur lors de la suppression des événements:', deleteError);
                    throw deleteError;
                }
                
                console.log(`✅ ${eventIdsToDelete.length} événement(s) supprimé(s)`);
            }
            
            // Réinitialiser la session
            setSessions(prev => {
                const updated = [...prev];
                const sessionIndex = updated.findIndex(s => s.sessionNumber === sessionNumber);
                
                if (sessionIndex >= 0) {
                    updated[sessionIndex] = {
                        sessionNumber,
                        duration: newDuration,
                        stagiaireIds: globalStagiaireIds,
                        stagiaireNoms: globalStagiaires,
                        // Tous les autres champs de planification sont remis à undefined
                        dateDebut: undefined,
                        dateFin: undefined,
                        formateurId: undefined,
                        formateurNom: undefined,
                        eventId: undefined,
                        eventIds: undefined,
                        lieu: undefined,
                        slot: undefined,
                        typeLieu: undefined,
                        adresse: undefined
                    };
                    
                    console.log(`✅ Session ${sessionNumber} réinitialisée avec durée ${newDuration}j`);
                }
                
                return updated;
            });
            
            // Annuler l'édition en cours si c'est cette session
            if (editingSession === sessionNumber) {
                setTimeout(() => {
                    setEditingSession(null);
                }, 0);
            }
            
            return true; // Succès
            
        } catch (error) {
            console.error('❌ Erreur lors de la réinitialisation de la session:', error);
            alert(`Erreur lors de la réinitialisation de la session ${sessionNumber}: ${error.message}`);
            return false;
        }
    }, [sessions, globalStagiaireIds, globalStagiaires, editingSession]);

    // Fonction pour valider les durées des sessions
    const validateSessionDurations = useCallback((tache) => {
        if (!tache?.project?.pdc?.duree_en_jour) return;
        
        const pdcDuration = parseFloat(tache.project.pdc.duree_en_jour);
        const explicitSessions = sessions.filter(session => 
            session.duration !== undefined && session.duration > 0
        );
        
        if (explicitSessions.length === 0) {
            setDurationWarning(null);
            return;
        }
        
        const totalDuration = explicitSessions.reduce((sum, session) => sum + session.duration, 0);
        
        if (totalDuration !== pdcDuration) {
            const difference = Math.abs(totalDuration - pdcDuration);
            setDurationWarning({
                type: totalDuration > pdcDuration ? 'exceed' : 'insufficient',
                totalDuration,
                pdcDuration,
                difference,
                definedSessions: explicitSessions.length,
                totalSessions: numberOfSessions
            });
        } else {
            setDurationWarning(null);
        }
    }, [sessions, numberOfSessions]);

    // Gestion des stagiaires globaux
    const updateGlobalStagiaires = useCallback((ids, names) => {
        setGlobalStagiaireIds(ids);
        setGlobalStagiaires(names);
        
        // Mettre à jour toutes les sessions existantes avec les nouveaux stagiaires
        setSessions(currentSessions => 
            currentSessions.map(session => ({
                ...session,
                stagiaireIds: ids,
                stagiaireNoms: names
            }))
        );
    }, []);

    // Gestion de l'édition des sessions
    const startEditSession = useCallback((sessionNumber) => {
        console.log(`🖊️ Début de la modification de la session ${sessionNumber}`);
        setEditingSession(sessionNumber);
    }, []);

    const cancelEditSession = useCallback(() => {
        console.log('❌ Annulation de la modification de session');
        setEditingSession(null);
    }, []);

    const handleSessionModified = useCallback(async (sessionNumber, modifiedSessionData, tache, loadExistingSessions) => {
        try {
            console.log(`✅ Session ${sessionNumber} modifiée:`, modifiedSessionData);
            
            // Mettre à jour les données de la session
            updateSessionData(sessionNumber, 'dateDebut', modifiedSessionData.dateDebut);
            updateSessionData(sessionNumber, 'dateFin', modifiedSessionData.dateFin);
            updateSessionData(sessionNumber, 'formateurId', modifiedSessionData.formateurId);
            updateSessionData(sessionNumber, 'formateurNom', modifiedSessionData.formateurNom);
            updateSessionData(sessionNumber, 'eventId', modifiedSessionData.eventId);
            updateSessionData(sessionNumber, 'eventIds', modifiedSessionData.eventIds);
            
            setEditingSession(null);
            
            // Recharger les sessions pour s'assurer de la cohérence
            if (tache?.project?.id) {
                await loadExistingSessions(tache);
                
                // Remettre la tâche "Génération documents" en statut "todo" car les sessions ont changé
                try {
                    await resetDocumentGenerationTask(tache.project.id);
                    console.log('📋 Tâche "Génération documents" remise en statut "todo" après modification de session');
                } catch (resetError) {
                    console.warn('Erreur lors de la remise à zéro de la tâche Génération documents:', resetError);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la modification de session:', error);
        }
    }, [updateSessionData, resetDocumentGenerationTask]);

    // Fonction pour sauvegarder les sessions
    const saveSessionsToDatabase = useCallback(async (tache) => {
        setSavingSessions(true);
        try {
            if (durationWarning) {
                alert(`Impossible de planifier les sessions : ${durationWarning.type === 'exceed' ? 'La durée totale dépasse' : 'La durée totale est insuffisante par rapport à'} celle du PDC.`);
                setSavingSessions(false);
                return false;
            }
            
            const sessionsToSave = sessions.filter(session => 
                session.dateDebut && session.dateFin && session.formateurId && 
                session.typeLieu && session.stagiaireIds && session.stagiaireIds.length > 0
            );
            
            if (sessionsToSave.length === 0) {
                alert('Veuillez réserver au moins une session avec un formateur.');
                return false;
            }
            
            // Mettre à jour chaque événement
            for (const session of sessionsToSave) {
                const lieuFinal = session.typeLieu === 'distance' ? 'À distance' : 
                                 session.typeLieu === 'site' ? session.adresse : 'À définir';
                
                if (session.eventId) {
                    await supabase
                        .from('evenement')
                        .update({
                            lieu: lieuFinal,
                            client_user_id: session.stagiaireIds
                        })
                        .eq('id', session.eventId);
                }
            }
            
            // Synchroniser les stagiaires du projet
            const allStagiaires = [...new Set(sessionsToSave.flatMap(session => session.stagiaireIds || []))];
            
            await supabase
                .from('projects')
                .update({ stagiaires: allStagiaires })
                .eq('id', tache.project.id);
            
            // Synchroniser les informations du projet avec les sessions (lieu et période)
            if (window.projectUtils) {
                console.log('🔄 Synchronisation des informations du projet...');
                await window.projectUtils.synchronizeProjectLieu(tache.project.id, sessionsToSave, supabase);
                await window.projectUtils.synchronizeProjectPeriode(tache.project.id, sessionsToSave, supabase);
                console.log('✅ Synchronisation terminée');
            }
            
            // Marquer la tâche comme terminée
            const totalStagiaires = sessionsToSave.reduce((total, session) => 
                total + (session.stagiaireIds ? session.stagiaireIds.length : 0), 0
            );
            
            await supabase
                .from('tasks')
                .update({ 
                    status: 'completed',
                    description: `Planification terminée. ${sessionsToSave.length} session(s) de formation planifiée(s) pour ${totalStagiaires} stagiaire(s).`,
                    updated_at: new Date().toISOString()
                })
                .eq('id', tache.id);
            
            // Remettre la tâche "Génération documents" en statut "todo" car les sessions ont été modifiées
            try {
                await resetDocumentGenerationTask(tache.project.id);
                console.log('📋 Tâche "Génération documents" remise en statut "todo" après sauvegarde des sessions');
            } catch (resetError) {
                console.warn('Erreur lors de la remise à zéro de la tâche Génération documents:', resetError);
            }
            
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des sessions:', error);
            alert('Erreur lors de la planification des sessions: ' + error.message);
            return false;
        } finally {
            setSavingSessions(false);
        }
    }, [sessions, durationWarning, resetDocumentGenerationTask]);

    // Fonction pour terminer la planification
    const completePlanification = useCallback(async (tache, onNavigateToProject, setTache) => {
        if (!tache?.project?.id) {
            alert('Impossible de terminer : projet non trouvé');
            return;
        }
        
        const success = await saveSessionsToDatabase(tache);
        if (!success) return;
        
        try {
            await autoCompletePlanificationTask(tache.project.id);
            
            if (onNavigateToProject) {
                setTimeout(() => {
                    onNavigateToProject(tache.project.id);
                }, 2000);
            }
            
            setTache(prev => ({
                ...prev,
                status: 'completed',
                description: `Planification terminée. ${sessions.length} session(s) de formation planifiée(s).`,
                updated_at: new Date().toISOString()
            }));
            
        } catch (error) {
            console.error('Erreur lors de la finalisation:', error);
        }
    }, [saveSessionsToDatabase, autoCompletePlanificationTask, sessions]);

    // Nettoie les sessions supprimées quand numberOfSessions diminue
    useEffect(() => {
        setSessions(prevSessions => {
            return prevSessions.filter(session => session.sessionNumber <= numberOfSessions);
        });
    }, [numberOfSessions]);

    // Fonction pour réinitialiser les états
    const resetPlanificationState = useCallback(() => {
        setNumberOfSessions(1);
        setSessions([]);
        setSavingSessions(false);
        setFormateurs([]);
        setEntrepriseUsers([]);
        setDurationWarning(null);
        setEditingSession(null);
        setProjectSessions([]);
        setGlobalStagiaires([]);
        setGlobalStagiaireIds([]);
    }, []);

    return {
        // États
        numberOfSessions,
        sessions,
        savingSessions,
        formateurs,
        entrepriseUsers,
        durationWarning,
        editingSession,
        projectSessions,
        globalStagiaires,
        globalStagiaireIds,
        
        // Actions
        setNumberOfSessions,
        setSessions,
        setSavingSessions,
        setFormateurs,
        setEntrepriseUsers,
        setDurationWarning,
        setEditingSession,
        setProjectSessions,
        setGlobalStagiaires,
        setGlobalStagiaireIds,
        
        // Fonctions
        fetchFormateurs,
        fetchEntrepriseUsers,
        loadProjectSessions,
        loadExistingSessions,
        updateSessionData,
        resetSessionOnDurationChange,
        resetAllSessionsOnCountChange,
        validateSessionDurations,
        updateGlobalStagiaires,
        startEditSession,
        cancelEditSession,
        handleSessionModified,
        saveSessionsToDatabase,
        completePlanification,
        resetPlanificationState
    };
}

// Export global
window.usePlanificationService = usePlanificationService;