// Page Tâches - Optimized with React.memo
const TasksPage = React.memo(function TasksPage({ onRowClick }) {
    const { useState, useCallback } = React;
    const { tasks, loading, error, createTask, updateTask, deleteTask } = window.useTasks();
    const { projects } = window.useProjects();
    const currentUserRole = window.useCurrentUserRole();
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    
    const statusOptions = [
        { value: 'todo', label: 'À faire' },
        { value: 'in_progress', label: 'En cours' },
        { value: 'completed', label: 'Terminé' }
    ];
    
    const priorityOptions = [
        { value: 'low', label: 'Faible' },
        { value: 'medium', label: 'Moyenne' },
        { value: 'high', label: 'Élevée' }
    ];
    
    const columns = [
        { key: 'workflow_order', label: 'Ordre', type: 'number', sortable: true, width: '80px' },
        { key: 'title', label: 'Titre', type: 'text', sortable: true },
        { key: 'description', label: 'Description', type: 'text', width: '300px' },
        { key: 'status', label: 'Statut', type: 'badge', options: statusOptions },
        { key: 'priority', label: 'Priorité', type: 'badge', options: priorityOptions },
        { 
            key: 'project', 
            label: 'Projet', 
            type: 'text',
            render: (value) => value?.name || '-'
        },
        { key: 'assigned_user', label: 'Assigné à', type: 'user' },
        { key: 'due_date', label: 'Échéance', type: 'date', sortable: true },
        { key: 'created_at', label: 'Créé le', type: 'date', sortable: true },
        { key: 'actions', label: 'Actions', type: 'actions' }
    ];
    
    const handleAdd = useCallback(() => {
        setEditingItem(null);
        setShowModal(true);
    }, []);
    
    const handleEdit = useCallback((item) => {
        setEditingItem(item);
        setShowModal(true);
    }, []);
    
    const handleDelete = useCallback(async (item) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${item.title}" ?`)) {
            try {
                await deleteTask(item.id);
            } catch (error) {
                console.error('Erreur:', error);
            }
        }
    }, [deleteTask]);
    
    const handleSubmit = useCallback(async (formData) => {
        try {
            if (editingItem) {
                await updateTask(editingItem.id, formData);
            } else {
                await createTask(formData);
            }
            setShowModal(false);
            setEditingItem(null);
        } catch (error) {
            console.error('Erreur:', error);
        }
    }, [editingItem, updateTask, createTask]);
    
    if (error) {
        return React.createElement('div', {
            className: "bg-red-50 border border-red-200 rounded-lg p-4"
        }, React.createElement('p', {
            className: "text-red-800"
        }, `Erreur: ${error}`));
    }
    
    // Adapter l'interface selon le rôle utilisateur
    const getPageTitle = () => {
        if (currentUserRole.isUserRole) {
            return "Mes Tâches";
        }
        return "Tâches";
    };
    
    const getPageSubtitle = () => {
        if (currentUserRole.isUserRole) {
            return "Tâches qui vous sont assignées";
        }
        return "Gérez toutes les tâches et suivez l'avancement des projets";
    };
    
    const canCreateTask = () => {
        return currentUserRole.isManagerOrAdmin;
    };
    
    const canEditTask = () => {
        return currentUserRole.isManagerOrAdmin;
    };
    
    const canDeleteTask = () => {
        return currentUserRole.isManagerOrAdmin;
    };
    
    return React.createElement('div', {}, [
        React.createElement(window.TableView, {
            key: 'table',
            data: tasks,
            columns: columns,
            title: getPageTitle(),
            subtitle: getPageSubtitle(),
            loading: loading,
            onAdd: canCreateTask() ? handleAdd : null,
            onEdit: canEditTask() ? handleEdit : null,
            onDelete: canDeleteTask() ? handleDelete : null,
            onRowClick: onRowClick
        }),
        
        showModal && React.createElement(window.TaskModal, {
            key: 'modal',
            item: editingItem,
            projects: projects,
            statusOptions: statusOptions,
            priorityOptions: priorityOptions,
            onSubmit: handleSubmit,
            onClose: () => {
                setShowModal(false);
                setEditingItem(null);
            }
        })
    ]);
});

// Export global
window.TasksPage = TasksPage;