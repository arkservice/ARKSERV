// Page Plans de cours
function PdcPage({ onRowClick, selectionMode = false, onPdcSelected, onBack, breadcrumbBase, breadcrumbCurrent }) {
    const { useState, useEffect } = React;
    const { pdcs, loading, error, createPdc, updatePdc, deletePdc, getPdcById } = window.usePdc();
    const { loadTemplateByType } = window.useTemplates();
    const supabase = window.supabaseConfig.client;
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [generatingAllPdfs, setGeneratingAllPdfs] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentPdcName: '' });
    
    const columns = [
        { key: 'pdc_number', label: 'N° PDC', type: 'text', sortable: true },
        {
            key: 'logiciel',
            label: 'Logiciel',
            type: 'text',
            sortable: true,
            render: (value, item) => {
                const logo = item.logiciel?.logo;
                const nom = item.logiciel?.nom || '-';

                if (!logo) {
                    // Aligner avec les noms qui ont un logo (32px logo + 20px gap = 52px)
                    return React.createElement('span', {
                        className: 'ml-[52px]'
                    }, nom);
                }

                return React.createElement('div', {
                    className: 'flex items-center gap-5'
                }, [
                    React.createElement('img', {
                        key: 'logo-img',
                        src: logo,
                        alt: nom,
                        className: 'w-8 h-8 object-cover rounded',
                        onError: (e) => {
                            e.target.style.display = 'none';
                        }
                    }),
                    React.createElement('span', {
                        key: 'nom',
                        className: 'font-medium text-gray-900'
                    }, nom)
                ]);
            }
        },
        {
            key: 'duree_en_jour',
            label: 'Durée',
            type: 'text',
            sortable: true,
            render: (value, item) => {
                if (!value) return '-';
                const suffix = value <= 1 ? 'jour' : 'jours';
                return React.createElement('span', {}, [
                    React.createElement('span', {
                        key: 'number',
                        className: 'font-bold'
                    }, value),
                    ' ',
                    React.createElement('span', {
                        key: 'suffix',
                        className: 'text-xs'
                    }, suffix)
                ]);
            }
        },
        {
            key: 'metier_pdc.nom',
            label: 'Nom métier PDC',
            type: 'text',
            sortable: true,
            render: (value, item) => item.metier_pdc?.nom || '-'
        },
        {
            key: 'type_pdc.nom',
            label: 'Type',
            type: 'text',
            sortable: true,
            render: (value, item) => item.type_pdc?.nom || '-'
        },
        {
            key: 'catalogue',
            label: 'Catalogue',
            type: 'text',
            sortable: true,
            render: (value, item) => {
                const catalogue = item.catalogue || '-';

                if (catalogue === '-') {
                    return React.createElement('span', {
                        className: 'text-gray-400'
                    }, '-');
                }

                const isSpecifique = catalogue.toLowerCase() === 'spécifique';
                const badgeClasses = isSpecifique
                    ? 'px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700'
                    : 'px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700';

                return React.createElement('span', {
                    className: badgeClasses
                }, catalogue);
            }
        },
        {
            key: 'pdf_file_url',
            label: 'PDF',
            type: 'text',
            sortable: true,
            render: (value, item) => {
                const hasPdf = item.pdf_file_url && item.pdf_file_url.trim() !== '';
                
                return React.createElement('div', {
                    className: 'flex items-center justify-center'
                }, [
                    React.createElement('button', {
                        key: 'pdf-button',
                        onClick: (e) => {
                            e.stopPropagation(); // Empêcher le clic sur la ligne
                            if (hasPdf) {
                                window.open(item.pdf_file_url, '_blank');
                            }
                        },
                        disabled: !hasPdf,
                        className: `p-1 rounded transition-colors ${
                            hasPdf 
                                ? 'text-green-600 hover:text-green-800 hover:bg-green-50 cursor-pointer' 
                                : 'text-gray-300 cursor-not-allowed'
                        }`,
                        title: hasPdf ? 'Cliquer pour ouvrir le PDF' : 'Aucun PDF généré'
                    }, React.createElement('i', {
                        key: 'pdf-icon',
                        'data-lucide': 'file-text',
                        className: 'w-5 h-5'
                    }))
                ]);
            }
        }
    ];
    
    // Ajouter la colonne de sélection si on est en mode sélection
    if (selectionMode) {
        columns.push({
            key: 'select_action',
            label: 'Action',
            type: 'action',
            render: (value, item) => {
                return React.createElement('button', {
                    onClick: (e) => {
                        e.stopPropagation();
                        onPdcSelected && onPdcSelected(item);
                    },
                    className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                }, "Sélectionner");
            }
        });
    }
    
    // Initialiser les icônes Lucide
    useEffect(() => {
        lucide.createIcons();
    }, [showModal, pdcs, loading, generatingAllPdfs, batchProgress]);
    
    const handleAdd = () => {
        setEditingItem(null);
        setShowModal(true);
    };
    
    const handleEdit = (item) => {
        setEditingItem(item);
        setShowModal(true);
    };
    
    const handleDelete = async (item) => {
        const itemName = item.ref || item.pdc_number || `PDC #${item.id}`;
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le plan de cours "${itemName}" ?`)) {
            try {
                await deletePdc(item.id);
            } catch (error) {
                console.error('Erreur:', error);
            }
        }
    };
    
    const handleSubmit = async (formData) => {
        try {
            if (editingItem) {
                await updatePdc(editingItem.id, formData);
            } else {
                await createPdc(formData);
            }
            setShowModal(false);
            setEditingItem(null);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    // Fonction pour générer tous les PDFs
    const handleGenerateAllPdfs = async () => {
        if (!pdcs || pdcs.length === 0) {
            alert('Aucun plan de cours à générer');
            return;
        }

        const confirmGenerate = window.confirm(
            `Voulez-vous générer les PDF pour tous les ${pdcs.length} plans de cours ?\n\n` +
            'Cette opération peut prendre plusieurs minutes.'
        );

        if (!confirmGenerate) return;

        try {
            setGeneratingAllPdfs(true);
            setBatchProgress({ current: 0, total: pdcs.length, currentPdcName: '' });

            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (let i = 0; i < pdcs.length; i++) {
                const pdc = pdcs[i];
                const pdcName = pdc.ref || pdc.pdc_number || `PDC #${pdc.id}`;

                setBatchProgress({ current: i + 1, total: pdcs.length, currentPdcName: pdcName });

                try {
                    // Récupérer les données complètes du PDC
                    const fullPdc = await getPdcById(pdc.id);

                    // Vérifier que le générateur PDF est disponible
                    if (!window.generatePDFWithJsPDF) {
                        throw new Error('Le générateur PDF n\'est pas disponible');
                    }

                    // Charger le template
                    const template = await loadTemplateByType('pdc');
                    if (!template) {
                        throw new Error('Template PDC non trouvé');
                    }

                    // Fonction helper pour obtenir l'URL d'une image
                    const getImageUrl = (imageUrl) => {
                        if (!imageUrl) return null;
                        return imageUrl;
                    };

                    // Convertir le template en paramètres PDF
                    const pdfParams = {
                        titleSize: template.styles?.titleSize || 28,
                        subtitleSize: template.styles?.subtitleSize || 16,
                        textSize: template.styles?.textSize || 8,
                        labelSize: template.styles?.labelSize || 8,
                        descriptionSize: template.styles?.descriptionSize || 7,
                        headerSize: template.styles?.headerSize || 24,
                        footerSize: template.styles?.footerSize || 9,
                        articleSize: template.styles?.articleSize || 11,
                        primaryColor: template.colors?.primary || '#133e5e',
                        secondaryColor: template.colors?.secondary || '#2563eb',
                        grayColor: template.colors?.text || '#374151',
                        lightGrayColor: template.colors?.lightText || '#6b7280',
                        headerTextColor: template.colors?.headerText || '#1f2937',
                        backgroundColor: template.colors?.background || '#f9fafb',
                        borderColor: template.colors?.border || '#e5e7eb',
                        marginTop: template.spacing?.marginTop || 20,
                        marginSide: template.spacing?.marginSide || 20,
                        marginBottom: template.spacing?.marginBottom || 30,
                        headerHeight: template.spacing?.headerHeight || 35,
                        footerHeight: template.spacing?.footerHeight || 40,
                        sectionSpacing: template.spacing?.sectionSpacing || 15,
                        lineSpacing: template.spacing?.lineSpacing || 5,
                        columnSpacing: template.spacing?.columnSpacing || 5,
                        blockPadding: template.spacing?.blockPadding || 10,
                        pageFormat: template.layout?.pageFormat || 'a4',
                        orientation: template.layout?.orientation || 'portrait',
                        columns: template.layout?.columns || 3,
                        showHeader: template.layout?.showHeader !== false,
                        showFooter: template.layout?.showFooter !== false,
                        showLogos: template.layout?.showLogos !== false,
                        backgroundBlocks: template.layout?.backgroundBlocks !== false,
                        companyName: template.branding?.companyName || 'AUTODESK',
                        partnerText: template.branding?.partnerText || 'Platinum Partner',
                        brandName: template.branding?.brandName || 'ARKANCE',
                        footerAddress: template.branding?.footerAddress || 'LE VAL SAINT QUENTIN - Bâtiment C - 2, rue René Caudron - CS 30764 - 78961 Voisins-le-Bretonneux Cedex',
                        footerContact: template.branding?.footerContact || 'www.arkance-systems.fr - formation@arkance-systems.com - Tél. : 01 39 44 18 18',
                        headerLogoLeft: getImageUrl(template.header_image),
                        headerLogoRight: null,
                        footerLogoLeft: getImageUrl(template.footer_image),
                        footerLogoRight: null
                    };

                    // Supprimer l'ancien PDF s'il existe
                    if (fullPdc.pdf_file_url) {
                        try {
                            const urlParts = fullPdc.pdf_file_url.split('/');
                            const oldFileName = urlParts[urlParts.length - 1];
                            await supabase.storage.from('avatars').remove([oldFileName]);
                        } catch (cleanupError) {
                            console.warn('Erreur lors de la suppression de l\'ancien PDF:', cleanupError);
                        }
                    }

                    // Générer le PDF
                    const pdfBlob = await window.generatePDFWithJsPDF(fullPdc, pdfParams);

                    // Upload du PDF vers Supabase Storage
                    const fileName = `pdc_${fullPdc.id}_${Date.now()}.pdf`;
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(fileName, pdfBlob, {
                            contentType: 'application/pdf',
                            cacheControl: '3600',
                            upsert: true
                        });

                    if (uploadError) {
                        throw new Error(`Erreur upload: ${uploadError.message}`);
                    }

                    // Obtenir l'URL publique du PDF
                    const { data: publicUrlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName);

                    const publicPdfUrl = publicUrlData.publicUrl;

                    // Mettre à jour la base de données
                    await updatePdc(fullPdc.id, {
                        pdf_file_url: publicPdfUrl,
                        pdf_generated_at: new Date().toISOString()
                    });

                    successCount++;
                } catch (error) {
                    console.error(`Erreur lors de la génération du PDF pour ${pdcName}:`, error);
                    errorCount++;
                    errors.push({ name: pdcName, error: error.message });
                }
            }

            // Afficher le récapitulatif
            let message = `Génération terminée !\n\n`;
            message += `✅ ${successCount} PDF générés avec succès\n`;
            if (errorCount > 0) {
                message += `❌ ${errorCount} erreurs\n\n`;
                if (errors.length > 0) {
                    message += `Détails des erreurs :\n`;
                    errors.forEach(err => {
                        message += `- ${err.name}: ${err.error}\n`;
                    });
                }
            }

            alert(message);

        } catch (error) {
            console.error('Erreur lors de la génération batch:', error);
            alert('Erreur lors de la génération des PDF: ' + error.message);
        } finally {
            setGeneratingAllPdfs(false);
            setBatchProgress({ current: 0, total: 0, currentPdcName: '' });
        }
    };

    // Fonction pour formater l'affichage des cellules
    const formatCell = (value, key) => {
        return value;
    };
    
    if (error) {
        return React.createElement('div', {
            className: "bg-white rounded-lg border border-gray-200 p-8"
        }, [
            React.createElement('div', {
                key: 'error-content',
                className: "text-center"
            }, [
                React.createElement('i', {
                    key: 'error-icon',
                    'data-lucide': 'alert-circle',
                    className: "w-12 h-12 text-red-500 mx-auto mb-4"
                }),
                React.createElement('h3', {
                    key: 'error-title',
                    className: "text-lg font-semibold text-gray-900 mb-2"
                }, "Erreur de chargement"),
                React.createElement('p', {
                    key: 'error-message',
                    className: "text-gray-600 mb-4"
                }, error),
                React.createElement('button', {
                    key: 'retry-button',
                    onClick: () => window.location.reload(),
                    className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                }, "Réessayer")
            ])
        ]);
    }
    
    return React.createElement('div', {
        className: "bg-white rounded-lg border border-gray-200"
    }, [
        React.createElement('div', {
            key: 'header',
            className: "px-6 py-4 border-b border-gray-200"
        }, [
            // Afficher DetailPageHeader uniquement en mode selection
            (() => {
                console.log('🔍 [PdcPage] Debug header conditions:');
                console.log('  - selectionMode:', selectionMode);
                console.log('  - onBack:', !!onBack);
                console.log('  - window.DetailPageHeader:', !!window.DetailPageHeader);
                
                if (selectionMode && onBack && window.DetailPageHeader) {
                    console.log('✅ [PdcPage] Rendu du DetailPageHeader');
                    return React.createElement(window.DetailPageHeader, {
                        onBack: onBack,
                        breadcrumbBase: breadcrumbBase || "Tâches",
                        breadcrumbCurrent: breadcrumbCurrent || "Choisir un plan de cours"
                    });
                } else {
                    console.log('❌ [PdcPage] Conditions non remplies pour le header');
                    return null;
                }
            })(),
            React.createElement('div', {
                key: 'header-content',
                className: selectionMode ? "mt-4" : "flex justify-between items-center"
            }, [
                React.createElement('div', { key: 'title-section' }, [
                    React.createElement('h1', {
                        key: 'title',
                        className: "text-2xl font-bold text-gray-900"
                    }, selectionMode ? "Choisir un plan de cours" : "Plans de cours"),
                    React.createElement('p', {
                        key: 'subtitle',
                        className: "text-gray-600 mt-1"
                    }, selectionMode ? "Sélectionnez le programme qui correspond à vos besoins" : "Gérez vos programmes de formation")
                ]),
                !selectionMode && React.createElement('div', {
                    key: 'actions',
                    className: "flex items-center gap-2"
                }, [
                    React.createElement('button', {
                        key: 'generate-all-pdfs-button',
                        onClick: handleGenerateAllPdfs,
                        disabled: generatingAllPdfs || loading,
                        className: `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            generatingAllPdfs || loading
                                ? 'bg-green-400 text-white cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                        }`
                    }, [
                        React.createElement('i', {
                            key: 'pdf-icon',
                            'data-lucide': generatingAllPdfs ? 'loader-2' : 'file-text',
                            className: `w-4 h-4 ${generatingAllPdfs ? 'animate-spin' : ''}`
                        }),
                        generatingAllPdfs
                            ? `Génération... (${batchProgress.current}/${batchProgress.total})`
                            : "Générer tous les PDF"
                    ]),
                    React.createElement('button', {
                        key: 'add-button',
                        onClick: handleAdd,
                        disabled: generatingAllPdfs,
                        className: `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            generatingAllPdfs
                                ? 'bg-blue-400 text-white cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`
                    }, [
                        React.createElement('i', {
                            key: 'add-icon',
                            'data-lucide': 'plus',
                            className: "w-4 h-4"
                        }),
                        "Nouveau plan de cours"
                    ])
                ])
            ])
        ]),
        
        React.createElement('div', {
            key: 'content',
            className: "p-6"
        }, React.createElement(window.TableView, {
            data: pdcs,
            columns: columns,
            loading: loading,
            onRowClick: selectionMode ? null : onRowClick,
            onEdit: selectionMode ? null : handleEdit,
            onDelete: selectionMode ? null : handleDelete,
            formatCell: formatCell,
            emptyMessage: "Aucun plan de cours trouvé",
            emptyDescription: selectionMode ? "Aucun programme disponible pour le moment" : "Commencez par créer votre premier plan de cours",
            itemLabel: 'PDC',
            itemLabelPlural: 'PDC',
            columnFilters: {
                'pdc_number': 'input',
                'logiciel': 'input',
                'duree_en_jour': 'input',
                'metier_pdc.nom': 'input',
                'type_pdc.nom': 'input',
                'catalogue': {
                    type: 'dropdown',
                    options: [
                        { value: 'spécifique', label: 'Spécifique' },
                        { value: 'catalogue', label: 'Catalogue' }
                    ]
                }
            }
        })),
        
        // Modal
        showModal && React.createElement(window.PdcModal, {
            key: 'modal',
            item: editingItem,
            onSubmit: handleSubmit,
            onClose: () => {
                setShowModal(false);
                setEditingItem(null);
            }
        })
    ]);
}

// Export global
window.PdcPage = PdcPage;