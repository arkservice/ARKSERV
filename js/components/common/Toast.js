console.log("🔥 [CHARGEMENT] Toast.js CHARGÉ!");

// Composant Toast individuel
function Toast({ id, type = 'info', title, message, duration = 5000, onClose, actions = [] }) {
    console.log("🍞 [Toast] Création toast:", { id, type, title, message });
    
    const { useState, useEffect } = React;
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    
    // Animation d'entrée
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);
    
    // Auto-dismiss
    useEffect(() => {
        if (duration && duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);
    
    // Régénérer les icônes Lucide après le rendu
    useEffect(() => {
        if (window.lucide) {
            setTimeout(() => window.lucide.createIcons(), 10);
        }
    }, []);
    
    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(() => {
            onClose && onClose(id);
        }, 300); // Attendre la fin de l'animation
    };
    
    // Configuration des styles par type
    const typeConfigs = {
        success: {
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            iconColor: 'text-green-600',
            titleColor: 'text-green-900',
            messageColor: 'text-green-800',
            icon: 'check-circle'
        },
        error: {
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            iconColor: 'text-red-600',
            titleColor: 'text-red-900',
            messageColor: 'text-red-800',
            icon: 'alert-circle'
        },
        warning: {
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            iconColor: 'text-orange-600',
            titleColor: 'text-orange-900',
            messageColor: 'text-orange-800',
            icon: 'alert-triangle'
        },
        info: {
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            iconColor: 'text-blue-600',
            titleColor: 'text-blue-900',
            messageColor: 'text-blue-800',
            icon: 'info'
        }
    };
    
    const config = typeConfigs[type] || typeConfigs.info;
    
    // Classes CSS pour l'animation
    const animationClasses = isLeaving 
        ? 'translate-x-full opacity-0' 
        : isVisible 
            ? 'translate-x-0 opacity-100' 
            : 'translate-x-full opacity-0';
    
    return React.createElement('div', {
        key: id,
        className: `transform transition-all duration-300 ease-in-out ${animationClasses} 
                   max-w-lg w-full max-h-32 ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg pointer-events-auto`,
        role: 'alert',
        'aria-live': 'polite'
    }, [
        React.createElement('div', {
            key: 'toast-content',
            className: 'p-4 overflow-y-auto'
        }, [
            React.createElement('div', {
                key: 'toast-header',
                className: 'flex items-start'
            }, [
                React.createElement('div', {
                    key: 'toast-icon',
                    className: 'flex-shrink-0'
                }, React.createElement('i', {
                    'data-lucide': config.icon,
                    className: `w-5 h-5 ${config.iconColor}`
                })),
                React.createElement('div', {
                    key: 'toast-text',
                    className: 'ml-3 w-0 flex-1'
                }, [
                    title && React.createElement('p', {
                        key: 'toast-title',
                        className: `text-sm font-medium ${config.titleColor}`
                    }, title),
                    message && React.createElement('p', {
                        key: 'toast-message',
                        className: `mt-1 text-sm ${config.messageColor}`
                    }, message),
                    // Actions optionnelles
                    actions.length > 0 && React.createElement('div', {
                        key: 'toast-actions',
                        className: 'mt-3 flex space-x-2'
                    }, actions.map((action, index) => 
                        React.createElement('button', {
                            key: `action-${index}`,
                            onClick: () => {
                                action.onClick && action.onClick();
                                handleClose();
                            },
                            className: `text-sm font-medium ${config.titleColor} hover:underline`
                        }, action.label)
                    ))
                ]),
                React.createElement('div', {
                    key: 'toast-close',
                    className: 'ml-4 flex-shrink-0 flex'
                }, React.createElement('button', {
                    onClick: handleClose,
                    className: `rounded-md inline-flex ${config.bgColor} ${config.iconColor} hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`,
                    'aria-label': 'Fermer'
                }, React.createElement('i', {
                    'data-lucide': 'x',
                    className: 'w-5 h-5'
                })))
            ])
        ])
    ]);
}

// Export global
window.Toast = Toast;