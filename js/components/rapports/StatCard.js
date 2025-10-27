// Composant StatCard pour afficher une carte de statistique
function StatCard({ title, value, unit = '', icon = 'bar-chart-3', trend = null, subtitle = '', color = 'blue' }) {
    // Couleurs selon le type
    const colorClasses = {
        blue: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            icon: 'text-blue-600',
            text: 'text-blue-900',
            value: 'text-blue-700'
        },
        green: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            icon: 'text-green-600',
            text: 'text-green-900',
            value: 'text-green-700'
        },
        purple: {
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            icon: 'text-purple-600',
            text: 'text-purple-900',
            value: 'text-purple-700'
        },
        orange: {
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            icon: 'text-orange-600',
            text: 'text-orange-900',
            value: 'text-orange-700'
        },
        yellow: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            icon: 'text-yellow-600',
            text: 'text-yellow-900',
            value: 'text-yellow-700'
        },
        gray: {
            bg: 'bg-gray-50',
            border: 'border-gray-200',
            icon: 'text-gray-600',
            text: 'text-gray-900',
            value: 'text-gray-700'
        }
    };

    const colors = colorClasses[color] || colorClasses.blue;

    // Formater la valeur
    const formattedValue = typeof value === 'number'
        ? (value % 1 === 0 ? value.toFixed(0) : value.toFixed(1))
        : value;

    return React.createElement('div', {
        className: `rounded-lg border p-6 ${colors.bg} ${colors.border}`
    }, [
        // En-tête avec icône et titre
        React.createElement('div', {
            key: 'header',
            className: 'flex items-start justify-between mb-3'
        }, [
            React.createElement('div', {
                key: 'title-section',
                className: 'flex-1'
            }, [
                React.createElement('h3', {
                    key: 'title',
                    className: `text-sm font-medium ${colors.text} mb-1`
                }, title),
                subtitle && React.createElement('p', {
                    key: 'subtitle',
                    className: `text-xs ${colors.text} opacity-75`
                }, subtitle)
            ]),
            React.createElement('div', {
                key: 'icon',
                className: `p-2 rounded-lg ${colors.bg} border ${colors.border}`
            }, React.createElement('i', {
                'data-lucide': icon,
                className: `w-5 h-5 ${colors.icon}`
            }))
        ]),

        // Valeur principale
        React.createElement('div', {
            key: 'value',
            className: 'mb-2'
        }, [
            React.createElement('span', {
                key: 'number',
                className: `text-3xl font-bold ${colors.value}`
            }, formattedValue),
            unit && React.createElement('span', {
                key: 'unit',
                className: `text-lg font-medium ${colors.text} opacity-75 ml-1`
            }, unit)
        ]),

        // Tendance (optionnelle)
        trend !== null && React.createElement('div', {
            key: 'trend',
            className: 'flex items-center gap-1'
        }, [
            React.createElement('i', {
                key: 'trend-icon',
                'data-lucide': trend > 0 ? 'trending-up' : trend < 0 ? 'trending-down' : 'minus',
                className: `w-4 h-4 ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`
            }),
            React.createElement('span', {
                key: 'trend-text',
                className: `text-sm font-medium ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`
            }, `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`),
            React.createElement('span', {
                key: 'trend-label',
                className: `text-xs ${colors.text} opacity-75 ml-1`
            }, 'vs période précédente')
        ])
    ]);
}

// Export global
window.StatCard = StatCard;
