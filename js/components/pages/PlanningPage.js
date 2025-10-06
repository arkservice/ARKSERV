function PlanningPage() {
    const { useState, useEffect } = React;
    const { users, loading: usersLoading, getUserDisplayName, getUserInitials } = window.useArkanceUsers();
    const { events = [], loading: eventsLoading, addEvent, updateEvent, deleteEvent } = window.useAllPlanning() || {};
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'timeline'
    const [timelinePeriod, setTimelinePeriod] = useState('week'); // 'week' or 'month'
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [hasInitialized, setHasInitialized] = useState(false);
    
    useEffect(() => {
        lucide.createIcons();
    }, []);
    
    // Sélectionner automatiquement les formateurs par défaut (uniquement au premier chargement)
    useEffect(() => {
        if (users.length > 0 && !hasInitialized) {
            // Sélectionner tous les formateurs (ou tous les utilisateurs si pas de formateurs identifiés)
            const trainers = users.filter(user => 
                user.fonction && user.fonction.nom && 
                user.fonction.nom.toLowerCase().includes('formateur')
            );
            
            if (trainers.length > 0) {
                setSelectedUserIds(trainers.map(trainer => trainer.id));
            } else {
                // Si pas de formateurs identifiés, sélectionner tous les utilisateurs
                setSelectedUserIds(users.map(user => user.id));
            }
            
            setHasInitialized(true);
        }
    }, [users, hasInitialized]);
    
    
    // Gestion des événements
    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setShowModal(true);
    };
    
    const handleDateClick = (date) => {
        setSelectedEvent(null);
        setShowModal(true);
    };
    
    const handleModalSave = async (eventData) => {
        try {
            if (selectedEvent) {
                await updateEvent(selectedEvent.id, eventData);
            } else {
                await addEvent(eventData);
            }
            setShowModal(false);
            setSelectedEvent(null);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde de l\'événement');
        }
    };
    
    const handleModalDelete = async () => {
        if (selectedEvent) {
            try {
                await deleteEvent(selectedEvent.id);
                setShowModal(false);
                setSelectedEvent(null);
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
            }
        }
    };
    
    // Filtrer les événements selon les utilisateurs sélectionnés
    // Si aucun utilisateur sélectionné, n'afficher aucun événement
    const filteredEvents = selectedUserIds.length === 0 ? [] : events.filter(event => 
        selectedUserIds.includes(event.user_id)
    );
    
    
    if (usersLoading || !window.useAllPlanning) {
        return React.createElement('div', {
            className: "bg-white rounded-lg border border-gray-200 p-8"
        }, React.createElement('div', {
            className: "animate-pulse space-y-4"
        }, [
            React.createElement('div', {
                key: 'title',
                className: "h-6 bg-gray-200 rounded w-1/3"
            }),
            React.createElement('div', {
                key: 'content',
                className: "h-4 bg-gray-200 rounded w-3/4"
            })
        ]));
    }
    
    return React.createElement('div', {
        className: 'space-y-6'
    }, [
        // En-tête
        React.createElement('div', {
            key: 'header',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement('h1', {
                key: 'title',
                className: "text-2xl font-bold text-gray-900"
            }, "Planning d'équipe"),
            React.createElement('p', {
                key: 'subtitle',
                className: "text-gray-600 mt-1"
            }, "Visualisez les plannings de tous les collaborateurs ARKANCE")
        ]),
        
        // Contenu principal
        React.createElement('div', {
            key: 'main-content',
            className: "grid grid-cols-12 gap-6"
        }, [
            // Sidebar utilisateurs
            React.createElement('div', {
                key: 'users-sidebar',
                className: "col-span-3"
            }, React.createElement('div', {
                className: "bg-white rounded-lg border border-gray-200 p-6"
            }, [
                React.createElement('h2', {
                    key: 'title',
                    className: "text-lg font-semibold text-gray-900 mb-4"
                }, "Collaborateurs"),
                React.createElement('div', {
                    key: 'collaborators-container',
                    className: "overflow-y-auto",
                    style: {
                        maxHeight: 'calc(100vh - 300px)'
                    }
                }, React.createElement(window.CollaboratorsSection, {
                    users: users,
                    selectedUserIds: selectedUserIds,
                    onSelectionChange: setSelectedUserIds,
                    groupBy: 'service',
                    getUserDisplayName: getUserDisplayName,
                    getUserInitials: getUserInitials
                }))
            ])),
            
            // Zone calendrier
            React.createElement('div', {
                key: 'calendar-area',
                className: "col-span-9"
            }, React.createElement('div', {
                className: "bg-white rounded-lg border border-gray-200 p-6"
            }, [
                // En-tête avec titre et boutons
                React.createElement('div', {
                    key: 'header',
                    className: "relative flex justify-between items-center mb-6"
                }, [
                    // Boutons de vue et période (gauche)
                    React.createElement('div', {
                        key: 'view-buttons',
                        className: "flex items-center space-x-2"
                    }, [
                        React.createElement('button', {
                            key: 'calendar-btn',
                            onClick: () => setViewMode('calendar'),
                            className: `px-4 py-2 text-sm rounded-lg ${viewMode === 'calendar' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                        }, "Calendrier"),
                        React.createElement('button', {
                            key: 'timeline-btn',
                            onClick: () => setViewMode('timeline'),
                            className: `px-4 py-2 text-sm rounded-lg ${viewMode === 'timeline' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                        }, "Timeline"),
                        
                        // Boutons période juste après Timeline
                        ...(viewMode === 'timeline' ? [
                            React.createElement('div', {
                                key: 'separator',
                                className: "w-px h-6 bg-gray-300 mx-2"
                            }),
                            React.createElement('button', {
                                key: 'week-btn',
                                onClick: () => setTimelinePeriod('week'),
                                className: `px-4 py-2 text-sm rounded-lg ${timelinePeriod === 'week' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                            }, "Semaine"),
                            React.createElement('button', {
                                key: 'month-btn',
                                onClick: () => setTimelinePeriod('month'),
                                className: `px-4 py-2 text-sm rounded-lg ${timelinePeriod === 'month' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                            }, "Mois")
                        ] : [])
                    ]),
                    
                    // Titre (centre absolu)
                    React.createElement('h2', {
                        key: 'title',
                        className: "absolute left-1/2 transform -translate-x-1/2 text-lg font-semibold text-gray-900"
                    }, viewMode === 'calendar' ? "Calendrier" : "Timeline"),
                    
                    // Espace vide à droite pour équilibrer le layout
                    React.createElement('div', {
                        key: 'spacer'
                    })
                ]),
                
                // Contenu du calendrier/timeline
                React.createElement('div', {
                    key: 'calendar-content',
                    className: "calendar-container"
                }, eventsLoading ? 
                    React.createElement('div', {
                        className: "animate-pulse h-64 bg-gray-200 rounded"
                    }) :
                    viewMode === 'calendar' ?
                        React.createElement(window.SimpleCalendar, {
                            events: filteredEvents,
                            onEventClick: handleEventClick,
                            onDateClick: handleDateClick,
                            selectedDate: selectedDate,
                            onDateChange: (newDate) => setSelectedDate(newDate)
                        }) :
                        React.createElement(window.TimelineView, {
                            events: filteredEvents,
                            users: selectedUserIds.length > 0 ? users.filter(user => selectedUserIds.includes(user.id)) : [],
                            onEventClick: handleEventClick,
                            onDateClick: handleDateClick,
                            selectedDate: selectedDate,
                            viewMode: timelinePeriod
                        })
                )
            ]))
        ]),
        
        // Modal de gestion des événements
        showModal && React.createElement(window.UserPlanningModal, {
            key: 'modal',
            isOpen: showModal,
            onClose: () => {
                setShowModal(false);
                setSelectedEvent(null);
            },
            onSubmit: handleModalSave,
            onDelete: handleModalDelete,
            editingItem: selectedEvent,
            availableUsers: users,
            defaultUserId: null
        })
    ]);
}

window.PlanningPage = PlanningPage;