// Helpers pour le rendu de texte dans les PDF
(function() {
    'use strict';

    /**
     * Rend du texte centré horizontalement
     * @param {Object} doc - Instance jsPDF
     * @param {String} text - Texte à centrer
     * @param {Number} y - Position Y
     * @param {Number} pageWidth - Largeur de la page (défaut: 210mm pour A4)
     */
    function renderCenteredText(doc, text, y, pageWidth = 210) {
        const textWidth = doc.getTextWidth(text);
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
    }

    /**
     * Rend du texte aligné à droite
     * @param {Object} doc - Instance jsPDF
     * @param {String} text - Texte à aligner
     * @param {Number} y - Position Y
     * @param {Number} rightMargin - Marge droite (défaut: 10mm)
     * @param {Number} pageWidth - Largeur de la page (défaut: 210mm pour A4)
     */
    function renderRightAlignedText(doc, text, y, rightMargin = 10, pageWidth = 210) {
        const textWidth = doc.getTextWidth(text);
        const x = pageWidth - rightMargin - textWidth;
        doc.text(text, x, y);
    }

    /**
     * Rend du texte multi-ligne avec retour automatique
     * @param {Object} doc - Instance jsPDF
     * @param {String} text - Texte à rendre
     * @param {Number} x - Position X
     * @param {Number} y - Position Y
     * @param {Number} maxWidth - Largeur maximale
     * @param {Number} lineHeight - Hauteur de ligne (défaut: 4mm)
     * @returns {Number} - Nouvelle position Y après le texte
     */
    function renderMultilineText(doc, text, x, y, maxWidth, lineHeight = 4) {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * lineHeight);
    }

    /**
     * Rend une paire clé-valeur (label: value)
     * @param {Object} doc - Instance jsPDF
     * @param {String} label - Label (clé)
     * @param {String} value - Valeur
     * @param {Number} labelX - Position X du label
     * @param {Number} valueX - Position X de la valeur
     * @param {Number} y - Position Y
     * @param {Object} styles - Styles personnalisés { labelSize, valueSize, labelColor, valueColor, labelFont, valueFont }
     * @returns {Object} - { labelWidth, valueWidth }
     */
    function renderKeyValue(doc, label, value, labelX, valueX, y, styles = {}) {
        // Styles par défaut
        const {
            labelSize = 8,
            valueSize = 8,
            labelColor = [19, 62, 94],
            valueColor = [55, 65, 81],
            labelFont = 'bold',
            valueFont = 'normal'
        } = styles;

        // Rendre le label
        doc.setFontSize(labelSize);
        doc.setFont('helvetica', labelFont);
        doc.setTextColor(...labelColor);
        doc.text(label, labelX, y);
        const labelWidth = doc.getTextWidth(label);

        // Rendre la valeur
        doc.setFontSize(valueSize);
        doc.setFont('helvetica', valueFont);
        doc.setTextColor(...valueColor);
        doc.text(value, valueX, y);
        const valueWidth = doc.getTextWidth(value);

        return { labelWidth, valueWidth };
    }

    /**
     * Rend du texte avec soulignement
     * @param {Object} doc - Instance jsPDF
     * @param {String} text - Texte à souligner
     * @param {Number} x - Position X
     * @param {Number} y - Position Y
     * @param {Number} offsetY - Offset Y pour la ligne (défaut: 0.5mm)
     */
    function renderUnderlinedText(doc, text, x, y, offsetY = 0.5) {
        doc.text(text, x, y);
        const textWidth = doc.getTextWidth(text);
        doc.line(x, y + offsetY, x + textWidth, y + offsetY);
    }

    /**
     * Calcule la hauteur nécessaire pour un texte multi-ligne
     * @param {Object} doc - Instance jsPDF
     * @param {String} text - Texte à mesurer
     * @param {Number} maxWidth - Largeur maximale
     * @param {Number} lineHeight - Hauteur de ligne (défaut: 4mm)
     * @returns {Number} - Hauteur totale nécessaire
     */
    function calculateTextHeight(doc, text, maxWidth, lineHeight = 4) {
        const lines = doc.splitTextToSize(text, maxWidth);
        return lines.length * lineHeight;
    }

    /**
     * Rend du texte avec ellipse si trop long
     * @param {Object} doc - Instance jsPDF
     * @param {String} text - Texte à rendre
     * @param {Number} x - Position X
     * @param {Number} y - Position Y
     * @param {Number} maxWidth - Largeur maximale
     * @returns {String} - Texte tronqué (avec '...' si nécessaire)
     */
    function renderTruncatedText(doc, text, x, y, maxWidth) {
        let displayText = text;
        let textWidth = doc.getTextWidth(displayText);

        if (textWidth > maxWidth) {
            // Trouver la longueur maximale avec ellipse
            while (textWidth > maxWidth && displayText.length > 0) {
                displayText = displayText.slice(0, -1);
                textWidth = doc.getTextWidth(displayText + '...');
            }
            displayText += '...';
        }

        doc.text(displayText, x, y);
        return displayText;
    }

    /**
     * Obtient la hauteur de ligne actuelle
     * @param {Object} doc - Instance jsPDF
     * @returns {Number} - Hauteur de ligne en mm
     */
    function getLineHeight(doc) {
        return doc.getLineHeight() / doc.internal.scaleFactor;
    }

    // Exposer les utilitaires
    window.pdfText = {
        renderCenteredText,
        renderRightAlignedText,
        renderMultilineText,
        renderKeyValue,
        renderUnderlinedText,
        calculateTextHeight,
        renderTruncatedText,
        getLineHeight
    };

    console.log('✅ [pdfText] Module chargé et exposé via window.pdfText');
})();
