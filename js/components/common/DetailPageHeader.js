// Composant réutilisable pour l'en-tête des pages de détail
// Inclut le bouton retour avec icône SVG et la hiérarchie avec chevron SVG
function DetailPageHeader({ onBack, breadcrumbBase, breadcrumbCurrent }) {
    
    return React.createElement('div', {
        className: "flex items-center gap-4 mb-4"
    }, [
        // Bouton retour avec icône
        React.createElement('button', {
            key: 'back',
            onClick: onBack,
            className: "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        }, [
            React.createElement('svg', {
                key: 'icon',
                className: "w-4 h-4 text-gray-700",
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: '2',
                viewBox: '0 0 24 24'
            }, React.createElement('path', {
                d: 'M19 12H5M12 19l-7-7 7-7'
            })),
            "Retour"
        ]),
        
        // Hiérarchie avec chevron
        React.createElement('div', {
            key: 'breadcrumb',
            className: "flex items-center gap-2 text-sm text-gray-500"
        }, [
            React.createElement('span', { 
                key: 'base' 
            }, breadcrumbBase),
            React.createElement('svg', {
                key: 'separator',
                className: "w-4 h-4 text-gray-500",
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: '2',
                viewBox: '0 0 24 24'
            }, React.createElement('path', {
                d: 'M9 18l6-6-6-6'
            })),
            React.createElement('span', { 
                key: 'current' 
            }, breadcrumbCurrent)
        ])
    ]);
}

// Export global
window.DetailPageHeader = DetailPageHeader;