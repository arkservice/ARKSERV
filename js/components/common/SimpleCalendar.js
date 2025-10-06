function SimpleCalendar({ events = [], onEventClick, onDateClick, selectedDate = new Date(), onDateChange = null }) {
    const [currentDate, setCurrentDate] = React.useState(selectedDate);
    
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    const typeColors = {
        'formation': 'bg-blue-100 text-blue-800 border-blue-200',
        'reunion': 'bg-green-100 text-green-800 border-green-200',
        'conge': 'bg-purple-100 text-purple-800 border-purple-200',
        'maintenance': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'deplacement': 'bg-orange-100 text-orange-800 border-orange-200',
        'rendez_vous': 'bg-pink-100 text-pink-800 border-pink-200',
        'autre': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    const getFirstDayOfMonth = (date) => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        return firstDay.getDay() === 0 ? 7 : firstDay.getDay();
    };
    
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };
    
    const getDaysInPrevMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 0).getDate();
    };
    
    const getEventsForDate = (date) => {
        // Utiliser les fonctions utilitaires centralisées pour éviter les problèmes de fuseaux horaires
        return window.DateUtils ? window.DateUtils.getEventsForDate(events, date) : [];
    };
    
    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
        
        // Notifier le parent du changement de date si callback fourni
        if (onDateChange) {
            onDateChange(newDate);
        }
    };
    
    const renderCalendarDays = () => {
        const firstDay = getFirstDayOfMonth(currentDate);
        const daysInMonth = getDaysInMonth(currentDate);
        const daysInPrevMonth = getDaysInPrevMonth(currentDate);
        const today = new Date();
        const cells = [];
        
        // Jours du mois précédent
        for (let i = firstDay - 1; i >= 1; i--) {
            const day = daysInPrevMonth - i + 1;
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
            cells.push(
                React.createElement('div', {
                    key: `prev-${day}`,
                    className: 'min-h-[80px] p-1 text-gray-400 text-sm border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50',
                    onClick: () => onDateClick && onDateClick(date)
                }, day)
            );
        }
        
        // Jours du mois actuel
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayEvents = getEventsForDate(date);
            const isToday = window.DateUtils ? window.DateUtils.isToday(date) : (date.toDateString() === today.toDateString());
            
            cells.push(
                React.createElement('div', {
                    key: day,
                    className: `min-h-[80px] p-1 text-sm border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50 ${isToday ? 'bg-blue-50' : ''}`,
                    onClick: () => onDateClick && onDateClick(date)
                }, [
                    React.createElement('div', {
                        key: 'day-number',
                        className: `font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`
                    }, day),
                    ...dayEvents.map((event, index) => 
                        React.createElement('div', {
                            key: event.id,
                            className: `text-xs p-1 mb-1 rounded border cursor-pointer truncate ${typeColors[event.type_evenement] || typeColors['autre']}`,
                            onClick: (e) => {
                                e.stopPropagation();
                                onEventClick && onEventClick(event);
                            },
                            title: event.titre
                        }, event.titre)
                    )
                ])
            );
        }
        
        // Jours du mois suivant pour compléter la grille
        const totalCells = Math.ceil((firstDay - 1 + daysInMonth) / 7) * 7;
        const remainingCells = totalCells - cells.length;
        
        for (let day = 1; day <= remainingCells; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
            cells.push(
                React.createElement('div', {
                    key: `next-${day}`,
                    className: 'min-h-[80px] p-1 text-gray-400 text-sm border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50',
                    onClick: () => onDateClick && onDateClick(date)
                }, day)
            );
        }
        
        return cells;
    };
    
    return React.createElement('div', {
        className: 'w-full'
    }, [
        // En-tête du calendrier avec navigation centrée
        React.createElement('div', {
            key: 'header',
            className: 'text-center mb-4'
        }, [
            // Navigation mois avec chevrons
            React.createElement('div', {
                key: 'month-navigation',
                className: 'flex items-center justify-center gap-4 mb-2'
            }, [
                React.createElement('button', {
                    key: 'prev-month',
                    onClick: () => navigateMonth(-1),
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
                }, `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`),
                React.createElement('button', {
                    key: 'next-month',
                    onClick: () => navigateMonth(1),
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
            ])
        ]),
        
        // Grille du calendrier
        React.createElement('div', {
            key: 'calendar',
            className: 'border border-gray-200 rounded-lg overflow-hidden'
        }, [
            // En-tête des jours
            React.createElement('div', {
                key: 'days-header',
                className: 'grid grid-cols-7 bg-gray-50'
            }, dayNames.map(day => 
                React.createElement('div', {
                    key: day,
                    className: 'p-2 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0'
                }, day)
            )),
            
            // Grille des dates
            React.createElement('div', {
                key: 'days-grid',
                className: 'grid grid-cols-7'
            }, renderCalendarDays())
        ]),
        
        // Légende
        React.createElement('div', {
            key: 'legend',
            className: 'mt-4 flex flex-wrap gap-2 text-xs'
        }, Object.entries(typeColors).map(([type, colorClass]) => 
            React.createElement('div', {
                key: type,
                className: `flex items-center space-x-1 px-2 py-1 rounded ${colorClass}`
            }, [
                React.createElement('div', {
                    key: 'dot',
                    className: 'w-2 h-2 rounded-full bg-current'
                }),
                React.createElement('span', {
                    key: 'label'
                }, type.charAt(0).toUpperCase() + type.slice(1))
            ])
        ))
    ]);
}

window.SimpleCalendar = SimpleCalendar;