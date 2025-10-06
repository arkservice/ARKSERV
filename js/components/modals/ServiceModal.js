// Modal Service - Utilise SimpleFormModal
function ServiceModal({ item, onSubmit, onClose }) {
    // Configuration des champs
    const fields = [
        {
            key: 'nom',
            label: 'Nom du service',
            type: 'text',
            required: true,
            minLength: 2,
            maxLength: 50,
            placeholder: 'Ex: Développement, Marketing, Support...',
            pattern: /^[a-zA-ZÀ-ÿ0-9\s\-_]+$/,
            patternMessage: 'Le nom ne peut contenir que des lettres, chiffres, espaces, tirets et underscores'
        }
    ];

    // Utiliser SimpleFormModal avec la configuration
    return React.createElement(window.SimpleFormModal, {
        item: item,
        onSubmit: onSubmit,
        onClose: onClose,
        entityName: 'service',
        fields: fields
    });
}

// Export global
window.ServiceModal = ServiceModal;