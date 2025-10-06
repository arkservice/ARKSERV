// Modal Tâche
function TaskModal({ item, projects, statusOptions, priorityOptions, onSubmit, onClose }) {
    const { useState } = React;
    const [formData, setFormData] = useState({
        title: item?.title || '',
        description: item?.description || '',
        project_id: item?.project_id || '',
        status: item?.status || 'todo',
        priority: item?.priority || 'medium',
        due_date: item?.due_date ? item.due_date.split('T')[0] : ''
    });
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return;
        
        onSubmit({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            project_id: formData.project_id || null,
            status: formData.status,
            priority: formData.priority,
            due_date: formData.due_date || null
        });
    };
    
    return React.createElement('div', {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay"
    }, React.createElement('div', {
        className: "bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
    }, [
        React.createElement('div', {
            key: 'header',
            className: "px-6 py-4 border-b border-gray-200"
        }, React.createElement('h2', {
            className: "text-lg font-semibold text-gray-900"
        }, item ? "Modifier la tâche" : "Nouvelle tâche")),
        
        React.createElement('form', {
            key: 'form',
            onSubmit: handleSubmit,
            className: "px-6 py-4"
        }, [
            React.createElement('div', {
                key: 'fields',
                className: "space-y-4"
            }, [
                React.createElement('div', { key: 'title-field' }, [
                    React.createElement('label', {
                        key: 'title-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Titre de la tâche *"),
                    React.createElement('input', {
                        key: 'title-input',
                        type: "text",
                        value: formData.title,
                        onChange: (e) => setFormData({ ...formData, title: e.target.value }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                        required: true
                    })
                ]),
                
                React.createElement('div', { key: 'description-field' }, [
                    React.createElement('label', {
                        key: 'description-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Description"),
                    React.createElement('textarea', {
                        key: 'description-input',
                        value: formData.description,
                        onChange: (e) => setFormData({ ...formData, description: e.target.value }),
                        rows: 3,
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    })
                ]),
                
                React.createElement('div', { key: 'project-field' }, [
                    React.createElement('label', {
                        key: 'project-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Projet"),
                    React.createElement('select', {
                        key: 'project-select',
                        value: formData.project_id,
                        onChange: (e) => setFormData({ ...formData, project_id: e.target.value }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    }, [
                        React.createElement('option', { key: 'empty', value: "" }, "Sélectionner un projet"),
                        ...projects.map(project =>
                            React.createElement('option', {
                                key: project.id,
                                value: project.id
                            }, project.name)
                        )
                    ])
                ]),
                
                React.createElement('div', {
                    key: 'grid-fields',
                    className: "grid grid-cols-2 gap-4"
                }, [
                    React.createElement('div', { key: 'status-field' }, [
                        React.createElement('label', {
                            key: 'status-label',
                            className: "block text-sm font-medium text-gray-700 mb-1"
                        }, "Statut"),
                        React.createElement('select', {
                            key: 'status-select',
                            value: formData.status,
                            onChange: (e) => setFormData({ ...formData, status: e.target.value }),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        }, statusOptions.map(option =>
                            React.createElement('option', {
                                key: option.value,
                                value: option.value
                            }, option.label)
                        ))
                    ]),
                    
                    React.createElement('div', { key: 'priority-field' }, [
                        React.createElement('label', {
                            key: 'priority-label',
                            className: "block text-sm font-medium text-gray-700 mb-1"
                        }, "Priorité"),
                        React.createElement('select', {
                            key: 'priority-select',
                            value: formData.priority,
                            onChange: (e) => setFormData({ ...formData, priority: e.target.value }),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        }, priorityOptions.map(option =>
                            React.createElement('option', {
                                key: option.value,
                                value: option.value
                            }, option.label)
                        ))
                    ])
                ]),
                
                React.createElement('div', { key: 'date-field' }, [
                    React.createElement('label', {
                        key: 'date-label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Date d'échéance"),
                    React.createElement('input', {
                        key: 'date-input',
                        type: "date",
                        value: formData.due_date,
                        onChange: (e) => setFormData({ ...formData, due_date: e.target.value }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
window.TaskModal = TaskModal;