// Page de gestion des formations (PRJ)
function FormationPrepPage() {
    const { useState, useEffect } = React;
    const { sessions, loading, createSession, createFormationWithSessions, generateEvaluationUrl, deleteSession, getSessionById, updateSession, fetchSessions } = window.useFormation();
    const { pdcs } = window.usePdc();
    const { users } = window.useArkanceUsers();
    const { entreprises, createEntreprise } = window.useEntreprises();
    const { contacts, createContact } = window.useContacts();
    const { generateConvocation, generateConvention } = window.useDocumentGenerationService();
    const { getSessionsForProject } = window.useProjectSessions();
    const { showSuccessToast } = window.useToaster();

    const [showForm, setShowForm] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showEntrepriseModal, setShowEntrepriseModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showContactModalForStagiaire, setShowContactModalForStagiaire] = useState(false);
    const [userId, setUserId] = useState(null);
    const [editingFormationId, setEditingFormationId] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isEntrepriseClienteExpanded, setIsEntrepriseClienteExpanded] = useState(false);
    const [formData, setFormData] = useState({
        pdc_id: '',
        formateur_id: '',
        commercial_id: '',
        entreprise_id: '',
        contact_id: '',
        prj: '',
        nom_formation: '',
        stagiaire_ids: [],
        heures_formation: '09h00 à 12h00 et de 13h00 à 17h00',
        pdf_convocation: null,
        pdf_convention: null
    });

    const [formationSessions, setFormationSessions] = useState([]);

    const [generatedUrl, setGeneratedUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingPdfs, setIsGeneratingPdfs] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [formationStartDates, setFormationStartDates] = useState({});

    useEffect(() => {
        lucide.createIcons();
    }, [sessions, showForm, generatedUrl]);

    // Charger les dates de début de chaque formation
    useEffect(() => {
        const loadStartDates = async () => {
            if (!sessions || sessions.length === 0) return;

            const dates = {};
            for (const session of sessions) {
                try {
                    const { data, error } = await window.supabaseConfig.client
                        .from('evenement')
                        .select('date_debut')
                        .eq('projet_id', session.id)
                        .eq('type_evenement', 'formation')
                        .order('date_debut', { ascending: true })
                        .limit(1)
                        .single();

                    if (!error && data) {
                        dates[session.id] = data.date_debut;
                    }
                } catch (err) {
                    console.error('Erreur chargement date début:', err);
                }
            }
            setFormationStartDates(dates);
        };

        loadStartDates();
    }, [sessions]);

    // Écouter les mises à jour de formation pour rafraîchir le tableau
    useEffect(() => {
        if (!window.EventBus || !window.EventBusEvents) return;

        const handleFormationUpdated = async (data) => {
            console.log('📡 [FormationPrepPage] Formation mise à jour reçue:', data);

            // Rafraîchir la liste complète des formations
            await fetchSessions();

            // Rafraîchir les dates de début des formations
            // (le useEffect des dates se déclenchera automatiquement grâce à [sessions])
            console.log('✅ [FormationPrepPage] Tableau rafraîchi');
        };

        // S'abonner à l'événement
        const unsubscribe = window.EventBus.on(
            window.EventBusEvents.FORMATION_UPDATED,
            handleFormationUpdated
        );

        // Cleanup lors du démontage du composant
        return unsubscribe;
    }, [fetchSessions]);

    // Récupérer l'utilisateur authentifié
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await window.supabaseConfig.client.auth.getSession();
            if (session?.user) {
                setUserId(session.user.id);
            }
        };
        fetchUser();
    }, []);

    // Charger une formation existante pour édition
    useEffect(() => {
        const loadFormation = async () => {
            if (editingFormationId) {
                try {
                    setIsLoading(true);

                    // 1. Charger les données du projet/formation
                    const formation = await getSessionById(editingFormationId);

                    // 2. Charger les événements liés
                    const { data: events, error: eventsError } = await window.supabaseConfig.client
                        .from('evenement')
                        .select('*')
                        .eq('projet_id', editingFormationId)
                        .eq('type_evenement', 'formation')
                        .order('date_debut', { ascending: true });

                    if (eventsError) throw eventsError;

                    // 3. Transformer les événements en format sessions
                    const sessionsData = events.map(event => {
                        const dateDebut = new Date(event.date_debut);
                        const dateFin = new Date(event.date_fin);

                        // Extraire les heures
                        const heureDebut = dateDebut.toISOString().split('T')[1].substring(0, 5);
                        const heureFin = dateFin.toISOString().split('T')[1].substring(0, 5);

                        return {
                            dateDebut: dateDebut,
                            dateFin: dateFin,
                            heureDebut: heureDebut,
                            heureFin: heureFin,
                            lieu: event.lieu || '',
                            adresse: event.adresse || ''
                        };
                    });

                    // 4. Pré-remplir le formulaire
                    setFormData({
                        pdc_id: formation.pdc_id || '',
                        formateur_id: formation.formateur_id || '',
                        commercial_id: formation.commercial_id || '',
                        entreprise_id: formation.entreprise_id || '',
                        contact_id: formation.contact_id || '',
                        prj: formation.prj || '',
                        nom_formation: formation.name || '',
                        stagiaire_ids: formation.stagiaire_ids || [],
                        heures_formation: formation.heures_formation || '09h00 à 12h00 et de 13h00 à 17h00',
                        pdf_convocation: formation.pdf_convocation || null,
                        pdf_convention: formation.pdf_convention || null
                    });

                    setFormationSessions(sessionsData);
                    setShowForm(true);
                    setIsEditMode(true);

                } catch (err) {
                    console.error('Erreur lors du chargement de la formation:', err);
                    setError('Erreur lors du chargement de la formation: ' + err.message);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        loadFormation();
    }, [editingFormationId]);

    const handleFieldChange = (field, value) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value
            };

            // Réinitialiser le contact et les stagiaires si l'entreprise change
            if (field === 'entreprise_id' && value !== prev.entreprise_id) {
                newData.contact_id = '';
                newData.stagiaire_ids = [];
            }

            // Remplir automatiquement le nom de la formation si le PDC change
            if (field === 'pdc_id' && value) {
                const selectedPdc = pdcs.find(p => p.id === value);
                if (selectedPdc) {
                    // Utiliser l'utilitaire centralisé pour construire le nom de formation
                    newData.nom_formation = window.FormationUtils.buildFormationName(selectedPdc);
                }
            }

            return newData;
        });
        setError(null);
    };

    const validateForm = () => {
        if (!userId) {
            setError('Erreur: utilisateur non authentifié. Veuillez vous reconnecter.');
            return false;
        }
        if (!formData.pdc_id) {
            setError('Veuillez sélectionner un plan de cours');
            return false;
        }
        if (!formData.formateur_id) {
            setError('Veuillez sélectionner un formateur');
            return false;
        }
        if (!formData.commercial_id) {
            setError('Veuillez sélectionner un commercial');
            return false;
        }
        if (!formData.prj || formData.prj.trim() === '') {
            setError('Veuillez saisir le PRJ');
            return false;
        }
        if (!formData.nom_formation || formData.nom_formation.trim() === '') {
            setError('Veuillez saisir le nom de la formation');
            return false;
        }
        if (!formationSessions || formationSessions.length === 0) {
            setError('Veuillez ajouter au moins une session de formation');
            return false;
        }
        return true;
    };

    const handleGenerate = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            setSuccessMessage('');

            if (isEditMode && editingFormationId) {
                // MODE ÉDITION : Mettre à jour la formation existante

                // 1. Mettre à jour le projet/formation
                const periodeSummary = window.SessionUtils.generateSessionsSummary(formationSessions);

                await updateSession(editingFormationId, {
                    name: formData.nom_formation,
                    pdc_id: formData.pdc_id,
                    formateur_id: formData.formateur_id,
                    commercial_id: formData.commercial_id,
                    entreprise_id: formData.entreprise_id,
                    contact_id: formData.contact_id,
                    stagiaire_ids: formData.stagiaire_ids,
                    heures_formation: formData.heures_formation,
                    periode_souhaitee: periodeSummary,
                    prj: formData.prj,
                    status: 'active'
                });

                // 2. Supprimer les anciens événements
                const { error: deleteError } = await window.supabaseConfig.client
                    .from('evenement')
                    .delete()
                    .eq('projet_id', editingFormationId)
                    .eq('type_evenement', 'formation');

                if (deleteError) throw deleteError;

                // 3. Recréer les événements avec les nouvelles sessions
                const eventsToCreate = formationSessions.map((session, index) => {
                    const { dateDebut, dateFin } = window.SessionUtils.sessionToEventDates(session);

                    return {
                        titre: `${formData.nom_formation} - Session ${index + 1}`,
                        description: formData.prj,
                        date_debut: dateDebut,
                        date_fin: dateFin,
                        type_evenement: 'formation',
                        user_id: formData.formateur_id,
                        client_user_id: formData.stagiaire_ids || [],
                        projet_id: editingFormationId,
                        lieu: session.lieu || '',
                        adresse: session.adresse || '',
                        statut: 'planifie'
                    };
                });

                const { error: eventsError } = await window.supabaseConfig.client
                    .from('evenement')
                    .insert(eventsToCreate);

                if (eventsError) throw eventsError;

                setSuccessMessage('Formation mise à jour avec succès !');

                // Émettre un événement pour notifier les autres pages de la mise à jour
                if (window.EventBus && window.EventBusEvents) {
                    window.EventBus.emit(window.EventBusEvents.FORMATION_UPDATED, {
                        formationId: editingFormationId,
                        prj: formData.prj,
                        timestamp: new Date().toISOString()
                    });
                }

                // Retourner à la liste après 2 secondes
                setTimeout(() => {
                    handleReset();
                }, 2000);

            } else {
                // MODE CRÉATION : Code existant
                const formation = await createFormationWithSessions(formData, formationSessions, userId);
                const url = generateEvaluationUrl(formation.evaluation_token);
                setGeneratedUrl(url);
                setSuccessMessage('Formation et sessions créées avec succès !');
            }

            // Réinitialiser le formulaire
            setFormData({
                pdc_id: '',
                formateur_id: '',
                commercial_id: '',
                entreprise_id: '',
                contact_id: '',
                prj: '',
                nom_formation: '',
                stagiaire_ids: [],
                heures_formation: '09h00 à 12h00 et de 13h00 à 17h00'
            });
            setFormationSessions([]);

        } catch (err) {
            console.error('Erreur lors de la génération:', err);
            setError('Erreur lors de la génération/mise à jour: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyUrl = (url) => {
        navigator.clipboard.writeText(url);
        showSuccessToast('Copié !', 'Le lien a été copié dans le presse-papiers', { duration: 1000 });
    };

    const handleReset = () => {
        setGeneratedUrl('');
        setSuccessMessage('');
        setError(null);
        setShowForm(false);
        setEditingFormationId(null);
        setIsEditMode(false);
    };

    const handleGeneratePdfs = async () => {
        if (!editingFormationId) {
            setError('Erreur: Formation non trouvée');
            return;
        }

        try {
            setIsGeneratingPdfs(true);
            setError(null);
            setSuccessMessage('');

            console.log('🔄 Génération des PDFs pour la formation:', editingFormationId);

            // Récupérer les données fraîches du projet
            const freshProjectData = await getSessionById(editingFormationId);
            console.log('📊 Données projet récupérées:', freshProjectData);

            // Récupérer les sessions du projet
            let projectSessions = [];
            try {
                projectSessions = await getSessionsForProject(editingFormationId);
                console.log('📅 Sessions récupérées:', projectSessions);
            } catch (err) {
                console.warn('⚠️ Erreur lors de la récupération des sessions:', err);
            }

            // Mock objet tache pour compatibilité avec le service existant
            const tacheMock = {
                id: editingFormationId,
                project: freshProjectData
            };

            const setTacheMock = () => {}; // Fonction vide pour compatibilité

            // Générer les deux PDFs en parallèle
            console.log('🚀 Lancement génération PDFs en parallèle...');
            await Promise.all([
                generateConvocation(tacheMock, null, setTacheMock),
                generateConvention(tacheMock, null, setTacheMock)
            ]);

            console.log('✅ PDFs générés avec succès');

            // Recharger les données de la formation pour obtenir les URLs des PDFs
            const updatedFormation = await getSessionById(editingFormationId);
            setFormData(prev => ({
                ...prev,
                pdf_convocation: updatedFormation.pdf_convocation,
                pdf_convention: updatedFormation.pdf_convention
            }));

            setSuccessMessage('PDFs générés et enregistrés avec succès ! (Convocation et Convention)');

        } catch (err) {
            console.error('❌ Erreur génération PDFs:', err);
            setError('Erreur lors de la génération des PDFs: ' + err.message);
        } finally {
            setIsGeneratingPdfs(false);
        }
    };

    const handleViewPdfs = () => {
        if (formData.pdf_convocation) {
            window.open(formData.pdf_convocation, '_blank');
        }
        if (formData.pdf_convention) {
            window.open(formData.pdf_convention, '_blank');
        }
    };

    const handleDownloadPdfs = async () => {
        const downloadFile = async (url, filename) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);
            } catch (err) {
                console.error('Erreur téléchargement:', err);
            }
        };

        if (formData.pdf_convocation) {
            await downloadFile(formData.pdf_convocation, `convocation_${formData.prj}.pdf`);
        }
        if (formData.pdf_convention) {
            await downloadFile(formData.pdf_convention, `convention_${formData.prj}.pdf`);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Voulez-vous vraiment supprimer cette formation ?')) {
            try {
                await deleteSession(id);
            } catch (err) {
                console.error('Erreur lors de la suppression:', err);
                alert('Erreur lors de la suppression: ' + err.message);
            }
        }
    };

    const handleCreateEntreprise = async (entrepriseData) => {
        try {
            const newEntreprise = await createEntreprise(entrepriseData);
            setShowEntrepriseModal(false);
            // Sélectionner automatiquement la nouvelle entreprise
            handleFieldChange('entreprise_id', newEntreprise.id);
        } catch (err) {
            console.error('Erreur lors de la création de l\'entreprise:', err);
            alert('Erreur lors de la création de l\'entreprise: ' + err.message);
        }
    };

    const handleCreateContact = async (contactData) => {
        try {
            const newContact = await createContact(contactData);
            setShowContactModal(false);

            // Si la modale a été ouverte depuis les stagiaires
            if (showContactModalForStagiaire) {
                setShowContactModalForStagiaire(false);
                // Ajouter automatiquement le nouveau contact aux stagiaires sélectionnés
                handleFieldChange('stagiaire_ids', [...formData.stagiaire_ids, newContact.id]);
            } else {
                // Sélectionner automatiquement le nouveau contact comme contact principal
                handleFieldChange('contact_id', newContact.id);
            }
        } catch (err) {
            console.error('Erreur lors de la création du contact:', err);
            alert('Erreur lors de la création du contact: ' + err.message);
        }
    };

    // Filtrer les utilisateurs formateurs et commerciaux
    const formateurs = users.filter(u => u.fonction?.nom === 'formateur');
    const commerciaux = users.filter(u => u.fonction?.nom === 'commercial');

    // Filtrer les contacts par entreprise sélectionnée
    const contactsEntreprise = formData.entreprise_id
        ? contacts.filter(c => c.entreprise_id === formData.entreprise_id)
        : [];

    // Configuration des colonnes du tableau
    const columns = [
        {
            key: 'prj',
            label: 'PRJ',
            sortable: true,
            render: (value, row) => React.createElement('span', {
                className: 'font-medium text-gray-900'
            }, value || 'N/A')
        },
        {
            key: 'entreprise',
            label: 'Entreprise',
            sortable: true,
            render: (value, row) => React.createElement('span', {
                className: 'text-sm text-gray-700'
            }, value?.nom || 'N/A')
        },
        {
            key: 'date_debut',
            label: 'Début',
            sortable: false,
            render: (value, row) => {
                const dateStr = formationStartDates[row.id];
                if (!dateStr) return '-';

                const date = new Date(dateStr);
                return React.createElement('span', {
                    className: 'text-sm text-gray-700'
                }, date.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }));
            }
        },
        {
            key: 'pdc',
            label: 'Plan de cours',
            sortable: true,
            render: (value, row) => {
                if (!value || !value.pdc_number) {
                    return React.createElement('span', {
                        className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800'
                    }, 'N/A');
                }
                return value.pdc_number;
            }
        },
        {
            key: 'formateur',
            label: 'Formateur',
            sortable: true,
            render: (value, row) => {
                if (!value) return 'N/A';
                return React.createElement('div', {
                    className: 'flex items-center gap-2'
                }, [
                    React.createElement('div', {
                        key: 'avatar',
                        className: 'w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600'
                    }, value.avatar
                        ? React.createElement('img', {
                            src: value.avatar,
                            alt: `${value.prenom} ${value.nom}`,
                            className: 'w-6 h-6 rounded-full object-cover'
                        })
                        : `${value.prenom?.[0] || ''}${value.nom?.[0] || ''}`
                    ),
                    React.createElement('span', {
                        key: 'name',
                        className: 'text-sm'
                    }, `${value.prenom || ''} ${value.nom || ''}`.trim())
                ]);
            }
        },
        {
            key: 'commercial',
            label: 'Commercial',
            sortable: true,
            render: (value, row) => {
                if (!value) return 'N/A';
                return React.createElement('div', {
                    className: 'flex items-center gap-2'
                }, [
                    React.createElement('div', {
                        key: 'avatar',
                        className: 'w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600'
                    }, value.avatar
                        ? React.createElement('img', {
                            src: value.avatar,
                            alt: `${value.prenom} ${value.nom}`,
                            className: 'w-6 h-6 rounded-full object-cover'
                        })
                        : `${value.prenom?.[0] || ''}${value.nom?.[0] || ''}`
                    ),
                    React.createElement('span', {
                        key: 'name',
                        className: 'text-sm'
                    }, `${value.prenom || ''} ${value.nom || ''}`.trim())
                ]);
            }
        },
        {
            key: 'evaluation_token',
            label: 'Lien éval',
            render: (value, row) => {
                // Pas de bouton si pas de PDC
                if (!row.pdc) {
                    return React.createElement('span', {
                        className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800'
                    }, 'manque pdc');
                }

                const url = generateEvaluationUrl(value);
                return React.createElement('button', {
                    onClick: (e) => {
                        e.stopPropagation();
                        handleCopyUrl(url);
                    },
                    className: 'inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors'
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'copy',
                        className: 'w-4 h-4'
                    }),
                    React.createElement('span', {
                        key: 'text'
                    }, 'Copier')
                ]);
            }
        }
    ];

    // Si on affiche le formulaire
    if (showForm) {
        return React.createElement('div', {
            className: "space-y-6"
        }, [
            // Bouton retour
            React.createElement('div', {
                key: 'back',
                className: "flex items-center gap-2"
            }, React.createElement('button', {
                onClick: () => {
                    setShowForm(false);
                    setGeneratedUrl('');
                    setError(null);
                    setSuccessMessage('');
                    setEditingFormationId(null);
                    setIsEditMode(false);
                },
                className: 'inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors'
            }, [
                React.createElement('i', {
                    key: 'icon',
                    'data-lucide': 'arrow-left',
                    className: 'w-4 h-4'
                }),
                React.createElement('span', {
                    key: 'text'
                }, 'Retour à la liste')
            ])),

            // En-tête
            React.createElement('div', {
                key: 'header',
                className: "bg-white rounded-lg border border-gray-200 p-6"
            }, [
                React.createElement('div', {
                    key: 'header-content',
                    className: "flex items-start justify-between"
                }, [
                    // Bloc titre + sous-titre
                    React.createElement('div', {
                        key: 'titles'
                    }, [
                        React.createElement('h1', {
                            key: 'title',
                            className: "text-2xl font-bold text-gray-900 mb-2"
                        }, isEditMode ? "Modifier la formation (PRJ)" : "Nouvelle formation (PRJ)"),
                        React.createElement('p', {
                            key: 'subtitle',
                            className: "text-gray-600"
                        }, isEditMode ? "Modifiez les informations de la formation et ses sessions" : "Préparez un formulaire d'évaluation et générez un lien à envoyer aux stagiaires")
                    ]),

                    // Bloc boutons PDF (visible uniquement en mode édition)
                    isEditMode && React.createElement('div', {
                        key: 'pdf-buttons',
                        className: 'flex flex-col gap-2'
                    }, [
                        // Ligne 1: Bouton principal
                        React.createElement('div', {
                            key: 'main-buttons',
                            className: 'flex gap-2'
                        }, [
                            // Bouton "Produire PDF"
                            React.createElement('button', {
                                key: 'generate-button',
                                onClick: handleGeneratePdfs,
                                disabled: isGeneratingPdfs,
                                className: `inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    isGeneratingPdfs
                                        ? 'bg-gray-400 text-white cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                }`
                            }, [
                                React.createElement('i', {
                                    key: 'icon',
                                    'data-lucide': isGeneratingPdfs ? 'loader-2' : 'file-text',
                                    className: `w-4 h-4 ${isGeneratingPdfs ? 'animate-spin' : ''}`
                                }),
                                React.createElement('span', {
                                    key: 'text'
                                }, isGeneratingPdfs ? 'Génération...' : 'Produire PDF')
                            ])
                        ]),

                        // Boutons "Visualiser" et "Télécharger" (visibles uniquement si PDFs existent)
                        (formData.pdf_convocation || formData.pdf_convention) && React.createElement('div', {
                            key: 'action-buttons',
                            className: 'flex gap-2'
                        }, [
                            // Bouton "Visualiser PDFs"
                            React.createElement('button', {
                                key: 'view-button',
                                onClick: handleViewPdfs,
                                className: 'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors'
                            }, [
                                React.createElement('i', {
                                    key: 'icon',
                                    'data-lucide': 'eye',
                                    className: 'w-4 h-4'
                                }),
                                React.createElement('span', {
                                    key: 'text'
                                }, 'Visualiser')
                            ]),

                            // Bouton "Télécharger PDFs"
                            React.createElement('button', {
                                key: 'download-button',
                                onClick: handleDownloadPdfs,
                                className: 'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors'
                            }, [
                                React.createElement('i', {
                                    key: 'icon',
                                    'data-lucide': 'download',
                                    className: 'w-4 h-4'
                                }),
                                React.createElement('span', {
                                    key: 'text'
                                }, 'Télécharger')
                            ])
                        ])
                    ])
                ])
            ]),

            // Messages
            error && React.createElement('div', {
                key: 'error',
                className: "bg-red-50 border border-red-200 rounded-lg p-4"
            }, React.createElement('p', {
                className: "text-red-800 text-sm"
            }, error)),

            successMessage && React.createElement('div', {
                key: 'success',
                className: "bg-green-50 border border-green-200 rounded-lg p-4"
            }, React.createElement('p', {
                className: "text-green-800 text-sm font-medium"
            }, successMessage)),

            // === SECTION 1 : ENTREPRISE CLIENTE ===
            !generatedUrl && React.createElement('div', {
                key: 'section-entreprise',
                className: "bg-white rounded-lg border border-gray-200 p-6"
            }, [
                // Titre de section (cliquable pour collapse/expand)
                React.createElement('div', {
                    key: 'section-header',
                    className: "flex items-center justify-between cursor-pointer pb-3 border-b border-gray-200",
                    onClick: () => setIsEntrepriseClienteExpanded(!isEntrepriseClienteExpanded)
                }, [
                    React.createElement('div', {
                        key: 'title-container',
                        className: "flex items-center gap-2"
                    }, [
                        React.createElement('i', {
                            key: 'icon',
                            'data-lucide': 'building-2',
                            className: 'w-5 h-5 text-blue-600'
                        }),
                        React.createElement('h3', {
                            key: 'title',
                            className: "text-base font-semibold text-gray-900"
                        }, "Entreprise cliente"),
                        React.createElement('span', {
                            key: 'badge',
                            className: "text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
                        }, "optionnel")
                    ]),
                    React.createElement('i', {
                        key: 'chevron',
                        'data-lucide': isEntrepriseClienteExpanded ? 'chevron-up' : 'chevron-down',
                        className: 'w-5 h-5 text-gray-400 transition-transform'
                    })
                ]),

                // Grille des champs (conditionnelle)
                isEntrepriseClienteExpanded && React.createElement('div', {
                    key: 'section-grid',
                    className: "grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
                }, [
                    // Entreprise - avec recherche et bouton d'ajout
                    React.createElement('div', {
                        key: 'entreprise'
                    }, React.createElement(window.SearchableDropdown, {
                        value: formData.entreprise_id,
                        onChange: (value) => handleFieldChange('entreprise_id', value),
                        options: entreprises.map(e => ({ id: e.id, label: e.nom })),
                        placeholder: "Sélectionnez une entreprise",
                        label: "Entreprise",
                        required: false,
                        onAddNew: () => setShowEntrepriseModal(true),
                        addButtonLabel: "Nouvelle entreprise"
                    })),

                    // Contact - avec recherche et bouton d'ajout
                    React.createElement('div', {
                        key: 'contact'
                    }, React.createElement(window.SearchableDropdown, {
                        value: formData.contact_id,
                        onChange: (value) => handleFieldChange('contact_id', value),
                        options: contactsEntreprise.map(c => ({
                            id: c.id,
                            label: `${c.prenom || ''} ${c.nom || ''}`.trim()
                        })),
                        placeholder: formData.entreprise_id ? "Sélectionnez un contact" : "Sélectionnez d'abord une entreprise",
                        label: "Contact",
                        required: false,
                        disabled: !formData.entreprise_id,
                        onAddNew: formData.entreprise_id ? () => setShowContactModal(true) : null,
                        addButtonLabel: "Nouveau contact"
                    })),

                    // Stagiaires (multi-sélection)
                    React.createElement('div', {
                        key: 'stagiaires',
                        className: "md:col-span-2"
                    }, React.createElement(window.StagiairePicker, {
                        selectedIds: formData.stagiaire_ids,
                        onChange: (value) => handleFieldChange('stagiaire_ids', value),
                        entrepriseId: formData.entreprise_id,
                        label: "Stagiaires",
                        required: false,
                        onAddNew: formData.entreprise_id ? () => {
                            setShowContactModalForStagiaire(true);
                            setShowContactModal(true);
                        } : null
                    }))
                ])
            ]),

            // === SECTION 2 : ÉQUIPE ARKANCE ===
            !generatedUrl && React.createElement('div', {
                key: 'section-equipe',
                className: "bg-white rounded-lg border border-gray-200 p-6"
            }, [
                // Titre de section
                React.createElement('div', {
                    key: 'section-header',
                    className: "flex items-center gap-2 mb-4 pb-3 border-b border-gray-200"
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'users',
                        className: 'w-5 h-5 text-blue-600'
                    }),
                    React.createElement('h3', {
                        key: 'title',
                        className: "text-base font-semibold text-gray-900"
                    }, "Équipe ARKANCE")
                ]),

                // Grille des champs
                React.createElement('div', {
                    key: 'section-grid',
                    className: "grid grid-cols-1 md:grid-cols-2 gap-6"
                }, [
                    // Commercial
                    React.createElement('div', {
                        key: 'commercial'
                    }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-2"
                        }, "Commercial *"),
                        React.createElement('select', {
                            key: 'select',
                            value: formData.commercial_id,
                            onChange: (e) => handleFieldChange('commercial_id', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        }, [
                            React.createElement('option', {
                                key: 'empty',
                                value: ''
                            }, "Sélectionnez un commercial"),
                            ...commerciaux.map(user =>
                                React.createElement('option', {
                                    key: user.id,
                                    value: user.id
                                }, `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email)
                            )
                        ])
                    ]),

                    // Formateur
                    React.createElement('div', {
                        key: 'formateur'
                    }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-2"
                        }, "Formateur *"),
                        React.createElement('select', {
                            key: 'select',
                            value: formData.formateur_id,
                            onChange: (e) => handleFieldChange('formateur_id', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        }, [
                            React.createElement('option', {
                                key: 'empty',
                                value: ''
                            }, "Sélectionnez un formateur"),
                            ...formateurs.map(user =>
                                React.createElement('option', {
                                    key: user.id,
                                    value: user.id
                                }, `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email)
                            )
                        ])
                    ])
                ])
            ]),

            // === SECTION 3 : DÉTAILS DE LA FORMATION ===
            !generatedUrl && React.createElement('div', {
                key: 'section-formation',
                className: "bg-white rounded-lg border border-gray-200 p-6"
            }, [
                // Titre de section
                React.createElement('div', {
                    key: 'section-header',
                    className: "flex items-center gap-2 mb-4 pb-3 border-b border-gray-200"
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'book-open',
                        className: 'w-5 h-5 text-blue-600'
                    }),
                    React.createElement('h3', {
                        key: 'title',
                        className: "text-base font-semibold text-gray-900"
                    }, "Détails de la formation")
                ]),

                // Grille des champs
                React.createElement('div', {
                    key: 'section-grid',
                    className: "grid grid-cols-1 md:grid-cols-2 gap-6"
                }, [
                    // PRJ
                    React.createElement('div', {
                        key: 'prj'
                    }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-2"
                        }, "PRJ *"),
                        React.createElement('input', {
                            key: 'input',
                            type: 'text',
                            value: formData.prj,
                            onChange: (e) => handleFieldChange('prj', e.target.value),
                            placeholder: "Ex: PRJ-2025-001",
                            className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        })
                    ]),

                    // Plan de cours avec recherche
                    React.createElement(window.SearchableDropdown, {
                        key: 'pdc',
                        label: 'Plan de cours',
                        value: formData.pdc_id,
                        onChange: (value) => handleFieldChange('pdc_id', value),
                        options: pdcs.map(pdc => ({
                            id: pdc.id,
                            label: pdc.ref || `PDC #${pdc.pdc_number}`
                        })),
                        placeholder: 'Rechercher un PDC...',
                        required: true
                    }),

                    // Sessions de formation (avec calendrier)
                    React.createElement('div', {
                        key: 'sessions',
                        className: "md:col-span-2"
                    }, React.createElement(window.FormationSessionPicker, {
                        sessions: formationSessions,
                        onChange: setFormationSessions,
                        label: "Périodes de formation",
                        required: true
                    })),

                    // Heures de formation
                    React.createElement('div', {
                        key: 'heures_formation',
                        className: "md:col-span-2"
                    }, [
                        React.createElement('label', {
                            key: 'label',
                            className: "block text-sm font-medium text-gray-700 mb-2"
                        }, "Heures de formation *"),
                        React.createElement('input', {
                            key: 'input',
                            type: 'text',
                            value: formData.heures_formation,
                            onChange: (e) => handleFieldChange('heures_formation', e.target.value),
                            placeholder: "Ex: 09h00 à 12h00 et de 13h00 à 17h00",
                            className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        })
                    ])
                ])
            ]),

            // Bouton générer/mettre à jour
            !generatedUrl && React.createElement('div', {
                key: 'form-actions',
                className: "flex justify-end"
            }, React.createElement('button', {
                    onClick: handleGenerate,
                    disabled: isLoading,
                    className: `inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-lg transition-colors ${
                        isLoading
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': isLoading ? 'loader-2' : (isEditMode ? 'save' : 'check'),
                        className: `w-4 h-4 ${isLoading ? 'animate-spin' : ''}`
                    }),
                    isLoading ? (isEditMode ? "Mise à jour..." : "Validation...") : (isEditMode ? "Mettre à jour la formation" : "Valider")
                ])),

            // URL générée
            generatedUrl && React.createElement('div', {
                key: 'url',
                className: "bg-white rounded-lg border border-gray-200 p-6"
            }, [
                React.createElement('h2', {
                    key: 'title',
                    className: "text-lg font-semibold text-gray-900 mb-4"
                }, "Lien d'évaluation généré"),

                React.createElement('div', {
                    key: 'url-display',
                    className: "bg-gray-50 rounded-lg p-4 mb-4"
                }, [
                    React.createElement('p', {
                        key: 'label',
                        className: "text-sm text-gray-600 mb-2"
                    }, "Copiez et envoyez ce lien aux stagiaires :"),
                    React.createElement('div', {
                        key: 'url-box',
                        className: "flex items-center gap-2"
                    }, [
                        React.createElement('input', {
                            key: 'input',
                            type: 'text',
                            value: generatedUrl,
                            readOnly: true,
                            className: "flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-mono"
                        }),
                        React.createElement('button', {
                            key: 'copy',
                            onClick: () => handleCopyUrl(generatedUrl),
                            className: "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        }, [
                            React.createElement('i', {
                                key: 'icon',
                                'data-lucide': 'copy',
                                className: "w-4 h-4"
                            }),
                            "Copier"
                        ])
                    ])
                ]),

                React.createElement('div', {
                    key: 'actions',
                    className: "flex justify-end"
                }, React.createElement('button', {
                    onClick: handleReset,
                    className: "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'arrow-left',
                        className: "w-4 h-4"
                    }),
                    "Retour à la liste"
                ]))
            ]),

            // Modal de création d'entreprise
            showEntrepriseModal && React.createElement(window.EntrepriseModal, {
                key: 'entreprise-modal',
                item: null,
                onSubmit: handleCreateEntreprise,
                onClose: () => setShowEntrepriseModal(false)
            }),

            // Modal de création de contact
            showContactModal && React.createElement(window.ContactModal, {
                key: 'contact-modal',
                item: null,
                entrepriseId: formData.entreprise_id,
                onSubmit: handleCreateContact,
                onClose: () => setShowContactModal(false)
            })
        ]);
    }

    // Vue tableau
    return React.createElement('div', {}, [
        React.createElement(window.TableView, {
            key: 'table',
            data: sessions,
            columns: columns,
            title: "Formations (PRJ)",
            subtitle: "Liste de toutes les formations avec liens d'évaluation",
            loading: loading,
            onAdd: () => setShowForm(true),
            onImport: () => setShowImportModal(true),
            onDelete: handleDelete,
            onRowClick: (row) => {
                setEditingFormationId(row.id);
            },
            searchableFields: ['prj', 'pdc.ref', 'formateur.nom', 'formateur.prenom', 'commercial.nom', 'commercial.prenom']
        }),

        showImportModal && React.createElement(window.ImportProjectsModal, {
            key: 'import-modal',
            show: showImportModal,
            onClose: () => {
                setShowImportModal(false);
                // Rafraîchir la liste après import
                fetchSessions();
            }
        })
    ]);
}

// Export global
window.FormationPrepPage = FormationPrepPage;
