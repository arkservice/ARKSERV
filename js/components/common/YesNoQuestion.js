/**
 * Composant de question Oui/Non pour les formulaires d'évaluation
 * Utilisé principalement dans l'évaluation à froid
 */

const YesNoQuestion = ({ question, value, onChange, required = false }) => {
    return React.createElement('div', {
        className: "space-y-3"
    }, [
        // Label de la question
        React.createElement('label', {
            key: 'label',
            className: "block text-sm font-medium text-gray-700"
        }, [
            question,
            required && React.createElement('span', {
                key: 'asterisk',
                className: "text-red-600 ml-1"
            }, '*')
        ]),

        // Boutons Oui/Non
        React.createElement('div', {
            key: 'buttons',
            className: "flex gap-4"
        }, [
            // Bouton Oui
            React.createElement('button', {
                key: 'yes',
                type: 'button',
                onClick: () => onChange(true),
                className: `
                    px-6 py-2 rounded-md font-medium transition-all
                    ${value === true
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                `
            }, 'Oui'),

            // Bouton Non
            React.createElement('button', {
                key: 'no',
                type: 'button',
                onClick: () => onChange(false),
                className: `
                    px-6 py-2 rounded-md font-medium transition-all
                    ${value === false
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                `
            }, 'Non')
        ])
    ]);
};

// Export du composant pour utilisation globale
if (typeof window !== 'undefined') {
    window.YesNoQuestion = YesNoQuestion;
}
