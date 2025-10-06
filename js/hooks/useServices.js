// Hook personnalisé pour les services - Utilise useSimpleCRUD
function useServices() {
    const crudHook = window.useSimpleCRUD({
        tableName: 'service',
        dataKey: 'services',
        entityName: 'service',
        orderBy: 'nom',
        foreignKeyErrorMessage: 'Ce service ne peut pas être supprimé car il est utilisé par des utilisateurs'
    });

    // Renommer les fonctions génériques pour correspondre à l'API attendue
    return {
        services: crudHook.services,
        loading: crudHook.loading,
        error: crudHook.error,
        createService: crudHook.createItem,
        updateService: crudHook.updateItem,
        deleteService: crudHook.deleteItem,
        refetch: crudHook.refetch
    };
}

// Export global
window.useServices = useServices;