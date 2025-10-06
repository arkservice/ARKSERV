// Composant Layout
function Layout() {
    const { useState, useEffect } = React;
    const { updateProjectPdc, resetProjectPdc } = window.useProjects();
    const { completeTask, autoCompleteQualificationTask, updateTaskDescription } = window.useTasks();
    const { getExistingAppointment, deleteExistingAppointment } = window.useFormateurs();
    const [activeSection, setActiveSection] = useState('entreprises');
    const [selectedId, setSelectedId] = useState(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [previousSection, setPreviousSection] = useState(null);
    const [previousId, setPreviousId] = useState(null);
    const [taskForPdcSelection, setTaskForPdcSelection] = useState(null);
    const [taskForAppointment, setTaskForAppointment] = useState(null);
    const [highlightedTaskId, setHighlightedTaskId] = useState(null);
    const [projectDetailRefresh, setProjectDetailRefresh] = useState(null);
    const [evaluationToken, setEvaluationToken] = useState(null);

    // Gérer le routing par hash pour les évaluations (accès public)
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            // Vérifier si l'URL contient #/evaluation/[token]
            const evaluationMatch = hash.match(/^#\/evaluation\/(.+)$/);
            if (evaluationMatch) {
                const token = evaluationMatch[1];
                setEvaluationToken(token);
            } else {
                setEvaluationToken(null);
            }
        };

        // Vérifier au chargement initial
        handleHashChange();

        // Écouter les changements de hash
        window.addEventListener('hashchange', handleHashChange);

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    const handleSidebarClick = (section) => {
        setActiveSection(section);
        // Réinitialiser le filtre utilisateur si on navigue directement vers la section utilisateurs
        if (section === 'utilisateurs') {
            setSelectedId(null);
        }
        // Nettoyer le hash de l'URL quand on navigue via la sidebar
        if (window.location.hash.startsWith('#/evaluation/')) {
            window.location.hash = '';
        }
    };

    const renderContent = () => {
        // Si un token d'évaluation est présent dans l'URL, afficher le formulaire d'évaluation
        if (evaluationToken) {
            return React.createElement(window.EvaluationFormPage, {
                token: evaluationToken
            });
        }

        switch (activeSection) {
            case 'entreprises':
                return React.createElement(window.EntreprisesPage, {
                    onRowClick: (entreprise) => {
                        setSelectedId(entreprise.id);
                        setActiveSection('entreprise-detail');
                    }
                });
            case 'entreprise-detail':
                return React.createElement(window.EntrepriseDetailPage, {
                    entrepriseId: selectedId,
                    onBack: () => {
                        setActiveSection('entreprises');
                        setSelectedId(null);
                    },
                    onNavigateToProject: (projet) => {
                        setSelectedId(projet.id);
                        setActiveSection('projet-detail');
                    },
                    onNavigateToUsers: (entrepriseId) => {
                        setSelectedId(entrepriseId);
                        setActiveSection('utilisateurs');
                    }
                });
            case 'projets':
                return React.createElement(window.ProjectsPage, {
                    onRowClick: (projet) => {
                        setSelectedId(projet.id);
                        setActiveSection('projet-detail');
                    }
                });
            case 'projet-detail':
                return React.createElement(window.ProjectDetailPage, {
                    projetId: selectedId,
                    highlightedTaskId: highlightedTaskId,
                    onBack: () => {
                        setActiveSection('projets');
                        setSelectedId(null);
                    },
                    onNavigateToTask: (tache) => {
                        setPreviousSection('projet-detail');
                        setPreviousId(selectedId);
                        setSelectedId(tache.id);
                        setActiveSection('task-detail');
                    },
                    onRefresh: (refreshFunction) => {
                        setProjectDetailRefresh(() => refreshFunction);
                    }
                });
            case 'taches':
                return React.createElement(window.TasksPage, {
                    onRowClick: (tache) => {
                        setPreviousSection(null);
                        setPreviousId(null);
                        setSelectedId(tache.id);
                        setActiveSection('task-detail');
                    }
                });
            case 'task-detail':
                return React.createElement(window.TaskDetailPage, {
                    tacheId: selectedId,
                    onBack: () => {
                        if (previousSection) {
                            setActiveSection(previousSection);
                            setSelectedId(previousId);
                            setPreviousSection(null);
                            setPreviousId(null);
                        } else {
                            setActiveSection('taches');
                            setSelectedId(null);
                        }
                    },
                    onNavigateToPdcSelection: (task) => {
                        setTaskForPdcSelection(task);
                        setActiveSection('pdc-selection');
                    },
                    onNavigateToAppointmentBooking: (task) => {
                        setTaskForAppointment(task);
                        setActiveSection('appointment-booking');
                    },
                    onNavigateToProject: (projectId, taskId) => {
                        setSelectedId(projectId);
                        setActiveSection('projet-detail');
                        
                        // Déclencher l'animation de la tâche Planification après un court délai
                        if (taskId) {
                            setTimeout(() => {
                                setHighlightedTaskId(taskId);
                                // Arrêter l'animation après 3 secondes
                                setTimeout(() => {
                                    setHighlightedTaskId(null);
                                }, 3000);
                            }, 200);
                        }
                    }
                });
            case 'logiciels':
                return React.createElement(window.LogicielsPage, {
                    onNavigateToUser: (userId) => {
                        setPreviousSection('logiciels');
                        setPreviousId(selectedId);
                        setSelectedId(userId);
                        setActiveSection('user-detail');
                    }
                });
            case 'logiciel-detail':
                return React.createElement(window.LogicielDetailPage, {
                    logicielId: selectedId,
                    onBack: () => {
                        if (previousSection) {
                            setActiveSection(previousSection);
                            setSelectedId(previousId);
                            setPreviousSection(null);
                            setPreviousId(null);
                        } else {
                            setActiveSection('logiciels');
                            setSelectedId(null);
                        }
                    },
                    onNavigateToUser: (userId) => {
                        setPreviousSection('logiciel-detail');
                        setPreviousId(selectedId);
                        setSelectedId(userId);
                        setActiveSection('user-detail');
                    }
                });
            case 'utilisateurs':
                return React.createElement(window.UsersPage, {
                    onRowClick: (user) => {
                        setPreviousSection(null);
                        setPreviousId(null);
                        setSelectedId(user.id);
                        setActiveSection('user-detail');
                    },
                    entrepriseId: selectedId,
                    onBack: selectedId ? () => {
                        setActiveSection('entreprise-detail');
                        // selectedId reste le même pour revenir à la bonne entreprise
                    } : null
                });
            case 'collaborateurs':
                return React.createElement(window.CollaborateursPage, {
                    onRowClick: (user) => {
                        setPreviousSection('collaborateurs');
                        setPreviousId(null);
                        setSelectedId(user.id);
                        setActiveSection('user-detail');
                    }
                });
            case 'services':
                return React.createElement(window.ServicesPage, {
                    // Pas de onRowClick : utilise le comportement par défaut (ouvre le modal d'édition)
                });
            case 'metier-pdc':
                return React.createElement(window.MetierPdcPage, {
                    // Pas de onRowClick : utilise le comportement par défaut (ouvre le modal d'édition)
                });
            case 'type-pdc':
                return React.createElement(window.TypePdcPage, {
                    // Pas de onRowClick : utilise le comportement par défaut (ouvre le modal d'édition)
                });
            case 'planning':
                return React.createElement(window.PlanningPage);
            case 'user-detail':
                return React.createElement(window.UserDetailPage, {
                    userId: selectedId,
                    onBack: () => {
                        if (previousSection) {
                            setActiveSection(previousSection);
                            setSelectedId(previousId);
                            setPreviousSection(null);
                            setPreviousId(null);
                        } else {
                            setActiveSection('utilisateurs');
                            setSelectedId(null);
                        }
                    },
                    onNavigateToLogiciel: (logicielId) => {
                        setPreviousSection('user-detail');
                        setPreviousId(selectedId);
                        setSelectedId(logicielId);
                        setActiveSection('logiciel-detail');
                    }
                });
            case 'pdc':
                return React.createElement(window.PdcPage, {
                    onRowClick: (pdc) => {
                        setSelectedId(pdc.id);
                        setActiveSection('pdc-detail');
                    }
                });
            case 'pdc-detail':
                return React.createElement(window.PdcDetailPage, {
                    pdcId: selectedId,
                    onBack: () => {
                        setActiveSection('pdc');
                        setSelectedId(null);
                    }
                });
            case 'pdc-selection':
                return React.createElement(window.PdcPage, {
                    selectionMode: true,
                    onPdcSelected: async (selectedPdc) => {
                        try {
                            console.log(`✅ [Layout] PDC sélectionné depuis tâche "${taskForPdcSelection.title}":`, selectedPdc);
                            console.log(`🔄 [Layout] Mise à jour projet ${taskForPdcSelection.project_id} avec PDC ${selectedPdc.id}`);
                            
                            // Vérifier et supprimer un RDV existant si nécessaire
                            if (taskForPdcSelection.title === "Demande de qualification") {
                                console.log('🔍 [Layout] Vérification d\'un RDV existant pour la tâche...');
                                const existingAppointment = await getExistingAppointment(taskForPdcSelection.id, taskForPdcSelection.project_id);
                                
                                if (existingAppointment) {
                                    console.log('🗑️ [Layout] RDV existant trouvé, suppression en cours...', existingAppointment);
                                    const deleted = await deleteExistingAppointment(existingAppointment.id);
                                    if (deleted) {
                                        console.log('✅ [Layout] RDV existant supprimé avec succès');
                                    } else {
                                        console.log('⚠️ [Layout] Erreur lors de la suppression du RDV existant');
                                    }
                                } else {
                                    console.log('ℹ️ [Layout] Aucun RDV existant trouvé');
                                }
                            }
                            
                            // Mettre à jour le projet avec le PDC sélectionné
                            await updateProjectPdc(taskForPdcSelection.project_id, selectedPdc.id);
                            await completeTask(taskForPdcSelection.id);
                            
                            console.log(`✅ [Layout] Tâche "${taskForPdcSelection.title}" marquée comme terminée`);
                            
                            // Si la tâche est "Demande de qualification", auto-compléter aussi la tâche "Qualification"
                            if (taskForPdcSelection.title === "Demande de qualification") {
                                console.log(`🔧 [Layout] Détection de tâche "Demande de qualification", lancement auto-complétion...`);
                                console.log(`🔧 [Layout] Projet ID: ${taskForPdcSelection.project_id}`);
                                console.log(`🔧 [Layout] PDC sélectionné:`, selectedPdc);
                                
                                try {
                                    console.log(`🔄 [Layout] AVANT autoCompleteQualificationTask - Projet: ${taskForPdcSelection.project_id}`);
                                    const qualificationTask = await autoCompleteQualificationTask(taskForPdcSelection.project_id, selectedPdc);
                                    if (qualificationTask) {
                                        console.log(`✅ [Layout] Tâche "Qualification" automatiquement marquée comme terminée:`, qualificationTask);
                                        console.log(`🔍 [Layout] Vérification - assigned_to après auto-complétion: ${qualificationTask.assigned_to}`);
                                    } else {
                                        console.log(`ℹ️ [Layout] Aucune tâche "Qualification" en attente trouvée pour ce projet`);
                                    }
                                } catch (qualificationError) {
                                    console.error('❌ [Layout] Erreur lors de l\'auto-complétion de la qualification:', qualificationError);
                                }
                            } else {
                                console.log(`ℹ️ [Layout] Tâche "${taskForPdcSelection.title}" - pas d'auto-complétion nécessaire`);
                            }
                            
                            // Mettre à jour la description de la tâche et rediriger vers la page projet
                            if (taskForPdcSelection.title === "Demande de qualification") {
                                // Mettre à jour la description de la tâche avec le numéro du PDC
                                const newDescription = `Programme ${selectedPdc.pdc_number || selectedPdc.id} choisi par le client`;
                                console.log('📝 [Layout] Mise à jour de la description de la tâche:', newDescription);
                                
                                await updateTaskDescription(taskForPdcSelection.id, newDescription);
                                
                                // Rediriger vers la page projet avec animation
                                console.log("🎯 [Layout] Redirection vers page projet:", taskForPdcSelection.project_id);
                                setSelectedId(taskForPdcSelection.project_id);
                                setActiveSection('projet-detail');
                                setTaskForPdcSelection(null);
                                
                                // Déclencher l'animation de la tâche après un court délai
                                setTimeout(() => {
                                    setHighlightedTaskId(taskForPdcSelection.id);
                                    // Arrêter l'animation après 3 secondes
                                    setTimeout(() => {
                                        setHighlightedTaskId(null);
                                    }, 3000);
                                }, 200);
                            } else if (taskForPdcSelection.title === "Qualification") {
                                console.log(`🎯 [Layout] Détection de tâche "Qualification" - formateur choisit PDC`);
                                
                                // Mettre à jour la description de la tâche avec le numéro du PDC
                                const newDescription = `PDC n°${selectedPdc.pdc_number || selectedPdc.id} choisi suite au RDV avec le client`;
                                console.log('📝 [Layout] Mise à jour de la description de la tâche (formateur):', newDescription);
                                
                                await updateTaskDescription(taskForPdcSelection.id, newDescription);
                                
                                // Rediriger vers la page projet avec animation
                                console.log("🎯 [Layout] Redirection vers page projet:", taskForPdcSelection.project_id);
                                setSelectedId(taskForPdcSelection.project_id);
                                setActiveSection('projet-detail');
                                setTaskForPdcSelection(null);
                                
                                // Déclencher l'animation de la tâche après un court délai
                                setTimeout(() => {
                                    setHighlightedTaskId(taskForPdcSelection.id);
                                    // Arrêter l'animation après 3 secondes
                                    setTimeout(() => {
                                        setHighlightedTaskId(null);
                                    }, 3000);
                                }, 200);
                            } else {
                                // Comportement normal pour les autres types de tâches
                                setActiveSection('task-detail');
                                setTaskForPdcSelection(null);
                            }
                            
                            console.log("✅ [Layout] PDC sélectionné avec succès");
                        } catch (error) {
                            console.error('Erreur lors de la sélection PDC:', error);
                            alert('Erreur lors de la sélection du PDC. Veuillez réessayer.');
                        }
                    },
                    onRowClick: null,
                    onBack: () => {
                        setActiveSection('task-detail');
                        setTaskForPdcSelection(null);
                    },
                    breadcrumbBase: "Tâches",
                    breadcrumbCurrent: "Choisir un plan de cours"
                });
            case 'appointment-booking':
                console.log("🎯 [Layout] Navigation vers appointment-booking, taskForAppointment:", taskForAppointment);
                console.log("🎯 [Layout] window.AppointmentBookingPage existe?", !!window.AppointmentBookingPage);
                return React.createElement(window.AppointmentBookingPage, {
                    tache: taskForAppointment,
                    onBack: () => {
                        setActiveSection('task-detail');
                        setTaskForAppointment(null);
                    },
                    onAppointmentBooked: async (result) => {
                        console.log("✅ [Layout] Rendez-vous confirmé avec succès:", result);
                        
                        // Réinitialiser le PDC du projet car le formateur déterminera le bon PDC pendant le RDV
                        try {
                            const projectId = taskForAppointment?.project_id;
                            console.log(`🔄 [Layout] Réinitialisation du PDC pour le projet ${projectId}...`);
                            
                            await resetProjectPdc(projectId);
                            console.log("✅ [Layout] PDC du projet réinitialisé avec succès");
                            
                            // Rafraîchir les données de ProjectDetailPage pour refléter le changement
                            if (projectDetailRefresh) {
                                console.log("🔄 [Layout] Déclenchement du rafraîchissement de ProjectDetailPage...");
                                setTimeout(() => {
                                    projectDetailRefresh();
                                    console.log("✅ [Layout] ProjectDetailPage rafraîchie");
                                }, 500); // Délai pour laisser la navigation se terminer
                            } else {
                                console.log("⚠️ [Layout] Aucune fonction de refresh disponible pour ProjectDetailPage");
                            }
                            
                        } catch (pdcResetError) {
                            console.error("❌ [Layout] Erreur lors de la réinitialisation du PDC:", pdcResetError);
                        }
                        
                        // Préparer l'animation pour la tâche "Demande de qualification"
                        const taskToHighlight = taskForAppointment?.id;
                        console.log("🎯 [Layout] Tâche à animer:", taskToHighlight);
                        
                        // Redirection immédiate vers la page projet
                        console.log("🎯 [Layout] Redirection vers page projet:", taskForAppointment?.project?.id);
                        setSelectedId(taskForAppointment?.project?.id);
                        setActiveSection('projet-detail');
                        setTaskForAppointment(null);
                        
                        // Déclencher l'animation de la tâche après un court délai pour laisser la page se charger
                        setTimeout(() => {
                            setHighlightedTaskId(taskToHighlight);
                            // Arrêter l'animation après 3 secondes
                            setTimeout(() => {
                                setHighlightedTaskId(null);
                            }, 3000);
                        }, 200);
                    }
                });
            case 'template-builder':
                return React.createElement(window.TemplateBuilderPage);
            case 'evaluation-preparer':
                return React.createElement(window.FormationPrepPage);
            case 'evaluations':
                return React.createElement(window.EvaluationListPage);
            case 'rapports':
                return React.createElement('div', {
                    className: "bg-white rounded-lg border border-gray-200 p-8"
                }, [
                    React.createElement('h1', {
                        key: 'title',
                        className: "text-2xl font-bold text-gray-900 mb-4"
                    }, activeSection.charAt(0).toUpperCase() + activeSection.slice(1)),
                    React.createElement('p', {
                        key: 'content',
                        className: "text-gray-600"
                    }, "Page en développement...")
                ]);
            default:
                return React.createElement(window.EntreprisesPage);
        }
    };

    // Si on affiche le formulaire d'évaluation (accès public), ne pas afficher l'interface normale
    if (evaluationToken) {
        return renderContent();
    }

    return React.createElement(window.AuthProvider, {}, [
        React.createElement('div', {
            key: 'layout',
            className: "flex h-screen bg-gray-50"
        }, [
            React.createElement(window.Sidebar, {
                key: 'sidebar',
                activeSection: activeSection,
                onSectionChange: handleSidebarClick,
                onOpenSettings: () => setShowSettingsModal(true)
            }),
            React.createElement('main', {
                key: 'main',
                className: "flex-1 overflow-y-auto"
            }, React.createElement('div', {
                className: "p-8"
            }, renderContent()))
        ]),

        // Indicateur de statut temps réel
        React.createElement(window.RealtimeStatus, {
            key: 'realtime-status'
        }),

        // Modal des paramètres
        showSettingsModal && React.createElement(window.UserSettingsModal, {
            key: 'settings-modal',
            onClose: () => setShowSettingsModal(false)
        })
    ]);
}

// Export global
window.Layout = Layout;