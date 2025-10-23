// Helpers pour le layout et les sections communes des PDF
(function() {
    'use strict';

    const { addImageToPdf } = window.pdfCore;
    const { hexToRgb } = window.pdfCore;

    /**
     * Rend un header avec image ou texte de secours
     * @param {Object} doc - Instance jsPDF
     * @param {Object} options - Options de configuration
     *   - imageUrl: URL de l'image du header
     *   - x, y, width, height: Dimensions du header
     *   - backgroundColor: Couleur de fond (hex ou RGB array)
     *   - padding: Padding autour de l'image
     *   - fallbackText: Texte de secours si pas d'image
     *   - fallbackCompanyName: Nom de l'entreprise (fallback gauche)
     *   - fallbackBrandName: Nom de la marque (fallback droite)
     * @returns {Promise<Boolean>} - true si l'image a été ajoutée, false sinon
     */
    async function renderHeader(doc, options = {}) {
        const {
            imageUrl = null,
            x = 0,
            y = 0,
            width = 210,
            height = 22,
            backgroundColor = null,
            padding = 0,
            fallbackCompanyName = 'AUTODESK',
            fallbackBrandName = 'ARKANCE'
        } = options;

        // Ajouter le fond si configuré
        if (backgroundColor) {
            const bgColor = hexToRgb(backgroundColor) || backgroundColor;
            if (Array.isArray(bgColor) && bgColor.length === 3) {
                doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
                doc.rect(x, y, width, height, 'F');
            }
        }

        // Calculer les dimensions avec padding
        const imageX = x + padding;
        const imageY = y + padding;
        const imageWidth = width - (2 * padding);
        const imageHeight = height - (2 * padding);

        // Tenter d'ajouter l'image
        if (imageUrl) {
            const imageAdded = await addImageToPdf(
                doc,
                imageUrl,
                imageX,
                imageY,
                imageWidth,
                imageHeight,
                fallbackCompanyName
            );

            if (imageAdded) {
                return true;
            }
        }

        // Fallback texte si pas d'image
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text(fallbackCompanyName, x + 10, y + 12);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(19, 62, 94);
        const brandWidth = doc.getTextWidth(fallbackBrandName);
        doc.text(fallbackBrandName, x + width - 10 - brandWidth, y + 12);

        return false;
    }

    /**
     * Rend un footer avec image ou texte de secours
     * @param {Object} doc - Instance jsPDF
     * @param {Object} options - Options de configuration
     *   - imageUrl: URL de l'image du footer
     *   - x, y, width, height: Dimensions du footer
     *   - backgroundColor: Couleur de fond (hex ou RGB array)
     *   - padding: Padding autour de l'image
     *   - fallbackAddress: Adresse de l'entreprise (ligne 1)
     *   - fallbackContact: Contact de l'entreprise (ligne 2)
     * @returns {Promise<Boolean>} - true si l'image a été ajoutée, false sinon
     */
    async function renderFooter(doc, options = {}) {
        const {
            imageUrl = null,
            x = 0,
            y = 260,
            width = 210,
            height = 37,
            backgroundColor = null,
            padding = 0,
            fallbackAddress = 'LE VAL SAINT QUENTIN - Bâtiment C - 2, rue René Caudron - CS 30764 - 78961 Voisins-le-Bretonneux Cedex',
            fallbackContact = 'www.arkance-systems.fr - formation@arkance-systems.com - Tél. : 01 39 44 18 18'
        } = options;

        // Ajouter le fond si configuré
        if (backgroundColor) {
            const bgColor = hexToRgb(backgroundColor) || backgroundColor;
            if (Array.isArray(bgColor) && bgColor.length === 3) {
                doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
                doc.rect(x, y, width, height, 'F');
            }
        }

        // Calculer les dimensions avec padding
        const imageX = x + padding;
        const imageY = y + padding;
        const imageWidth = width - (2 * padding);
        const imageHeight = height - (2 * padding);

        // Tenter d'ajouter l'image
        if (imageUrl) {
            const imageAdded = await addImageToPdf(
                doc,
                imageUrl,
                imageX,
                imageY,
                imageWidth,
                imageHeight
            );

            if (imageAdded) {
                return true;
            }
        }

        // Fallback texte si pas d'image
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);

        const footerY = y + 15;
        const footerLines = [fallbackAddress, fallbackContact];

        let textY = footerY;
        for (const line of footerLines) {
            if (line) {
                const lineWidth = doc.getTextWidth(line);
                doc.text(line, (width - lineWidth) / 2, textY);
                textY += 4;
            }
        }

        return false;
    }

    /**
     * Rend un rectangle avec fond coloré
     * @param {Object} doc - Instance jsPDF
     * @param {Number} x - Position X
     * @param {Number} y - Position Y
     * @param {Number} width - Largeur
     * @param {Number} height - Hauteur
     * @param {String|Array} color - Couleur (hex ou RGB array)
     * @param {Number} opacity - Opacité (0-1)
     */
    function renderBackground(doc, x, y, width, height, color, opacity = 1) {
        const rgbColor = hexToRgb(color) || color;

        if (Array.isArray(rgbColor) && rgbColor.length === 3) {
            doc.setFillColor(rgbColor[0], rgbColor[1], rgbColor[2]);
            if (opacity < 1) {
                doc.saveGraphicsState();
                doc.setGState(new doc.GState({ opacity: opacity }));
            }
            doc.rect(x, y, width, height, 'F');
            if (opacity < 1) {
                doc.restoreGraphicsState();
            }
        }
    }

    /**
     * Rend une bordure
     * @param {Object} doc - Instance jsPDF
     * @param {Number} x - Position X
     * @param {Number} y - Position Y
     * @param {Number} width - Largeur
     * @param {Number} height - Hauteur
     * @param {String|Array} color - Couleur (hex ou RGB array)
     * @param {Number} lineWidth - Épaisseur de la ligne (défaut: 0.5mm)
     */
    function renderBorder(doc, x, y, width, height, color = [0, 0, 0], lineWidth = 0.5) {
        const rgbColor = hexToRgb(color) || color;

        if (Array.isArray(rgbColor) && rgbColor.length === 3) {
            doc.setDrawColor(rgbColor[0], rgbColor[1], rgbColor[2]);
            doc.setLineWidth(lineWidth);
            doc.rect(x, y, width, height);
        }
    }

    /**
     * Rend une ligne de séparation horizontale
     * @param {Object} doc - Instance jsPDF
     * @param {Number} x1 - Position X de départ
     * @param {Number} y - Position Y
     * @param {Number} x2 - Position X de fin
     * @param {String|Array} color - Couleur (hex ou RGB array)
     * @param {Number} lineWidth - Épaisseur de la ligne (défaut: 0.5mm)
     */
    function renderHorizontalLine(doc, x1, y, x2, color = [0, 0, 0], lineWidth = 0.5) {
        const rgbColor = hexToRgb(color) || color;

        if (Array.isArray(rgbColor) && rgbColor.length === 3) {
            doc.setDrawColor(rgbColor[0], rgbColor[1], rgbColor[2]);
            doc.setLineWidth(lineWidth);
            doc.line(x1, y, x2, y);
        }
    }

    /**
     * Rend une ligne de séparation verticale
     * @param {Object} doc - Instance jsPDF
     * @param {Number} x - Position X
     * @param {Number} y1 - Position Y de départ
     * @param {Number} y2 - Position Y de fin
     * @param {String|Array} color - Couleur (hex ou RGB array)
     * @param {Number} lineWidth - Épaisseur de la ligne (défaut: 0.5mm)
     */
    function renderVerticalLine(doc, x, y1, y2, color = [0, 0, 0], lineWidth = 0.5) {
        const rgbColor = hexToRgb(color) || color;

        if (Array.isArray(rgbColor) && rgbColor.length === 3) {
            doc.setDrawColor(rgbColor[0], rgbColor[1], rgbColor[2]);
            doc.setLineWidth(lineWidth);
            doc.line(x, y1, x, y2);
        }
    }

    /**
     * Applique des marges à une section
     * @param {Object} section - Section avec { x, y, width, height }
     * @param {Number|Object} margin - Marge uniforme ou { top, right, bottom, left }
     * @returns {Object} - Section avec marges appliquées { x, y, width, height }
     */
    function applyMargins(section, margin) {
        if (typeof margin === 'number') {
            return {
                x: section.x + margin,
                y: section.y + margin,
                width: section.width - (2 * margin),
                height: section.height - (2 * margin)
            };
        }

        const { top = 0, right = 0, bottom = 0, left = 0 } = margin;
        return {
            x: section.x + left,
            y: section.y + top,
            width: section.width - left - right,
            height: section.height - top - bottom
        };
    }

    // Exposer les utilitaires
    window.pdfLayout = {
        renderHeader,
        renderFooter,
        renderBackground,
        renderBorder,
        renderHorizontalLine,
        renderVerticalLine,
        applyMargins
    };

    console.log('✅ [pdfLayout] Module chargé et exposé via window.pdfLayout');
})();
