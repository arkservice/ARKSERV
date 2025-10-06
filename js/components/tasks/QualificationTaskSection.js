// Composant spécialisé pour les tâches de qualification
function QualificationTaskSection({ 
    tache, 
    onNavigateToPdcSelection, 
    onNavigateToAppointmentBooking 
}) {
    const qualificationService = window.useQualificationService();
    const { 
        existingAppointment,
        loadingExistingAppointment,
        checkExistingAppointment,
        handleAppointmentBookingNavigation,
        handlePdcSelectionNavigation,
        formatAppointmentInfo,
        getNewAppointmentInfo
    } = qualificationService;

    // Charger les données RDV au montage du composant
    React.useEffect(() => {
        if (tache?.title === "Demande de qualification" && tache.project?.id) {
            checkExistingAppointment(tache);
        }
    }, [tache?.project?.id, checkExistingAppointment]);

    // Rendu pour "Demande de qualification"
    if (tache.title === "Demande de qualification") {
        const appointmentInfo = existingAppointment ? 
            formatAppointmentInfo() : 
            getNewAppointmentInfo();

        return React.createElement('div', {
            key: 'qualification-actions',
            className: "bg-blue-50 rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement('h3', {
                key: 'actions-title',
                className: "text-lg font-semibold text-gray-900 mb-6"
            }, "Actions requises pour cette tâche"),
            
            React.createElement('div', {
                key: 'actions-container',
                className: "rounded-lg p-6"
            }, [
                React.createElement('div', {
                    key: 'buttons-grid',
                    className: "grid grid-cols-1 md:grid-cols-2 gap-6"
                }, [
                    // Bouton 1: Parcourir les PDCs
                    React.createElement('button', {
                        key: 'browse-pdcs',
                        className: "flex flex-col items-center p-6 bg-white border-2 border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group",
                        onClick: () => handlePdcSelectionNavigation(tache, onNavigateToPdcSelection)
                    }, [
                        React.createElement('i', {
                            key: 'search-icon',
                            'data-lucide': 'search',
                            className: "w-10 h-10 text-blue-600 mb-3 group-hover:scale-110 transition-transform"
                        }),
                        React.createElement('h5', {
                            key: 'title',
                            className: "font-medium text-gray-900 mb-2 text-center"
                        }, "Parcourir les programmes"),
                        React.createElement('p', {
                            key: 'description',
                            className: "text-sm text-gray-600 text-center"
                        }, "Parcourir tous les programmes disponibles et sélectionner celui qui correspond à vos besoins")
                    ]),
                    
                    // Bouton 2: RDV (avec gestion RDV existant)
                    React.createElement('button', {
                        key: 'schedule-appointment',
                        className: appointmentInfo ? appointmentInfo.buttonClass : "flex flex-col items-center p-6 bg-white border-2 border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group",
                        onClick: () => handleAppointmentBookingNavigation(tache, onNavigateToAppointmentBooking),
                        disabled: loadingExistingAppointment
                    }, [
                        loadingExistingAppointment ? 
                            React.createElement('i', {
                                key: 'loading-icon',
                                'data-lucide': 'loader-2',
                                className: "w-10 h-10 text-gray-400 mb-3 animate-spin"
                            }) :
                            React.createElement('i', {
                                key: 'calendar-icon',
                                'data-lucide': 'calendar',
                                className: appointmentInfo ? appointmentInfo.iconClass : "w-10 h-10 text-green-600 mb-3 group-hover:scale-110 transition-transform"
                            }),
                        React.createElement('h5', {
                            key: 'title',
                            className: "font-medium text-gray-900 mb-2 text-center"
                        }, loadingExistingAppointment ? "Vérification..." : 
                           (appointmentInfo ? appointmentInfo.title : "Prendre RDV avec un formateur")),
                        React.createElement('p', {
                            key: 'description',
                            className: "text-sm text-gray-600 text-center"
                        }, loadingExistingAppointment ? "Vérification du RDV existant..." :
                           (appointmentInfo ? appointmentInfo.description : "Être accompagné par un expert pour choisir le programme le plus adapté à vos besoins"))
                    ])
                ])
            ])
        ]);
    }

    // Rendu pour "Qualification" (sélection PDC)
    if (tache.title === "Qualification") {
        return React.createElement('div', {
            key: 'qualification-pdc-actions',
            className: "bg-green-50 rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement('h3', {
                key: 'actions-title',
                className: "text-lg font-semibold text-gray-900 mb-6"
            }, "Actions requises pour cette tâche"),
            
            React.createElement('div', {
                key: 'actions-container',
                className: "p-6"
            }, [
                React.createElement('button', {
                    key: 'choose-pdc',
                    className: "flex flex-col items-center p-8 bg-white border-2 border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group w-full max-w-md mx-auto",
                    onClick: () => handlePdcSelectionNavigation(tache, onNavigateToPdcSelection)
                }, [
                    React.createElement('i', {
                        key: 'check-icon',
                        'data-lucide': 'check-circle',
                        className: "w-12 h-12 text-green-600 mb-4 group-hover:scale-110 transition-transform"
                    }),
                    React.createElement('h5', {
                        key: 'title',
                        className: "font-medium text-gray-900 mb-3 text-center text-lg"
                    }, "Choisir un programme de formation"),
                    React.createElement('p', {
                        key: 'description',
                        className: "text-sm text-gray-600 text-center"
                    }, "Sélectionner le programme de formation le plus adapté aux besoins identifiés lors du RDV de qualification")
                ])
            ])
        ]);
    }

    // Si ce n'est ni "Demande de qualification" ni "Qualification", ne rien afficher
    return null;
}

// Export global
window.QualificationTaskSection = QualificationTaskSection;