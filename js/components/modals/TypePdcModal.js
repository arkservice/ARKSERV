// Modal Type PDC - Utilise SimpleFormModal
function TypePdcModal({ item, onSubmit, onClose }) {
    // Configuration des champs
    const fields = [
        {
            key: 'nom',
            label: 'Nom du type',
            type: 'text',
            required: true,
            minLength: 2,
            maxLength: 100,
            placeholder: 'Ex: Initiation, Perfectionnement...'
        },
        {
            key: 'code_type',
            label: 'Code type',
            type: 'text',
            required: false,
            maxLength: 50,
            placeholder: 'Ex: INIT, PERF...'
        },
        {
            key: 'description',
            label: 'Description',
            type: 'textarea',
            required: false,
            rows: 3,
            placeholder: 'Description du type...'
        }
    ];

    // Utiliser SimpleFormModal avec la configuration
    return React.createElement(window.SimpleFormModal, {
        item: item,
        onSubmit: onSubmit,
        onClose: onClose,
        entityName: 'type PDC',
        fields: fields
    });
}

// Export global
window.TypePdcModal = TypePdcModal;
