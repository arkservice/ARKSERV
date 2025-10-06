console.log("🔥 [CHARGEMENT] useFormateurs.js CHARGÉ!");

// Hook pour gérer les formateurs et leurs disponibilités
function useFormateurs() {
    console.log("🎯 [useFormateurs] HOOK APPELÉ!");
    const { useState, useEffect, useCallback } = React;
    const supabase = window.supabaseConfig.client;
    
    // ========== FONCTIONS UTILITAIRES TIMEZONE ==========
    // Créer une date/heure en UTC à partir d'une date locale et d'une heure
    const createUTCDateTimeFromLocal = useCallback((localDate, timeString) => {
        // Créer une date dans la timezone locale
        const [hours, minutes] = timeString.split(':').map(Number);
        const dateInLocal = new Date(localDate);
        dateInLocal.setHours(hours, minutes, 0, 0);
        
        // Retourner l'ISO string (qui est en UTC)
        return dateInLocal.toISOString();
    }, []);
    
    // Créer une date/heure locale à partir d'une date et heure (pour affichage)
    const createLocalDateTime = useCallback((date, timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        const localDate = new Date(date);
        localDate.setHours(hours, minutes, 0, 0);
        return localDate;
    }, []);
    
    // Vérifier si on est en heure d'été (CEST) ou hiver (CET) pour la France
    const getTimezoneOffset = useCallback((date) => {
        // En France: UTC+1 (hiver) ou UTC+2 (été)
        const offset = -date.getTimezoneOffset() / 60; // Offset en heures
        return offset;
    }, []);
    
    console.log(`🌍 Timezone actuelle: UTC${getTimezoneOffset(new Date()) >= 0 ? '+' : ''}${getTimezoneOffset(new Date())}`);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Récupérer tous les formateurs avec leurs compétences - VERSION SIMPLE
    const getFormateursByLogiciel = useCallback(async (logicielId) => {
        console.log(`🔍 [getFormateursByLogiciel] DEBUT - Recherche pour logiciel ${logicielId}`);
        
        try {
            setLoading(true);
            setError(null);
            
            // Récupérer les users avec leurs détails complets
            const { data, error } = await supabase
                .from('user_competence')
                .select(`
                    user_id, 
                    niveau,
                    user_profile:user_id (
                        id,
                        prenom,
                        nom,
                        email,
                        avatar,
                        fonction:fonction_id (
                            nom
                        )
                    )
                `)
                .eq('logiciel_id', logicielId);
            
            if (error) {
                console.error('❌ Erreur requête user_competence:', error);
                throw error;
            }
            
            console.log(`✅ Users avec compétences trouvés:`, data);
            
            if (!data || data.length === 0) {
                console.log('⚠️ Aucun user avec compétence pour ce logiciel');
                return [];
            }
            
            // Filtrer uniquement les formateurs (fonction = 'formateur')
            const formateurs = data
                .filter(item => {
                    const isFormateur = item.user_profile?.fonction?.nom === 'formateur';
                    console.log(`👤 User ${item.user_profile?.prenom} ${item.user_profile?.nom} - Fonction: ${item.user_profile?.fonction?.nom} - Est formateur: ${isFormateur}`);
                    return isFormateur;
                })
                .map(item => ({
                    id: item.user_id,
                    prenom: item.user_profile?.prenom || 'Utilisateur',
                    nom: item.user_profile?.nom || 'Inconnu',
                    email: item.user_profile?.email || '',
                    avatar: item.user_profile?.avatar || null,
                    niveau: item.niveau,
                    fonction: item.user_profile?.fonction?.nom
                }));
            
            console.log(`📋 Formateurs qualifiés trouvés:`, formateurs);
            
            // Si aucun formateur officiel, fallback vers tous les utilisateurs compétents
            if (formateurs.length === 0) {
                console.log('⚠️ Aucun formateur officiel, fallback vers tous les utilisateurs compétents');
                const allCompetentUsers = data.map(item => ({
                    id: item.user_id,
                    prenom: item.user_profile?.prenom || 'Utilisateur',
                    nom: item.user_profile?.nom || 'Inconnu',
                    email: item.user_profile?.email || '',
                    avatar: item.user_profile?.avatar || null,
                    niveau: item.niveau,
                    fonction: item.user_profile?.fonction?.nom || 'non définie'
                }));
                console.log(`📋 Utilisateurs compétents (fallback):`, allCompetentUsers);
                return allCompetentUsers;
            }
            
            return formateurs;
        } catch (err) {
            console.error('Erreur lors du chargement des formateurs:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [supabase, createUTCDateTimeFromLocal]);
    
    // Générer tous les créneaux de 30min entre 9h et 17h30
    const generateTimeSlots = useCallback(() => {
        const slots = [];
        for (let hour = 9; hour < 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const endHour = minute === 30 ? hour + 1 : hour;
                const endMinute = minute === 30 ? 0 : minute + 30;
                const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
                
                slots.push({
                    startTime,
                    endTime,
                    display: `${startTime} - ${endTime}`
                });
            }
        }
        // Ajouter le dernier créneau 17h00-17h30
        slots.push({
            startTime: '17:00',
            endTime: '17:30',
            display: '17:00 - 17:30'
        });
        
        return slots;
    }, []);
    
    // Vérifier si un formateur est disponible sur un créneau
    const isFormateurAvailable = useCallback(async (formateurId, date, startTime, endTime) => {
        try {
            // IMPORTANT: Convertir les heures locales en UTC pour comparaison avec la DB
            const startDateTimeUTC = createUTCDateTimeFromLocal(date, startTime);
            const endDateTimeUTC = createUTCDateTimeFromLocal(date, endTime);
            
            // Pour le debug: montrer les conversions
            const startLocal = createLocalDateTime(date, startTime);
            const endLocal = createLocalDateTime(date, endTime);
            
            console.log(`🔍 Vérification disponibilité formateur ${formateurId} pour ${date.toDateString()} ${startTime}-${endTime}`);
            console.log(`🌍 Timezone offset: UTC+${getTimezoneOffset(date)}`);
            console.log(`⏰ Créneau LOCAL: ${startLocal.toLocaleString()} - ${endLocal.toLocaleString()}`);
            console.log(`🌐 Créneau UTC pour DB: ${startDateTimeUTC} - ${endDateTimeUTC}`);
            
            // Vérifier s'il y a des conflits avec les événements existants
            // LOGIQUE CORRIGÉE : Un conflit existe si l'événement existant chevauche avec le nouveau créneau
            // Conflit = (event_start < new_end) AND (event_end > new_start)
            const { data, error } = await supabase
                .from('evenement')
                .select('id, titre, date_debut, date_fin')
                .eq('user_id', formateurId)
                .lt('date_debut', endDateTimeUTC)   // Event starts before new slot ends
                .gt('date_fin', startDateTimeUTC); // Event ends after new slot starts
            
            if (error) throw error;
            
            console.log(`📊 ${data.length} conflit(s) trouvé(s) pour formateur ${formateurId}:`);
            data.forEach(event => {
                console.log(`  - ${event.titre}: ${event.date_debut} → ${event.date_fin}`);
            });
            
            const isAvailable = data.length === 0;
            console.log(`✅ Résultat: Formateur ${formateurId} ${isAvailable ? 'DISPONIBLE' : 'INDISPONIBLE'} pour ${startTime}-${endTime}`);
            
            return isAvailable; // Disponible si aucun conflit
        } catch (err) {
            console.error('Erreur lors de la vérification de disponibilité:', err);
            return false;
        }
    }, [supabase]);
    
    // Obtenir les créneaux disponibles pour une date et un logiciel
    const getAvailableSlots = useCallback(async (logicielId, date) => {
        console.log(`🚀 [getAvailableSlots] APPEL DE LA FONCTION`);
        console.log(`📅 Date: ${date}`);
        console.log(`🔧 Logiciel ID: ${logicielId}`);
        
        try {
            setLoading(true);
            setError(null);
            
            console.log(`Recherche créneaux pour logiciel ${logicielId} le ${date.toDateString()}`);
            
            // Récupérer les formateurs qualifiés
            const formateurs = await getFormateursByLogiciel(logicielId);
            console.log(`Formateurs trouvés:`, formateurs);
            
            if (formateurs.length === 0) {
                console.log('Aucun formateur qualifié trouvé');
                return [];
            }
            
            // Générer tous les créneaux possibles
            const allSlots = generateTimeSlots();
            console.log(`Vérification de ${allSlots.length} créneaux possibles`);
            
            const availableSlots = [];
            
            // Vérifier chaque créneau
            for (const slot of allSlots) {
                const availableFormateurs = [];
                
                // Vérifier la disponibilité de chaque formateur pour ce créneau
                for (const formateur of formateurs) {
                    const isAvailable = await isFormateurAvailable(
                        formateur.id, 
                        date, 
                        slot.startTime, 
                        slot.endTime
                    );
                    
                    if (isAvailable) {
                        availableFormateurs.push(formateur);
                        console.log(`✅ ${formateur.prenom} ${formateur.nom} disponible pour ${slot.display}`);
                    } else {
                        console.log(`❌ ${formateur.prenom} ${formateur.nom} indisponible pour ${slot.display}`);
                    }
                }
                
                // Si au moins un formateur est disponible, ajouter le créneau
                if (availableFormateurs.length > 0) {
                    availableSlots.push({
                        ...slot,
                        availableFormateurs,
                        formateurCount: availableFormateurs.length
                    });
                }
            }
            
            console.log(`Résultat final: ${availableSlots.length} créneaux disponibles`);
            return availableSlots;
        } catch (err) {
            console.error('Erreur lors du calcul des créneaux disponibles:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [getFormateursByLogiciel, generateTimeSlots, isFormateurAvailable]);
    
    // Réserver un créneau avec un formateur
    const bookAppointment = useCallback(async (slot, date, tacheId, projectId, logicielId) => {
        try {
            setLoading(true);
            setError(null);
            
            // Sélectionner le formateur le moins chargé (premier dans la liste pour simplifier)
            const selectedFormateur = slot.availableFormateurs[0];
            
            // Créer les timestamps pour l'événement en UTC
            const startDateTimeUTC = createUTCDateTimeFromLocal(date, slot.startTime);
            const endDateTimeUTC = createUTCDateTimeFromLocal(date, slot.endTime);
            
            console.log(`💾 Création RDV - Conversion timezone:`);
            console.log(`   🌐 UTC: ${startDateTimeUTC} - ${endDateTimeUTC}`);
            console.log(`   🌍 Local: ${new Date(startDateTimeUTC).toLocaleString()} - ${new Date(endDateTimeUTC).toLocaleString()}`);
            
            // Récupérer les informations du logiciel pour le titre
            const { data: logicielData } = await supabase
                .from('logiciel')
                .select('nom')
                .eq('id', logicielId)
                .single();
            
            // Créer l'événement de RDV
            const { data: eventData, error: eventError } = await supabase
                .from('evenement')
                .insert({
                    titre: `RDV Qualification - ${logicielData?.nom || 'Formation'}`,
                    description: `Rendez-vous de qualification avec le formateur pour définir le plan de formation`,
                    date_debut: startDateTimeUTC,
                    date_fin: endDateTimeUTC,
                    user_id: selectedFormateur.id,
                    projet_id: projectId,
                    type_evenement: 'rendez_vous',
                    statut: 'confirme',
                    priorite: 'normale'
                })
                .select()
                .single();
            
            if (eventError) throw eventError;
            
            // Marquer la tâche actuelle comme terminée et mettre à jour sa description
            const newDescription = `RDV le ${new Date(startDateTimeUTC).toLocaleDateString('fr-FR')} à ${slot.startTime} avec le formateur ${selectedFormateur.prenom} ${selectedFormateur.nom}`;
            console.log("🔄 [bookAppointment] Mise à jour de la description de la tâche:", newDescription);
            
            const { error: taskCompleteError } = await supabase
                .from('tasks')
                .update({ 
                    status: 'completed',
                    description: newDescription,
                    updated_at: new Date().toISOString()
                })
                .eq('id', tacheId);
            
            if (taskCompleteError) throw taskCompleteError;
            
            // Mettre à jour la tâche "qualification" existante (chercher sans critère d'assignation)
            console.log("🔄 [bookAppointment] Recherche de la tâche Qualification existante...");
            
            // D'abord chercher la tâche "Qualification" existante
            const { data: existingTask, error: findError } = await supabase
                .from('tasks')
                .select('id, status, assigned_to')
                .eq('project_id', projectId)
                .eq('title', 'Qualification')
                .eq('workflow_order', 2)
                .single();
            
            let taskData;
            if (existingTask) {
                // Mettre à jour la tâche existante
                console.log("✅ [bookAppointment] Tâche Qualification trouvée, mise à jour...", existingTask);
                const { data: updatedTaskData, error: updateTaskError } = await supabase
                    .from('tasks')
                    .update({
                        assigned_to: selectedFormateur.id,
                        description: `Qualifier le client et définir le plan de formation adapté lors du rendez-vous du ${new Date(startDateTimeUTC).toLocaleDateString('fr-FR')} à ${slot.startTime}`,
                        status: 'todo',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingTask.id)
                    .select()
                    .single();
                
                if (updateTaskError) throw updateTaskError;
                taskData = updatedTaskData;
                console.log("✅ [bookAppointment] Tâche Qualification existante mise à jour:", taskData);
            } else {
                // Créer une nouvelle tâche seulement si aucune n'existe
                console.log("⚠️ [bookAppointment] Aucune tâche Qualification trouvée, création d'une nouvelle...");
                const { data: newTaskData, error: newTaskError } = await supabase
                    .from('tasks')
                    .insert({
                        title: 'Qualification',
                        description: `Qualifier le client et définir le plan de formation adapté lors du rendez-vous du ${new Date(startDateTimeUTC).toLocaleDateString('fr-FR')} à ${slot.startTime}`,
                        project_id: projectId,
                        assigned_to: selectedFormateur.id,
                        priority: 'high',
                        status: 'todo',
                        task_type: 'action',
                        workflow_order: 2
                    })
                    .select()
                    .single();
                
                if (newTaskError) throw newTaskError;
                taskData = newTaskData;
                console.log("✅ [bookAppointment] Nouvelle tâche Qualification créée:", taskData);
            }
            
            // Note: La réinitialisation du PDC est gérée dans Layout.js pour éviter les violations de règles des hooks
            console.log("ℹ️ [bookAppointment] RDV créé avec succès, réinitialisation PDC gérée dans Layout.js");
            
            return {
                event: eventData,
                task: taskData,
                formateur: selectedFormateur,
                appointmentDetails: {
                    date: date.toLocaleDateString('fr-FR'),
                    time: slot.display,
                    formateurName: `${selectedFormateur.prenom} ${selectedFormateur.nom}`
                }
            };
            
        } catch (err) {
            console.error('Erreur lors de la réservation:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [supabase, createUTCDateTimeFromLocal]);
    
    // Générer les créneaux pour une session de formation (durée en jours)
    const generateSessionTimeSlots = useCallback((sessionDurationInDays) => {
        const slots = [];
        
        // Pour toute formation (1 jour ou plus), proposer des créneaux journée complète
        slots.push({
            startTime: '09:00',
            endTime: '17:00',
            display: `09:00 - 17:00 (${sessionDurationInDays} jour${sessionDurationInDays > 1 ? 's' : ''})`,
            duration: 7,
            durationInDays: sessionDurationInDays
        });
        
        return slots;
    }, []);
    
    // Vérifier la disponibilité d'un formateur sur plusieurs jours consécutifs
    const isFormateurAvailableMultiDays = useCallback(async (formateurId, dates, startTime, endTime) => {
        try {
            for (const date of dates) {
                const isAvailable = await isFormateurAvailable(formateurId, date, startTime, endTime);
                if (!isAvailable) {
                    return false; // Si indisponible un seul jour, refuser
                }
            }
            return true; // Disponible tous les jours
        } catch (err) {
            console.error('Erreur lors de la vérification multi-jours:', err);
            return false;
        }
    }, [isFormateurAvailable]);

    // Obtenir les créneaux disponibles pour une session de formation (multi-jours)
    const getAvailableSlotsForSession = useCallback(async (logicielId, dates, sessionDuration) => {
        console.log(`🚀 [getAvailableSlotsForSession] APPEL DE LA FONCTION`);
        console.log(`📅 Dates: ${dates.map(d => d.toDateString()).join(', ')}`);
        console.log(`🔧 Logiciel ID: ${logicielId}`);
        console.log(`⏱️ Durée session: ${sessionDuration} jours`);
        
        try {
            setLoading(true);
            setError(null);
            
            console.log(`Recherche créneaux SESSION pour logiciel ${logicielId} sur ${dates.length} jour(s)`);
            
            // Récupérer les formateurs qualifiés
            const formateurs = await getFormateursByLogiciel(logicielId);
            console.log(`Formateurs trouvés:`, formateurs);
            
            if (formateurs.length === 0) {
                console.log('Aucun formateur qualifié trouvé');
                return [];
            }
            
            // Générer les créneaux de session selon la durée
            const sessionSlots = generateSessionTimeSlots(sessionDuration);
            console.log(`Vérification de ${sessionSlots.length} créneaux de session possibles`);
            
            const availableSlots = [];
            
            // Vérifier chaque créneau
            for (const slot of sessionSlots) {
                const availableFormateurs = [];
                
                // Vérifier la disponibilité de chaque formateur pour TOUS les jours
                for (const formateur of formateurs) {
                    const isAvailable = await isFormateurAvailableMultiDays(
                        formateur.id, 
                        dates, 
                        slot.startTime, 
                        slot.endTime
                    );
                    
                    if (isAvailable) {
                        availableFormateurs.push(formateur);
                        console.log(`✅ ${formateur.prenom} ${formateur.nom} disponible pour ${slot.display}`);
                    } else {
                        console.log(`❌ ${formateur.prenom} ${formateur.nom} indisponible pour ${slot.display}`);
                    }
                }
                
                // Si au moins un formateur est disponible, ajouter le créneau
                if (availableFormateurs.length > 0) {
                    availableSlots.push({
                        ...slot,
                        availableFormateurs,
                        formateurCount: availableFormateurs.length
                    });
                }
            }
            
            console.log(`Résultat final: ${availableSlots.length} créneaux de session disponibles`);
            return availableSlots;
        } catch (err) {
            console.error('Erreur lors du calcul des créneaux de session disponibles:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [getFormateursByLogiciel, generateSessionTimeSlots, isFormateurAvailableMultiDays]);
    
    // Réserver un créneau de session avec un formateur (multi-jours)
    const bookSessionAppointment = useCallback(async (slot, dates, sessionNumber, projectId, logicielId) => {
        try {
            setLoading(true);
            setError(null);
            
            // Sélectionner le formateur le moins chargé (premier dans la liste pour simplifier)
            const selectedFormateur = slot.availableFormateurs[0];
            
            // CORRECTION: Récupérer les stagiaires du projet
            console.log(`🔍 [bookSessionAppointment] Récupération des stagiaires du projet ${projectId}`);
            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .select('stagiaires')
                .eq('id', projectId)
                .single();
            
            if (projectError) {
                console.warn('⚠️ [bookSessionAppointment] Erreur lors de la récupération des stagiaires du projet:', projectError);
            }
            
            const stagiaireIds = projectData?.stagiaires || [];
            console.log(`👥 [bookSessionAppointment] Stagiaires trouvés dans le projet:`, stagiaireIds);
            
            // Récupérer les informations du logiciel pour le titre
            const { data: logicielData } = await supabase
                .from('logiciel')
                .select('nom')
                .eq('id', logicielId)
                .single();
            
            const createdEvents = [];
            
            // Créer un événement pour chaque jour
            for (let dayIndex = 0; dayIndex < dates.length; dayIndex++) {
                const currentDate = dates[dayIndex];
                // IMPORTANT: Utiliser la conversion timezone pour sauvegarder en UTC
                const startDateTimeUTC = createUTCDateTimeFromLocal(currentDate, slot.startTime);
                const endDateTimeUTC = createUTCDateTimeFromLocal(currentDate, slot.endTime);
                
                console.log(`💾 Sauvegarde événement jour ${dayIndex + 1}:`);
                console.log(`   🌐 UTC: ${startDateTimeUTC} - ${endDateTimeUTC}`);
                console.log(`   🌍 Local: ${new Date(startDateTimeUTC).toLocaleString()} - ${new Date(endDateTimeUTC).toLocaleString()}`);
                console.log(`   👥 Stagiaires assignés: ${stagiaireIds.length} stagiaire(s)`);
                
                const dayLabel = dates.length > 1 ? ` - Jour ${dayIndex + 1}/${dates.length}` : '';
                
                // Créer l'événement de formation pour ce jour
                const { data: eventData, error: eventError } = await supabase
                    .from('evenement')
                    .insert({
                        titre: `Formation ${logicielData?.nom || 'Logiciel'} - Session ${sessionNumber}${dayLabel}`,
                        description: `Session de formation ${logicielData?.nom || 'logiciel'} avec le formateur`,
                        date_debut: startDateTimeUTC,
                        date_fin: endDateTimeUTC,
                        user_id: selectedFormateur.id,
                        projet_id: projectId,
                        type_evenement: 'formation',
                        statut: 'planifie',
                        priorite: 'normale',
                        lieu: 'À définir',
                        client_user_id: stagiaireIds // CORRECTION: Assigner les stagiaires du projet
                    })
                    .select()
                    .single();
                
                if (eventError) {
                    // En cas d'erreur, annuler tous les événements déjà créés
                    for (const event of createdEvents) {
                        await supabase.from('evenement').delete().eq('id', event.id);
                    }
                    throw eventError;
                }
                
                createdEvents.push(eventData);
            }
            
            // NOUVEAU: Synchroniser le lieu et la période du projet après création des événements
            console.log('🔄 [bookSessionAppointment] Synchronisation du lieu et période du projet après création des événements');
            
            if (window.projectUtils) {
                try {
                    // Synchroniser le lieu
                    if (window.projectUtils.synchronizeProjectLieu) {
                        await window.projectUtils.synchronizeProjectLieu(projectId, null, supabase);
                        console.log('✅ [bookSessionAppointment] Lieu du projet synchronisé');
                    }
                    
                    // Synchroniser la période
                    if (window.projectUtils.synchronizeProjectPeriode) {
                        await window.projectUtils.synchronizeProjectPeriode(projectId, null, supabase);
                        console.log('✅ [bookSessionAppointment] Période du projet synchronisée');
                    }
                } catch (error) {
                    console.warn('⚠️ [bookSessionAppointment] Erreur synchronisation projet:', error);
                    // Ne pas faire échouer la création des événements pour autant
                }
            }
            
            // Retourner les informations pour le premier jour (UI display)
            const firstDate = dates[0];
            const lastDate = dates[dates.length - 1];
            const dateRange = dates.length > 1 ? 
                `du ${firstDate.toLocaleDateString('fr-FR')} au ${lastDate.toLocaleDateString('fr-FR')}` : 
                firstDate.toLocaleDateString('fr-FR');
            
            return {
                events: createdEvents, // Tous les événements créés
                event: createdEvents[0], // Premier événement pour compatibilité
                formateur: selectedFormateur,
                // Ajouter les dates UTC de la base de données pour éviter les décalages timezone
                dateDebut: createdEvents[0].date_debut,
                dateFin: createdEvents[createdEvents.length - 1].date_fin,
                formateurId: selectedFormateur.id,
                formateurNom: `${selectedFormateur.prenom} ${selectedFormateur.nom}`,
                eventId: createdEvents[0].id,
                eventIds: createdEvents.map(e => e.id),
                sessionDetails: {
                    sessionNumber,
                    date: dateRange,
                    time: slot.display,
                    formateurName: `${selectedFormateur.prenom} ${selectedFormateur.nom}`,
                    duration: slot.duration,
                    datesCount: dates.length
                }
            };
            
        } catch (err) {
            console.error('Erreur lors de la réservation de session:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [supabase, createUTCDateTimeFromLocal]);
    
    // Cache pour optimiser les performances
    const availabilityCache = React.useRef(new Map());
    const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (réduit pour éviter les bugs)
    
    // Fonction pour vider le cache (utile pour le debugging)
    const clearAvailabilityCache = useCallback(() => {
        availabilityCache.current.clear();
        console.log('🗑️ Cache de disponibilité vidé');
    }, []);
    
    // Vider le cache au démarrage pour éviter les données obsoletes
    React.useEffect(() => {
        clearAvailabilityCache();
    }, [clearAvailabilityCache]);
    
    // Fonction helper pour vérifier les conflits - AVEC GESTION TIMEZONE
    const hasConflict = (events, date, startTime, endTime) => {
        // IMPORTANT: Utiliser la même logique de conversion que isFormateurAvailable
        const startDateTimeUTC = createUTCDateTimeFromLocal(date, startTime);
        const endDateTimeUTC = createUTCDateTimeFromLocal(date, endTime);
        
        const startDT = new Date(startDateTimeUTC);
        const endDT = new Date(endDateTimeUTC);
        
        return events.some(event => {
            const eventStart = new Date(event.date_debut);
            const eventEnd = new Date(event.date_fin);
            
            // Véritable logique de chevauchement : event_start < new_end AND event_end > new_start
            const hasOverlap = eventStart < endDT && eventEnd > startDT;
            
            if (hasOverlap) {
                console.log(`⚠️ Conflit détecté:`);
                console.log(`   📅 Événement: ${event.titre || 'Sans titre'}`);
                console.log(`   ⏰ Event UTC: ${event.date_debut} - ${event.date_fin}`);
                console.log(`   🌍 Event Local: ${eventStart.toLocaleString()} - ${eventEnd.toLocaleString()}`);
                console.log(`   🆕 Nouveau créneau UTC: ${startDateTimeUTC} - ${endDateTimeUTC}`);
                console.log(`   🆕 Nouveau créneau Local: ${startDT.toLocaleString()} - ${endDT.toLocaleString()}`);
            }
            
            return hasOverlap;
        });
    };

    // Fonction pour vérifier qu'il y a une couverture complète de 9h à 17h30
    const hasFullDayCoverage = (slots, requiredStart = "09:00", requiredEnd = "17:30") => {
        if (!slots || slots.length === 0) {
            return false;
        }
        
        // Trier les créneaux par heure de début
        const sortedSlots = slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        // Vérifier que le premier créneau commence à l'heure requise
        if (sortedSlots[0].startTime !== requiredStart) {
            return false;
        }
        
        // Vérifier la continuité entre les créneaux
        for (let i = 0; i < sortedSlots.length - 1; i++) {
            if (sortedSlots[i].endTime !== sortedSlots[i + 1].startTime) {
                return false; // Trou dans la couverture
            }
        }
        
        // Vérifier que le dernier créneau se termine à l'heure requise
        const lastSlot = sortedSlots[sortedSlots.length - 1];
        if (lastSlot.endTime !== requiredEnd) {
            return false;
        }
        
        return true;
    };
    
    // Vérifier la disponibilité pour un jour donné
    const checkDayAvailability = useCallback(async (logicielId, date) => {
        try {
            // Récupérer les formateurs qualifiés
            const formateurs = await getFormateursByLogiciel(logicielId);
            if (formateurs.length === 0) return false;
            
            // Vérifier si au moins un formateur est disponible ce jour
            for (const formateur of formateurs) {
                const isAvailable = await isFormateurAvailable(
                    formateur.id, 
                    date, 
                    '09:00', 
                    '17:00'
                );
                if (isAvailable) return true;
            }
            return false;
        } catch (err) {
            console.error('Erreur checkDayAvailability:', err);
            return false;
        }
    }, [getFormateursByLogiciel, isFormateurAvailable]);
    
    // Vérifier la disponibilité pour des jours consécutifs
    const checkConsecutiveDaysAvailability = useCallback(async (logicielId, startDate, duration) => {
        try {
            // Générer les dates consécutives
            const dates = [];
            const current = new Date(startDate);
            
            for (let i = 0; i < duration; i++) {
                // Vérifier que c'est un jour ouvrable
                const dayOfWeek = current.getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) return false; // Weekend
                
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
            
            // Récupérer les formateurs qualifiés
            const formateurs = await getFormateursByLogiciel(logicielId);
            if (formateurs.length === 0) return false;
            
            // Vérifier si au moins un formateur est disponible tous les jours
            for (const formateur of formateurs) {
                const isAvailableAllDays = await isFormateurAvailableMultiDays(
                    formateur.id, 
                    dates, 
                    '09:00', 
                    '17:00'
                );
                if (isAvailableAllDays) return true;
            }
            return false;
        } catch (err) {
            console.error('Erreur checkConsecutiveDaysAvailability:', err);
            return false;
        }
    }, [getFormateursByLogiciel, isFormateurAvailableMultiDays]);
    
    // Récupérer la disponibilité pour un mois entier (optimisé)
    const getAvailabilityForCalendarMonth = useCallback(async (logicielId, year, month, sessionDuration, selectedFormateur = null) => {
        // Amélioration de la clé de cache pour inclure la date actuelle et le formateur sélectionné
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const formateurId = selectedFormateur ? selectedFormateur.id : 'all';
        const cacheKey = `${logicielId}-${year}-${month}-${sessionDuration}-${formateurId}-${today}`;
        const cached = availabilityCache.current.get(cacheKey);
        
        console.log(`🔑 Clé de cache: ${cacheKey}`);
        
        // Vérifier le cache
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            return cached.data;
        }
        
        try {
            console.log(`🔍 [getAvailabilityForCalendarMonth] Calcul pour ${year}-${month}, durée: ${sessionDuration} jour(s)${selectedFormateur ? `, formateur: ${selectedFormateur.prenom} ${selectedFormateur.nom}` : ''}`);
            
            // Récupérer les formateurs qualifiés une seule fois
            let formateurs = await getFormateursByLogiciel(logicielId);
            if (formateurs.length === 0) {
                const emptyResult = { availableDays: [], availableRanges: [], availableFormateurs: [], slotsByDate: {} };
                availabilityCache.current.set(cacheKey, { data: emptyResult, timestamp: Date.now() });
                return emptyResult;
            }
            
            // CORRECTION : Filtrer par formateur sélectionné si fourni
            if (selectedFormateur) {
                formateurs = formateurs.filter(f => f.id === selectedFormateur.id);
                console.log(`🔍 [getAvailabilityForCalendarMonth] Filtrage par formateur: ${formateurs.length} formateur(s) retenu(s)`);
                if (formateurs.length === 0) {
                    const emptyResult = { availableDays: [], availableRanges: [], availableFormateurs: [], slotsByDate: {} };
                    availabilityCache.current.set(cacheKey, { data: emptyResult, timestamp: Date.now() });
                    return emptyResult;
                }
            }
            
            // Récupérer tous les événements du mois pour tous les formateurs en une fois
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            
            const formateurIds = formateurs.map(f => f.id);
            const { data: allEvents, error } = await supabase
                .from('evenement')
                .select('user_id, date_debut, date_fin')
                .in('user_id', formateurIds)
                .gte('date_debut', firstDay.toISOString())
                .lte('date_fin', lastDay.toISOString());
                
            if (error) throw error;
            
            // Organiser les événements par formateur et par date
            const eventsByFormateur = {};
            formateurIds.forEach(id => { eventsByFormateur[id] = []; });
            
            (allEvents || []).forEach(event => {
                eventsByFormateur[event.user_id].push(event);
            });
            
            const availableDays = [];
            const availableRanges = [];
            const availableFormateursSet = new Set();
            const slotsByDate = {}; // Nouveau : stocker les créneaux détaillés par date
            
            // Générer tous les créneaux possibles une seule fois
            const allSlots = generateTimeSlots();
            
            // Vérifier chaque jour du mois
            for (let day = 1; day <= lastDay.getDate(); day++) {
                const currentDate = new Date(year, month, day);
                const dayOfWeek = currentDate.getDay();
                
                // Ignorer les weekends
                if (dayOfWeek === 0 || dayOfWeek === 6) continue;
                
                if (sessionDuration === 1) {
                    // Calculer les créneaux détaillés pour ce jour
                    const daySlots = [];
                    let dayHasAvailability = false;
                    
                    // Vérifier chaque créneau de la journée
                    allSlots.forEach(slot => {
                        const availableFormateurs = [];
                        
                        formateurs.forEach(formateur => {
                            const formateurEvents = eventsByFormateur[formateur.id];
                            if (!hasConflict(formateurEvents, currentDate, slot.startTime, slot.endTime)) {
                                availableFormateurs.push(formateur);
                                availableFormateursSet.add(JSON.stringify(formateur));
                            }
                        });
                        
                        // Si au moins un formateur est disponible pour ce créneau
                        if (availableFormateurs.length > 0) {
                            daySlots.push({
                                ...slot,
                                availableFormateurs,
                                formateurCount: availableFormateurs.length
                            });
                            dayHasAvailability = true;
                        }
                    });
                    
                    // Stocker les créneaux de ce jour
                    const dateKey = currentDate.toDateString();
                    slotsByDate[dateKey] = daySlots;
                    
                    // SÉPARATION DES LOGIQUES : Task 1 vs Task 5
                    if (dayHasAvailability) {
                        if (sessionDuration === 1) {
                            // Task 1 (qualification RDV) : Un jour est disponible s'il y a au moins un créneau disponible
                            availableDays.push(new Date(currentDate));
                        } else {
                            // Task 5 (formation) : Un jour est disponible seulement avec couverture complète 9h-17h30
                            const hasCompleteTimeCoverage = hasFullDayCoverage(daySlots, "09:00", "17:30");
                            if (hasCompleteTimeCoverage) {
                                availableDays.push(new Date(currentDate));
                            }
                        }
                    }
                } else {
                    // Vérification pour sessions multi-jours
                    const consecutiveDates = [];
                    const tempDate = new Date(currentDate);
                    
                    for (let i = 0; i < sessionDuration; i++) {
                        const checkDayOfWeek = tempDate.getDay();
                        if (checkDayOfWeek === 0 || checkDayOfWeek === 6) break; // Weekend
                        if (tempDate.getMonth() !== month) break; // Sortie du mois
                        
                        consecutiveDates.push(new Date(tempDate));
                        tempDate.setDate(tempDate.getDate() + 1);
                    }
                    
                    // Vérifier si nous avons assez de jours consécutifs
                    if (consecutiveDates.length === sessionDuration) {
                        let rangeHasAvailability = false;
                        formateurs.forEach(formateur => {
                            const formateurEvents = eventsByFormateur[formateur.id];
                            const isAvailable = consecutiveDates.every(date => 
                                !hasConflict(formateurEvents, date, '09:00', '17:00')
                            );
                            if (isAvailable) {
                                availableFormateursSet.add(JSON.stringify(formateur));
                                rangeHasAvailability = true;
                            }
                        });
                        
                        if (rangeHasAvailability) {
                            availableRanges.push({
                                startDate: new Date(consecutiveDates[0]),
                                endDate: new Date(consecutiveDates[consecutiveDates.length - 1]),
                                dates: consecutiveDates.map(d => new Date(d))
                            });
                        }
                    }
                }
            }
            
            // Convertir le Set en array d'objets formateurs
            const availableFormateurs = Array.from(availableFormateursSet).map(formateurString => 
                JSON.parse(formateurString)
            );
            
            const result = { availableDays, availableRanges, availableFormateurs, slotsByDate };
            
            // Mettre en cache
            availabilityCache.current.set(cacheKey, { data: result, timestamp: Date.now() });
            
            const totalSlots = Object.values(slotsByDate).reduce((total, daySlots) => total + daySlots.length, 0);
            console.log(`✅ [getAvailabilityForCalendarMonth] ${availableDays.length} jours, ${availableRanges.length} plages, ${availableFormateurs.length} formateurs et ${totalSlots} créneaux pré-calculés`);
            return result;
            
        } catch (err) {
            console.error('Erreur getAvailabilityForCalendarMonth:', err);
            return { availableDays: [], availableRanges: [], availableFormateurs: [], slotsByDate: {} };
        }
    }, [getFormateursByLogiciel, supabase]);
    
    // Modifier un créneau de session existant (supprimer et recréer)
    const modifySessionAppointment = useCallback(async (existingSession, slot, dates, sessionNumber, projectId, logicielId) => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🔄 === MODIFICATION DE SESSION ===');
            console.log('📊 Session existante:', {
                sessionNumber: sessionNumber,
                dateDebut: existingSession.dateDebut,
                dateFin: existingSession.dateFin,
                eventIds: existingSession.eventIds || [existingSession.eventId]
            });
            console.log('📅 Nouvelles dates:', dates.map(d => d.toDateString()));
            console.log('🎯 Nouveau créneau:', slot.display);
            
            // Étape 1: Supprimer les anciens événements
            const eventIdsToDelete = existingSession.eventIds || [existingSession.eventId];
            console.log('\\n🗑️ ÉTAPE 1: Suppression des anciens événements');
            console.log('   Événements à supprimer:', eventIdsToDelete);
            
            for (const eventId of eventIdsToDelete) {
                if (eventId) {
                    console.log(`   🗑️ Suppression de l'événement: ${eventId}`);
                    const { error: deleteError } = await supabase
                        .from('evenement')
                        .delete()
                        .eq('id', eventId);
                    
                    if (deleteError) {
                        console.error('❌ Erreur lors de la suppression de l\'événement:', eventId, deleteError);
                        throw deleteError;
                    }
                    console.log(`   ✅ Événement ${eventId} supprimé`);
                }
            }
            
            console.log('\\n✅ SUPPRESSION TERMINÉE - Tous les anciens événements ont été supprimés');
            console.log('   → Anciennes dates complètement supprimées de la base de données');
            
            // Étape 2: Créer les nouveaux événements (réutiliser la logique de bookSessionAppointment)
            console.log('\\n💾 ÉTAPE 2: Création des nouveaux événements');
            console.log(`   Formateur sélectionné: ${slot.availableFormateurs[0].prenom} ${slot.availableFormateurs[0].nom}`);
            console.log(`   Nombre de jours: ${dates.length}`);
            
            const selectedFormateur = slot.availableFormateurs[0];
            
            // CORRECTION: Récupérer les stagiaires du projet
            console.log(`🔍 [modifySessionAppointment] Récupération des stagiaires du projet ${projectId}`);
            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .select('stagiaires')
                .eq('id', projectId)
                .single();
            
            if (projectError) {
                console.warn('⚠️ [modifySessionAppointment] Erreur lors de la récupération des stagiaires du projet:', projectError);
            }
            
            const stagiaireIds = projectData?.stagiaires || [];
            console.log(`👥 [modifySessionAppointment] Stagiaires trouvés dans le projet:`, stagiaireIds);
            
            // Récupérer les informations du logiciel pour le titre
            const { data: logicielData } = await supabase
                .from('logiciel')
                .select('nom')
                .eq('id', logicielId)
                .single();
            
            const createdEvents = [];
            
            // Créer un événement pour chaque jour
            for (let dayIndex = 0; dayIndex < dates.length; dayIndex++) {
                const currentDate = dates[dayIndex];
                const startDateTimeUTC = createUTCDateTimeFromLocal(currentDate, slot.startTime);
                const endDateTimeUTC = createUTCDateTimeFromLocal(currentDate, slot.endTime);
                
                console.log(`   💾 Création événement jour ${dayIndex + 1}/${dates.length}:`, {
                    date: currentDate.toDateString(),
                    startUTC: startDateTimeUTC,
                    endUTC: endDateTimeUTC
                });
                
                const dayLabel = dates.length > 1 ? ` - Jour ${dayIndex + 1}/${dates.length}` : '';
                
                // Créer l'événement de formation pour ce jour
                const { data: eventData, error: eventError } = await supabase
                    .from('evenement')
                    .insert({
                        titre: `Formation ${logicielData?.nom || 'Logiciel'} - Session ${sessionNumber}${dayLabel}`,
                        description: `Session de formation ${logicielData?.nom || 'logiciel'} avec le formateur (modifiée)`,
                        date_debut: startDateTimeUTC,
                        date_fin: endDateTimeUTC,
                        user_id: selectedFormateur.id,
                        projet_id: projectId,
                        type_evenement: 'formation',
                        statut: 'planifie',
                        priorite: 'normale',
                        lieu: existingSession.lieu || 'À définir',
                        client_user_id: stagiaireIds // CORRECTION: Utiliser les stagiaires du projet
                    })
                    .select()
                    .single();
                
                if (eventError) {
                    // En cas d'erreur, annuler tous les événements déjà créés
                    console.log('❌ Erreur lors de la création, rollback des événements créés');
                    for (const event of createdEvents) {
                        await supabase.from('evenement').delete().eq('id', event.id);
                    }
                    throw eventError;
                }
                
                console.log(`   ✅ Événement ${eventData.id} créé pour le ${currentDate.toDateString()}`);
                createdEvents.push(eventData);
            }
            
            console.log('\\n✅ CRÉATION TERMINÉE - Tous les nouveaux événements ont été créés');
            console.log('   Événements créés:', createdEvents.map(e => e.id));
            console.log('   → Nouvelles dates maintenant dans la base de données');
            
            // NOUVEAU: Synchroniser le lieu et la période du projet après modification des événements
            console.log('\\n🔄 [modifySessionAppointment] Synchronisation du lieu et période du projet après modification');
            
            if (window.projectUtils) {
                try {
                    // Synchroniser le lieu
                    if (window.projectUtils.synchronizeProjectLieu) {
                        await window.projectUtils.synchronizeProjectLieu(projectId, null, supabase);
                        console.log('✅ [modifySessionAppointment] Lieu du projet synchronisé');
                    }
                    
                    // Synchroniser la période
                    if (window.projectUtils.synchronizeProjectPeriode) {
                        await window.projectUtils.synchronizeProjectPeriode(projectId, null, supabase);
                        console.log('✅ [modifySessionAppointment] Période du projet synchronisée');
                    }
                } catch (error) {
                    console.warn('⚠️ [modifySessionAppointment] Erreur synchronisation projet:', error);
                    // Ne pas faire échouer la modification pour autant
                }
            }
            
            // Retourner les informations pour la session modifiée
            const firstDate = dates[0];
            const lastDate = dates[dates.length - 1];
            const dateRange = dates.length > 1 ? 
                `du ${firstDate.toLocaleDateString('fr-FR')} au ${lastDate.toLocaleDateString('fr-FR')}` : 
                firstDate.toLocaleDateString('fr-FR');
            
            console.log('\\n🎯 === RÉSUMÉ DE LA MODIFICATION ===');
            console.log('✅ SUPPRESSION: Anciens événements complètement supprimés');
            console.log('✅ CRÉATION: Nouveaux événements créés en remplacement');
            console.log('✅ REMPLACEMENT: Modification terminée avec succès');
            console.log(`   Session ${sessionNumber}: ${dateRange}`);
            console.log(`   Nouveaux eventIds: ${createdEvents.map(e => e.id).join(', ')}`);
            
            return {
                events: createdEvents,
                event: createdEvents[0],
                formateur: selectedFormateur,
                sessionDetails: {
                    sessionNumber,
                    date: dateRange,
                    time: slot.display,
                    formateurName: `${selectedFormateur.prenom} ${selectedFormateur.nom}`,
                    duration: slot.duration,
                    datesCount: dates.length
                },
                // Nouvelles données pour la session modifiée
                dateDebut: createdEvents[0].date_debut,
                dateFin: createdEvents[createdEvents.length - 1].date_fin,
                formateurId: selectedFormateur.id,
                formateurNom: `${selectedFormateur.prenom} ${selectedFormateur.nom}`,
                eventId: createdEvents[0].id,
                eventIds: createdEvents.map(e => e.id)
            };
            
        } catch (err) {
            console.error('❌ Erreur lors de la modification de session:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [supabase, createUTCDateTimeFromLocal]);
    
    // Vérifier si un RDV existe déjà pour une tâche donnée
    const getExistingAppointment = useCallback(async (tacheId, projectId) => {
        try {
            console.log(`🔍 [getExistingAppointment] Vérification RDV existant pour tâche ${tacheId} projet ${projectId}`);
            
            // Rechercher un événement de type 'rendez_vous' lié à ce projet
            const { data: existingEvent, error } = await supabase
                .from('evenement')
                .select(`
                    id,
                    titre,
                    description,
                    date_debut,
                    date_fin,
                    user_id,
                    statut,
                    user_profile:user_id (
                        prenom,
                        nom
                    )
                `)
                .eq('projet_id', projectId)
                .eq('type_evenement', 'rendez_vous')
                .eq('statut', 'confirme')
                .single();

            if (error) {
                // Si pas d'événement trouvé, c'est normal
                if (error.code === 'PGRST116') {
                    console.log('ℹ️ [getExistingAppointment] Aucun RDV existant trouvé');
                    return null;
                }
                throw error;
            }

            if (existingEvent) {
                // Convertir les dates UTC en dates locales pour l'affichage
                const dateDebut = new Date(existingEvent.date_debut);
                const dateFin = new Date(existingEvent.date_fin);
                
                console.log('✅ [getExistingAppointment] RDV existant trouvé:', {
                    id: existingEvent.id,
                    date: dateDebut.toLocaleDateString('fr-FR'),
                    heure: dateDebut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    formateur: `${existingEvent.user_profile?.prenom} ${existingEvent.user_profile?.nom}`
                });

                return {
                    id: existingEvent.id,
                    date: dateDebut.toLocaleDateString('fr-FR'),
                    heure: dateDebut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    formateurNom: `${existingEvent.user_profile?.prenom} ${existingEvent.user_profile?.nom}`,
                    formateurId: existingEvent.user_id,
                    dateDebut: existingEvent.date_debut,
                    dateFin: existingEvent.date_fin,
                    titre: existingEvent.titre,
                    description: existingEvent.description,
                    statut: existingEvent.statut
                };
            }

            return null;
        } catch (err) {
            console.error('❌ [getExistingAppointment] Erreur:', err);
            return null;
        }
    }, [supabase]);
    
    // Supprimer un RDV existant
    const deleteExistingAppointment = useCallback(async (appointmentId) => {
        try {
            console.log(`🗑️ [deleteExistingAppointment] Suppression du RDV existant:`, appointmentId);
            setError(null);
            
            // Supprimer l'événement de type 'rendez_vous'
            const { error: deleteError } = await supabase
                .from('evenement')
                .delete()
                .eq('id', appointmentId);
            
            if (deleteError) throw deleteError;
            
            console.log('✅ [deleteExistingAppointment] RDV supprimé avec succès');
            return true;
        } catch (err) {
            console.error('❌ [deleteExistingAppointment] Erreur lors de la suppression du RDV:', err);
            setError(err.message);
            return false;
        }
    }, [supabase]);
    
    // Modifier un RDV existant
    const modifyAppointment = useCallback(async (existingAppointment, slot, date, tacheId, projectId, logicielId) => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🔄 [modifyAppointment] Modification du RDV existant:', existingAppointment);
            console.log('🔄 [modifyAppointment] Nouveau créneau:', slot);
            console.log('🔄 [modifyAppointment] Nouvelle date:', date);
            
            // Sélectionner le formateur le moins chargé (premier dans la liste pour simplifier)
            const selectedFormateur = slot.availableFormateurs[0];
            
            // Créer les timestamps pour le nouveau RDV en UTC
            const startDateTimeUTC = createUTCDateTimeFromLocal(date, slot.startTime);
            const endDateTimeUTC = createUTCDateTimeFromLocal(date, slot.endTime);
            
            console.log(`💾 Modification RDV - Conversion timezone:`);
            console.log(`   🌐 UTC: ${startDateTimeUTC} - ${endDateTimeUTC}`);
            console.log(`   🌍 Local: ${new Date(startDateTimeUTC).toLocaleString()} - ${new Date(endDateTimeUTC).toLocaleString()}`);
            
            // Récupérer les informations du logiciel pour le titre
            const { data: logicielData } = await supabase
                .from('logiciel')
                .select('nom')
                .eq('id', logicielId)
                .single();
            
            // Mettre à jour l'événement existant
            const { data: eventData, error: eventError } = await supabase
                .from('evenement')
                .update({
                    titre: `RDV Qualification - ${logicielData?.nom || 'Formation'}`,
                    description: `Rendez-vous de qualification avec le formateur pour définir le plan de formation (modifié)`,
                    date_debut: startDateTimeUTC,
                    date_fin: endDateTimeUTC,
                    user_id: selectedFormateur.id
                })
                .eq('id', existingAppointment.id)
                .select()
                .single();
            
            if (eventError) throw eventError;
            
            // Mettre à jour la description de la tâche "Demande de qualification"
            const newDescription = `RDV le ${new Date(startDateTimeUTC).toLocaleDateString('fr-FR')} à ${slot.startTime} avec le formateur ${selectedFormateur.prenom} ${selectedFormateur.nom}`;
            console.log("🔄 [modifyAppointment] Mise à jour de la description de la tâche:", newDescription);
            
            const { error: taskDescriptionError } = await supabase
                .from('tasks')
                .update({ 
                    description: newDescription,
                    updated_at: new Date().toISOString()
                })
                .eq('id', tacheId);
            
            if (taskDescriptionError) {
                console.log("⚠️ [modifyAppointment] Erreur lors de la mise à jour de la description:", taskDescriptionError);
                // Ne pas échouer la modification du RDV si la mise à jour de description échoue
            }
            
            // Mettre à jour la tâche "qualification" si elle existe (sans critère d'assignation)
            console.log("🔄 [modifyAppointment] Mise à jour de la tâche Qualification...");
            
            const { data: updatedTaskData, error: updateTaskError } = await supabase
                .from('tasks')
                .update({
                    assigned_to: selectedFormateur.id,
                    description: `Qualifier le client et définir le plan de formation adapté lors du rendez-vous du ${new Date(startDateTimeUTC).toLocaleDateString('fr-FR')} à ${slot.startTime} (modifié)`,
                    status: 'todo',
                    updated_at: new Date().toISOString()
                })
                .eq('project_id', projectId)
                .eq('title', 'Qualification')
                .eq('workflow_order', 2)
                .select()
                .single();
            
            if (updateTaskError) {
                console.log("⚠️ [modifyAppointment] Erreur lors de la mise à jour de la tâche Qualification:", updateTaskError);
                // Ne pas échouer la modification du RDV si la tâche n'est pas trouvée
            } else {
                console.log("✅ [modifyAppointment] Tâche Qualification mise à jour:", updatedTaskData);
            }
            
            return {
                event: eventData,
                task: updatedTaskData,
                formateur: selectedFormateur,
                appointmentDetails: {
                    date: date.toLocaleDateString('fr-FR'),
                    time: slot.display,
                    formateurName: `${selectedFormateur.prenom} ${selectedFormateur.nom}`
                }
            };
            
        } catch (err) {
            console.error('Erreur lors de la modification du RDV:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [supabase, createUTCDateTimeFromLocal]);
    
    // NOUVELLE FONCTION: Synchronisation bidirectionnelle projet ↔ événements
    const synchronizeProjectStagiaires = useCallback(async (projectId) => {
        try {
            console.log(`🔄 [synchronizeProjectStagiaires] Début synchronisation pour projet ${projectId}`);
            
            // Récupérer les stagiaires du projet
            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .select('stagiaires')
                .eq('id', projectId)
                .single();
            
            if (projectError) {
                console.error('❌ [synchronizeProjectStagiaires] Erreur récupération projet:', projectError);
                return false;
            }
            
            const projectStagiaires = projectData?.stagiaires || [];
            console.log(`📊 [synchronizeProjectStagiaires] Stagiaires du projet:`, projectStagiaires);
            
            // Récupérer tous les événements de formation pour ce projet
            const { data: events, error: eventsError } = await supabase
                .from('evenement')
                .select('id, client_user_id')
                .eq('projet_id', projectId)
                .eq('type_evenement', 'formation');
            
            if (eventsError) {
                console.error('❌ [synchronizeProjectStagiaires] Erreur récupération événements:', eventsError);
                return false;
            }
            
            console.log(`📅 [synchronizeProjectStagiaires] ${events.length} événement(s) de formation trouvé(s)`);
            
            // Mettre à jour tous les événements avec les stagiaires du projet
            const updatePromises = events.map(async (event) => {
                const currentStagiaires = event.client_user_id || [];
                
                // Comparer les arrays
                const needsUpdate = JSON.stringify(currentStagiaires.sort()) !== JSON.stringify(projectStagiaires.sort());
                
                if (needsUpdate) {
                    console.log(`🔄 [synchronizeProjectStagiaires] Mise à jour événement ${event.id}:`);
                    console.log(`   Ancien: ${currentStagiaires.length} stagiaire(s)`);
                    console.log(`   Nouveau: ${projectStagiaires.length} stagiaire(s)`);
                    
                    const { error: updateError } = await supabase
                        .from('evenement')
                        .update({ client_user_id: projectStagiaires })
                        .eq('id', event.id);
                    
                    if (updateError) {
                        console.error(`❌ [synchronizeProjectStagiaires] Erreur mise à jour événement ${event.id}:`, updateError);
                        return false;
                    }
                    
                    console.log(`✅ [synchronizeProjectStagiaires] Événement ${event.id} mis à jour`);
                    return true;
                } else {
                    console.log(`ℹ️ [synchronizeProjectStagiaires] Événement ${event.id} déjà à jour`);
                    return true;
                }
            });
            
            const results = await Promise.all(updatePromises);
            const successCount = results.filter(Boolean).length;
            
            console.log(`✅ [synchronizeProjectStagiaires] Synchronisation terminée: ${successCount}/${events.length} événement(s) traité(s)`);
            return successCount === events.length;
            
        } catch (err) {
            console.error('❌ [synchronizeProjectStagiaires] Erreur:', err);
            return false;
        }
    }, [supabase]);
    
    // NOUVELLE FONCTION: Synchroniser projet.stagiaires depuis les événements
    const updateProjectStagiairesFromEvents = useCallback(async (projectId) => {
        try {
            console.log(`🔄 [updateProjectStagiairesFromEvents] Début mise à jour projet ${projectId}`);
            
            // Récupérer tous les stagiaires uniques des événements de ce projet
            const { data: events, error: eventsError } = await supabase
                .from('evenement')
                .select('client_user_id')
                .eq('projet_id', projectId)
                .eq('type_evenement', 'formation');
            
            if (eventsError) {
                console.error('❌ [updateProjectStagiairesFromEvents] Erreur récupération événements:', eventsError);
                return false;
            }
            
            // Collecter tous les stagiaires uniques
            const allStagiaires = [...new Set(events.flatMap(event => event.client_user_id || []))];
            console.log(`👥 [updateProjectStagiairesFromEvents] Stagiaires trouvés dans les événements:`, allStagiaires);
            
            // Mettre à jour le projet avec ces stagiaires
            const { error: updateError } = await supabase
                .from('projects')
                .update({ stagiaires: allStagiaires })
                .eq('id', projectId);
            
            if (updateError) {
                console.error('❌ [updateProjectStagiairesFromEvents] Erreur mise à jour projet:', updateError);
                return false;
            }
            
            console.log(`✅ [updateProjectStagiairesFromEvents] Projet ${projectId} mis à jour avec ${allStagiaires.length} stagiaire(s)`);
            return true;
            
        } catch (err) {
            console.error('❌ [updateProjectStagiairesFromEvents] Erreur:', err);
            return false;
        }
    }, [supabase]);
    
    return {
        loading,
        error,
        getFormateursByLogiciel,
        getAvailableSlots,
        bookAppointment,
        generateTimeSlots,
        // Nouvelles fonctions pour les sessions
        getAvailableSlotsForSession,
        bookSessionAppointment,
        modifySessionAppointment,
        generateSessionTimeSlots,
        isFormateurAvailableMultiDays,
        // Nouvelles fonctions pour les indicateurs de disponibilité
        checkDayAvailability,
        checkConsecutiveDaysAvailability,
        getAvailabilityForCalendarMonth,
        // Fonction de debugging
        clearAvailabilityCache,
        // Nouvelle fonction pour vérifier les RDV existants
        getExistingAppointment,
        // Nouvelle fonction pour supprimer un RDV existant
        deleteExistingAppointment,
        // Nouvelle fonction pour modifier un RDV existant
        modifyAppointment,
        // Nouvelles fonctions de synchronisation
        synchronizeProjectStagiaires,
        updateProjectStagiairesFromEvents
    };
}

// Export global
window.useFormateurs = useFormateurs;