// Composant générique pour les pages CRUD simples
// Factorisation de ServicesPage, MetierPdcPage, TypePdcPage, etc.
const SimpleCRUDPage = React.memo(function SimpleCRUDPage(config) {
    const { useState, useCallback } = React;

    // Configuration
    const {
        // Hook personnalisé qui gère les données
        useHook,              // Hook à utiliser (ex: window.useServices)

        // Composant modal
        ModalComponent,       // Composant modal (ex: window.ServiceModal)

        // Configuration TableView
        title,                // Titre de la page (requis)
        subtitle,             // Sous-titre de la page (requis)
        columns,              // Colonnes du tableau (requis)
        searchableFields,     // Champs sur lesquels effectuer la recherche (optionnel)

        // Noms des fonctions du hook (pour flexibilité)
        dataKey = 'data',     // Nom de la propriété des données dans le hook
        createFnKey = 'createItem',  // Nom de la fonction create dans le hook
        updateFnKey = 'updateItem',  // Nom de la fonction update dans le hook
        deleteFnKey = 'deleteItem',  // Nom de la fonction delete dans le hook

        // Nom de l'entité (pour les messages de confirmation)
        entityName = 'élément',  // Nom de l'entité au singulier

        // Propriété à afficher dans le message de confirmation de suppression
        displayField = 'nom',    // Champ à afficher (défaut: 'nom')

        // Comportement du onRowClick (optionnel, défaut: ouvre la modal d'édition)
        onRowClick: customOnRowClick
    } = config;

    // Utiliser le hook fourni
    const hookResult = useHook();
    const data = hookResult[dataKey] || [];
    const loading = hookResult.loading;
    const error = hookResult.error;
    const createFn = hookResult[createFnKey];
    const updateFn = hookResult[updateFnKey];
    const deleteFn = hookResult[deleteFnKey];

    // État local
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Handlers
    const handleAdd = useCallback(() => {
        setEditingItem(null);
        setShowModal(true);
    }, []);

    const handleEdit = useCallback((item) => {
        setEditingItem(item);
        setShowModal(true);
    }, []);

    const handleDelete = useCallback(async (item) => {
        const itemName = item[displayField] || 'cet élément';
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${entityName} "${itemName}" ?`)) {
            try {
                await deleteFn(item.id);
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
            }
        }
    }, [deleteFn, entityName, displayField]);

    const handleSubmit = useCallback(async (formData) => {
        try {
            if (editingItem) {
                await updateFn(editingItem.id, formData);
            } else {
                await createFn(formData);
            }
            setShowModal(false);
            setEditingItem(null);
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
        }
    }, [editingItem, updateFn, createFn]);

    const handleClose = useCallback(() => {
        setShowModal(false);
        setEditingItem(null);
    }, []);

    // onRowClick handler (custom ou handleEdit par défaut)
    const rowClickHandler = customOnRowClick || handleEdit;

    // Affichage des erreurs
    if (error) {
        return React.createElement('div', {
            className: "bg-red-50 border border-red-200 rounded-lg p-4"
        }, React.createElement('p', {
            className: "text-red-800"
        }, `Erreur: ${error}`));
    }

    // Render
    return React.createElement('div', {}, [
        // TableView
        React.createElement(window.TableView, {
            key: 'table',
            data: data,
            columns: columns,
            title: title,
            subtitle: subtitle,
            loading: loading,
            onAdd: handleAdd,
            onDelete: handleDelete,
            onRowClick: rowClickHandler,
            searchableFields: searchableFields
        }),

        // Modal (conditionnel)
        showModal && React.createElement(ModalComponent, {
            key: 'modal',
            item: editingItem,
            onSubmit: handleSubmit,
            onClose: handleClose
        })
    ]);
});

// Export global
window.SimpleCRUDPage = SimpleCRUDPage;
