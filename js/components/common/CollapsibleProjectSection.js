// Composant réutilisable pour afficher les détails d'un projet
// Section collapsible avec chevron et titre personnalisé
function CollapsibleProjectSection({ 
    projet, 
    taches, 
    stagiaires,
    sessions,
    availableLogiciels,
    availableUsers,
    availablePdcs,
    onSaveProject,
    onRefresh,
    hideEditButton = false
}) {
    const { useState, useEffect, useMemo, useCallback } = React;
    const { getSessionsSummary, formatDateRange } = window.useProjectSessions();
    
    // État pour gérer l'ouverture/fermeture (fermé par défaut)
    const [isExpanded, setIsExpanded] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);
    
    // Fonction pour basculer l'état
    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };
    
    // Si pas de projet, ne rien afficher
    if (!projet) {
        return null;
    }
    
    // Logique pour déterminer si un PDC est défini (pour le logiciel)
    const isPdcDefined = useMemo(() => {
        return !!(projet.pdc_id && projet.pdc);
    }, [projet.pdc_id, projet.pdc]);
    
    // Logique pour déterminer l'état de la planification (pour lieu, dates, stagiaires)
    const isPlanificationComplete = useMemo(() => {
        const planificationTask = taches.find(t => t.title === 'Planification');
        return planificationTask && planificationTask.status === 'completed';
    }, [taches]);
    
    // Logique pour l'affichage du logiciel (provisoire ou non)
    const displayedLogiciel = useMemo(() => {
        if (!projet.logiciel) return { logiciel: null, isProvisional: false };
        return {
            logiciel: projet.logiciel,
            isProvisional: !isPdcDefined
        };
    }, [projet.logiciel, isPdcDefined]);
    
    // Fonction utilitaire pour afficher les valeurs avec style orange si vide
    const renderValue = useCallback((value, className = "text-sm text-gray-900") => {
        if (!value || value === '-') {
            return React.createElement('span', {
                className: "text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded font-medium"
            }, "Non renseigné");
        }
        return React.createElement('span', {
            className
        }, value);
    }, []);
    
    // Fonction pour afficher les valeurs provisoires
    const renderProvisionalValue = useCallback((value, isComplete) => {
        if (isComplete) {
            return renderValue(value);
        }
        
        if (!value) {
            return React.createElement('span', {
                className: "text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded font-medium"
            }, "Non renseigné");
        }
        
        return React.createElement('span', {
            className: "text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded font-medium"
        }, `provisoire - ${value}`);
    }, [renderValue]);
    
    // Fonction pour afficher les lieux de formation basés sur les sessions
    const renderLieuxFormation = useCallback(() => {
        if (!sessions || sessions.length === 0) {
            return renderProvisionalValue(projet.lieu_projet, isPlanificationComplete);
        }
        
        if (isPlanificationComplete) {
            const lieux = [...new Set(sessions.map(s => s.lieu).filter(Boolean))];
            if (lieux.length === 0) {
                return renderValue("Non renseigné");
            } else if (lieux.length === 1) {
                return renderValue(lieux[0]);
            } else {
                return React.createElement('div', {
                    className: "space-y-1"
                }, sessions.map((session, index) => 
                    React.createElement('div', {
                        key: index,
                        className: "text-sm text-gray-700"
                    }, `Session ${session.sessionNumber || index + 1}: ${session.lieu}`)
                ));
            }
        } else {
            return renderProvisionalValue(projet.lieu_projet, isPlanificationComplete);
        }
    }, [sessions, projet.lieu_projet, isPlanificationComplete, renderValue, renderProvisionalValue]);
    
    // Fonction pour afficher les dates de formation basées sur les sessions
    const renderDatesFormation = useCallback(() => {
        if (!sessions || sessions.length === 0) {
            return renderProvisionalValue(projet.periode_souhaitee, isPlanificationComplete);
        }
        
        if (isPlanificationComplete) {
            if (sessions.length === 1) {
                const session = sessions[0];
                const dateRange = formatDateRange(session.dateDebut, session.dateFin);
                return renderValue(dateRange);
            } else {
                return React.createElement('div', {
                    className: "space-y-1"
                }, sessions.map((session, index) => 
                    React.createElement('div', {
                        key: index,
                        className: "text-sm text-gray-700"
                    }, `Session ${session.sessionNumber || index + 1}: ${formatDateRange(session.dateDebut, session.dateFin)}`)
                ));
            }
        } else {
            return renderProvisionalValue(projet.periode_souhaitee, isPlanificationComplete);
        }
    }, [sessions, projet.periode_souhaitee, isPlanificationComplete, formatDateRange, renderValue, renderProvisionalValue]);
    
    // Fonction pour afficher les stagiaires basés sur les sessions
    const renderStagiairesFormation = useCallback(() => {
        if (!sessions || sessions.length === 0) {
            return stagiaires; // Utilise les stagiaires du projet
        }
        
        if (isPlanificationComplete) {
            // Récupérer tous les stagiaires uniques des sessions
            const allStagiaires = [...new Set(sessions.flatMap(s => s.stagiaires))];
            return allStagiaires.map((nom, index) => ({
                id: `session-${index}`,
                prenom: nom.split(' ')[0] || nom,
                nom: nom.split(' ').slice(1).join(' ') || '',
                avatar: null
            }));
        } else {
            return stagiaires; // Utilise les stagiaires du projet
        }
    }, [sessions, stagiaires, isPlanificationComplete]);
    
    // Fonction pour formater l'affichage du PDC
    const formatPdcDisplay = (pdc) => {
        if (!pdc) {
            return React.createElement('span', {
                className: "text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded font-medium"
            }, "Non renseigné");
        }
        
        const number = pdc.pdc_number || pdc.ref;
        const duration = pdc.duree_en_jour;
        const pdfUrl = pdc.pdf_file_url;
        
        let displayText = number;
        if (duration) {
            displayText += ` - ${duration} jours`;
        }
        
        return React.createElement('div', {
            className: "flex items-center gap-2"
        }, [
            React.createElement('span', {
                key: 'text',
                className: "text-sm text-gray-900 font-medium"
            }, displayText),
            pdfUrl && React.createElement('a', {
                key: 'pdf',
                href: pdfUrl,
                target: '_blank',
                rel: 'noopener noreferrer',
                className: "text-red-600 hover:text-red-800 transition-colors",
                title: "Voir le PDF du PDC"
            }, "📄")
        ]);
    };
    
    // Fonctions utilitaires pour les utilisateurs
    const getCommerciauxArkance = () => {
        return availableUsers.filter(user => user.role === 'commercial' && user.entreprise_id === 1) || [];
    };
    
    const getUtilisateursEntreprise = (entrepriseId) => {
        return availableUsers.filter(user => user.entreprise_id === entrepriseId) || [];
    };
    
    const getStagiairesDisponibles = (entrepriseId, currentStagiaires = []) => {
        const currentIds = currentStagiaires.map(s => s.id || s);
        return availableUsers.filter(user => 
            user.entreprise_id === entrepriseId && 
            user.role === 'stagiaire' && 
            !currentIds.includes(user.id)
        ) || [];
    };
    
    const getStagiairesPourAffichage = () => {
        return editMode ? (editData.stagiaires || []) : renderStagiairesFormation();
    };
    
    // Fonctions de gestion de l'édition
    const handleEditStart = () => {
        setEditData({
            commercial_id: projet.commercial_id,
            contact_id: projet.contact_id,
            logiciel_id: projet.logiciel_id,
            pdc_id: projet.pdc_id,
            lieu_projet: projet.lieu_projet,
            periode_souhaitee: projet.periode_souhaitee,
            stagiaires: [...stagiaires]
        });
        setEditMode(true);
    };
    
    const handleEditCancel = () => {
        setEditMode(false);
        setEditData({});
    };
    
    const handleEditSave = async () => {
        if (!onSaveProject) return;
        
        setSaving(true);
        try {
            await onSaveProject(editData);
            setEditMode(false);
            setEditData({});
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        } finally {
            setSaving(false);
        }
    };
    
    const ajouterStagiaire = (userId) => {
        const user = availableUsers.find(u => u.id === userId);
        if (user) {
            setEditData({
                ...editData,
                stagiaires: [...(editData.stagiaires || []), user]
            });
        }
    };
    
    const retirerStagiaire = (userId) => {
        setEditData({
            ...editData,
            stagiaires: (editData.stagiaires || []).filter(s => s.id !== userId)
        });
    };
    
    return React.createElement('div', {
        className: "bg-white rounded-lg border border-gray-200 p-6"
    }, [
        // En-tête avec titre et chevron
        React.createElement('div', {
            key: 'header',
            className: "flex items-center cursor-pointer",
            onClick: toggleExpanded
        }, [
            // Chevron simple avec SVG inline (mêmes icônes que CollapsibleEntrepriseSection)
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
            // Titre avec nom du projet
            React.createElement('h2', {
                key: 'title',
                className: "text-lg font-medium text-gray-900"
            }, [
                "Projet : ",
                React.createElement('span', {
                    key: 'nom',
                    className: "font-bold",
                    style: { fontSize: '1.15em' }
                }, projet.name)
            ])
        ]),
        
        // Contenu détaillé (affiché seulement si expanded)
        isExpanded && React.createElement('div', {
            key: 'content',
            className: "mt-4 animate-in slide-in-from-top-1 duration-200"
        }, [
            // Actions d'édition (seulement si fonction de sauvegarde disponible et bouton non masqué)
            onSaveProject && !hideEditButton && React.createElement('div', {
                key: 'actions',
                className: "flex items-center justify-end gap-2 mb-4"
            }, editMode ? [
                React.createElement('button', {
                    key: 'cancel',
                    onClick: handleEditCancel,
                    disabled: saving,
                    className: "px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                }, "Annuler"),
                React.createElement('button', {
                    key: 'save',
                    onClick: handleEditSave,
                    disabled: saving,
                    className: "inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                }, [
                    saving && React.createElement('i', {
                        key: 'spinner',
                        'data-lucide': 'loader-2',
                        className: "w-4 h-4 animate-spin"
                    }),
                    saving ? "Sauvegarde..." : "Sauvegarder"
                ])
            ] : [
                React.createElement('button', {
                    key: 'edit',
                    onClick: handleEditStart,
                    className: "inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'edit-3',
                        className: "w-4 h-4"
                    }),
                    "Modifier"
                ])
            ]),
            
            // PREMIÈRE LIGNE : Date création, Commercial, Contact, Logiciel, PDC
            React.createElement('div', {
                key: 'first-row',
                className: "flex flex-wrap items-start gap-[30px]"
            }, [
                React.createElement('div', { key: 'created' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Date de création"),
                    React.createElement('p', {
                        key: 'value',
                        className: "text-sm text-gray-900"
                    }, new Date(projet.created_at).toLocaleDateString('fr-FR'))
                ]),
                React.createElement('div', { key: 'commercial' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Commercial"),
                    editMode ? React.createElement('select', {
                        key: 'select',
                        value: editData.commercial_id || '',
                        onChange: (e) => setEditData({...editData, commercial_id: e.target.value || null}),
                        className: "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    }, [
                        React.createElement('option', { key: 'empty', value: '' }, "Sélectionner..."),
                        ...getCommerciauxArkance().map(user => 
                            React.createElement('option', { 
                                key: user.id, 
                                value: user.id 
                            }, `${user.prenom} ${user.nom}`)
                        )
                    ]) : projet.commercial ? React.createElement('div', {
                        key: 'value',
                        className: "flex items-start gap-3"
                    }, [
                        React.createElement('div', {
                            key: 'avatar',
                            className: "w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0"
                        }, projet.commercial.avatar ? React.createElement('img', {
                            src: projet.commercial.avatar,
                            alt: `${projet.commercial.prenom} ${projet.commercial.nom}`,
                            className: "w-8 h-8 rounded-full object-cover"
                        }) : `${projet.commercial.prenom?.[0]}${projet.commercial.nom?.[0]}`),
                        React.createElement('div', {
                            key: 'info',
                            className: "flex-1 min-w-0"
                        }, [
                            React.createElement('div', {
                                key: 'name',
                                className: "text-sm font-medium text-gray-900 mb-1"
                            }, `${projet.commercial.prenom} ${projet.commercial.nom}`),
                            projet.commercial.email && React.createElement('div', {
                                key: 'email',
                                className: "flex items-center gap-1 text-xs text-gray-600 mb-1"
                            }, [
                                React.createElement('span', { key: 'icon' }, "📧"),
                                React.createElement('span', { key: 'text' }, projet.commercial.email)
                            ]),
                            projet.commercial.telephone && React.createElement('div', {
                                key: 'phone',
                                className: "flex items-center gap-1 text-xs text-gray-600"
                            }, [
                                React.createElement('span', { key: 'icon' }, "📞"),
                                React.createElement('span', { key: 'text' }, projet.commercial.telephone)
                            ])
                        ])
                    ]) : renderValue(null)
                ]),
                React.createElement('div', { key: 'contact' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Contact entreprise"),
                    editMode ? React.createElement('select', {
                        key: 'select',
                        value: editData.contact_id || '',
                        onChange: (e) => setEditData({...editData, contact_id: e.target.value || null}),
                        className: "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    }, [
                        React.createElement('option', { key: 'empty', value: '' }, "Sélectionner..."),
                        ...getUtilisateursEntreprise(projet?.entreprise_id).map(user => 
                            React.createElement('option', { 
                                key: user.id, 
                                value: user.id 
                            }, `${user.prenom} ${user.nom}`)
                        )
                    ]) : projet.contact ? React.createElement('div', {
                        key: 'value',
                        className: "flex items-start gap-3"
                    }, [
                        React.createElement('div', {
                            key: 'avatar',
                            className: "w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0"
                        }, projet.contact.avatar ? React.createElement('img', {
                            src: projet.contact.avatar,
                            alt: `${projet.contact.prenom} ${projet.contact.nom}`,
                            className: "w-8 h-8 rounded-full object-cover"
                        }) : `${projet.contact.prenom?.[0]}${projet.contact.nom?.[0]}`),
                        React.createElement('div', {
                            key: 'info',
                            className: "flex-1 min-w-0"
                        }, [
                            React.createElement('div', {
                                key: 'name',
                                className: "text-sm font-medium text-gray-900 mb-1"
                            }, `${projet.contact.prenom} ${projet.contact.nom}`),
                            projet.contact.email && React.createElement('div', {
                                key: 'email',
                                className: "flex items-center gap-1 text-xs text-gray-600 mb-1"
                            }, [
                                React.createElement('span', { key: 'icon' }, "📧"),
                                React.createElement('span', { key: 'text' }, projet.contact.email)
                            ]),
                            projet.contact.telephone && React.createElement('div', {
                                key: 'phone',
                                className: "flex items-center gap-1 text-xs text-gray-600"
                            }, [
                                React.createElement('span', { key: 'icon' }, "📞"),
                                React.createElement('span', { key: 'text' }, projet.contact.telephone)
                            ])
                        ])
                    ]) : renderValue(null)
                ]),
                // Séparateur visuel entre informations personnelles et techniques
                React.createElement('div', { 
                    key: 'separator',
                    className: "flex items-center"
                }, React.createElement('div', {
                    className: "w-px h-16 bg-gray-300 mx-[30px]"
                })),
                React.createElement('div', { key: 'logiciel' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Logiciel"),
                    editMode ? React.createElement('select', {
                        key: 'select',
                        value: editData.logiciel_id || '',
                        onChange: (e) => setEditData({...editData, logiciel_id: e.target.value || null}),
                        className: "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    }, [
                        React.createElement('option', { key: 'empty', value: '' }, "Sélectionner..."),
                        ...availableLogiciels.map(logiciel => 
                            React.createElement('option', { 
                                key: logiciel.id, 
                                value: logiciel.id 
                            }, logiciel.nom)
                        )
                    ]) : React.createElement('div', {
                        key: 'value',
                        className: "flex items-center gap-2"
                    }, [
                        displayedLogiciel.logiciel?.logo && React.createElement('img', {
                            key: 'logo',
                            src: displayedLogiciel.logiciel.logo,
                            alt: displayedLogiciel.logiciel.nom,
                            className: "w-6 h-6 object-contain",
                            onError: (e) => {
                                e.target.style.display = 'none';
                            }
                        }),
                        displayedLogiciel.logiciel ? React.createElement('span', {
                            key: 'name',
                            className: displayedLogiciel.isProvisional 
                                ? "text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded font-medium"
                                : "text-sm text-gray-900"
                        }, displayedLogiciel.isProvisional 
                            ? `${displayedLogiciel.logiciel.nom} (provisoire)`
                            : displayedLogiciel.logiciel.nom
                        ) : React.createElement('span', {
                            key: 'empty',
                            className: "text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded font-medium"
                        }, "Non renseigné")
                    ])
                ]),
                // PDC uniquement pour les formations
                projet.type === 'formation' && React.createElement('div', { key: 'pdc-number' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "PDC"),
                    editMode ? React.createElement('select', {
                        key: 'select',
                        value: editData.pdc_id || '',
                        onChange: (e) => setEditData({...editData, pdc_id: e.target.value || null}),
                        className: "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    }, [
                        React.createElement('option', { key: 'empty', value: '' }, "Sélectionner..."),
                        ...availablePdcs.map(pdc => 
                            React.createElement('option', { 
                                key: pdc.id, 
                                value: pdc.id 
                            }, pdc.ref || pdc.pdc_number)
                        )
                    ]) : formatPdcDisplay(projet.pdc)
                ])
            ]),
            
            // DEUXIÈME LIGNE : Lieu, Dates, Stagiaires
            React.createElement('div', {
                key: 'second-row',
                className: "flex flex-wrap items-start gap-[30px] mt-4 pt-4 border-t border-gray-100"
            }, [
                // Lieu de formation (uniquement pour les formations)
                projet.type === 'formation' && React.createElement('div', { key: 'lieu' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Lieu de formation"),
                    editMode ? React.createElement('input', {
                        key: 'input',
                        type: 'text',
                        value: editData.lieu_projet || '',
                        onChange: (e) => setEditData({...editData, lieu_projet: e.target.value}),
                        className: "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        placeholder: "Saisir le lieu de formation"
                    }) : renderLieuxFormation()
                ]),
                React.createElement('div', { key: 'dates' }, [
                    React.createElement('label', {
                        key: 'label',
                        className: "block text-sm font-medium text-gray-700 mb-1"
                    }, "Dates"),
                    editMode ? React.createElement('input', {
                        key: 'input',
                        type: 'text',
                        value: editData.periode_souhaitee || '',
                        onChange: (e) => setEditData({...editData, periode_souhaitee: e.target.value}),
                        className: "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        placeholder: "Saisir la période souhaitée"
                    }) : renderDatesFormation()
                ]),
                // Stagiaires (uniquement pour les formations)
                projet.type === 'formation' && React.createElement('div', { key: 'stagiaires' }, [
                    React.createElement('div', {
                        key: 'header',
                        className: "flex items-center justify-between mb-2"
                    }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700"
                        }, isPlanificationComplete ? 
                            `Stagiaires (${getStagiairesPourAffichage().length})` : 
                            `Stagiaires (provisoire - ${projet.nombre_stagiaire || 0} stagiaires)`),
                        editMode && React.createElement('div', {
                            key: 'add-section',
                            className: "flex items-center gap-2"
                        }, [
                            React.createElement('select', {
                                key: 'dropdown',
                                className: "text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500",
                                value: '',
                                onChange: (e) => {
                                    if (e.target.value) {
                                        ajouterStagiaire(e.target.value);
                                        e.target.value = '';
                                    }
                                }
                            }, [
                                React.createElement('option', { key: 'empty', value: '' }, "Ajouter stagiaire..."),
                                ...getStagiairesDisponibles(projet?.entreprise_id, editData.stagiaires).map(user => 
                                    React.createElement('option', { 
                                        key: user.id, 
                                        value: user.id 
                                    }, `${user.prenom} ${user.nom}`)
                                )
                            ])
                        ])
                    ]),
                    isPlanificationComplete ? (
                        getStagiairesPourAffichage().length > 0 ? React.createElement('div', {
                            key: 'list',
                            className: "flex flex-wrap gap-2"
                        }, getStagiairesPourAffichage().map(stagiaire => 
                            React.createElement('div', {
                                key: stagiaire.id,
                                className: "flex items-center gap-2 rounded-lg px-3 py-2 bg-gray-50"
                            }, [
                                React.createElement('div', {
                                    key: 'avatar',
                                    className: "w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600"
                                }, stagiaire.avatar ? React.createElement('img', {
                                    src: stagiaire.avatar,
                                    alt: `${stagiaire.prenom} ${stagiaire.nom}`,
                                    className: "w-6 h-6 rounded-full object-cover"
                                }) : `${stagiaire.prenom?.[0]}${stagiaire.nom?.[0]}`),
                                React.createElement('span', {
                                    key: 'name',
                                    className: "text-sm text-gray-700"
                                }, `${stagiaire.prenom} ${stagiaire.nom}`),
                                editMode && React.createElement('button', {
                                    key: 'remove',
                                    type: 'button',
                                    onClick: () => retirerStagiaire(stagiaire.id),
                                    className: "ml-2 text-red-500 hover:text-red-700 text-xs font-bold",
                                    title: "Retirer ce stagiaire"
                                }, "×")
                            ])
                        )) : React.createElement('span', {
                            key: 'empty',
                            className: "text-sm text-gray-500"
                        }, "Aucun stagiaire assigné")
                    ) : React.createElement('span', {
                        key: 'provisional',
                        className: "text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded font-medium"
                    }, `Provisoire - ${projet.nombre_stagiaire || 0} stagiaire(s)`)
                ])
            ]),
        ])
    ]);
}

// Exporter le composant
window.CollapsibleProjectSection = CollapsibleProjectSection;