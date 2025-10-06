function TimelineView({ 
    users = [], 
    events = [], 
    selectedDate = new Date(), 
    viewMode = 'week', // 'week' or 'month'
    onEventClick, 
    onDateClick, 
    onNavigate 
}) {
    const [currentDate, setCurrentDate] = React.useState(selectedDate);
    const [containerWidth, setContainerWidth] = React.useState(0);
    const timelineRef = React.useRef(null);
    
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    const userColors = [
        'bg-blue-100 text-blue-800 border-blue-200',
        'bg-green-100 text-green-800 border-green-200', 
        'bg-purple-100 text-purple-800 border-purple-200',
        'bg-yellow-100 text-yellow-800 border-yellow-200',
        'bg-pink-100 text-pink-800 border-pink-200',
        'bg-indigo-100 text-indigo-800 border-indigo-200',
        'bg-red-100 text-red-800 border-red-200',
        'bg-orange-100 text-orange-800 border-orange-200'
    ];
    
    const getUserColor = (userId) => {
        const userIndex = users.findIndex(u => u.id === userId);
        return userIndex >= 0 ? userColors[userIndex % userColors.length] : 'bg-gray-100 text-gray-800 border-gray-200';
    };
    
    const getUserDisplayName = (user) => {
        const fullName = `${user.prenom || ''} ${user.nom || ''}`.trim();
        return fullName || 'Sans nom';
    };
    
    const getUserInitials = (user) => {
        if (user.prenom && user.nom) {
            return `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
        } else if (user.prenom) {
            return user.prenom.substring(0, 2).toUpperCase();
        }
        return 'U';
    };
    
    // Fonction pour détecter les weekends
    const isWeekend = (date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // Dimanche ou Samedi
    };
    
    // Calcul des dates de la période affichée
    const getPeriodDates = () => {
        const dates = [];
        let startDate;
        
        if (viewMode === 'week') {
            // Commencer au lundi de la semaine
            startDate = new Date(currentDate);
            const dayOfWeek = startDate.getDay();
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            startDate.setDate(startDate.getDate() + mondayOffset);
            
            // 8 jours pour la semaine (lundi à lundi suivant)
            for (let i = 0; i < 8; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                dates.push({
                    date: date,
                    isWeekend: isWeekend(date)
                });
            }
        } else {
            // Mode mois : utiliser le nombre exact de jours du mois
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
            
            for (let i = 0; i < daysInMonth; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                dates.push({
                    date: date,
                    isWeekend: isWeekend(date)
                });
            }
        }
        
        return dates;
    };
    
    const periodDates = getPeriodDates();
    
    // Calcul des largeurs fixes pour les colonnes
    const calculateFixedWidths = () => {
        const userColumnWidth = 192; // 192px pour la colonne utilisateurs (w-48)
        const totalDays = periodDates.length;
        const weekendDays = periodDates.filter(d => d.isWeekend).length;
        const weekDays = totalDays - weekendDays;
        
        // Utiliser la largeur réelle du conteneur, avec fallback
        const realWidth = containerWidth > 0 ? containerWidth : (viewMode === 'week' ? 800 : 1200);
        const availableWidth = realWidth - userColumnWidth;
        
        // Ratio weekend = 60% d'un jour normal
        const weekendRatio = 0.6;
        const totalRelativeWidth = weekDays + (weekendDays * weekendRatio);
        
        // Largeurs fixes calculées
        const weekdayWidth = Math.floor(availableWidth / totalRelativeWidth);
        const weekendWidth = Math.floor(weekdayWidth * weekendRatio);
        
        // Génération du template avec des pixels fixes
        const columns = [`${userColumnWidth}px`];
        periodDates.forEach(dateObj => {
            columns.push(dateObj.isWeekend ? `${weekendWidth}px` : `${weekdayWidth}px`);
        });
        
        return {
            template: columns.join(' '),
            weekdayWidth,
            weekendWidth,
            userColumnWidth
        };
    };
    
    const gridWidths = React.useMemo(() => calculateFixedWidths(), [containerWidth, periodDates, viewMode]);
    
    // Mesure de la largeur du conteneur et gestion du redimensionnement
    React.useEffect(() => {
        const updateContainerWidth = () => {
            if (timelineRef.current) {
                // Mesurer la largeur réelle du conteneur moins padding/borders
                const rect = timelineRef.current.getBoundingClientRect();
                setContainerWidth(rect.width);
            }
        };
        
        // Mesurer initialement
        updateContainerWidth();
        
        // Ajouter le listener de redimensionnement
        window.addEventListener('resize', updateContainerWidth);
        
        // Nettoyer le listener
        return () => window.removeEventListener('resize', updateContainerWidth);
    }, [viewMode, users, currentDate]); // Recalculer quand ces valeurs changent
    
    // Fonction pour calculer l'empan d'un événement sur plusieurs jours
    const calculateEventSpan = (event, periodDates) => {
        if (!event || !event.date_debut || !event.date_fin || !periodDates || periodDates.length === 0) {
            return { startIndex: 0, span: 1, isStartVisible: false, isEndVisible: false };
        }
        
        const eventStart = new Date(event.date_debut);
        const eventEnd = new Date(event.date_fin);
        
        // Trouver l'index de début et fin dans la période affichée
        const startIndex = periodDates.findIndex(dateObj => {
            return window.DateUtils ? window.DateUtils.isSameDay(dateObj.date, eventStart) : false;
        });
        
        const endIndex = periodDates.findIndex(dateObj => {
            return window.DateUtils ? window.DateUtils.isSameDay(dateObj.date, eventEnd) : false;
        });
        
        // Si l'événement commence avant la période affichée, commencer au début de la période
        const actualStartIndex = startIndex >= 0 ? startIndex : 0;
        // Si l'événement finit après la période affichée, finir à la fin de la période
        const actualEndIndex = endIndex >= 0 ? endIndex : periodDates.length - 1;
        
        // Assurer qu'on a au moins 1 jour de span
        const span = Math.max(1, actualEndIndex - actualStartIndex + 1);
        
        return {
            startIndex: actualStartIndex,
            span: span,
            isStartVisible: startIndex >= 0,
            isEndVisible: endIndex >= 0,
            // Informations additionnelles pour le debug
            originalStart: startIndex,
            originalEnd: endIndex,
            eventStart: eventStart,
            eventEnd: eventEnd
        };
    };
    
    // Fonction pour obtenir les événements qui COMMENCENT à une date donnée (évite les duplications)
    const getEventsStartingOnDate = (userId, date) => {
        // Utiliser les fonctions utilitaires centralisées pour éviter les problèmes de fuseaux horaires
        return window.DateUtils ? window.DateUtils.getEventsStartingOnDate(events, date, userId) : [];
    };
    
    // Fonction pour vérifier si un événement est actif à une date donnée
    const isEventActiveOnDate = (event, date) => {
        // Utiliser les fonctions utilitaires centralisées pour éviter les problèmes de fuseaux horaires
        return window.DateUtils ? window.DateUtils.isEventActiveOnDate(event, date) : false;
    };
    
    // Navigation
    const navigatePeriod = (direction) => {
        const newDate = new Date(currentDate);
        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + (direction * 7));
        } else {
            newDate.setMonth(newDate.getMonth() + direction);
        }
        setCurrentDate(newDate);
        if (onNavigate) onNavigate(newDate);
    };
    
    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        if (onNavigate) onNavigate(today);
    };
    
    // Formatage de la période affichée
    const getPeriodLabel = () => {
        if (viewMode === 'week') {
            const firstDate = periodDates[0].date;
            const lastDate = periodDates[7].date; // 8ème jour (lundi suivant)
            return `Semaine du ${firstDate.getDate()}-${lastDate.getDate()} ${monthNames[firstDate.getMonth()]} ${firstDate.getFullYear()}`;
        } else {
            return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        }
    };
    
    // Fonction pour obtenir les événements actifs qui ont commencé avant la période visible
    const getActiveEventsStartingBefore = (userId, date, dateIndex) => {
        if (dateIndex !== 0) return []; // Ne traiter que le premier jour de la période
        
        const firstDate = periodDates[0].date;
        return events.filter(event => {
            if (event.user_id !== userId) return false;
            
            const eventStart = new Date(event.date_debut);
            const eventEnd = new Date(event.date_fin);
            
            // L'événement doit commencer avant la période ET être actif au premier jour
            const startsBeforePeriod = eventStart < firstDate;
            const isActiveAtFirstDate = window.DateUtils ? window.DateUtils.isEventActiveOnDate(event, firstDate) : false;
            
            return startsBeforePeriod && isActiveAtFirstDate;
        });
    };
    
    // Rendu des cellules d'événements avec gestion des événements étendus
    const renderEventCell = (user, dateObj, dateIndex) => {
        const date = dateObj.date;
        const isWeekend = dateObj.isWeekend;
        
        // CORRECTION : Obtenir les événements qui commencent à cette date OU qui sont actifs et commencent avant la période visible
        const eventsStartingHere = getEventsStartingOnDate(user.id, date);
        const activeEventsStartingBefore = getActiveEventsStartingBefore(user.id, date, dateIndex);
        
        // Déduplication pour éviter les doublons d'événements (même ID)
        const allEvents = [...eventsStartingHere, ...activeEventsStartingBefore];
        const allEventsToRender = allEvents.filter((event, index, arr) => 
            arr.findIndex(e => e.id === event.id) === index
        );
        
        const isToday = window.DateUtils ? window.DateUtils.isToday(date) : (date.toDateString() === new Date().toDateString());
        
        const bgColor = isWeekend ? 'bg-gray-50' : 'bg-white';
        
        return React.createElement('div', {
            key: `${user.id}-${date.toISOString()}`,
            className: `min-h-[60px] p-1 border-r border-b border-gray-200 cursor-pointer hover:bg-gray-100 relative ${bgColor} ${isToday ? 'bg-blue-50' : ''}`,
            style: {
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'visible' // Permettre aux événements étendus de déborder
            },
            onClick: () => onDateClick && onDateClick(date, user.id)
        }, [
            // Afficher les événements qui COMMENCENT à cette date OU qui sont actifs et ont commencé avant
            ...allEventsToRender.map(event => {
                const spanInfo = calculateEventSpan(event, periodDates);
                const eventStart = new Date(event.date_debut);
                const eventEnd = new Date(event.date_fin);
                
                // Créer un tooltip détaillé avec les heures
                const tooltip = `${event.titre}\nType: ${event.type_evenement}\nDébut: ${eventStart.toLocaleString('fr-FR')}\nFin: ${eventEnd.toLocaleString('fr-FR')}\nStatut: ${event.statut}`;
                
                // Style pour l'événement étendu - avec contraintes strictes
                let eventStyle = `text-xs p-1 m-1 rounded border cursor-pointer overflow-hidden text-ellipsis ${getUserColor(event.user_id)}`;
                
                // Si l'événement s'étend sur plusieurs jours, ajuster le style
                if (spanInfo.span > 1) {
                    // Calculer la largeur totale fixe pour l'événement
                    let totalWidth = 0;
                    for (let i = spanInfo.startIndex; i < spanInfo.startIndex + spanInfo.span; i++) {
                        if (i < periodDates.length) {
                            totalWidth += periodDates[i].isWeekend ? gridWidths.weekendWidth : gridWidths.weekdayWidth;
                        }
                    }
                    // Ajuster pour les marges et padding internes
                    totalWidth -= 16; // Soustraire marges (m-1 = 4px) et padding (p-1 = 4px) des deux côtés
                    
                    eventStyle += ' absolute z-10';
                    
                    return React.createElement('div', {
                        key: event.id,
                        className: eventStyle,
                        style: {
                            width: `${Math.max(totalWidth, 50)}px`, // Largeur minimum de 50px
                            maxWidth: `${totalWidth}px`,
                            left: '4px',
                            top: '4px',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            zIndex: 15 // Plus élevé pour être au-dessus des autres éléments
                        },
                        onClick: (e) => {
                            e.stopPropagation();
                            onEventClick && onEventClick(event);
                        },
                        title: tooltip
                    }, [
                        React.createElement('span', {
                            key: 'title',
                            className: 'font-medium'
                        }, event.titre),
                        spanInfo.span > 1 && React.createElement('span', {
                            key: 'duration',
                            className: 'ml-1 text-xs opacity-75'
                        }, `(${spanInfo.span}j)${!spanInfo.isStartVisible ? '◀' : ''}${!spanInfo.isEndVisible ? '▶' : ''}`),
                        // Afficher les heures pour les événements multi-jours aussi
                        (eventStart.getHours() !== 0 || eventStart.getMinutes() !== 0) && React.createElement('span', {
                            key: 'time',
                            className: 'ml-1 text-xs opacity-75'
                        }, eventStart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
                    ]);
                } else {
                    // Événement d'une seule journée
                    return React.createElement('div', {
                        key: event.id,
                        className: eventStyle,
                        style: {
                            maxWidth: '100%',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden'
                        },
                        onClick: (e) => {
                            e.stopPropagation();
                            onEventClick && onEventClick(event);
                        },
                        title: tooltip
                    }, [
                        React.createElement('span', {
                            key: 'title'
                        }, event.titre),
                        // Indicateur d'heure si ce n'est pas toute la journée
                        (eventStart.getHours() !== 0 || eventStart.getMinutes() !== 0) && React.createElement('span', {
                            key: 'time',
                            className: 'ml-1 text-xs opacity-75'
                        }, eventStart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
                    ]);
                }
            })
        ]);
    };
    
    // Rendu de l'en-tête des dates
    const renderDateHeaders = () => {
        return periodDates.map(dateObj => {
            const date = dateObj.date;
            const isWeekend = dateObj.isWeekend;
            const isToday = window.DateUtils ? window.DateUtils.isToday(date) : (date.toDateString() === new Date().toDateString());
            
            const bgColor = isToday ? 'bg-blue-100 text-blue-800' : 
                           isWeekend ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700';
            
            return React.createElement('div', {
                key: date.toISOString(),
                className: `p-2 text-center text-sm font-medium border-r border-gray-200 overflow-hidden ${bgColor}`,
                style: {
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                }
            }, [
                React.createElement('div', {
                    key: 'day',
                    className: 'font-bold'
                }, viewMode === 'week' ? dayNames[date.getDay() === 0 ? 6 : date.getDay() - 1] : date.getDate()),
                React.createElement('div', {
                    key: 'date',
                    className: 'text-xs'
                }, viewMode === 'week' ? 
                    `${date.getDate()}/${date.getMonth() + 1}` : 
                    dayNames[date.getDay() === 0 ? 6 : date.getDay() - 1]
                ),
                isWeekend && React.createElement('div', {
                    key: 'weekend-indicator',
                    className: 'text-xs italic'
                }, 'WE')
            ]);
        });
    };
    
    // Rendu d'une ligne utilisateur
    const renderUserRow = (user) => {
        return React.createElement('div', {
            key: user.id,
            className: 'grid border-b border-gray-200',
            style: {
                gridTemplateColumns: gridWidths.template
            }
        }, [
            // Cellule utilisateur
            React.createElement('div', {
                key: 'user-cell',
                className: 'p-3 bg-gray-50 border-r border-gray-200 flex items-center gap-3 sticky left-0 z-10 overflow-hidden',
                style: {
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                }
            }, [
                // Avatar
                user.avatar ? 
                    React.createElement('img', {
                        key: 'avatar',
                        src: user.avatar,
                        alt: `Avatar de ${getUserDisplayName(user)}`,
                        className: 'w-8 h-8 rounded-full object-cover'
                    }) :
                    React.createElement('div', {
                        key: 'avatar-fallback',
                        className: 'w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium'
                    }, getUserInitials(user)),
                
                React.createElement('div', {
                    key: 'user-info',
                    className: 'flex-1 min-w-0'
                }, [
                    React.createElement('p', {
                        key: 'name',
                        className: 'font-medium text-gray-900 truncate text-sm'
                    }, getUserDisplayName(user)),
                    React.createElement('p', {
                        key: 'role',
                        className: 'text-xs text-gray-500 truncate'
                    }, user.fonction?.nom || 'Fonction inconnue')
                ])
            ]),
            
            // Cellules des événements
            ...periodDates.map((dateObj, index) => renderEventCell(user, dateObj, index))
        ]);
    };
    
    React.useEffect(() => {
        lucide.createIcons();
    }, [currentDate, viewMode, events]);
    
    return React.createElement('div', {
        className: 'w-full',
        ref: timelineRef
    }, [
        // En-tête avec navigation centrée
        React.createElement('div', {
            key: 'header',
            className: 'flex items-center justify-center mb-4'
        }, [
            // Chevron gauche
            React.createElement('button', {
                key: 'prev',
                className: 'p-2 rounded-md hover:bg-gray-100 text-gray-600',
                onClick: () => navigatePeriod(-1)
            }, React.createElement('svg', {
                className: 'w-5 h-5',
                fill: 'none',
                stroke: 'currentColor',
                viewBox: '0 0 24 24',
                xmlns: 'http://www.w3.org/2000/svg'
            }, React.createElement('path', {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2,
                d: 'm15 18-6-6 6-6'
            }))),
            
            // Titre centré
            React.createElement('h3', {
                key: 'title',
                className: 'text-lg font-semibold text-gray-900 mx-6'
            }, getPeriodLabel()),
            
            // Chevron droite
            React.createElement('button', {
                key: 'next',
                className: 'p-2 rounded-md hover:bg-gray-100 text-gray-600',
                onClick: () => navigatePeriod(1)
            }, React.createElement('svg', {
                className: 'w-5 h-5',
                fill: 'none',
                stroke: 'currentColor',
                viewBox: '0 0 24 24',
                xmlns: 'http://www.w3.org/2000/svg'
            }, React.createElement('path', {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2,
                d: 'm9 18 6-6-6-6'
            })))
        ]),
        
        // Grille timeline
        React.createElement('div', {
            key: 'timeline',
            className: 'border border-gray-200 rounded-lg w-full',
            style: {
                overflow: 'auto' // Permettre le scroll pour les gros tableaux mais garder les événements visibles
            }
        }, [
            // En-tête des dates
            React.createElement('div', {
                key: 'date-header',
                className: 'grid bg-gray-100 border-b border-gray-200',
                style: {
                    gridTemplateColumns: gridWidths.template
                }
            }, [
                React.createElement('div', {
                    key: 'user-header',
                    className: 'p-3 font-medium text-gray-700 sticky left-0 bg-gray-100 z-20 border-r border-gray-200 overflow-hidden',
                    style: {
                        maxWidth: '100%',
                        boxSizing: 'border-box'
                    }
                }, 'Collaborateurs'),
                ...renderDateHeaders()
            ]),
            
            // Lignes des utilisateurs
            React.createElement('div', {
                key: 'user-rows',
                className: 'max-h-96 overflow-y-auto'
            }, users.length === 0 ? [
                React.createElement('div', {
                    key: 'empty-state',
                    className: 'text-center py-12'
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'calendar',
                        className: 'w-12 h-12 text-gray-400 mx-auto mb-4'
                    }),
                    React.createElement('h3', {
                        key: 'title',
                        className: 'text-lg font-medium text-gray-900 mb-2'
                    }, 'Aucun utilisateur sélectionné'),
                    React.createElement('p', {
                        key: 'description',
                        className: 'text-gray-500'
                    }, 'Sélectionnez des collaborateurs pour voir leur planning en vue chronologique')
                ])
            ] : users.map(renderUserRow))
        ])
    ]);
}

window.TimelineView = TimelineView;