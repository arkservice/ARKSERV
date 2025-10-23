// Page de détail d'un projet
function ProjectDetailPage({ projetId, highlightedTaskId, onBack, onNavigateToTask, onRefresh }) {
    const { useState, useEffect, useMemo, useCallback } = React;
    const supabase = window.supabaseConfig.client;
    const { getSessionsForProject } = window.useProjectSessions();
    const { createTask, updateTask } = window.useTasks();
    const { users: arkanceUsers } = window.useArkanceUsers();
    
    const [projet, setProjet] = useState(null);
    const [taches, setTaches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stagiaires, setStagiaires] = useState([]);
    const [availableLogiciels, setAvailableLogiciels] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [availablePdcs, setAvailablePdcs] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    
    // Mémorisation des calculs coûteux pour les performances
    const sortedTasks = useMemo(() => 
        [...taches].sort((a, b) => (a.workflow_order || 0) - (b.workflow_order || 0)), 
        [taches]
    );

    const nextTask = useMemo(() => 
        sortedTasks.find(t => t.status !== 'completed'), 
        [sortedTasks]
    );
    
    
    
    // Charger les données de référence pour les dropdowns
    const fetchReferenceData = async () => {
        try {
            // Charger les logiciels
            const { data: logicielsData } = await supabase
                .from('logiciel')
                .select('id, nom, logo')
                .order('nom');
            setAvailableLogiciels(logicielsData || []);
            
            // Charger tous les utilisateurs (pour filtrage ultérieur)
            const { data: usersData } = await supabase
                .from('user_profile')
                .select(`
                    id, prenom, nom, avatar, entreprise_id,
                    entreprise(id, nom, type_entreprise),
                    fonction(id, nom),
                    service(id, nom)
                `)
                .order('prenom, nom');
            setAvailableUsers(usersData || []);
            
            // Charger les PDCs
            const { data: pdcsData } = await supabase
                .from('pdc')
                .select('id, ref, pdc_number')
                .order('ref');
            setAvailablePdcs(pdcsData || []);
        } catch (error) {
            console.error('Erreur lors du chargement des données de référence:', error);
        }
    };
    
    
    // Fonction centralisée pour déterminer l'état d'une tâche
    const getTaskState = useCallback((task) => {
        if (task.status === 'completed') {
            return {
                className: 'workflow-task-completed',
                circleClass: 'completed',
                clickable: true
            };
        }
        
        if (nextTask && task.id === nextTask.id) {
            return {
                className: 'workflow-task-current',
                circleClass: task.status,
                clickable: true
            };
        }
        
        // Tâche bloquée
        return {
            className: 'workflow-task-blocked',
            circleClass: 'blocked',
            clickable: false
        };
    }, [nextTask]);

    // Fonction pour déterminer si une tâche est cliquable
    const isTaskClickable = useCallback((task) => {
        return getTaskState(task).clickable;
    }, [getTaskState]);

    // Fonction pour naviguer vers le détail d'une tâche
    const handleTaskClick = useCallback((task) => {
        if (!isTaskClickable(task)) return;
        
        if (onNavigateToTask) {
            onNavigateToTask(task);
        }
    }, [isTaskClickable, onNavigateToTask]);

    // Fonction pour déterminer la classe CSS de workflow pour chaque tâche
    const getTaskWorkflowClassName = useCallback((task) => {
        let className = getTaskState(task).className;
        
        // Ajouter l'animation si cette tâche est mise en évidence
        if (highlightedTaskId && task.id === highlightedTaskId) {
            className += ' task-row-highlighted';
        }
        
        return className;
    }, [getTaskState, highlightedTaskId]);
    
    const fetchProjectDetails = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            console.log(`🔄 [ProjectDetailPage] Chargement des détails du projet ${projetId}...`);
            
            // Charger les détails du projet avec entreprise, logiciel, commercial, contact et PDC
            const { data: projetData, error: projetError } = await supabase
                .from('projects')
                .select(`
                    *,
                    entreprise:entreprise_id(id, nom, adresse, telephone, email, secteur_activite, type_entreprise),
                    logiciel:logiciel_id(id, nom, editeur, description, logo),
                    commercial:commercial_id(id, prenom, nom, avatar, telephone),
                    contact:contact_id(id, prenom, nom, avatar, telephone),
                    pdc:pdc_id(id, ref, pdc_number, duree_en_jour, public_cible, objectifs, pdf_file_url, logiciel:logiciel_id(id, nom, editeur, description, logo))
                `)
                .eq('id', projetId)
                .single();
            
            if (projetError) throw projetError;
            
            // Récupérer les détails du commercial avec email
            if (projetData.commercial_id) {
                const { data: commercialData } = await supabase
                    .from('user_profile')
                    .select('id, prenom, nom, avatar, email, telephone')
                    .eq('id', projetData.commercial_id)
                    .single();
                
                if (commercialData) {
                    projetData.commercial = commercialData;
                }
            }

            // Récupérer les détails du contact avec email  
            if (projetData.contact_id) {
                const { data: contactData } = await supabase
                    .from('user_profile')
                    .select('id, prenom, nom, avatar, email, telephone')
                    .eq('id', projetData.contact_id)
                    .single();
                
                if (contactData) {
                    projetData.contact = contactData;
                }
            }
            
            setProjet(projetData);
            
            // Charger les tâches du projet avec les données utilisateur
            const { data: tachesData, error: tachesError } = await supabase
                .from('tasks')
                .select('*, assigned_user:assigned_to(id, prenom, nom, avatar)')
                .eq('project_id', projetId)
                .order('workflow_order', { ascending: true })
                .order('created_at', { ascending: false });
            
            if (tachesError) throw tachesError;
            setTaches(tachesData || []);
            
            // Charger les stagiaires si des IDs sont présents
            if (projetData.stagiaires && projetData.stagiaires.length > 0) {
                const { data: stagiairesData, error: stagiairesError } = await supabase
                    .from('user_profile')
                    .select('id, prenom, nom, avatar')
                    .in('id', projetData.stagiaires);
                
                if (stagiairesError) throw stagiairesError;
                setStagiaires(stagiairesData || []);
            } else {
                setStagiaires([]);
            }
            
            // Charger les sessions de formation
            const sessionsData = await getSessionsForProject(projetId);
            setSessions(sessionsData || []);
            
        } catch (err) {
            console.error('Erreur lors du chargement des détails:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projetId]);
    
    // Fonctions de gestion de la modal de création de tâche
    const handleAddTask = useCallback(() => {
        setEditingTask(null);
        setShowTaskModal(true);
    }, []);
    
    const handleSubmitTask = useCallback(async (formData) => {
        try {
            // Pré-remplir le project_id avec l'ID du projet courant
            const taskData = {
                ...formData,
                project_id: projetId
            };
            
            if (editingTask) {
                // Pour la modification (non utilisé pour l'instant mais préparé)
                await updateTask(editingTask.id, taskData);
            } else {
                // Pour la création
                await createTask(taskData);
            }
            
            setShowTaskModal(false);
            setEditingTask(null);
            
            // Recharger les données du projet pour avoir les nouvelles tâches
            await fetchProjectDetails();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la tâche:', error);
        }
    }, [editingTask, createTask, projetId, fetchProjectDetails]);
    
    const handleCloseTaskModal = useCallback(() => {
        setShowTaskModal(false);
        setEditingTask(null);
    }, []);
    
    // Fonction pour gérer l'édition inline des cellules (dropdown editable)
    const handleCellEdit = useCallback(async (row, columnKey, newValue) => {
        try {
            console.log(`🔄 Mise à jour ${columnKey} pour tâche ${row.id}: ${newValue}`);
            await updateTask(row.id, { [columnKey]: newValue });
            // Recharger les données du projet pour avoir les mises à jour
            await fetchProjectDetails();
            console.log(`✅ ${columnKey} mis à jour avec succès`);
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la cellule:', error);
            // TODO: Afficher un toast d'erreur à l'utilisateur
        }
    }, [updateTask, fetchProjectDetails]);
    
    useEffect(() => {
        if (projetId) {
            // Optimisation : ne recharger que si nécessaire
            if (!projet || projet.id !== projetId) {
                fetchProjectDetails();
            }
            // Les données de référence sont chargées une seule fois
            if (availableLogiciels.length === 0) {
                fetchReferenceData();
            }
        }
    }, [projetId, projet]);
    
    // Initialiser les icônes Lucide
    useEffect(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, [projet]);
    
    // Fonction pour rafraîchir les données du projet (peut être appelée de l'extérieur)
    const refreshProjectData = useCallback(() => {
        console.log('🔄 [ProjectDetailPage] Rafraîchissement des données demandé...');
        fetchProjectDetails();
    }, [fetchProjectDetails]);
    
    // Exposer la fonction de refresh via onRefresh callback
    React.useEffect(() => {
        if (onRefresh) {
            onRefresh(refreshProjectData);
        }
    }, [onRefresh, refreshProjectData]);
    
    if (loading) {
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
            }),
            React.createElement('div', {
                key: 'content2',
                className: "h-4 bg-gray-200 rounded w-1/2"
            })
        ]));
    }
    
    if (error) {
        return React.createElement('div', {
            className: "bg-red-50 border border-red-200 rounded-lg p-4"
        }, React.createElement('p', {
            className: "text-red-800"
        }, `Erreur: ${error}`));
    }
    
    if (!projet) {
        return React.createElement('div', {
            className: "bg-white rounded-lg border border-gray-200 p-8"
        }, React.createElement('p', {
            className: "text-gray-600"
        }, "Projet non trouvé"));
    }
    
    const statusOptions = [
        { value: 'planning', label: 'Planification', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'active', label: 'Actif', color: 'bg-green-100 text-green-800' },
        { value: 'on_hold', label: 'En pause', color: 'bg-orange-100 text-orange-800' },
        { value: 'completed', label: 'Terminé', color: 'bg-blue-100 text-blue-800' },
        { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-800' }
    ];
    
    const taskStatusOptions = [
        { value: 'todo', label: 'À faire' },
        { value: 'in_progress', label: 'En cours' },
        { value: 'completed', label: 'Terminé' }
    ];
    
    const taskPriorityOptions = [
        { value: 'low', label: 'Faible' },
        { value: 'medium', label: 'Moyenne' },
        { value: 'high', label: 'Élevée' }
    ];
    
    const currentStatus = statusOptions.find(status => status.value === projet.status);
    
    // Vérifier si la tâche de planification est terminée
    const tachePlanification = taches.find(tache => 
        tache.title && tache.title.toLowerCase().includes('planification')
    );
    const isPlanificationComplete = tachePlanification && tachePlanification.status === 'completed';
    

    // Configuration des colonnes pour les projets de formation (avec workflow)
    const formationTaskColumns = [
        { 
            key: 'workflow_order', 
            label: 'Ordre', 
            type: 'number', 
            sortable: true, 
            width: '80px',
            render: (value, row) => {
                const taskState = getTaskState(row);
                const circleClass = `task-order-circle ${taskState.circleClass}`;
                
                return React.createElement('div', {
                    className: circleClass
                }, value);
            }
        },
        { key: 'title', label: 'Titre', type: 'text', sortable: true },
        { 
            key: 'description', 
            label: 'Description', 
            type: 'text', 
            sortable: false,
            render: (value, row) => {
                // Appliquer l'animation sur la description si cette tâche est mise en évidence
                const isHighlighted = highlightedTaskId && row.id === highlightedTaskId;
                const className = isHighlighted ? 'task-description-animated' : '';
                
                return React.createElement('div', {
                    className: className
                }, value);
            }
        },
        { 
            key: 'status', 
            label: 'Statut', 
            type: 'badge', 
            options: [
                { value: 'todo', label: 'À faire' },
                { value: 'in_progress', label: 'En cours' },
                { value: 'completed', label: 'Terminé' }
            ]
        },
        { 
            key: 'assigned_to', 
            label: 'Assigné à', 
            type: 'text',
            render: (value, row) => {
                if (!row.assigned_user) {
                    return React.createElement('span', {
                        className: "text-sm text-gray-500"
                    }, '-');
                }
                
                const user = row.assigned_user;
                return React.createElement('div', {
                    className: "flex items-center gap-2"
                }, [
                    React.createElement('div', {
                        key: 'avatar',
                        className: "w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600"
                    }, user.avatar ? React.createElement('img', {
                        src: user.avatar,
                        alt: `${user.prenom} ${user.nom}`,
                        className: "w-6 h-6 rounded-full object-cover"
                    }) : `${user.prenom?.[0]}${user.nom?.[0]}`),
                    React.createElement('span', {
                        key: 'name',
                        className: "text-sm text-gray-900"
                    }, `${user.prenom} ${user.nom}`)
                ]);
            }
        },
        { key: 'created_at', label: 'Date création', type: 'date', sortable: true }
    ];

    // Configuration des colonnes pour les projets de prestation (sans workflow)
    const prestationTaskColumns = [
        { key: 'title', label: 'Titre', type: 'text', sortable: true },
        { 
            key: 'description', 
            label: 'Description', 
            type: 'text', 
            sortable: false,
            render: (value, row) => {
                return React.createElement('div', null, value || '-');
            }
        },
        { 
            key: 'status', 
            label: 'Statut', 
            type: 'editable-badge', 
            options: [
                { value: 'todo', label: 'À faire' },
                { value: 'in_progress', label: 'En cours' },
                { value: 'completed', label: 'Terminé' }
            ]
        },
        { 
            key: 'priority', 
            label: 'Priorité', 
            type: 'editable-badge', 
            options: [
                { value: 'low', label: 'Faible' },
                { value: 'medium', label: 'Moyenne' },
                { value: 'high', label: 'Élevée' }
            ]
        },
        { 
            key: 'assigned_to', 
            label: 'Assigné à', 
            type: 'user-assignment',
            options: arkanceUsers
        },
        { key: 'created_at', label: 'Date création', type: 'date', sortable: true },
        { key: 'due_date', label: 'Date échéance', type: 'date', sortable: true }
    ];
    
    return React.createElement('div', {
        className: "space-y-6"
    }, [
        // En-tête avec navigation
        React.createElement('div', {
            key: 'header',
            className: "bg-white rounded-lg border border-gray-200 p-6"
        }, [
            React.createElement(window.DetailPageHeader, {
                key: 'nav',
                onBack: onBack,
                breadcrumbBase: "Projets",
                breadcrumbCurrent: projet.name
            }),
            React.createElement('div', {
                key: 'title',
                className: "flex items-center gap-4"
            }, [
                React.createElement('h1', {
                    key: 'name',
                    className: "text-2xl font-bold text-gray-900"
                }, projet.name),
                React.createElement('span', {
                    key: 'status',
                    className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentStatus?.color || 'bg-gray-100 text-gray-800'}`
                }, currentStatus?.label || projet.status)
            ])
        ]),
        
        // Section Entreprise (composant collapsible)
        React.createElement(CollapsibleEntrepriseSection, {
            key: 'entreprise',
            entreprise: projet.entreprise
        }),
        
        // Section Projet et Équipe (fusionnées) - Composant collapsible
        React.createElement(window.CollapsibleProjectSection, {
            key: 'projet',
            projet: projet,
            taches: taches,
            stagiaires: stagiaires,
            sessions: sessions,
            availableLogiciels: availableLogiciels,
            availableUsers: availableUsers,
            availablePdcs: availablePdcs,
            hideEditButton: true,
            onSaveProject: async (editData) => {
                const { error: updateError } = await supabase
                    .from('projects')
                    .update(editData)
                    .eq('id', projetId);
                
                if (updateError) throw updateError;
                await fetchProjectDetails(); // Recharger les données
            },
            onRefresh: fetchProjectDetails
        }),
        
        
        // Section Tâches
        React.createElement('div', {
            key: 'taches',
            className: "bg-white rounded-lg border border-gray-200"
        }, [
            React.createElement(window.TableView, {
                key: 'table',
                data: taches,
                columns: projet?.type === 'prestation' ? prestationTaskColumns : formationTaskColumns,
                title: `Tâches du projet (${taches.length})`,
                subtitle: "Tâches liées à ce projet",
                loading: false,
                onRowClick: (task) => isTaskClickable(task) ? handleTaskClick(task) : undefined,
                getRowClassName: projet?.type === 'prestation' ? undefined : getTaskWorkflowClassName,
                onAdd: projet?.type === 'prestation' ? handleAddTask : null,
                onCellEdit: projet?.type === 'prestation' ? handleCellEdit : null
            })
        ]),
        
        // Modal de création de tâche (uniquement pour les projets de type prestation)
        showTaskModal && projet?.type === 'prestation' && React.createElement(window.TaskModal, {
            key: 'task-modal',
            item: editingTask,
            projects: [projet], // On passe seulement le projet courant
            statusOptions: taskStatusOptions,
            priorityOptions: taskPriorityOptions,
            onSubmit: handleSubmitTask,
            onClose: handleCloseTaskModal
        })
    ]);
}

// Export global
window.ProjectDetailPage = ProjectDetailPage;