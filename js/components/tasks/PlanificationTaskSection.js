// Composant spécialisé pour la planification des sessions
function PlanificationTaskSection({ 
    tache,
    onNavigateToProject,
    setTache,
    stagiaires,
    availableUsers
}) {
    const planificationService = window.usePlanificationService();
    const {
        numberOfSessions,
        sessions,
        savingSessions,
        formateurs,
        entrepriseUsers,
        durationWarning,
        editingSession,
        globalStagiaires,
        globalStagiaireIds,
        setNumberOfSessions,
        updateSessionData,
        updateGlobalStagiaires,
        startEditSession,
        cancelEditSession,
        handleSessionModified,
        completePlanification,
        validateSessionDurations,
        resetAllSessionsOnCountChange
    } = planificationService;

    // Charger les données nécessaires au montage
    React.useEffect(() => {
        if (tache.title === "Planification") {
            planificationService.fetchFormateurs();
            if (tache?.project?.entreprise?.id) {
                planificationService.fetchEntrepriseUsers(tache.project.entreprise.id);
            }
            if (tache?.project?.id) {
                planificationService.loadExistingSessions(tache);
                planificationService.loadProjectSessions(tache.project.id);
            }
        }
    }, [tache?.project?.id, tache?.project?.entreprise?.id]);

    // Valider les durées à chaque changement
    React.useEffect(() => {
        planificationService.validateSessionDurations(tache);
    }, [sessions, tache?.project?.pdc?.duree_en_jour]);

    // Si ce n'est pas une tâche "Planification", ne rien afficher
    if (tache.title !== "Planification") {
        return null;
    }

    // Fonction pour gérer le changement de nombre de sessions avec reset si nécessaire
    const handleSessionCountChange = async (newCount) => {
        const currentCount = numberOfSessions;
        
        console.log(`🔄 Changement nombre de sessions: ${currentCount} → ${newCount}`);
        
        if (newCount === currentCount) {
            return; // Pas de changement
        }
        
        // Si on augmente le nombre ou qu'il y a des sessions existantes, vérifier le reset
        if (newCount !== currentCount && sessions.length > 0) {
            const resetSuccess = await resetAllSessionsOnCountChange(newCount, sessions, tache.project?.id);
            if (!resetSuccess) {
                // L'utilisateur a annulé ou erreur, ne pas changer le nombre
                console.log('❌ Changement de nombre de sessions annulé');
                return;
            }
        }
        
        // Mettre à jour le nombre de sessions
        setNumberOfSessions(newCount);
        console.log(`✅ Nombre de sessions mis à jour: ${newCount}`);
    };

    // Fonction pour créer le sélecteur de stagiaires globaux
    const createGlobalStagiaireSelector = () => {
        const filteredUsers = entrepriseUsers.filter(user => 
            !user.fonction?.nom?.toLowerCase().includes('formateur')
        );

        return React.createElement('div', {
            key: 'global-stagiaires-selection',
            className: "mb-6 p-4 bg-white rounded-lg border border-indigo-200"
        }, [
            React.createElement('label', {
                key: 'global-stagiaires-label',
                className: "block text-sm font-medium text-gray-700"
            }, 'Stagiaires (pour toutes les sessions)'),
            
            React.createElement('div', {
                key: 'stagaires-select-wrapper',
                className: "mt-2 space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2"
            }, filteredUsers.map(user => 
                React.createElement('label', {
                    key: `user-${user.id}`,
                    className: "flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                }, [
                    React.createElement('input', {
                        key: 'checkbox',
                        type: 'checkbox',
                        checked: globalStagiaireIds.includes(user.id),
                        onChange: (e) => {
                            const isChecked = e.target.checked;
                            const newIds = isChecked 
                                ? [...globalStagiaireIds, user.id]
                                : globalStagiaireIds.filter(id => id !== user.id);
                            const newNames = newIds.map(id => {
                                const u = filteredUsers.find(user => user.id === id);
                                return u ? `${u.prenom} ${u.nom}` : '';
                            }).filter(Boolean);
                            updateGlobalStagiaires(newIds, newNames);
                        },
                        className: "w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    }),
                    React.createElement('span', {
                        key: 'user-name',
                        className: "text-sm text-gray-700"
                    }, `${user.prenom} ${user.nom}`)
                ])
            ))
        ]);
    };

    // Fonction pour créer le sélecteur de nombre de sessions
    const createSessionSelector = () => {
        return React.createElement('div', {
            key: 'session-selector',
            className: "mb-6"
        }, [
            React.createElement('label', {
                key: 'selector-label',
                className: "block text-sm font-medium text-gray-700 mb-2"
            }, "Nombre de sessions"),
            React.createElement('select', {
                key: 'sessions-count',
                value: numberOfSessions,
                onChange: (e) => handleSessionCountChange(parseInt(e.target.value)),
                className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            }, [
                React.createElement('option', { key: 'opt-1', value: 1 }, "1 session"),
                React.createElement('option', { key: 'opt-2', value: 2 }, "2 sessions"),
                React.createElement('option', { key: 'opt-3', value: 3 }, "3 sessions"),
                React.createElement('option', { key: 'opt-4', value: 4 }, "4 sessions"),
                React.createElement('option', { key: 'opt-5', value: 5 }, "5 sessions")
            ])
        ]);
    };

    // Fonction pour créer les contrôles de durée
    const createDurationControls = () => {
        return React.createElement('div', {
            key: 'duration-section',
            className: "mb-6"
        }, [
            React.createElement('h6', {
                key: 'duration-title',
                className: "text-sm font-medium text-gray-700 mb-3"
            }, "Durée de chaque session (en jours)"),
            React.createElement('div', {
                key: 'duration-row',
                className: "flex items-center gap-4 flex-wrap"
            }, Array.from({ length: numberOfSessions }, (_, index) => {
                const sessionNumber = index + 1;
                const sessionData = sessions.find(s => s.sessionNumber === sessionNumber) || {};
                const sessionDuration = sessionData.duration || '';
                
                return React.createElement('div', {
                    key: `duration-${sessionNumber}`,
                    className: "flex items-center gap-2"
                }, [
                    React.createElement('label', {
                        key: 'duration-label',
                        className: "text-sm text-gray-600"
                    }, `Session ${sessionNumber}:`),
                    React.createElement('input', {
                        key: 'duration-input',
                        type: 'number',
                        min: '0.5',
                        max: parseFloat(tache.project?.pdc?.duree_en_jour || 1),
                        step: '0.5',
                        value: sessionDuration,
                        onChange: async (e) => {
                            const newDuration = parseFloat(e.target.value) || '';
                            await updateSessionData(sessionNumber, 'duration', newDuration);
                        },
                        className: "w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    }),
                    React.createElement('span', {
                        key: 'duration-unit',
                        className: "text-sm text-gray-500"
                    }, "j")
                ]);
            }))
        ]);
    };

    // Fonction pour créer les formulaires de session
    const createSessionForms = () => {
        return Array.from({ length: numberOfSessions }, (_, index) => {
            const sessionNumber = index + 1;
            const sessionData = sessions.find(s => s.sessionNumber === sessionNumber) || {};
            
            return React.createElement('div', {
                key: `session-${sessionNumber}`,
                className: "border border-gray-200 rounded-lg p-4 space-y-4"
            }, [
                React.createElement('h6', {
                    key: 'session-title',
                    className: "font-medium text-gray-900"
                }, `Session ${sessionNumber}${sessionData.duration ? ` (${sessionData.duration} jour${sessionData.duration > 1 ? 's' : ''})` : ''}`),
                
                // Configuration du lieu
                React.createElement('div', {
                    key: 'lieu-config',
                    className: "space-y-3"
                }, [
                    React.createElement('label', {
                        key: 'lieu-label',
                        className: "block text-sm font-medium text-gray-700"
                    }, "Lieu de formation"),
                    React.createElement('select', {
                        key: 'lieu-select',
                        value: sessionData.typeLieu || '',
                        onChange: (e) => updateSessionData(sessionNumber, 'typeLieu', e.target.value),
                        className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    }, [
                        React.createElement('option', { key: 'lieu-placeholder', value: '' }, 'Sélectionner le lieu'),
                        React.createElement('option', { key: 'distance', value: 'distance' }, 'À distance'),
                        React.createElement('option', { key: 'site', value: 'site' }, 'Sur site client')
                    ]),
                    sessionData.typeLieu === 'site' ? React.createElement(window.AddressAutocomplete, {
                        key: 'adresse-autocomplete',
                        value: sessionData.adresse || '',
                        onChange: (value) => updateSessionData(sessionNumber, 'adresse', value),
                        placeholder: 'Entrez l\'adresse du lieu de formation...',
                        className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    }) : null
                ]),
                
                // Affichage conditionnel : résumé de session OU widget de réservation
                sessionData.dateDebut && sessionData.formateurNom && editingSession !== sessionNumber ? React.createElement('div', {
                    key: 'session-summary',
                    className: "bg-green-50 border border-green-200 rounded-lg p-4"
                }, [
                    React.createElement('div', {
                        key: 'summary-header',
                        className: "flex items-center justify-between mb-3"
                    }, [
                        React.createElement('h6', {
                            key: 'summary-title',
                            className: "font-medium text-green-900"
                        }, "Session programmée"),
                        React.createElement('div', {
                            key: 'summary-badge',
                            className: "inline-flex items-center gap-1 px-2 py-1 bg-green-100 border border-green-300 text-green-800 rounded-lg text-sm font-medium"
                        }, [
                            React.createElement('i', {
                                key: 'check-icon',
                                'data-lucide': 'check-circle',
                                className: "w-4 h-4"
                            }),
                            "Confirmée"
                        ])
                    ]),
                    
                    React.createElement('div', {
                        key: 'summary-details',
                        className: "space-y-2 text-sm"
                    }, [
                        React.createElement('div', {
                            key: 'date-info',
                            className: "flex items-center gap-2"
                        }, [
                            React.createElement('i', {
                                key: 'calendar-icon',
                                'data-lucide': 'calendar',
                                className: "w-4 h-4 text-green-600"
                            }),
                            React.createElement('span', {
                                key: 'date-text',
                                className: "text-green-700"
                            }, window.DateUtils?.formatDateRangeSafe(sessionData.dateDebut, sessionData.dateFin) || 'Dates non disponibles')
                        ]),
                        
                        React.createElement('div', {
                            key: 'formateur-info',
                            className: "flex items-center gap-2"
                        }, [
                            React.createElement('i', {
                                key: 'user-icon',
                                'data-lucide': 'user',
                                className: "w-4 h-4 text-green-600"
                            }),
                            React.createElement('span', {
                                key: 'formateur-text',
                                className: "text-green-700"
                            }, `Formateur : ${sessionData.formateurNom}`)
                        ]),
                        
                        React.createElement('div', {
                            key: 'lieu-info',
                            className: "flex items-center gap-2"
                        }, [
                            React.createElement('i', {
                                key: 'map-pin-icon',
                                'data-lucide': 'map-pin',
                                className: "w-4 h-4 text-green-600"
                            }),
                            React.createElement('span', {
                                key: 'lieu-text',
                                className: "text-green-700"
                            }, sessionData.typeLieu === 'distance' ? 'À distance' : sessionData.adresse || 'Sur site')
                        ])
                    ]),
                    
                    React.createElement('div', {
                        key: 'summary-actions',
                        className: "mt-4 flex gap-2"
                    }, [
                        React.createElement('button', {
                            key: 'modify-button',
                            onClick: () => startEditSession(sessionNumber),
                            className: "inline-flex items-center gap-1 px-3 py-1 text-sm text-green-700 border border-green-300 rounded hover:bg-green-100 transition-colors"
                        }, [
                            React.createElement('i', {
                                key: 'edit-icon',
                                'data-lucide': 'edit-3',
                                className: "w-3 h-3"
                            }),
                            "Modifier"
                        ])
                    ])
                ]) : (
                    // Widget de réservation (si pas encore programmée)
                    sessionData.duration && sessionData.typeLieu ? React.createElement(window.SessionBookingWidget, {
                        key: 'booking-widget',
                        sessionNumber: sessionNumber,
                        logicielId: tache.project?.pdc?.logiciel_id || tache.project?.logiciel?.id,
                        logicielNom: tache.project?.logiciel?.nom || tache.project?.pdc?.logiciel?.nom || 'Logiciel',
                        sessionDuration: sessionData.duration,
                        projectId: tache.project?.id,
                        initialData: sessionData,
                        editMode: editingSession === sessionNumber,
                        existingSession: sessionData,
                        onSessionBooked: (bookedSession) => {
                            console.log('Session réservée:', bookedSession);
                            updateSessionData(sessionNumber, 'dateDebut', bookedSession.dateDebut);
                            updateSessionData(sessionNumber, 'dateFin', bookedSession.dateFin);
                            updateSessionData(sessionNumber, 'formateurId', bookedSession.formateurId);
                            updateSessionData(sessionNumber, 'formateurNom', bookedSession.formateurNom);
                            updateSessionData(sessionNumber, 'lieu', bookedSession.lieu);
                            updateSessionData(sessionNumber, 'slot', bookedSession.slot);
                            updateSessionData(sessionNumber, 'eventId', bookedSession.eventId);
                        },
                        onEdit: () => startEditSession(sessionNumber),
                        onCancelEdit: cancelEditSession,
                        onSessionModified: (modifiedData) => handleSessionModified(sessionNumber, modifiedData, tache, planificationService.loadExistingSessions),
                        onCancel: () => {
                            console.log('Réservation annulée');
                        }
                    }) : React.createElement('div', {
                        key: 'incomplete-config',
                        className: "p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800"
                    }, "Veuillez configurer la durée et le lieu pour accéder à la réservation.")
                )
            ]);
        });
    };

    return React.createElement('div', {
        key: 'planification-actions',
        className: "bg-white rounded-lg border border-gray-200 p-6"
    }, [
        React.createElement('h3', {
            key: 'actions-title',
            className: "text-lg font-semibold text-gray-900 mb-6"
        }, "Planification des sessions de formation"),
        
        React.createElement('div', {
            key: 'planification-container',
            className: "bg-indigo-50 rounded-lg p-6"
        }, [
            React.createElement('h4', {
                key: 'section-title',
                className: "text-xl font-semibold text-center text-gray-900 mb-6"
            }, "Gestion des sessions de formation"),
            
            // Rappel du PDC
            React.createElement('div', {
                key: 'pdc-info',
                className: "mb-6 p-4 bg-white rounded-lg border border-indigo-200"
            }, [
                React.createElement('div', {
                    key: 'info-header',
                    className: "flex items-center mb-3"
                }, [
                    React.createElement('i', {
                        key: 'info-icon',
                        'data-lucide': 'book-open',
                        className: "w-5 h-5 text-indigo-600 mr-2"
                    }),
                    React.createElement('h5', {
                        key: 'info-title',
                        className: "font-medium text-indigo-900"
                    }, "Plan de formation sélectionné")
                ]),
                React.createElement('p', {
                    key: 'pdc-details',
                    className: "text-sm text-indigo-700"
                }, `${tache.project.pdc?.pdc_number} - Durée totale : ${tache.project.pdc?.duree_en_jour || 'Non définie'} jour(s)`)
            ]),
            
            // Section de configuration
            React.createElement('div', {
                key: 'sessions-section',
                className: "space-y-4"
            }, [
                React.createElement('h5', {
                    key: 'sessions-title',
                    className: "font-medium text-gray-900 mb-4"
                }, "Sessions de formation"),
                
                // Sélection des stagiaires globaux
                createGlobalStagiaireSelector(),
                
                // Sélecteur nombre de sessions
                createSessionSelector(),
                
                // Contrôles de durée
                createDurationControls(),
                
                // Avertissement de durée
                durationWarning && React.createElement('div', {
                    key: 'duration-warning',
                    className: `p-3 rounded-lg border ${durationWarning.type === 'exceed' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`
                }, [
                    React.createElement('div', {
                        key: 'warning-content',
                        className: "flex items-start"
                    }, [
                        React.createElement('i', {
                            key: 'warning-icon',
                            'data-lucide': 'alert-triangle',
                            className: "w-5 h-5 mr-2 mt-0.5"
                        }),
                        React.createElement('div', {
                            key: 'warning-text'
                        }, [
                            React.createElement('p', {
                                key: 'warning-message',
                                className: "font-medium"
                            }, durationWarning.type === 'exceed' ? 'Durée dépassée' : 'Durée insuffisante'),
                            React.createElement('p', {
                                key: 'warning-details',
                                className: "text-sm mt-1"
                            }, `Total configuré: ${durationWarning.totalDuration}j, PDC: ${durationWarning.pdcDuration}j (écart: ${durationWarning.difference}j)`)
                        ])
                    ])
                ]),
                
                // Formulaires de sessions
                React.createElement('div', {
                    key: 'sessions-forms',
                    className: "space-y-6"
                }, createSessionForms()),
                
                // Bouton de finalisation
                React.createElement('div', {
                    key: 'completion-section',
                    className: "pt-6 border-t border-gray-200"
                }, [
                    React.createElement('button', {
                        key: 'complete-planning',
                        onClick: () => completePlanification(tache, onNavigateToProject, setTache),
                        disabled: savingSessions || durationWarning,
                        className: `w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                            savingSessions || durationWarning 
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`
                    }, [
                        savingSessions && React.createElement('i', {
                            key: 'loading-icon',
                            'data-lucide': 'loader-2',
                            className: "w-4 h-4 animate-spin mr-2"
                        }),
                        savingSessions ? "Finalisation..." : "Terminer la planification"
                    ])
                ])
            ])
        ])
    ]);
}

// Export global
window.PlanificationTaskSection = PlanificationTaskSection;