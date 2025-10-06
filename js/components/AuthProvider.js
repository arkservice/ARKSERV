// Composant AuthProvider pour gérer l'état d'authentification global
function AuthProvider({ children }) {
    const { useState } = React;
    const auth = window.useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    
    // Si l'authentification est en cours de chargement, afficher un spinner
    if (auth.loading) {
        return React.createElement('div', {
            className: "flex items-center justify-center min-h-screen bg-gray-50"
        }, React.createElement('div', {
            className: "text-center"
        }, [
            React.createElement('div', {
                key: 'spinner',
                className: "w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            }),
            React.createElement('p', {
                key: 'text',
                className: "text-gray-600"
            }, "Vérification de la session...")
        ]));
    }
    
    // Si l'utilisateur n'est pas connecté, afficher le modal de connexion
    if (!auth.isAuthenticated) {
        return React.createElement('div', {
            className: "flex items-center justify-center min-h-screen bg-gray-50"
        }, [
            React.createElement('div', {
                key: 'login-card',
                className: "bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4"
            }, [
                React.createElement('div', {
                    key: 'header',
                    className: "text-center mb-8"
                }, [
                    React.createElement('h1', {
                        key: 'title',
                        className: "text-2xl font-bold text-gray-900 mb-2"
                    }, "Formation Manager"),
                    React.createElement('p', {
                        key: 'subtitle',
                        className: "text-gray-600"
                    }, "Connectez-vous pour accéder à l'application")
                ]),
                React.createElement('button', {
                    key: 'login-btn',
                    onClick: () => setShowLoginModal(true),
                    className: "w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                }, "Se connecter")
            ]),
            
            showLoginModal && React.createElement(window.LoginModal, {
                key: 'login-modal',
                onClose: () => setShowLoginModal(false),
                onSuccess: () => setShowLoginModal(false)
            })
        ]);
    }
    
    // Si l'utilisateur est connecté, afficher le contenu de l'application
    return React.createElement('div', {}, [
        children,
        
        // Modal de connexion si demandé explicitement
        showLoginModal && React.createElement(window.LoginModal, {
            key: 'login-modal',
            onClose: () => setShowLoginModal(false),
            onSuccess: () => setShowLoginModal(false)
        })
    ]);
}

// Export global
window.AuthProvider = AuthProvider;