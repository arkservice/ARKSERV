// Modal Contact
function ContactModal({ item, entrepriseId, onSubmit, onClose }) {
    const { useState } = React;
    const [formData, setFormData] = useState({
        prenom: item?.prenom || '',
        nom: item?.nom || '',
        email: item?.email || '',
        telephone: item?.telephone || '',
        entreprise_id: item?.entreprise_id || entrepriseId || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.prenom.trim() || !formData.nom.trim()) {
            alert('Le prénom et le nom sont obligatoires');
            return;
        }

        if (!formData.entreprise_id) {
            alert('L\'entreprise est obligatoire');
            return;
        }

        onSubmit({
            prenom: formData.prenom.trim(),
            nom: formData.nom.trim(),
            email: formData.email.trim() || null,
            telephone: formData.telephone.trim() || null,
            entreprise_id: formData.entreprise_id,
            role: 'user'  // Rôle par défaut pour les contacts
        });
    };

    return React.createElement('div', {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay"
    }, React.createElement('div', {
        className: "bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
    }, [
        React.createElement('div', {
            key: 'header',
            className: "px-6 py-4 border-b border-gray-200"
        }, React.createElement('h2', {
            className: "text-lg font-semibold text-gray-900"
        }, item ? "Modifier le contact" : "Nouveau contact")),

        React.createElement('form', {
            key: 'form',
            onSubmit: handleSubmit,
            className: "px-6 py-4"
        }, [
            React.createElement('div', {
                key: 'fields',
                className: "space-y-4"
            }, [
                React.createElement('div', { key: 'prenom-field' }, [
                    React.createElement('label', {
                        key: 'prenom-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Prénom *"),
                    React.createElement('input', {
                        key: 'prenom-input',
                        type: "text",
                        value: formData.prenom,
                        onChange: (e) => setFormData({ ...formData, prenom: e.target.value }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        required: true,
                        placeholder: "Ex: Jean"
                    })
                ]),

                React.createElement('div', { key: 'nom-field' }, [
                    React.createElement('label', {
                        key: 'nom-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Nom *"),
                    React.createElement('input', {
                        key: 'nom-input',
                        type: "text",
                        value: formData.nom,
                        onChange: (e) => setFormData({ ...formData, nom: e.target.value }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        required: true,
                        placeholder: "Ex: Dupont"
                    })
                ]),

                React.createElement('div', { key: 'email-field' }, [
                    React.createElement('label', {
                        key: 'email-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Email"),
                    React.createElement('input', {
                        key: 'email-input',
                        type: "email",
                        value: formData.email,
                        onChange: (e) => setFormData({ ...formData, email: e.target.value }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        placeholder: "Ex: jean.dupont@example.com"
                    })
                ]),

                React.createElement('div', { key: 'telephone-field' }, [
                    React.createElement('label', {
                        key: 'telephone-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Téléphone"),
                    React.createElement('input', {
                        key: 'telephone-input',
                        type: "tel",
                        value: formData.telephone,
                        onChange: (e) => setFormData({ ...formData, telephone: e.target.value }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        placeholder: "Ex: 01 23 45 67 89"
                    })
                ])
            ]),

            React.createElement('div', {
                key: 'buttons',
                className: "flex justify-end gap-3 mt-6"
            }, [
                React.createElement('button', {
                    key: 'cancel',
                    type: "button",
                    onClick: onClose,
                    className: "px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                }, "Annuler"),
                React.createElement('button', {
                    key: 'submit',
                    type: "submit",
                    className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                }, item ? "Modifier" : "Créer")
            ])
        ])
    ]));
}

// Export global
window.ContactModal = ContactModal;
