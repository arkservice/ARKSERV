console.log("🔥 [CHARGEMENT] AppointmentBookingPage.js CHARGÉ!");

// Page de prise de RDV avec formateurs
function AppointmentBookingPage({ tache, onBack, onAppointmentBooked }) {
    console.log("🎯 [AppointmentBookingPage] FONCTION APPELÉE avec tache:", tache);
    const { useState, useEffect } = React;
    const { getAvailableSlots, bookAppointment, modifyAppointment, getAvailabilityForCalendarMonth, loading, error: formateurError } = window.useFormateurs();
    
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentViewDate, setCurrentViewDate] = useState(new Date()); // Nouveau : date du mois affiché
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingInProgress, setBookingInProgress] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [monthAvailability, setMonthAvailability] = useState({ availableDays: [], availableRanges: [], availableFormateurs: [], slotsByDate: {} });
    const [loadingMonthAvailability, setLoadingMonthAvailability] = useState(false);
    const [selectedFormateur, setSelectedFormateur] = useState(null); // Filtre par formateur
    
    // Récupérer le logiciel du projet avec validation
    const logicielId = tache?.project?.logiciel_id || tache?.project?.logiciel?.id;
    const logicielNom = tache?.project?.logiciel?.nom || 'ce logiciel';
    
    // Récupérer les infos du RDV existant s'il y en a un
    const existingAppointment = tache?.existingAppointment || null;
    const isModifyingExistingAppointment = !!existingAppointment;
    
    // Validation des données critiques
    const isDataValid = tache && tache.project && logicielId;
    
    console.log("🔍 [AppointmentBookingPage] Validation des données:");
    console.log("  - tache:", !!tache);
    console.log("  - tache.project:", !!tache?.project);
    console.log("  - logicielId:", logicielId);
    console.log("  - logicielNom:", logicielNom);
    console.log("  - existingAppointment:", existingAppointment);
    console.log("  - isModifyingExistingAppointment:", isModifyingExistingAppointment);
    console.log("  - isDataValid:", isDataValid);
    
    // LOGS DE DEBUG BASIQUES
    console.log("🔧 [AppointmentBookingPage] tache:", tache);
    console.log("🔧 [AppointmentBookingPage] tache.project:", tache?.project);
    console.log("🔧 [AppointmentBookingPage] logicielId:", logicielId);
    console.log("🔧 [AppointmentBookingPage] selectedDate:", selectedDate);
    
    useEffect(() => {
        lucide.createIcons();
    }, [availableSlots, selectedDate]);
    
    useEffect(() => {
        console.log("🎯 [useEffect] logicielId:", logicielId, "selectedDate:", selectedDate, "isDataValid:", isDataValid);
        if (isDataValid && logicielId && selectedDate) {
            console.log("⚡ [useEffect] Conditions remplies, récupération instantanée depuis le cache");
            // Récupération instantanée depuis le cache pré-calculé
            const slots = getSlotsByDate(selectedDate);
            setAvailableSlots(slots);
            setLoadingSlots(false);
        } else {
            console.log("❌ [useEffect] Conditions non remplies");
            if (!isDataValid) {
                console.log("⚠️ [useEffect] Données de la tâche invalides");
            }
        }
    }, [logicielId, selectedDate, isDataValid, monthAvailability.slotsByDate]);
    
    // Charger les disponibilités du mois pour l'affichage visuel
    useEffect(() => {
        if (isDataValid && logicielId) {
            loadMonthAvailability();
        }
    }, [logicielId, isDataValid, currentViewDate]); // Ajouter currentViewDate pour recharger à chaque changement de mois
    
    const loadMonthAvailability = async () => {
        console.log("🚀 [loadMonthAvailability] DEBUT - logicielId:", logicielId);
        
        if (!logicielId || !isDataValid) {
            console.log("❌ [loadMonthAvailability] Données invalides, abandon");
            return;
        }
        
        try {
            setLoadingMonthAvailability(true);
            const year = currentViewDate.getFullYear();
            const month = currentViewDate.getMonth();
            
            console.log("📅 [loadMonthAvailability] Chargement pour", year, month);
            const availability = await getAvailabilityForCalendarMonth(logicielId, year, month, 1); // 1 jour pour les RDV
            console.log("📋 [loadMonthAvailability] Disponibilités reçues:", availability);
            setMonthAvailability(availability);
        } catch (err) {
            console.error('❌ Erreur lors du chargement des disponibilités du mois:', err);
        } finally {
            setLoadingMonthAvailability(false);
        }
    };
    
    // OBSOLÈTE : Remplacé par le cache pré-calculé pour de meilleures performances
    // const loadAvailableSlots = async () => { ... };
    
    const handleDateSelect = (date) => {
        // Ne permettre que les dates futures (à partir d'aujourd'hui)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date >= today) {
            setSelectedDate(date);
            // Chargement instantané des créneaux depuis le cache
            const slots = getSlotsByDate(date);
            setAvailableSlots(slots);
            console.log(`⚡ [handleDateSelect] Affichage instantané pour ${date.toDateString()}: ${slots.length} créneaux`);
        }
    };
    
    const handleSlotBooking = async (slot) => {
        if (!tache || bookingInProgress) return;
        
        try {
            setBookingInProgress(true);
            
            let result;
            if (isModifyingExistingAppointment) {
                // Modifier le RDV existant
                console.log('🔄 [handleSlotBooking] Modification du RDV existant');
                result = await modifyAppointment(
                    existingAppointment,
                    slot,
                    selectedDate,
                    tache.id,
                    tache.project_id,
                    logicielId
                );
            } else {
                // Créer un nouveau RDV
                console.log('🆕 [handleSlotBooking] Création d\'un nouveau RDV');
                result = await bookAppointment(
                    slot,
                    selectedDate,
                    tache.id,
                    tache.project_id,
                    logicielId
                );
            }
            
            // Notifier le succès et retourner à la page précédente
            onAppointmentBooked && onAppointmentBooked(result);
            
        } catch (err) {
            console.error('Erreur lors de la réservation:', err);
            const action = isModifyingExistingAppointment ? 'modification' : 'réservation';
            alert(`Erreur lors de la ${action} du créneau. Veuillez réessayer.`);
        } finally {
            setBookingInProgress(false);
        }
    };
    
    const isDateSelectable = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Permettre seulement les dates futures, quel que soit le mois affiché
        return date >= today;
    };
    
    const getInitials = (prenom, nom) => {
        if (prenom && nom) {
            return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
        } else if (prenom) {
            return prenom.substring(0, 2).toUpperCase();
        }
        return 'F'; // F pour Formateur par défaut
    };
    
    // Fonction pour rendre les avatars + noms des formateurs disponibles (optimisée pour les créneaux)
    const renderFormateursAvatars = (availableFormateurs) => {
        if (!availableFormateurs || availableFormateurs.length === 0) {
            return null;
        }
        
        return React.createElement('div', {
            className: 'flex items-center gap-2 ml-3'
        }, availableFormateurs.map((formateur, index) => 
            React.createElement('div', {
                key: formateur.id,
                className: 'flex items-center gap-1',
                title: `${formateur.prenom} ${formateur.nom}` // Tooltip au survol
            }, [
                // Avatar ou initiales (plus petit pour les créneaux)
                formateur.avatar ? 
                    React.createElement('img', {
                        key: 'avatar',
                        src: formateur.avatar,
                        alt: `${formateur.prenom} ${formateur.nom}`,
                        className: 'w-5 h-5 rounded-full object-cover border border-gray-200',
                        onError: (e) => {
                            // En cas d'erreur de chargement, remplacer par les initiales
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }
                    }) : null,
                React.createElement('div', {
                    key: 'initials',
                    className: 'w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium border border-gray-200',
                    style: formateur.avatar ? { display: 'none' } : {}
                }, getInitials(formateur.prenom, formateur.nom)),
                // Nom du formateur (prénom + première lettre du nom)
                React.createElement('span', {
                    key: 'name',
                    className: 'text-xs text-gray-600'
                }, `${formateur.prenom} ${formateur.nom.charAt(0)}.`)
            ])
        ));
    };
    
    // Fonction optimisée pour récupérer les créneaux d'une date avec filtrage optionnel par formateur
    const getSlotsByDate = (date) => {
        const dateKey = date.toDateString();
        let slots = monthAvailability.slotsByDate[dateKey] || [];
        
        // Filtrer par formateur si un filtre est actif
        if (selectedFormateur) {
            slots = slots.filter(slot => 
                slot.availableFormateurs && 
                slot.availableFormateurs.some(formateur => formateur.id === selectedFormateur.id)
            ).map(slot => ({
                ...slot,
                // Ne garder que le formateur sélectionné dans la liste
                availableFormateurs: slot.availableFormateurs.filter(formateur => formateur.id === selectedFormateur.id),
                formateurCount: 1
            }));
        }
        
        console.log(`⚡ [getSlotsByDate] ${dateKey}: ${slots.length} créneaux${selectedFormateur ? ` (filtrés pour ${selectedFormateur.prenom})` : ''}`);
        return slots;
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
    
    const renderFormateursDisponibles = () => {
        if (!monthAvailability.availableFormateurs || monthAvailability.availableFormateurs.length === 0) {
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
            }, monthAvailability.availableFormateurs.map(formateur => {
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
            // En-tête du calendrier avec navigation
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
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isSelectable = isDateSelectable(date) && isCurrentMonth;
                
                // Vérifier si ce jour a des disponibilités (avec filtrage optionnel par formateur)
                let hasAvailability;
                if (selectedFormateur) {
                    // Si un formateur est sélectionné, vérifier ses disponibilités spécifiques
                    const daySlots = getSlotsByDate(date);
                    hasAvailability = daySlots.length > 0;
                } else {
                    // Sinon, utiliser la logique standard
                    hasAvailability = monthAvailability.availableDays.some(
                        availableDate => availableDate.toDateString() === date.toDateString()
                    );
                }
                
                return React.createElement('button', {
                    key: date.toISOString(),
                    onClick: () => isSelectable && handleDateSelect(date),
                    disabled: !isSelectable,
                    className: `
                        p-2 text-sm rounded-md transition-colors
                        ${!isCurrentMonth ? 'text-gray-300' : ''}
                        ${isToday ? 'bg-blue-100 text-blue-600 font-semibold' : ''}
                        ${isSelected ? 'bg-blue-600 text-white' : ''}
                        ${isSelectable && !isSelected && !isToday && hasAvailability ? 'bg-gray-200 hover:bg-gray-300 text-gray-900' : ''}
                        ${isSelectable && !isSelected && !isToday && !hasAvailability ? 'hover:bg-gray-100 text-gray-900' : ''}
                        ${!isSelectable ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer'}
                    `.trim()
                }, date.getDate())
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
                ? `${selectedFormateur.prenom} ${selectedFormateur.nom} n'est pas disponible ce jour. Essayez une autre date ou un autre formateur.`
                : 'Aucun formateur qualifié n\'est disponible ce jour. Essayez une autre date.';
                
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
                }, `Créneaux disponibles - ${selectedDate.toLocaleDateString('fr-FR')}`),
                React.createElement('p', {
                    key: 'subtitle',
                    className: 'text-sm text-gray-600 mt-1'
                }, selectedFormateur 
                    ? `${availableSlots.length} créneau${availableSlots.length > 1 ? 's' : ''} pour ${selectedFormateur.prenom} ${selectedFormateur.nom}`
                    : `${availableSlots.length} créneau${availableSlots.length > 1 ? 's' : ''} de 30 minutes`
                )
            ]),
            
            React.createElement('div', {
                key: 'slots-list',
                className: 'p-4 space-y-2 max-h-96 overflow-y-auto'
            }, availableSlots.map(slot => 
                React.createElement('button', {
                    key: `${slot.startTime}-${slot.endTime}`,
                    onClick: () => handleSlotBooking(slot),
                    disabled: bookingInProgress,
                    className: `
                        w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg
                        hover:border-blue-300 hover:bg-blue-50 transition-colors
                        ${bookingInProgress ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
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
                        (isModifyingExistingAppointment ? 'Modification...' : 'Réservation...') :
                        (isModifyingExistingAppointment ? 'Modifier' : 'Réserver'))
                ])
            ))
        ]);
    };
    
    if (!tache) {
        return React.createElement('div', {
            className: 'bg-white rounded-lg border border-gray-200 p-8'
        }, React.createElement('p', {
            className: 'text-gray-600'
        }, 'Tâche non trouvée'));
    }
    
    return React.createElement('div', {
        className: 'space-y-6'
    }, [
        // En-tête avec navigation
        React.createElement('div', {
            key: 'header',
            className: 'bg-white rounded-lg border border-gray-200 p-6'
        }, [
            window.DetailPageHeader({
                onBack: onBack,
                breadcrumbBase: "Tâches",
                breadcrumbCurrent: "Prise de rendez-vous"
            }),
            React.createElement('div', {
                key: 'title-section'
            }, [
                React.createElement('h1', {
                    key: 'title',
                    className: 'text-2xl font-bold text-gray-900 mb-2'
                }, isModifyingExistingAppointment ? 
                    `Modifier votre RDV avec un formateur qualifié` :
                    `Prendre RDV avec un formateur qualifié`),
                React.createElement('p', {
                    key: 'subtitle',
                    className: 'text-gray-600'
                }, `Sélectionnez un créneau de 30 minutes pour un rendez-vous de qualification sur ${logicielNom}`)
            ])
        ]),
        
        // Affichage des informations du RDV existant si en mode modification
        isModifyingExistingAppointment && React.createElement('div', {
            key: 'existing-appointment-info',
            className: 'bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6'
        }, [
            React.createElement('div', {
                key: 'existing-info-header',
                className: 'flex items-center mb-2'
            }, [
                React.createElement('i', {
                    key: 'existing-icon',
                    'data-lucide': 'calendar-clock',
                    className: 'w-5 h-5 text-orange-600 mr-2'
                }),
                React.createElement('h3', {
                    key: 'existing-title',
                    className: 'font-medium text-orange-900'
                }, 'RDV existant')
            ]),
            React.createElement('p', {
                key: 'existing-details',
                className: 'text-orange-800'
            }, `Vous avez déjà un rendez-vous programmé le ${existingAppointment?.date} à ${existingAppointment?.heure} avec ${existingAppointment?.formateurNom}. Sélectionnez un nouveau créneau pour le modifier.`)
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
                React.createElement('div', { key: 'error-text' }, [
                    React.createElement('h4', {
                        key: 'error-title',
                        className: 'font-medium text-red-900 mb-1'
                    }, 'Erreur lors du chargement'),
                    React.createElement('p', {
                        key: 'error-message',
                        className: 'text-red-800 text-sm'
                    }, localError || formateurError)
                ])
            ])
        ]),
        
        // Interface de réservation (style cal.com)
        React.createElement('div', {
            key: 'booking-interface',
            className: 'grid grid-cols-1 lg:grid-cols-2 gap-6'
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
        React.createElement('div', {
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
                    }, 'À propos de ce rendez-vous'),
                    React.createElement('p', {
                        key: 'info-description',
                        className: 'text-blue-800 text-sm'
                    }, 'Un formateur expert vous aidera à définir le plan de formation le plus adapté à vos besoins. Le rendez-vous dure 30 minutes et se déroule par visioconférence.')
                ])
            ])
        ])
    ]);
}

// Export global
window.AppointmentBookingPage = AppointmentBookingPage;