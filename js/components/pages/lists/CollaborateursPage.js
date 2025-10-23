// Page Collaborateurs Arkance
function CollaborateursPage({ onRowClick }) {
    const { useState } = React;
    const { users, loading, error } = window.useArkanceUsers();
    const { createUserWithAuth, updateUser, deleteUser } = window.useUsers();
    const supabase = window.supabaseConfig.client;
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [groupBy, setGroupBy] = useState('service'); // Par défaut groupé par service
    const [expandAll, setExpandAll] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState('');

    // Ordre personnalisé des services : Training en premier, Commerce en deuxième, puis alphabétique
    const customServiceOrder = (a, b) => {
        const priority = {
            'training': 0,
            'commerce': 1
        };
        const aPriority = priority[a.toLowerCase()] ?? 999;
        const bPriority = priority[b.toLowerCase()] ?? 999;

        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.localeCompare(b); // Ordre alphabétique pour les autres
    };

    // État d'expansion par défaut : seul Training est ouvert
    const getDefaultExpandState = (groupKey, currentGroupBy) => {
        if (currentGroupBy === 'service') {
            return groupKey.toLowerCase() === 'training';
        }
        return true; // Par défaut pour les autres modes de groupement
    };
    
    const columns = [
        { 
            key: 'avatar', 
            label: 'Avatar', 
            type: 'text',
            render: (value, row) => {
                return React.createElement(AvatarCell, {
                    key: `avatar-${row.id}`,
                    avatarUrl: value,
                    prenom: row.prenom,
                    nom: row.nom
                });
            }
        },
        { 
            key: 'nom_complet', 
            label: 'Nom', 
            type: 'text', 
            sortable: true,
            render: (value, row) => {
                const nomComplet = `${row.prenom || ''} ${row.nom || ''}`.trim();
                return nomComplet || '-';
            }
        },
        { 
            key: 'email', 
            label: 'Email', 
            type: 'text',
            sortable: true,
            render: (value, row) => {
                if (!value) return '-';
                
                // Tronquer l'email s'il est trop long
                if (value.length > 25) {
                    return React.createElement('span', {
                        title: value,
                        className: 'truncate'
                    }, value.substring(0, 22) + '...');
                }
                
                return value;
            }
        },
        { 
            key: 'service', 
            label: 'Service', 
            type: 'text',
            render: (value, row) => {
                return row.service?.nom || '-';
            }
        },
        { 
            key: 'fonction', 
            label: 'Fonction', 
            type: 'text',
            render: (value, row) => {
                return row.fonction?.nom || '-';
            }
        },
        {
            key: 'role',
            label: 'Rôle',
            type: 'text',
            render: (value, row) => {
                return row.role || '-';
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            type: 'actions'
        }
    ];
    
    const handleAdd = () => {
        setEditingItem(null);
        setShowModal(true);
    };
    
    const handleEdit = (item) => {
        setEditingItem(item);
        setShowModal(true);
    };
    
    const handleDelete = async (item) => {
        const nomComplet = `${item.prenom || ''} ${item.nom || ''}`.trim();
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${nomComplet}" ?`)) {
            try {
                await deleteUser(item.id);
                // La mise à jour se fera automatiquement via realtime
            } catch (error) {
                console.error('Erreur:', error);
            }
        }
    };
    
    const handleSubmit = async (formData) => {
        try {
            if (editingItem) {
                await updateUser(editingItem.id, formData);
            } else {
                // Utiliser createUserWithAuth pour les nouveaux utilisateurs
                await createUserWithAuth(formData);
            }
            setShowModal(false);
            setEditingItem(null);
            // La mise à jour se fera automatiquement via realtime
        } catch (error) {
            console.error('Erreur:', error);
            // L'erreur sera affichée dans le modal via le hook
        }
    };

    // Obtenir l'entreprise Arkance (type interne)
    const getArkanceEntreprise = async () => {
        const { data: arkanceEntreprise, error } = await supabase
            .from('entreprise')
            .select('id')
            .eq('type_entreprise', 'interne')
            .single();
        
        if (error) throw new Error('Impossible de trouver l\'entreprise Arkance');
        return arkanceEntreprise.id;
    };

    // Résoudre ou créer un service
    const resolveService = async (serviceName) => {
        if (!serviceName || serviceName.trim() === '') return null;
        
        const nom = serviceName.trim();
        console.log(`🔍 Recherche service: "${nom}"`);
        
        try {
            // Chercher le service existant avec syntaxe correcte
            const { data: existingService, error: searchError } = await supabase
                .from('service')
                .select('id, nom')
                .eq('nom', nom)
                .maybeSingle(); // maybeSingle au lieu de single pour éviter erreur si pas trouvé
            
            if (searchError) {
                console.error('❌ Erreur recherche service:', searchError);
                throw searchError;
            }
            
            if (existingService) {
                console.log(`✅ Service trouvé: ${existingService.id}`);
                return existingService.id;
            }
            
            console.log(`📝 Création nouveau service: "${nom}"`);
            
            // Créer le nouveau service
            const { data: newService, error: createError } = await supabase
                .from('service')
                .insert({ nom })
                .select('id, nom')
                .single();
            
            if (createError) {
                console.error('❌ Erreur création service:', createError);
                
                // Si contrainte de format, essayer plusieurs variantes
                if (createError.code === '23514' && createError.message.includes('service_nom_check')) {
                    console.log('🔄 Contrainte service_nom_check détectée, test de différents formats...');
                    
                    // Essayer plusieurs formats
                    const variantes = [
                        nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase(), // "Outsourcing"
                        nom.toUpperCase(), // "OUTSOURCING"
                        nom.replace(/[^a-zA-Z0-9\s]/g, ''), // Supprimer caractères spéciaux
                        nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ''), // "Outsourcing" sans caractères spéciaux
                        'Ext_' + nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase() // "Ext_Outsourcing"
                    ];
                    
                    for (let i = 0; i < variantes.length; i++) {
                        const nomVariante = variantes[i];
                        console.log(`🔄 Tentative ${i + 1}/${variantes.length}: "${nomVariante}"`);
                        
                        const { data: variantService, error: variantError } = await supabase
                            .from('service')
                            .insert({ nom: nomVariante })
                            .select('id, nom')
                            .single();
                        
                        if (!variantError) {
                            console.log(`✅ Service créé avec variante: ${variantService.nom}`);
                            return variantService.id;
                        }
                        
                        console.log(`❌ Variante "${nomVariante}" échouée:`, variantError.message);
                    }
                    
                    console.error('❌ Toutes les variantes ont échoué, utilisation service par défaut');
                    // Utiliser un service par défaut existant
                    const { data: defaultService } = await supabase
                        .from('service')
                        .select('id, nom')
                        .limit(1)
                        .single();
                    
                    if (defaultService) {
                        console.log(`🎯 Service par défaut utilisé: ${defaultService.nom}`);
                        return defaultService.id;
                    }
                    
                    throw new Error(`Impossible de créer le service "${nom}" avec aucune variante et aucun service par défaut disponible`);
                }
                
                throw createError;
            }
            
            console.log(`✅ Service créé: ${newService.nom}`);
            return newService.id;
            
        } catch (error) {
            console.error(`💥 Erreur finale résolution service "${nom}":`, error);
            throw new Error(`Impossible de résoudre le service "${nom}": ${error.message}`);
        }
    };

    // Résoudre ou créer une fonction
    const resolveFonction = async (fonctionName) => {
        if (!fonctionName || fonctionName.trim() === '') return null;
        
        const nom = fonctionName.trim();
        console.log(`🔍 Recherche fonction: "${nom}"`);
        
        try {
            // Chercher la fonction existante avec syntaxe correcte
            const { data: existingFonction, error: searchError } = await supabase
                .from('fonction')
                .select('id, nom')
                .eq('nom', nom)
                .maybeSingle(); // maybeSingle au lieu de single
            
            if (searchError) {
                console.error('❌ Erreur recherche fonction:', searchError);
                throw searchError;
            }
            
            if (existingFonction) {
                console.log(`✅ Fonction trouvée: ${existingFonction.id}`);
                return existingFonction.id;
            }
            
            console.log(`📝 Création nouvelle fonction: "${nom}"`);
            
            // Créer la nouvelle fonction
            const { data: newFonction, error: createError } = await supabase
                .from('fonction')
                .insert({ nom })
                .select('id, nom')
                .single();
            
            if (createError) {
                console.error('❌ Erreur création fonction:', createError);
                
                // Si contrainte de format, essayer avec un nom adapté
                if (createError.code === '23514' && createError.message.includes('fonction_nom_check')) {
                    console.log('🔄 Tentative avec nom formaté...');
                    const nomFormate = nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase();
                    
                    const { data: formattedFonction, error: formattedError } = await supabase
                        .from('fonction')
                        .insert({ nom: nomFormate })
                        .select('id, nom')
                        .single();
                    
                    if (formattedError) {
                        console.error('❌ Échec même avec nom formaté, utilisation fonction par défaut');
                        // Utiliser une fonction par défaut existante
                        const { data: defaultFonction } = await supabase
                            .from('fonction')
                            .select('id, nom')
                            .limit(1)
                            .single();
                        
                        if (defaultFonction) {
                            console.log(`🎯 Fonction par défaut utilisée: ${defaultFonction.nom}`);
                            return defaultFonction.id;
                        }
                        
                        // Si pas de fonction par défaut, retourner null (fonction optionnelle)
                        console.log('⚠️ Aucune fonction par défaut, continue sans fonction');
                        return null;
                    }
                    
                    console.log(`✅ Fonction créée avec nom formaté: ${formattedFonction.nom}`);
                    return formattedFonction.id;
                }
                
                throw createError;
            }
            
            console.log(`✅ Fonction créée: ${newFonction.nom}`);
            return newFonction.id;
            
        } catch (error) {
            console.error(`💥 Erreur finale résolution fonction "${nom}":`, error);
            // Les fonctions sont optionnelles, on peut continuer sans
            console.log('⚠️ Continue sans fonction assignée');
            return null;
        }
    };

    // Parser CSV simple
    const parseCSV = (text) => {
        // Supprimer BOM UTF-8 si présent
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }
        
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('Le fichier CSV doit contenir au moins une ligne d\'en-têtes et une ligne de données');
        }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            
            if (row.nom || row.prenom || row.email) { // Au moins un champ obligatoire
                data.push(row);
            }
        }
        
        return data;
    };

    // Import CSV intégré
    const handleCSVImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        setIsImporting(true);
        setImportStatus('Lecture du fichier...');
        
        try {
            const text = await file.text();
            const data = parseCSV(text);
            
            if (data.length === 0) {
                throw new Error('Aucune donnée valide trouvée dans le fichier');
            }
            
            console.log('📊 Données CSV parsées:', data);
            setImportStatus(`Import de ${data.length} collaborateurs...`);
            
            const arkanceEntrepriseId = await getArkanceEntreprise();
            console.log('🏢 ID Entreprise Arkance:', arkanceEntrepriseId);
            let successCount = 0;
            let errorCount = 0;
            
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                setImportStatus(`Import ${i + 1}/${data.length} : ${row.prenom} ${row.nom}`);
                
                try {
                    // Validation des champs requis
                    if (!row.nom || !row.prenom || !row.email) {
                        throw new Error('Nom, prénom et email sont requis');
                    }
                    
                    console.log(`📝 Traitement ligne ${i + 1}:`, row);
                    
                    // Résoudre service et fonction
                    const serviceId = await resolveService(row.service);
                    const fonctionId = await resolveFonction(row.fonction);
                    
                    console.log(`🔗 IDs résolus - Service: ${serviceId}, Fonction: ${fonctionId}`);
                    
                    // Informer l'utilisateur si le service original n'a pas pu être créé
                    if (row.service && row.service.trim() !== '') {
                        // Vérifier si on a utilisé le service demandé ou un autre
                        const { data: finalService } = await supabase
                            .from('service')
                            .select('nom')
                            .eq('id', serviceId)
                            .single();
                        
                        if (finalService && finalService.nom.toLowerCase() !== row.service.toLowerCase()) {
                            console.log(`ℹ️ Service "${row.service}" non créé, utilisé "${finalService.nom}" à la place`);
                            setImportStatus(`Import ${i + 1}/${data.length} : ${row.prenom} ${row.nom} (service: ${finalService.nom})`);
                        }
                    }
                    
                    // Créer l'utilisateur
                    const userData = {
                        nom: row.nom,
                        prenom: row.prenom,
                        email: row.email,
                        telephone: row.telephone || '',
                        password: row['mot de passe'] || row.password || 'TempPass123!',
                        role: row.role || 'user',
                        entreprise_id: arkanceEntrepriseId,
                        service_id: serviceId,
                        fonction_id: fonctionId
                    };
                    
                    console.log(`🚀 Appel createUserWithAuth pour ${row.email}`);
                    const result = await createUserWithAuth(userData);
                    console.log(`✅ Utilisateur créé:`, result.id);
                    
                    successCount++;
                    
                } catch (userError) {
                    console.error(`❌ Erreur ligne ${i + 1} (${row.email}):`, userError);
                    errorCount++;
                    
                    // Mettre à jour le statut avec l'erreur spécifique
                    setImportStatus(`Erreur ligne ${i + 1}: ${userError.message}`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause pour voir l'erreur
                }
            }
            
            // Message final avec détails des services créés/utilisés
            console.log('📋 Résumé des services utilisés lors de l\'import');
            const servicesUtilises = new Set();
            
            // Récupérer les services des utilisateurs créés pour le résumé
            for (const row of data.slice(0, successCount)) {
                if (row.service) {
                    try {
                        const serviceId = await resolveService(row.service);
                        const { data: service } = await supabase
                            .from('service')
                            .select('nom')
                            .eq('id', serviceId)
                            .single();
                        if (service) servicesUtilises.add(service.nom);
                    } catch (e) {
                        // Ignore les erreurs de résumé
                    }
                }
            }
            
            const messageServices = servicesUtilises.size > 0 
                ? ` (Services: ${Array.from(servicesUtilises).join(', ')})`
                : '';
            
            setImportStatus(`Terminé : ${successCount} créés, ${errorCount} erreurs${messageServices}`);
            
            // La mise à jour se fera automatiquement via realtime
            setTimeout(() => {
                setImportStatus('');
            }, 3000);
            
        } catch (error) {
            console.error('Erreur import CSV:', error);
            setImportStatus(`Erreur : ${error.message}`);
            setTimeout(() => setImportStatus(''), 5000);
        } finally {
            setIsImporting(false);
            // Reset file input
            event.target.value = '';
        }
    };
    
    if (error) {
        return React.createElement('div', {
            className: "bg-red-50 border border-red-200 rounded-lg p-4"
        }, React.createElement('p', {
            className: "text-red-800"
        }, `Erreur: ${error}`));
    }
    
    // Titre personnalisé selon le mode de groupement
    const getTitle = () => {
        if (!groupBy) return "Collaborateurs Arkance";
        switch(groupBy) {
            case 'service': return "Collaborateurs Arkance par service";
            case 'fonction': return "Collaborateurs Arkance par fonction";
            default: return "Collaborateurs Arkance";
        }
    };
    
    const getSubtitle = () => {
        if (!groupBy) return "Gérez les employés et formateurs Arkance";
        switch(groupBy) {
            case 'service': return "Gérez les collaborateurs Arkance groupés par service";
            case 'fonction': return "Gérez les collaborateurs Arkance groupés par fonction";
            default: return "Gérez les employés et formateurs Arkance";
        }
    };
    
    return React.createElement('div', {}, [
        // Input file caché pour l'import CSV
        React.createElement('input', {
            key: 'csv-import-input',
            id: 'csv-import-input',
            type: 'file',
            accept: '.csv',
            style: { display: 'none' },
            onChange: handleCSVImport
        }),
        
        // Message de statut d'import
        importStatus && React.createElement('div', {
            key: 'import-status',
            className: 'mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'
        }, [
            React.createElement('div', {
                key: 'status-content',
                className: 'flex items-center gap-2'
            }, [
                isImporting && React.createElement('div', {
                    key: 'spinner',
                    className: 'w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin'
                }),
                React.createElement('span', {
                    key: 'status-text',
                    className: 'text-blue-800 text-sm font-medium'
                }, importStatus)
            ])
        ]),
        // Affichage conditionnel selon le mode de groupement
        groupBy ?
            React.createElement(window.GroupedTableView, {
                key: 'grouped-table',
                data: users,
                columns: columns,
                title: getTitle(),
                subtitle: getSubtitle(),
                loading: loading,
                onAdd: handleAdd,
                onEdit: handleEdit,
                onDelete: handleDelete,
                onRowClick: onRowClick,
                groupBy: groupBy,
                expandAll: expandAll,
                groupingOptions: ['service', 'fonction'],
                onGroupChange: setGroupBy,
                onExpandChange: setExpandAll,
                entityType: 'collaborateur',
                customGroupOrder: groupBy === 'service' ? customServiceOrder : null,
                getDefaultExpandState: getDefaultExpandState,
                customActions: [
                    {
                        label: 'Importer CSV',
                        icon: 'upload',
                        onClick: () => document.getElementById('csv-import-input').click(),
                        variant: 'secondary',
                        disabled: isImporting
                    }
                ]
            }) :
            React.createElement(window.TableView, {
                key: 'table',
                data: users,
                columns: columns,
                title: getTitle(),
                subtitle: getSubtitle(),
                loading: loading,
                onAdd: handleAdd,
                onEdit: handleEdit,
                onDelete: handleDelete,
                onRowClick: onRowClick,
                groupBy: groupBy,
                expandAll: expandAll,
                groupingOptions: ['service', 'fonction'],
                onGroupChange: setGroupBy,
                onExpandChange: setExpandAll,
                customActions: [
                    {
                        label: 'Importer CSV',
                        icon: 'upload',
                        onClick: () => document.getElementById('csv-import-input').click(),
                        variant: 'secondary',
                        disabled: isImporting
                    }
                ]
            }),
        
        showModal && React.createElement(window.UserModal, {
            key: 'modal',
            item: editingItem,
            defaultEntrepriseId: null, // Pas de pré-sélection d'entreprise
            onSubmit: handleSubmit,
            onClose: () => {
                setShowModal(false);
                setEditingItem(null);
            }
        })
    ]);
}

// Composant AvatarCell pour gérer l'affichage des avatars
function AvatarCell({ avatarUrl, prenom, nom }) {
    const { useState } = React;
    const [imageError, setImageError] = useState(false);
    
    const initials = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
    
    if (!avatarUrl || imageError) {
        // Fallback avec initiales
        return React.createElement('div', {
            className: 'w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium'
        }, initials || '?');
    }
    
    return React.createElement('img', {
        src: avatarUrl,
        alt: `Avatar de ${prenom} ${nom}`,
        className: 'w-8 h-8 rounded-full object-cover',
        onError: () => setImageError(true)
    });
}

// Export global
window.CollaborateursPage = CollaborateursPage;