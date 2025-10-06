// Composant réutilisable pour afficher les informations d'une entreprise cliente
// Section collapsible avec chevron et titre personnalisé
function CollapsibleEntrepriseSection({ entreprise }) {
    const { useState } = React;
    
    // État pour gérer l'ouverture/fermeture (fermé par défaut)
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Fonction pour basculer l'état
    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };
    
    // Si pas d'entreprise, ne rien afficher
    if (!entreprise) {
        return null;
    }
    
    return React.createElement('div', {
        className: "bg-white rounded-lg border border-gray-200 p-6"
    }, [
        // En-tête avec titre et chevron
        React.createElement('div', {
            key: 'header',
            className: "flex items-center cursor-pointer",
            onClick: toggleExpanded
        }, [
            // Chevron simple avec SVG inline
            React.createElement('svg', {
                key: 'chevron',
                className: `w-5 h-5 text-gray-600 mr-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`,
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: '2',
                viewBox: '0 0 24 24',
                xmlns: 'http://www.w3.org/2000/svg'
            }, React.createElement('polyline', {
                points: '9 18 15 12 9 6'
            })),
            // Titre avec nom de l'entreprise
            React.createElement('h2', {
                key: 'title',
                className: "text-lg font-medium text-gray-900"
            }, [
                "Entreprise : ",
                React.createElement('span', {
                    key: 'nom',
                    className: "font-bold",
                    style: { fontSize: '1.15em' } // +2px approximatif
                }, entreprise.nom)
            ])
        ]),
        
        // Contenu détaillé (affiché seulement si expanded)
        isExpanded && React.createElement('div', {
            key: 'content',
            className: "mt-4 animate-in slide-in-from-top-1 duration-200"
        }, [
            // Badge du type d'entreprise
            React.createElement('div', {
                key: 'badge-container',
                className: "flex justify-end mb-4"
            }, [
                React.createElement('span', {
                    key: 'type-badge',
                    className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entreprise.type_entreprise === 'client' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                    }`
                }, entreprise.type_entreprise || 'Non défini')
            ]),
            
            // Grille des informations
            React.createElement('div', {
                key: 'details-grid',
                className: "grid grid-cols-1 md:grid-cols-4 gap-4"
            }, [
                // Secteur d'activité
                React.createElement('div', { key: 'secteur' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Secteur"),
                    React.createElement('p', {
                        key: 'value',
                        className: "text-sm text-gray-900"
                    }, entreprise.secteur_activite || '-')
                ]),
                
                // Téléphone
                React.createElement('div', { key: 'telephone' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Téléphone"),
                    React.createElement('p', {
                        key: 'value',
                        className: "text-sm text-gray-900"
                    }, entreprise.telephone || '-')
                ]),
                
                // Email
                React.createElement('div', { key: 'email' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Email"),
                    React.createElement('p', {
                        key: 'value',
                        className: "text-sm text-gray-900"
                    }, entreprise.email || '-')
                ]),
                
                // Colonne libre pour futurs ajouts
                React.createElement('div', { key: 'placeholder' }, []),
                
                // Adresse (sur toute la largeur)
                React.createElement('div', { 
                    key: 'adresse',
                    className: "md:col-span-4"
                }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Adresse"),
                    React.createElement('p', {
                        key: 'value',
                        className: "text-sm text-gray-900"
                    }, entreprise.adresse || '-')
                ])
            ])
        ])
    ]);
}

// Exporter le composant
window.CollapsibleEntrepriseSection = CollapsibleEntrepriseSection;