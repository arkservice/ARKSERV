console.log("🔥 [CHARGEMENT] SessionBookingWidget.js CHARGÉ!");

// Widget de réservation de sessions basé sur AppointmentBookingPage
function SessionBookingWidget({ 
    sessionNumber, 
    logicielId, 
    logicielNom, 
    sessionDuration, 
    projectId,
    onSessionBooked, 
    onCancel,
    onEdit,
    onCancelEdit,
    onSessionModified,
    disabled = false,
    editMode = false,
    existingSession = null
}) {
    console.log("🎯 [SessionBookingWidget] FONCTION APPELÉE avec:", {
        sessionNumber,
        logicielId,
        logicielNom,
        sessionDuration,
        disabled
    });
    
    const { useState, useEffect } = React;
    const { 
        getAvailableSlotsForSession, 
        bookSessionAppointment, 
        modifySessionAppointment,
        getAvailabilityForCalendarMonth,
        loading, 
        error: formateurError 
    } = window.useFormateurs();
    
    const [selectedDates, setSelectedDates] = useState(() => {
        // Pré-remplir les dates si en mode modification
        if (editMode && existingSession) {
            const startDate = new Date(existingSession.dateDebut);
            const endDate = new Date(existingSession.dateFin);
            const dates = [];
            
            // Pour les sessions multi-jours, générer toutes les dates
            if (existingSession.duration > 1) {
                const current = new Date(startDate);
                for (let i = 0; i < existingSession.duration; i++) {
                    dates.push(new Date(current));
                    current.setDate(current.getDate() + 1);
                }
            } else {
                dates.push(new Date(startDate));
            }
            
            return dates;
        }
        return [];
    });
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingInProgress, setBookingInProgress] = useState(false);
    const [localError, setLocalError] = useState(null);
    
    // État pour détecter les changements de durée
    const [previousDuration, setPreviousDuration] = useState(sessionDuration);
    const [isExpanded, setIsExpanded] = useState(editMode); // Ouvrir automatiquement en mode modification
    const [currentViewDate, setCurrentViewDate] = useState(new Date()); // Nouveau : date du mois affiché
    const [selectedFormateur, setSelectedFormateur] = useState(null); // Filtre par formateur
    
    // États pour les indicateurs de disponibilité
    const [availabilityData, setAvailabilityData] = useState({ availableDays: [], availableRanges: [], availableFormateurs: [], slotsByDate: {} });
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    
    // Fonction de validation robuste pour sessionDuration
    const validateSessionDuration = (duration) => {
        console.log(`🔍 [validateSessionDuration] Test de:`, duration, typeof duration);
        
        if (duration === null || duration === undefined) {
            console.log(`⚠️ [validateSessionDuration] Valeur null/undefined`);
            return false;
        }
        
        const num = Number(duration);
        if (isNaN(num)) {
            console.log(`⚠️ [validateSessionDuration] NaN après conversion:`, num);
            return false;
        }
        
        if (num <= 0) {
            console.log(`⚠️ [validateSessionDuration] Valeur <= 0:`, num);
            return false;
        }
        
        if (num > 10) {
            console.log(`⚠️ [validateSessionDuration] Valeur > 10 jours:`, num);
            return false;
        }
        
        if (!Number.isInteger(num)) {
            console.log(`⚠️ [validateSessionDuration] Pas un entier:`, num);
            return false;
        }
        
        console.log(`✅ [validateSessionDuration] Valide:`, num);
        return true;
    };
    
    // Validation des données critiques avec diagnostic
    console.log(`🔍 [SessionBookingWidget] sessionDuration reçu:`, sessionDuration, typeof sessionDuration);
    console.log(`🔍 [SessionBookingWidget] logicielId reçu:`, logicielId, typeof logicielId);
    
    const isSessionDurationValid = validateSessionDuration(sessionDuration);
    const isDataValid = logicielId && isSessionDurationValid;
    
    console.log("🔍 [SessionBookingWidget] Validation des données:");
    console.log("  - logicielId:", logicielId);
    console.log("  - sessionDuration:", sessionDuration);
    console.log("  - isDataValid:", isDataValid);
    
    useEffect(() => {
        lucide.createIcons();
    }, [availableSlots, selectedDates]);
    
    // Synchroniser isExpanded avec editMode pour activer le mode édition
    useEffect(() => {
        if (editMode && !isExpanded) {
            console.log('🔄 [SessionBookingWidget] Mode édition activé - ouverture du widget');
            setIsExpanded(true);
        }
    }, [editMode, isExpanded]);
    
    // Détecter les changements de durée et réinitialiser les sélections
    useEffect(() => {
        if (previousDuration !== sessionDuration && previousDuration !== undefined) {
            console.log(`🔄 [SessionBookingWidget] Changement de durée détecté: ${previousDuration} → ${sessionDuration}`);
            
            // En mode édition, vérifier si existingSession a des données valides
            if (editMode && existingSession) {
                // Si existingSession n'a plus de dateDebut (réinitialisée), se comporter comme en mode création
                if (!existingSession.dateDebut) {
                    console.log(`⚠️ [SessionBookingWidget] Session existante réinitialisée, réinitialisation des sélections`);
                    // Utiliser setTimeout pour éviter les conflits de rendu React
                    setTimeout(() => {
                        setSelectedDates([]);
                        setSelectedSlot(null);
                        setAvailableSlots([]);
                        setSelectedFormateur(null);
                        setLocalError(null);
                    }, 0);
                }
                // Si existingSession a des données, les conserver (ne pas réinitialiser)
                else {
                    console.log(`🔄 [SessionBookingWidget] Mode édition avec données existantes, conservation des sélections`);
                }
            } else {
                // Mode création normal : réinitialiser les sélections
                setTimeout(() => {
                    setSelectedDates([]);
                    setSelectedSlot(null);
                    setAvailableSlots([]);
                    setSelectedFormateur(null);
                    setLocalError(null);
                }, 0);
            }
            
            console.log(`✅ [SessionBookingWidget] Gestion du changement de durée terminée`);
        }
        
        setPreviousDuration(sessionDuration);
    }, [sessionDuration, previousDuration, editMode, existingSession]);
    
    useEffect(() => {
        if (isDataValid && logicielId && selectedDates.length === sessionDuration && isExpanded) {
            loadAvailableSlots();
        }
    }, [logicielId, selectedDates, isDataValid, isExpanded, sessionDuration, selectedFormateur]);
    
    useEffect(() => {
        if (isDataValid && logicielId && isExpanded) {
            loadMonthAvailability();
        }
    }, [logicielId, isDataValid, isExpanded, sessionDuration, currentViewDate, selectedFormateur]);
    
    const loadAvailableSlots = async () => {
        console.log("🚀 [loadAvailableSlots] DEBUT - logicielId:", logicielId);
        
        if (!logicielId || !isDataValid) {
            console.log("❌ [loadAvailableSlots] Données invalides, abandon");
            return;
        }
        
        try {
            setLoadingSlots(true);
            setLocalError(null);
            
            console.log("📞 [loadAvailableSlots] Appel getAvailableSlotsForSession...");
            const slots = await getAvailableSlotsForSession(logicielId, selectedDates, sessionDuration);
            console.log("📋 [loadAvailableSlots] Slots reçus:", slots);
            
            // Filtrer par formateur si un filtre est actif
            const filteredSlots = filterSlotsByFormateur(slots);
            setAvailableSlots(filteredSlots);
            
        } catch (err) {
            console.error('❌ Erreur lors du chargement des créneaux:', err);
            setLocalError(`Erreur lors du chargement des créneaux: ${err.message}`);
        } finally {
            setLoadingSlots(false);
        }
    };
    
    // Fonction pour filtrer les créneaux par formateur sélectionné
    const filterSlotsByFormateur = (slots) => {
        if (!selectedFormateur) {
            return slots;
        }
        
        return slots.filter(slot => 
            slot.availableFormateurs && 
            slot.availableFormateurs.some(formateur => formateur.id === selectedFormateur.id)
        ).map(slot => ({
            ...slot,
            // Ne garder que le formateur sélectionné dans la liste
            availableFormateurs: slot.availableFormateurs.filter(formateur => formateur.id === selectedFormateur.id),
            formateurCount: 1
        }));
    };
    
    const loadMonthAvailability = async () => {
        if (!logicielId || !isDataValid) return;
        
        try {
            setLoadingAvailability(true);
            
            // Utiliser currentViewDate pour charger les disponibilités du mois affiché
            const year = currentViewDate.getFullYear();
            const month = currentViewDate.getMonth();
            
            console.log("🔍 [loadMonthAvailability] Chargement pour", year, month, "durée:", sessionDuration, selectedFormateur ? `formateur: ${selectedFormateur.prenom}` : '');
            
            const availability = await getAvailabilityForCalendarMonth(logicielId, year, month, sessionDuration, selectedFormateur);
            setAvailabilityData(availability);
            
            console.log("✅ [loadMonthAvailability] Données reçues:", availability);
        } catch (err) {
            console.error('❌ Erreur lors du chargement de la disponibilité:', err);
            setAvailabilityData({ availableDays: [], availableRanges: [], availableFormateurs: [], slotsByDate: {} });
        } finally {
            setLoadingAvailability(false);
        }
    };
    
    const handleDateSelect = (date) => {
        console.log(`🎯 [handleDateSelect] DÉBUT - Date cliquée:`, date);
        console.log(`🎯 [handleDateSelect] sessionDuration:`, sessionDuration, typeof sessionDuration);
        console.log(`🎯 [handleDateSelect] selectedDates actuels:`, selectedDates);
        
        try {
            // Ne permettre que les dates futures (à partir d'aujourd'hui)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (date < today) {
                console.log(`⚠️ [handleDateSelect] Date dans le passé, ignorée:`, date);
                return;
            }
            
            const numSessionDuration = Number(sessionDuration);
            console.log(`🎯 [handleDateSelect] sessionDuration converti:`, numSessionDuration);
            
            if (numSessionDuration === 1) {
                // Pour les formations d'un jour, comportement classique
                console.log(`📅 [handleDateSelect] Session 1 jour - sélection simple`);
                setSelectedDates([date]);
            } else {
                // Pour les formations multi-jours, gérer la sélection de plage
                console.log(`📅 [handleDateSelect] Session ${numSessionDuration} jours - logique multi-jours`);
                
                if (selectedDates.length === 0) {
                    // Première date sélectionnée
                    console.log(`📅 [handleDateSelect] Première date sélectionnée`);
                    setSelectedDates([date]);
                } else if (selectedDates.length === 1) {
                    // Deuxième date : créer une plage
                    console.log(`📅 [handleDateSelect] Deuxième date - création de plage`);
                    const firstDate = selectedDates[0];
                    const dates = getConsecutiveDates(firstDate, date, numSessionDuration);
                    if (dates.length === numSessionDuration) {
                        console.log(`✅ [handleDateSelect] Plage valide créée:`, dates);
                        setSelectedDates(dates);
                    } else {
                        // Si les dates ne forment pas une plage valide, recommencer
                        console.log(`⚠️ [handleDateSelect] Plage invalide, recommencer avec:`, date);
                        setSelectedDates([date]);
                    }
                } else {
                    // Recommencer la sélection
                    console.log(`📅 [handleDateSelect] Recommencer la sélection avec:`, date);
                    setSelectedDates([date]);
                }
            }
        } catch (error) {
            console.error(`❌ [handleDateSelect] ERREUR lors de la sélection:`, error);
            console.error(`❌ [handleDateSelect] Paramètres:`, { date, sessionDuration, selectedDates });
            // Fallback : sélection simple
            setSelectedDates([date]);
        }
    };
    
    // Fonction helper pour générer des dates consécutives avec validation robuste
    const getConsecutiveDates = (startDate, endDate, requiredDays) => {
        console.log(`🔧 [getConsecutiveDates] DEBUT avec:`, { 
            startDate: startDate?.toDateString(), 
            endDate: endDate?.toDateString(), 
            requiredDays 
        });
        
        // Validation des paramètres d'entrée
        if (!startDate || !(startDate instanceof Date) || isNaN(startDate.getTime())) {
            console.error(`❌ [getConsecutiveDates] startDate invalide:`, startDate);
            return [];
        }
        
        if (!endDate || !(endDate instanceof Date) || isNaN(endDate.getTime())) {
            console.error(`❌ [getConsecutiveDates] endDate invalide:`, endDate);
            return [];
        }
        
        if (!validateSessionDuration(requiredDays)) {
            console.error(`❌ [getConsecutiveDates] requiredDays invalide:`, requiredDays);
            return [];
        }
        
        try {
            const dates = [];
            const current = new Date(Math.min(startDate.getTime(), endDate.getTime()));
            const end = new Date(Math.max(startDate.getTime(), endDate.getTime()));
            
            let iterations = 0;
            const maxIterations = 50; // Protection contre les boucles infinies
            
            while (current <= end && dates.length < requiredDays && iterations < maxIterations) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
                iterations++;
            }
            
            // Vérifier que nous avons exactement le bon nombre de jours
            if (dates.length !== requiredDays) {
                console.log(`⚠️ [getConsecutiveDates] Nombre de jours incorrect: ${dates.length}/${requiredDays}`);
                return [];
            }
            
            console.log(`✅ [getConsecutiveDates] ${dates.length} dates générées avec succès`);
            
            // Vérifier que toutes les dates sont des jours ouvrables (lundi-vendredi)
            const areAllWeekdays = dates.every(date => {
                const day = date.getDay();
                return day >= 1 && day <= 5; // 1=lundi, 5=vendredi
            });
            
            if (!areAllWeekdays) {
                console.log(`⚠️ [getConsecutiveDates] Certaines dates ne sont pas des jours ouvrables`);
            }
            
            return areAllWeekdays ? dates : [];
            
        } catch (error) {
            console.error(`❌ [getConsecutiveDates] Erreur lors de la génération:`, error);
            return [];
        }
    };
    
    const handleSlotBooking = async (slot) => {
        console.log(`🎯 [handleSlotBooking] DEBUT avec:`, { slot, selectedDates, sessionDuration });
        
        if (bookingInProgress || disabled) {
            console.log(`⚠️ [handleSlotBooking] Abandon - bookingInProgress:${bookingInProgress}, disabled:${disabled}`);
            return;
        }
        
        // Validation critique des données avant traitement
        if (!slot) {
            console.error(`❌ [handleSlotBooking] Slot invalide:`, slot);
            return;
        }
        
        if (!Array.isArray(selectedDates) || selectedDates.length === 0) {
            console.error(`❌ [handleSlotBooking] selectedDates invalide:`, selectedDates);
            alert('Aucune date sélectionnée. Veuillez d\'abord sélectionner des dates.');
            return;
        }
        
        if (!validateSessionDuration(sessionDuration)) {
            console.error(`❌ [handleSlotBooking] sessionDuration invalide:`, sessionDuration);
            alert('Durée de session invalide. Veuillez rafraîchir la page.');
            return;
        }
        
        try {
            setBookingInProgress(true);
            console.log(`🚀 [handleSlotBooking] Début réservation avec ${selectedDates.length} dates`);
            
            // Utiliser la fonction appropriée selon le mode
            let result;
            if (editMode && existingSession) {
                console.log('🔄 Mode modification - utilisation de modifySessionAppointment');
                result = await modifySessionAppointment(existingSession, slot, selectedDates, sessionNumber, projectId, logicielId);
            } else {
                console.log('🆕 Mode création - utilisation de bookSessionAppointment');
                result = await bookSessionAppointment(slot, selectedDates, sessionNumber, projectId, logicielId);
            }
            
            // Validation du résultat
            if (!result) {
                throw new Error('Aucun résultat de la fonction de réservation');
            }
            
            // Construire l'objet de session réservée pour le callback avec protection des accès
            const firstDate = selectedDates.length > 0 ? selectedDates[0] : null;
            const lastDate = selectedDates.length > 0 ? selectedDates[selectedDates.length - 1] : null;
            
            if (!firstDate || !lastDate) {
                throw new Error('Impossible d\'accéder aux dates sélectionnées');
            }
            
            const bookedSession = {
                sessionNumber,
                // Utiliser les dates UTC directement de la base de données (plus de fallback problématique)
                dateDebut: result.dateDebut,
                dateFin: result.dateFin,
                formateurId: result.formateurId,
                formateurNom: result.formateurNom,
                lieu: existingSession?.lieu || 'À définir',
                slot: slot,
                eventId: result.eventId,
                eventIds: result.eventIds,
                datesCount: selectedDates.length
            };
            
            console.log("📋 [handleSlotBooking] Session réservée:", bookedSession);
            console.log("📋 [handleSlotBooking] Événements créés:", result.events);
            
            // Notifier le parent selon le mode (création vs modification)
            if (editMode && onSessionModified) {
                console.log("🔄 [handleSlotBooking] Mode édition - appel onSessionModified");
                onSessionModified(bookedSession);
            } else if (onSessionBooked) {
                console.log("🆕 [handleSlotBooking] Mode création - appel onSessionBooked");
                onSessionBooked(bookedSession);
            }
            
            // Fermer le widget
            setIsExpanded(false);
            
        } catch (err) {
            console.error('Erreur lors de la réservation:', err);
            alert('Erreur lors de la réservation du créneau. Veuillez réessayer.');
        } finally {
            setBookingInProgress(false);
        }
    };
    
    const isDateSelectable = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
    };
    
    // Fonctions de navigation entre les mois
    const goToPreviousMonth = () => {
        const newDate = new Date(currentViewDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentViewDate(newDate);
        console.log(`⬅️ [goToPreviousMonth] Navigation vers ${newDate.getFullYear()}-${newDate.getMonth() + 1}`);
    };
    
    const goToNextMonth = () => {
        const newDate = new Date(currentViewDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentViewDate(newDate);
        console.log(`➡️ [goToNextMonth] Navigation vers ${newDate.getFullYear()}-${newDate.getMonth() + 1}`);
    };
    
    const getInitials = (prenom, nom) => {
        if (prenom && nom) {
            return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
        } else if (prenom) {
            return prenom.substring(0, 2).toUpperCase();
        }
        return 'F'; // F pour Formateur par défaut
    };

    // Fonction pour afficher les avatars des formateurs disponibles
    const renderFormateursAvatars = (availableFormateurs) => {
        if (!availableFormateurs || availableFormateurs.length === 0) {
            return null;
        }
        
        // Limiter à 3 formateurs visibles + compteur si nécessaire
        const maxVisible = 3;
        const visibleFormateurs = availableFormateurs.slice(0, maxVisible);
        const remainingCount = availableFormateurs.length - maxVisible;
        
        return React.createElement('div', {
            className: 'flex items-center gap-2 ml-3'
        }, [
            ...visibleFormateurs.map((formateur, index) => 
                React.createElement('div', {
                    key: formateur.id,
                    className: 'flex items-center gap-1',
                    title: `${formateur.prenom} ${formateur.nom}` // Tooltip au survol
                }, [
                    // Avatar ou initiales
                    formateur.avatar ? 
                        React.createElement('img', {
                            key: 'avatar',
                            src: formateur.avatar,
                            alt: `${formateur.prenom} ${formateur.nom}`,
                            className: 'w-6 h-6 rounded-full object-cover border border-gray-200',
                            onError: (e) => {
                                // En cas d'erreur de chargement, remplacer par les initiales
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }
                        }) : null,
                    React.createElement('div', {
                        key: 'initials',
                        className: 'w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium border border-gray-200',
                        style: formateur.avatar ? { display: 'none' } : {}
                    }, getInitials(formateur.prenom, formateur.nom)),
                    // Nom du formateur (prénom + première lettre du nom)
                    React.createElement('span', {
                        key: 'name',
                        className: 'text-xs text-gray-600 ml-1'
                    }, `${formateur.prenom || 'Formateur'} ${formateur.nom ? formateur.nom.charAt(0) + '.' : ''}`)
                ])
            ),
            // Compteur pour les formateurs supplémentaires
            remainingCount > 0 && React.createElement('span', {
                key: 'remaining-count',
                className: 'text-xs text-gray-500 ml-1',
                title: `${remainingCount} formateur${remainingCount > 1 ? 's' : ''} supplémentaire${remainingCount > 1 ? 's' : ''}`
            }, `+${remainingCount}`)
        ]);
    };
    
    // Fonction pour vérifier qu'il y a une couverture complète de 9h à 17h
    const hasFullDayCoverage = (slots, requiredStart = "09:00", requiredEnd = "17:00") => {
        console.log(`🔍 [hasFullDayCoverage] DÉBUT - Analyse de ${slots?.length || 0} créneaux`);
        console.log(`🔍 [hasFullDayCoverage] Créneaux reçus:`, slots);
        console.log(`🔍 [hasFullDayCoverage] Recherche couverture ${requiredStart}-${requiredEnd}`);
        
        if (!slots || slots.length === 0) {
            console.log(`⚠️ [hasFullDayCoverage] Aucun créneau disponible`);
            return false;
        }
        
        // Trier les créneaux par heure de début
        const sortedSlots = slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
        console.log(`🔍 [hasFullDayCoverage] Créneaux triés:`, sortedSlots.map(s => `${s.startTime}-${s.endTime}`));
        
        // Vérifier que le premier créneau commence à 9h
        if (sortedSlots[0].startTime !== requiredStart) {
            console.log(`⚠️ [hasFullDayCoverage] Premier créneau ne commence pas à ${requiredStart}: ${sortedSlots[0].startTime}`);
            return false;
        }
        
        // Vérifier la continuité entre les créneaux
        for (let i = 0; i < sortedSlots.length - 1; i++) {
            if (sortedSlots[i].endTime !== sortedSlots[i + 1].startTime) {
                console.log(`⚠️ [hasFullDayCoverage] Trou détecté entre ${sortedSlots[i].endTime} et ${sortedSlots[i + 1].startTime}`);
                return false; // Trou dans la couverture
            }
        }
        
        // Vérifier que le dernier créneau se termine à 17h
        const lastSlot = sortedSlots[sortedSlots.length - 1];
        if (lastSlot.endTime !== requiredEnd) {
            console.log(`⚠️ [hasFullDayCoverage] Dernier créneau ne se termine pas à ${requiredEnd}: ${lastSlot.endTime}`);
            return false;
        }
        
        console.log(`✅ [hasFullDayCoverage] Couverture complète ${requiredStart}-${requiredEnd} validée avec ${sortedSlots.length} créneaux`);
        return true;
    };
    
    // Fonction pour récupérer les créneaux d'une date spécifique filtrés par formateur
    const getFormatedSlotsByDate = (date) => {
        const dateKey = date.toDateString();
        console.log(`🔍 [getFormatedSlotsByDate] DÉBUT - Recherche pour ${dateKey}`);
        console.log(`🔍 [getFormatedSlotsByDate] availabilityData.slotsByDate:`, availabilityData.slotsByDate);
        
        let slots = availabilityData.slotsByDate?.[dateKey] || [];
        console.log(`🔍 [getFormatedSlotsByDate] Créneaux bruts trouvés pour ${dateKey}:`, slots);
        
        // Filtrer par formateur si sélectionné
        if (selectedFormateur) {
            const originalLength = slots.length;
            slots = slots.filter(slot => 
                slot.availableFormateurs && 
                slot.availableFormateurs.some(formateur => formateur.id === selectedFormateur.id)
            );
            console.log(`🔍 [getFormatedSlotsByDate] Filtrage par formateur ${selectedFormateur.prenom}: ${originalLength} → ${slots.length} créneaux`);
        }
        
        console.log(`⚡ [getFormatedSlotsByDate] RÉSULTAT ${dateKey}: ${slots.length} créneaux${selectedFormateur ? ` (filtrés pour ${selectedFormateur.prenom})` : ''}`);
        console.log(`⚡ [getFormatedSlotsByDate] Créneaux finaux:`, slots);
        return slots;
    };
    
    const renderCalendar = () => {
        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay() + 1);
        
        const days = [];
        const currentDay = new Date(startDate);
        
        for (let i = 0; i < 42; i++) {
            days.push(new Date(currentDay));
            currentDay.setDate(currentDay.getDate() + 1);
        }
        
        const monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        
        const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        
        return React.createElement('div', {
            className: 'bg-white rounded-lg border border-gray-200 p-4'
        }, [
            // En-tête du calendrier avec navigation centrée
            React.createElement('div', {
                key: 'calendar-header',
                className: 'text-center mb-4'
            }, [
                // Navigation mois avec chevrons
                React.createElement('div', {
                    key: 'month-navigation',
                    className: 'flex items-center justify-center gap-4 mb-2'
                }, [
                    React.createElement('button', {
                        key: 'prev-month',
                        onClick: goToPreviousMonth,
                        className: 'p-2 hover:bg-gray-100 rounded-lg transition-colors'
                    }, [
                        React.createElement('svg', {
                            key: 'prev-icon',
                            className: 'w-5 h-5 text-gray-600',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24',
                            xmlns: 'http://www.w3.org/2000/svg'
                        }, [
                            React.createElement('path', {
                                key: 'path',
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 2,
                                d: 'm15 18-6-6 6-6'
                            })
                        ])
                    ]),
                    React.createElement('h3', {
                        key: 'month-year',
                        className: 'text-lg font-semibold text-gray-900 min-w-48'
                    }, `${monthNames[month]} ${year}`),
                    React.createElement('button', {
                        key: 'next-month',
                        onClick: goToNextMonth,
                        className: 'p-2 hover:bg-gray-100 rounded-lg transition-colors'
                    }, [
                        React.createElement('svg', {
                            key: 'next-icon',
                            className: 'w-5 h-5 text-gray-600',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24',
                            xmlns: 'http://www.w3.org/2000/svg'
                        }, [
                            React.createElement('path', {
                                key: 'path',
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 2,
                                d: 'm9 18 6-6-6-6'
                            })
                        ])
                    ])
                ]),
                // Légende des couleurs
                React.createElement('div', {
                    key: 'legend',
                    className: 'flex items-center justify-center gap-4 mt-2 text-xs'
                }, [
                    React.createElement('div', {
                        key: 'available-legend',
                        className: 'flex items-center gap-1'
                    }, [
                        React.createElement('div', {
                            key: 'available-box',
                            className: 'w-3 h-3 bg-gray-200 rounded'
                        }),
                        React.createElement('span', {
                            key: 'available-text',
                            className: 'text-gray-600'
                        }, 'Créneaux disponibles')
                    ]),
                    React.createElement('div', {
                        key: 'selected-legend',
                        className: 'flex items-center gap-1'
                    }, [
                        React.createElement('div', {
                            key: 'selected-box',
                            className: 'w-3 h-3 bg-blue-600 rounded'
                        }),
                        React.createElement('span', {
                            key: 'selected-text',
                            className: 'text-gray-600'
                        }, 'Jour sélectionné')
                    ])
                ]),
                loadingAvailability && React.createElement('div', {
                    key: 'loading-availability',
                    className: 'mt-2 text-xs text-gray-500 flex items-center justify-center'
                }, [
                    React.createElement('div', {
                        key: 'spinner',
                        className: 'animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-2'
                    }),
                    React.createElement('span', { key: 'text' }, 'Chargement des disponibilités...')
                ])
            ]),
            
            // En-tête des jours
            React.createElement('div', {
                key: 'days-header',
                className: 'grid grid-cols-7 gap-1 mb-2'
            }, dayNames.map(day => 
                React.createElement('div', {
                    key: day,
                    className: 'text-center text-sm font-medium text-gray-500 py-2'
                }, day)
            )),
            
            // Grille des dates
            React.createElement('div', {
                key: 'days-grid',
                className: 'grid grid-cols-7 gap-1'
            }, days.map(date => {
                const isCurrentMonth = date.getMonth() === month;
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = selectedDates.some(selectedDate => selectedDate.toDateString() === date.toDateString());
                const isSelectable = isDateSelectable(date) && isCurrentMonth;
                const isFirstSelected = selectedDates.length > 0 && selectedDates[0].toDateString() === date.toDateString();
                const isLastSelected = selectedDates.length > 1 && selectedDates[selectedDates.length - 1].toDateString() === date.toDateString();
                const isMiddleSelected = selectedDates.length > 2 && isSelected && !isFirstSelected && !isLastSelected;
                
                // Vérifier la disponibilité pour ce jour
                let isAvailable = false;
                let isPartOfAvailableRange = false;
                
                // CORRECTION : Utiliser uniquement la logique uniforme
                // Vérifier la disponibilité basée sur les données calculées dans useFormateurs
                if (sessionDuration === 1) {
                    // Pour sessions d'un jour, utiliser availableDays (maintenant cohérent)
                    isAvailable = availabilityData.availableDays.some(availableDate => 
                        availableDate.toDateString() === date.toDateString()
                    );
                } else {
                    // Pour sessions multi-jours, vérifier les plages
                    isPartOfAvailableRange = availabilityData.availableRanges.some(range => 
                        range.dates.some(rangeDate => rangeDate.toDateString() === date.toDateString())
                    );
                    
                    // Vérifier si c'est le début d'une plage disponible
                    isAvailable = availabilityData.availableRanges.some(range => 
                        range.startDate.toDateString() === date.toDateString()
                    );
                }
                
                return React.createElement('button', {
                    key: date.toISOString(),
                    onClick: () => isSelectable && handleDateSelect(date),
                    disabled: !isSelectable,
                    className: `
                        p-2 text-sm transition-colors
                        ${!isCurrentMonth ? 'text-gray-300' : ''}
                        ${isToday && !isSelected ? 'bg-blue-100 text-blue-600 font-semibold' : ''}
                        ${isFirstSelected ? 'bg-blue-600 text-white rounded-l-md' : ''}
                        ${isLastSelected ? 'bg-blue-600 text-white rounded-r-md' : ''}
                        ${isMiddleSelected ? 'bg-blue-500 text-white rounded-none' : ''}
                        ${isSelected && selectedDates.length === 1 ? 'bg-blue-600 text-white rounded-md' : ''}
                        ${isSelectable && !isSelected && !isToday && (isAvailable || isPartOfAvailableRange) ? 'bg-gray-100 border border-gray-300 text-gray-700 rounded-md' : ''}
                        ${isSelectable && !isSelected && !isToday && !isAvailable && !isPartOfAvailableRange ? 'hover:bg-gray-100 text-gray-900 rounded-md' : ''}
                        ${!isSelectable ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer'}
                    `.trim()
                }, date.getDate())
            }))
        ]);
    };
    
    const renderFormateursDisponibles = () => {
        if (!availabilityData.availableFormateurs || availabilityData.availableFormateurs.length === 0) {
            return null;
        }
        
        return React.createElement('div', {
            className: 'bg-white rounded-lg border border-gray-200 p-4 mt-4'
        }, [
            React.createElement('h4', {
                key: 'title',
                className: 'text-sm font-medium text-gray-700 mb-3'
            }, selectedFormateur ? `Filtre: ${selectedFormateur.prenom} ${selectedFormateur.nom}` : 'Formateurs disponibles ce mois :'),
            
            // Bouton "Voir tous" si un filtre est actif
            selectedFormateur && React.createElement('button', {
                key: 'clear-filter',
                onClick: () => setSelectedFormateur(null),
                className: 'mb-3 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-md transition-colors'
            }, '← Voir tous les formateurs'),
            
            React.createElement('div', {
                key: 'formateurs-list',
                className: 'flex flex-wrap gap-3'
            }, availabilityData.availableFormateurs.map(formateur => {
                const isSelected = selectedFormateur && selectedFormateur.id === formateur.id;
                const isClickable = !selectedFormateur || !isSelected;
                
                return React.createElement('div', {
                    key: formateur.id,
                    onClick: isClickable ? () => setSelectedFormateur(formateur) : undefined,
                    className: `flex items-center gap-2 p-2 rounded-lg transition-colors ${
                        isSelected 
                            ? 'bg-blue-100 border-2 border-blue-300' 
                            : isClickable 
                                ? 'cursor-pointer hover:bg-gray-100 border border-transparent' 
                                : 'opacity-50'
                    }`
                }, [
                    // Avatar ou initiales
                    formateur.avatar ? 
                        React.createElement('img', {
                            key: 'avatar',
                            src: formateur.avatar,
                            alt: `${formateur.prenom} ${formateur.nom}`,
                            className: 'w-8 h-8 rounded-full object-cover',
                            onError: (e) => {
                                // En cas d'erreur de chargement, remplacer par les initiales
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }
                        }) : null,
                    React.createElement('div', {
                        key: 'initials',
                        className: `w-8 h-8 rounded-full ${isSelected ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'} flex items-center justify-center text-sm font-medium`,
                        style: formateur.avatar ? { display: 'none' } : {}
                    }, getInitials(formateur.prenom, formateur.nom)),
                    React.createElement('span', {
                        key: 'name',
                        className: `text-sm ${isSelected ? 'text-blue-800 font-medium' : 'text-gray-700'}`
                    }, `${formateur.prenom} ${formateur.nom}`)
                ]);
            }))
        ]);
    };
    
    const renderTimeSlots = () => {
        if (loadingSlots) {
            return React.createElement('div', {
                className: 'bg-white rounded-lg border border-gray-200 p-8'
            }, [
                React.createElement('div', {
                    key: 'loading',
                    className: 'text-center'
                }, [
                    React.createElement('div', {
                        key: 'spinner',
                        className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'
                    }),
                    React.createElement('p', {
                        key: 'text',
                        className: 'text-gray-600'
                    }, 'Chargement des créneaux disponibles...')
                ])
            ]);
        }
        
        if (availableSlots.length === 0) {
            const messageTitle = selectedFormateur 
                ? 'Aucun créneau disponible pour ce formateur'
                : 'Aucun créneau disponible';
            const messageDescription = selectedFormateur 
                ? `${selectedFormateur.prenom} ${selectedFormateur.nom} n'est pas disponible pour ces dates. Essayez une autre date ou un autre formateur.`
                : 'Aucun formateur qualifié n\'est disponible pour ces dates. Essayez une autre date.';
                
            return React.createElement('div', {
                className: 'bg-white rounded-lg border border-gray-200 p-8'
            }, [
                React.createElement('div', {
                    key: 'empty',
                    className: 'text-center'
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'calendar-x',
                        className: 'w-12 h-12 text-gray-400 mx-auto mb-4'
                    }),
                    React.createElement('h3', {
                        key: 'title',
                        className: 'text-lg font-medium text-gray-900 mb-2'
                    }, messageTitle),
                    React.createElement('p', {
                        key: 'description',
                        className: 'text-gray-600'
                    }, messageDescription)
                ])
            ]);
        }
        
        return React.createElement('div', {
            className: 'bg-white rounded-lg border border-gray-200'
        }, [
            React.createElement('div', {
                key: 'slots-header',
                className: 'p-4 border-b border-gray-200'
            }, [
                React.createElement('h3', {
                    key: 'title',
                    className: 'text-lg font-semibold text-gray-900'
                }, selectedDates.length === 1 ? 
                    `Créneaux disponibles - ${selectedDates[0].toLocaleDateString('fr-FR')}` :
                    `Créneaux disponibles - ${selectedDates[0].toLocaleDateString('fr-FR')} au ${selectedDates[selectedDates.length - 1].toLocaleDateString('fr-FR')}`),
                React.createElement('p', {
                    key: 'subtitle',
                    className: 'text-sm text-gray-600 mt-1'
                }, selectedFormateur 
                    ? `${availableSlots.length} créneau${availableSlots.length > 1 ? 's' : ''} pour ${selectedFormateur.prenom} ${selectedFormateur.nom} (${sessionDuration} jour${sessionDuration > 1 ? 's' : ''})`
                    : `${availableSlots.length} créneau${availableSlots.length > 1 ? 's' : ''} pour ${sessionDuration} jour${sessionDuration > 1 ? 's' : ''}`)
            ]),
            
            React.createElement('div', {
                key: 'slots-list',
                className: 'p-4 space-y-2 max-h-96 overflow-y-auto'
            }, availableSlots.map(slot => 
                React.createElement('button', {
                    key: `${slot.startTime}-${slot.endTime}`,
                    onClick: () => handleSlotBooking(slot),
                    disabled: bookingInProgress || disabled,
                    className: `
                        w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg
                        hover:border-blue-300 hover:bg-blue-50 transition-colors
                        ${bookingInProgress || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `.trim()
                }, [
                    React.createElement('div', {
                        key: 'time-info',
                        className: 'flex items-center'
                    }, [
                        React.createElement('i', {
                            key: 'clock-icon',
                            'data-lucide': 'clock',
                            className: 'w-4 h-4 text-gray-500 mr-3'
                        }),
                        React.createElement('span', {
                            key: 'time-display',
                            className: 'font-medium text-gray-900'
                        }, slot.display),
                        renderFormateursAvatars(slot.availableFormateurs)
                    ]),
                    React.createElement('div', {
                        key: 'book-button',
                        className: 'px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors'
                    }, bookingInProgress ? 
                        (editMode ? 'Modification...' : 'Réservation...') : 
                        (editMode ? 'Modifier' : 'Réserver'))
                ])
            ))
        ]);
    };
    
    if (!isDataValid) {
        return React.createElement('div', {
            className: 'bg-red-50 border border-red-200 rounded-lg p-4'
        }, React.createElement('p', {
            className: 'text-red-800 text-sm'
        }, 'Données invalides pour la réservation de session'));
    }
    
    return React.createElement('div', {
        className: 'space-y-4'
    }, [
        // Bouton pour ouvrir/fermer le widget
        React.createElement('button', {
            key: 'toggle-button',
            onClick: () => setIsExpanded(!isExpanded),
            disabled: disabled,
            className: `
                w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300 hover:bg-blue-50 cursor-pointer'}
                transition-colors
            `.trim()
        }, [
            React.createElement('div', {
                key: 'button-content',
                className: 'flex items-center'
            }, [
                React.createElement('i', {
                    key: 'calendar-icon',
                    'data-lucide': 'calendar',
                    className: 'w-5 h-5 text-gray-500 mr-3'
                }),
                React.createElement('span', {
                    key: 'button-text',
                    className: 'font-medium text-gray-900'
                }, isExpanded ? 'Fermer le calendrier' : 'Choisir une date et un créneau')
            ]),
            React.createElement('i', {
                key: 'chevron-icon',
                'data-lucide': isExpanded ? 'chevron-up' : 'chevron-down',
                className: 'w-5 h-5 text-gray-500'
            })
        ]),
        
        // Affichage des erreurs
        (localError || formateurError) && React.createElement('div', {
            key: 'error-display',
            className: 'bg-red-50 border border-red-200 rounded-lg p-4'
        }, [
            React.createElement('div', {
                key: 'error-content',
                className: 'flex items-start'
            }, [
                React.createElement('i', {
                    key: 'error-icon',
                    'data-lucide': 'alert-circle',
                    className: 'w-5 h-5 text-red-600 mt-0.5 mr-3'
                }),
                React.createElement('p', {
                    key: 'error-text',
                    className: 'text-red-800 text-sm'
                }, localError || formateurError)
            ])
        ]),
        

        // Interface de réservation (affichée seulement si expanded)
        isExpanded && React.createElement('div', {
            key: 'booking-interface',
            className: 'grid grid-cols-1 lg:grid-cols-2 gap-6 border border-gray-200 rounded-lg p-6'
        }, [
            // Calendrier (colonne gauche)
            React.createElement('div', { key: 'calendar-section' }, [
                renderCalendar(),
                renderFormateursDisponibles()
            ]),
            
            // Créneaux horaires (colonne droite)
            React.createElement('div', { key: 'slots-section' }, renderTimeSlots())
        ]),
        
        // Informations supplémentaires
        isExpanded && React.createElement('div', {
            key: 'info',
            className: 'bg-blue-50 rounded-lg p-4'
        }, [
            React.createElement('div', {
                key: 'info-content',
                className: 'flex items-start'
            }, [
                React.createElement('i', {
                    key: 'info-icon',
                    'data-lucide': 'info',
                    className: 'w-5 h-5 text-blue-600 mt-0.5 mr-3'
                }),
                React.createElement('div', { key: 'info-text' }, [
                    React.createElement('h4', {
                        key: 'info-title',
                        className: 'font-medium text-blue-900 mb-1'
                    }, 'À propos de cette session'),
                    React.createElement('p', {
                        key: 'info-description',
                        className: 'text-blue-800 text-sm'
                    }, `Session de formation ${logicielNom || 'logiciel'} d'une durée de ${sessionDuration} jour${sessionDuration > 1 ? 's' : ''}. Un formateur qualifié sera assigné à cette session.`)
                ])
            ])
        ])
    ]);
}

// Export global
window.SessionBookingWidget = SessionBookingWidget;