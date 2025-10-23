// Page Projets - Optimized with React.memo
const ProjectsPage = React.memo(function ProjectsPage({ onRowClick }) {
    const { useState, useMemo, useCallback } = React;
    const { projects, loading, error, createProject, updateProject, deleteProject } = window.useProjects();
    const currentUserEntreprise = window.useCurrentUserEntreprise();
    const { entreprises } = window.useEntreprises();
    const { users } = window.useUsers();
    const { logiciels } = window.useLogiciels();
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [groupBy, setGroupBy] = useState('entreprise'); // Par défaut groupé par entreprise
    const [expandAll, setExpandAll] = useState(true);
    
    const statusOptions = [
        { value: 'active', label: 'Actif' },
        { value: 'paused', label: 'En pause' },
        { value: 'completed', label: 'Terminé' }
    ];
    
    const columns = [
        { key: 'name', label: 'Nom du projet', type: 'text', sortable: true },
        { 
            key: 'entreprise', 
            label: 'Entreprise', 
            type: 'text',
            render: (value) => value?.nom || '-'
        },
        { 
            key: 'logiciel', 
            label: 'Logiciel', 
            type: 'text',
            render: (value) => value?.nom || '-'
        },
        { key: 'status', label: 'Statut', type: 'badge', options: statusOptions },
        { key: 'description', label: 'Description', type: 'text' },
        { key: 'created_at', label: 'Date de création', type: 'date', sortable: true },
        { key: 'actions', label: 'Actions', type: 'actions' }
    ];
    
    const handleAdd = useCallback(() => {
        setEditingItem(null);
        setShowModal(true);
    }, []);

    const handleImport = useCallback(() => {
        console.log('handleImport appelé !');
        setShowImportModal(true);
    }, []);

    // Debug - vérifier si la fonction est bien définie
    console.log('ProjectsPage - handleImport défini:', !!handleImport);
    console.log('ProjectsPage - canAddProject:', canAddProject());
    
    const handleEdit = useCallback((item) => {
        setEditingItem(item);
        setShowModal(true);
    }, []);
    
    const handleDelete = useCallback(async (item) => {
        try {
            // Compter les événements liés au projet
            const supabase = window.supabaseConfig.client;
            const { data: events, error: countError } = await supabase
                .from('evenement')
                .select('id')
                .eq('projet_id', item.id)
                .eq('type_evenement', 'formation');
            
            if (countError) {
                console.error('Erreur lors du comptage des événements:', countError);
            }
            
            const eventCount = events ? events.length : 0;
            
            // Message de confirmation personnalisé
            let confirmMessage = `Êtes-vous sûr de vouloir supprimer le projet "${item.name}" ?`;
            
            if (eventCount > 0) {
                confirmMessage += `\n\n⚠️ ATTENTION : Cette action supprimera également ${eventCount} événement${eventCount > 1 ? 's' : ''} de formation associé${eventCount > 1 ? 's' : ''} à ce projet.`;
                confirmMessage += '\n\nCette action est irréversible.';
            }
            
            if (window.confirm(confirmMessage)) {
                await deleteProject(item.id);
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
        }
    }, [deleteProject]);
    
    const handleSubmit = useCallback(async (formData) => {
        try {
            if (editingItem) {
                await updateProject(editingItem.id, formData);
            } else {
                await createProject(formData);
            }
            setShowModal(false);
            setEditingItem(null);
        } catch (error) {
            console.error('Erreur:', error);
        }
    }, [editingItem, updateProject, createProject]);
    
    if (error) {
        return React.createElement('div', {
            className: "bg-red-50 border border-red-200 rounded-lg p-4"
        }, React.createElement('p', {
            className: "text-red-800"
        }, `Erreur: ${error}`));
    }
    
    // Adapter l'interface selon le type d'utilisateur
    const getPageTitle = () => {
        if (currentUserEntreprise.isClientUser) {
            return groupBy ? "Mes projets par " + (groupBy === 'entreprise' ? 'entreprise' : groupBy === 'status' ? 'statut' : 'logiciel') : "Mes Projets";
        }
        if (!groupBy) return "Projets";
        switch(groupBy) {
            case 'entreprise': return "Projets par entreprise";
            case 'status': return "Projets par statut";
            case 'logiciel': return "Projets par logiciel";
            default: return "Projets";
        }
    };
    
    const getPageSubtitle = () => {
        if (currentUserEntreprise.isClientUser) {
            return "Projets où vous êtes impliqué (contact ou tâches assignées)";
        }
        if (!groupBy) return "Gérez les projets de formation et leur avancement";
        switch(groupBy) {
            case 'entreprise': return "Gérez les projets de formation groupés par entreprise";
            case 'status': return "Gérez les projets de formation groupés par statut";
            case 'logiciel': return "Gérez les projets de formation groupés par logiciel";
            default: return "Gérez les projets de formation et leur avancement";
        }
    };
    
    const canAddProject = () => {
        // Tous les utilisateurs peuvent ajouter des projets
        return true;
    };
    
    const canEditProject = () => {
        // Seuls les utilisateurs Arkance peuvent modifier des projets
        return currentUserEntreprise.isArkanceUser;
    };
    
    const canDeleteProject = () => {
        // Seuls les utilisateurs Arkance peuvent supprimer des projets
        return currentUserEntreprise.isArkanceUser;
    };

    // Fonctions mémorisées pour obtenir les titres
    const title = useMemo(() => getPageTitle(), [groupBy, currentUserEntreprise.loading, currentUserEntreprise.isClientUser]);
    const subtitle = useMemo(() => getPageSubtitle(), [groupBy, currentUserEntreprise.loading, currentUserEntreprise.isClientUser]);

    return React.createElement('div', {}, [
        // Affichage conditionnel selon le mode
        groupBy ?
            React.createElement(window.GroupedTableView, {
                key: 'grouped-table',
                data: projects,
                columns: columns,
                title: title,
                subtitle: subtitle,
                loading: loading,
                onAdd: canAddProject() ? handleAdd : null,
                onImport: canAddProject() ? handleImport : null,
                onEdit: canEditProject() ? handleEdit : null,
                onDelete: canDeleteProject() ? handleDelete : null,
                onRowClick: onRowClick,
                groupBy: groupBy,
                expandAll: expandAll,
                statusOptions: statusOptions,
                onGroupChange: setGroupBy,
                onExpandChange: setExpandAll
            }) :
            React.createElement(window.TableView, {
                key: 'table',
                data: projects,
                columns: columns,
                title: title,
                subtitle: subtitle,
                loading: loading,
                onAdd: canAddProject() ? handleAdd : null,
                onImport: canAddProject() ? handleImport : null,
                onEdit: canEditProject() ? handleEdit : null,
                onDelete: canDeleteProject() ? handleDelete : null,
                onRowClick: onRowClick,
                groupBy: groupBy,
                expandAll: expandAll,
                onGroupChange: setGroupBy,
                onExpandChange: setExpandAll
            }),

        showModal && React.createElement(window.ProjectModal, {
            key: 'modal',
            item: editingItem,
            entreprises: entreprises,
            logiciels: logiciels,
            users: users,
            statusOptions: statusOptions,
            onSubmit: handleSubmit,
            onClose: () => {
                setShowModal(false);
                setEditingItem(null);
            }
        }),

        showImportModal && React.createElement(window.ImportProjectsModal, {
            key: 'import-modal',
            show: showImportModal,
            onClose: () => {
                setShowImportModal(false);
                // Rafraîchir la liste des projets après import
                window.location.reload();
            }
        })
    ]);
});

// Export global
window.ProjectsPage = ProjectsPage;