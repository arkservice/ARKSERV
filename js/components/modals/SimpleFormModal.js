// Modal générique pour formulaires simples
// Factorisation de ServiceModal, MetierPdcModal, TypePdcModal, etc.
function SimpleFormModal(config) {
    const { useState } = React;

    // Configuration
    const {
        item,           // Item à éditer (null si création)
        onSubmit,       // Fonction de soumission
        onClose,        // Fonction de fermeture
        title,          // Titre du modal (optionnel, généré automatiquement si non fourni)
        entityName,     // Nom de l'entité (ex: "service", "métier") pour titre auto
        fields          // Configuration des champs (requis)
    } = config;

    // Initialiser formData avec les valeurs de l'item ou les valeurs par défaut
    const initialFormData = {};
    fields.forEach(field => {
        initialFormData[field.key] = item?.[field.key] || field.defaultValue || '';
    });

    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});

    // Générer le titre automatiquement si non fourni
    const modalTitle = title || (item
        ? `Modifier ${entityName || 'l\'élément'}`
        : `Nouveau ${entityName || 'élément'}`);

    // Validation du formulaire
    const validateForm = () => {
        const newErrors = {};

        fields.forEach(field => {
            const value = formData[field.key];
            const trimmedValue = typeof value === 'string' ? value.trim() : value;

            // Champ requis
            if (field.required && !trimmedValue) {
                newErrors[field.key] = `${field.label} est requis`;
                return;
            }

            // Si le champ n'est pas rempli et n'est pas requis, pas de validation
            if (!trimmedValue && !field.required) {
                return;
            }

            // Longueur minimale
            if (field.minLength && trimmedValue.length < field.minLength) {
                newErrors[field.key] = `${field.label} doit contenir au moins ${field.minLength} caractères`;
                return;
            }

            // Longueur maximale
            if (field.maxLength && trimmedValue.length > field.maxLength) {
                newErrors[field.key] = `${field.label} ne peut pas dépasser ${field.maxLength} caractères`;
                return;
            }

            // Pattern de validation (regex)
            if (field.pattern && !field.pattern.test(trimmedValue)) {
                newErrors[field.key] = field.patternMessage || `${field.label} n'est pas valide`;
                return;
            }

            // Validation personnalisée
            if (field.validate) {
                const validationError = field.validate(trimmedValue, formData);
                if (validationError) {
                    newErrors[field.key] = validationError;
                    return;
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Gestion de la soumission
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Préparer les données à soumettre (trim les strings)
        const submitData = {};
        fields.forEach(field => {
            const value = formData[field.key];
            submitData[field.key] = typeof value === 'string' ? value.trim() || null : value;
        });

        onSubmit(submitData);
    };

    // Gestion du changement de valeur
    const handleChange = (fieldKey, value) => {
        setFormData({ ...formData, [fieldKey]: value });
        // Effacer l'erreur si l'utilisateur commence à taper
        if (errors[fieldKey]) {
            setErrors({ ...errors, [fieldKey]: null });
        }
    };

    // Générer un champ de formulaire
    const renderField = (field) => {
        const fieldValue = formData[field.key] || '';
        const fieldError = errors[field.key];
        const fieldClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            fieldError
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
        }`;

        let inputElement;

        switch (field.type) {
            case 'textarea':
                inputElement = React.createElement('textarea', {
                    key: `${field.key}-input`,
                    value: fieldValue,
                    onChange: (e) => handleChange(field.key, e.target.value),
                    rows: field.rows || 3,
                    className: fieldClasses,
                    placeholder: field.placeholder || '',
                    maxLength: field.maxLength
                });
                break;

            case 'select':
                inputElement = React.createElement('select', {
                    key: `${field.key}-input`,
                    value: fieldValue,
                    onChange: (e) => handleChange(field.key, e.target.value),
                    className: fieldClasses
                }, [
                    // Option vide par défaut
                    React.createElement('option', { key: 'empty', value: '' }, field.placeholder || 'Sélectionnez...'),
                    // Options du champ
                    ...(field.options || []).map(option =>
                        React.createElement('option', {
                            key: option.value,
                            value: option.value
                        }, option.label)
                    )
                ]);
                break;

            case 'number':
                inputElement = React.createElement('input', {
                    key: `${field.key}-input`,
                    type: 'number',
                    value: fieldValue,
                    onChange: (e) => handleChange(field.key, e.target.value),
                    min: field.min,
                    max: field.max,
                    step: field.step || 1,
                    className: fieldClasses,
                    placeholder: field.placeholder || ''
                });
                break;

            case 'checkbox':
                inputElement = React.createElement('input', {
                    key: `${field.key}-input`,
                    type: 'checkbox',
                    checked: !!fieldValue,
                    onChange: (e) => handleChange(field.key, e.target.checked),
                    className: "w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                });
                break;

            default: // 'text' ou autre
                inputElement = React.createElement('input', {
                    key: `${field.key}-input`,
                    type: field.type || 'text',
                    value: fieldValue,
                    onChange: (e) => handleChange(field.key, e.target.value),
                    className: fieldClasses,
                    placeholder: field.placeholder || '',
                    maxLength: field.maxLength
                });
                break;
        }

        // Structure du champ complet
        return React.createElement('div', {
            key: field.key,
            className: field.type === 'checkbox' ? 'flex items-center gap-2' : ''
        }, [
            React.createElement('label', {
                key: `${field.key}-label`,
                className: field.type === 'checkbox'
                    ? 'text-sm font-medium text-gray-700'
                    : 'block text-sm font-medium text-gray-700 mb-1'
            }, `${field.label}${field.required ? ' *' : ''}`),
            inputElement,
            fieldError && React.createElement('p', {
                key: `${field.key}-error`,
                className: 'mt-1 text-sm text-red-600'
            }, fieldError)
        ]);
    };

    // Render
    return React.createElement('div', {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay"
    }, React.createElement('div', {
        className: "bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
    }, [
        // Header
        React.createElement('div', {
            key: 'header',
            className: "px-6 py-4 border-b border-gray-200 sticky top-0 bg-white"
        }, React.createElement('h2', {
            className: "text-lg font-semibold text-gray-900"
        }, modalTitle)),

        // Form
        React.createElement('form', {
            key: 'form',
            onSubmit: handleSubmit,
            className: "px-6 py-4"
        }, [
            // Fields
            React.createElement('div', {
                key: 'fields',
                className: "space-y-4"
            }, fields.map(field => renderField(field))),

            // Buttons
            React.createElement('div', {
                key: 'buttons',
                className: "flex justify-end gap-3 mt-6"
            }, [
                React.createElement('button', {
                    key: 'cancel',
                    type: 'button',
                    onClick: onClose,
                    className: "px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                }, 'Annuler'),
                React.createElement('button', {
                    key: 'submit',
                    type: 'submit',
                    className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                }, item ? 'Modifier' : 'Créer')
            ])
        ])
    ]));
}

// Export global
window.SimpleFormModal = SimpleFormModal;
