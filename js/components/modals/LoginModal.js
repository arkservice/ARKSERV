// Modal de connexion
function LoginModal({ onClose, onSuccess }) {
    const { useState } = React;
    const auth = window.useAuth();
    
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState(null);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.email.trim() || !formData.password.trim()) {
            setLocalError('Veuillez remplir tous les champs');
            return;
        }
        
        setIsSubmitting(true);
        setLocalError(null);
        
        try {
            const result = await auth.signIn(formData.email, formData.password);
            
            if (result.success) {
                if (onSuccess) onSuccess();
                if (onClose) onClose();
            } else {
                setLocalError(result.error || 'Erreur de connexion');
            }
        } catch (error) {
            setLocalError('Erreur de connexion');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (localError) setLocalError(null);
    };
    
    const errorMessage = localError || auth.error;
    
    return React.createElement('div', {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay"
    }, React.createElement('div', {
        className: "bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
    }, [
        React.createElement('div', {
            key: 'header',
            className: "px-6 py-4 border-b border-gray-200"
        }, [
            React.createElement('h2', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900"
            }, "Connexion"),
            React.createElement('p', {
                key: 'subtitle',
                className: "text-sm text-gray-600 mt-1"
            }, "Connectez-vous à votre compte Formation Manager")
        ]),
        
        React.createElement('form', {
            key: 'form',
            onSubmit: handleSubmit,
            className: "px-6 py-4"
        }, [
            React.createElement('div', {
                key: 'fields',
                className: "space-y-4"
            }, [
                React.createElement('div', { key: 'email-field' }, [
                    React.createElement('label', {
                        key: 'email-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Adresse email *"),
                    React.createElement('input', {
                        key: 'email-input',
                        type: "email",
                        value: formData.email,
                        onChange: (e) => handleChange('email', e.target.value),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        required: true,
                        disabled: isSubmitting,
                        placeholder: "votre.email@exemple.com"
                    })
                ]),
                
                React.createElement('div', { key: 'password-field' }, [
                    React.createElement('label', {
                        key: 'password-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Mot de passe *"),
                    React.createElement('input', {
                        key: 'password-input',
                        type: "password",
                        value: formData.password,
                        onChange: (e) => handleChange('password', e.target.value),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        required: true,
                        disabled: isSubmitting,
                        placeholder: "Votre mot de passe"
                    })
                ]),
                
                errorMessage && React.createElement('div', {
                    key: 'error',
                    className: "bg-red-50 border border-red-200 rounded-lg p-3"
                }, React.createElement('p', {
                    className: "text-red-800 text-sm"
                }, errorMessage))
            ]),
            
            React.createElement('div', {
                key: 'buttons',
                className: "flex justify-end gap-3 mt-6"
            }, [
                React.createElement('button', {
                    key: 'cancel',
                    type: "button",
                    onClick: onClose,
                    disabled: isSubmitting,
                    className: "px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                }, "Annuler"),
                React.createElement('button', {
                    key: 'submit',
                    type: "submit",
                    disabled: isSubmitting,
                    className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                }, [
                    isSubmitting && React.createElement('div', {
                        key: 'spinner',
                        className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                    }),
                    isSubmitting ? "Connexion..." : "Se connecter"
                ])
            ])
        ])
    ]));
}

// Export global
window.LoginModal = LoginModal;