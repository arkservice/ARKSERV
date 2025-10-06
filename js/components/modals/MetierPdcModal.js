// Modal Métier PDC - Utilise SimpleFormModal
function MetierPdcModal({ item, onSubmit, onClose }) {
    // Configuration des champs
    const fields = [
        {
            key: 'nom',
            label: 'Nom du métier',
            type: 'text',
            required: true,
            minLength: 2,
            maxLength: 100,
            placeholder: 'Ex: Architecte, Ingénieur...'
        },
        {
            key: 'code_metier',
            label: 'Code métier',
            type: 'text',
            required: false,
            maxLength: 50,
            placeholder: 'Ex: ARCH, ING...'
        },
        {
            key: 'description',
            label: 'Description',
            type: 'textarea',
            required: false,
            rows: 3,
            placeholder: 'Description du métier...'
        }
    ];

    // Utiliser SimpleFormModal avec la configuration
    return React.createElement(window.SimpleFormModal, {
        item: item,
        onSubmit: onSubmit,
        onClose: onClose,
        entityName: 'métier',
        fields: fields
    });
}

// Export global
window.MetierPdcModal = MetierPdcModal;
