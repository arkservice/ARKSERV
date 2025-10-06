// Modal Entreprise
function EntrepriseModal({ item, onSubmit, onClose }) {
    const { useState } = React;
    const [formData, setFormData] = useState({
        nom: item?.nom || '',
        adresse: item?.adresse || '',
        telephone: item?.telephone || '',
        secteur_activite: item?.secteur_activite || ''
    });
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.nom.trim()) return;
        
        onSubmit({
            nom: formData.nom.trim(),
            adresse: formData.adresse.trim() || null,
            telephone: formData.telephone.trim() || null,
            secteur_activite: formData.secteur_activite.trim() || null
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
        }, item ? "Modifier l'entreprise" : "Nouvelle entreprise")),
        
        React.createElement('form', {
            key: 'form',
            onSubmit: handleSubmit,
            className: "px-6 py-4"
        }, [
            React.createElement('div', {
                key: 'fields',
                className: "space-y-4"
            }, [
                React.createElement('div', { key: 'nom-field' }, [
                    React.createElement('label', {
                        key: 'nom-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Nom de l'entreprise *"),
                    React.createElement('input', {
                        key: 'nom-input',
                        type: "text",
                        value: formData.nom,
                        onChange: (e) => setFormData({ ...formData, nom: e.target.value }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        required: true
                    })
                ]),
                
                React.createElement('div', { key: 'adresse-field' }, [
                    React.createElement('label', {
                        key: 'adresse-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Adresse"),
                    React.createElement('textarea', {
                        key: 'adresse-input',
                        value: formData.adresse,
                        onChange: (e) => setFormData({ ...formData, adresse: e.target.value }),
                        rows: 3,
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                ]),
                
                React.createElement('div', { key: 'secteur-field' }, [
                    React.createElement('label', {
                        key: 'secteur-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Secteur d'activité"),
                    React.createElement('input', {
                        key: 'secteur-input',
                        type: "text",
                        value: formData.secteur_activite,
                        onChange: (e) => setFormData({ ...formData, secteur_activite: e.target.value }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        placeholder: "Ex: Informatique, Santé, Commerce..."
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
window.EntrepriseModal = EntrepriseModal;