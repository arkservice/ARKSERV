// Modal pour sélectionner ou uploader des images partagées depuis Supabase Storage
function ImageSelectorModal({ imageType, onSelect, onClose }) {
    const { useState, useEffect } = React;

    // États
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [error, setError] = useState(null);

    // Hook pour gérer les templates et images
    const { listImagesFromStorage, uploadImage } = window.useTemplates();

    // Charger les images au montage du composant
    useEffect(() => {
        loadImages();
    }, [imageType]);

    // Fonction pour charger les images depuis Supabase Storage
    const loadImages = async () => {
        setLoading(true);
        setError(null);

        try {
            const imagesList = await listImagesFromStorage(imageType);
            setImages(imagesList);
        } catch (err) {
            console.error('Erreur chargement images:', err);
            setError('Impossible de charger les images. Vérifiez votre connexion.');
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour gérer l'upload d'une nouvelle image (partagée entre tous les templates)
    const handleUploadNewImage = async (file) => {
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const url = await uploadImage(file, imageType);

            // Recharger la liste des images
            await loadImages();

            // Sélectionner automatiquement la nouvelle image
            setSelectedImage(url);
        } catch (err) {
            console.error('Erreur upload image:', err);
            setError(`Erreur lors de l'upload: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    // Fonction pour gérer la sélection d'une image
    const handleSelectImage = () => {
        if (selectedImage) {
            onSelect(selectedImage);
            onClose();
        }
    };

    // Normaliser le type d'image pour l'affichage
    const getImageTypeLabel = () => {
        if (imageType === 'header_image' || imageType === 'header') return 'en-tête';
        if (imageType === 'footer_image' || imageType === 'footer') return 'pied de page';
        return imageType;
    };

    return React.createElement('div', {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay",
        onClick: (e) => {
            // Fermer si on clique sur l'overlay
            if (e.target.classList.contains('modal-overlay')) {
                onClose();
            }
        }
    }, React.createElement('div', {
        className: "bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
    }, [
        // Header
        React.createElement('div', {
            key: 'header',
            className: "px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between"
        }, [
            React.createElement('h2', {
                key: 'title',
                className: "text-lg font-semibold text-gray-900"
            }, `Sélectionner une image ${getImageTypeLabel()}`),
            React.createElement('button', {
                key: 'close',
                onClick: onClose,
                className: "text-gray-400 hover:text-gray-600 transition-colors"
            }, React.createElement('i', { 'data-lucide': 'x', className: 'w-5 h-5' }))
        ]),

        // Message d'erreur
        error && React.createElement('div', {
            key: 'error',
            className: "mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
        }, error),

        // Contenu principal
        React.createElement('div', {
            key: 'content',
            className: "flex-1 overflow-y-auto p-6"
        }, [
            // Section upload
            React.createElement('div', {
                key: 'upload-section',
                className: "mb-6"
            }, [
                React.createElement('label', {
                    key: 'upload-label',
                    className: "block mb-2 text-sm font-medium text-gray-700"
                }, 'Ajouter une nouvelle image'),
                React.createElement('div', {
                    key: 'upload-input',
                    className: "relative"
                }, [
                    React.createElement('input', {
                        key: 'file-input',
                        type: 'file',
                        accept: 'image/*',
                        onChange: (e) => handleUploadNewImage(e.target.files[0]),
                        disabled: uploading,
                        className: 'hidden',
                        id: 'image-upload-input'
                    }),
                    React.createElement('label', {
                        key: 'file-label',
                        htmlFor: 'image-upload-input',
                        className: `flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                            uploading
                                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                                : 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400'
                        }`
                    }, [
                        uploading
                            ? React.createElement('div', {
                                key: 'spinner',
                                className: 'animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600'
                            })
                            : React.createElement('i', {
                                key: 'icon',
                                'data-lucide': 'plus-circle',
                                className: 'w-5 h-5 text-blue-600'
                            }),
                        React.createElement('span', {
                            key: 'text',
                            className: 'text-sm font-medium text-blue-700'
                        }, uploading ? 'Upload en cours...' : 'Cliquez pour ajouter une nouvelle image')
                    ])
                ])
            ]),

            // Séparateur
            React.createElement('div', {
                key: 'separator',
                className: "relative mb-6"
            }, [
                React.createElement('div', {
                    key: 'line',
                    className: "absolute inset-0 flex items-center"
                }, React.createElement('div', { className: 'w-full border-t border-gray-300' })),
                React.createElement('div', {
                    key: 'text',
                    className: "relative flex justify-center text-sm"
                }, React.createElement('span', {
                    className: 'px-2 bg-white text-gray-500'
                }, 'ou sélectionnez une image existante'))
            ]),

            // Grille d'images
            loading
                ? React.createElement('div', {
                    key: 'loading',
                    className: "flex items-center justify-center py-12"
                }, [
                    React.createElement('div', {
                        key: 'spinner',
                        className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'
                    }),
                    React.createElement('span', {
                        key: 'text',
                        className: 'ml-3 text-gray-600'
                    }, 'Chargement des images...')
                ])
                : images.length === 0
                ? React.createElement('div', {
                    key: 'empty',
                    className: "text-center py-12 text-gray-500"
                }, [
                    React.createElement('i', {
                        key: 'icon',
                        'data-lucide': 'image-off',
                        className: 'w-12 h-12 mx-auto mb-3 text-gray-400'
                    }),
                    React.createElement('p', {
                        key: 'text'
                    }, `Aucune image ${getImageTypeLabel()} disponible`)
                ])
                : React.createElement('div', {
                    key: 'grid',
                    className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                }, images.map((image, index) =>
                    React.createElement('div', {
                        key: image.path || index,
                        onClick: () => setSelectedImage(image.url),
                        className: `relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImage === image.url
                                ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`
                    }, [
                        React.createElement('div', {
                            key: 'image-container',
                            className: "aspect-square bg-gray-100 flex items-center justify-center"
                        }, React.createElement('img', {
                            src: image.url,
                            alt: image.name,
                            className: 'w-full h-full object-contain',
                            onError: (e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3EErreur%3C/text%3E%3C/svg%3E';
                            }
                        })),
                        selectedImage === image.url && React.createElement('div', {
                            key: 'check',
                            className: "absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1"
                        }, React.createElement('i', { 'data-lucide': 'check', className: 'w-4 h-4' })),
                        React.createElement('div', {
                            key: 'name',
                            className: "p-2 bg-white bg-opacity-90 text-xs text-gray-700 truncate"
                        }, image.name)
                    ])
                ))
        ]),

        // Footer avec boutons
        React.createElement('div', {
            key: 'footer',
            className: "px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3"
        }, [
            React.createElement('button', {
                key: 'cancel',
                type: 'button',
                onClick: onClose,
                className: "px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            }, 'Annuler'),
            React.createElement('button', {
                key: 'submit',
                type: 'button',
                onClick: handleSelectImage,
                disabled: !selectedImage,
                className: `px-4 py-2 rounded-lg transition-colors ${
                    selectedImage
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`
            }, 'Valider')
        ])
    ]));
}

// Export global
window.ImageSelectorModal = ImageSelectorModal;
