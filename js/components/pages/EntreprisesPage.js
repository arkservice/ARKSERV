// Page Entreprises - Optimized with React.memo
const EntreprisesPage = React.memo(function EntreprisesPage({ onRowClick }) {
    const { useState, useCallback } = React;
    const { entreprises, loading, error, createEntreprise, updateEntreprise, deleteEntreprise } = window.useEntreprises();
    const currentUserEntreprise = window.useCurrentUserEntreprise();
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    
    const columns = [
        { key: 'nom', label: 'Nom', type: 'text', sortable: true },
        { key: 'adresse', label: 'Adresse', type: 'text' },
        { key: 'telephone', label: 'Téléphone', type: 'text' },
        { key: 'secteur_activite', label: 'Secteur d\'activité', type: 'text' }
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
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${item.nom}" ?`)) {
            try {
                await deleteEntreprise(item.id);
            } catch (error) {
                console.error('Erreur:', error);
            }
        }
    }, [deleteEntreprise]);
    
    const handleSubmit = useCallback(async (formData) => {
        try {
            if (editingItem) {
                await updateEntreprise(editingItem.id, formData);
            } else {
                await createEntreprise(formData);
            }
            setShowModal(false);
            setEditingItem(null);
        } catch (error) {
            console.error('Erreur:', error);
        }
    }, [editingItem, updateEntreprise, createEntreprise]);
    
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
            return "Mon Entreprise";
        }
        return "Entreprises";
    };
    
    const getPageSubtitle = () => {
        if (currentUserEntreprise.isClientUser) {
            return "Informations de votre entreprise";
        }
        return "Gérez les entreprises clientes et leurs informations";
    };
    
    const canAddEntreprise = () => {
        // Seuls les utilisateurs Arkance peuvent ajouter des entreprises
        return currentUserEntreprise.isArkanceUser;
    };

    return React.createElement('div', {}, [
        React.createElement(window.TableView, {
            key: 'table',
            data: entreprises,
            columns: columns,
            title: getPageTitle(),
            subtitle: getPageSubtitle(),
            loading: loading,
            onAdd: canAddEntreprise() ? handleAdd : null,
            onRowClick: onRowClick
        }),
        
        showModal && React.createElement(window.EntrepriseModal, {
            key: 'modal',
            item: editingItem,
            onSubmit: handleSubmit,
            onClose: () => {
                setShowModal(false);
                setEditingItem(null);
            }
        })
    ]);
});

// Export global
window.EntreprisesPage = EntreprisesPage;