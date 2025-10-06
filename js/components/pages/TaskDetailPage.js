// Page de détail d'une tâche - Version refactorisée et modulaire
function TaskDetailPage({ 
    tacheId, 
    onBack, 
    onNavigateToPdcSelection, 
    onNavigateToAppointmentBooking, 
    onNavigateToProject 
}) {
    const { useState, useEffect, useMemo } = React;
    
    // Utilisation des hooks et services modulaires
    const taskWorkflow = window.useTaskWorkflow();
    const qualificationService = window.useQualificationService();
    const devisService = window.useDevisService();
    const planificationService = window.usePlanificationService();
    const documentService = window.useDocumentGenerationService();

    // États principaux (délégués aux services)
    const {
        tache,
        loading,
        error,
        showEditModal,
        availableLogiciels,
        availableUsers,
        availablePdcs,
        stagiaires,
        setTache,
        setShowEditModal,
        fetchTaskDetails,
        loadProjectStagiaires
    } = taskWorkflow;

    // Chargement initial des données
    useEffect(() => {
        if (tacheId) {
            // Diagnostic des composants disponibles
            console.log('🔧 [TaskDetailPage] Composants de tâches disponibles:', {
                QualificationTaskSection: !!window.QualificationTaskSection,
                DevisTaskSection: !!window.DevisTaskSection,
                ValidationDevisTaskSection: !!window.ValidationDevisTaskSection,
                PlanificationTaskSection: !!window.PlanificationTaskSection,
                GenerationDocumentsTaskSection: !!window.GenerationDocumentsTaskSection,
                ValidationDocumentsTaskSection: !!window.ValidationDocumentsTaskSection
            });
            
            fetchTaskDetails(tacheId)
                .then((tacheData) => {
                    // Charger les stagiaires du projet
                    if (tacheData?.project?.id && tacheData?.project?.stagiaires) {
                        loadProjectStagiaires(tacheData.project.id, tacheData.project.stagiaires);
                    }
                    
                    // Initialisation spécifique selon le type de tâche
                    initializeTaskSpecificData(tacheData);
                })
                .catch((err) => {
                    console.error('Erreur lors du chargement:', err);
                });
        }
    }, [tacheId]);

    // Fonction pour initialiser les données spécifiques au type de tâche
    const initializeTaskSpecificData = async (tacheData) => {
        if (!tacheData) return;

        try {
            switch (tacheData.title) {
                case "Demande de qualification":
                    if (tacheData.project?.id) {
                        await qualificationService.checkExistingAppointment(tacheData);
                    }
                    break;

                case "Planification":
                    if (tacheData.project?.id) {
                        await planificationService.loadExistingSessions(tacheData);
                        await planificationService.fetchFormateurs();
                        if (tacheData.project.entreprise?.id) {
                            await planificationService.fetchEntrepriseUsers(tacheData.project.entreprise.id);
                        }
                    }
                    break;

                default:
                    // Pas d'initialisation spécifique nécessaire
                    break;
            }
        } catch (error) {
            console.error('Erreur lors de l\'initialisation spécifique:', error);
        }
    };

    // Mémoriser les options de statut pour les projets
    const projectStatusOptions = useMemo(() => [
        { value: 'planning', label: 'Planification', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'active', label: 'Actif', color: 'bg-green-100 text-green-800' },
        { value: 'on_hold', label: 'En pause', color: 'bg-orange-100 text-orange-800' },
        { value: 'completed', label: 'Terminé', color: 'bg-blue-100 text-blue-800' },
        { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-800' }
    ], []);

    // Rendu de l'état de chargement
    if (loading) {
        return React.createElement('div', {
            className: 'min-h-screen bg-gray-50 flex items-center justify-center'
        }, [
            React.createElement('div', {
                key: 'loading-spinner',
                className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'
            }),
            React.createElement('p', {
                key: 'loading-text',
                className: 'ml-3 text-gray-600'
            }, 'Chargement des détails de la tâche...')
        ]);
    }

    // Rendu de l'état d'erreur
    if (error) {
        return React.createElement('div', {
            className: 'min-h-screen bg-gray-50 flex items-center justify-center'
        }, [
            React.createElement('div', {
                key: 'error-content',
                className: 'text-center'
            }, [
                React.createElement('div', {
                    key: 'error-icon',
                    className: 'mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100'
                }, [
                    React.createElement('i', {
                        key: 'exclamation-icon',
                        'data-lucide': 'alert-circle',
                        className: 'h-6 w-6 text-red-600'
                    })
                ]),
                React.createElement('h3', {
                    key: 'error-title',
                    className: 'mt-2 text-sm font-medium text-gray-900'
                }, 'Erreur de chargement'),
                React.createElement('p', {
                    key: 'error-message',
                    className: 'mt-1 text-sm text-gray-500'
                }, error),
                React.createElement('div', {
                    key: 'error-actions',
                    className: 'mt-6'
                }, [
                    React.createElement('button', {
                        key: 'retry-button',
                        onClick: () => window.location.reload(),
                        className: 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700'
                    }, 'Réessayer')
                ])
            ])
        ]);
    }

    // Rendu si aucune tâche trouvée
    if (!tache) {
        return React.createElement('div', {
            className: 'min-h-screen bg-gray-50 flex items-center justify-center'
        }, [
            React.createElement('div', {
                key: 'not-found',
                className: 'text-center'
            }, [
                React.createElement('h3', {
                    key: 'not-found-title',
                    className: 'text-lg font-medium text-gray-900'
                }, 'Tâche non trouvée'),
                React.createElement('p', {
                    key: 'not-found-message',
                    className: 'mt-1 text-sm text-gray-500'
                }, 'La tâche demandée n\'existe pas ou n\'est plus accessible.'),
                React.createElement('button', {
                    key: 'back-button',
                    onClick: onBack,
                    className: 'mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700'
                }, 'Retour')
            ])
        ]);
    }

    // Données pour le composant CollapsibleTaskSection
    const collapsibleData = {
        projet: tache.project,
        taches: [],
        stagiaires: stagiaires,
        sessions: [],
        availableLogiciels: availableLogiciels,
        availableUsers: availableUsers,
        availablePdcs: availablePdcs,
        statusOptions: projectStatusOptions,
        onProjectUpdate: () => {
            // Recharger les données après mise à jour du projet
            if (tacheId) {
                fetchTaskDetails(tacheId);
            }
        }
    };

    // Rendu principal
    return React.createElement('div', {
        className: 'min-h-screen bg-gray-50'
    }, [
        // Contenu principal
        React.createElement('div', {
            key: 'main-content',
            className: 'space-y-6'
        }, [
                // En-tête avec navigation - Structure harmonisée avec ProjectDetailPage
                React.createElement('div', {
                    key: 'header',
                    className: 'bg-white rounded-lg border border-gray-200 p-6'
                }, [
                    // Header de navigation réutilisable
                    React.createElement(window.DetailPageHeader, {
                        key: 'nav',
                        onBack: onBack,
                        breadcrumbBase: "Tâches",
                        breadcrumbCurrent: tache.title
                    }),
                    // Section titre et bouton modifier
                    React.createElement('div', {
                        key: 'title-section',
                        className: 'flex items-center justify-between mt-4'
                    }, [
                        React.createElement('div', {
                            key: 'title-info'
                        }, [
                            React.createElement('h1', {
                                key: 'page-title',
                                className: 'text-2xl font-bold text-gray-900'
                            }, 'Détail de la tâche'),
                            React.createElement('p', {
                                key: 'page-subtitle',
                                className: 'mt-1 text-sm text-gray-500'
                            }, `${tache.title} - ${tache.project?.name || 'Projet sans nom'}`)
                        ]),
                        React.createElement('button', {
                            key: 'edit-btn',
                            onClick: () => setShowEditModal(true),
                            className: 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700'
                        }, [
                            React.createElement('i', {
                                key: 'edit-icon',
                                'data-lucide': 'edit-3',
                                className: 'w-4 h-4 mr-2'
                            }),
                            'Modifier'
                        ])
                    ])
                ]),
                // Section collapsible avec les détails de la tâche
                React.createElement(window.CollapsibleTaskSection, {
                    key: 'task-details',
                    tache: tache,
                    ...collapsibleData
                }),

                // Sections spécialisées selon le type de tâche (avec vérifications de sécurité)
                window.QualificationTaskSection && React.createElement(window.QualificationTaskSection, {
                    key: 'qualification-section',
                    tache: tache,
                    onNavigateToPdcSelection: onNavigateToPdcSelection,
                    onNavigateToAppointmentBooking: onNavigateToAppointmentBooking
                }),

                window.DevisTaskSection && React.createElement(window.DevisTaskSection, {
                    key: 'devis-section',
                    tache: tache,
                    onNavigateToProject: onNavigateToProject,
                    setTache: setTache
                }),

                window.ValidationDevisTaskSection && React.createElement(window.ValidationDevisTaskSection, {
                    key: 'validation-section',
                    tache: tache,
                    onNavigateToProject: onNavigateToProject,
                    setTache: setTache
                }),

                window.PlanificationTaskSection && React.createElement(window.PlanificationTaskSection, {
                    key: 'planification-section',
                    tache: tache,
                    onNavigateToProject: onNavigateToProject,
                    setTache: setTache,
                    stagiaires: stagiaires,
                    availableUsers: availableUsers
                }),

                // Vérification de sécurité pour GenerationDocumentsTaskSection
                window.GenerationDocumentsTaskSection && React.createElement(window.GenerationDocumentsTaskSection, {
                    key: 'generation-documents-section',
                    tache: tache,
                    onNavigateToProject: onNavigateToProject,
                    setTache: setTache
                }),

                // Vérification de sécurité pour ValidationDocumentsTaskSection
                window.ValidationDocumentsTaskSection && React.createElement(window.ValidationDocumentsTaskSection, {
                    key: 'validation-documents-section',
                    tache: tache,
                    onNavigateToProject: onNavigateToProject,
                    setTache: setTache
                })
            ]),

        // Modal d'édition
        showEditModal && React.createElement(window.TaskModal, {
            key: 'edit-modal',
            task: tache,
            isOpen: showEditModal,
            onClose: () => setShowEditModal(false),
            onSave: (updatedTask) => {
                setTache(updatedTask);
                setShowEditModal(false);
            }
        })
    ]);
}

// Export global
window.TaskDetailPage = TaskDetailPage;